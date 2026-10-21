# @jc-attendance/api

API del Checador (NestJS + TypeORM + Bull). Comparte la BD de jc-core en el
esquema `attendance`; ver `docs/03-arquitectura.md`.

## Correr en local

```bash
cp .env.example .env               # JWT_SECRET = el de jc-core
npm run build -w @jc-attendance/rules-engine
npm run migration:run:dev          # crea el esquema y corre migraciones
npm run start:dev                  # http://localhost:3100 · Swagger en /docs
```

Producción: un DBA corre `db/provision.sql` una vez (rol `attendance_app` con
solo lectura sobre `public.accounts/users/account_apps`), luego
`npm run build && npm run migration:run`.

## Pruebas

```bash
npm run typecheck          # incluye specs
npm test                   # unitarias
npm run test:e2e           # punta a punta: Postgres local en :5432 y Redis en :6379
```

## Módulos

| Módulo | Qué hace |
|---|---|
| `core-link` | Única lectura de `public.*` (cuenta, usuarios, `account_apps`) |
| `organization` | Configuración de la cuenta, departamentos, puestos; siembra valores por defecto |
| `locations` | Sucursales, geocercas (círculo/polígono), kioscos (activación, QR TOTP) |
| `custom-fields` | Definiciones y validación de campos personalizados |
| `schedules` | Políticas, horarios semanales, festivos LFT |
| `employees` | Identidad global (multicuenta) + empleo por cuenta |
| `employee-auth` | OTP por WhatsApp/SMS/email (Twilio Verify o log), consentimientos LFPDPPP |
| `onboarding` | Ligas de alta, reglas de validación configurables, cola de aprobación |
| `punches` | Marcajes append-only con riesgo, hash encadenado, selfie |
| `timesheets` | Jornadas con el motor LFT, horas extra, incidencias, periodos, tareas programadas |
| `requests` | Vacaciones, permisos, correcciones de marcaje |
| `analytics` | Tablero, presencia, constructor de gráficos (incluye campos personalizados) |
| `reports` | PDF/Excel/CSV en cola Bull, registro de jornada LFT 132-XXXIV |
| `audit` | Bitácora append-only |
