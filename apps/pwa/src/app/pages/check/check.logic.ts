import { MyStatus, PresenceState, PunchType } from '../../core/api/models';
import { dayLabel } from '../../shared/format';

export interface PunchAction {
  type: PunchType;
  label: string;
  /** Texto para lectores de pantalla y confirmación. */
  verb: string;
  icon: string;
  tone: 'in' | 'out' | 'break';
}

const ACTIONS: Record<PunchType, PunchAction> = {
  in: { type: 'in', label: 'Registrar entrada', verb: 'entrada', icon: 'login', tone: 'in' },
  out: { type: 'out', label: 'Registrar salida', verb: 'salida', icon: 'logout', tone: 'out' },
  break_start: { type: 'break_start', label: 'Iniciar descanso', verb: 'inicio de descanso', icon: 'free_breakfast', tone: 'break' },
  break_end: { type: 'break_end', label: 'Terminar descanso', verb: 'fin de descanso', icon: 'work', tone: 'break' },
};

/** Botón grande según el estado actual (GET /me/status → state). */
export function primaryActionFor(state: PresenceState): PunchAction {
  if (state === 'in') return ACTIONS.out;
  if (state === 'on_break') return ACTIONS.break_end;
  return ACTIONS.in;
}

/** Botones secundarios: descanso mientras está dentro; salida directa desde el descanso. */
export function secondaryActionsFor(state: PresenceState): PunchAction[] {
  if (state === 'in') return [ACTIONS.break_start];
  if (state === 'on_break') return [ACTIONS.out];
  return [];
}

/** Estado tras un marcaje (para reflejarlo aunque esté en cola). */
export function stateAfter(type: PunchType): PresenceState {
  if (type === 'in' || type === 'break_end') return 'in';
  if (type === 'break_start') return 'on_break';
  return 'out';
}

/**
 * Minutos trabajados hoy "en vivo": lo que dijo el servidor más lo
 * transcurrido desde entonces si sigue dentro.
 */
export function liveMinutes(status: Pick<MyStatus, 'state' | 'todayMinutes'>, fetchedAt: number, now: number): number {
  const extra = status.state === 'in' ? Math.max(0, (now - fetchedAt) / 60_000) : 0;
  return Math.floor(status.todayMinutes + extra);
}

/** Minutos del turno (descontando comida). 08:00–17:00 con 60 → 480. */
export function shiftMinutes(shift: MyStatus['shift']): number | null {
  if (!shift) return null;
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  let span = toMin(shift.endTime) - toMin(shift.startTime);
  if (span <= 0) span += 24 * 60; // turno nocturno
  return Math.max(0, span - (shift.breakMinutes || 0));
}

export interface WeekBar {
  date: string;
  label: string;
  minutes: number;
  percent: number;
  isToday: boolean;
  isFuture: boolean;
}

/** Barras de la semana (perDay); la de hoy usa el contador en vivo. */
export function weekBars(perDay: MyStatus['perDay'], today: string, todayLive: number, dailyTarget = 480): WeekBar[] {
  const minutes = perDay.map((d) => (d.date === today ? todayLive : d.minutes));
  const max = Math.max(dailyTarget, ...minutes, 1);
  return perDay.map((d, i) => ({
    date: d.date,
    label: dayLabel(d.date),
    minutes: minutes[i],
    percent: Math.round((minutes[i] / max) * 100),
    isToday: d.date === today,
    isFuture: d.date > today,
  }));
}

export function hhmm(time: string | undefined | null): string {
  return time ? time.slice(0, 5) : '—';
}
