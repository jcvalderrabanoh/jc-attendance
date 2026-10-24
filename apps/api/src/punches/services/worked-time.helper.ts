import { Punch, PunchReviewStatusEnum, PunchTypeEnum } from '../entities';

export type PresenceState = 'out' | 'in' | 'on_break';

/**
 * Contador en vivo: minutos trabajados de una lista de marcajes ordenada,
 * contando el tramo abierto hasta `now`. Las jornadas oficiales las calcula
 * el motor (`workdays`); esto es solo para la pantalla del empleado.
 */
export function liveWorkedMinutes(punches: Punch[], now: Date): { minutes: number; state: PresenceState } {
  let minutes = 0;
  let openSince: Date | null = null;
  let state: PresenceState = 'out';
  for (const p of punches.filter((x) => x.reviewStatus !== PunchReviewStatusEnum.Rejected)) {
    const at = new Date(p.effectiveAt);
    if (p.type === PunchTypeEnum.In || p.type === PunchTypeEnum.BreakEnd) {
      if (!openSince) openSince = at;
      state = 'in';
    } else {
      if (openSince) minutes += (at.getTime() - openSince.getTime()) / 60_000;
      openSince = null;
      state = p.type === PunchTypeEnum.BreakStart ? 'on_break' : 'out';
    }
  }
  if (openSince) minutes += Math.max(0, now.getTime() - openSince.getTime()) / 60_000;
  return { minutes: Math.round(minutes), state };
}
