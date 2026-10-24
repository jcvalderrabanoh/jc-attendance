import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ConsentKindEnum {
  PrivacyNotice = 'privacy_notice',
  Geolocation = 'geolocation',
  Biometric = 'biometric',
}

/** Evidencia de consentimiento (LFPDPPP): quién, qué versión, cuándo y desde dónde. */
@Entity({ name: 'consents' })
@Index(['identityId', 'accountId', 'kind'])
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  identityId: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar', length: 20 })
  kind: ConsentKindEnum;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @CreateDateColumn({ type: 'timestamptz' })
  grantedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent?: string | null;
}
