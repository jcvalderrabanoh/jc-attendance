import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum ScheduleTypeEnum {
  Fixed = 'fixed',
  Rotating = 'rotating',
  Flexible = 'flexible',
  /** Sin horario: solo cuenta horas. */
  Open = 'open',
}

@Entity({ name: 'schedules' })
@Index(['accountId', 'status'])
export class Schedule extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: ScheduleTypeEnum.Fixed })
  type: ScheduleTypeEnum;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weeklyHoursTarget?: string | null;
}
