import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Periodo de pago. Al cerrarlo sus jornadas quedan `locked`. */
@Entity({ name: 'pay_periods' })
@Index(['accountId', 'startDate'], { unique: true })
export class PayPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  closedByUserId?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
