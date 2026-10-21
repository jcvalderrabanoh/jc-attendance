/**
 * Motor de cálculo de un día laboral (docs/05 §3, pasos 1–6 y 8).
 * Función pura: mismas entradas → mismo resultado; no modifica los marcajes.
 */
import { DAILY_MAX_MINUTES, classifyJornada, resolveLftVersion } from './lft';
import { roundMinutes } from './rounding';
import type {
  Incident,
  IsoDate,
  JornadaType,
  LftVersion,
  Policy,
  Punch,
  Shift,
  WorkdayResult,
  WorkdayStatus,
} from './types';
import { addDays, localDateOf, localMinuteOfDay, zonedTimeToUtc } from './tz';
import { shiftCrossesMidnight } from './workday-date';

export interface CalculateWorkdayInput {
  /** Día laboral (fecha local en que empieza el turno; ver `workdayDateFor`). */
  date: IsoDate;
  /** Zona IANA de la sucursal. */
  timeZone: string;
  shift?: Shift | null;
  /** Marcajes del día laboral (en cualquier orden). */
  punches: Punch[];
  policy: Policy;
  isHoliday: boolean;
  isRestDay: boolean;
  isMinor: boolean;
  /** Permiso/vacaciones/incapacidad aprobados: sin falta. */
  isOnLeave?: boolean;
  calcVersion: string;
  /** Versión legal a usar; por defecto `resolveLftVersion(date)`. */
  lftVersion?: LftVersion;
}

interface Segment {
  start: Date;
  end: Date;
}

const MINUTE = 60_000;

function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MINUTE;
}

function sumMs(segments: Segment[]): number {
  return segments.reduce((acc, s) => acc + (s.end.getTime() - s.start.getTime()), 0);
}

/** Minutos reales (instantes UTC) entre las 20:00 y las 06:00 locales. */
export function nightMinutesBetween(start: Date, end: Date, timeZone: string): number {
  if (end <= start) return 0;
  let ms = 0;
  const last = localDateOf(end, timeZone);
  for (let d = addDays(localDateOf(start, timeZone), -1); d <= last; d = addDays(d, 1)) {
    const ws = zonedTimeToUtc(d, '20:00', timeZone).getTime();
    const we = zonedTimeToUtc(addDays(d, 1), '06:00', timeZone).getTime();
    ms += Math.max(0, Math.min(end.getTime(), we) - Math.max(start.getTime(), ws));
  }
  return Math.floor(ms / MINUTE);
}

interface Pairing {
  work: Segment[];
  breaks: Segment[];
  firstIn?: Date;
  lastOut?: Date;
  incidents: Incident[];
  open: boolean;
}

/**
 * Empareja entradas/salidas y descansos con una máquina de estados.
 * Las marcas fuera de secuencia no se descartan en silencio: generan
 * `missing_punch` para que el supervisor las revise.
 */
function pairPunches(punches: Punch[]): Pairing {
  const work: Segment[] = [];
  const breaks: Segment[] = [];
  const incidents: Incident[] = [];
  let state: 'off' | 'working' | 'on_break' = 'off';
  let openedAt: Date | undefined;
  let firstIn: Date | undefined;
  let lastOut: Date | undefined;

  for (const p of punches) {
    switch (p.type) {
      case 'in':
        if (state === 'off') {
          state = 'working';
          openedAt = p.at;
          firstIn ??= p.at;
        } else if (state === 'on_break') {
          // Entrada durante un descanso: se interpreta como fin de descanso.
          breaks.push({ start: openedAt!, end: p.at });
          incidents.push({ type: 'missing_punch', detail: `break_end faltante; se usó la entrada ${p.id}` });
          state = 'working';
          openedAt = p.at;
        }
        // Entrada repetida estando dentro: se ignora (doble toque).
        break;
      case 'break_start':
        if (state === 'working') {
          work.push({ start: openedAt!, end: p.at });
          state = 'on_break';
          openedAt = p.at;
        } else {
          incidents.push({ type: 'missing_punch', detail: `break_start ${p.id} sin entrada previa` });
        }
        break;
      case 'break_end':
        if (state === 'on_break') {
          breaks.push({ start: openedAt!, end: p.at });
          state = 'working';
          openedAt = p.at;
        } else {
          incidents.push({ type: 'missing_punch', detail: `break_end ${p.id} sin inicio de descanso` });
        }
        break;
      case 'out':
        if (state === 'working') {
          work.push({ start: openedAt!, end: p.at });
          state = 'off';
          lastOut = p.at;
        } else if (state === 'on_break') {
          breaks.push({ start: openedAt!, end: p.at });
          incidents.push({ type: 'missing_punch', detail: `break_end faltante antes de la salida ${p.id}` });
          state = 'off';
          lastOut = p.at;
        } else {
          incidents.push({ type: 'missing_punch', detail: `salida ${p.id} sin entrada` });
        }
        break;
    }
  }

  const open = state !== 'off';
  if (open) incidents.push({ type: 'missing_punch', detail: 'falta la salida (out)' });
  return { work, breaks, firstIn, lastOut, incidents, open };
}

function resolveJornada(shift: Shift | null | undefined, firstIn: Date | undefined, lastOut: Date | undefined, timeZone: string): JornadaType {
  if (shift) return shift.jornadaType ?? classifyJornada(shift.startTime, shift.endTime);
  if (firstIn && lastOut) {
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const s = localMinuteOfDay(firstIn, timeZone);
    const e = localMinuteOfDay(lastOut, timeZone);
    if (s !== e) return classifyJornada(fmt(s), fmt(e));
  }
  return 'diurna';
}

export function calculateWorkday(input: CalculateWorkdayInput): WorkdayResult {
  const { date, timeZone, shift, policy, isHoliday, isRestDay, isMinor, isOnLeave, calcVersion } = input;
  const lft = input.lftVersion ?? resolveLftVersion(date);

  // Los marcajes rechazados no cuentan; los pendientes cuentan pero se señalan.
  const punches = input.punches
    .filter((p) => p.reviewStatus !== 'rejected')
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
  const pendingPunchIds = punches.filter((p) => p.reviewStatus === 'pending').map((p) => p.id);

  const isWorkingDay = !isHoliday && !isRestDay && !isOnLeave;

  // Paso 1: horario programado en la zona de la sucursal (solo días laborables).
  let scheduledStart: Date | undefined;
  let scheduledEnd: Date | undefined;
  if (shift && isWorkingDay) {
    scheduledStart = zonedTimeToUtc(date, shift.startTime, timeZone);
    scheduledEnd = zonedTimeToUtc(shiftCrossesMidnight(shift) ? addDays(date, 1) : date, shift.endTime, timeZone);
  }

  // Paso 2: emparejar.
  const pairing = pairPunches(punches);
  const incidents: Incident[] = [...pairing.incidents];
  const { firstIn, lastOut } = pairing;

  // Paso 4: minutos trabajados y descanso.
  const punchedBreakMs = sumMs(pairing.breaks);
  let workedMs = sumMs(pairing.work);
  let breakMinutes = Math.floor(punchedBreakMs / MINUTE);
  if (shift?.paidBreak) {
    workedMs += punchedBreakMs;
  } else if (shift && shift.breakMinutes > 0 && pairing.breaks.length === 0 && !pairing.open) {
    // Descanso no pagado sin marcas: se descuenta el del turno si cabe.
    const autoMs = shift.breakMinutes * MINUTE;
    if (workedMs > autoMs) {
      workedMs -= autoMs;
      breakMinutes = shift.breakMinutes;
    }
  }
  // Paso 3: el redondeo se aplica al valor calculado, nunca a la marca.
  const workedMinutes = roundMinutes(Math.floor(workedMs / MINUTE), policy.roundingMinutes, policy.roundingMode);

  const nightMinutes = pairing.work.reduce((acc, s) => acc + nightMinutesBetween(s.start, s.end, timeZone), 0);
  const jornadaType = resolveJornada(shift, firstIn, lastOut, timeZone);

  // Paso 5: retardo, falta y salida anticipada.
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let isLate = false;
  let isAbsent = false;
  if (isWorkingDay) {
    if (punches.length === 0) {
      isAbsent = true;
      incidents.push({ type: 'absence', detail: 'sin marcajes en día laborable' });
    } else if (scheduledStart && firstIn) {
      const rawLate = Math.floor(minutesBetween(scheduledStart, firstIn));
      lateMinutes = Math.max(0, rawLate - policy.graceInMinutes);
      if (policy.absenceAfterMinutes > 0 && rawLate > policy.absenceAfterMinutes) {
        isAbsent = true;
        incidents.push({ type: 'absence', detail: `entrada ${rawLate} min tarde (umbral de falta ${policy.absenceAfterMinutes} min)` });
      } else if (lateMinutes > 0 && rawLate >= policy.lateThresholdMinutes) {
        isLate = true;
        incidents.push({ type: 'late', detail: `${lateMinutes} min después de la tolerancia` });
      }
    }
    if (scheduledEnd && lastOut && !pairing.open) {
      const rawEarly = Math.floor(minutesBetween(lastOut, scheduledEnd));
      earlyLeaveMinutes = Math.max(0, rawEarly - policy.graceOutMinutes);
      if (earlyLeaveMinutes > 0) incidents.push({ type: 'early_leave', detail: `${earlyLeaveMinutes} min antes del fin del turno` });
    }
  }

  // Paso 6: exceso diario bruto (la clasificación doble/triple es semanal).
  const overtimeMinutes = policy.overtimeMode === 'none' ? 0 : Math.max(0, workedMinutes - DAILY_MAX_MINUTES[jornadaType]);
  if (workedMinutes > lft.dailyMaxWithOvertime * 60) {
    incidents.push({ type: 'daily_limit_exceeded', detail: `${workedMinutes} min trabajados > ${lft.dailyMaxWithOvertime} h` });
  }
  if (isMinor && overtimeMinutes > 0) {
    incidents.push({ type: 'minor_overtime', detail: `${overtimeMinutes} min extra de un menor de 18 años (prohibido, art. 178 LFT)` });
  }

  let status: WorkdayStatus;
  if (isAbsent) status = 'absent';
  else if (pairing.open) status = 'incomplete';
  else if (isOnLeave) status = 'leave';
  else if (isHoliday) status = 'holiday';
  else if (isRestDay) status = 'rest';
  else if (isLate) status = 'late';
  else status = 'ok';

  return {
    date,
    scheduledStart,
    scheduledEnd,
    firstIn,
    lastOut,
    workedMinutes,
    breakMinutes,
    nightMinutes,
    lateMinutes,
    earlyLeaveMinutes,
    overtimeMinutes,
    overtimePendingApproval: policy.overtimeRequiresApproval && overtimeMinutes > 0,
    status,
    jornadaType,
    incidents,
    pendingPunchIds,
    lftValidFrom: lft.validFrom,
    calcVersion,
  };
}
