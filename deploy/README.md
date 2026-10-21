# Despliegue del Checador (jc-attendance)

Mismo EC2 que jc-core, proceso pm2 aparte (`jc-attendance-api`, puerto 3100).

## Una sola vez

1. **BD** (DBA, usuario con privilegios): `psql "$ADMIN_URL" -v app_password="'…'" -f apps/api/db/provision.sql`
   → rol `attendance_app`, esquema `attendance`, solo lectura en `public.accounts/users/account_apps`.
2. **Código**: `git clone git@github.com:jcvalderrabanoh/jc-attendance.git /home/ec2-user/jc-attendance`
3. **`.env`** en `apps/api/.env` (ver `.env.example`): `POSTGRES_USER=attendance_app`, el mismo
   `JWT_SECRET` de jc-core, `EMPLOYEE_JWT_SECRET` propio, Redis, Twilio Verify/WhatsApp,
   `PUBLIC_APP_URL` (dominio del PWA), `CORS_ORIGINS` (core-front + PWA).
4. **nginx**: `server_name api-asistencia.lumen-view.com; location / { proxy_pass http://127.0.0.1:3100; }` + certbot.
5. **GitHub**: secretos `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_INSTANCE_ID` (los mismos de jc-core).
6. **jc-core**: desplegar el cambio `AppEnum.Attendance` y contratar el Checador a una cuenta:
   `INSERT INTO account_apps ("accountId", app) VALUES ('<cuenta>', 'attendance');`

## Cada deploy

Push a `main` → `deploy.yml` → `deploy/release.sh` (build fuera del vivo, migraciones del
esquema `attendance`, swap por rename, `pm2 reload` sin corte). Manual: Actions → Deploy to
EC2 → Run workflow (`skip_tests` para hotfix).
