/** Un marcaje nuevo o revisado: hay que recalcular la jornada. */
export const PUNCH_CHANGED_EVENT = 'attendance.punch.changed';

export interface PunchChangedPayload {
  accountId: string;
  employmentId: string;
  /** Instante efectivo del marcaje (para ubicar el día laboral). */
  at: Date;
}
