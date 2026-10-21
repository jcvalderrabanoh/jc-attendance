import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

/** DataSource para el CLI de TypeORM (`npm run migration:run`). */
export default new DataSource(buildDataSourceOptions());
