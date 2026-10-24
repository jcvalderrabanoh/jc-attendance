import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

@Entity({ name: 'positions' })
@Index(['accountId', 'status'])
export class Position extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  code?: string | null;
}
