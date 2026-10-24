import { MigrationInterface, QueryRunner } from "typeorm";

export class PunchPhotos1792542962259 implements MigrationInterface {
    name = 'PunchPhotos1792542962259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attendance"."punch_photos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "punchId" uuid NOT NULL, "mimeType" character varying(30) NOT NULL, "data" bytea NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_983f56272ea69fffda30914225c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2cd463edce53780bb919da1c5c" ON "attendance"."punch_photos" ("punchId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "attendance"."IDX_2cd463edce53780bb919da1c5c"`);
        await queryRunner.query(`DROP TABLE "attendance"."punch_photos"`);
    }

}
