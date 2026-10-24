import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum OnboardingStatusEnum {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum PayTypeEnum {
  Hourly = 'hourly',
  Salaried = 'salaried',
}

/** Relación laboral de una identidad con una cuenta (patrón). */
@Entity({ name: 'employments' })
@Index(['accountId', 'status'])
// GIN jsonb_path_ops creado a mano en la migración inicial: TypeORM no debe tocarlo.
@Index('IDX_employments_custom_fields', { synchronize: false })
@Index(['accountId', 'identityId'], { unique: true, where: "status != 'deleted'" })
@Index(['accountId', 'employeeNumber'], { unique: true, where: "\"employeeNumber\" IS NOT NULL AND status != 'deleted'" })
export class Employment extends BaseTenantEntity {
  @Column({ type: 'uuid' })
  identityId: string;

  /** Si la persona también es usuario de jc-core (supervisor que checa). */
  @Column({ type: 'uuid', nullable: true })
  coreUserId?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  employeeNumber?: string | null;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  positionId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  managerEmploymentId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  defaultLocationId?: string | null;

  /** Sucursales donde puede checar; vacío = cualquiera de la cuenta. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  allowedLocationIds: string[];

  @Column({ type: 'uuid', nullable: true })
  scheduleId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  policyId?: string | null;

  @Column({ type: 'date', nullable: true })
  hireDate?: string | null;

  @Column({ type: 'date', nullable: true })
  terminationDate?: string | null;

  @Column({ type: 'varchar', length: 10, default: PayTypeEnum.Salaried })
  payType: PayTypeEnum;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  hourlyRate?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  dailySalary?: string | null;

  /** Menor de 18: el motor no paga horas extra y alerta (LFT). */
  @Column({ type: 'boolean', default: false })
  isMinor: boolean;

  /** PIN de kiosco (hash). */
  @Column({ type: 'varchar', length: 128, nullable: true, select: false })
  kioskPinHash?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customFields: Record<string, unknown>;

  @Column({ type: 'varchar', length: 10, default: OnboardingStatusEnum.Approved })
  onboardingStatus: OnboardingStatusEnum;
}
