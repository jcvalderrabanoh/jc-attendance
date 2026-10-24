/**
 * Parámetros de la Ley Federal del Trabajo (reforma DOF 1-may-2026),
 * versionados por fecha de vigencia. Ver docs/06-cumplimiento-legal.md.
 */
import type { IsoDate, JornadaType, LftVersion, WallTime } from './types';
import { parseWallTime } from './tz';

/**
 * Calendario de reducción de la jornada semanal (48 → 40 h) y topes de horas
 * extra dobles por año. El calendario de topes está marcado [NV] en los docs:
 * revisar con jurídico antes de prometer "cumplimiento garantizado".
 */
export const LFT_VERSIONS: readonly LftVersion[] = Object.freeze([
  { validFrom: '2026-01-01', weeklyHoursLimit: 48, weeklyDoubleOvertimeCap: 9, weeklyTripleOvertimeCap: 4, dailyMaxWithOvertime: 12 },
  { validFrom: '2027-01-01', weeklyHoursLimit: 46, weeklyDoubleOvertimeCap: 9, weeklyTripleOvertimeCap: 4, dailyMaxWithOvertime: 12 },
  { validFrom: '2028-01-01', weeklyHoursLimit: 44, weeklyDoubleOvertimeCap: 10, weeklyTripleOvertimeCap: 4, dailyMaxWithOvertime: 12 },
  { validFrom: '2029-01-01', weeklyHoursLimit: 42, weeklyDoubleOvertimeCap: 11, weeklyTripleOvertimeCap: 4, dailyMaxWithOvertime: 12 },
  { validFrom: '2030-01-01', weeklyHoursLimit: 40, weeklyDoubleOvertimeCap: 12, weeklyTripleOvertimeCap: 4, dailyMaxWithOvertime: 12 },
].map((v) => Object.freeze(v)));

/**
 * Versión legal vigente en una fecha laboral. Antes de 2026 se usa la primera
 * (48 h, igual que la LFT previa a la reforma).
 */
export function resolveLftVersion(date: IsoDate, versions: readonly LftVersion[] = LFT_VERSIONS): LftVersion {
  if (versions.length === 0) throw new Error('No hay versiones LFT configuradas');
  const sorted = [...versions].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  let current = sorted[0];
  for (const v of sorted) {
    if (v.validFrom <= date) current = v;
  }
  return current;
}

/** Jornada diaria máxima por tipo (arts. 60–61 LFT), en minutos. */
export const DAILY_MAX_MINUTES: Readonly<Record<JornadaType, number>> = Object.freeze({
  diurna: 8 * 60,
  nocturna: 7 * 60,
  mixta: 7.5 * 60,
});

/** Igual que `DAILY_MAX_MINUTES`, en horas. */
export const DAILY_MAX: Readonly<Record<JornadaType, number>> = Object.freeze({
  diurna: 8,
  nocturna: 7,
  mixta: 7.5,
});

/** Ventana nocturna del art. 60: de las 20:00 a las 06:00. */
export const NIGHT_START_MINUTE = 20 * 60;
export const NIGHT_END_MINUTE = 6 * 60;
/** Umbral del art. 60: con 3.5 h o más de periodo nocturno la jornada es nocturna. */
export const MIXTA_NIGHT_THRESHOLD_MINUTES = 3.5 * 60;

/**
 * Minutos de reloj dentro de la ventana nocturna para un intervalo local
 * `[start, end)` expresado en minutos desde la medianoche del día de inicio
 * (`end` puede pasar de 1440 si cruza la medianoche).
 */
export function nightOverlapWallMinutes(start: number, end: number): number {
  let total = 0;
  // Ventanas nocturnas relativas al día de inicio: [-240, 360), [1200, 1800), [2640, 3240)…
  for (let k = -1; k <= Math.ceil(end / 1440); k++) {
    const ws = k * 1440 + NIGHT_START_MINUTE;
    const we = (k + 1) * 1440 + NIGHT_END_MINUTE;
    total += Math.max(0, Math.min(end, we) - Math.max(start, ws));
  }
  return total;
}

/**
 * Clasifica la jornada según la hora de reloj de inicio y fin (art. 60):
 * - diurna: sin minutos entre 20:00 y 06:00;
 * - mixta: con periodo nocturno menor a 3.5 h;
 * - nocturna: con periodo nocturno de 3.5 h o más.
 * Si `end <= start` se entiende que el turno cruza la medianoche.
 */
export function classifyJornada(start: WallTime, end: WallTime): JornadaType {
  const s = parseWallTime(start);
  let e = parseWallTime(end);
  if (e <= s) e += 1440;
  const night = nightOverlapWallMinutes(s, e);
  if (night === 0) return 'diurna';
  return night < MIXTA_NIGHT_THRESHOLD_MINUTES ? 'mixta' : 'nocturna';
}
