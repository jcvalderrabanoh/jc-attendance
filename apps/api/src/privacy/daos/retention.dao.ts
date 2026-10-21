import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Personas cuyos empleos, en TODAS las cuentas, terminaron hace más años que
 * la retención de cada cuenta (default 5; mínimo legal 1, LFT 804–805).
 */
@Injectable()
export class RetentionDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async identitiesPastRetention(limit = 500): Promise<string[]> {
    const rows = await this.dataSource.query(
      `SELECT i.id
         FROM "attendance"."employee_identities" i
        WHERE i.status != 'deleted'
          AND EXISTS (SELECT 1 FROM "attendance"."employments" e WHERE e."identityId" = i.id)
          AND NOT EXISTS (
            SELECT 1 FROM "attendance"."employments" e
              LEFT JOIN "attendance"."account_settings" s ON s."accountId" = e."accountId"
             WHERE e."identityId" = i.id
               AND (e."terminationDate" IS NULL
                    OR e.status = 'active'
                    OR e."terminationDate" > (now() - make_interval(years => COALESCE(s."retentionYears", 5)))::date))
        LIMIT $1`,
      [limit],
    );
    return rows.map((r: { id: string }) => r.id);
  }

  /** Anonimiza: se quitan los datos que identifican; los marcajes quedan sin dueño identificable. */
  async anonymize(identityId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "attendance"."employee_identities"
          SET "firstName" = 'Anonimizado', "lastName" = '', "phoneE164" = NULL, email = NULL, curp = NULL, rfc = NULL, nss = NULL,
              "birthDate" = NULL, "avatarKey" = NULL, status = 'deleted', "updatedAt" = now()
        WHERE id = $1`,
      [identityId],
    );
    await this.dataSource.query(
      `DELETE FROM "attendance"."punch_photos" WHERE "punchId" IN (
         SELECT p.id FROM "attendance"."punches" p JOIN "attendance"."employments" e ON e.id = p."employmentId" WHERE e."identityId" = $1)`,
      [identityId],
    );
    await this.dataSource.query(`UPDATE "attendance"."employments" SET "customFields" = '{}'::jsonb, "kioskPinHash" = NULL WHERE "identityId" = $1`, [identityId]);
  }
}
