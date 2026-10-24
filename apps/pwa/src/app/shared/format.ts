import { PunchType, RequestStatus, RequestType, WorkdayStatus } from '../core/api/models';

export const LOCALE = 'es-MX';

/** 425 → "7 h 05 min". */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')} min`;
}

/** 425 → "7.1 h" (para barras). */
export function hoursShort(total: number): string {
  if (!total) return '0 h';
  return `${(total / 60).toFixed(1).replace(/\.0$/, '')} h`;
}

export function timeOf(value: string | Date | null | undefined, timeZone?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(new Date(value));
}

/** "2026-10-21" en la zona dada (o la del dispositivo). */
export function isoDate(d: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de `date` (YYYY-MM-DD). */
export function weekStartIso(date: string, weekStartsOn = 1): string {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDaysIso(date, -((dow - weekStartsOn + 7) % 7));
}

export function dayLabel(date: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(`${date}T12:00:00Z`);
  const fmt =
    style === 'short'
      ? new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })
      : new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const s = fmt.format(d).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function rangeLabel(from: string, to: string): string {
  const fmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt.format(new Date(`${from}T12:00:00Z`))} – ${fmt.format(new Date(`${to}T12:00:00Z`))}`;
}

export const PUNCH_TYPE_LABEL: Record<PunchType, string> = {
  in: 'Entrada',
  out: 'Salida',
  break_start: 'Inicio de descanso',
  break_end: 'Fin de descanso',
};

export const PUNCH_DONE_LABEL: Record<PunchType, string> = {
  in: 'Entrada registrada',
  out: 'Salida registrada',
  break_start: 'Descanso iniciado',
  break_end: 'Descanso terminado',
};

export const WORKDAY_STATUS: Record<WorkdayStatus, { label: string; icon: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' }> = {
  ok: { label: 'A tiempo', icon: 'check_circle', tone: 'ok' },
  late: { label: 'Retardo', icon: 'schedule', tone: 'warn' },
  absent: { label: 'Falta', icon: 'cancel', tone: 'bad' },
  incomplete: { label: 'Marca faltante', icon: 'error', tone: 'warn' },
  holiday: { label: 'Festivo', icon: 'celebration', tone: 'neutral' },
  rest: { label: 'Descanso', icon: 'weekend', tone: 'neutral' },
  leave: { label: 'Permiso', icon: 'event_available', tone: 'neutral' },
};

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  vacation: 'Vacaciones',
  permission: 'Permiso',
  sick_leave: 'Incapacidad',
  punch_correction: 'Corregir marcaje',
  overtime: 'Horas extra',
};

export const REQUEST_TYPE_ICON: Record<RequestType, string> = {
  vacation: 'beach_access',
  permission: 'event_busy',
  sick_leave: 'medical_services',
  punch_correction: 'edit_calendar',
  overtime: 'more_time',
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; icon: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' }> = {
  pending: { label: 'Pendiente', icon: 'hourglass_top', tone: 'warn' },
  approved: { label: 'Aprobada', icon: 'check_circle', tone: 'ok' },
  rejected: { label: 'Rechazada', icon: 'cancel', tone: 'bad' },
  cancelled: { label: 'Cancelada', icon: 'block', tone: 'neutral' },
};

export const RISK_FLAG_LABEL: Record<string, string> = {
  out_of_geofence: 'Fuera de la zona de la sucursal',
  low_accuracy: 'Ubicación poco precisa',
  no_location: 'Sin ubicación',
  offline: 'Registrado sin conexión',
  offline_too_old: 'Enviado muchas horas después',
  offline_not_allowed: 'Tu empresa no permite checar sin conexión',
  no_selfie: 'Falta selfie',
  qr_invalid: 'QR del kiosco no válido',
  sequence: 'Secuencia de marcajes inusual',
  ip_not_allowed: 'Red no autorizada',
  early_clock_in: 'Entrada antes de tiempo',
  no_geo_consent: 'Sin permiso de ubicación',
};
