/**
 * Día especial (docs/05 §3.7, arts. 71, 73 y 75 LFT): descanso o festivo
 * trabajado se paga doble además del salario; el domingo lleva prima
 * dominical (≥ 25 %). Aquí solo se calculan los minutos; el importe es de nómina.
 */
import type { WorkdayResult } from './types';

export interface SpecialDayFlags {
  isHoliday: boolean;
  isRestDay: boolean;
  isSunday: boolean;
  /** `policy.sundayPremium`. */
  sundayPremium: boolean;
}

export interface SpecialDayPay {
  /** Minutos trabajados en festivo (art. 75). */
  holidayWorkedMinutes: number;
  /** Minutos trabajados en día de descanso (art. 73). Si además es festivo, cuenta solo como festivo. */
  restDayWorkedMinutes: number;
  /** Trabajó en domingo y la política paga prima dominical (art. 71). */
  sundayPremiumApplies: boolean;
}

export function specialDayPay(workday: Pick<WorkdayResult, 'workedMinutes'>, flags: SpecialDayFlags): SpecialDayPay {
  const worked = Math.max(0, workday.workedMinutes);
  return {
    holidayWorkedMinutes: flags.isHoliday ? worked : 0,
    restDayWorkedMinutes: flags.isRestDay && !flags.isHoliday ? worked : 0,
    sundayPremiumApplies: flags.isSunday && flags.sundayPremium && worked > 0,
  };
}
