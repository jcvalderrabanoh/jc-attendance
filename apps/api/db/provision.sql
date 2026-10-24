-- Aprovisionamiento del Checador en la BD de jc-core. Lo corre un DBA UNA vez
-- con un usuario con privilegios (no el de la app).
--   psql "$JC_CORE_ADMIN_URL" -v app_password="'...'" -f db/provision.sql
--
-- Resultado: rol `attendance_app` dueño del esquema `attendance`, que solo
-- puede LEER las tres tablas de jc-core que el Checador usa.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'attendance_app') THEN
    CREATE ROLE attendance_app LOGIN;
  END IF;
END $$;
ALTER ROLE attendance_app WITH PASSWORD :app_password;
-- Límite por sentencia: el Checador nunca debe trabar a jc-core.
ALTER ROLE attendance_app SET statement_timeout = '15s';
ALTER ROLE attendance_app CONNECTION LIMIT 20;

CREATE SCHEMA IF NOT EXISTS attendance AUTHORIZATION attendance_app;
ALTER ROLE attendance_app SET search_path = attendance;

-- Nada en public salvo lectura de lo indispensable.
REVOKE CREATE ON SCHEMA public FROM attendance_app;
GRANT USAGE ON SCHEMA public TO attendance_app;
GRANT SELECT ("id", "name", "timeZone", "status") ON public.accounts TO attendance_app;
GRANT SELECT ("id", "firstName", "lastName", "email", "accountId", "status") ON public.users TO attendance_app;
GRANT SELECT ("accountId", "app", "status", "trialEndsAt") ON public.account_apps TO attendance_app;
