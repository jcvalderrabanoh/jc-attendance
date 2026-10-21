import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum GeofenceKindEnum {
  Circle = 'circle',
  Polygon = 'polygon',
  /** Sin geocerca: empleados móviles; se registra la ubicación pero no se valida. */
  None = 'none',
}

/** Sucursal / centro de trabajo. La geocerca va embebida (una por sucursal en el MVP). */
@Entity({ name: 'locations' })
@Index(['accountId', 'status'])
// GIN jsonb_path_ops creado a mano en la migración inicial: TypeORM no debe tocarlo.
@Index('IDX_locations_custom_fields', { synchronize: false })
export class Location extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  code?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address?: string | null;

  @Column({ type: 'double precision', nullable: true })
  lat?: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng?: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timeZone?: string | null;

  @Column({ type: 'varchar', length: 10, default: GeofenceKindEnum.Circle })
  geofenceKind: GeofenceKindEnum;

  @Column({ type: 'integer', default: 150 })
  radiusMeters: number;

  /** Polígono como lista de [lng, lat] (GeoJSON ring). */
  @Column({ type: 'jsonb', nullable: true })
  polygon?: [number, number][] | null;

  /** Precisión GPS máxima aceptada (m); peor precisión ⇒ marcaje a revisión. */
  @Column({ type: 'integer', default: 100 })
  maxAccuracyMeters: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  allowedIpCidrs: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customFields: Record<string, unknown>;
}
