import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Selfie del marcaje. Separada de `punches` para no cargarla en los listados. */
@Entity({ name: 'punch_photos' })
@Index(['punchId'], { unique: true })
export class PunchPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  punchId: string;

  @Column({ type: 'varchar', length: 30 })
  mimeType: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
