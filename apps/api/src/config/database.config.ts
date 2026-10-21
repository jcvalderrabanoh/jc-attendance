import * as dotenv from 'dotenv';
import { DataSourceOptions } from 'typeorm';

dotenv.config();

/**
 * Esquema propio dentro de la BD de jc-core. Todo lo del Checador vive aquí;
 * `public.*` es de jc-core y solo se lee (ver `core-link/`).
 */
export const ATTENDANCE_SCHEMA = 'attendance';

/**
 * Tabla de migraciones propia y dentro del esquema: TypeORM la construye con
 * `buildTableName(migrationsTableName, schema)`, así que nunca toca
 * `public.migrations` de jc-core.
 */
export const ATTENDANCE_MIGRATIONS_TABLE = 'attendance_migrations';

export function buildDataSourceOptions(
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'jc_core',
    schema: ATTENDANCE_SCHEMA,
    migrationsTableName: ATTENDANCE_MIGRATIONS_TABLE,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    migrations: [__dirname + '/../migrations/*.{js,ts}'],
    // gen_random_uuid() es nativo desde PG13: el rol del Checador no necesita crear extensiones.
    uuidExtension: 'pgcrypto',
    synchronize: false,
    migrationsRun: false,
    // Pool acotado: compartimos instancia con jc-core.
    extra: { max: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10), statement_timeout: 15000 },
    ...overrides,
  } as DataSourceOptions;
}
