# 03 · Arquitectura

> Decisión central: **servicio y repo nuevos (`jc-attendance`) que comparten la
> base PostgreSQL de jc-core sin tocar su modelo de datos.** Todo lo del checador
> vive en el esquema `attendance`, con su propio rol de BD, sus propias
> migraciones y su propia tabla de migraciones.

## 1. Vista general

```
                    ┌──────────────────────────── Auth0 (mismo tenant) ─────────────┐
                    │                                                                │
  Patrón / RH  ──►  attendance-web (Angular)  ──►  jc-core  /auth/token-exchange     │
  (usuario jc-core)          │                         │  JWT { userId, accountId,   │
                             │                         │        role, permissions,   │
                             ▼                         │        app: 'attendance' }  │
                    attendance-api (NestJS) ◄──────────┘  (valida firma / JWKS)      │
                             │                                                       │
  Empleado ──► attendance-pwa (Angular PWA) ──► attendance-api /employee-auth (OTP)  │
  (no es usuario jc-core)          JWT propio { employeeId, identityId, accountId,   │
                                                scope: 'employee' }                  │
                             │                                                       │
                             ▼                                                       │
                PostgreSQL (misma instancia y BD que jc-core)                        │
                ├── public.*        ← jc-core (SOLO LECTURA para attendance)         │
                │     accounts, users, account_apps                                   │
                └── attendance.*    ← jc-attendance (dueño único)                    │
                Redis (Bull)        ← colas propias con prefijo `att:`               │
                S3                  ← prefijo `attendance/{accountId}/...` (selfies, PDFs)
```

## 2. Cómo NO interferir con jc-core

| Riesgo | Mitigación |
|---|---|
| Migraciones que tocan tablas de jc-core | Esquema propio `attendance`; `migrationsTableName: 'attendance_migrations'` en `attendance`; `schema: 'attendance'` en el DataSource. Un spec de CI falla si una migración menciona `public.` o una tabla sin prefijo de esquema. |
| `synchronize` accidental | `synchronize: false` siempre; el DataSource solo carga entidades de `attendance`. |
| Escrituras sobre tablas de jc-core | Rol `attendance_app`: `ALL` en esquema `attendance`, **solo `SELECT`** en `public.accounts`, `public.users`, `public.account_apps` (vistas `attendance.v_core_accounts`, `attendance.v_core_users` para desacoplar del nombre real). |
| Llaves foráneas que bloqueen borrados/migraciones de jc-core | **Sin FK cruzadas.** `accountId` y `coreUserId` son `uuid` sin FK; la integridad se valida en checkers y con un job nocturno de reconciliación. |
| Carga que degrade a jc-core | Pool de conexiones propio y acotado (máx. 10), `statement_timeout` 15 s para el rol, reportes pesados en cola Bull y sobre vistas materializadas del esquema `attendance`. |
| Colisión de colas/keys | Prefijo Redis `att:`; buckets/prefijos S3 propios. |
| Cambios de jc-core que rompan el checador | Solo dependemos de 3 columnas por tabla (id, accountId, status, timeZone, email). Spec de contrato en CI que consulta `information_schema` y falla si desaparecen. |

Único cambio en jc-core (PR pequeño y aislado): añadir `AppEnum.Attendance =
'attendance'` para que una cuenta pueda contratar el checador en `account_apps`
y el token-exchange emita `app: 'attendance'`. El resto del código de jc-core no
se toca.

## 3. Identidades: patrón vs. empleado

- **Patrón / RH / supervisor** = usuario de jc-core (`public.users`). Inicia
  sesión con Auth0 como hoy; una persona con varias cuentas ya tiene una fila por
  cuenta y comparten `auth0Sub` → **multicuenta resuelto por jc-core**. El
  selector de cuenta se reutiliza.
- **Empleado** = NO consume asiento de jc-core. Vive en
  `attendance.employee_identities` (una por humano, identificado por teléfono
  E.164 y/o email) y `attendance.employments` (una por cuenta/patrón). Un mismo
  empleado puede trabajar para varios patrones → **multicuenta del lado
  empleado**. Login con OTP por WhatsApp/SMS/email (reusar conectores Twilio de
  jc-core vía la misma cuenta Twilio, o Twilio Verify) + passkey opcional.
- Un supervisor que además checa entrada: su `users.id` se enlaza a un
  `employment` (`coreUserId`), así una persona no necesita dos cuentas.

## 4. Repo y stack

Monorepo `jc-attendance` (Nx o workspaces npm):

| Paquete | Stack | Notas |
|---|---|---|
| `apps/api` | NestJS 10 + TypeORM + PostgreSQL + Bull/Redis + EventEmitter2 | Misma arquitectura por capas que jc-core (controllers → services → blueprints → checkers/rules → processes → daos). |
| `apps/web` | Angular (standalone) + Angular Material + ECharts | Consola del patrón: empleados, ubicaciones, políticas, aprobaciones, reportes, tableros. |
| `apps/pwa` | Angular PWA (Service Worker + IndexedDB) | App del empleado: checar, historial, solicitudes. Offline-first. Empaquetable con Capacitor para tiendas (fase 3). |
| `apps/kiosk` | Ruta del PWA en modo kiosco | Tablet en sucursal: QR rotativo y/o reconocimiento facial + PIN. |
| `libs/rules-engine` | TypeScript puro, sin dependencias de Nest | Motor de cálculo de jornada (turnos, tolerancias, redondeo, horas extra LFT). 100 % testeado con tablas de casos. |
| `libs/contracts` | DTOs/tipos compartidos front↔back | |

## 5. Módulos del API (cada uno con la estructura por capas)

`accounts-link` (lectura de cuenta/plan de jc-core) · `employees` ·
`invitations` (ligas de alta) · `onboarding-reviews` (validación) ·
`custom-fields` · `locations` (sucursales y geocercas) · `devices` (kioscos y
dispositivos de confianza) · `schedules` (turnos y calendarios) · `policies`
(reglas de asistencia) · `punches` (marcajes) · `timesheets` (jornadas
calculadas) · `incidents` (retardos, faltas, permisos, vacaciones) · `approvals`
· `reports` (PDF/Excel en cola) · `analytics` (KPIs, vistas materializadas) ·
`notifications` · `audit-log` · `privacy` (consentimientos ARCO).

## 6. Flujo de un marcaje (punch)

1. PWA obtiene ubicación (precisión), selfie opcional y token de dispositivo; si
   no hay red guarda en IndexedDB con `clientTimestamp` + `monotonicOffset`.
2. `POST /punches` → **checker** (formato, empleado activo, dispositivo) →
   **rules** (geocerca, precisión GPS, QR vigente, ventana de turno, anti-doble
   marcaje) → **process** `RegisterPunchProcess` (persistir con `serverTimestamp`,
   flags de riesgo) → evento `attendance.punch.registered`.
3. Listener asíncrono: `RecalculateWorkdayProcess` (motor de reglas) → actualiza
   `workdays` → si hay incidencia, crea `incidents` y notifica.
4. Marcajes con banderas (fuera de geocerca, rostro no coincide, offline > N h)
   quedan **pendientes de revisión**, nunca se descartan en silencio.

## 7. Infraestructura

Mismo EC2/PM2 que jc-core en fase 1 (proceso aparte, puerto propio,
`attendance-api` en `pm2-ecosystem`), dominio `checador.<dominio>` o
`asistencia.lumen-view.com`. Deploy con GitHub Actions como jc-core
(build → migraciones `attendance` → reload). Observabilidad: logs con
`accountId`, PostHog para producto, alarmas de cola.
