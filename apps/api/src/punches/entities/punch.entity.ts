import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum PunchTypeEnum {
  In = 'in',
  Out = 'out',
  BreakStart = 'break_start',
  BreakEnd = 'break_end',
}

export enum PunchSourceEnum {
  Pwa = 'pwa',
  Kiosk = 'kiosk',
  Web = 'web',
  Manual = 'manual',
  Auto = 'auto',
  Import = 'import',
}

export enum PunchReviewStatusEnum {
  AutoOk = 'auto_ok',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

/**
 * Marcaje. **Append-only**: nunca se actualiza ni se borra (salvo
 * `reviewStatus`). Corregir = registro nuevo con `replacesPunchId`. Cada
 * marcaje encadena el hash del anterior de la cuenta (LFT 132-XXXIV).
 */
@Entity({ name: 'punches' })
@Index(['accountId', 'employmentId', 'serverAt'])
@Index(['accountId', 'serverAt'])
@Index(['accountId', 'reviewStatus'])
@Index(['idempotencyKey'], { unique: true })
export class Punch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  employmentId: string;

  @Column({ type: 'varchar', length: 12 })
  type: PunchTypeEnum;

  @Column({ type: 'varchar', length: 10 })
  source: PunchSourceEnum;

  /** Hora del servidor al recibirlo: la oficial. */
  @Column({ type: 'timestamptz' })
  serverAt: Date;

  /** Hora del dispositivo (offline: la que cuenta, marcada como no verificada). */
  @Column({ type: 'timestamptz' })
  clientAt: Date;

  /** Momento efectivo del marcaje (serverAt, o clientAt si llegó offline). */
  @Column({ type: 'timestamptz' })
  effectiveAt: Date;

  @Column({ type: 'boolean', default: false })
  offline: boolean;

  @Column({ type: 'double precision', nullable: true })
  lat?: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng?: number | null;

  @Column({ type: 'double precision', nullable: true })
  accuracyMeters?: number | null;

  @Column({ type: 'uuid', nullable: true })
  locationId?: string | null;

  @Column({ type: 'double precision', nullable: true })
  distanceMeters?: number | null;

  @Column({ type: 'boolean', nullable: true })
  insideGeofence?: boolean | null;

  @Column({ type: 'uuid', nullable: true })
  deviceId?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  selfieKey?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  riskFlags: string[];

  @Column({ type: 'varchar', length: 10, default: PunchReviewStatusEnum.AutoOk })
  reviewStatus: PunchReviewStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  /** Corrección: este marcaje sustituye a otro (que queda `rejected`). */
  @Column({ type: 'uuid', nullable: true })
  replacesPunchId?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  reason?: string | null;

  /** Usuario de jc-core que lo capturó (manual). */
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'varchar', length: 80 })
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customFields: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  prevHash?: string | null;

  @Column({ type: 'varchar', length: 64 })
  hash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
