import { formatIsoDate } from '../tz';

/** Fecha de calendario válida → `YYYY-MM-DD`; si no existe (31-feb) → `null`. */
export function validCalendarDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return formatIsoDate(year, month, day);
}
