import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Turno de un día de la semana dentro de un horario fijo. */
@Entity({ name: 'shifts' })
@Index(['scheduleId', 'dayOfWeek'])
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  scheduleId: string;

  /** 0 = domingo … 6 = sábado. */
  @Column({ type: 'smallint' })
  dayOfWeek: number;

  /** HH:mm */
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @Column({ type: 'boolean', default: false })
  crossesMidnight: boolean;

  @Column({ type: 'smallint', default: 0 })
  breakMinutes: number;

  @Column({ type: 'boolean', default: false })
  paidBreak: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
