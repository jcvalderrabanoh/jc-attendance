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
| [01 · Investigación de mercado](01-investigacion-mercado.md) | 57 productos, KPIs, precios, conclusiones |
| [02 · Requisitos funcionales](02-requisitos-funcionales.md) | RF-01…RF-11 priorizados (MVP / F2 / F3) |
| [03 · Arquitectura](03-arquitectura.md) | BD compartida sin interferir, identidades, stack |
| [04 · Modelo de datos](04-modelo-de-datos.md) | Esquema `attendance` |
| [05 · Reglas y validaciones](05-reglas-y-validaciones.md) | Alta, marcaje, motor LFT |
| [06 · Cumplimiento legal](06-cumplimiento-legal.md) | LFT 2026, LFPDPPP, NOM-035, checklist |
| [07 · Pantallas y Stitch](07-pantallas-y-stitch.md) | 29 pantallas con su prompt para Stitch (A1–A8, B1–B2, C1–C18, D1) |
| [08 · Plan de acción](08-plan-de-accion.md) | Fases, sprints, riesgos, precios |
| [09 · Fuentes](09-fuentes.md) | 401 URLs de 252 dominios |
| `investigacion/` | Anexos A (global), B (LatAm y legal), C (técnica, UX y Stitch) |

## Decisiones clave
1. Un servicio aparte (NestJS) que comparte la BD usando un esquema propio y un rol de solo lectura sobre `public`. jc-core solo recibe un cambio: `AppEnum.Attendance`.
2. El patrón entra con su usuario de jc-core (Auth0, multicuenta ya resuelto). El empleado tiene su propia identidad con OTP y no ocupa asiento en jc-core.
3. Los marcajes son inmutables y llevan la hora del servidor. Las correcciones se guardan como registros nuevos.
4. Antifraude por puntaje de riesgo: lo dudoso va a revisión, no se bloquea.
5. El motor de reglas de la LFT se versiona por fecha de vigencia.
6. Primero una PWA offline-first; las apps nativas llegan en la fase 4.
7. **Acceso integral:** el mismo usuario de jc-core entra a lumen-view, anestesia y asistencia. Las pantallas del patrón viven en core-front; la del empleado y el kiosco son una PWA aparte.
