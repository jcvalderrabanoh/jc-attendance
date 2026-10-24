import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum CustomFieldEntityEnum {
  Employment = 'employment',
  Location = 'location',
  Punch = 'punch',
  Request = 'request',
}

export enum CustomFieldTypeEnum {
  Text = 'text',
  Number = 'number',
  Date = 'date',
  Select = 'select',
  MultiSelect = 'multiselect',
  Boolean = 'boolean',
  Email = 'email',
  Phone = 'phone',
  Curp = 'curp',
  Rfc = 'rfc',
}

export interface CustomFieldValidation {
  regex?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Campo personalizado de una cuenta. Los valores viven en el JSONB
 * `customFields` de la entidad; `key` es inmutable una vez creada.
 */
@Entity({ name: 'custom_field_definitions' })
@Index(['accountId', 'entity', 'key'], { unique: true, where: "status != 'deleted'" })
export class CustomFieldDefinition extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 20 })
  entity: CustomFieldEntityEnum;

  @Column({ type: 'varchar', length: 60 })
  key: string;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  @Column({ type: 'varchar', length: 20 })
  type: CustomFieldTypeEnum;

  /** Opciones para select / multiselect. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  options: string[];

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  validation: CustomFieldValidation;

  @Column({ type: 'boolean', default: true })
  visibleToEmployee: boolean;

  @Column({ type: 'boolean', default: false })
  editableByEmployee: boolean;

  /** Se pide en el formulario de alta por liga. */
  @Column({ type: 'boolean', default: false })
  askOnOnboarding: boolean;

  @Column({ type: 'boolean', default: true })
  showInReports: boolean;

  /** Se puede usar como dimensión en gráficos. */
  @Column({ type: 'boolean', default: false })
  chartable: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;
}
