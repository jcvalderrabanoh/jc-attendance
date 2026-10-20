# Benchmark: control de asistencia / registro de entradas y salidas, proveedores globales, EE. UU. y UE

Fecha de investigación: 20-oct-2026. Producto objetivo: SaaS multi-tenant para patrones y empleados.

## 0. Metodología y limitaciones (leer primero)

- **WebFetch no funcionó con ningún dominio de proveedor.** El proxy de salida de esta sesión bloquea el acceso directo (`getaddrinfo ENOTFOUND` y `CONNECT 403`, por ejemplo con deputy.com). Por eso **no se abrió directamente ninguna página de precios de proveedor**. Todo se obtuvo con WebSearch, que devuelve fragmentos resumidos de las URLs indexadas (centros de ayuda y páginas de producto de los proveedores, Capterra, G2, GetApp, Software Advice, TechRepublic, comparadores y reseñas de competidores).
- Por esta razón, **los precios llevan la etiqueta "fuente secundaria"** salvo que el fragmento viniera del dominio del propio proveedor. Varias fuentes se contradicen. Se indica el rango y la discrepancia.
- No aparecieron en los resultados páginas de Forbes Advisor, TechRadar ni PCMag. Se usaron TechRepublic, G2, Capterra, GetApp, Software Advice y SelectHub como fuentes de reseñas.
- Leyenda: **[V]** = confirmado en una página del proveedor (web o centro de ayuda), vista a través del fragmento de búsqueda. **[3P]** = fuente de terceros. **[C]** = fuente de un competidor (posible sesgo). **[NV]** = no verificado o sin datos.

---

## 1. Fichas por producto (31 productos)

### 1. Deputy (Australia/EE. UU.)
- **URLs:** deputy.com/features/time-clock, deputy.com/au/features/kiosk, deputy.com/au/features/employee-time-clock, help.deputy.com (onboarding, Insights y Labour %), deputy.com/blog/introducing-employee-onboarding, erpresearch.com/.../deputy/pricing, rosterelf.com/reviews/deputy, capterra.com/p/167811/Deputy
- **Métodos de fichaje:** app móvil, web y Kiosk app (iPad y tablet Android). Fichaje **sin contacto con verificación facial** en el kiosco [V].
- **Geocerca/GPS:** geocercas GPS multiubicación con registro del lugar de fichaje [V].
- **Antisuplantación:** verificación facial y foto en el kiosco [V]. No se encontraron datos de prueba de vida (liveness) [NV].
- **Modo sin conexión:** [NV].
- **Turnos:** sí, es el núcleo del producto (programación automática por demanda).
- **Reglas de horas extra y pausas:** recordatorios de pausa y alertas al encargado cuando no se toma una pausa [V]. Horas extra, recargos y reglas de convenio (Modern Awards y EBA en Australia) [V]. Detalle para EE. UU. [NV].
- **Aprobaciones:** aprobación de hojas de horas y "auto-approval" en el plan Core [3P].
- **Onboarding:** el encargado envía la invitación por **SMS y correo** (el SMS es gratuito). El empleado rellena datos personales, bancarios e I-9/W-4 (o TFN y super en Australia), sube documentos y firma electrónicamente. El encargado revisa al terminar. No se recomienda asignar turnos a un empleado que no haya completado el alta [V].
- **Campos personalizados:** hasta 20 preguntas adicionales en el onboarding (respuesta corta, sí/no o elección múltiple), que alimentan las plantillas de documentos [V].
- **Informes:** "Hours, Costs & Sales Analysis", exportaciones a nómina e informes programados en Analytics+ [V].
- **Dashboards/KPIs:** horas programadas frente a reales, coste salarial programado frente a real, desviación de costes, **% de coste laboral sobre ventas**, ventas por hora y Business Insights Dashboard. El add-on **Analytics+** ofrece paneles interactivos, desglose (drill-down) e informes a medida [V].
- **Multiubicación:** sí (Location / Area).
- **Integraciones:** nómina (Deputy Payroll vía Paycor, Gusto, ADP, Xero y otras) y TPV para ventas.
- **Precios [3P, inconsistentes]:** Lite 5 USD, Core 6,50 USD y Pro 9 USD por usuario y mes (ERPResearch 2026). RosterElf da 7,50, 9,75 y 14,50, probablemente en AUD. Add-ons: Analytics+ 1,50, HR 2 y Messaging+ 1,95 USD por usuario y mes. TechRepublic cita una entrada de 5,50 USD.
- **Diferenciador:** cumplimiento de convenios y pausas, % de coste laboral sobre ventas, onboarding con documentos firmados.

### 2. When I Work (EE. UU.)
- **URLs:** capterra.com/p/121248/When-I-Work/pricing, workstream.us/blog/when-i-work-pricing, get.clockit.io/compare/clockit-vs-when-i-work [C], turnozo.com/blog/when-i-work-review [C], erpresearch.com/.../when-i-work
- **Fichaje:** móvil, web y terminal/kiosco [NV en el detalle]. Hay quejas de usuarios sobre el fichaje móvil [C].
- **Geocerca, antisuplantación, offline:** [NV]. No se encontró documentación oficial en los resultados.
- **Turnos:** núcleo del producto.
- **Horas extra:** el cálculo de horas extra entre centros está en planes superiores [C].
- **Precios [3P]:** Essentials 2,50, Pro 5 y Premium 8 USD por usuario y mes. La asistencia es un módulo que se activa aparte: Essentials con fichaje cuesta unos 4 USD por usuario. Se factura por bloques de 5 plazas [C]. Premium añade API, webhooks y SAML/SSO. Prueba de 14 días.
- **Diferenciador:** precio de entrada bajo, enfocado en turnos.

### 3. Homebase (EE. UU.)
- **URLs:** capterra.com/p/153076/Homebase/pricing, joinhomebase.com/time-clock/time-attendance-software, joinhomebase.com/blog/best-geofencing-time-clock, joinhomebase.com/time-clock/biometric-time-clock, timeero.com/reviews/homebase-review [C], buddypunch.com/blog/homebase-review [C], hivedesk.com/homebase-review, fr-be.trustpilot.com/review/joinhomebase.com
- **Fichaje:** tablet/kiosco, ordenador, móvil y TPV [V].
- **Geocerca:** radios fijos de 150 ft, 1 manzana o 5 manzanas, sin geocercas a medida ni por rol [C]. Toma una captura GPS en cada fichaje.
- **Antisuplantación:** foto al entrar, al iniciar la pausa y al salir (tablet), PIN. Página propia de "biometric time clock" [V] (el alcance biométrico real está [NV]).
- **Offline:** [NV].
- **Reglas:** **impide fichar antes de hora**, avisa de retrasos, **alertas de horas extra** y recordatorios automáticos de pausa [V].
- **Onboarding/RR. HH.:** contratación (Plus) y onboarding (All-in-One).
- **Multiempresa:** un empleado puede tener varios "jobs" en la app y cambiar entre ellos, pero la disponibilidad es común a todos [3P, Trustpilot].
- **Precios [3P]:** **por ubicación**. Basic gratis (1 ubicación, hasta 10 empleados). Essentials 30 USD (24 USD anual), Plus 70 USD (56 USD anual) y All-in-One 120 USD (96 USD anual) por ubicación y mes. Nómina: unos 39 USD más 6 USD por empleado.
- **Diferenciador:** precio por ubicación con empleados ilimitados y un plan gratuito real.

### 4. Connecteam (Israel/EE. UU.)
- **URLs:** help.connecteam.com/en/articles/6445424-users-invite-link, help.connecteam.com/en/articles/9313931-..., connecteam.com/employee-time-clock-app/time-theft, connecteam.com/employee-time-clock-app/overtime, connecteam.com/best-online-timesheet-apps, connecteam.com/best-time-clock-kiosk-apps, capterra.com/p/153140/Connecteam/pricing, brainsensei.com/connecteam-time-clock-app-review, hivedesk.com/connecteam-review, costbench.com/.../connecteam, softwaresuggest.com/us/connecteam, spotsaas.com/blog/connecteam-review
- **Fichaje:** app móvil, web y app de kiosco con **inicio de sesión por reconocimiento facial** y PIN. Se puede exigir un selfie contrastado con fotos anteriores [V/3P].
- **Geocerca:** el administrador define el punto y el radio (500–2500 ft). Fuera de la geocerca el fichaje no se registra directamente: **se envía una solicitud de aprobación al móvil del encargado**. También avisa de salidas fichadas fuera de la geocerca [V]. Las geocercas solo están en Advanced o superior [3P].
- **Offline:** limitado o inexistente según una reseña [3P].
- **Turnos:** sí, integrados con el reloj.
- **Reglas:** horas extra configurables por zona horaria o estado [V]. Pausas y PTO. Alertas de retrasos, turnos perdidos y horas extra **antes de nómina** [3P].
- **Aprobaciones:** las hojas de horas se aprueban y se envían a nómina [V].
- **Onboarding (muy relevante):** **enlace de invitación personalizable**. Se puede **prerrellenar campos, marcar información obligatoria y añadir campos extra**. El enlace se comparte por SMS, portapapeles o **código QR**. **El administrador debe aprobar la solicitud** desde Users u Overview, y puede activar notificaciones por cada enlace. También hay invitación por SMS con un límite de 3 reenvíos [V]. Es el modelo más parecido al que se pide.
- **Campos personalizados:** campos extra en el perfil o la invitación [V].
- **Informes:** exportación de hojas de horas a PDF y XLS, e integración con QuickBooks Online, Gusto, Xero y Paychex [3P/V]. Integración con ADP [NV].
- **Precios [3P, inconsistentes]:** gratis hasta 10 usuarios. Operations Hub: Basic 29, Advanced 49 y Expert 99 USD al mes en tarifa plana para los primeros 30 usuarios (Capterra). CostBench da 35, 59 y 119. Cada hub (Operaciones, Comunicación y RR. HH.) se paga aparte.
- **Diferenciador:** flujo de enlace de invitación con aprobación, campos obligatorios y QR. Fichaje fuera de la geocerca convertido en solicitud de aprobación.

### 5. Clockify (CAKE.com, Serbia/EE. UU.)
- **URLs:** clockify.me/features/kiosk, clockify.me/pricing, clockify.me/de/field-services-time-clock, capterra.com/p/169607/Clockify/pricing, toolradar.com/tools/clockify/pricing, costbench.com/.../clockify, actitime.com/.../clockify-pricing [C], hivedesk.com/clockify-review, timely.com/blog/clockify-pricing [C]
- **Fichaje:** temporizador web, escritorio y móvil, más un **kiosco con PIN personal o PIN universal** de supervisor [V]. Sin reconocimiento facial [V por ausencia].
- **GPS:** registra la ubicación al fichar en el kiosco. Rastreo GPS de trabajadores de campo en el plan Pro. **No impide fichar fuera de una zona (sin geocerca restrictiva)** [3P].
- **Aprobaciones:** aprobación y bloqueo de hojas de horas en Standard o superior. El plan gratuito no las bloquea [C].
- **Campos personalizados:** "user fields", por ejemplo el número de empleado. Campos personalizados en las entradas de tiempo [V].
- **Informes:** informes detallados y semanales, exportación a PDF, CSV y Excel, e informes programados.
- **Precios [3P]:** Free (kiosco incluido según Capterra y Toolradar). Basic 4,99, Standard 6,99, Pro 9,99 y Enterprise 14,99 USD por usuario y mes con pago mensual (unos 3,99, 5,49, 7,99 y 11,99 USD con pago anual). **Usuarios solo de kiosco: 1,49 USD por usuario y mes** [V, posiblemente antiguo]. Enterprise incluye SSO, subdominio y registros de auditoría.
- **Diferenciador:** precio diferenciado para usuarios que solo usan el kiosco y un plan gratuito muy amplio.

### 6. Jibble (Reino Unido/Malasia)
- **URLs:** jibble.io/face-recognition-camera-attendance, jibble.io/offline-attendance-app, jibble.io/attendance-kiosk, help.jibble.io/articles/1016097-how-to-setup-jibble-as-an-attendance-kiosk, jibble.io/help/add-or-invite-team-members, help.jibble.io/articles/728642-creating-and-joining-multiple-teams, jibble.io/help/joining-your-organization-on-jibble, jibble.io/help/.../restricting-locations-with-geofences, capterra.com/p/156992/Jibble/pricing, hivedesk.com/jibble-review, clockify.me/reviews/jibble-review [C]
- **Fichaje:** móvil, web, escritorio, extensión de Chrome, **Slack y MS Teams**, kiosco con reconocimiento facial y PIN [V].
- **Antisuplantación:** **detección de vida (liveness) con estimación de profundidad** contra fotos, pantallas y vídeos. Reconoce varias caras a la vez. Cuando la cara no coincide envía un correo de "suspicious jibble" [V].
- **Geocercas:** sí, también aplicables al kiosco [V]. El plan gratuito puede tener un límite de geocercas [3P, contradictorio].
- **Offline:** el kiosco funciona sin conexión y sincroniza después. Hay también modo offline personal [V].
- **Onboarding:** **enlace de invitación** que se puede regenerar para invalidar los anteriores, e invitación por email o teléfono. Se puede **solicitar unirse a un equipo** conociendo el email del administrador [V]. Si la solicitud requiere aprobación está [NV].
- **Multicuenta (muy relevante):** **una cuenta de usuario puede pertenecer a varios equipos u organizaciones**, como miembro o como administrador. Los datos de cada equipo son independientes y se cambia con un "team switcher" [V]. Coincide con el requisito de "un usuario en varias cuentas".
- **Informes:** gráficos y reportes de asistencia exportables a XLS y CSV [V].
- **Precios [3P, muy inconsistentes]:** plan gratuito con usuarios ilimitados. Premium entre 2,99 y 5,99 y Ultimate entre 5,99 y 10,99 por usuario y mes, en USD o EUR según la fuente. Enterprise bajo consulta.
- **Diferenciador:** plan gratuito ilimitado, liveness, multiorganización por usuario e integración con Slack y Teams.

### 7. Buddy Punch (EE. UU.)
- **URLs:** buddypunch.com/time-clock-software/features/photo-on-punch, buddypunch.com (página de reloj con cámara), hivedesk.com/buddy-punch-review, costbench.com/.../buddy-punch, dupple.com/tools/buddy-punch, softwarefinder.com/hr/buddy-punch/pricing, erpresearch.com/.../buddy-punch/pricing, jibble.io/reviews/buddy-punch [C]
- **Fichaje:** web, móvil, kiosco compartido, **QR** y PIN [3P/V].
- **Antisuplantación:** **reconocimiento facial con Face ID, solo en dispositivos Apple**. **Foto al fichar** (obligatoria, opcional o solo para algunos empleados), revisada después por el encargado. **Bloqueo por IP o wifi de la oficina** [V].
- **Geocerca:** sí, para trabajadores de campo [V]. Pro incluye geocercas "básicas" [3P].
- **Offline:** contradictorio. Una reseña de septiembre de 2026 dice que Pro incluye modo offline. Jibble [C] dice que no lo hay [NV].
- **Otros:** turnos, PTO, horas extra, pausas, aprobación de hojas de horas y API (Pro).
- **Precios [3P, inconsistentes]:** cuota base de 19 USD al mes más un importe por usuario: Starter unos 4,99–5,49, Pro unos 6,99–7,99 y Advanced/Enterprise unos 11,99–13,99 USD.
- **Diferenciador:** combina varios controles antisuplantación (cara, foto, IP, geocerca y QR).

### 8. QuickBooks Time (antes TSheets, Intuit)
- **URLs:** quickbooks.intuit.com/learn-support/.../turn-quickbooks-time-kiosk-photo-capture, quickbooks.intuit.com/time-tracking/resources/custom-fields, quickbooks.intuit.com/ca/time-tracking/pricing, quickbooks.intuit.com/au/time-tracking/time-clock-kiosk, ontheclock.com/blog/quickbooks-time-price-increase-2026 [C], hivedesk.com/quickbooks-time-review, get.clockit.io/reviews/quickbooks-time [C], getonecrew.com/post/tsheets-pricing
- **Fichaje:** móvil, web y **kiosco con PIN y captura de foto** (webcam) [V]. No se mencionan reconocimiento facial ni biometría [3P].
- **GPS/geocerca:** GPS mientras el empleado tiene la jornada abierta y recordatorios de geocerca. Las fuentes no coinciden sobre si la geocerca está en Premium o en Elite [3P].
- **Offline:** [NV] para el kiosco.
- **Campos personalizados:** **campos personalizados en la tarjeta de tiempo** (tareas, equipos, gastos) compartibles entre trabajos. Se venden como add-on "Custom Fields" [V]. Códigos de trabajo anidados (job codes) [3P].
- **Informes:** por trabajo, tarea, empleado, grupo o proyecto, con exportación a QuickBooks Payroll.
- **Precios [3P]:** Premium 20 USD de base más 10 USD por usuario y mes. Elite 40 USD de base más 12 USD por usuario y mes (septiembre de 2026). **Subida de 2 USD por empleado desde el 1-jul-2026.** En Canadá: 30 + 10 y 55 + 15 CAD [V]. Requiere QuickBooks Online o Payroll.
- **Diferenciador:** integración nativa con QuickBooks y campos personalizados en la tarjeta de tiempo.

### 9. ClockShark (EE. UU., construcción y servicios de campo)
- **URLs:** apps.adp.com/en/apps/213872/clockshark-time-tracking-for-adp-workforce-now/editions, apps.adp.com/en-us/apps/213872/.../features, clockshark.com/comparisons/clockshark-vs-exaktime, workmax.com/compare/comprehensive-clockshark-review... [C], hivedesk.com/clockshark-review, erpresearch.com/.../clockshark/pricing, costbench.com/.../clockshark
- **Fichaje:** móvil, **Kiosk Clock con reconocimiento facial activable** y **CrewClock**, en el que el capataz ficha a toda la cuadrilla [3P/ADP Marketplace].
- **Geocerca:** recordatorios de fichaje al entrar o salir de la geocerca y alertas por fichajes fuera de ella [ADP Marketplace].
- **Offline:** sí, sincroniza al recuperar la conexión, aunque hay quejas de problemas de sincronización [C].
- **Otros:** turnos, presupuesto por trabajo con alertas (job costing) y "Clock Out Questions" (preguntas al fichar la salida, en Pro) [ADP].
- **Precios [3P]:** Standard 40 USD de base más 9 USD por usuario activo. Pro 60 USD de base más 11 USD por usuario activo. Prueba de 14 días.
- **Diferenciador:** fichaje por cuadrilla y formularios o preguntas al fichar la salida.

### 10. Hubstaff (EE. UU.)
- **URLs:** hubstaff.com/features/geofence_time_clock, hubstaff.com/geofence-time-tracking, hubstaff.com/blog/implement-geofences-mobile-workforce, hireinsouth.com/post/hubstaff-pricing, actitime.com/.../hubstaff-pricing [C], costbench.com/.../hubstaff, us.fitgap.com/products/012479/hubstaff
- **Fichaje:** escritorio con monitorización de actividad y capturas de pantalla, y móvil. **Fichaje automático al entrar o salir de la geocerca del lugar de trabajo** [V].
- **Hojas de horas:** se generan desde la geocerca. El empleado las edita y las envía a aprobación, y **la aprobación dispara el pago** (PayPal, Wise, Gusto) [V].
- **Precios [3P]:** Starter 4,99, Grow 7,50, Team 10 y Enterprise 25 USD por plaza y mes (anual), con un mínimo de 2 plazas. **El GPS es un add-on por plaza.**
- **Diferenciador:** fichaje automático por geocerca y del tiempo al pago. Enfoque en productividad y monitorización.

### 11. TimeCamp (Polonia/EE. UU.)
- **URLs:** capterra.com/p/129847/TimeCamp/pricing, softwareadvice.com/psa/timecamp-profile, timely.com/blog/timecamp-pricing [C], actitime.com/.../timecamp-pricing [C], opentimeclock.com/blog2026/best-timecamp-alternatives-2026.html [C], costbench.com/.../timecamp
- **Funciones:** seguimiento de tiempo por proyecto, módulo de asistencia y ausencias (Starter o superior). **Las fuentes se contradicen sobre el kiosco y la geocerca**: Software Advice los sitúa en Free, Timely en Enterprise y OpenTimeClock dice que no tiene GPS [NV].
- **Precios [3P]:** Starter 5,49 USD (3,99 anual), Premium 9,99 (6,99), Ultimate 13,99 (9,99) y Enterprise bajo consulta.
- **Diferenciador:** combina horas por proyecto y asistencia básica.

### 12. Toggl Track
- **URLs:** costbench.com/compare/everhour-vs-toggl-track, costbench.com/compare/harvest-vs-toggl-track, get.clockit.io/compare/toggl-track-vs-harvest [C], connecteam.com/harvest-vs-toggl [C], g2.com/compare/hubstaff-vs-toggl-track-vs-harvest, resources.rework.com/tools/time-attendance/best-toggl-alternatives
- **Funciones:** temporizador por proyecto e informes muy buenos. **No tiene GPS, geocercas, kiosco ni asistencia preparada para nómina** [C/3P]. Aprobación de hojas de horas en Premium.
- **Precios [3P]:** gratis hasta 5 usuarios. Starter unos 9 y Premium unos 18 USD por usuario y mes (anual).
- **Relevancia:** baja como reloj de fichaje. Sirve como referencia de experiencia de uso e informes.

### 13. Harvest (Bending Spoons desde julio de 2025)
- **URLs:** getharvest.com/time-tracking/offline-employee-time-tracking-app, timesheet.io/en/blog/best-harvest-alternatives [C], actitime.com/.../harvest-vs-toggl [C], costbench.com/compare/harvest-vs-toggl-track
- **Funciones:** temporizador manual, horas facturables, facturación y presupuestos. Sin GPS ni kiosco. **Aprobaciones solo en Enterprise** (las fuentes se contradicen). Página oficial de app de seguimiento offline [V].
- **Precios [3P]:** Teams 9 y Enterprise 14 USD por plaza y mes. Hay informes de subidas al renovar tras la adquisición.
- **Relevancia:** baja como reloj de fichaje.

### 14. Everhour
- **URLs:** thedigitalprojectmanager.com/tools/everhour-review, getapp.com/project-management-planning-software/a/everhour, capterra.co.nz/software/133409/everhour, g2.com/compare/everhour-vs-toggl-track-vs-harvest
- **Funciones:** temporizador integrado en Asana, ClickUp, Jira, Trello y Basecamp. Entrada y salida básicas, presupuestos de proyecto y facturación. Sin GPS [NV]. Aprobaciones disponibles en el plan Team [3P].
- **Precios [3P]:** Lite unos 6 USD (mínimo 2 usuarios). Team 8,50 USD anual o 10 USD mensual, con un mínimo de 5 plazas.
- **Relevancia:** baja como reloj de fichaje.

### 15. 7shifts (Canadá, restauración)
- **URLs:** kb.7shifts.com/hc/en-us/articles/4417513712531 (Geofencing for 7punches), kb.7shifts.com/hc/en-us/articles/4417513451155, kb.7shifts.com/hc/en-us/articles/42017814733459, connecteam.com/reviews/7shifts [C], pricingsaas.com/companies/7shifts, hivedesk.com/7shifts-review, toolradar.com/tools/7shifts/pricing
- **Fichaje:** app **7punches**, que funciona como terminal o kiosco, o **Mobile Punch**. También desde el TPV. No se puede fichar desde la app principal de 7shifts [C].
- **Geocerca:** radio alrededor del restaurante, aplicado a toda la cuenta. Los dispositivos terminal están exentos. Puede requerir un plan superior [V].
- **Antisuplantación:** foto o snapshot al fichar [3P].
- **Reglas:** limita los fichajes anticipados, **obliga a respetar las pausas programadas, impide volver antes de tiempo de la pausa** y cierra automáticamente el turno si no se ficha la salida [3P]. Alertas de horas extra y analítica laboral en tiempo real.
- **Otros:** reparto de propinas (tip pooling, add-on) y nómina como add-on (6 USD por empleado).
- **Precios [3P]:** desde 2025 los planes son Comp (gratis, hasta 15 empleados y 1 ubicación), Essentials 44,99, Pro 89,99 y Premium 149,99 USD por ubicación y mes. Hay fuentes con cifras más bajas.
- **Diferenciador:** cumplimiento de pausas para restauración, propinas e integración con TPV.

### 16. Sling (Toast)
- **URLs:** capterra.com/p/142542/Sling/pricing, softwareadvice.com/hr/sling-profile, workstream.us/blog/sling-pricing, saasrat.com/products/sling, turnozo.com/blog/sling-scheduling-review [C], costbench.com/.../sling
- **Funciones:** turnos (el plan gratuito no incluye fichaje), **reloj con geocerca en Premium** y **kiosco en Business**. Previsión de coste laboral e informes de ventas frente a coste laboral. Una reseña indica que no se puede corregir una salida errónea hasta el turno siguiente.
- **Precios [3P]:** Free, Premium 2 USD por usuario y mes, Business 4 USD (3–3,40 anual). Los clientes de Toast tienen paquetes Sling Lite y Pro sin precio público.
- **Diferenciador:** el precio más bajo por usuario con geocerca incluida.

### 17. Rippling Time & Attendance
- **URLs:** gusto.com/resources/guides/switch-payroll-providers/rippling-pricing [C], vendr.com/marketplace/Rippling, spotsaas.com/blog/rippling-pricing, erpresearch.com/.../rippling-hr/pricing, timetrex.com/blog/rippling-vs-timetrex [C]
- **Funciones:** módulo de asistencia sobre la plataforma de Rippling. **No se encontró documentación oficial sobre kiosco, geocerca o reconocimiento facial** [NV].
- **Precios [3P]:** por presupuesto. Plataforma desde unos 8 USD por empleado y mes más una base de 35–40 USD. Asistencia estimada en 4–6 USD por empleado y mes (estimación de un analista). Totales reales según Vendr: 15–35 USD por empleado y mes.
- **Diferenciador:** plataforma unificada de RR. HH., TI y finanzas con reglas transversales.

### 18. Gusto (Time Tools)
- **URLs:** gusto.com/product/time-tools, gusto.com/resources/guides/best-clock-in-clock-out-apps, capterra.com/p/131882/Gusto/pricing, workyard.com/compare/gusto-review [C]
- **Funciones:** fichaje web, móvil y **Time Kiosk** (de pago por usuario). Geocercas o restricciones por ubicación y GPS. **Gusto reconoce que no ofrece fichaje biométrico** [V].
- **Precios [V/3P]:** Plus 80 USD al mes más 12 USD por persona (incluye el seguimiento de tiempo). Premium 180 + 22 USD [3P], aunque la web oficial lo da bajo consulta. En el plan Simple, Time & Attendance Plus cuesta unos 5–6 USD por empleado [3P].
- **Diferenciador:** el tiempo fichado pasa directamente a la nómina de Gusto.

### 19. ADP Workforce Now (Time & Attendance)
- **URLs:** apps.adp.com/en-US/apps/295329/allgeo-for-adp-workforce-now (editions y configure), apps.adp.com/en-US/apps/616966/findd-time-labor-for-adp-workforce-now/features, apps.adp.com/apps/331236 (InfiniTime for RUN), apps.adp.com/en-US/apps/307905/timeero-for-adp-workforce-now/features
- **Funciones nativas:** [NV] en los resultados. El ecosistema se apoya en el **ADP Marketplace**:
  - **allGeo:** reloj con geocerca por 15 USD por usuario móvil y mes, o 7,50 USD sin GPS, más 10 USD de alta [V Marketplace].
  - **Findd:** reloj biométrico móvil **offline** y geocerca afinada con **beacons Bluetooth (25 m)** [V Marketplace].
  - **InfiniTime:** geocerca de 300 yardas y "geo-punching" automático [V Marketplace].
- **Precios:** por presupuesto (sin precios publicados).
- **Diferenciador:** el marketplace de terceros como estrategia, lo que sugiere que una API y un marketplace de integraciones ayudan a escalar.

### 20. UKG Ready / UKG Pro (antes Kronos)
- **URLs:** ukg.com/sites/default/files/2026-02/UKG-Ready-2026-02-13-English.pdf, outsail.co/post/how-much-does-ukg-cost-in-2026, erpresearch.com/.../ukg-ready/pricing, costbench.com/software/hr/ukg-ready, ukg.cloudapper.ai/... (add-ons de reconocimiento facial y geocerca) [C], noahface.com/ukg-time-clocks [C]
- **Funciones:** relojes hardware (InTouch DX), móvil y web, con reglas de pago y convenio muy profundas. **Reconocimiento facial, geocerca, QR o NFC y modo offline aparecen sobre todo como add-ons de terceros** (CloudApper RightPunch, NoahFace offline en iPad) [C]. No se encontró documentación nativa sobre ellos [NV].
- **Precios [3P]:** sin precio publicado. UKG Ready cuesta unos 20–33 USD por empleado y mes para la suite completa, más una implantación del 20–40 % del primer año.
- **Diferenciador:** profundidad en reglas de nómina y convenios. Orientado al segmento enterprise.

### 21. Paycom
- **URLs:** paycom.com/software/time-and-attendance, paycom.com/resources/blog/introducing-microfence-the-next-step-in-time-and-attendance-accuracy, www2.paycomonline.com/software/time-clocks-and-terminals, noon.ai/blog/articles/361-paycom-pricing-2026, boostsuite.com/paycom-pricing
- **Fichaje:** app móvil, relojes web o kiosco y terminales hardware estándar, **biométricas** y de proximidad [V].
- **Geocerca:** sí, más **Microfence®**, que usa **beacons Bluetooth** (fichaje a unos 30 ft del beacon, por planta o sala) [V].
- **Antisuplantación:** filtrado por IP, geocerca y Microfence [V].
- **Precios [3P]:** por presupuesto, cobrado por nómina procesada. Estimación: 25–36 USD por empleado y mes para la suite completa y 12–18 USD solo nómina. Implantación del 10–30 % según el 10-K.
- **Diferenciador:** beacons BLE para verificar la presencia a nivel de planta o sala.

### 22. Paychex Flex Time
- **URLs:** paychex.com/time-attendance, paychex.com/time-attendance/iris-time-clock, paychex.com/es/tiempo-y-asistencia, gusto.com/resources/guides/switch-payroll-providers/paychex-pricing [C], eightx.co/blog/compare/how-much-does-paychex-cost, techrepublic.com/article/paychex-review
- **Fichaje:** web punch, app móvil, **app de kiosco con verificación facial**, **relojes biométricos de iris y huella**, IVR (fichaje por teléfono) y tarjeta de proximidad [V].
- **Geocerca:** geo-punch y geolocalización [V].
- **Precios [3P]:** por presupuesto. Estimación: Flex Time Essentials unos 59 USD al mes en tarifa plana y Flex Time con biometría unos 99 USD al mes (sobre unos 23 empleados).
- **Diferenciador:** es el que más métodos de fichaje ofrece, incluido el IVR.

### 23. Workday Time Tracking
- **URLs:** universityfinance.richmond.edu/payroll/workday-time-entry/student-employee-self-service.pdf, knightvision.it.ucf.edu/.../Time-Tracking-FAQs-1.pdf, cloudapper.ai/ai-time-clock/workday/workday-time-clock-with-geo-fencing-capability [C], redresscompliance.com/workday-pricing-2026-what-enterprises-actually-pay.html, assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/... (pricing document)
- **Funciones:** Workday Mobile aplica una geocerca que impide fichar fuera del centro asignado. **En escritorio no se aplica la geocerca** [V a través de guías de universidades clientes]. Para el reconocimiento facial se usan add-ons [C]. Reglas de horas extra [NV].
- **Precios [3P]:** suite HCM con 12–42 USD por empleado y mes negociados según volumen. Time Tracking se vende como módulo dentro de paquetes (G-Cloud UK).
- **Diferenciador:** segmento enterprise. Geocerca por política solo en móvil.

### 24. Replicon (Deltek)
- **URLs:** erpresearch.com/.../replicon/pricing, erpresearch.com/.../replicon, resources.rework.com/tools/time-attendance/best-replicon-alternatives, spendbase.co/nl/vendors/replicon, capterra.com/p/5782/Replicon-TimeBill
- **Funciones:** TimeAttend con políticas de fichaje, validación de punches, códigos de pago, **biblioteca de cumplimiento para más de 145 jurisdicciones**, FedRAMP y captura automática con IA (ZeroTime). Kiosco, geocerca y reconocimiento facial [NV].
- **Precios [3P]:** sin precio público (redirige a deltek.com). Cifras citadas: 6 USD (posiblemente TimeOff) y TimeAttend Plus 12 USD por usuario y mes.
- **Diferenciador:** cumplimiento legal multijurisdicción y auditoría de cambios.

### 25. Timeero (EE. UU.)
- **URLs:** capterra.com/p/175900/Timeero/pricing, g2.com/products/timeero/pricing, trustradius.com/products/timeero/pricing, xpay.sh/agent-ready-index/timeero, apps.adp.com/en-US/apps/307905/timeero-for-adp-workforce-now/features, timeero.com/post/employees-clocking-in-early, timeero.com/post/mobile-timekeeping-5-essential-geofencing-factors-to-consider
- **Fichaje:** móvil con GPS y **kiosco con reconocimiento facial con IA**: compara la foto con la del perfil y, si no coincide, marca la tarjeta y avisa al encargado [V ADP Marketplace].
- **Reglas:** **ventana de fichaje** (horario, días y usuarios excluidos). Fuera de la ventana se rechaza la entrada, pero la salida siempre se permite [V]. **Firma digital de la tarjeta de tiempo al final del día** [V].
- **Otros:** kilometraje, EVV (Electronic Visit Verification, verificación de visitas a domicilio en sanidad) y tiempo libre.
- **Precios [3P]:** Basic unos 4 USD (hasta 10 usuarios), Pro unos 8 y Premium unos 11 USD por usuario y mes. Kiosco facial en Premium.
- **Diferenciador:** ventanas de fichaje, firma de la tarjeta y kilometraje.

### 26. Factorial (España)
- **URLs:** factorial.es/control-horario-fichaje, factorial.es/programa-control-horario-empresa, factorial.es/programa-registrar-horario-laboral, factorial.mx/control-asistencia, factorialhr.com/blog/best-time-and-attendance-software, capterra.com/p/168685/Factorial-HR-Software, g2.com/compare/factorial-vs-peopleforce, rankia.com/foros/.../7373620-mejores-software-control-horario-espana-2026..., skello.es/blog/opiniones-factorial-alternativas [C], turnozo.com/switch-from-factorial [C]
- **Fichaje:** web, app móvil, **QR** (para reducir fichajes falsos) y **geolocalización** visible para el encargado [V]. Kiosco [NV].
- **Otros:** suite de RR. HH. completa (nómina, ausencias, turnos y documentos). Time Management es un módulo. Se señalan errores puntuales en el cierre de turnos [C].
- **Precios [3P]:** desde unos 5,50 € (España) u 8 USD por usuario y mes (Capterra) y 7 USD (G2). Un comparador cita un mínimo de facturación de 19 plazas en España [C].
- **Diferenciador:** RR. HH. todo en uno y cumplimiento del registro horario español (el registro digital está previsto en un borrador de reglamento de 2026).

### 27. Personio (Alemania)
- **URLs:** personio.com/product/attendance-tracking, personio.com/resources/product-tour-attendance-tracking, community.personio.com/.../timesheets-attendance-reporting-for-regulatory-compliance-and-overtime-4355, dev.classmethod.jp/en/articles/personio-attendance-timeoff, getapp.com/hr-employee-management-software/a/personio, softwareadvice.com/hr/personio-profile, clockin.de/en/funktionen-von-clockin/schnittstellen/personio [C]
- **Fichaje:** widget web y móvil. **Geolocalización al fichar la entrada y la salida. Si el empleado no comparte la ubicación o la borra, se muestra un aviso y se puede lanzar un proceso de aprobación opcional.** Geocercas según la política de la empresa [V].
- **Reglas:** avisos de reglas antes de registrar el tiempo y flujos de aprobación [3P]. Hay limitaciones: las horas extra semanales chocan con los periodos mensuales y las exportaciones omiten días sin registro [V comunidad].
- **Planes:** Core y Core Pro. La asistencia está en Core Pro [3P].
- **Precios:** por presupuesto [3P].
- **Diferenciador:** aprobación cuando falta la ubicación y cumplimiento de la normativa alemana de jornada (ArbZG).

### 28. Kenjo (Alemania/España)
- **URLs:** kenjo.io/product/attendance, kenjo.io/product/time-tracking-app, help.kenjo.io/en/articles/653613-set-up-location-tracking-and-geolocation, help.kenjo.io/en/articles/712858-track-and-view-working-time, help.kenjo.io/en/support/solutions/articles/60000805426-overview-of-the-kiosk, capterra.com/p/165837/kenjo, techimply.com/profile/kenjo
- **Fichaje:** punch clock en tiempo real, entrada manual de hojas de horas, **kiosco con PIN** y **kiosco con QR** (en un móvil, tablet u ordenador a la entrada) [V].
- **Geocerca:** radio alrededor del centro de trabajo. Se comprueba al fichar la entrada y la salida, con una alerta opcional si se ficha fuera. **Solo guarda el punto de cada fichaje, sin rastreo continuo** (decisión orientada a la privacidad y el RGPD) [V].
- **Horas extra:** saldo de exceso o déficit frente a las horas planificadas, compensación de horas extra y saldo semanal y mensual en la app [V].
- **Precios [3P]:** desde 5,4 € por usuario y mes (Capterra). Starter unos 7,06 y Growth unos 11,77 USD (el kiosco está en Growth). Connect bajo consulta.
- **Diferenciador:** QR de kiosco y geolocalización puntual pensada para la privacidad.

### 29. Bizneo HR (España)
- **URLs:** skello.es/blog/opiniones-bizneo-alternativas [C], turnozo.com/es/blog/alternativas-a-bizneo-hr [C], rankia.com/foros/... (comparativa de 2026), softwaredoit.es/recursos-humanos/software-control-horario-comercio-minorista.html
- **Fichaje:** móvil, ordenador, **reconocimiento facial, NFC, QR, PIN** y geolocalización [3P]. La biometría depende de la configuración contratada [C].
- **Precios [3P]:** desde unos 6 € por empleado y mes, con una cuota mínima de unos 55 € al mes. Pro y Avanzado bajo presupuesto.
- **Limitación:** se considera limitado para equipos de campo [C].

### 30. Woffu (España)
- **URLs:** woffu.com/en/sector/industrial, woffu.com/en/?p=16313, jibble.io/es/resenas/woffu [C], factorial.es/blog/?p=199865 [C], softwaredoit.es/woffu/woffu.html, capterra.in/software/156162/woffu
- **Fichaje:** **10 métodos configurables por trabajador, departamento o centro**: app, web, extensión de Chrome, **QR**, dispositivos físicos con PIN o foto, y **Teams, WhatsApp y Slack** [V].
- **Restricciones:** por **dirección IP y geolocalización** [V].
- **Otros:** vacaciones y ausencias, **clasificación automática de horas extra** y plantillas de informes [C]. No incluye nómina, evaluación del desempeño ni reclutamiento [C].
- **Precios [C]:** unos 1,50 € por empleado y mes en el plan básico. El plan Lite es para equipos pequeños y a partir de 11 empleados hay que subir a un plan con precio no publicado.
- **Diferenciador:** métodos de fichaje configurables por segmento e integración con WhatsApp.

### 31. Calamari (Polonia)
- **URLs:** capterra.com/p/141217/Calamari/pricing, technologyadvice.com/products/calamari-reviews, slashdot.org/software/p/Calamari, us.fitgap.com/products/calamari, techimply.com/profile/calamari, trustradius.com/products/calamari/reviews
- **Fichaje:** **QR, iBeacon (Bluetooth), Slack**, móvil, web y kiosco [3P]. Teams [NV].
- **Precios [3P]:** Time & Attendance desde unos 2,50 USD por usuario y mes (Capterra 2026), con un mínimo de 10 usuarios. Los precios por tramos antiguos (20 USD al mes para 1–10 empleados) están desfasados.
- **Diferenciador:** iBeacon y QR a bajo coste.

---

## 2. Matriz de frecuencia de funcionalidades

Base: los 26 productos de control de asistencia propiamente dichos. Se excluyen Toggl, Harvest, Everhour, TimeCamp (por datos dudosos) y Hubstaff solo en lo relativo al kiosco. Los recuentos son aproximados, a partir de la evidencia recogida arriba.

| Funcionalidad | Frecuencia aprox. | Clasificación |
|---|---|---|
| Fichaje por app móvil y web | ~100 % | **Imprescindible** |
| Geolocalización en el fichaje (GPS stamp) | ~90 % | **Imprescindible** |
| Geocerca restrictiva (bloquear o marcar fuera de zona) | ~75 % (a menudo solo en plan medio o alto) | **Imprescindible** (habitual en planes de pago) |
| Kiosco compartido (tablet) con PIN | ~75 % | **Imprescindible** |
| Hojas de horas con flujo de aprobación | ~85 % | **Imprescindible** |
| Exportación a nómina o CSV/XLS | ~90 % | **Imprescindible** |
| Reglas de horas extra (diarias y semanales) | ~80 % | **Imprescindible** |
| Recordatorios o reglas de pausas | ~60 % | Casi imprescindible |
| Programación de turnos integrada | ~70 % | Casi imprescindible (en los productos de turnos) |
| Foto o selfie al fichar | ~55 % | Habitual |
| Reconocimiento facial con comparación automática | ~40 % (Deputy, Connecteam, Jibble, Buddy Punch, ClockShark, Timeero, Paychex, Bizneo y add-ons de UKG y ADP) | **Diferenciador** |
| Liveness o antispoofing explícito | ~5 % (solo Jibble documentado) | **Diferenciador fuerte** |
| QR para fichar | ~30 % (Buddy Punch, Factorial, Kenjo, Woffu, Calamari, Bizneo) | Diferenciador (muy común en la UE) |
| NFC o beacons BLE | ~15 % (Paycom Microfence, Calamari iBeacon, Findd, Bizneo NFC) | Diferenciador |
| Biometría hardware (huella o iris) | ~10 % (Paychex, Paycom, UKG) | Nicho enterprise |
| Restricción por IP o wifi | ~20 % (Buddy Punch, Paycom, Woffu) | Diferenciador |
| Modo offline con sincronización | ~25 % (Jibble, ClockShark, Buddy Punch [disputado], Findd y NoahFace) | **Diferenciador** |
| Fichaje desde Slack o Teams | ~15 % (Jibble, Woffu, Calamari) | Diferenciador |
| Enlace de invitación más aprobación del administrador | Documentado en Connecteam. Enlace sin aprobación clara en Jibble | **Diferenciador** (pocos lo documentan) |
| Invitación por SMS o email | ~80 % | Imprescindible |
| Onboarding con documentos o firma | ~30 % (Deputy, Homebase All-in-One, suites de RR. HH.) | Diferenciador |
| Campos personalizados (perfil, invitación o tarjeta) | ~35 % (Deputy, Connecteam, Clockify, QuickBooks Time como add-on, ClockShark con preguntas) | **Diferenciador** |
| Usuario en varias organizaciones con una sola cuenta | Documentado en Jibble. Parcial en Homebase | **Diferenciador raro** |
| Fichaje fuera de zona convertido en solicitud de aprobación | Connecteam y Personio (cuando falta la ubicación) | Diferenciador |
| Ventana de fichaje o bloqueo de entradas anticipadas | Homebase, 7shifts y Timeero | Diferenciador |
| Firma o confirmación de la tarjeta por el empleado | Timeero | Diferenciador |
| Fichaje automático por geocerca | Hubstaff e InfiniTime | Diferenciador |
| Fichaje por cuadrilla (CrewClock) | ClockShark | Nicho (construcción) |
| % de coste laboral frente a ventas | Deputy, Sling, 7shifts y Homebase | Diferenciador (retail y restauración) |
| Analítica avanzada como add-on | Deputy Analytics+ | Fuente de ingresos adicional |
| Informes en PDF | Explícito en Connecteam y Clockify. Habitual pero poco documentado | Imprescindible |
| Cumplimiento multijurisdicción | Replicon, UKG y Deputy (convenios) | Nicho |
| SSO, SAML y auditoría | Plan alto en When I Work, Clockify y Rippling | Diferenciador de plan alto |

**Lectura:** el mínimo competitivo es app y web, GPS al fichar, kiosco con PIN, aprobaciones, horas extra y exportación a nómina. Lo que distingue a un producto es la verificación facial con liveness, el modo offline, el QR y los beacons, el enlace de alta con aprobación y campos obligatorios, la multiorganización por usuario, la conversión de un fichaje fuera de zona en solicitud de aprobación, y los KPIs de coste laboral.

---

## 3. KPIs e indicadores habituales

Recogidos de Deputy (Insights, Labour %, Analytics+), Connecteam, 7shifts, Sling, Kenjo, Jibble y guías de KPIs (RosterElf, OpenTimeClock, ePaySystems, Sprout Insight y NC OSC):

1. **Horas trabajadas** (totales, por empleado, ubicación, departamento o proyecto). Contadores de día, semana y mes.
2. **Horas programadas frente a reales** y su desviación.
3. **Horas extra** (horas y % sobre el total). Acumulado por empleado con alertas de umbral antes de nómina.
4. **Saldo de horas** (exceso o déficit frente a la jornada planificada). Es el "contador" de Kenjo y Personio.
5. **Coste laboral** programado frente a real (en hojas de horas) y desviación.
6. **% de coste laboral sobre ventas** y **ventas por hora trabajada** (retail y restauración).
7. **Tasa de absentismo**, separando ausencias planificadas y no planificadas. Incluye FTE (equivalente a tiempo completo) perdidos.
8. **Impuntualidad**: retrasos, minutos de retraso y entradas anticipadas.
9. **Turnos no cubiertos** o no presentados (no-shows).
10. **Cumplimiento de pausas**: pausas omitidas y pausas excedidas.
11. **Fichajes fuera de geocerca**, fichajes sin ubicación y fichajes "sospechosos" (cara que no coincide).
12. **Fichajes editados o manuales** (auditoría) y salidas no fichadas o cerradas automáticamente.
13. **Hojas de horas pendientes de aprobación** y tiempo medio de aprobación.
14. **Quién está trabajando ahora** (panel en vivo o mapa) y asistencia del día (presentes, ausentes, tarde).
15. **Patrones por día de la semana**, por ejemplo absentismo en lunes y viernes.
16. **Tendencia individual** de asistencia (deterioro) y % de asistencia de los últimos 12 meses.
17. **Kilometraje y desplazamientos** (Timeero y Hubstaff), **horas facturables frente a no facturables** y presupuesto por trabajo o proyecto (ClockShark, Hubstaff, Everhour).
18. **Vacaciones y PTO**: saldo y consumo.

---

## 4. Precios de referencia (consultados entre septiembre y octubre de 2026, mayoritariamente de fuentes secundarias)

| Producto | Modelo | Gratis | Entrada | Medio | Alto | Notas |
|---|---|---|---|---|---|---|
| Deputy | por usuario | no (prueba) | Lite 5 USD | Core 6,50 USD | Pro 9 USD | Analytics+ +1,50, HR +2. Fuentes en AUD más altas |
| When I Work | por usuario | prueba de 14 días | 2,50 USD (4 con fichaje) | Pro 5 USD | Premium 8 USD | Bloques de 5 plazas |
| Homebase | **por ubicación** | sí (1 ubicación, 10 empleados) | 30 USD (24 anual) | 70 USD (56) | 120 USD (96) | Nómina 39 + 6 por empleado |
| Connecteam | tarifa plana hasta 30 usuarios más extra por usuario | **sí (≤10 usuarios)** | 29–35 USD al mes | 49–59 USD | 99–119 USD | Se cobra por hub |
| Clockify | por usuario | sí | 3,99–4,99 USD | 5,49–6,99 USD | 7,99–9,99 USD (Ent. 11,99–14,99) | **Usuario solo de kiosco: 1,49 USD** |
| Jibble | por usuario | **sí, usuarios ilimitados** | Premium 2,99–5,99 | Ultimate 5,99–10,99 | Enterprise bajo consulta | Fuentes muy dispares (USD/EUR) |
| Buddy Punch | base de 19 USD más por usuario | prueba | 4,99–5,49 USD | 6,99–7,99 USD | 11,99–13,99 USD | |
| QuickBooks Time | base más por usuario | no | 20 + 10 USD | — | 40 + 12 USD | +2 USD por empleado desde jul-2026 |
| ClockShark | base más por usuario activo | prueba de 14 días | 40 + 9 USD | — | 60 + 11 USD | |
| Hubstaff | por plaza (mín. 2) | dudoso | 4,99 USD | 7,50–10 USD | 25 USD | GPS es un add-on |
| TimeCamp | por usuario | sí | 3,99–5,49 USD | 6,99–9,99 USD | 9,99–13,99 USD | |
| Toggl Track | por usuario | ≤5 usuarios | ~9 USD | ~18 USD | Enterprise | No es reloj de fichaje |
| Harvest | por plaza | limitado | 9 USD | — | 14 USD | No es reloj de fichaje |
| Everhour | por usuario (mín. 2 o 5) | limitado | ~6 USD | 8,50–10 USD | Enterprise | No es reloj de fichaje |
| 7shifts | **por ubicación** | Comp (≤15 empleados) | 44,99 USD | 89,99 USD | 149,99 USD | Propinas y nómina como add-ons |
| Sling | por usuario | sí (sin fichaje) | Premium 2 USD | Business 3–4 USD | — | El más barato con geocerca |
| Timeero | por usuario | no | ~4 USD | ~8 USD | ~11 USD | Kiosco facial en Premium |
| Gusto | base más por persona (incluye nómina) | no | Plus 80 + 12 USD | — | Premium 180 + 22 USD | Kiosco de pago aparte |
| Rippling | presupuesto | no | ~8 USD + base de 35–40 | asistencia ~4–6 USD (est.) | 15–35 USD por empleado (total real) | |
| Paychex Flex Time | presupuesto | no | ~59 USD al mes (Essentials, est.) | ~99 USD al mes con biometría (est.) | — | |
| ADP WFN | presupuesto | no | — | add-on allGeo 7,50–15 USD por usuario | — | Marketplace |
| UKG Ready | presupuesto | no | — | 20–33 USD por empleado (suite) | — | Implantación del 20–40 % |
| Paycom | presupuesto (por nómina) | no | 12–18 USD por empleado (solo nómina) | 25–36 USD por empleado (suite) | — | |
| Workday | presupuesto | no | — | 12–42 USD por empleado (HCM) | — | Enterprise |
| Replicon | presupuesto | prueba | ~6 USD (TimeOff) | TimeAttend Plus ~12 USD | — | Sin precio público |
| Factorial | por empleado | no claro | ~5,50 € / 7–8 USD | presupuesto | — | Posible mínimo de 19 plazas en España |
| Personio | presupuesto | no | — | — | — | Asistencia en Core Pro |
| Kenjo | por empleado | prueba | ~5,4 € / 7 USD | ~11,8 USD (Growth, con kiosco) | Connect bajo consulta | |
| Bizneo | por empleado más cuota | no | ~6 € + mínimo de ~55 € al mes | presupuesto | — | |
| Woffu | por empleado | no | ~1,50 € | presupuesto (≥11 empleados) | — | |
| Calamari | por usuario (mín. 10) | prueba | ~2,50 USD | — | — | |

**Conclusiones de precio:**
- Las PYMES pagan en la práctica entre **2 y 10 USD por usuario y mes** (mediana de unos 5–6 USD). ERPResearch cita una mediana de categoría de unos 3 USD.
- Hay cuatro modelos alternativos:
  - por ubicación con usuarios ilimitados (Homebase, 7shifts);
  - cuota base más un importe por usuario (QuickBooks Time, ClockShark, Buddy Punch);
  - tarifa plana por tramo de usuarios (Connecteam);
  - plan gratuito ilimitado más funciones premium (Jibble).
- El reconocimiento facial, las geocercas, la analítica avanzada y el GPS se usan a menudo como **palanca para subir de plan o como add-on**.
- El segmento enterprise (UKG, Workday, Paycom, ADP, Rippling) cuesta 12–42 USD por empleado y mes porque vende la suite completa, con implantación del 10–40 %.

---

## 5. Implicaciones para el producto (síntesis breve)

- **Alta de empleados:** el patrón de referencia es el de Connecteam: enlace o QR de invitación por cuenta, campos obligatorios y extra configurables, solicitud pendiente, aprobación del administrador y notificación. Encaja con el requisito de "auto-registro con validación".
- **Multicuenta:** el patrón de Jibble (un usuario en N organizaciones, cada una con sus datos aislados y un selector de organización) es poco común y resulta diferenciador.
- **Ubicaciones:** geocerca por ubicación con radio configurable (Homebase es criticado por tener radios fijos). Si se ficha fuera de zona, mejor convertirlo en solicitud de aprobación o marcarlo (Connecteam, Personio) que bloquear sin más. Para cumplir el RGPD, guardar solo el punto de cada fichaje (Kenjo).
- **Validaciones:** ventana de fichaje (Timeero), bloqueo de entradas anticipadas (Homebase, 7shifts), restricción por IP (Buddy Punch, Woffu), QR por centro (Kenjo, Factorial) y foto o selfie (opcional u obligatoria por empleado, como en Buddy Punch).
- **Contadores e informes:** saldo de horas frente a la jornada planificada, horas extra y pausas. Hojas de horas en PDF y CSV, con firma o confirmación del empleado (Timeero).
- **KPIs:** ver la sección 3. Deputy cobra la analítica avanzada como add-on (1,50 USD por usuario), lo que indica que hay disposición a pagar por ella.

---

## 6. Fuentes consultadas (vía resultados de WebSearch. WebFetch quedó bloqueado por el proxy)

1. https://erpresearch.com/erp-add-ons/time-attendance/deputy/pricing
2. https://www.rosterelf.com/reviews/deputy
3. https://www.capterra.com/p/167811/Deputy/
4. https://www.deputy.com/features/time-clock
5. https://www.deputy.com/au/features/kiosk
6. https://www.deputy.com/au/features/employee-time-clock
7. https://help.deputy.com/hc/en-au/articles/4658046756751
8. https://help.deputy.com/hc/en-au/articles/10776485299983
9. https://www.deputy.com/blog/introducing-employee-onboarding
10. https://www.deputy.com/blog/why-workforce-data-matters-and-how-deputy-analytics-can-help
11. https://capterra.com/p/121248/When-I-Work/pricing/
12. https://www.workstream.us/blog/when-i-work-pricing
13. https://get.clockit.io/compare/clockit-vs-when-i-work
14. https://turnozo.com/blog/when-i-work-review
15. https://capterra.com/p/153076/Homebase/pricing/
16. https://www.hivedesk.com/homebase-review
17. https://www.joinhomebase.com/time-clock/time-attendance-software
18. https://joinhomebase.com/blog/best-geofencing-time-clock/
19. https://joinhomebase.com/time-clock/biometric-time-clock
20. https://timeero.com/reviews/homebase-review
21. https://buddypunch.com/blog/homebase-review
22. https://fr-be.trustpilot.com/review/joinhomebase.com?page=3
23. https://help.connecteam.com/en/articles/6445424-users-invite-link
24. https://help.connecteam.com/en/articles/9313931-adding-users-to-the-app-which-invite-method-should-i-send-when
25. https://help.connecteam.com/en/articles/6457866-inviting-users-from-the-overview-page
26. https://connecteam.com/employee-time-clock-app/time-theft/
27. https://connecteam.com/employee-time-clock-app/overtime
28. https://connecteam.com/best-online-timesheet-apps
29. https://connecteam.com/best-time-clock-kiosk-apps/
30. https://capterra.com/p/153140/Connecteam/pricing/
31. https://www.hivedesk.com/connecteam-review
32. https://costbench.com/software/employee-scheduling/connecteam/
33. https://brainsensei.com/connecteam-time-clock-app-review/
34. https://www.softwaresuggest.com/us/connecteam
35. https://www.spotsaas.com/blog/connecteam-review
36. https://clockify.me/features/kiosk
37. https://clockify.me/de/field-services-time-clock
38. https://capterra.com/p/169607/Clockify/pricing/
39. https://toolradar.com/tools/clockify/pricing
40. https://costbench.com/software/time-tracking/clockify
41. https://www.actitime.com/software-collections/clockify-pricing
42. https://www.hivedesk.com/clockify-review
43. https://jibble.io/face-recognition-camera-attendance
44. https://www.jibble.io/offline-attendance-app
45. https://www.jibble.io/attendance-kiosk
46. https://help.jibble.io/articles/1016097-how-to-setup-jibble-as-an-attendance-kiosk
47. https://jibble.io/help/add-or-invite-team-members
48. https://help.jibble.io/articles/728642-creating-and-joining-multiple-teams
49. https://www.jibble.io/help/joining-your-organization-on-jibble/
50. https://www.jibble.io/help/overall-organization-settings/restricting-locations-with-geofences
51. https://www.capterra.com/p/156992/Jibble/pricing/
52. https://www.hivedesk.com/jibble-review
53. https://clockify.me/reviews/jibble-review
54. https://buddypunch.com/time-clock-software/features/photo-on-punch/
55. https://www.hivedesk.com/buddy-punch-review
56. https://www.costbench.com/software/time-tracking/buddy-punch/
57. https://dupple.com/tools/buddy-punch
58. https://jibble.io/reviews/buddy-punch
59. https://quickbooks.intuit.com/learn-support/en-us/help-article/feature-preferences/turn-quickbooks-time-kiosk-photo-capture/L8etvHecF_US_en_US
60. https://quickbooks.intuit.com/time-tracking/resources/custom-fields/
61. https://quickbooks.intuit.com/ca/time-tracking/pricing/
62. https://www.ontheclock.com/blog/quickbooks-time-price-increase-2026
63. https://www.hivedesk.com/quickbooks-time-review
64. https://get.clockit.io/reviews/quickbooks-time
65. https://apps.adp.com/en/apps/213872/clockshark-time-tracking-for-adp-workforce-now/editions
66. https://apps.adp.com/en-us/apps/213872/clockshark-time-tracking-for-adp-workforce-now/features
67. https://workmax.com/compare/comprehensive-clockshark-review-pros-cons-and-alternatives/
68. https://www.hivedesk.com/clockshark-review
69. https://erpresearch.com/erp-add-ons/time-attendance/clockshark/pricing
70. https://hubstaff.com/features/geofence_time_clock
71. https://hubstaff.com/blog/implement-geofences-mobile-workforce/
72. https://www.hireinsouth.com/post/hubstaff-pricing
73. https://us.fitgap.com/products/012479/hubstaff
74. https://www.capterra.com/p/129847/TimeCamp/pricing/
75. https://www.softwareadvice.com/psa/timecamp-profile/
76. https://www.timely.com/blog/timecamp-pricing/
77. https://www.opentimeclock.com/blog2026/best-timecamp-alternatives-2026.html
78. https://www.costbench.com/compare/everhour-vs-toggl-track/
79. https://www.costbench.com/compare/harvest-vs-toggl-track/
80. https://get.clockit.io/compare/toggl-track-vs-harvest
81. https://connecteam.com/harvest-vs-toggl/
82. https://www.getharvest.com/time-tracking/offline-employee-time-tracking-app
83. https://thedigitalprojectmanager.com/tools/everhour-review/
84. https://www.getapp.com/project-management-planning-software/a/everhour/
85. https://kb.7shifts.com/hc/en-us/articles/4417513712531
86. https://kb.7shifts.com/hc/en-us/articles/42017814733459-How-can-I-prevent-employees-from-clocking-in-outside-the-restaurant
87. https://connecteam.com/reviews/7shifts/
88. https://pricingsaas.com/companies/7shifts
89. https://www.hivedesk.com/7shifts-review
90. https://www.capterra.com/p/142542/Sling/pricing/
91. https://www.softwareadvice.com/hr/sling-profile/
92. https://www.workstream.us/blog/sling-pricing
93. https://turnozo.com/blog/sling-scheduling-review
94. https://gusto.com/resources/guides/switch-payroll-providers/rippling-pricing
95. https://www.vendr.com/marketplace/Rippling
96. https://www.spotsaas.com/blog/rippling-pricing
97. https://gusto.com/product/time-tools
98. https://gusto.com/resources/guides/best-clock-in-clock-out-apps
99. https://capterra.com/p/131882/Gusto/pricing/
100. https://www.workyard.com/compare/gusto-review
101. https://apps.adp.com/en-US/apps/295329/allgeo-time-compliance-for-adp-workforce-now/editions
102. https://apps.adp.com/en-US/apps/616966/findd-time-labor-for-adp-workforce-now/features
103. https://apps.adp.com/apps/331236
104. https://apps.adp.com/en-US/apps/307905/timeero-for-adp-workforce-now/features
105. https://www.ukg.com/sites/default/files/2026-02/UKG-Ready-2026-02-13-English.pdf
106. https://www.outsail.co/post/how-much-does-ukg-cost-in-2026
107. https://costbench.com/software/hr/ukg-ready/
108. https://ukg.cloudapper.ai/ukg-help/turn-any-tablet-device-into-a-face-recognition-time-clock-for-ukg-ready/
109. https://noahface.com/ukg-time-clocks
110. https://www.paycom.com/software/time-and-attendance/
111. https://www.paycom.com/resources/blog/introducing-microfence-the-next-step-in-time-and-attendance-accuracy/
112. https://www2.paycomonline.com/software/time-clocks-and-terminals
113. https://www.noon.ai/blog/articles/361-paycom-pricing-2026
114. https://boostsuite.com/paycom-pricing/
115. https://paychex.com/time-attendance
116. https://www.paychex.com/time-attendance/iris-time-clock
117. https://gusto.com/resources/guides/switch-payroll-providers/paychex-pricing
118. https://eightx.co/blog/compare/how-much-does-paychex-cost
119. https://techrepublic.com/article/paychex-review
120. https://universityfinance.richmond.edu/payroll/workday-time-entry/student-employee-self-service.pdf
121. https://knightvision.it.ucf.edu/wp-content/uploads/sites/11/2022/02/Time-Tracking-FAQs-1.pdf
122. https://redresscompliance.com/workday-pricing-2026-what-enterprises-actually-pay.html
123. https://www.cloudapper.ai/ai-time-clock/workday/workday-time-clock-with-geo-fencing-capability/
124. https://erpresearch.com/erp-add-ons/time-attendance/replicon/pricing
125. https://resources.rework.com/tools/time-attendance/best-replicon-alternatives
126. https://www.spendbase.co/nl/vendors/replicon/
127. https://www.capterra.com/p/175900/Timeero/pricing/
128. https://www.trustradius.com/products/timeero/pricing
129. https://www.xpay.sh/agent-ready-index/timeero/
130. https://timeero.com/post/employees-clocking-in-early
131. https://factorial.es/control-horario-fichaje
132. https://factorial.es/programa-registrar-horario-laboral
133. https://factorialhr.com/blog/best-time-and-attendance-software/
134. https://capterra.com/p/168685/Factorial-HR-Software/
135. https://www.rankia.com/foros/empresas/temas/7373620-mejores-software-control-horario-espana-2026-comparativa-real-precios?page=1
136. https://www.skello.es/blog/opiniones-factorial-alternativas
137. https://turnozo.com/switch-from-factorial
138. https://www.personio.com/product/attendance-tracking/
139. https://community.personio.com/time-off-attendance-87/timesheets-attendance-reporting-for-regulatory-compliance-and-overtime-4355
140. https://dev.classmethod.jp/en/articles/personio-attendance-timeoff/
141. https://www.getapp.com/hr-employee-management-software/a/personio/
142. https://www.softwareadvice.com/hr/personio-profile
143. https://www.kenjo.io/product/attendance
144. https://help.kenjo.io/en/articles/653613-set-up-location-tracking-and-geolocation
145. https://help.kenjo.io/en/articles/712858-track-and-view-working-time
146. https://help.kenjo.io/en/support/solutions/articles/60000805426-overview-of-the-kiosk
147. https://capterra.com/p/165837/kenjo/
148. https://www.techimply.com/profile/kenjo
149. https://www.skello.es/blog/opiniones-bizneo-alternativas
150. https://turnozo.com/es/blog/alternativas-a-bizneo-hr
151. https://woffu.com/en/sector/industrial/
152. https://www.jibble.io/es/resenas/woffu
153. https://www.capterra.com/p/141217/Calamari/pricing/
154. https://technologyadvice.com/products/calamari-reviews/
155. https://slashdot.org/software/p/Calamari/
156. https://www.techrepublic.com/es/article/best-time-and-attendance-software/
157. https://www.softwareadvice.com/hr/time-attendance-comparison/
158. https://learn.g2.com/best-time-and-attendance-software
159. https://www.rosterelf.com/blog/attendance-kpi-review
160. https://www.opentimeclock.com/blog2026/10-essential-real-time-kpis-every-hr-manager-should-track.html
161. https://platform.softwareone.com/product/sprout-insight/PCP-5350-1719
162. https://blog.epaysystems.com/?p=199
163. https://ncosc.gov/node/789
