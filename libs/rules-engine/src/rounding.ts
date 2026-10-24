import type { RoundingMode } from './types';

/** Redondea minutos calculados según el paso y modo de la política. */
export function roundMinutes(value: number, step: number, mode: RoundingMode): number {
  if (mode === 'none' || !step || step <= 1) return value;
  const q = value / step;
  switch (mode) {
    case 'nearest':
      return Math.round(q) * step;
    case 'up':
      return Math.ceil(q) * step;
    case 'down':
      return Math.floor(q) * step;
  }
}
