/**
 * Días de descanso obligatorio, art. 74 LFT (catálogo precargado en `holidays`).
 */
import type { IsoDate } from './types';
import { formatIsoDate } from './tz';

export interface Holiday {
  date: IsoDate;
  name: string;
}

/** n-ésimo lunes (1 = primero) de un mes. */
function nthMonday(year: number, month: number, n: number): IsoDate {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstMonday = 1 + ((8 - firstDow) % 7);
  return formatIsoDate(year, month, firstMonday + (n - 1) * 7);
}

/**
 * Festivos del art. 74 para un año, ordenados por fecha.
 *
 * Transmisión del Poder Ejecutivo Federal (fr. VIII), cada 6 años: desde la
 * reforma constitucional de 2014 la toma de protesta es el **1 de octubre**
 * a partir de 2024 (2024, 2030, …); hasta 2018 era el 1 de diciembre.
 * No incluye la jornada electoral (fr. IX): no tiene fecha fija y depende
 * de la ley electoral de cada año.
 */
export function MEXICO_HOLIDAYS(year: number): Holiday[] {
  const list: Holiday[] = [
    { date: formatIsoDate(year, 1, 1), name: 'Año Nuevo' },
    { date: nthMonday(year, 2, 1), name: 'Día de la Constitución (primer lunes de febrero)' },
    { date: nthMonday(year, 3, 3), name: 'Natalicio de Benito Juárez (tercer lunes de marzo)' },
    { date: formatIsoDate(year, 5, 1), name: 'Día del Trabajo' },
    { date: formatIsoDate(year, 9, 16), name: 'Día de la Independencia' },
    { date: nthMonday(year, 11, 3), name: 'Día de la Revolución (tercer lunes de noviembre)' },
    { date: formatIsoDate(year, 12, 25), name: 'Navidad' },
  ];
  if (year % 6 === 2) {
    list.push(
      year >= 2024
        ? { date: formatIsoDate(year, 10, 1), name: 'Transmisión del Poder Ejecutivo Federal' }
        : { date: formatIsoDate(year, 12, 1), name: 'Transmisión del Poder Ejecutivo Federal' },
    );
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/** `true` si la fecha es festivo del art. 74. */
export function isMexicoHoliday(date: IsoDate): boolean {
  const year = Number(date.slice(0, 4));
  return MEXICO_HOLIDAYS(year).some((h) => h.date === date);
}
