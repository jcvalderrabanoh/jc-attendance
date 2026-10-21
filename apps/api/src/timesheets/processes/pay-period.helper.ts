import { addDays, dayOfWeek, parseIsoDate, formatIsoDate } from '@jc-attendance/rules-engine';
import { PayPeriodFrequencyEnum } from '../../organization/entities';

/** Periodo de pago que contiene `date` según la periodicidad de la cuenta. */
export function payPeriodFor(date: string, frequency: PayPeriodFrequencyEnum, weekStartsOn: number): { startDate: string; endDate: string } {
  const { year, month, day } = parseIsoDate(date);
  switch (frequency) {
    case PayPeriodFrequencyEnum.Weekly: {
      const start = addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7));
      return { startDate: start, endDate: addDays(start, 6) };
    }
    case PayPeriodFrequencyEnum.Biweekly: {
      // Catorcenas ancladas al primer inicio de semana de 2026.
      const anchor = addDays('2026-01-01', (weekStartsOn - dayOfWeek('2026-01-01') + 7) % 7);
      const diff = Math.floor((Date.parse(date) - Date.parse(anchor)) / 86_400_000);
      const start = addDays(anchor, Math.floor(diff / 14) * 14);
      return { startDate: start, endDate: addDays(start, 13) };
    }
    case PayPeriodFrequencyEnum.Semimonthly: {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      return day <= 15
        ? { startDate: formatIsoDate(year, month, 1), endDate: formatIsoDate(year, month, 15) }
        : { startDate: formatIsoDate(year, month, 16), endDate: formatIsoDate(year, month, lastDay) };
    }
    default: {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      return { startDate: formatIsoDate(year, month, 1), endDate: formatIsoDate(year, month, lastDay) };
    }
  }
}
