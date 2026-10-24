import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Bitácora append-only: quién cambió qué. */
@Entity({ name: 'audit_log' })
@Index(['accountId', 'at'])
@Index(['accountId', 'entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  accountId?: string | null;

  @Column({ type: 'varchar', length: 10 })
  actorType: 'user' | 'employee' | 'kiosk' | 'system';

  @Column({ type: 'uuid', nullable: true })
  actorId?: string | null;

  @Column({ type: 'varchar', length: 40 })
  entity: string;

  @Column({ type: 'uuid', nullable: true })
  entityId?: string | null;

  @Column({ type: 'varchar', length: 40 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  at: Date;
}
