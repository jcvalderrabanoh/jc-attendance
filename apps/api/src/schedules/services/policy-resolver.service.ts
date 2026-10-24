import { Injectable } from '@nestjs/common';
import { Policy as EnginePolicy, Shift as EngineShift } from '@jc-attendance/rules-engine';
import { AccountSettingsDao } from '../../organization/daos';
import { PolicyDao, ScheduleDao, ShiftDao } from '../daos';
import { Policy, Shift } from '../entities';

/** Política por defecto si la cuenta aún no tiene ninguna (mismos valores que la entidad). */
export const FALLBACK_POLICY: Omit<Policy, 'id' | 'accountId' | 'status' | 'createdAt' | 'updatedAt' | 'name'> = {
  graceInMinutes: 10,
  graceOutMinutes: 0,
  roundingMinutes: 0,
  roundingMode: 'none' as Policy['roundingMode'],
  lateThresholdMinutes: 10,
  absenceAfterMinutes: 120,
  earlyClockInMinutes: 60,
  autoClockOutAfterHours: 14,
  requireSelfie: false,
  requireGeofence: true,
  requireQr: false,
  allowOffline: true,
  maxOfflineHours: 24,
  overtimeMode: 'LFT_MX' as Policy['overtimeMode'],
  overtimeRequiresApproval: true,
  sundayPremium: true,
};

export type EffectivePolicy = typeof FALLBACK_POLICY & { id: string | null; name: string };

/**
 * Resuelve la política y el turno efectivos de un empleado: los suyos, o los
 * por defecto de la cuenta. Traduce a los tipos del motor de cálculo.
 */
@Injectable()
export class PolicyResolverService {
  constructor(
    private readonly policyDao: PolicyDao,
    private readonly scheduleDao: ScheduleDao,
    private readonly shiftDao: ShiftDao,
    private readonly accountSettingsDao: AccountSettingsDao,
  ) {}

  async policyFor(accountId: string, policyId?: string | null): Promise<EffectivePolicy> {
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const id = policyId ?? settings?.defaultPolicyId ?? null;
    const policy = id ? await this.policyDao.findById(accountId, id) : null;
    if (policy) return policy;
    return { ...FALLBACK_POLICY, id: null, name: 'Política por defecto' };
  }

  /** Turnos de la semana (por día) del horario del empleado o el de la cuenta. */
  async weekShiftsFor(accountId: string, scheduleId?: string | null): Promise<Map<number, Shift>> {
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const id = scheduleId ?? settings?.defaultScheduleId ?? null;
    const schedule = id ? await this.scheduleDao.findById(accountId, id) : null;
    const shifts = schedule ? await this.shiftDao.findBySchedules(accountId, [schedule.id]) : [];
    return new Map(shifts.map((s) => [s.dayOfWeek, s]));
  }

  toEnginePolicy(p: EffectivePolicy): EnginePolicy {
    return {
      graceInMinutes: p.graceInMinutes,
      graceOutMinutes: p.graceOutMinutes,
      roundingMinutes: p.roundingMinutes,
      roundingMode: p.roundingMode,
      lateThresholdMinutes: p.lateThresholdMinutes,
      absenceAfterMinutes: p.absenceAfterMinutes,
      overtimeMode: p.overtimeMode,
      overtimeRequiresApproval: p.overtimeRequiresApproval,
      sundayPremium: p.sundayPremium,
    };
  }

  toEngineShift(s: Shift | undefined | null): EngineShift | null {
    if (!s) return null;
    return { startTime: s.startTime, endTime: s.endTime, crossesMidnight: s.crossesMidnight, breakMinutes: s.breakMinutes, paidBreak: s.paidBreak };
  }
}
