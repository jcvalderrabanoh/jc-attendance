import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StatusForEntityEnum } from '../enums';

/**
 * Base de toda tabla de negocio: uuid, `accountId` (sin FK hacia
 * `public.accounts`, ver docs/03-arquitectura.md), estado y fechas.
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
