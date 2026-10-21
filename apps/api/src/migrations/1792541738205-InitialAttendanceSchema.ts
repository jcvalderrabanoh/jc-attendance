import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Esquema inicial del Checador. Todo en `attendance`; ninguna sentencia toca
 * `public` (lo vigila `migrations.guard.spec.ts`).
 */

export class InitialAttendanceSchema1792541738205 implements MigrationInterface {
    name = 'InitialAttendanceSchema1792541738205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "attendance"`);
        await queryRunner.query(`CREATE TABLE "attendance"."workdays" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "employmentId" uuid NOT NULL, "date" date NOT NULL, "scheduledStart" TIMESTAMP WITH TIME ZONE, "scheduledEnd" TIMESTAMP WITH TIME ZONE, "firstIn" TIMESTAMP WITH TIME ZONE, "lastOut" TIMESTAMP WITH TIME ZONE, "workedMinutes" integer NOT NULL DEFAULT '0', "breakMinutes" integer NOT NULL DEFAULT '0', "nightMinutes" integer NOT NULL DEFAULT '0', "lateMinutes" integer NOT NULL DEFAULT '0', "earlyLeaveMinutes" integer NOT NULL DEFAULT '0', "overtimeMinutes" integer NOT NULL DEFAULT '0', "overtimeDoubleMinutes" integer NOT NULL DEFAULT '0', "overtimeTripleMinutes" integer NOT NULL DEFAULT '0', "status" character varying(12) NOT NULL, "jornadaType" character varying(8), "isHoliday" boolean NOT NULL DEFAULT false, "isRestDay" boolean NOT NULL DEFAULT false, "hasPendingPunches" boolean NOT NULL DEFAULT false, "locked" boolean NOT NULL DEFAULT false, "calcVersion" character varying(20) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1666e414b295cdbf06339119681" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe763eb813a53048b30bee7266" ON "attendance"."workdays" ("accountId", "date") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_73cb249b34422b5a80d62099dc" ON "attendance"."workdays" ("employmentId", "date") `);
        await queryRunner.query(`CREATE TABLE "attendance"."pay_periods" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "closedAt" TIMESTAMP WITH TIME ZONE, "closedByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1eb133b5947dd46710dc78b94d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9a5ebcc845570bfee452bfbd0f" ON "attendance"."pay_periods" ("accountId", "startDate") `);
        await queryRunner.query(`CREATE TABLE "attendance"."incidents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "employmentId" uuid NOT NULL, "date" date NOT NULL, "type" character varying(30) NOT NULL, "detail" character varying(300), "status" character varying(10) NOT NULL DEFAULT 'open', "justificationRequestId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d5c6815d9044cca40d5f4d9abf" ON "attendance"."incidents" ("employmentId", "date", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_f265fa59a749551fc8444011ce" ON "attendance"."incidents" ("accountId", "date") `);
        await queryRunner.query(`CREATE TABLE "attendance"."shifts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "scheduleId" uuid NOT NULL, "dayOfWeek" smallint NOT NULL, "startTime" character varying(5) NOT NULL, "endTime" character varying(5) NOT NULL, "crossesMidnight" boolean NOT NULL DEFAULT false, "breakMinutes" smallint NOT NULL DEFAULT '0', "paidBreak" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7a7eb0caa7dee4776e93759b41" ON "attendance"."shifts" ("scheduleId", "dayOfWeek") `);
        await queryRunner.query(`CREATE TABLE "attendance"."schedules" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "type" character varying(10) NOT NULL DEFAULT 'fixed', "weeklyHoursTarget" numeric(5,2), CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_920f717913da8c9e021240a646" ON "attendance"."schedules" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."policies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "graceInMinutes" smallint NOT NULL DEFAULT '10', "graceOutMinutes" smallint NOT NULL DEFAULT '0', "roundingMinutes" smallint NOT NULL DEFAULT '0', "roundingMode" character varying(10) NOT NULL DEFAULT 'none', "lateThresholdMinutes" smallint NOT NULL DEFAULT '10', "absenceAfterMinutes" smallint NOT NULL DEFAULT '120', "earlyClockInMinutes" smallint NOT NULL DEFAULT '60', "autoClockOutAfterHours" smallint NOT NULL DEFAULT '14', "requireSelfie" boolean NOT NULL DEFAULT false, "requireGeofence" boolean NOT NULL DEFAULT true, "requireQr" boolean NOT NULL DEFAULT false, "allowOffline" boolean NOT NULL DEFAULT true, "maxOfflineHours" smallint NOT NULL DEFAULT '24', "overtimeMode" character varying(10) NOT NULL DEFAULT 'LFT_MX', "overtimeRequiresApproval" boolean NOT NULL DEFAULT true, "sundayPremium" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_603e09f183df0108d8695c57e28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bc1e8fafbf5eca77f01b7e47c0" ON "attendance"."policies" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."holidays" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "date" date NOT NULL, "name" character varying(120) NOT NULL, "mandatory" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_41e30507b13d06e3207097c4c4" ON "attendance"."holidays" ("accountId", "date") `);
        await queryRunner.query(`CREATE TABLE "attendance"."requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "employmentId" uuid NOT NULL, "type" character varying(20) NOT NULL, "fromDate" date NOT NULL, "toDate" date NOT NULL, "payload" jsonb NOT NULL DEFAULT '{}', "comment" character varying(500), "requestStatus" character varying(10) NOT NULL DEFAULT 'pending', "decidedByUserId" uuid, "decidedAt" TIMESTAMP WITH TIME ZONE, "decisionComment" character varying(500), CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1cc583c77a7b02bb4693139de8" ON "attendance"."requests" ("employmentId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef41bf2af586baa4112c050a68" ON "attendance"."requests" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."report_jobs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "type" character varying(20) NOT NULL, "format" character varying(5) NOT NULL, "params" jsonb NOT NULL DEFAULT '{}', "jobStatus" character varying(10) NOT NULL DEFAULT 'queued', "file" bytea, "fileName" character varying(160), "sha256" character varying(64), "error" text, "requestedByUserId" uuid NOT NULL, "finishedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0c1416b1e9ba757ceae79b598e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b2196aec79559360efca5efd0" ON "attendance"."report_jobs" ("accountId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "attendance"."punches" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "employmentId" uuid NOT NULL, "type" character varying(12) NOT NULL, "source" character varying(10) NOT NULL, "serverAt" TIMESTAMP WITH TIME ZONE NOT NULL, "clientAt" TIMESTAMP WITH TIME ZONE NOT NULL, "effectiveAt" TIMESTAMP WITH TIME ZONE NOT NULL, "offline" boolean NOT NULL DEFAULT false, "lat" double precision, "lng" double precision, "accuracyMeters" double precision, "locationId" uuid, "distanceMeters" double precision, "insideGeofence" boolean, "deviceId" uuid, "selfieKey" character varying(512), "ip" character varying(64), "riskFlags" jsonb NOT NULL DEFAULT '[]', "reviewStatus" character varying(10) NOT NULL DEFAULT 'auto_ok', "reviewedByUserId" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "replacesPunchId" uuid, "reason" character varying(300), "createdByUserId" uuid, "idempotencyKey" character varying(80) NOT NULL, "customFields" jsonb NOT NULL DEFAULT '{}', "prevHash" character varying(64), "hash" character varying(64) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ebaa308a35cce0eeab51b314bd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00ca448c2940f4b3c09fd6beee" ON "attendance"."punches" ("idempotencyKey") `);
        await queryRunner.query(`CREATE INDEX "IDX_2de447f850058d920ce208631e" ON "attendance"."punches" ("accountId", "reviewStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f044424e47af43fc7ef106469" ON "attendance"."punches" ("accountId", "serverAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f1c768095fadf29cc49c87d4b" ON "attendance"."punches" ("accountId", "employmentId", "serverAt") `);
        await queryRunner.query(`CREATE TABLE "attendance"."positions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "code" character varying(40), CONSTRAINT "PK_17e4e62ccd5749b289ae3fae6f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f439b60944cc8e912958e2c65c" ON "attendance"."positions" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."account_settings" ("accountId" uuid NOT NULL, "displayName" character varying(160), "timeZone" character varying(64) NOT NULL DEFAULT 'America/Mexico_City', "weekStartsOn" smallint NOT NULL DEFAULT '1', "payPeriodFrequency" character varying(20) NOT NULL DEFAULT 'weekly', "defaultPolicyId" uuid, "defaultScheduleId" uuid, "geofenceMode" character varying(10) NOT NULL DEFAULT 'alert', "retentionYears" smallint NOT NULL DEFAULT '5', "privacyNoticeUrl" text, "privacyNoticeVersion" character varying(20) NOT NULL DEFAULT '1', "employerData" jsonb NOT NULL DEFAULT '{}', "branding" jsonb NOT NULL DEFAULT '{}', "featureFlags" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5f6da99108625c1b2e83455261b" PRIMARY KEY ("accountId"))`);
        await queryRunner.query(`CREATE TABLE "attendance"."departments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "code" character varying(40), "parentId" uuid, CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8f2d2c7641c87479416f85e1df" ON "attendance"."departments" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."onboarding_rules" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ruleKey" character varying(40) NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "severity" character varying(5) NOT NULL, "config" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_8017de6c26d6914a08a99c2c9ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aa32d4c8f26c68a20d27b55e3e" ON "attendance"."onboarding_rules" ("accountId", "ruleKey") WHERE status != 'deleted'`);
        await queryRunner.query(`CREATE TABLE "attendance"."onboarding_requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "invitationId" uuid NOT NULL, "identityId" uuid, "employmentId" uuid, "submittedData" jsonb NOT NULL, "customFields" jsonb NOT NULL DEFAULT '{}', "validationResults" jsonb NOT NULL DEFAULT '[]', "riskScore" integer NOT NULL DEFAULT '0', "reviewStatus" character varying(12) NOT NULL DEFAULT 'pending', "reviewedByUserId" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewComment" text, CONSTRAINT "PK_ddddb9f1a805840ae5996d9afaf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bfe7d1549b6ae0daf4db6c6ba4" ON "attendance"."onboarding_requests" ("accountId", "reviewStatus") `);
        await queryRunner.query(`CREATE TABLE "attendance"."invitations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "kind" character varying(10) NOT NULL DEFAULT 'open', "tokenHash" character varying(128) NOT NULL, "targetPhone" character varying(20), "targetEmail" character varying(255), "defaultDepartmentId" uuid, "defaultLocationId" uuid, "defaultScheduleId" uuid, "defaultPositionId" uuid, "maxUses" integer, "usesCount" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP WITH TIME ZONE, "requireApproval" boolean NOT NULL DEFAULT true, "allowedEmailDomains" jsonb NOT NULL DEFAULT '[]', "requiredFields" jsonb NOT NULL DEFAULT '[]', "createdByUserId" uuid NOT NULL, CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ce513977f1a0b5d04432fc82a4" ON "attendance"."invitations" ("accountId", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a6eb6f2543de8a5a4c148b32a1" ON "attendance"."invitations" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "attendance"."locations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "code" character varying(40), "address" character varying(300), "lat" double precision, "lng" double precision, "timeZone" character varying(64), "geofenceKind" character varying(10) NOT NULL DEFAULT 'circle', "radiusMeters" integer NOT NULL DEFAULT '150', "polygon" jsonb, "maxAccuracyMeters" integer NOT NULL DEFAULT '100', "allowedIpCidrs" jsonb NOT NULL DEFAULT '[]', "customFields" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_08e47beb6937a954addfd8d29e" ON "attendance"."locations" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."devices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "kind" character varying(10) NOT NULL, "name" character varying(120) NOT NULL, "locationId" uuid, "identityId" uuid, "activationCodeHash" character varying(128), "activationExpiresAt" TIMESTAMP WITH TIME ZONE, "secret" character varying(128), "activatedAt" TIMESTAMP WITH TIME ZONE, "lastSeenAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2a08e760b77a1f2ec9b12074bf" ON "attendance"."devices" ("accountId", "kind", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."employments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "identityId" uuid NOT NULL, "coreUserId" uuid, "employeeNumber" character varying(40), "departmentId" uuid, "positionId" uuid, "managerEmploymentId" uuid, "defaultLocationId" uuid, "allowedLocationIds" jsonb NOT NULL DEFAULT '[]', "scheduleId" uuid, "policyId" uuid, "hireDate" date, "terminationDate" date, "payType" character varying(10) NOT NULL DEFAULT 'salaried', "hourlyRate" numeric(12,2), "dailySalary" numeric(12,2), "isMinor" boolean NOT NULL DEFAULT false, "kioskPinHash" character varying(128), "customFields" jsonb NOT NULL DEFAULT '{}', "onboardingStatus" character varying(10) NOT NULL DEFAULT 'approved', CONSTRAINT "PK_208f1abe9b236e156e33f9eeb58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5499e7673e0396fe6422a0da6f" ON "attendance"."employments" ("accountId", "employeeNumber") WHERE "employeeNumber" IS NOT NULL AND status != 'deleted'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_35d6e839f11027dcc3d7af1dc3" ON "attendance"."employments" ("accountId", "identityId") WHERE status != 'deleted'`);
        await queryRunner.query(`CREATE INDEX "IDX_921825a52de4a973d4357b909c" ON "attendance"."employments" ("accountId", "status") `);
        await queryRunner.query(`CREATE TABLE "attendance"."employee_identities" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "phoneE164" character varying(20), "email" character varying(255), "phoneVerifiedAt" TIMESTAMP WITH TIME ZONE, "emailVerifiedAt" TIMESTAMP WITH TIME ZONE, "firstName" character varying(120) NOT NULL, "lastName" character varying(120) NOT NULL, "curp" character varying(18), "rfc" character varying(13), "nss" character varying(11), "birthDate" date, "avatarKey" character varying(512), "locale" character varying(10) NOT NULL DEFAULT 'es-MX', "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e46b8ea253cbd54630c4e2a37b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48eeeabe96359069989303f5ab" ON "attendance"."employee_identities" ("curp") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_de56b0bd309dbfdb14d1bb8972" ON "attendance"."employee_identities" ("email") WHERE email IS NOT NULL AND status != 'deleted'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_24484a64df13e9df8ba81533cd" ON "attendance"."employee_identities" ("phoneE164") WHERE "phoneE164" IS NOT NULL AND status != 'deleted'`);
        await queryRunner.query(`CREATE TABLE "attendance"."otp_challenges" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "destination" character varying(255) NOT NULL, "channel" character varying(10) NOT NULL, "codeHash" character varying(128) NOT NULL, "attempts" smallint NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumedAt" TIMESTAMP WITH TIME ZONE, "ip" character varying(64), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c34f21df6c8aa51229715452068" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_07d7999411b671f53072d7dd65" ON "attendance"."otp_challenges" ("destination", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "attendance"."consents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identityId" uuid NOT NULL, "accountId" uuid NOT NULL, "kind" character varying(20) NOT NULL, "version" character varying(20) NOT NULL, "grantedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revokedAt" TIMESTAMP WITH TIME ZONE, "ip" character varying(64), "userAgent" character varying(300), CONSTRAINT "PK_9efc68eb6aba7d638fb6ea034dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a15c509c367ff3c0492f76c11f" ON "attendance"."consents" ("identityId", "accountId", "kind") `);
        await queryRunner.query(`CREATE TABLE "attendance"."custom_field_definitions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "entity" character varying(20) NOT NULL, "key" character varying(60) NOT NULL, "label" character varying(120) NOT NULL, "type" character varying(20) NOT NULL, "options" jsonb NOT NULL DEFAULT '[]', "required" boolean NOT NULL DEFAULT false, "validation" jsonb NOT NULL DEFAULT '{}', "visibleToEmployee" boolean NOT NULL DEFAULT true, "editableByEmployee" boolean NOT NULL DEFAULT false, "askOnOnboarding" boolean NOT NULL DEFAULT false, "showInReports" boolean NOT NULL DEFAULT true, "chartable" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_91f4cf6416f7aeb02c217005cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1b770a5541d317c0e1fd13cb6f" ON "attendance"."custom_field_definitions" ("accountId", "entity", "key") WHERE status != 'deleted'`);
        await queryRunner.query(`CREATE TABLE "attendance"."audit_log" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "accountId" uuid, "actorType" character varying(10) NOT NULL, "actorId" uuid, "entity" character varying(40) NOT NULL, "entityId" uuid, "action" character varying(40) NOT NULL, "before" jsonb, "after" jsonb, "at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_80a2c3eb0266e2f522b88cbd61" ON "attendance"."audit_log" ("accountId", "entity", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_50128cbebb38e0fe71127d51fb" ON "attendance"."audit_log" ("accountId", "at") `);
        // Filtros y agrupaciones por campos personalizados (tableros y reportes).
        await queryRunner.query(`CREATE INDEX "IDX_employments_custom_fields" ON "attendance"."employments" USING GIN ("customFields" jsonb_path_ops)`);
        await queryRunner.query(`CREATE INDEX "IDX_locations_custom_fields" ON "attendance"."locations" USING GIN ("customFields" jsonb_path_ops)`);
        // Marcajes append-only (LFT 132-XXXIV): solo se puede cambiar la revisión.
        await queryRunner.query(`
            CREATE FUNCTION "attendance"."punches_append_only"() RETURNS trigger AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    RAISE EXCEPTION 'Los marcajes no se borran (append-only)';
                END IF;
                IF (NEW."accountId", NEW."employmentId", NEW."type", NEW."serverAt", NEW."clientAt", NEW."effectiveAt",
                    NEW."lat", NEW."lng", NEW."hash", NEW."prevHash", NEW."idempotencyKey", NEW."source")
                   IS DISTINCT FROM
                   (OLD."accountId", OLD."employmentId", OLD."type", OLD."serverAt", OLD."clientAt", OLD."effectiveAt",
                    OLD."lat", OLD."lng", OLD."hash", OLD."prevHash", OLD."idempotencyKey", OLD."source") THEN
                    RAISE EXCEPTION 'Los marcajes no se editan: registra una corrección';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql`);
        await queryRunner.query(`CREATE TRIGGER "TRG_punches_append_only" BEFORE UPDATE OR DELETE ON "attendance"."punches" FOR EACH ROW EXECUTE FUNCTION "attendance"."punches_append_only"()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS "TRG_punches_append_only" ON "attendance"."punches"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS "attendance"."punches_append_only"()`);
        await queryRunner.query(`DROP INDEX IF EXISTS "attendance"."IDX_locations_custom_fields"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "attendance"."IDX_employments_custom_fields"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_50128cbebb38e0fe71127d51fb"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_80a2c3eb0266e2f522b88cbd61"`);
        await queryRunner.query(`DROP TABLE "attendance"."audit_log"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_1b770a5541d317c0e1fd13cb6f"`);
        await queryRunner.query(`DROP TABLE "attendance"."custom_field_definitions"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_a15c509c367ff3c0492f76c11f"`);
        await queryRunner.query(`DROP TABLE "attendance"."consents"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_07d7999411b671f53072d7dd65"`);
        await queryRunner.query(`DROP TABLE "attendance"."otp_challenges"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_24484a64df13e9df8ba81533cd"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_de56b0bd309dbfdb14d1bb8972"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_48eeeabe96359069989303f5ab"`);
        await queryRunner.query(`DROP TABLE "attendance"."employee_identities"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_921825a52de4a973d4357b909c"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_35d6e839f11027dcc3d7af1dc3"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_5499e7673e0396fe6422a0da6f"`);
        await queryRunner.query(`DROP TABLE "attendance"."employments"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_2a08e760b77a1f2ec9b12074bf"`);
        await queryRunner.query(`DROP TABLE "attendance"."devices"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_08e47beb6937a954addfd8d29e"`);
        await queryRunner.query(`DROP TABLE "attendance"."locations"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_a6eb6f2543de8a5a4c148b32a1"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_ce513977f1a0b5d04432fc82a4"`);
        await queryRunner.query(`DROP TABLE "attendance"."invitations"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_bfe7d1549b6ae0daf4db6c6ba4"`);
        await queryRunner.query(`DROP TABLE "attendance"."onboarding_requests"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_aa32d4c8f26c68a20d27b55e3e"`);
        await queryRunner.query(`DROP TABLE "attendance"."onboarding_rules"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_8f2d2c7641c87479416f85e1df"`);
        await queryRunner.query(`DROP TABLE "attendance"."departments"`);
        await queryRunner.query(`DROP TABLE "attendance"."account_settings"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_f439b60944cc8e912958e2c65c"`);
        await queryRunner.query(`DROP TABLE "attendance"."positions"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_4f1c768095fadf29cc49c87d4b"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_3f044424e47af43fc7ef106469"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_2de447f850058d920ce208631e"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_00ca448c2940f4b3c09fd6beee"`);
        await queryRunner.query(`DROP TABLE "attendance"."punches"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_3b2196aec79559360efca5efd0"`);
        await queryRunner.query(`DROP TABLE "attendance"."report_jobs"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_ef41bf2af586baa4112c050a68"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_1cc583c77a7b02bb4693139de8"`);
        await queryRunner.query(`DROP TABLE "attendance"."requests"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_41e30507b13d06e3207097c4c4"`);
        await queryRunner.query(`DROP TABLE "attendance"."holidays"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_bc1e8fafbf5eca77f01b7e47c0"`);
        await queryRunner.query(`DROP TABLE "attendance"."policies"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_920f717913da8c9e021240a646"`);
        await queryRunner.query(`DROP TABLE "attendance"."schedules"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_7a7eb0caa7dee4776e93759b41"`);
        await queryRunner.query(`DROP TABLE "attendance"."shifts"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_f265fa59a749551fc8444011ce"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_d5c6815d9044cca40d5f4d9abf"`);
        await queryRunner.query(`DROP TABLE "attendance"."incidents"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_9a5ebcc845570bfee452bfbd0f"`);
        await queryRunner.query(`DROP TABLE "attendance"."pay_periods"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_73cb249b34422b5a80d62099dc"`);
        await queryRunner.query(`DROP INDEX "attendance"."IDX_fe763eb813a53048b30bee7266"`);
        await queryRunner.query(`DROP TABLE "attendance"."workdays"`);
    }

}
