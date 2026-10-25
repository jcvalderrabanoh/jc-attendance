# Despliegue del Checador (jc-attendance)

Mismo EC2 que jc-core, proceso pm2 aparte (`jc-attendance-api`, puerto 3100).

## Cómo se publica

- **API:** `https://core.lumen-view.com/attendance/` → nginx → `127.0.0.1:3100` (sin el prefijo).
  Ej.: `https://core.lumen-view.com/attendance/api/v1/...`, `.../attendance/health`.
- **PWA:** `https://core.lumen-view.com/asistencia/` (estático en `/var/www/asistencia`).
- Mismo dominio y certificado que jc-core: no hace falta DNS ni certbot nuevos.

## Despliegue

`deploy/ssm-deploy.sh` manda por SSM `deploy/bootstrap-ec2.sh`, que es idempotente:

1. Clona o actualiza el repo (público) en `/home/ec2-user/jc-attendance`.
2. Si no existe `apps/api/.env`, lo arma desde el `.env` de jc-core (misma BD, `JWT_SECRET` y
   Redis) con un `EMPLOYEE_JWT_SECRET` propio. Si ya existe, no lo toca.
3. API con `deploy/release.sh` (build fuera del vivo, migraciones del esquema `attendance`,
   `pm2 reload` sin corte).
4. PWA con `--base-href /asistencia/` y copia a `/var/www/asistencia` (no fatal).
5. nginx: copia `deploy/nginx/attendance.conf` a `/etc/nginx/snippets/lumen-attendance.conf`,
   lo incluye en el server 443 de `core.lumen-view.com` (`include-attendance.py`), valida con
   `nginx -t` y recarga; si falla, revierte.

**Quién lo lanza:**
- jc-core → Actions → **Deploy Checador** (usa los secretos de AWS que ya tiene jc-core).
- Este repo: push a `main` → `deploy.yml`. Requiere los secretos `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY` y `EC2_INSTANCE_ID` (los mismos de jc-core); sin ellos el job avisa
  y no hace nada.

## Pendientes de endurecimiento

- **Rol de BD propio:** hoy el `.env` usa el usuario de jc-core. Pasar a `attendance_app` con
  `apps/api/db/provision.sql` (solo escribe en `attendance`, solo lee 3 tablas de `public`).
- **OTP por WhatsApp/SMS:** cada deploy corre `deploy/otp-setup.py`, que copia del `.env` de
  jc-core las claves de Twilio que falten y elige el proveedor:
  - `twilio-messaging` (preferido): la plantilla de WhatsApp AUTHENTICATION aprobada que usa
    jc-core para su código de alta (`TWILIO_SIGNUP_OTP_CONTENT_SID`, remitente
    `TWILIO_WHATSAPP_FROM`); si WhatsApp falla, SMS por `TWILIO_PHONE_NUMBER`.
  - `twilio`: Twilio Verify (crea/reutiliza el servicio «Checador»). Por WhatsApp no entrega
    hasta ligar un remitente en la consola de Twilio.
  - `log`: sin credenciales; el código sale en el log del servidor.
  La verificación del deploy dice cuál quedó.
- **Contratar el Checador a cuentas de clientes:**
  `INSERT INTO account_apps ("accountId", app) VALUES ('<cuenta>', 'attendance');`
