import { Injectable, Logger } from '@nestjs/common';
import {
  addDays,
  calculateWeekOvertime,
  calculateWorkday,
  dayOfWeek,
  resolveLftVersion,
  WorkdayResult,
  workdayDateFor,
  zonedTimeToUtc,
} from '@jc-attendance/rules-engine';
import { EmploymentDao } from '../../employees/daos';
import { Employment } from '../../employees/entities';
import { LocationDao } from '../../locations/daos';
import { AccountSettingsDao } from '../../organization/daos';
import { PunchDao } from '../../punches/daos';
import { HolidayDao } from '../../schedules/daos';
import { Shift } from '../../schedules/entities';
import { PolicyResolverService } from '../../schedules/services';
import { ApprovedLeaveDao, IncidentDao, WorkdayDao } from '../daos';
import { IncidentTypeEnum, Workday, WorkdayStatusEnum } from '../entities';

/** Versión del cálculo guardada en cada jornada: permite recalcular periodos abiertos al cambiar reglas. */
export const CALC_VERSION = 'v1';

interface Context {
  employment: Employment;
  timeZone: string;
  shifts: Map<number, Shift>;
  weekStartsOn: number;
}

/**
 * Recalcula la jornada de un empleado en una fecha laboral con el motor
 * (`@jc-attendance/rules-engine`), sincroniza sus incidencias y reparte las
 * horas extra de la semana en dobles/triples (LFT). Idempotente; no toca
 * jornadas de periodos cerrados.
 */
@Injectable()
export class RecalculateWorkdayProcess {
  private readonly logger = new Logger(RecalculateWorkdayProcess.name);

  constructor(
    private readonly employmentDao: EmploymentDao,
    private readonly punchDao: PunchDao,
    private readonly workdayDao: WorkdayDao,
    private readonly incidentDao: IncidentDao,
    private readonly holidayDao: HolidayDao,
    private readonly leaveDao: ApprovedLeaveDao,
    private readonly locationDao: LocationDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly policyResolver: PolicyResolverService,
  ) {}

  private async context(accountId: string, employmentId: string): Promise<Context | null> {
    const employment = await this.employmentDao.findById(accountId, employmentId);
    if (!employment) return null;
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const location = employment.defaultLocationId ? await this.locationDao.findById(accountId, employment.defaultLocationId) : null;
    return {
      employment,
      timeZone: location?.timeZone || settings?.timeZone || 'America/Mexico_City',
      shifts: await this.policyResolver.weekShiftsFor(accountId, employment.scheduleId),
      weekStartsOn: settings?.weekStartsOn ?? 1,
    };
  }

  /** Fecha laboral a la que pertenece un instante (turnos nocturnos: el día en que empiezan). */
  async workdayDateOf(accountId: string, employmentId: string, at: Date): Promise<string | null> {
    const ctx = await this.context(accountId, employmentId);
    if (!ctx) return null;
    const naiveDate = workdayDateFor(at, null, ctx.timeZone);
    const prevShift = ctx.shifts.get(dayOfWeek(addDays(naiveDate, -1)));
    if (prevShift?.crossesMidnight) {
      const candidate = workdayDateFor(at, this.policyResolver.toEngineShift(prevShift), ctx.timeZone);
      if (candidate !== naiveDate) return candidate;
    }
    return workdayDateFor(at, this.policyResolver.toEngineShift(ctx.shifts.get(dayOfWeek(naiveDate))), ctx.timeZone);
  }

  async process(accountId: string, employmentId: string, date: string): Promise<Workday | null> {
    const ctx = await this.context(accountId, employmentId);
    if (!ctx) return null;
    const existing = await this.workdayDao.findOne(employmentId, date);
    if (existing?.locked) return existing;

    const shiftEntity = ctx.shifts.get(dayOfWeek(date)) ?? null;
    const shift = this.policyResolver.toEngineShift(shiftEntity);
    const policy = await this.policyResolver.policyFor(accountId, ctx.employment.policyId);

    // Ventana amplia (día anterior a dos días después) y luego se filtra por fecha laboral.
    const windowStart = zonedTimeToUtc(addDays(date, -1), '12:00', ctx.timeZone);
    const windowEnd = zonedTimeToUtc(addDays(date, 2), '00:00', ctx.timeZone);
    const all = await this.punchDao.findForEmploymentBetween(accountId, employmentId, windowStart, windowEnd);
    const punches = [];
    for (const p of all) {
      if ((await this.workdayDateOf(accountId, employmentId, new Date(p.effectiveAt))) === date) {
        punches.push({ id: p.id, type: p.type, at: new Date(p.effectiveAt), reviewStatus: p.reviewStatus });
      }
    }

    const holidays = await this.holidayDao.findBetween(accountId, date, date);
    const hired = !ctx.employment.hireDate || ctx.employment.hireDate <= date;
    const terminated = ctx.employment.terminationDate && ctx.employment.terminationDate < date;
    const result = calculateWorkday({
      date,
      timeZone: ctx.timeZone,
      shift,
      punches: punches as never,
      policy: this.policyResolver.toEnginePolicy(policy),
      isHoliday: holidays.some((h) => h.mandatory),
      // Sin turno ese día en su horario (o fuera de su relación laboral) = descanso.
      isRestDay: !shift || !hired || Boolean(terminated),
      isMinor: ctx.employment.isMinor,
      isOnLeave: await this.leaveDao.isOnLeave(employmentId, date),
      calcVersion: CALC_VERSION,
    });

    const saved = await this.workdayDao.upsert({
      accountId,
      employmentId,
      date,
      scheduledStart: result.scheduledStart ?? null,
      scheduledEnd: result.scheduledEnd ?? null,
      firstIn: result.firstIn ?? null,
      lastOut: result.lastOut ?? null,
      workedMinutes: result.workedMinutes,
      breakMinutes: result.breakMinutes,
      nightMinutes: result.nightMinutes,
      lateMinutes: result.lateMinutes,
      earlyLeaveMinutes: result.earlyLeaveMinutes,
      overtimeMinutes: result.overtimeMinutes,
      status: result.status as WorkdayStatusEnum,
      jornadaType: result.jornadaType,
      isHoliday: holidays.some((h) => h.mandatory),
      isRestDay: !shift,
      hasPendingPunches: result.pendingPunchIds.length > 0,
      calcVersion: CALC_VERSION,
    });
    await this.incidentDao.replaceForDay(
      accountId,
      employmentId,
      date,
      result.incidents.map((i) => ({ type: i.type as IncidentTypeEnum, detail: i.detail })),
    );
    await this.recalculateWeek(accountId, ctx, date);
    return this.workdayDao.findOne(employmentId, date) ?? saved;
  }

  /** Reparte el tiempo extra de la semana de `date` en dobles y triples. */
  private async recalculateWeek(accountId: string, ctx: Context, date: string): Promise<void> {
    const offset = (dayOfWeek(date) - ctx.weekStartsOn + 7) % 7;
    const weekStart = addDays(date, -offset);
    const weekEnd = addDays(weekStart, 6);
    const days = await this.workdayDao.findForEmployment(accountId, ctx.employment.id, weekStart, weekEnd);
    if (days.length === 0) return;
    const policy = await this.policyResolver.policyFor(accountId, ctx.employment.policyId);
    const asResults = days.map(
      (d) => ({ date: d.date, workedMinutes: d.workedMinutes, overtimeMinutes: d.overtimeMinutes, status: d.status, incidents: [] }) as unknown as WorkdayResult,
    );
    const week = calculateWeekOvertime(asResults, resolveLftVersion(weekStart), { isMinor: ctx.employment.isMinor, mode: policy.overtimeMode });
    for (const d of days) {
      const split = week.perDay.find((x) => x.date === d.date);
      if (d.locked) continue;
      await this.workdayDao.upsert({
        employmentId: d.employmentId,
        date: d.date,
        overtimeDoubleMinutes: split?.doubleMinutes ?? 0,
        overtimeTripleMinutes: split?.tripleMinutes ?? 0,
      });
    }
    await this.incidentDao.setWeeklyCapIncident(
      accountId,
      ctx.employment.id,
      weekEnd,
      week.exceededTripleCap,
      `Horas extra triples de la semana: ${(week.tripleMinutes / 60).toFixed(1)} h (tope legal 4 h)`,
    );
  }
}
