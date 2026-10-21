import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum RuleSeverityEnum {
  Block = 'block',
  Warn = 'warn',
}

/** Configuración por cuenta de una regla de validación de alta (ver docs/05). */
@Entity({ name: 'onboarding_rules' })
@Index(['accountId', 'ruleKey'], { unique: true, where: "status != 'deleted'" })
export class OnboardingRule extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 40 })
  ruleKey: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'varchar', length: 5 })
  severity: RuleSeverityEnum;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  config: Record<string, unknown>;
}
