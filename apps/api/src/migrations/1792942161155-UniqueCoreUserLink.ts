import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Un usuario de lumen-view solo puede estar enlazado a un empleado activo por
 * cuenta (`POST /punches/self` resuelve el empleo por ese usuario). Antes del
 * índice se limpian los enlaces repetidos: se queda el empleo editado más
 * recientemente y a los demás se les quita el enlace, con su registro en la
 * bitácora (`unlink_core_user`, actor `system`) para poder revisarlos.
 */
export class UniqueCoreUserLink1792942161155 implements MigrationInterface {
    name = 'UniqueCoreUserLink1792942161155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH ranked AS (
                SELECT "id", "coreUserId",
                       row_number() OVER (PARTITION BY "accountId", "coreUserId" ORDER BY "updatedAt" DESC, "createdAt" DESC, "id") AS rn
                  FROM "attendance"."employments"
                 WHERE "coreUserId" IS NOT NULL AND "status" = 'active'
            ), cleared AS (
                UPDATE "attendance"."employments" e
                   SET "coreUserId" = NULL, "updatedAt" = now()
                  FROM ranked r
                 WHERE e."id" = r."id" AND r.rn > 1
             RETURNING e."id", e."accountId", r."coreUserId"
            )
            INSERT INTO "attendance"."audit_log" ("accountId", "actorType", "entity", "entityId", "action", "before", "after")
            SELECT "accountId", 'system', 'employment', "id", 'unlink_core_user',
                   jsonb_build_object('coreUserId', "coreUserId"), jsonb_build_object('coreUserId', NULL)
              FROM cleared`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_employments_core_user" ON "attendance"."employments" ("accountId", "coreUserId") WHERE "coreUserId" IS NOT NULL AND status = 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "attendance"."IDX_employments_core_user"`);
    }

}
