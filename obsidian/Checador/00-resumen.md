---
proyecto: Checador
fuente: jc-attendance/docs/00-resumen.md
sincronizado: 2026-10-21
tags: [checador, asistencia]
---

# 00 · Resumen ejecutivo: Checador (jc-attendance)

**Qué es:** un SaaS multicuenta de **registro de entradas y salidas** para patrones y sus empleados. Incluye:
- Alta de empleados por liga, con validación y reglas.
- Campos personalizados.
- Ubicaciones y geocercas.
- Contador de horas.
- Reportes PDF.
- Gráficos e indicadores.

**Dónde vive:**
- Repo nuevo `jcvalderrabanoh/jc-attendance`.
- Usa la **misma base PostgreSQL de jc-core**, pero dentro de su propio esquema `attendance`. No modifica el modelo de datos de jc-core.

**Por qué ahora:**
- La reforma a la LFT publicada en el DOF el 1-may-2026 obliga a los patrones a llevar un **registro electrónico de la jornada** (art. 132 fr. XXXIV), con multas de 250 a 5,000 UMA.
- Las disposiciones de la STPS entran en vigor el 1-ene-2027.
- La jornada baja a 40 h de forma gradual hasta 2030.

**Diferenciador:** ningún competidor de LatAm analizado combina estas cuatro cosas:
1. Liga de alta con reglas automáticas (CURP/RFC/NSS, duplicados).
2. Cola de aprobación.
3. Campos personalizados que se pueden graficar.
4. Multicuenta para el empleado.

Las referencias globales más cercanas son Connecteam (liga con aprobación) y Jibble (multiorganización y liveness).

## Índice
| Doc | Contenido |
|---|---|
| [[01-investigacion-mercado\|01 · Investigación de mercado]] | 57 productos, KPIs, precios, conclusiones |
| [[02-requisitos-funcionales\|02 · Requisitos funcionales]] | RF-01…RF-11 priorizados (MVP / F2 / F3) |
| [[03-arquitectura\|03 · Arquitectura]] | BD compartida sin interferir, identidades, stack |
| [[04-modelo-de-datos\|04 · Modelo de datos]] | Esquema `attendance` |
| [[05-reglas-y-validaciones\|05 · Reglas y validaciones]] | Alta, marcaje, motor LFT |
| [[06-cumplimiento-legal\|06 · Cumplimiento legal]] | LFT 2026, LFPDPPP, NOM-035, checklist |
| [[07-pantallas-y-stitch\|07 · Pantallas y Stitch]] | 29 pantallas con su prompt para Stitch (A1–A8, B1–B2, C1–C18, D1) |
| [[08-plan-de-accion\|08 · Plan de acción]] | Fases, sprints, riesgos, precios |
| [[09-fuentes\|09 · Fuentes]] | 401 URLs de 252 dominios |
| `investigacion/` | Anexos A (global), B (LatAm y legal), C (técnica, UX y Stitch) |

## Decisiones clave
1. Un servicio aparte (NestJS) que comparte la BD usando un esquema propio y un rol de solo lectura sobre `public`. jc-core solo recibe un cambio: `AppEnum.Attendance`.
2. El patrón entra con su usuario de jc-core (Auth0, multicuenta ya resuelto). El empleado tiene su propia identidad con OTP y no ocupa asiento en jc-core.
3. Los marcajes son inmutables y llevan la hora del servidor. Las correcciones se guardan como registros nuevos.
4. Antifraude por puntaje de riesgo: lo dudoso va a revisión, no se bloquea.
5. El motor de reglas de la LFT se versiona por fecha de vigencia.
6. Primero una PWA offline-first; las apps nativas llegan en la fase 4.
7. **Acceso integral:** el mismo usuario de jc-core entra a lumen-view, anestesia y asistencia. Las pantallas del patrón viven en core-front; la del empleado y el kiosco son una PWA aparte.
