import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum IncidentTypeEnum {
  Late = 'late',
  Absence = 'absence',
  MissingPunch = 'missing_punch',
  EarlyLeave = 'early_leave',
  OutOfGeofence = 'out_of_geofence',
  DailyLimitExceeded = 'daily_limit_exceeded',
  MinorOvertime = 'minor_overtime',
  WeeklyTripleCapExceeded = 'weekly_triple_cap_exceeded',
}

export enum IncidentStatusEnum {
  Open = 'open',
  Justified = 'justified',
  Dismissed = 'dismissed',
}

@Entity({ name: 'incidents' })
@Index(['accountId', 'date'])
@Index(['employmentId', 'date', 'type'], { unique: true })
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  employmentId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 30 })
  type: IncidentTypeEnum;

  @Column({ type: 'varchar', length: 300, nullable: true })
  detail?: string | null;

  @Column({ type: 'varchar', length: 10, default: IncidentStatusEnum.Open })
  status: IncidentStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  justificationRequestId?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
