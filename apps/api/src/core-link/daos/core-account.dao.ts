import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface CoreAccount {
  id: string;
  name: string;
  timeZone: string;
  status: string;
}

export interface CoreUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountId: string;
}

/**
 * ÚNICO punto que lee tablas de jc-core (`public.*`), y solo lectura. Usa
 * exactamente las columnas concedidas en `db/provision.sql`; si jc-core las
 * renombra, falla aquí y en `core-link.contract.spec.ts`, no en todo el código.
 */
@Injectable()
export class CoreAccountDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAccount(accountId: string): Promise<CoreAccount | null> {
    const rows = await this.dataSource.query(
      `SELECT "id", "name", "timeZone", "status" FROM public.accounts WHERE "id" = $1 LIMIT 1`,
      [accountId],
    );
    return rows[0] ?? null;
  }

  async hasAttendanceApp(accountId: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT 1 FROM public.account_apps
        WHERE "accountId" = $1 AND "app" = 'attendance' AND "status" = 'active'
          AND ("trialEndsAt" IS NULL OR "trialEndsAt" > now())
        LIMIT 1`,
      [accountId],
    );
    return rows.length > 0;
  }

  async findUsers(accountId: string, userIds: string[]): Promise<CoreUser[]> {
    if (userIds.length === 0) return [];
    return this.dataSource.query(
      `SELECT "id", "firstName", "lastName", "email", "accountId" FROM public.users
        WHERE "accountId" = $1 AND "id" = ANY($2::uuid[])`,
      [accountId, userIds],
    );
  }
}
