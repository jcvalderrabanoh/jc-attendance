import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum PayPeriodFrequencyEnum {
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Semimonthly = 'semimonthly',
  Monthly = 'monthly',
}

export enum GeofenceModeEnum {
  /** Fuera de la geocerca se registra y va a revisión (default; ver 06-cumplimiento-legal L11). */
  Alert = 'alert',
  Block = 'block',
}

/** Configuración del Checador por cuenta (1:1 con `public.accounts`, sin FK). */
@Entity({ name: 'account_settings' })
export class AccountSettings {
  @PrimaryColumn('uuid')
  accountId: string;

  /** Nombre comercial que ve el empleado (copia; la razón social vive en jc-core). */
  @Column({ type: 'varchar', length: 160, nullable: true })
  displayName?: string | null;

  @Column({ type: 'varchar', length: 64, default: 'America/Mexico_City' })
  timeZone: string;

  /** 0 = domingo … 6 = sábado. */
  @Column({ type: 'smallint', default: 1 })
  weekStartsOn: number;

  @Column({ type: 'varchar', length: 20, default: PayPeriodFrequencyEnum.Weekly })
  payPeriodFrequency: PayPeriodFrequencyEnum;

  @Column({ type: 'uuid', nullable: true })
  defaultPolicyId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultScheduleId?: string | null;

  @Column({ type: 'varchar', length: 10, default: GeofenceModeEnum.Alert })
  geofenceMode: GeofenceModeEnum;

  /** Años que se conservan los registros tras la baja (LFT 804–805 + fiscal). */
  @Column({ type: 'smallint', default: 5 })
  retentionYears: number;

  /** Texto/URL del aviso de privacidad (LFPDPPP); versión para los consentimientos. */
  @Column({ type: 'text', nullable: true })
  privacyNoticeUrl?: string | null;

  @Column({ type: 'varchar', length: 20, default: '1' })
  privacyNoticeVersion: string;

  /** Razón social, RFC y registro patronal para los PDF. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  employerData: Record<string, string>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  branding: Record<string, string>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  featureFlags: Record<string, boolean>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
