import type { IsoDate, Shift } from './types';
import { addDays, localDateOf, localMinuteOfDay, parseWallTime } from './tz';

/** `true` si el turno termina al día siguiente de su inicio. */
export function shiftCrossesMidnight(shift: Shift): boolean {
  return shift.crossesMidnight || parseWallTime(shift.endTime) <= parseWallTime(shift.startTime);
}

/**
 * Día laboral al que pertenece un instante: la fecha en que **empieza** el
 * turno (docs/05 §3.1). Un turno 22:00–06:00 marcado a las 02:00 pertenece
 * al día anterior.
 *
 * Para turnos que cruzan la medianoche, el corte entre el día anterior y el
 * actual es el punto medio del tiempo libre entre el fin y el siguiente
 * inicio (22:00–06:00 → corte a las 14:00): así una salida tardía a las 07:00
 * sigue en el día anterior y una entrada anticipada a las 21:30 cae en el
 * día actual. Para turnos que no cruzan la medianoche (o sin turno) es la
 * fecha local del instante.
 */
export function workdayDateFor(instant: Date, shift: Shift | undefined | null, timeZone: string): IsoDate {
  const localDate = localDateOf(instant, timeZone);
  if (!shift || !shiftCrossesMidnight(shift)) return localDate;
  const start = parseWallTime(shift.startTime);
  const end = parseWallTime(shift.endTime) % 1440;
  const cutoff = end + (start - end) / 2;
  return localMinuteOfDay(instant, timeZone) < cutoff ? addDays(localDate, -1) : localDate;
}
