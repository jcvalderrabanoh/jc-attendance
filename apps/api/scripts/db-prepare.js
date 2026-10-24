// Desarrollo/CI: crea el esquema si no existe para que TypeORM pueda crear su
// tabla de migraciones dentro de él. En producción lo hace db/provision.sql.
require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'jc_core',
  });
  await client.connect();
  await client.query('CREATE SCHEMA IF NOT EXISTS attendance');
  await client.end();
  console.log('Esquema attendance listo');
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
