import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ACCOUNT_HAS_APP_SQL } from '@jc/platform-sdk';
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
    const rows = await this.dataSource.query(ACCOUNT_HAS_APP_SQL, [accountId, 'attendance']);
    return rows.length > 0;
  }

  /**
   * Cuentas con el Checador contratado donde el mismo humano (email) tiene
   * usuario activo: la base del tablero de grupo empresarial.
   */
  findAttendanceAccountsForEmail(email: string): Promise<CoreAccount[]> {
    return this.dataSource.query(
      `SELECT DISTINCT a."id", a."name", a."timeZone", a."status"
         FROM public.users u
         JOIN public.accounts a ON a."id" = u."accountId"
         JOIN public.account_apps ap ON ap."accountId" = a."id" AND ap."app" = 'attendance' AND ap."status" = 'active'
        WHERE lower(u."email") = lower($1) AND u."status" = 'active'
        ORDER BY a."name"`,
      [email],
    );
  }

  listAccountUsers(accountId: string, search?: string): Promise<CoreUser[]> {
    return this.dataSource.query(
      `SELECT "id", "firstName", "lastName", "email", "accountId" FROM public.users
        WHERE "accountId" = $1 AND "status" = 'active'
          AND ($2::text IS NULL OR lower("firstName" || ' ' || "lastName" || ' ' || "email") LIKE '%' || lower($2) || '%')
        ORDER BY "firstName", "lastName" LIMIT 50`,
      [accountId, search?.trim() || null],
    );
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
