import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ReportTypeEnum {
  Timesheet = 'timesheet',
  DailyAttendance = 'daily_attendance',
  Incidents = 'incidents',
  Overtime = 'overtime',
  /** Registro de jornada para la autoridad (LFT 132-XXXIV). */
  LegalRecord = 'legal_record',
  Payroll = 'payroll',
}

export enum ReportFormatEnum {
  Pdf = 'pdf',
  Xlsx = 'xlsx',
  Csv = 'csv',
}

export enum ReportJobStatusEnum {
  Queued = 'queued',
  Running = 'running',
  Done = 'done',
  Failed = 'failed',
}

@Entity({ name: 'report_jobs' })
@Index(['accountId', 'createdAt'])
export class ReportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar', length: 20 })
  type: ReportTypeEnum;

  @Column({ type: 'varchar', length: 5 })
  format: ReportFormatEnum;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  params: Record<string, unknown>;

  @Column({ type: 'varchar', length: 10, default: ReportJobStatusEnum.Queued })
  jobStatus: ReportJobStatusEnum;

  /** Archivo generado (bytea en el MVP; S3 en producción). */
  @Column({ type: 'bytea', nullable: true, select: false })
  file?: Buffer | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  fileName?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sha256?: string | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'uuid' })
  requestedByUserId: string;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
