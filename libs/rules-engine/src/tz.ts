/**
 * Utilidades de zona horaria sin dependencias: solo `Intl.DateTimeFormat`.
 * Convierte instantes UTC a hora de reloj local en una zona IANA y de vuelta,
 * resolviendo los cambios de horario de verano.
 */
import type { IsoDate, WallTime } from './types';

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Hora de reloj local de un instante en la zona indicada. */
export function toZonedParts(instant: Date, timeZone: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Desfase (local − UTC) en milisegundos para un instante dado. */
export function timeZoneOffsetMs(instant: Date | number, timeZone: string): number {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  const whole = Math.floor(ms / 1000) * 1000;
  const p = toZonedParts(new Date(whole), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

/** Fecha local `YYYY-MM-DD` de un instante. */
export function localDateOf(instant: Date, timeZone: string): IsoDate {
  const p = toZonedParts(instant, timeZone);
  return formatIsoDate(p.year, p.month, p.day);
}

/** Minutos desde la medianoche local (0–1439) de un instante. */
export function localMinuteOfDay(instant: Date, timeZone: string): number {
  const p = toZonedParts(instant, timeZone);
  return p.hour * 60 + p.minute;
}

/**
 * Convierte fecha + hora de reloj local a instante UTC.
 * - Hora repetida (atraso de horario): se toma la **primera** ocurrencia.
 * - Hora inexistente (adelanto de horario): se desplaza hacia adelante
 *   tantos minutos como dure el salto (02:30 → 03:30), como `Temporal` en modo
 *   `compatible`.
 */
export function zonedTimeToUtc(date: IsoDate, time: WallTime, timeZone: string): Date {
  const { year, month, day } = parseIsoDate(date);
  const minutes = parseWallTime(time);
  const wallAsUtc = Date.UTC(year, month - 1, day, 0, minutes);
  const DAY = 86_400_000;
  const offBefore = timeZoneOffsetMs(wallAsUtc - DAY, timeZone);
  const offAfter = timeZoneOffsetMs(wallAsUtc + DAY, timeZone);
  const candidates = [wallAsUtc - offBefore, wallAsUtc - offAfter]
    .filter((t) => t + timeZoneOffsetMs(t, timeZone) === wallAsUtc)
    .sort((a, b) => a - b);
  if (candidates.length > 0) return new Date(candidates[0]);
  // Hueco del adelanto de horario: se aplica el desfase previo al cambio.
  return new Date(wallAsUtc - offBefore);
}

export function parseIsoDate(date: IsoDate): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Fecha inválida (se espera YYYY-MM-DD): ${date}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** `HH:mm` → minutos desde medianoche. Acepta `24:00` como 1440. */
export function parseWallTime(time: WallTime): number {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`Hora inválida (se espera HH:mm): ${time}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) throw new Error(`Hora inválida: ${time}`);
  return h * 60 + min;
}

export function formatIsoDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Suma días de calendario a una fecha ISO (sin zona horaria). */
export function addDays(date: IsoDate, days: number): IsoDate {
  const { year, month, day } = parseIsoDate(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Día de la semana de una fecha ISO: 0 = domingo … 6 = sábado. */
export function dayOfWeek(date: IsoDate): number {
  const { year, month, day } = parseIsoDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
