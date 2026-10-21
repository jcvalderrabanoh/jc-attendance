import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap-app';
import { OTP_SENDER, OtpSender } from '../src/employee-auth/providers';
import { buildDataSourceOptions } from '../src/config';

process.env.JWT_SECRET = 'e2e-core-secret';
process.env.EMPLOYEE_JWT_SECRET = 'e2e-employee-secret';
process.env.DISABLE_JOBS = 'true';
process.env.REPORTS_INLINE = 'true';

/** Captura los códigos OTP en lugar de enviarlos. */
export class CapturingOtpSender implements OtpSender {
  readonly managesCode = false;
  readonly codes = new Map<string, string>();
  async send(destination: string, _channel: unknown, code?: string): Promise<void> {
    this.codes.set(destination, code!);
  }
}

export async function resetDatabase(): Promise<void> {
  const ds = new DataSource(buildDataSourceOptions({ migrations: [__dirname + '/../src/migrations/[0-9]*-*.ts'], entities: [] }));
  await ds.initialize();
  await ds.query('DROP SCHEMA IF EXISTS attendance CASCADE');
  await ds.query('CREATE SCHEMA attendance');
  // Réplica mínima de jc-core (solo lo que el Checador lee).
  await ds.query(require('fs').readFileSync(__dirname + '/fixtures/jc-core-public.sql', 'utf8'));
  await ds.query('TRUNCATE public.accounts, public.users, public.account_apps');
  await ds.runMigrations();
  await ds.destroy();
}

export async function createApp(): Promise<{ app: INestApplication; otp: CapturingOtpSender; ds: DataSource }> {
  const otp = new CapturingOtpSender();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(OTP_SENDER).useValue(otp).compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return { app, otp, ds: app.get(DataSource) };
}

/** Cuenta de jc-core con el Checador contratado y un usuario admin. */
export async function seedCoreAccount(ds: DataSource, opts: { withApp?: boolean; name?: string } = {}) {
  const [account] = await ds.query(`INSERT INTO public.accounts (name) VALUES ($1) RETURNING id`, [opts.name ?? 'Panadería La Espiga']);
  const [user] = await ds.query(`INSERT INTO public.users ("firstName","lastName",email,"accountId") VALUES ('Rosa','Admin','rosa@espiga.mx',$1) RETURNING id`, [account.id]);
  if (opts.withApp !== false) await ds.query(`INSERT INTO public.account_apps ("accountId", app) VALUES ($1, 'attendance')`, [account.id]);
  return { accountId: account.id as string, userId: user.id as string };
}

/** Token como el que emite jc-core (aquí con app lumen-view: mismo usuario en todos los sistemas). */
export function coreToken(accountId: string, userId: string, role = 'admin', app = 'lumen-view'): string {
  return jwt.sign({ userId, email: 'rosa@espiga.mx', accountId, role, permissions: [], app }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}
