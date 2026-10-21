---
proyecto: Checador
fuente: jc-attendance/docs/02-requisitos-funcionales.md
sincronizado: 2026-10-21
tags: [checador, asistencia]
---

# 02 · Requisitos funcionales

Prioridad: **M** = MVP, **F2** = fase 2, **F3** = fase 3. «Ref.» = competidor
que inspira la función.

## RF-01 Cuentas, roles y multicuenta
| ID | Requisito | Prio |
|---|---|---|
| 01.1 | Una cuenta (patrón) contrata el checador vía `account_apps` (`app = attendance`). | M |
| 01.2 | Roles: **Dueño/Admin**, **RH**, **Supervisor** (solo sus sucursales o departamentos), **Empleado**, **Inspector** (solo lectura con expiración). | M |
| 01.3 | Un usuario patrón con varias cuentas cambia de cuenta con el selector de jc-core. | M |
| 01.4 | Un empleado que trabaja para varios patrones ve un selector de patrón; sus datos están aislados por cuenta (ref. Jibble). | M |
| 01.5 | Grupo empresarial: tablero consolidado de varias cuentas del mismo dueño. | F3 |

## RF-02 Empleados y alta por liga
| ID | Requisito | Prio |
|---|---|---|
| 02.1 | CRUD de empleados con número de empleado, departamento, puesto, jefe, sucursales permitidas, turno, política, tipo de pago y salario. | M |
| 02.2 | **Ligas de alta**: abierta (multiuso) o personal. Opciones: vigencia, máximo de usos, sucursal/departamento/turno por defecto, requiere aprobación, dominios de email permitidos, campos obligatorios. Se comparte como URL, QR y botón de WhatsApp (ref. Connecteam). | M |
| 02.3 | Formulario de alta en 3 pasos: datos, campos personalizados y documentos, consentimientos. Verificación del teléfono por OTP. | M |
| 02.4 | **Proceso de validación**: cada alta pasa por las reglas activas (ver 05) → resultado por regla (✓/⚠/✗) + puntaje de riesgo → aprobación automática si todo está en verde y la liga no exige revisión; si no, va a la cola. | M |
| 02.5 | Cola de validación: aprobar, rechazar con motivo o pedir más información (el empleado corrige y reenvía). Se notifica al empleado por WhatsApp o email. | M |
| 02.6 | Importación masiva desde Excel con vista previa y la misma validación. | M |
| 02.7 | Baja: fecha de terminación, cierre de acceso y conservación de los datos (retención). | M |
| 02.8 | Expediente con documentos (INE, comprobante, contrato) y vencimientos. | F2 |

## RF-03 Campos personalizados
| ID | Requisito | Prio |
|---|---|---|
| 03.1 | Definir campos por cuenta para Empleado y Ubicación. Tipos: texto, número, fecha, lista, multiselección, sí/no, email, teléfono, archivo, CURP, RFC. | M |
| 03.2 | Por campo: obligatorio, validación (regex, mínimo, máximo), visible o editable por el empleado, pedirlo en la liga de alta, usarlo en reportes y en gráficos. | M |
| 03.3 | Filtrar, agrupar y graficar por cualquier campo marcado como "graficable". | M |
| 03.4 | Campos en el marcaje: preguntas al checar salida, como proyecto u observaciones (ref. ClockShark). | F2 |
| 03.5 | Campos en solicitudes. | F2 |

## RF-04 Ubicaciones
| ID | Requisito | Prio |
|---|---|---|
| 04.1 | Sucursales con dirección, coordenadas, zona horaria y campos personalizados. | M |
| 04.2 | Geocerca circular con radio libre (no fijo, a diferencia de Homebase) y precisión GPS mínima aceptada. | M |
| 04.3 | Geocerca de polígono dibujada en el mapa. | F2 |
| 04.4 | Modo de la geocerca: **alertar y aprobar** (por defecto) o bloquear. | M |
| 04.5 | Restricción por IP/CIDR para el marcaje web. | F2 |
| 04.6 | Kioscos vinculados a una sucursal. | M |
| 04.7 | Empleado móvil sin sucursal fija: registra la ubicación pero no valida geocerca. | M |

## RF-05 Marcaje (registro de entradas y salidas)
| ID | Requisito | Prio |
|---|---|---|
| 05.1 | PWA con botón único de entrada o salida y botones de inicio y fin de descanso. | M |
| 05.2 | Datos capturados: hora del servidor y del cliente, GPS con precisión, sucursal detectada, dispositivo e IP. | M |
| 05.3 | Selfie al checar, configurable por política. | M |
| 05.4 | Comparación facial + liveness (AWS Rekognition), con consentimiento y alternativa. | F2 |
| 05.5 | Kiosco con **QR rotativo** (TOTP de 30 s, un solo uso) que el empleado escanea con su teléfono. | M |
| 05.6 | Kiosco con PIN + foto. | M |
| 05.7 | Kiosco con reconocimiento facial. | F2 |
| 05.8 | Offline: cola en IndexedDB con `Idempotency-Key`; en iOS se reenvía al reabrir la app. | M |
| 05.9 | Puntaje de riesgo: fuera de geocerca, baja precisión, ubicación simulada (solo app nativa), rostro no coincide, offline más de N horas, dispositivo nuevo → **pendiente de revisión**. | M |
| 05.10 | Marcaje manual por supervisor con motivo obligatorio y bitácora. | M |
| 05.11 | Corrección solicitada por el empleado → aprobación. Nunca se edita el original. | M |
| 05.12 | Salida automática después de N horas, marcada como "auto". | M |
| 05.13 | Marcar por WhatsApp: el bot pide ubicación y selfie (ref. CheckRH). | F3 |
| 05.14 | Integración con relojes ZKTeco/Hikvision (importación por API o archivo). | F3 |
| 05.15 | Apps nativas con Capacitor: widget, detección de ubicación simulada y Play Integrity. | F3 |

## RF-06 Turnos, políticas y contador de horas
| ID | Requisito | Prio |
|---|---|---|
| 06.1 | Turnos fijos, rotativos, flexibles y abiertos; turnos que cruzan la medianoche; descansos pagados o no pagados; tipo de jornada diurna/nocturna/mixta. | M |
| 06.2 | Calendario de asignación de turnos con plantillas y copia semanal. | F2 |
| 06.3 | Políticas: tolerancia de entrada y salida, redondeo (sin perder la marca real), umbral de retardo, umbral de falta, salida automática, requisitos de verificación, horas extra (modo LFT México), extra con aprobación. Se aplica la más específica: empleado > departamento > sucursal > cuenta. | M |
| 06.4 | **Contador de horas** en vivo (hoy, semana, periodo) para el empleado y en la ficha del empleado. | M |
| 06.5 | Cálculo de jornada (`workdays`): trabajadas, descanso, extra doble y triple, nocturnas, retardo, salida anticipada, estado. Se recalcula al llegar un marcaje o al aprobar una corrección. | M |
| 06.6 | Festivos del art. 74 precargados y editables; prima dominical; descanso trabajado. | M |
| 06.7 | Periodos de pago (semanal, catorcenal, quincenal, mensual) con cierre y bloqueo. | M |
| 06.8 | Bolsa de horas o saldo contra la jornada planificada (ref. Kenjo/Personio). | F2 |

## RF-07 Incidencias, solicitudes y aprobaciones
| ID | Requisito | Prio |
|---|---|---|
| 07.1 | Incidencias automáticas: retardo, falta, marca faltante, fuera de geocerca, horas extra, rostro no coincide. | M |
| 07.2 | Solicitudes del empleado: vacaciones (saldo por antigüedad, LFT art. 76), permiso, incapacidad, corrección de marcaje, horas extra. | M (vacaciones F2) |
| 07.3 | Flujo de aprobación de 1 nivel (supervisor). | M |
| 07.4 | Flujo de aprobación de varios niveles configurable. | F2 |
| 07.5 | Justificar una incidencia con una solicitud aprobada. | M |

## RF-08 Reportes PDF / Excel
| ID | Reporte | Prio |
|---|---|---|
| 08.1 | Hoja de horas por empleado con líneas de firma, folio y hash (ref. Timeero/Talana). | M |
| 08.2 | Asistencia diaria por sucursal. | M |
| 08.3 | Retardos y faltas (incidencias) del periodo. | M |
| 08.4 | Horas extra: dobles, triples y no autorizadas. | M |
| 08.5 | **Registro de jornada para la autoridad (LFT 132-XXXIV).** | M |
| 08.6 | Prenómina y exportación a **CONTPAQi** y **Aspel NOI**, más CSV genérico. | M (CSV) / F2 (layouts) |
| 08.7 | Indicadores ejecutivos con gráficos (PDF). | F2 |
| 08.8 | Envío programado por email. | F2 |
| 08.9 | Todos los reportes se generan en cola (pdfmake), con historial y descarga. | M |

## RF-09 Gráficos e indicadores
| ID | Requisito | Prio |
|---|---|---|
| 09.1 | Tablero con KPIs de hoy: presentes ahora, puntualidad, ausentismo, horas extra, marcajes por revisar, altas pendientes. | M |
| 09.2 | Gráficos base: asistencia de 30 días, mapa de calor de entradas por hora y día, horas extra por sucursal, ranking de retardos, horas planificadas vs. reales. | M |
| 09.3 | **Constructor de gráficos**: métrica × dimensión (sucursal, departamento, puesto, **campo personalizado**, día de la semana) × tipo × periodo; se guarda en el tablero. | F2 |
| 09.4 | Asistencia en vivo en mapa. | F2 |
| 09.5 | Costo laboral con tarifas y % sobre ventas (captura o integración). | F3 |
| 09.6 | Alertas por umbral: puntualidad menor a X %, horas extra mayores a Y, exceso de jornada (NOM-035). | F2 |

## RF-10 Notificaciones
Recordatorio de entrada o salida (si no ha checado X min después del turno),
alta aprobada o rechazada, solicitud resuelta, resumen diario al supervisor.
Canales: push (PWA), email y WhatsApp (conectores Twilio de jc-core). — M (email/push), F2 (WhatsApp)

## RF-11 Seguridad, privacidad y auditoría
Bitácora append-only, consentimientos versionados, ARCO, retención,
rol Inspector, límite de peticiones en endpoints públicos (liga, OTP,
kiosco), 2FA para administradores (Auth0). — M

## No funcionales
- **Rendimiento:** marcaje en menos de 500 ms p95.
- **Tableros:** menos de 2 s con 1,000 empleados.
- **Reportes:** de 500 empleados por mes, en menos de 60 s en la cola.
- **Disponibilidad:** 99.5 % (fase 1).
- **Accesibilidad:** WCAG 2.2 AA y objetivos de 48 px.
- **Idioma:** español de México (fase 1); i18n preparada.
- **Zonas horarias:** IANA por sucursal; turnos que cruzan la medianoche y el horario de verano.
