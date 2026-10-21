import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Día festivo de una cuenta (se precargan los del art. 74 LFT). */
@Entity({ name: 'holidays' })
@Index(['accountId', 'date'], { unique: true })
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'boolean', default: true })
  mandatory: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
