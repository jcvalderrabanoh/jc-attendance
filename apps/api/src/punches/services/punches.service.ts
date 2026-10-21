import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { addDays, dayOfWeek, localDateOf, zonedTimeToUtc } from '@jc-attendance/rules-engine';
import { RecordAuditProcess } from '../../audit/processes';
import { CoreUserContext, EmployeeContext, found, hashSecret, KioskContext, safeEqual, unwrap } from '../../common';
import { EmployeeIdentityDao, EmploymentDao } from '../../employees/daos';
import { LocationDao } from '../../locations/daos';
import { AccountSettingsDao } from '../../organization/daos';
import { PolicyResolverService } from '../../schedules/services';
import { RegisterPunchBluePrint, RegisterPunchInput } from '../blueprints';
import { PunchDao, PunchPhotoDao } from '../daos';
import { KioskPunchDto, ListPunchesQueryDto, ManualPunchDto, RegisterPunchDto, ReviewPunchDto } from '../dtos';
import { PunchReviewStatusEnum, PunchSourceEnum } from '../entities';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PUNCH_CHANGED_EVENT } from '../events';
import { liveWorkedMinutes } from './worked-time.helper';

@Injectable()
export class PunchesService {
  constructor(
    private readonly registerBluePrint: RegisterPunchBluePrint,
    private readonly punchDao: PunchDao,
    private readonly punchPhotoDao: PunchPhotoDao,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly locationDao: LocationDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly policyResolver: PolicyResolverService,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private fromDto(dto: RegisterPunchDto): Omit<RegisterPunchInput, 'accountId' | 'employmentId' | 'source' | 'actor'> {
    return {
      type: dto.type,
      idempotencyKey: dto.idempotencyKey,
      clientAt: new Date(dto.clientAt),
      lat: dto.lat,
      lng: dto.lng,
      accuracyMeters: dto.accuracyMeters,
      qrPayload: dto.qrPayload,
      selfieDataUrl: dto.selfieDataUrl,
      offline: dto.offline,
      customFields: dto.customFields,
    };
  }

  async registerAsEmployee(employee: EmployeeContext, dto: RegisterPunchDto, ip: string | null) {
    if (!employee.accountId || !employee.employmentId) throw new ForbiddenException('Elige primero la empresa para la que checas');
    return unwrap(
      await this.registerBluePrint.execute({
        ...this.fromDto(dto),
        accountId: employee.accountId,
        employmentId: employee.employmentId,
        source: PunchSourceEnum.Pwa,
        actor: employee,
        ip,
      }),
    );
  }

  /** El usuario de jc-core enlazado a un empleo checa con su mismo login (desde core-front). */
  async registerAsCoreUser(user: CoreUserContext, dto: RegisterPunchDto, ip: string | null) {
    const employment = found(await this.employmentDao.findByCoreUser(user.accountId, user.userId), 'Tu usuario no está enlazado a un registro de empleado');
    return unwrap(
      await this.registerBluePrint.execute({
        ...this.fromDto(dto),
        accountId: user.accountId,
        employmentId: employment.id,
        source: PunchSourceEnum.Web,
        actor: user,
        ip,
      }),
    );
  }

  async registerAtKiosk(kiosk: KioskContext, dto: KioskPunchDto) {
    const employment = await this.employmentDao.findByNumberWithPin(kiosk.accountId, dto.employeeNumber);
    if (!employment?.kioskPinHash || !safeEqual(employment.kioskPinHash, hashSecret(`${kiosk.accountId}:${dto.pin}`))) {
      throw new UnauthorizedException('Número de empleado o PIN incorrecto');
    }
    const result = unwrap(
      await this.registerBluePrint.execute({
        accountId: kiosk.accountId,
        employmentId: employment.id,
        source: PunchSourceEnum.Kiosk,
        actor: kiosk,
        type: dto.type,
        idempotencyKey: dto.idempotencyKey,
        clientAt: new Date(dto.clientAt),
        selfieDataUrl: dto.selfieDataUrl,
        kioskDeviceId: kiosk.deviceId,
        kioskLocationId: kiosk.locationId,
      }),
    );
    const identity = await this.identityDao.findById(employment.identityId);
    return { ...result, employeeName: identity ? `${identity.firstName} ${identity.lastName}` : null };
  }

  async manual(user: CoreUserContext, dto: ManualPunchDto) {
    found(await this.employmentDao.findById(user.accountId, dto.employmentId), 'El empleado no existe');
    if (dto.replacesPunchId) found(await this.punchDao.findById(user.accountId, dto.replacesPunchId), 'El marcaje a corregir no existe');
    return unwrap(
      await this.registerBluePrint.execute({
        accountId: user.accountId,
        employmentId: dto.employmentId,
        source: PunchSourceEnum.Manual,
        actor: user,
        type: dto.type,
        idempotencyKey: `manual-${user.userId}-${dto.employmentId}-${dto.type}-${dto.at}`,
        clientAt: new Date(dto.at),
        manual: { at: new Date(dto.at), reason: dto.reason, locationId: dto.locationId, replacesPunchId: dto.replacesPunchId, userId: user.userId },
      }),
    );
  }

  async list(accountId: string, q: ListPunchesQueryDto) {
    const page = await this.punchDao.list(accountId, {
      ...q,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
    const employments = await this.employmentDao.findByIds(accountId, [...new Set(page.items.map((p) => p.employmentId))]);
    const identities = await this.identityDao.findByIds(employments.map((e) => e.identityId));
    const nameOf = new Map(
      employments.map((e) => {
        const i = identities.find((x) => x.id === e.identityId);
        return [e.id, i ? `${i.firstName} ${i.lastName}` : '—'];
      }),
    );
    return { ...page, items: page.items.map((p) => ({ ...p, employeeName: nameOf.get(p.employmentId) ?? '—' })), pendingReview: await this.punchDao.countPendingReview(accountId) };
  }

  async review(user: CoreUserContext, id: string, dto: ReviewPunchDto) {
    const punch = found(await this.punchDao.findById(user.accountId, id), 'El marcaje no existe');
    const status = dto.decision === 'approve' ? PunchReviewStatusEnum.Approved : PunchReviewStatusEnum.Rejected;
    const saved = await this.punchDao.setReview(user.accountId, id, status, user.userId);
    await this.audit.process({ accountId: user.accountId, actor: user, entity: 'punch', entityId: id, action: `review_${dto.decision}`, before: punch, after: { ...saved, comment: dto.comment } });
    this.eventEmitter.emit(PUNCH_CHANGED_EVENT, { accountId: user.accountId, employmentId: punch.employmentId, at: punch.effectiveAt });
    return saved;
  }

  async photo(accountId: string, punchId: string) {
    return found(await this.punchPhotoDao.findByPunch(accountId, punchId), 'El marcaje no tiene foto');
  }

  // ── App del empleado ────────────────────────────────────────────────────

  async myPunches(employee: EmployeeContext, from: string, to: string) {
    if (!employee.accountId || !employee.employmentId) return [];
    return this.punchDao.findForEmploymentBetween(employee.accountId, employee.employmentId, new Date(from), new Date(to));
  }

  /** Estado para la pantalla «Checar»: dentro/fuera, contador de hoy y de la semana, turno. */
  async myStatus(employee: EmployeeContext) {
    if (!employee.accountId || !employee.employmentId) throw new ForbiddenException('Elige primero la empresa para la que checas');
    const employment = found(await this.employmentDao.findById(employee.accountId, employee.employmentId), 'No encontramos tu registro');
    const settings = await this.accountSettingsDao.findByAccount(employee.accountId);
    const tz = settings?.timeZone ?? 'America/Mexico_City';
    const now = new Date();
    const today = localDateOf(now, tz);
    const weekStart = addDays(today, -((dayOfWeek(today) - (settings?.weekStartsOn ?? 1) + 7) % 7));
    const weekPunches = await this.punchDao.findForEmploymentBetween(employee.accountId, employment.id, zonedTimeToUtc(weekStart, '00:00', tz), now);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const perDay = days.map((date) => {
      const dayPunches = weekPunches.filter((p) => localDateOf(new Date(p.effectiveAt), tz) === date);
      return { date, minutes: liveWorkedMinutes(dayPunches, now).minutes };
    });
    const todayPunches = weekPunches.filter((p) => localDateOf(new Date(p.effectiveAt), tz) === today);
    const live = liveWorkedMinutes(todayPunches, now);
    const shifts = await this.policyResolver.weekShiftsFor(employee.accountId, employment.scheduleId);
    const shift = shifts.get(dayOfWeek(today)) ?? null;
    const last = await this.punchDao.findLastEffective(employment.id);
    const location = employment.defaultLocationId ? await this.locationDao.findById(employee.accountId, employment.defaultLocationId) : null;
    return {
      now,
      timeZone: tz,
      state: live.state,
      todayMinutes: live.minutes,
      weekMinutes: perDay.reduce((a, d) => a + d.minutes, 0),
      perDay,
      shift: shift && { startTime: shift.startTime, endTime: shift.endTime, breakMinutes: shift.breakMinutes },
      lastPunch: last && { type: last.type, at: last.effectiveAt, reviewStatus: last.reviewStatus, riskFlags: last.riskFlags },
      defaultLocation: location && { id: location.id, name: location.name, lat: location.lat, lng: location.lng, radiusMeters: location.radiusMeters },
      accountName: settings?.displayName ?? null,
    };
  }
}
