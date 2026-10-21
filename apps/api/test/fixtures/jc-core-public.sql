-- Réplica mínima de las tablas de jc-core que el Checador lee (solo columnas
-- concedidas en db/provision.sql). Solo para desarrollo y pruebas locales.
CREATE TABLE IF NOT EXISTS public.accounts (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "timeZone" varchar(64) NOT NULL DEFAULT 'America/Mexico_City',
  "status" varchar(20) NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS public.users (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "accountId" uuid NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS public.account_apps (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" uuid NOT NULL,
  "app" varchar(50) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "trialEndsAt" timestamp NULL
);
