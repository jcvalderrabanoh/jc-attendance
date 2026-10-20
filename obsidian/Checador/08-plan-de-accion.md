---
proyecto: Checador
fuente: jc-attendance/docs/08-plan-de-accion.md
sincronizado: 2026-10-20
tags: [checador, asistencia]
---

# 08 · Plan de acción

Duración estimada al MVP: **~12 semanas** con 1 dev full-stack + Claude Code. Cada fase termina con demo, documentación actualizada (repo → Notion → Obsidian) y propuestas de Stitch de sus pantallas.

## Fase 0 · Fundaciones (semanas 1–2)
| # | Entregable | Criterio de aceptación |
|---|---|---|
| 0.1 | Repo `jc-attendance` (monorepo `apps/api`, `apps/web`, `apps/pwa`, `libs/rules-engine`, `libs/contracts`), CI (lint, `tsc --noEmit`, jest), deploy a EC2/PM2 | Pipeline verde; `attendance-api` corre en un puerto propio |
| 0.2 | PR en jc-core: `AppEnum.Attendance` + emisión del claim `app: 'attendance'` en el token-exchange | Specs de `app.enum` y `AppAccessGuard` actualizados; nada más cambia en jc-core |
| 0.3 | Esquema `attendance`, rol `attendance_app` (solo `SELECT` sobre 3 tablas de `public`), DataSource con `schema` y `migrationsTableName` propios | Spec que falla si una migración toca `public.`; spec de contrato sobre las columnas de jc-core usadas |
| 0.4 | Auth: guard que valida el JWT de jc-core (`app = attendance`); módulo `employee-auth` con OTP (WhatsApp/SMS/email) y JWT de empleado | Login del patrón y del empleado de punta a punta |
| 0.5 | Design system base en Stitch (DESIGN.md) + shell de Angular Material | Paleta, tipografía y componentes acordados |

## Fase 1 · MVP núcleo (semanas 3–8)
| Sprint | Módulos | Pantallas |
|---|---|---|
| S1 (3–4) | `employees`, `departments`, `locations` (geocerca circular), `custom-fields`, `account_settings`, importación Excel | C3, C4, C11, C15, C17 |
| S2 (5–6) | `invitations`, `onboarding-requests`, `onboarding-rules` (CURP/RFC/NSS, unicidad, edad, dominios, documentos), cola de validación, notificaciones por email | A1, A2, A3, C5, C6, C16 |
| S3 (7–8) | `punches` (PWA + offline + selfie + puntaje de riesgo), kiosco con QR rotativo y PIN, `schedules`/`policies`, `libs/rules-engine` (LFT versionado), `workdays`, contador de horas | A4, A5, A6, B1, B2, C7, C10 (básico), C14 |

## Fase 2 · MVP comercial (semanas 9–12)
| Sprint | Módulos | Pantallas |
|---|---|---|
| S4 (9–10) | `incidents`, `requests` + aprobaciones de 1 nivel, `pay_periods` (cierre), `audit-log`, consentimientos/ARCO, rol Inspector | A7, A8, C8, C9, C18 |
| S5 (11–12) | `reports` en cola (hoja de horas, asistencia diaria, incidencias, horas extra, **registro de jornada LFT**, prenómina CSV), tablero con KPIs y 5 gráficos base, vistas materializadas | C1, C12, D1–D5 |
| — | **Lanzamiento MVP** (piloto con 2–3 cuentas reales) | |

## Fase 3 · Diferenciación (meses 4–6)
- Reconocimiento facial + liveness (AWS Rekognition) en la app y el kiosco, detección de rostros duplicados en el alta.
- Constructor de gráficos sobre campos personalizados (C13), asistencia en vivo en mapa (C2), alertas por umbral y NOM-035.
- Geocercas de polígono, restricción por IP, aprobaciones multinivel, vacaciones con saldo según la LFT.
- Layouts de exportación para CONTPAQi y Aspel NOI; reportes programados; PDF ejecutivo (D6).
- Notificaciones por WhatsApp.

## Fase 4 · Escala (meses 7–12)
- Apps nativas con Capacitor: widget, detección de ubicación simulada, Play Integrity.
- Marcaje por WhatsApp; integración con relojes ZKTeco/Hikvision.
- Tablero de grupo empresarial (varias cuentas), costo laboral vs. ventas, RLS en Postgres.
- API pública y webhooks; i18n para Chile/Colombia (Res. 38 si se entra a Chile).

## Riesgos y mitigación
| Riesgo | Mitigación |
|---|---|
| La STPS publica sus disposiciones (1-ene-2027) con requisitos de formato | Parámetros configurables + reporte para la autoridad desacoplado; vigilar el DOF (tarea mensual) |
| Los cambios de jc-core rompen las lecturas | Spec de contrato en CI + vistas `attendance.v_core_*` |
| Fraude de ubicación en la PWA (sin detección de ubicación simulada) | Puntaje de riesgo + QR del kiosco + selfie; app nativa en F4 |
| iOS no tiene Background Sync | Reenviar la cola al abrir la app y avisar "pendiente de envío" |
| Biometría y LFPDPPP | Consentimiento expreso con evidencia + alternativa sin biometría; revisión jurídica antes de F3 |
| Carga sobre la BD compartida | Pool acotado, `statement_timeout`, reportes en cola, vistas materializadas |

## Precio de lanzamiento (propuesta)
- **Gratis:** hasta 5 empleados, 1 sucursal.
- **Esencial:** $35 MXN por empleado al mes (geocercas, liga de alta con validación, reportes PDF, KPIs).
- **Pro:** $55 MXN (biometría, constructor de gráficos, aprobaciones multinivel, exportación a nómina).
- **Add-on WhatsApp:** por mensaje.

## Definición de terminado (por módulo)
- Capas completas (controller → service → blueprint → checker/rule → process → dao) e `index.ts` en cada carpeta.
- Specs: unitarios del motor de reglas y checkers; e2e del endpoint.
- Pantalla con su propuesta de Stitch enlazada en [[07-pantallas-y-stitch|07]].
- Mapa de pantallas y Notion/Obsidian actualizados.
