import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum ReviewStatusEnum {
  Pending = 'pending',
  NeedsInfo = 'needs_info',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface RuleResult {
  ruleKey: string;
  outcome: 'pass' | 'warn' | 'fail' | 'info';
  message: string;
}

/** Solicitud de alta enviada desde una liga, con el resultado de cada regla. */
@Entity({ name: 'onboarding_requests' })
@Index(['accountId', 'reviewStatus'])
export class OnboardingRequest extends BaseTenantEntity {
  @Column({ type: 'uuid' })
  invitationId: string;

  @Column({ type: 'uuid', nullable: true })
  identityId?: string | null;

  /** Empleo creado en estado `pending`; se activa al aprobar. */
  @Column({ type: 'uuid', nullable: true })
  employmentId?: string | null;

  @Column({ type: 'jsonb' })
  submittedData: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customFields: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  validationResults: RuleResult[];

  @Column({ type: 'integer', default: 0 })
  riskScore: number;

  @Column({ type: 'varchar', length: 12, default: ReviewStatusEnum.Pending })
  reviewStatus: ReviewStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewComment?: string | null;
}
