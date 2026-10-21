---
proyecto: Checador
fuente: jc-attendance/docs/04-modelo-de-datos.md
sincronizado: 2026-10-21
tags: [checador, asistencia]
---

# 04 · Modelo de datos (esquema `attendance`)

Convenciones heredadas de jc-core: `@PrimaryGeneratedColumn('uuid')`,
`accountId` en toda tabla de negocio, `status` (`StatusForEntityEnum`: active,
inactive, deleted, archived) con soft delete, columnas camelCase,
`createdAt`/`updatedAt`. **Ninguna FK hacia `public.*`.** Fechas en `timestamptz`
(UTC) + `timeZone` IANA resuelto por ubicación → cuenta.

## Diagrama (entidades principales)

```
account_settings 1─┐
                   │
employee_identities 1──* employments *──1 (accountId) ──* locations ──* geofences
                              │  │                          │
                              │  └──* employment_locations ─┘
                              │
            invitations ──* onboarding_requests ──1 employments
                              │
custom_field_definitions ──* (valores en employments.customFields JSONB)
                              │
schedules ──* shifts ──* shift_assignments *──1 employments
policies ──* policy_assignments (cuenta / ubicación / departamento / empleado)
                              │
punches *──1 employments   punches *──1 devices
workdays (1 por empleado por día laboral) ──* workday_segments
incidents ──1 employments   requests (permisos/vacaciones) ──* approvals
report_jobs   audit_log   consents   holidays   departments   positions
```

## Tablas

### Identidad y empleo
| Tabla | Columnas clave |
|---|---|
| `employee_identities` | id, phoneE164 (único parcial), email (único parcial), phoneVerifiedAt, emailVerifiedAt, firstName, lastName, curp?, rfc?, nss?, avatarKey, faceTemplateRef?, locale, status |
| `employments` | id, accountId, identityId, coreUserId? (si también es usuario jc-core), employeeNumber (único por cuenta), departmentId, positionId, managerEmploymentId, hireDate, terminationDate, payType (hourly/salaried), hourlyRate?, dailySalary?, defaultLocationId, scheduleId, policyId, customFields JSONB, onboardingStatus (pending/approved/rejected), status |
| `departments`, `positions` | id, accountId, name, code, parentId (departamentos jerárquicos), status |
| `employment_locations` | employmentId, locationId, allowed (bool) — dónde puede checar |

### Alta por liga y validación
| Tabla | Columnas clave |
|---|---|
| `invitations` | id, accountId, tokenHash (el token firmado nunca se guarda en claro), kind (open/personal), targetPhone?, targetEmail?, defaultDepartmentId, defaultLocationId, defaultScheduleId, maxUses, usesCount, expiresAt, requireApproval (bool), allowedEmailDomains[], requiredFields[], createdByUserId, status |
| `onboarding_requests` | id, accountId, invitationId, identityId, submittedData JSONB, customFields JSONB, documents (keys S3: INE, comprobante), validationResults JSONB (resultado de cada regla), riskScore, reviewStatus (pending/approved/rejected/needs_info), reviewedByUserId, reviewedAt, rejectionReason |
| `onboarding_rules` | id, accountId, ruleKey (`unique_curp`, `unique_phone`, `email_domain`, `min_age`, `curp_format`, `rfc_format`, `nss_format`, `document_required`, `duplicate_face`, `custom_regex`), config JSONB, severity (block/warn), enabled |

### Campos personalizados
| Tabla | Columnas clave |
|---|---|
| `custom_field_definitions` | id, accountId, entity (employment/location/punch/request), key (slug inmutable), label, type (text, number, date, select, multiselect, boolean, email, phone, file, curp, rfc), options JSONB, required, validation JSONB (regex, min, max), visibleToEmployee, editableByEmployee, showInReports, chartable, sortOrder, status |

Valores en `customFields JSONB` de la entidad, validados en el checker contra
la definición (JSON Schema generado). Índice `GIN (customFields jsonb_path_ops)`
para filtros y agrupaciones en tableros.

### Ubicaciones
| Tabla | Columnas clave |
|---|---|
| `locations` | id, accountId, name, code, address, lat, lng, timeZone, customFields, status |
| `geofences` | id, locationId, kind (circle/polygon), radiusMeters?, polygon (GeoJSON; PostGIS opcional), minAccuracyMeters, allowedWifiBssids[], allowedIpCidrs[] |
| `devices` | id, accountId, locationId?, kind (kiosk/personal), name, publicKey, lastSeenAt, trusted, status |

### Turnos y políticas
| Tabla | Columnas clave |
|---|---|
| `schedules` | id, accountId, name, type (fixed/rotating/flexible/open), weeklyHoursTarget, status |
| `shifts` | id, scheduleId, dayOfWeek / patternIndex, startTime, endTime, crossesMidnight, breakMinutes, paidBreak, jornadaType (diurna/nocturna/mixta) |
| `shift_assignments` | id, employmentId, shiftId, date (para rotativos/excepciones) |
| `policies` | id, accountId, name, graceInMinutes, graceOutMinutes, roundingMinutes, roundingMode, lateThresholdMinutes, absenceAfterMinutes, autoClockOutAfterHours, requireSelfie, requireGeofence, requireQr, allowOffline, maxOfflineHours, overtimeMode (LFT_MX/daily/weekly/none), overtimeRequiresApproval, weeklyHoursLimit, sundayPremium, nightShiftRules JSONB |
| `policy_assignments` | policyId, scope (account/location/department/employment), scopeId — se aplica la más específica |
| `lft_versions` | id, validFrom, weeklyHoursLimit (48/46/44/42/40), weeklyDoubleOvertimeCap (9/9/10/11/12), weeklyTripleOvertimeCap (4), dailyMaxWithOvertime (12), source — tabla global de parámetros legales |
| `holidays` | id, accountId?, date, name, paid (catálogo LFT art. 74 precargado) |

### Marcajes y jornadas
| Tabla | Columnas clave |
|---|---|
| `punches` | id, accountId, employmentId, type (in/out/break_start/break_end), source (pwa/kiosk/web/manual/import), serverAt, clientAt, offline (bool), lat, lng, accuracyMeters, locationId, insideGeofence, deviceId, selfieKey?, faceMatchScore?, livenessPassed?, qrNonce?, ip, riskFlags[], reviewStatus (auto_ok/pending/approved/rejected), editedFromPunchId?, editReason, createdByUserId? (si es manual), idempotencyKey (único), prevHash, hash — **inmutable / append-only**: corregir = nuevo registro que referencia al anterior; cadena de hash diaria por cuenta (LFT 132-XXXIV) |
| `workdays` | id, accountId, employmentId, date (fecha laboral local), scheduledStart/End, firstIn, lastOut, workedMinutes, breakMinutes, overtimeDoubleMinutes, overtimeTripleMinutes, nightMinutes, lateMinutes, earlyLeaveMinutes, status (ok/late/absent/incomplete/holiday/leave/rest), locked (bool, tras cierre de periodo), calcVersion, lftVersionId |
| `incidents` | id, accountId, employmentId, workdayId, type (late/absence/missing_punch/out_of_geofence/overtime/face_mismatch), justified, justificationRequestId, status |
| `requests` | id, accountId, employmentId, type (vacation/permission/sick_leave/punch_correction/overtime), from, to, payload JSONB, attachments, status |
| `approvals` | id, requestId / onboardingRequestId / punchId, step, approverUserId, decision, comment, decidedAt |
| `pay_periods` | id, accountId, frequency (weekly/biweekly/monthly), start, end, closedAt, closedByUserId |

### Reportes, analítica y cumplimiento
| Tabla | Columnas clave |
|---|---|
| `report_jobs` | id, accountId, type, params JSONB, format (pdf/xlsx/csv), status, fileKey, requestedByUserId, finishedAt |
| `mv_daily_attendance` (vista materializada) | accountId, date, locationId, departmentId, scheduled, present, late, absent, workedMinutes, overtimeMinutes — refresco incremental en cola |
| `consents` | id, identityId, accountId, kind (geolocation/biometric/privacy_notice), version, grantedAt, revokedAt, ip |
| `audit_log` | id, accountId, actorType (user/employee/system), actorId, entity, entityId, action, before JSONB, after JSONB, at — append-only |
| `account_settings` | accountId (PK), weekStartsOn, payPeriodFrequency, defaultPolicyId, branding, retentionYears (default 5 tras la baja; mínimo legal 1 año, LFT arts. 804–805), geofenceMode default (alert / block), featureFlags |

## Índices críticos
- `punches (accountId, employmentId, serverAt DESC)`
- `workdays (accountId, date)` y único `(employmentId, date)`
- `employments (accountId, status)`; único `(accountId, employeeNumber)` y `(accountId, identityId)` donde `status != 'deleted'`
- `invitations (tokenHash)` único
- GIN en `customFields`

## Multi-tenant
Todas las consultas pasan por DAOs que exigen `accountId`. Defensa en
profundidad opcional (fase 2): Row Level Security en el esquema `attendance` con
`SET app.account_id` por request.
