---
proyecto: Checador
fuente: jc-attendance/docs/investigacion/C-tecnica-ux-stitch.md
sincronizado: 2026-10-21
tags: [checador, asistencia]
---

# Investigación: SaaS multi-tenant de registro de entradas y salidas (asistencia)

Fecha: 2026-10-20. Stack objetivo: NestJS + TypeORM + PostgreSQL (BD compartida con otra app) + Angular. Fuentes numeradas al final; [n] = fuente. **[NV]** = no verificado contra fuente primaria / fuentes en conflicto.

> Nota de método: el proxy de esta sesión bloqueó WebFetch a varios dominios (typeorm.io, postgresql.org, blog.google, stitch.withgoogle.com). Esas partes se apoyan en resultados de búsqueda (snippets) y no en lectura completa. El comportamiento de TypeORM con `schema` + `migrationsTableName` SÍ se verificó leyendo el código fuente publicado en npm (typeorm 0.3.20).

---

## 0. Hallazgo legal crítico (México) — afecta el producto entero

- Reforma LFT publicada en DOF el **1 mayo 2026** (tras reforma constitucional al art. 123 del 3 mar 2026): jornada baja gradualmente de 48 h a **40 h semanales en 2030** (48→46 en 2027→44→42→40) y se reforman arts. 59, 61, 66, 68, 69, 71, **132** y **994** [26][27][28][29].
- **Art. 132 fr. XXXIV: obligación del patrón de llevar REGISTRO ELECTRÓNICO de la jornada** (hora de inicio y fin de cada trabajador) y entregarlo a la autoridad; multa **250–5,000 UMA** (art. 994 fr. IV Bis) [27][28][29].
- La STPS emitirá disposiciones generales; varias fuentes sitúan la exigencia plena el **1 ene 2027** (transitorio quinto), otras dicen que aplica desde publicación **[NV — revisar DOF]** [27][29].
- Horas extra: el tope de horas extraordinarias sube gradualmente (9/sem en 2026-27 → 12 en 2030) y cambia el art. 68; la regla tradicional "dobles las primeras 9 h/sem, triples el excedente" y jornadas diurna (6-20 h, máx 8), nocturna (20-6 h, máx 7), mixta (< 3.5 h nocturnas, máx 7.5) [24][25]. **El texto reformado completo del art. 68 no se pudo confirmar [NV]**.

**Implicación de producto**: es un argumento de venta fuerte (cumplimiento obligatorio) y obliga a: inmutabilidad/auditoría de marcajes, exportación para autoridad, conservar la marca original aunque se redondee, y parametrizar el motor de reglas por año (tope de horas cambia cada año hasta 2030).

---

## 1. Antifraude en el marcaje

| Técnica | Cómo funciona | Pros | Contras / notas |
|---|---|---|---|
| **Geocerca radio** | círculo centro+radio; `ST_DWithin(geography)` en PostGIS | simple, barato | GPS urbano tiene error de decenas de metros; Jibble exige **≥300 m** para auto-clock por geocerca [6]; iOS limita a **20 geocercas activas** por app [6] |
| **Geocerca polígono** | `ST_Covers/ST_Contains` en PostGIS | se ajusta a naves/obras irregulares | `ST_Contains` NO cuenta el borde (usar `ST_Covers`); geometrías inválidas dan resultados erróneos [18][19] |
| **Umbral de precisión GPS** | `Location.getAccuracy()` = radio de **68% de confianza** en metros [2] | permite rechazar lecturas malas | Regla recomendada (inferencia): aceptar si `distancia - accuracy <= radio` y `accuracy <= 50–100 m`; si no, marcar "requiere revisión" en vez de bloquear |
| **Detección de ubicación simulada (Android)** | `Location.isFromMockProvider()` (API 18, deprecado) → `isMock()` (API 31) [2][3]; `ALLOW_MOCK_LOCATION` no sirve desde API 23 [3] | trivial de leer | spoofers con root/hook lo burlan; HyperTrack añade heurística en servidor (velocidad, rumbo, altitud y precisión constantes son típicas de feeds falsos) [1] |
| **iOS simulación** | `CLLocation.sourceInformation.isSimulatedBySoftware` (iOS 15+) [4][5] | oficial | Apple confirmó en foros que **solo detecta simulación de Core Location (Xcode/GPX), no herramientas de terceros** [5] |
| **Play Integrity (Android)** | veredicto firmado: `MEETS_DEVICE_INTEGRITY/STRONG`, `appRecognitionVerdict`, `appLicensingVerdict`, opcional `appAccessRiskVerdict` y `playProtectVerdict` [7] | detecta root, app modificada, sideload, apps que capturan/controlan pantalla | **No dice nada de ubicación** [7]; requiere app nativa publicada en Play |
| **App Attest / DeviceCheck (iOS)** | clave en Secure Enclave certificada por Apple; assertions por request; DeviceCheck guarda 2 bits por dispositivo que sobreviven reinstalación [30] | vinculación fuerte app+dispositivo | no funciona en simulador; requiere app nativa |
| **Vinculación de dispositivo (device binding)** | registrar 1-N dispositivos por empleado (App Attest / Play Integrity / passkey WebAuthn en PWA); aprobación de admin para cambiar | evita "marcar por el compañero" desde otro teléfono | soporte para cambio de teléfono; WebAuthn/passkey en PWA es la opción web **[NV, no investigado a fondo]** |
| **Selfie + face match** | AWS Rekognition `CompareFaces`/`SearchFacesByImage` + Face Liveness (score 0–100 y "reference image") [8][9] | evita buddy punching | AWS: mostrar al usuario solo pass/fail, no el score [9]; Tanda usa Rekognition solo para **marcar para revisión**, no bloquear [10]; Truein bloquea y pide reintento [11] |
| **Azure Face** | Identify/Verify son **Limited Access**: formulario, aprobación discrecional de Microsoft (5–10 días), solo clientes gestionados; liveness SDK también restringido; Detect sí libre [12][13] | — | riesgo de no ser aprobado; preferir AWS u on-device |
| **On-device (MediaPipe / face-api.js)** | MediaPipe Face Landmarker da landmarks 3D + blendshapes (`@mediapipe/tasks-vision`) [14]; face-api.js (tfjs) detección+reconocimiento+68 landmarks [15] | sin coste por llamada, privacidad | **no hay liveness robusto listo**: un reto de parpadeo/giro con blendshapes se burla con video; no certificado ISO 30107-3 |
| **Certificación liveness** | ISO/IEC 30107-3 (PAD), lab iBeta (NVLAP); Nivel 1 = foto impresa, pantalla, video; Nivel 2 = máscaras 3D; métrica IAPAR [16][17] | criterio objetivo para elegir proveedor | pasivo = menos fricción, activo = más resistencia a replay (afirmación de vendor) |
| **QR rotativo en kiosco (TOTP)** | kiosco muestra QR con TOTP que cambia cada 3–30 s; servidor acepta solo el último y un uso [20][21][22] | barato (tablet), prueba presencia física | captura+envío dentro de la ventana sigue funcionando → combinar con ventana corta, uso único, dispositivo vinculado y geocerca. NoahFace: nº empleado + TOTP de 6 dígitos cada 30 s [21]; Google Wallet: periodo típico ~1 min, ejemplo 3 s [22] |
| **NFC tags** | Web NFC (`NDEFReader`) solo Chrome Android ≥89, HTTPS, solo NDEF [31][32]; no en iOS Safari | tag barato en punto fijo | tag estático se clona/fotografía el contenido NDEF → usar tags con firma/contador (NTAG 424 DNA SUN) **[NV]** o NFC nativo |
| **IP / Wi-Fi** | IP: requiere IP estática y solo prueba "estar en la red" [33][34]; SSID se falsifica, mejor **BSSID** [35] | cero hardware | **Una PWA no puede leer SSID/BSSID** (solo app nativa); IP pública cambia en ISPs residenciales |

**Recomendación**: puntuación de riesgo por marcaje (no un solo bloqueo): geocerca + accuracy + mock flag + integridad de dispositivo + (opcional) selfie/QR. Riesgo alto → marcaje "pendiente de revisión" en vez de rechazar (mejor UX y evita litigios). Política configurable por cuenta/ubicación.

**Privacidad biométrica**: reforma LFPDPPP publicada DOF 20 mar 2025; biométricos son datos sensibles con sanciones agravadas [36]. En Ecuador (SPDP) y España (AEPD) las autoridades consideran que el consentimiento laboral para fichaje biométrico no es libre [37][38] — referencia comparada, **no derecho mexicano [NV]**. Diseñar selfie como opt-in por cuenta, aviso de privacidad, retención limitada, alternativa no biométrica.

---

## 2. Marcaje offline-first

- **PWA + Workbox `BackgroundSyncPlugin`**: encola POST fallidos en IndexedDB y los reintenta con el evento `sync`; sin soporte nativo, reintenta al arrancar el SW [39]. **Safari/iOS no soporta Background Sync API (hasta iOS 26.5)** [40][41] → en iOS la cola se vacía al reabrir la app; hacer flush manual en `online`/`visibilitychange`.
- **Idempotencia**: cada marcaje lleva un UUID v4 generado en el cliente (una vez por acción lógica, reutilizado en reintentos) como `Idempotency-Key`; el servidor guarda la respuesta y rechaza el mismo key con distintos parámetros (modelo Stripe; borrador IETF del header) [42][43].
- **Hora confiable**: con conexión, **la hora del servidor manda** (UKG/Kronos) [44]; offline se guarda hora del dispositivo + reloj monotónico y se marca "hora no verificada" si se perdió sincronización (p.ej. reinicio) [44]. Fareclock detecta cambios de hora offline y marca o bloquea el dispositivo [45]; Insightful compara hora local vs servidor [46].
  - Técnica (inferencia): al sincronizar, enviar `deviceTime`, `elapsedRealtime/performance.now()` desde el último sync con servidor y `serverTimeAtLastSync`; servidor reconstruye `serverTimeAtLastSync + Δmonotónico` y compara con `deviceTime`.
  - **RFC 3161 (TSA)**: sellado de tiempo por tercero sobre el hash; útil para sellar diariamente un hash encadenado de los marcajes (evidencia ante autoridad), no para cada marcaje offline [47].
- **Conflictos**: modelo append-only de eventos (`punch_event`), nunca sobrescribir; el cálculo de jornada es una proyección re-calculable. Duplicados por idempotency key; secuencias imposibles (dos entradas seguidas) → incidencia para revisión.

---

## 3. Motor de reglas (políticas)

Cómo lo modelan los vendors:
- **UKG/Kronos**: "Pay Policies" > "Work Rule Building Blocks" (rounding, grace, overtime, zonas), asignadas a grupos de empleados [48][49]. Punch round rule con *increment* + *grace* (si el exceso ≤ grace va al incremento anterior, si no al siguiente) [49]; interval rounding redondea el total diario (8:18 → 8:15 con 15/07) [50]. Ejemplo de configuración pública: gracia 7 min, 15 min en la primera marca, comida ≤22 min sin descuento [51].
- **Deputy**: reglas de pago con overtime por periodo (requiere recálculo de negocio) y cargos por hora completa [52].
- **Roubler**: separa *rounding* (cálculo) de *grace* (auto-aprobación de timesheets) [53].
- **EE. UU. 29 CFR 785.48(b)**: redondeo a 5, 6 o 15 min permitido solo si es **neutral** en el tiempo; "regla de 7 min" (1–7 abajo, 8–14 arriba) [54][55]. Siempre conservar la marca real (es registro legal) [56].

Modelo propuesto (inferido de lo anterior):
```
policy (por cuenta, versionada con vigencia desde/hasta)
 ├─ schedule/shift templates (inicio, fin, cruza_medianoche, días, tz IANA de la ubicación)
 ├─ tolerance: entrada_gracia_min, retardo_hasta_min, falta_despues_min, N retardos = 1 falta
 ├─ rounding: modo (punch | interval | none), incremento, grace, dirección
 ├─ breaks: auto-deducción / obligatoria / pagada, duración mínima
 ├─ overtime: diario/semanal, requiere autorización, tramos (2x, 3x) por año de vigencia (reforma 2026-2030)
 ├─ night/mixed classification (LFT 20:00–06:00, mixta <3.5 h nocturnas)
 └─ holidays: calendario por cuenta (oficiales + propios), prima por descanso/festivo
```
- **Turnos que cruzan medianoche y DST**: guardar instantes en `timestamptz`; derivar la "fecha laboral" con `AT TIME ZONE` usando la zona IANA de la ubicación; calcular duración desde instantes (un turno con cambio de horario dura ≠ diferencia de reloj) [57][58]. `timestamp` sin zona es ambiguo en la hora repetida [58]. México eliminó el horario de verano en 2022 salvo franja fronteriza **[conocimiento previo, NV en esta sesión]** → igualmente usar IANA (`America/Mexico_City`, `America/Tijuana`).
- Regla: "fecha laboral" = fecha de inicio del turno programado (asignar marcaje al turno cuya ventana [inicio−X, fin+Y] lo contiene).

---

## 4. Campos personalizados en Postgres multi-tenant

- **EAV**: flexible pero self-joins lentos; casos reportados de 30+ s → mucho menos al migrar a JSONB+GIN; JSONB ocupó menos (1.8 GB tabla + 318 MB índices en un benchmark) [59][60].
- **JSONB recomendado** (híbrido): columnas relacionales para lo estable + `custom_fields jsonb` para lo variable [59][61][62].
  - Índice GIN `jsonb_ops` (default) soporta `?`, `?|`, `?&`, `@>`; `jsonb_path_ops` es más pequeño y para `@>` (y `@?`/`@@` jsonpath) **[NV — fuentes en conflicto, docs de PG no accesibles]** [61][62].
  - Para claves "calientes" (filtros/ordenamiento en reportes): índice de expresión B-tree `((custom_fields->>'num_empleado'))` [61].
  - Hilo pgsql-general sobre EAV multi-tenant: alternativas y riesgo de cientos de índices si cada tenant tiene tabla propia [63].
- **Definiciones**: tabla `custom_field_definition(account_id, entity, key, label, type, required, options, validation, visible_in_reports, order, status)`; generar JSON Schema por cuenta y validar en la app (Ajv / class-validator dinámico). `pg_jsonschema` (`jsonb_matches_schema` en CHECK) es una opción en BD [64][65], pero un CHECK con schema por tenant es incómodo → validar en el process/checker y opcionalmente con trigger.
- **Reportes/gráficas**: exponer solo campos tipo enum/booleano/número como dimensiones de agrupación; `GROUP BY custom_fields->>'area'`. Claves estables (slug inmutable), renombrar solo `label`.

---

## 5. Auto-registro por link de invitación

- Token aleatorio ≥128 bits (CSPRNG), guardar **solo hash**; o token firmado con `exp` [66][67]. Códigos cortos para teclear → vida más corta por menor entropía [66].
- `max_uses` (1 = uso único, 0 = ilimitado), `expires_at`, `revoked_at`, rol/ubicación por defecto; revocación inmediata si se filtra; tratar la URL como credencial [66][68][69].
- Canje atómico (estado terminal; evitar race en `uses < max_uses` con `UPDATE ... WHERE uses < max_uses RETURNING`) [66].
- Restricción por dominio de email (allow-list) — separar de bloqueo de dominio [70].
- **Cola de aprobación**: estado `pending_approval → approved/rejected`, con razones y reglas de validación automáticas (campos obligatorios, documento, foto).
- **Duplicados**: normalizar y buscar por CURP (18 car., dígito verificador mod 10 sobre los 17 primeros), RFC (homoclave + dígito), email (minúsculas), teléfono (E.164) dentro de la cuenta; un usuario puede pertenecer a varias cuentas → la unicidad de CURP es por *persona global*, el vínculo empleado es por cuenta [71][72]. Regex+checksum solo valida formato; existencia real requiere RENAPO/proveedor [73] **[NV: API oficial RENAPO no documentada en fuentes]**.

---

## 6. Compartir una BD Postgres con otra app

1. **Esquema propio** (p.ej. `attendance`) y **rol propio** dueño del esquema; rol de app sin `CREATE` fuera de su esquema. Revocar privilegios por defecto de `PUBLIC` (en PG15+ ya no hay `CREATE` en `public` por defecto) [74][75]. `ALTER DEFAULT PRIVILEGES FOR ROLE owner IN SCHEMA attendance GRANT ...` solo afecta objetos futuros; per-schema solo puede *añadir* privilegios [74][76].
2. **TypeORM (verificado en código de typeorm 0.3.20)**: `MigrationExecutor` toma `schema` de las opciones del driver y crea la tabla de migraciones como `buildTableName(migrationsTableName, schema)` → con `schema: 'attendance'` y `migrationsTableName: 'attendance_migrations'` la tabla vive en `attendance.attendance_migrations` y no choca con la `public.migrations` de la otra app. Si no se pone `schema`, el driver usa el `current_schema`/search_path [77][78][79].
   - `synchronize: false` siempre. Entidades con `@Entity({ schema: 'attendance' })` o heredar del `schema` del DataSource.
   - Ojo: `migration:generate` compara solo las tablas de las entidades registradas; pero revisar cada migración generada para que no toque objetos de la otra app.
3. **Referencias cross-schema**: FK a tablas de la otra app solo si se acepta acoplamiento (bloquea migraciones de la otra app); alternativa: guardar el id sin FK + vista de solo lectura con `GRANT SELECT` mínimo.
4. **RLS para multi-tenant**: `ENABLE` + `FORCE ROW LEVEL SECURITY` (el dueño la salta por defecto), política `USING` + `WITH CHECK` sobre `account_id = current_setting('app.account_id')::uuid`, fijado con `SET LOCAL` dentro de cada transacción (con pool, `SET` filtra el tenant entre requests) [80][81][82]. Indexar `account_id`. Nota: CLAUDE.md de jc-core prohíbe `manager.transaction` en servicios — aplicar `SET LOCAL` requiere un wrapper en la capa DAO / subscriber de QueryRunner; decidir explícitamente.

---

## 7. KPIs, gráficas y PDF

KPIs (fórmulas):
- **Ausentismo** = días/horas ausentes ÷ días/horas programadas × 100; separar justificadas/injustificadas y excluir vacaciones [83][84][85].
- **Puntualidad** = turnos con entrada a tiempo ÷ turnos trabajados × 100 (meta habitual ≥95%) [83].
- **Ausencia no planificada** = ausencias no programadas ÷ ausencias totales × 100 [84].
- **% horas extra** = horas extra ÷ horas trabajadas × 100 (fórmula común, no estandarizada en fuentes) [86].
- **Costo laboral** = Σ(horas ordinarias × tarifa) + Σ(extra × tarifa × factor); requiere salario por empleado (campo sensible).
- Otros: horas programadas vs trabajadas, marcajes fuera de geocerca, incidencias pendientes, rotación por ubicación [86].

Gráficas: KPI tiles con tendencia; línea (ausentismo semanal); barras apiladas (horas ordinarias/extra por ubicación); **heatmap hora×día de la semana** de entradas; heatmap calendario de asistencia por empleado; donut solo para distribución de incidencias. En Angular: Apache ECharts + `ngx-echarts` (v20 para Angular 20, soporte standalone `provideEchartsCore`) con sistema de coordenadas `calendar` para heatmap [87][88].

PDF en Node:
- **pdfmake**: declarativo, ligero, ya usado en jc-core; ideal para tablas (timesheet, pre-nómina) [89].
- **Puppeteer**: HTML/CSS de alta fidelidad (reusar diseño), pero Chromium pesado, arranques lentos, memoria; necesita pool + cola Bull [90][91].
- Recomendación: pdfmake para reportes tabulares en cola Bull; Puppeteer solo si se quiere reusar layouts HTML de Stitch.
- Reportes típicos: tarjeta/timesheet por empleado y periodo; asistencia diaria; **incidencias** (faltas, retardos, salidas anticipadas, omisiones de marcaje); horas extra (dobles/triples); **pre-nómina** (horas, faltas, retardos, extras, incapacidades por periodo, export CSV/Excel a nómina) [92][93][94]; reporte de registro electrónico para autoridad (art. 132 XXXIV).

---

## 8. Google Stitch (stitch.withgoogle.com)

- **Qué es**: experimento de Google Labs (lanzado mayo 2025, sucesor de Galileo AI) que genera UI y código frontend desde prompts e imágenes [95][96]. El **18–19 mar 2026** se rediseñó como "AI-native design canvas": lienzo infinito, agente de diseño, voz, generación multi-pantalla ("vibe design") [97][98].
- **DESIGN.md**: archivo markdown "agent-friendly" con colores (hex), tipografía, espaciado; importar/exportar reglas de diseño; Google **open-sourceó la especificación** (abr 2026); se puede extraer un design system desde una URL [99][100].
- **Exportación**: "Copy to Figma" (capas nombradas, Auto Layout) — reportado como disponible solo en modo Standard / deshabilitado en Pro; workaround: descargar HTML e importar con plugin html.to.design [101][102]; HTML/CSS (algunos dicen Tailwind; otros "CSS inline") **[NV, fuentes en conflicto]** [101][103].
- **MCP/API**: endpoint remoto `https://stitch.googleapis.com/mcp`, autenticación con API key generada en Settings de Stitch (header `X-Goog-Api-Key`) según guías; otra ficha dice OAuth **[NV]**; herramientas: proyectos, pantallas, design system, generar/editar/variantes, export [104][105][106]. También se mencionan SDK y "Agent Skills". Cuota free citada: 350 generaciones/mes **[NV]**. Wrappers comunitarios (`mcp-stitch`) existen: revisar código antes de dar la API key [106].
- **Cómo promptear por pantalla** [101][107][108]:
  1. Primero un prompt "fundación": producto, usuario, plataforma (móvil/escritorio), tema y tono → fijar DESIGN.md (colores de marca de lumen-view/jc, tipografía, radios, espaciado) y reusarlo en todas las pantallas.
  2. Por pantalla, estructura **Contexto → Estructura → Contenido → Estilo**: quién la usa y para qué, secciones en orden, datos reales de ejemplo (nombres en español, horas, ubicaciones), estados (vacío, error, cargando, offline), componentes concretos.
  3. Iterar con cambios pequeños y específicos (uno o dos por prompt).
  4. Ejemplo: "App móvil de asistencia, pantalla Inicio del empleado. Muestra arriba estado actual ('Fuera de turno' / 'En turno desde 08:02'), ubicación detectada con indicador de geocerca, un botón grande 'Registrar entrada' ocupando el tercio inferior alcanzable con el pulgar, debajo resumen del día (horas trabajadas, descanso) y últimos 3 registros. Estado sin conexión con banner 'Se enviará al reconectar'. Usa DESIGN.md del proyecto, español MX."
  5. Exportar a Figma para ajustes y a HTML como referencia; el código final se reescribe en componentes Angular Material (Stitch no genera Angular).

---

## 9. UX móvil para marcaje + accesibilidad

- **One-tap**: botón principal grande en zona del pulgar, que cambia de "Entrada" a "Salida"/"Iniciar descanso" según estado; confirmación con hora del servidor, ubicación y feedback háptico; deshacer en 10–30 s (o "solicitar corrección") en vez de diálogos de confirmación.
- **Widget/estado**: Jibble y Humanforce ofrecen widget de inicio que abre la app en la pantalla de marcaje (Android refresca ~30 min) [109][110]; Keeping (iOS) ofrece widget de pantalla de bloqueo y **Live Activity** para entrada en curso que se puede detener desde ahí [111]. Para PWA no hay widgets → considerar app nativa/Capacitor más adelante.
- **Historial**: lista por día con totales, chips de incidencia (retardo, fuera de geocerca, pendiente de sync), solicitud de corrección desde el registro.
- **Accesibilidad**: WCAG 2.2 SC 2.5.8 (AA) objetivo ≥24×24 CSS px; AAA 44×44; Apple HIG 44 pt, Material 48 dp [112][113]. Además (conocimiento general): no depender solo del color para estado (texto + icono), anunciar resultado del marcaje con `aria-live`, soportar tamaño de texto del sistema, alternativa a selfie/geolocalización para personas con discapacidad o sin smartphone (kiosco/PIN), tiempos ajustables (SC 2.2.1) en QR rotativos.

---

## Fuentes consultadas
1. https://stories.hypertrack.com/hypertrack-detects-mock-locations-android/
2. https://developer.android.com/reference/android/location/Location
3. https://github.com/smarques84/MockLocationDetector
4. https://developer.apple.com/documentation/corelocation/cllocationsourceinformation.md
5. https://developer.apple.com/forums/thread/803179
6. https://www.jibble.io/help/restricting-locations-with-geofences-mobile
7. https://developer.android.com/google/play/integrity/verdicts
8. https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html
9. https://docs.aws.amazon.com/de_de/rekognition/latest/dg/recommendations-liveness.html
10. https://help.tanda.co/en/articles/3314802-timeclock-facial-detection-recognition
11. https://truein.com/ai-face-recognition-time-clock-software
12. https://learn.microsoft.com/legal/cognitive-services/computer-vision/limited-access-identity
13. https://learn.microsoft.com/en-us/answers/questions/1614037/when-do-i-need-to-request-access-from-microsoft-to
14. https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
15. https://itnext.io/face-api-js-javascript-api-for-face-recognition-in-the-browser-with-tensorflow-js-bcc2a6c4cf07
16. https://didit.me/blog/iso-30107-3-vs-ibeta-pad-level-2-liveness-detection-standards/
17. https://www.ibeta.com/wp-content/uploads/2024/03/240315-Veridas-PAD-Level-1-Confirmation-Letter.pdf
18. https://postgis.net/docs/ST_Contains.html
19. https://dzone.com/articles/how-to-do-simple-geofencing-with-postgis-1
20. https://help.buildpass.ai/en/articles/10314948-how-do-i-set-up-rotating-qr-codes-for-my-project
21. https://www.noahface.com/tech-notes/rotating-qr-codes
22. https://developers.google.com/wallet/retail/gift-cards/resources/rotating-barcodes
23. https://moodle.org/mod/forum/discuss.php?d=430601
24. https://mexico.justia.com/federales/leyes/ley-federal-del-trabajo/titulo-tercero/capitulo-ii
25. https://expansion.mx/carrera/2024/10/07/como-se-pagan-las-horas-extra-mexico-lft
26. https://www.jornada.com.mx/noticia/2026/05/01/politica/publican-en-dof-reforma-para-jornada-laboral-de-40-horas
27. https://factorial.mx/blog/reloj-checador-digital/
28. https://www.gtlaw.com/en/insights/2026/5/reforma-a-la-ley-federal-del-trabajo---reduccion
29. https://www.fiscoclic.mx/jornada-laboral/guia-de-cumplimiento-reforma-40-horas.html
30. https://developer.apple.com/documentation/devicecheck/dcappattestservice.md
31. https://developer.chrome.com/docs/capabilities/nfc
32. https://notificare.com/blog/2021/11/12/NFC-on-Chrome-for-Android
33. https://help.rotacloud.com/en/articles/595083-setting-up-restrictions-for-clocking-in
34. https://guides.timeforge.com/a/1290923-limit-clock-ins-and-clock-outs-to-a-specific-ip-address
35. https://www.opentimeclock.com/blog2026/wifi-only-attendance.html
36. https://portalerp.com/mx/noticia/cambios-a-la-lfpdppp-en-proteccion-de-datos-biometricos
37. https://nmslaw.com.ec/blog/2025/03/24/spdp-datos-biometricos-registro-asistencia-laboral-ecuador/
38. https://www.aepd.es/es/documento/e-03319-2017.pdf
39. https://developer.chrome.com/docs/workbox/modules/workbox-background-sync
40. https://caniuse.com/background-sync
41. https://bugs.webkit.org/show_bug.cgi?id=201866
42. https://docs.stripe.com/api/idempotent_requests
43. https://http.dev/idempotency-key
44. https://hlp02.gss.mykronos.com/help/HCM/administration/Mobile_app/how_the_system_prevents_mobile_device_clock_tampering_368671.html
45. https://support.fareclock.com/hc/en-us/articles/44964628313747-Can-Workers-Change-the-Device-Time-to-Manipulate-Punch-Records
46. https://help.insightful.io/en/articles/4703371-server-time-check-strict-time-feature
47. https://datatracker.ietf.org/doc/html/rfc3161
48. https://library.ukg.com/Prebuilt/newgen/WorkforceMgmt/Content/WFMRoundingRuleExamples-c_x57068.html
49. https://hlp03.gss.mykronos.com/help/HCM/oxy_ex-2/_shared/common_topics/punch_round_rules.html
50. https://hlp02.gss.mykronos.com/help/HCM/oxy_ex-2/_shared/common_topics/interval_round_rules.html
51. https://dbhdd.georgia.gov/document/publication/kronos-business-and-system-processing/download
52. https://help.deputy.com/hc/en-au/articles/10064204937487
53. https://support.roubler.com/hc/en-us/articles/360009100433
54. https://www.findlaw.com/employment/wages-and-benefits/7-minute-rule-for-time-keeping.html
55. https://jjkellercompliancenetwork.com/institute/rounding-practices-and-disregarding-time
56. https://www.risd.edu/sites/default/files/2026-08/payroll-guide-7-minute-rounding-rule.pdf
57. https://oneuptime.com/blog/post/2026-01-25-postgresql-timezone-handling/view
58. https://converttime.com/en/blog/postgres-time-zones
59. https://postgresweekly.com/link/8041/web
60. https://openskillindex.com/skills/intense-visions-harness-engineering-db-document-in-relational
61. https://www.sitepoint.com/postgresql-jsonb-query-performance-indexing/
62. https://thebuild.com/presentations/json2015-pgconfus.pdf
63. https://www.postgresql.org/message-id/CAH7-FAsLYDK3Jy9GN3%3DhY6w%3D2N%3D0CkGW9KmMgKafPx3PGOEDqw%40mail.gmail.com
64. https://github.com/supabase/pg_jsonschema/blob/master/README.md
65. https://supabase.com/docs/guides/database/extensions/pg_jsonschema
66. https://www.techinterview.org/post/3233468618/lld-invite-system/
67. https://docs.partnero.com/guides/partner-portal/single-sign-on
68. https://conducky.readthedocs.io/en/latest/user-guide/invite-links
69. https://www.mintlify.com/0-Sandy/better-auth-invite-plugin/concepts/token-types
70. https://knowledge.kaltura.com/help/pdfexport/id/689b38263e0dfba7be05b88a
71. https://satcfdi.readthedocs.io/en/26.7.2/_modules/satcfdi/models/curp.html
72. https://packagist.org/packages/webrek/mx-validation
73. https://curp-mexico.azure.tsu.edu/
74. https://www.red-gate.com/simple-talk/databases/postgresql/postgresql-basics-a-template-for-managing-database-privileges/
75. https://atlasgo.io/guides/postgres/security-default-privileges
76. https://man.archlinux.org/man/ALTER_DEFAULT_PRIVILEGES.7.en
77. https://registry.npmjs.org/typeorm/-/typeorm-0.3.20.tgz (código fuente: migration/MigrationExecutor.js, driver/postgres/PostgresDriver.js)
78. https://raw.githubusercontent.com/typeorm/typeorm/master/docs/docs/data-source/2-data-source-options.md
79. https://typeorm.io/docs/migrations/setup
80. https://fastapi-tenancy.readthedocs.io/en/latest/guides/isolation/rls/
81. https://stackharbor.com/en/knowledge-base/pg-row-level-security-multi-tenant/
82. https://edana.ch/en/2026/06/25/ensuring-multi-tenant-data-isolation-with-postgresql-row-level-security-rls/
83. https://www.rosterelf.com/blog/attendance-kpi-review
84. https://www.ordio.com/en/tools/absence-rate-calculator
85. https://www.breakroomapp.com/glossary/absence-rate
86. https://www.synerion.com/blog/15-workforce-management-metrics-to-track-for-success-in-2026
87. https://classic.yarnpkg.com/en/package/ngx-echarts
88. https://mintlify.com/apache/echarts/concepts/coordinate-systems
89. https://joyfill.io/blog/integrating-pdf-generation-into-node-js-backends-tips-gotchas
90. https://blog.logrocket.com/best-html-pdf-libraries-node-js
91. https://apryse.com/blog/pdf-sdk-vs-puppeteer-pdf-generation
92. https://factorial.mx/blog/incidencias-de-nomina/
93. https://www.control2000.com.mx/productos/folletos/CH.pdf
94. https://vlex.com.mx/vid/reportes-844405113
95. https://developers.googleblog.com/stitch-a-new-way-to-design-uis/
96. https://alternativeto.net/news/2025/5/google-launches-stitch-a-new-ai-app-builder-for-ui-design-and-frontend-code/
97. https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/
98. https://storyboard18.com/digital/google-unveils-stitch-update-introduces-ai-led-vibe-designing-for-apps-and-websites-92702.html
99. https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/
100. https://designmd-store.com/blog/google-stitch-design-md-workflow
101. https://uithings.com/what-is-google-stitch
102. https://discover.oreateai.com/discover/how-to-successfully-export-google-stitch-designs-directly-into-figma
103. https://sfailabs.com/guides/google-stitch-vs-figma
104. https://sotaaz.com/post/stitch-mcp-api-en
105. https://www.pulsemcp.com/servers/greensheep01201-stitch
106. https://aiidelist.com/blog/stitch-mcp-server-guide
107. https://www.codecademy.com/article/google-stitch-tutorial-ai-powered-ui-design-tool
108. https://0xminds.com/blog/guides/google-stitch-tutorial-prompts-guide
109. https://www.jibble.io/help/time-tracking-widget
110. https://help.humanforce.com/hc/en-au/articles/17085634617359-Add-the-Clocking-widget-to-your-home-screen-Work-app
111. https://keeping.nl/en/time-registration-app/iphone
112. https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html
113. https://www.getstark.co/wcag-explained/operable/input-modalities/target-size-minimum/

Leídas completas vía WebFetch/código: 2 (parcial), 7, 77, 78. El resto se consultó vía resultados de búsqueda (fragmentos); los dominios typeorm.io, postgresql.org, blog.google, stitch.withgoogle.com y sotaaz.com fueron bloqueados por el proxy al intentar abrirlos.
