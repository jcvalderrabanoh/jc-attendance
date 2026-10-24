import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ipInCidrs, ok, StatusForEntityEnum } from '../../common';
import { EmploymentDao } from '../../employees/daos';
import { Employment, OnboardingStatusEnum } from '../../employees/entities';
import { LocationDao } from '../../locations/daos';
import { Location } from '../../locations/entities';
import { GeofenceEvaluation, GeofenceRule } from '../../locations/rules';
import { AccountSettingsDao } from '../../organization/daos';
import { GeofenceModeEnum } from '../../organization/entities';
import { PolicyResolverService } from '../../schedules/services';
import { PunchDao, PunchPhotoDao } from '../daos';
import { Punch, PunchReviewStatusEnum, PunchSourceEnum, PunchTypeEnum } from '../entities';
import { PUNCH_CHANGED_EVENT, PunchChangedPayload } from '../events';
import { GeoConsentProcess, minutesBeforeShiftStart, punchHash, VerifyKioskQrProcess } from '../processes';
import { nextPunchType, PunchRiskRule } from '../rules';

/** Más de esto entre la hora del dispositivo y la del servidor = llegó offline. */
const OFFLINE_THRESHOLD_MS = 2 * 60_000;

export interface RegisterPunchInput {
  accountId: string;
  employmentId: string;
  source: PunchSourceEnum;
  actor: AuthContext;
  type?: PunchTypeEnum;
  idempotencyKey: string;
  clientAt: Date;
  lat?: number | null;
  lng?: number | null;
  accuracyMeters?: number | null;
  qrPayload?: string | null;
  selfieDataUrl?: string | null;
  offline?: boolean;
  ip?: string | null;
  customFields?: Record<string, unknown>;
  /** Kiosco: su sucursal es la ubicación del marcaje. */
  kioskDeviceId?: string | null;
  kioskLocationId?: string | null;
  /** Manual: hora capturada, motivo y marcaje que corrige. */
  manual?: { at: Date; reason: string; locationId?: string | null; replacesPunchId?: string | null; userId: string };
}

export interface RegisterPunchResult {
  punch: Punch;
  /** true si ya existía (reintento con la misma idempotencyKey). */
  duplicate: boolean;
  locationName: string | null;
}

/**
 * Registra un marcaje desde cualquier origen. Nunca descarta: lo dudoso queda
 * `pending` para revisión. Inserta append-only con hash encadenado y avisa
 * para recalcular la jornada.
 */
@Injectable()
export class RegisterPunchBluePrint implements BasicBluePrintInterface<RegisterPunchInput, RegisterPunchResult> {
  private readonly logger = new Logger(RegisterPunchBluePrint.name);

  constructor(
    private readonly punchDao: PunchDao,
    private readonly punchPhotoDao: PunchPhotoDao,
    private readonly employmentDao: EmploymentDao,
    private readonly locationDao: LocationDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly policyResolver: PolicyResolverService,
    private readonly geofenceRule: GeofenceRule,
    private readonly riskRule: PunchRiskRule,
    private readonly verifyQr: VerifyKioskQrProcess,
    private readonly geoConsent: GeoConsentProcess,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: RegisterPunchInput): Promise<CheckRulesAndProcessInterfaceResult<RegisterPunchResult>> {
    const existing = await this.punchDao.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      if (existing.accountId !== input.accountId || existing.employmentId !== input.employmentId) return fail('Clave de idempotencia ya usada');
      return ok({ punch: existing, duplicate: true, locationName: null });
    }

    const employment = await this.employmentDao.findById(input.accountId, input.employmentId);
    const problem = this.employmentProblem(employment);
    if (problem) return fail(problem);

    const settings = await this.accountSettingsDao.findByAccount(input.accountId);
    const timeZone = settings?.timeZone ?? 'America/Mexico_City';
    const policy = await this.policyResolver.policyFor(input.accountId, employment!.policyId);
    const shifts = await this.policyResolver.weekShiftsFor(input.accountId, employment!.scheduleId);

    const serverAt = new Date();
    let clientAt = input.clientAt;
    if (clientAt.getTime() > serverAt.getTime() + OFFLINE_THRESHOLD_MS) clientAt = serverAt; // reloj adelantado: no se acepta futuro
    const offline = !input.manual && (input.offline === true || serverAt.getTime() - clientAt.getTime() > OFFLINE_THRESHOLD_MS);
    const effectiveAt = input.manual ? input.manual.at : offline ? clientAt : serverAt;

    const last = await this.punchDao.findLastEffective(employment!.id);
    const type = input.type ?? nextPunchType((last?.type as PunchTypeEnum) ?? null);

    // Ubicación: kiosco y QR prueban presencia; si no, geocerca con el GPS.
    let geofence: GeofenceEvaluation | null = null;
    let locationId: string | null = input.kioskLocationId ?? input.manual?.locationId ?? null;
    let deviceId: string | null = input.kioskDeviceId ?? null;
    let qrValid: boolean | null = null;
    if (input.qrPayload) {
      const qr = await this.verifyQr.process(input.accountId, input.qrPayload);
      qrValid = qr.valid;
      if (qr.valid) {
        locationId = qr.locationId;
        deviceId = qr.deviceId;
      }
    }
    const hasGeoConsent = input.source === PunchSourceEnum.Pwa ? await this.geoConsent.process(employment!.identityId, input.accountId) : true;
    const lat = hasGeoConsent ? input.lat ?? null : null;
    const lng = hasGeoConsent ? input.lng ?? null : null;
    const locations = await this.allowedLocations(input.accountId, employment!);
    if (!locationId && !input.manual && locations.length) {
      geofence = this.geofenceRule.pickBest(locations, lat, lng, input.accuracyMeters ?? null);
      locationId = geofence?.locationId ?? null;
    }
    const geofenceFlags = [...(geofence?.flags ?? [])];
    if (!hasGeoConsent) geofenceFlags.push('no_geo_consent');
    const location = locations.find((l) => l.id === locationId) ?? null;
    if (input.source === PunchSourceEnum.Web && location?.allowedIpCidrs?.length && !ipInCidrs(input.ip, location.allowedIpCidrs)) {
      geofenceFlags.push('ip_not_allowed');
    }

    const risk = input.manual
      ? { flags: ['manual'], reviewStatus: PunchReviewStatusEnum.Approved }
      : this.riskRule.evaluate({
          type,
          lastType: (last?.type as PunchTypeEnum) ?? null,
          geofenceFlags: qrValid || input.kioskLocationId ? [] : geofenceFlags,
          requireGeofence: policy.requireGeofence && input.source !== PunchSourceEnum.Kiosk,
          requireSelfie: policy.requireSelfie,
          hasSelfie: Boolean(input.selfieDataUrl),
          requireQr: policy.requireQr && input.source === PunchSourceEnum.Pwa,
          qrValid,
          offline,
          offlineMinutes: (serverAt.getTime() - clientAt.getTime()) / 60_000,
          allowOffline: policy.allowOffline,
          maxOfflineHours: policy.maxOfflineHours,
          minutesBeforeShift: minutesBeforeShiftStart(effectiveAt, location?.timeZone ?? timeZone, shifts),
          earlyClockInMinutes: policy.earlyClockInMinutes,
        });

    if (settings?.geofenceMode === GeofenceModeEnum.Block && risk.flags.includes('out_of_geofence') && policy.requireGeofence) {
      return fail(`Estás fuera de la zona de ${location?.name ?? 'tu sucursal'} (${geofence?.distanceMeters ?? '?'} m)`);
    }

    const prev = await this.punchDao.findLast(employment!.id);
    const draft = {
      accountId: input.accountId,
      employmentId: employment!.id,
      type,
      source: input.source,
      serverAt,
      clientAt,
      effectiveAt,
      offline,
      lat,
      lng,
      accuracyMeters: input.accuracyMeters ?? null,
      locationId,
      distanceMeters: geofence?.distanceMeters ?? null,
      insideGeofence: geofence?.inside ?? (locationId && (qrValid || input.kioskLocationId) ? true : null),
      deviceId,
      ip: input.ip ?? null,
      riskFlags: risk.flags,
      reviewStatus: risk.reviewStatus,
      reviewedByUserId: input.manual?.userId ?? null,
      reviewedAt: input.manual ? serverAt : null,
      replacesPunchId: input.manual?.replacesPunchId ?? null,
      reason: input.manual?.reason ?? null,
      createdByUserId: input.manual?.userId ?? null,
      idempotencyKey: input.idempotencyKey,
      customFields: input.customFields ?? {},
      prevHash: prev?.hash ?? null,
    };
    const punch = await this.punchDao.insert({ ...draft, hash: punchHash(draft.prevHash, draft) });

    if (input.selfieDataUrl) {
      const [, mimeType, base64] = /^data:(image\/[a-z]+);base64,(.*)$/.exec(input.selfieDataUrl) ?? [];
      if (base64) await this.punchPhotoDao.insert({ accountId: input.accountId, punchId: punch.id, mimeType, data: Buffer.from(base64, 'base64') });
    }
    if (input.manual?.replacesPunchId) {
      await this.punchDao.setReview(input.accountId, input.manual.replacesPunchId, PunchReviewStatusEnum.Rejected, input.manual.userId);
    }
    if (input.manual) {
      await this.audit.process({ accountId: input.accountId, actor: input.actor, entity: 'punch', entityId: punch.id, action: 'manual', after: punch });
    }
    const payload: PunchChangedPayload = { accountId: input.accountId, employmentId: employment!.id, at: effectiveAt };
    this.eventEmitter.emit(PUNCH_CHANGED_EVENT, payload);
    return ok({ punch, duplicate: false, locationName: location?.name ?? null });
  }

  private employmentProblem(employment: Employment | null): string | null {
    if (!employment) return 'No encontramos tu registro de empleado';
    if (employment.onboardingStatus !== OnboardingStatusEnum.Approved) return 'Tu alta sigue en revisión';
    if (employment.status !== StatusForEntityEnum.Active) return 'Tu registro está dado de baja';
    return null;
  }

  private async allowedLocations(accountId: string, employment: Employment): Promise<Location[]> {
    if (employment.allowedLocationIds?.length) return this.locationDao.findByIds(accountId, employment.allowedLocationIds);
    return this.locationDao.findAll(accountId);
  }
}
