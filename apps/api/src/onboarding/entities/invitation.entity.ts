import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum InvitationKindEnum {
  /** Multiuso: se comparte en un grupo, cartel o QR. */
  Open = 'open',
  /** Para una persona: teléfono o email destino. */
  Personal = 'personal',
}

/** Liga de alta. El token en claro solo se muestra al crearla; aquí va su hash. */
@Entity({ name: 'invitations' })
@Index(['tokenHash'], { unique: true })
@Index(['accountId', 'status'])
export class Invitation extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: InvitationKindEnum.Open })
  kind: InvitationKindEnum;

  @Column({ type: 'varchar', length: 128 })
  tokenHash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  targetPhone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetEmail?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultDepartmentId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultLocationId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultScheduleId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultPositionId?: string | null;

  @Column({ type: 'integer', nullable: true })
  maxUses?: number | null;

  @Column({ type: 'integer', default: 0 })
  usesCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  /** true = toda alta pasa por la cola aunque las reglas estén en verde. */
  @Column({ type: 'boolean', default: true })
  requireApproval: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  allowedEmailDomains: string[];

  /** Campos base obligatorios además de nombre y teléfono: email, curp, rfc, nss, birthDate. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  requiredFields: string[];

  @Column({ type: 'uuid' })
  createdByUserId: string;
}
