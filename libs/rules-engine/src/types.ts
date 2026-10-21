/**
 * Tipos públicos del motor de cálculo de jornada.
 * Reflejan las tablas `punches`, `shifts`, `policies`, `lft_versions` y
 * `workdays` del esquema `attendance` (docs/04-modelo-de-datos.md).
 */

/** Fecha local en formato ISO `YYYY-MM-DD`. */
export type IsoDate = string;
/** Hora local de reloj en formato `HH:mm` (24 h). */
export type WallTime = string;

export type PunchType = 'in' | 'out' | 'break_start' | 'break_end';
export type PunchReviewStatus = 'auto_ok' | 'pending' | 'approved' | 'rejected';

/** Marcaje (siempre en UTC; append-only, el motor nunca lo modifica). */
export interface Punch {
  id: string;
  type: PunchType;
  /** Instante UTC (`serverAt`). */
  at: Date;
  /** Sin valor equivale a `auto_ok`. */
  reviewStatus?: PunchReviewStatus;
}

export type JornadaType = 'diurna' | 'nocturna' | 'mixta';

/** Turno asignado para el día laboral. */
export interface Shift {
  startTime: WallTime;
  endTime: WallTime;
  /** El turno termina al día siguiente (p. ej. 22:00–06:00). */
  crossesMidnight: boolean;
  breakMinutes: number;
  paidBreak: boolean;
  /** Si no se indica se clasifica con `classifyJornada(startTime, endTime)`. */
  jornadaType?: JornadaType;
}

export type RoundingMode = 'none' | 'nearest' | 'up' | 'down';
export type OvertimeMode = 'LFT_MX' | 'daily' | 'weekly' | 'none';

/** Política efectiva (la más específica de `policy_assignments`). */
export interface Policy {
  /** Tolerancia de entrada: minutos tras la hora programada sin retardo. */
  graceInMinutes: number;
  /** Tolerancia de salida: minutos antes del fin sin salida anticipada. */
  graceOutMinutes: number;
  /** Paso de redondeo de los minutos trabajados (0/1 = sin redondeo). */
  roundingMinutes: number;
  roundingMode: RoundingMode;
  /** Retardo mínimo (desde la hora programada) para marcar el día como `late`. */
  lateThresholdMinutes: number;
  /** Minutos tras la hora programada a partir de los cuales la entrada es falta (0 = desactivado). */
  absenceAfterMinutes: number;
  overtimeMode: OvertimeMode;
  overtimeRequiresApproval: boolean;
  sundayPremium: boolean;
}

/** Parámetros legales vigentes desde una fecha (tabla global `lft_versions`). */
export interface LftVersion {
  validFrom: IsoDate;
  /** Límite de la jornada semanal, en horas. */
  weeklyHoursLimit: number;
  /** Horas extra semanales que se pagan dobles. */
  weeklyDoubleOvertimeCap: number;
  /** Horas extra semanales triples permitidas (más allá: alerta). */
  weeklyTripleOvertimeCap: number;
  /** Jornada + horas extra máximas por día, en horas. */
  dailyMaxWithOvertime: number;
}

export type WorkdayStatus = 'ok' | 'late' | 'absent' | 'incomplete' | 'holiday' | 'rest' | 'leave';

export type IncidentType =
  | 'late'
  | 'absence'
  | 'missing_punch'
  | 'early_leave'
  | 'daily_limit_exceeded'
  | 'minor_overtime';

export interface Incident {
  type: IncidentType;
  detail?: string;
}

/** Resultado de un día laboral (se persiste en `workdays`). */
export interface WorkdayResult {
  date: IsoDate;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  /** Marca real, sin tolerancia ni redondeo. */
  firstIn?: Date;
  /** Marca real, sin tolerancia ni redondeo. */
  lastOut?: Date;
  workedMinutes: number;
  breakMinutes: number;
  nightMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  /** Exceso diario bruto sobre la jornada máxima de su tipo (aún sin clasificar en dobles/triples). */
  overtimeMinutes: number;
  /** `true` si la política exige aprobación y hay tiempo extra. */
  overtimePendingApproval: boolean;
  status: WorkdayStatus;
  jornadaType: JornadaType;
  incidents: Incident[];
  /** Marcajes en revisión (`pending`) que se contaron en el cálculo. */
  pendingPunchIds: string[];
  /** `validFrom` de la versión LFT usada (equivale a `lftVersionId`). */
  lftValidFrom: IsoDate;
  calcVersion: string;
}
