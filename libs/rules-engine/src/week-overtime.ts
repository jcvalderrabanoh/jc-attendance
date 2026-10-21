/**
 * Clasificación semanal de horas extra (docs/05 §3.6, arts. 66–68 LFT).
 */
import type { IsoDate, LftVersion, OvertimeMode, WorkdayResult } from './types';

export interface WeekOvertimeOptions {
  isMinor: boolean;
  /** Por defecto `LFT_MX`. */
  mode?: OvertimeMode;
}

export interface DayOvertime {
  date: IsoDate;
  doubleMinutes: number;
  tripleMinutes: number;
}

export interface WeekOvertimeResult {
  doubleMinutes: number;
  tripleMinutes: number;
  /** Triples > `weeklyTripleOvertimeCap` horas: alerta. */
  exceededTripleCap: boolean;
  perDay: DayOvertime[];
  /** Total de minutos extra detectados en la semana (antes de bloquear a menores). */
  totalOvertimeMinutes: number;
  /** Exceso semanal sobre `weeklyHoursLimit` que no estaba ya contado como extra diario. */
  weeklyExcessMinutes: number;
  /** Menor de 18 años con tiempo extra: no se paga como extra y se alerta. */
  minorOvertimeBlocked: boolean;
}

/**
 * - Extra semanal = suma de los excesos diarios + el exceso sobre el límite
 *   semanal (`weeklyHoursLimit`) que no esté ya contado en esos excesos.
 *   (`daily` solo usa lo diario; `weekly` solo el exceso semanal.)
 * - El exceso semanal se asigna a los últimos días trabajados de la semana.
 * - En orden cronológico, las primeras `weeklyDoubleOvertimeCap` horas son
 *   dobles y el resto triples; si las triples pasan de
 *   `weeklyTripleOvertimeCap` horas se marca `exceededTripleCap`.
 * - Menores: 0 minutos extra pagados y `minorOvertimeBlocked`.
 */
export function calculateWeekOvertime(
  workdays: WorkdayResult[],
  lft: LftVersion,
  opts: WeekOvertimeOptions,
): WeekOvertimeResult {
  const mode = opts.mode ?? 'LFT_MX';
  const days = [...workdays].sort((a, b) => a.date.localeCompare(b.date));
  const zero = (): WeekOvertimeResult => ({
    doubleMinutes: 0,
    tripleMinutes: 0,
    exceededTripleCap: false,
    perDay: days.map((d) => ({ date: d.date, doubleMinutes: 0, tripleMinutes: 0 })),
    totalOvertimeMinutes: 0,
    weeklyExcessMinutes: 0,
    minorOvertimeBlocked: false,
  });
  if (mode === 'none') return zero();

  const useDaily = mode === 'LFT_MX' || mode === 'daily';
  const useWeekly = mode === 'LFT_MX' || mode === 'weekly';

  const perDayOt = days.map((d) => (useDaily ? d.overtimeMinutes : 0));
  const dailyTotal = perDayOt.reduce((a, b) => a + b, 0);
  const workedTotal = days.reduce((a, d) => a + d.workedMinutes, 0);

  let weeklyExcess = 0;
  if (useWeekly) {
    weeklyExcess = Math.max(0, workedTotal - lft.weeklyHoursLimit * 60 - dailyTotal);
    // Se asigna del último día hacia atrás, sin pasar de lo ordinario de cada día.
    let remaining = weeklyExcess;
    for (let i = days.length - 1; i >= 0 && remaining > 0; i--) {
      const room = Math.max(0, days[i].workedMinutes - perDayOt[i]);
      const take = Math.min(room, remaining);
      perDayOt[i] += take;
      remaining -= take;
    }
  }

  const total = perDayOt.reduce((a, b) => a + b, 0);
  if (opts.isMinor) {
    return { ...zero(), totalOvertimeMinutes: total, weeklyExcessMinutes: weeklyExcess, minorOvertimeBlocked: total > 0 };
  }

  const doubleCap = lft.weeklyDoubleOvertimeCap * 60;
  let doubleUsed = 0;
  const perDay: DayOvertime[] = days.map((d, i) => {
    const dbl = Math.min(perDayOt[i], Math.max(0, doubleCap - doubleUsed));
    doubleUsed += dbl;
    return { date: d.date, doubleMinutes: dbl, tripleMinutes: perDayOt[i] - dbl };
  });
  const doubleMinutes = perDay.reduce((a, d) => a + d.doubleMinutes, 0);
  const tripleMinutes = perDay.reduce((a, d) => a + d.tripleMinutes, 0);

  return {
    doubleMinutes,
    tripleMinutes,
    exceededTripleCap: tripleMinutes > lft.weeklyTripleOvertimeCap * 60,
    perDay,
    totalOvertimeMinutes: total,
    weeklyExcessMinutes: weeklyExcess,
    minorOvertimeBlocked: false,
  };
}
