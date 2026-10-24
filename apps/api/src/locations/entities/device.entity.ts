import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum DeviceKindEnum {
  Kiosk = 'kiosk',
  Personal = 'personal',
}

/**
 * Kiosco (tablet en sucursal) o dispositivo de confianza de un empleado.
 * El kiosco firma su QR rotativo con `secret` (TOTP).
 */
@Entity({ name: 'devices' })
@Index(['accountId', 'kind', 'status'])
export class Device extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 10 })
  kind: DeviceKindEnum;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  locationId?: string | null;

  /** Para dispositivos personales: identidad dueña. */
  @Column({ type: 'uuid', nullable: true })
  identityId?: string | null;

  /** Código de activación de un kiosco (hash); se borra al activarlo. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  activationCodeHash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  activationExpiresAt?: Date | null;

  /** Secreto TOTP del QR rotativo (kiosco). */
  @Column({ type: 'varchar', length: 128, nullable: true, select: false })
  secret?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date | null;
}
