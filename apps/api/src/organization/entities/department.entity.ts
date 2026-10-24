import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

@Entity({ name: 'departments' })
@Index(['accountId', 'status'])
export class Department extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  code?: string | null;

  /** Departamentos jerárquicos (área › subárea). */
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;
}
