import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum WorkdayStatusEnum {
  Ok = 'ok',
  Late = 'late',
  Absent = 'absent',
  Incomplete = 'incomplete',
  Holiday = 'holiday',
  Rest = 'rest',
  Leave = 'leave',
}

/** Jornada calculada por el motor (`@jc-attendance/rules-engine`), una por empleado y día laboral. */
@Entity({ name: 'workdays' })
@Index(['employmentId', 'date'], { unique: true })
@Index(['accountId', 'date'])
export class Workday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  employmentId: string;

  /** Fecha laboral local (la del inicio del turno). */
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledStart?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledEnd?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  firstIn?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastOut?: Date | null;

  @Column({ type: 'integer', default: 0 })
  workedMinutes: number;

  @Column({ type: 'integer', default: 0 })
  breakMinutes: number;

  @Column({ type: 'integer', default: 0 })
  nightMinutes: number;

  @Column({ type: 'integer', default: 0 })
  lateMinutes: number;

  @Column({ type: 'integer', default: 0 })
  earlyLeaveMinutes: number;

  /** Exceso diario sobre la jornada máxima (antes del reparto semanal). */
  @Column({ type: 'integer', default: 0 })
  overtimeMinutes: number;

  @Column({ type: 'integer', default: 0 })
  overtimeDoubleMinutes: number;

  @Column({ type: 'integer', default: 0 })
  overtimeTripleMinutes: number;

  @Column({ type: 'varchar', length: 12 })
  status: WorkdayStatusEnum;

  @Column({ type: 'varchar', length: 8, nullable: true })
  jornadaType?: string | null;

  @Column({ type: 'boolean', default: false })
  isHoliday: boolean;

  @Column({ type: 'boolean', default: false })
  isRestDay: boolean;

  @Column({ type: 'boolean', default: false })
  hasPendingPunches: boolean;

  /** Cerrado por cierre de periodo: ya no se recalcula. */
  @Column({ type: 'boolean', default: false })
  locked: boolean;

  @Column({ type: 'varchar', length: 20 })
  calcVersion: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
