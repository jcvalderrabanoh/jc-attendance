import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum OtpChannelEnum {
  Sms = 'sms',
  Whatsapp = 'whatsapp',
  Email = 'email',
}

/** Código de un solo uso para entrar sin contraseña. */
@Entity({ name: 'otp_challenges' })
@Index(['destination', 'createdAt'])
export class OtpChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Teléfono E.164 o email normalizado. */
  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ type: 'varchar', length: 10 })
  channel: OtpChannelEnum;

  @Column({ type: 'varchar', length: 128 })
  codeHash: string;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
