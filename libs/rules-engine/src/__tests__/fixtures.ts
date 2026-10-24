import type { Policy, Punch, PunchType, Shift, WorkdayResult } from '../types';

let seq = 0;
/** Marcaje en un instante UTC ISO. */
export function punch(type: PunchType, iso: string, reviewStatus?: Punch['reviewStatus']): Punch {
  seq += 1;
  return { id: `p${String(seq).padStart(4, '0')}`, type, at: new Date(iso), reviewStatus };
}

export const basePolicy: Policy = {
  graceInMinutes: 10,
  graceOutMinutes: 10,
  roundingMinutes: 0,
  roundingMode: 'none',
  lateThresholdMinutes: 0,
  absenceAfterMinutes: 120,
  overtimeMode: 'LFT_MX',
  overtimeRequiresApproval: false,
  sundayPremium: true,
};

/** Turno diurno 09:00–18:00 con 60 min de comida no pagada. */
export const dayShift: Shift = { startTime: '09:00', endTime: '18:00', crossesMidnight: false, breakMinutes: 60, paidBreak: false };

/** Turno nocturno 22:00–06:00 sin descanso. */
export const nightShift: Shift = { startTime: '22:00', endTime: '06:00', crossesMidnight: true, breakMinutes: 0, paidBreak: false };

/** WorkdayResult mínimo para pruebas semanales. */
export function wd(date: string, workedMinutes: number, overtimeMinutes: number): WorkdayResult {
  return {
    date,
    workedMinutes,
    breakMinutes: 0,
    nightMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    overtimeMinutes,
    overtimePendingApproval: false,
    status: 'ok',
    jornadaType: 'diurna',
    incidents: [],
    pendingPunchIds: [],
    lftValidFrom: '2026-01-01',
    calcVersion: 'test',
  };
}
