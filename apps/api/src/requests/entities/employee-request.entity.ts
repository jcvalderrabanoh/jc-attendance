import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum RequestTypeEnum {
  Vacation = 'vacation',
  Permission = 'permission',
  SickLeave = 'sick_leave',
  PunchCorrection = 'punch_correction',
  Overtime = 'overtime',
}

export enum RequestStatusEnum {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}

/** Solicitud del empleado (permisos, vacaciones, corrección de marcaje, horas extra). */
@Entity({ name: 'requests' })
@Index(['accountId', 'status'])
@Index(['employmentId', 'createdAt'])
export class EmployeeRequest extends BaseTenantEntity {
  @Column({ type: 'uuid' })
  employmentId: string;

  @Column({ type: 'varchar', length: 20 })
  type: RequestTypeEnum;

  @Column({ type: 'date' })
  fromDate: string;

  @Column({ type: 'date' })
  toDate: string;

  /** Datos según el tipo: p. ej. corrección { punchType, at, replacesPunchId }. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comment?: string | null;

  @Column({ type: 'varchar', length: 10, default: RequestStatusEnum.Pending })
  requestStatus: RequestStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  decidedByUserId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt?: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  decisionComment?: string | null;
}
