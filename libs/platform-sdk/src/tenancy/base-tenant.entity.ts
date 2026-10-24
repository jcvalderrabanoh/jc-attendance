import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StatusForEntityEnum } from './status-for-entity.enum';

/**
 * Base de toda tabla de negocio: uuid, `accountId` (sin FK hacia
 * `public.accounts`: cada producto vive en su esquema, ADR-001), estado y fechas.
 */
export abstract class BaseTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar', length: 20, default: StatusForEntityEnum.Active })
  status: StatusForEntityEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
