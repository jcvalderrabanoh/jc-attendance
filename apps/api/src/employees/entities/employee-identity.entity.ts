import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StatusForEntityEnum } from '../../common';

/**
 * Un humano, una vez, sin importar para cuántos patrones trabaje. Se
 * identifica por teléfono (E.164) y/o email; los datos laborales por cuenta
 * van en `employments`. No es un usuario de jc-core.
 */
@Entity({ name: 'employee_identities' })
@Index(['phoneE164'], { unique: true, where: "\"phoneE164\" IS NOT NULL AND status != 'deleted'" })
@Index(['email'], { unique: true, where: "email IS NOT NULL AND status != 'deleted'" })
@Index(['curp'])
export class EmployeeIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneE164?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ type: 'varchar', length: 120 })
  firstName: string;

  @Column({ type: 'varchar', length: 120 })
  lastName: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  curp?: string | null;

  @Column({ type: 'varchar', length: 13, nullable: true })
  rfc?: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  nss?: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarKey?: string | null;

  @Column({ type: 'varchar', length: 10, default: 'es-MX' })
  locale: string;

  @Column({ type: 'varchar', length: 20, default: StatusForEntityEnum.Active })
  status: StatusForEntityEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
