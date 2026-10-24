import { BadRequestException, Injectable } from '@nestjs/common';
import { addDays } from '@jc-attendance/rules-engine';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, CoreUserContext, EmployeeContext, found } from '../../common';
import { EmployeeIdentityDao, EmploymentDao } from '../../employees/daos';
import { AccountSettingsDao } from '../../organization/daos';
import { IncidentDao, PayPeriodDao, WorkdayDao } from '../daos';
import { IncidentDecisionDto, ListIncidentsQueryDto, RecalculateDto, TimesheetQueryDto } from '../dtos';
import { IncidentStatusEnum, Workday, WorkdayStatusEnum } from '../entities';
import { payPeriodFor, RecalculateWorkdayProcess } from '../processes';

export interface TimesheetTotals {
  workedMinutes: number;
  overtimeDoubleMinutes: number;
  overtimeTripleMinutes: number;
  nightMinutes: number;
  lateMinutes: number;
  lateDays: number;
  absences: number;
  incompleteDays: number;
  workedDays: number;
  sundaysWorked: number;
  holidaysWorked: number;
  pendingDays: number;
}

export function totalsOf(days: Workday[]): TimesheetTotals {
  const t: TimesheetTotals = {
    workedMinutes: 0,
    overtimeDoubleMinutes: 0,
    overtimeTripleMinutes: 0,
    nightMinutes: 0,
    lateMinutes: 0,
    lateDays: 0,
    absences: 0,
    incompleteDays: 0,
    workedDays: 0,
    sundaysWorked: 0,
    holidaysWorked: 0,
    pendingDays: 0,
  };
  for (const d of days) {
    t.workedMinutes += d.workedMinutes;
    t.overtimeDoubleMinutes += d.overtimeDoubleMinutes;
    t.overtimeTripleMinutes += d.overtimeTripleMinutes;
    t.nightMinutes += d.nightMinutes;
    t.lateMinutes += d.lateMinutes;
    if (d.status === WorkdayStatusEnum.Late) t.lateDays += 1;
    if (d.status === WorkdayStatusEnum.Absent) t.absences += 1;
    if (d.status === WorkdayStatusEnum.Incomplete) t.incompleteDays += 1;
    if (d.workedMinutes > 0) {
      t.workedDays += 1;
      if (new Date(`${d.date}T12:00:00Z`).getUTCDay() === 0) t.sundaysWorked += 1;
      if (d.isHoliday) t.holidaysWorked += 1;
    }
    if (d.hasPendingPunches) t.pendingDays += 1;
  }
  return t;
}

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly workdayDao: WorkdayDao,
    private readonly incidentDao: IncidentDao,
    private readonly payPeriodDao: PayPeriodDao,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly recalculate: RecalculateWorkdayProcess,
    private readonly audit: RecordAuditProcess,
  ) {}

  private checkRange(from: string, to: string) {
    if (from > to) throw new BadRequestException('El rango de fechas está invertido');
    if (Date.parse(to) - Date.parse(from) > 93 * 86_400_000) throw new BadRequestException('El rango máximo es de 3 meses');
  }

  /** Hoja de horas: totales por empleado del rango, para la tabla de RH y la prenómina. */
  async summary(accountId: string, q: TimesheetQueryDto) {
    this.checkRange(q.from, q.to);
    const list = await this.employmentDao.list(accountId, { departmentId: q.departmentId, locationId: q.locationId, limit: 200 });
    const employments = q.employmentId ? list.items.filter((e) => e.id === q.employmentId) : list.items;
    const days = await this.workdayDao.findForAccount(accountId, q.from, q.to, employments.map((e) => e.id));
    return employments.map((e) => ({
      employmentId: e.id,
      employeeNumber: e.employeeNumber,
      name: `${e.identity.firstName} ${e.identity.lastName}`,
      departmentId: e.departmentId,
      totals: totalsOf(days.filter((d) => d.employmentId === e.id)),
    }));
  }

  async employeeDays(accountId: string, employmentId: string, from: string, to: string) {
    this.checkRange(from, to);
    const employment = found(await this.employmentDao.findById(accountId, employmentId), 'El empleado no existe');
    const identity = await this.identityDao.findById(employment.identityId);
    const days = await this.workdayDao.findForEmployment(accountId, employmentId, from, to);
    const incidents = await this.incidentDao.findForEmploymentDates(employmentId, from, to);
    return {
      employment: { id: employment.id, employeeNumber: employment.employeeNumber, name: identity ? `${identity.firstName} ${identity.lastName}` : '—' },
      days: days.map((d) => ({ ...d, incidents: incidents.filter((i) => i.date === d.date) })),
      totals: totalsOf(days),
    };
  }

  async recalculateRange(accountId: string, dto: RecalculateDto, actor: AuthContext) {
    this.checkRange(dto.from, dto.to);
    const ids = dto.employmentId ? [dto.employmentId] : (await this.employmentDao.activeIds(accountId)).map((e) => e.id);
    let count = 0;
    for (let date = dto.from; date <= dto.to; date = addDays(date, 1)) {
      for (const id of ids) {
        await this.recalculate.process(accountId, id, date);
        count += 1;
      }
    }
    await this.audit.process({ accountId, actor, entity: 'workday', action: 'recalculate', after: { ...dto, count } });
    return { recalculated: count };
  }

  // ── Periodos de pago ─────────────────────────────────────────────────────

  async payPeriods(accountId: string) {
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const today = new Date().toISOString().slice(0, 10);
    const current = payPeriodFor(today, settings!.payPeriodFrequency, settings!.weekStartsOn);
    await this.payPeriodDao.ensure(accountId, current.startDate, current.endDate);
    const previous = payPeriodFor(addDays(current.startDate, -1), settings!.payPeriodFrequency, settings!.weekStartsOn);
    await this.payPeriodDao.ensure(accountId, previous.startDate, previous.endDate);
    return this.payPeriodDao.list(accountId);
  }

  /** Cierra el periodo: sus jornadas quedan bloqueadas (ya no se recalculan). */
  async closePayPeriod(user: CoreUserContext, id: string) {
    const period = found(await this.payPeriodDao.findById(user.accountId, id), 'El periodo no existe');
    if (period.closedAt) throw new BadRequestException('El periodo ya está cerrado');
    const locked = await this.workdayDao.lockRange(user.accountId, period.startDate, period.endDate);
    const saved = await this.payPeriodDao.close(user.accountId, id, user.userId);
    await this.audit.process({ accountId: user.accountId, actor: user, entity: 'pay_period', entityId: id, action: 'close', after: { ...saved, locked } });
    return { ...saved, lockedWorkdays: locked };
  }

  // ── Incidencias ──────────────────────────────────────────────────────────

  async incidents(accountId: string, q: ListIncidentsQueryDto) {
    const page = await this.incidentDao.list(accountId, q);
    const employments = await this.employmentDao.findByIds(accountId, [...new Set(page.items.map((i) => i.employmentId))]);
    const identities = await this.identityDao.findByIds(employments.map((e) => e.identityId));
    const names = new Map(employments.map((e) => [e.id, identities.find((i) => i.id === e.identityId)]));
    return { ...page, items: page.items.map((i) => ({ ...i, employeeName: names.get(i.employmentId) ? `${names.get(i.employmentId)!.firstName} ${names.get(i.employmentId)!.lastName}` : '—' })) };
  }

  async decideIncident(user: CoreUserContext, id: string, status: IncidentStatusEnum.Justified | IncidentStatusEnum.Dismissed, dto: IncidentDecisionDto) {
    const incident = found(await this.incidentDao.findById(user.accountId, id), 'La incidencia no existe');
    const saved = await this.incidentDao.setStatus(user.accountId, id, status, dto.requestId ?? null);
    await this.audit.process({ accountId: user.accountId, actor: user, entity: 'incident', entityId: id, action: status, before: incident, after: { ...saved, comment: dto.comment } });
    return saved;
  }

  // ── Empleado ─────────────────────────────────────────────────────────────

  async myTimesheet(employee: EmployeeContext, from: string, to: string) {
    if (!employee.accountId || !employee.employmentId) return { days: [], totals: totalsOf([]) };
    return this.employeeDays(employee.accountId, employee.employmentId, from, to);
  }
}
