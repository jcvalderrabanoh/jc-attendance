---
proyecto: Checador
fuente: jc-attendance/docs/investigacion/B-latam-mexico-legal.md
sincronizado: 2026-10-25
tags: [checador, asistencia]
---

# Investigación de mercado y requisitos legales: SaaS de registro de entradas y salidas (checador) para LatAm, México y España

Fecha de corte: 20-oct-2026.

**Cómo se hizo y sus límites.** WebFetch y curl estaban bloqueados en este entorno (DNS ENOTFOUND y proxy 403 en todos los dominios). Por eso todo lo que sigue viene de las páginas que devolvió WebSearch (títulos, extractos y síntesis); no se abrió ninguna página completa. Lo marcado **[NV]** (no verificado) viene de una sola fuente secundaria, de un competidor del producto o tiene datos contradictorios entre fuentes. Los precios casi nunca son públicos en LatAm, así que hay que confirmarlos con cada proveedor.

---

## 1. Fichas de producto (26 productos; 4 de los pedidos no se pudieron identificar)

Abreviaturas: Geo = geocercas; AF = antifraude; Inc = incidencias; HE = horas extra.

### 1. Sesame HR (España, con presencia en LatAm)
- **Fuentes:** assets.sesamehr.com (manual de dispositivos y manual de WhatsApp), Capterra, Softabase, Skello, Jibble (reseña de competidor), comparasoftware.
- **Marcaje:** app, web, QR dinámico en tablet (el empleado lo escanea con el móvil), modo kiosko en tablet con reconocimiento facial (se suben fotos al perfil del empleado), WhatsApp, NFC, smartwatch y terminales biométricas.
- **Geo:** el fichaje por WhatsApp pide la ubicación y se puede **restringir fuera del radio**. Las coordenadas solo se guardan en el momento de fichar, sin seguimiento continuo (diseño pensado para el RGPD).
- **AF:** QR dinámico, facial y geocerca. Hay reseñas en Capterra que se quejan de errores del reconocimiento facial.
- **Turnos:** planificador drag-and-drop. La "IA de turnos" es un add-on de unos 49 €/mes (dato de Skello, competidor) [NV].
- **HE:** cálculo automático de horas extra y pausas, según Softabase [NV].
- **Reportes:** los informes del registro de jornada de 2019 (España) [NV]. No procesa nómina: exporta a la gestoría.
- **Precio:** entre 4,50 y 8 €/empleado/mes. Planes Essential 4,75, Connect 5,50, Growth 6,25 y Scale 8 € con pago anual; mínimo de 15 personas. El fichaje por WhatsApp es un add-on de unos 0,80 €/empleado/mes [NV]. No se encontró precio en MXN.
- **Diferenciador:** la mayor variedad de canales de fichaje del mercado, incluido WhatsApp.

### 2. Factorial (España, con producto para México)
- **Fuentes:** factorial.mx/control-asistencia, /funcionalidades, /blog/reloj-checador-control-asistencia, /reloj-checador, /integracion-contpaqi-factorial, el blog sobre la reforma de 40 horas, Softabase y la reseña de Jibble.
- **Marcaje:** app, web, QR en sitio, tablet como kiosko, WhatsApp (integración "WhatsApp Factorial One") y facial (este último según Jibble) [NV].
- **Geo:** geolocalización con **alertas cuando se ficha fuera de los límites**.
- **Inc:** ausencias, faltas, vacaciones e incapacidades.
- **Nómina:** integración con **CONTPAQi** que manda las incidencias a la nómina lista para timbrar. Calcula nómina en España, México, Brasil y otros países.
- **Precio:** desde unos 5,5 €/persona/mes (cifra citada por competidores) [NV]. No hay precio público en MXN.
- **Diferenciador:** suite completa de RR.HH. y puente con CONTPAQi.

### 3. GeoVictoria (Chile; muy presente en México y en 15 o más países de LatAm)
- **Fuentes:** geovictoria.com/es-mx/, /servicios/control-de-asistencia/, /marcaje/, /mx/reloj-checador/, artículos del blog (leyes de asistencia en México, geolocalización, marcaje desde el celular), comparasoftware.
- **Marcaje:** reloj checador propio (huella, rostro, tarjeta; conexión LAN, Wi-Fi o 5G; memoria interna que guarda marcas sin conexión), web, y app con selfie y georreferencia.
- **Geo:** GPS para personal en terreno.
- **AF:** biometría contra la suplantación; foto o facial en la app.
- **Funciones:** turnos, atrasos y horarios cumplidos en tiempo real, alertas, integración con nómina, **apoyo para cumplir la NOM-035** y reportes de faltas, retardos, vacaciones, justificaciones y horas extra.
- **Precio:** solo por cotización.
- **Diferenciador:** hardware y software de un mismo proveedor, y alianzas con Nubox (Chile, ley de 40 horas) y Rankmi.
- **No encontrado:** marcaje por WhatsApp ni integración específica con CONTPAQi.

### 4. Buk (Chile; vende en México, Colombia y Perú)
- **Fuentes:** buk.mx/asistencia, /control-de-asistencia-laboral, /productos/administracion/control-de-asistencia, artículos del blog (reloj checador y reforma, horas extra, incidencias), buk.co/precios, supportcenter.buk.cl (reporte de asistencia por ubicación).
- **Marcaje:** app con geocerca configurable sobre Google Maps (radio alrededor de la sede), reconocimiento facial, huella, palma, web y quioscos faciales.
- **Funciones:** turnos, HE con **alertas de horas extra no autorizadas**, retardos, ausencias, permisos y vacaciones, todo conectado a la nómina. Reporte de asistencia por ubicación con las coordenadas de cada marca.
- **Precio:** por colaborador vigente al mes, más barato por persona a mayor volumen. Plan base Esencial o Pro más módulos. **Administradores ilimitados sin costo**. Las tarifas en MXN no son públicas.
- **Diferenciador:** suite de RR.HH. y nómina para LatAm; implementación con jefe de proyecto.

### 5. Runa (México)
- **Fuentes:** runahr.com/co/asistencias/, /mx/integraciones/control-id/, /integraciones/contpaqi/, Contxto.
- **Marcaje:** app, web, reloj checador, kiosko. **Marca sin conexión** que se sincroniza después. Guarda y valida el lugar de cada marca.
- **Integraciones de hardware:** Control iD, Hikvision, Suprema y ZKTeco. Integración contable con CONTPAQi.
- **Precio:** el plan RUNA PRO se ve desde $15 MXN/empleado/mes en una tarjeta de descuento, pero no corresponde al módulo de asistencia [NV]. Se cobra por número de empleados y funciones.
- **Diferenciador:** nómina mexicana nativa más conectores con los relojes más comunes.

### 6. Worky (México, pymes operativas)
- **Fuentes:** Capterra.es, comparasoftware, descubre.vc, PDF comercial de Worky 2023, Spendbase.
- **Marcaje:** reloj checador digital (app); turnos de día y de noche; descansos.
- **Incluye:** reportes de asistencia, nómina, reclutamiento y Analytics.
- **Precio:** **Avanzado $79 MXN/empleado/mes, Pro $99 MXN, Enterprise a medida** (Capterra; el material 2023 de Worky confirma los $79). Spendbase menciona $148 MXN para "Avanzado Pro" [NV].
- **Diferenciador:** uno de los pocos con precio público en MXN; pensado para pymes.

### 7. Humand (Argentina; app de experiencia del empleado)
- **Fuentes:** help.humand.co (artículos de geolocalización y privacidad, permisos de ubicación, cómo ver y editar registros), App Store.
- **Marcaje:** "reloj de fichaje" en la app. **La ubicación solo se toma al iniciar y al detener**, sin monitoreo continuo.
- **Funciones:** el administrador puede crear o editar registros (entrada, salida, ubicación asignada, notas). La vista móvil del supervisor muestra horas trabajadas contra planificadas, incidencias, quién está programado y si cumple.
- **Precio:** no encontrado.
- **Diferenciador:** combina comunicación interna (red social corporativa) con asistencia.

### 8. Talana (Chile y Perú)
- **Fuentes:** web.talana.com/productos/asistencia-y-turnos, /es-pe/sistema-control-asistencia-peru, /blog/control-de-asistencia-digital, /software-rrhh-transporte, ayuda.talana.com (Res. Exenta 38), dt.gob.cl (Ord. 5330 de 2017).
- **Marcaje:** celular, computador, reloj control, biometría facial en móvil, GPS en terreno con validación en tiempo real.
- **Funciones:** **mapa de calor por sucursal con semáforo** de cuánta gente hay en cada una; turnos semanales, mensuales y rotativos (por ejemplo 4x4) con carga masiva desde Excel; aprobación de HE; **reporte legal en PDF que se puede mandar a firma electrónica**.
- **Certificación:** dice estar certificado por la DT de Chile, pero sus páginas citan números de dictamen distintos [NV].
- **Precio:** no público. No aparece México.

### 9. Rankmi (Chile; dice tener clientes en México)
- **Fuentes:** dt.gob.cl (ORD. N°433 de 22-sep-2026), guiaminera.cl (alianza con GeoVictoria), pauta.cl, runahr.com/cl.
- **Dato clave:** la Dirección del Trabajo concluyó el 22-sep-2026 que **"Rankmi Gestión de Asistencia" no cumple del todo la Res. Exenta 38**, así que no se puede usar en relaciones laborales en Chile. La numeración del documento es inconsistente (433 o 432) [NV].
- **Funciones:** suite de talento, clima y nómina con un módulo de "tiempo". En 2023 hizo alianza con GeoVictoria para la asistencia.
- **Lección para nosotros:** la certificación regulatoria puede excluir a un producto del mercado.

### 10. ZKTeco BioTime / BioTime Cloud / ZKBio TimeCloud (hardware chino, muy extendido en México)
- **Fuentes:** zkteco.com/en/ZKBioTimeMobileAPP, folleto BioTime Cloud 2.0 (alas-la.org), syscom.mx (productos y blog de BioTime Cloud 2.0), manual de app móvil y geocerca (document360), App Store, comparasoftware.
- **Marcaje:** terminales de huella, rostro, palma o tarjeta con protocolo ADMS hacia la nube; app ZKBioTime con GPS y **geocerca** (desde BioTime Pro 1.0.6).
- **Reportes:** PDF, TXT, CSV y XLS para cargar en la nómina.
- **Precio:** el folleto promete "menos de 1 USD/usuario/mes" [NV]. En Syscom, la licencia de la app se compra aparte del software.
- **Diferenciador:** precio bajo y una base de terminales ya instalada enorme. **Conviene integrarse con ADMS/BioTime** para quedarnos con clientes que ya tienen el hardware.

### 11. Anviz CrossChex Cloud
- **Fuentes:** anviz.com/product/118.html, support.anviz.com (FAQ de suscripción), Capterra, GetApp, softwarefinder, Spendbase.
- **Marcaje:** terminales Anviz; app con geocerca (latitud y longitud más radio) y geoetiqueta en cada marca.
- **Precio:** **no cobra por empleado**. Gratis con 1 administrador y 1 dispositivo; **99 USD/año por cada dispositivo adicional y 199 USD/año por cada administrador adicional**. Incluye unas 5 ubicaciones geo por administrador [NV].
- **Diferenciador:** cobra por dispositivo y no por persona, lo que lo hace muy barato con plantillas grandes.

### 12. Hikvision HikCentral (Professional y Access Control)
- **Fuentes:** hikvision.com (páginas de HikCentral Access Control), folleto de terminales MinMoe, benchmarkmagazine.com, ficha de ADI Global, datasheet antiguo (mtender.gov.md).
- **Marcaje:** terminales faciales MinMoe sin contacto; huella, iris, tarjeta, QR, PIN y Bluetooth.
- **Funciones:** horarios, reportes de asistencia, sincronización con bases de datos externas. La asistencia es un "Time & Attendance Expansion Pack" sobre el módulo de control de acceso.
- **Precio:** licencias on-premise vía distribuidores. HikCentral Access Control tiene un nivel gratuito de hasta 4 puertas.
- **Diferenciador:** pensado para seguridad física y control de acceso más que para RR.HH.

### 13. Bizneo HR (España)
- **Fuentes:** appvizer.es, Rankia, Holded, softwaredoit, Skello, turnozo (los dos últimos son competidores), blog de Factorial.
- **Marcaje:** web, app, kiosko; geolocalización y **restricción por IP**.
- **Precio:** unos 6 €/empleado más una cuota fija de unos 55 €/mes [NV]. Prueba gratis de 15 días.

### 14. Woffu (España)
- **Fuentes:** woffu.com/en (páginas sectoriales), reseña de Jibble, turnozo, Factorial, interempresas.
- **Marcaje:** app y web con **control por geolocalización e IP**.
- **Precio:** el plan Lite (hasta 10 empleados) es el único con precio público; Pro y Enterprise van a medida. Jibble cita 1,5 €/empleado/mes [NV].
- **Diferenciador:** fuerte en flexibilidad horaria y bolsa de horas.

### 15. Endalia (España, empresas medianas y grandes)
- **Fuentes:** blog de Factorial (competidor), softwaredoit.es.
- **Funciones:** control horario integrado con turnos avanzados y nómina; portal del empleado con fichaje, vacaciones y firma digital; People Analytics.
- **Precio:** a medida, según módulos; se puede combinar con outsourcing de nómina.

### 16. Grupo Tress / Sistema TRESS (México; Tijuana, desde 1991)
- **Fuentes:** simplify.jobs, builtin.com, comparasoftware (Kit Consultores).
- **Funciones:** RR.HH., nómina y control de asistencia. Dice tener más de 1,150 clientes en 15 países y, según un partner, más de 105 millones de recibos timbrados en 2 años [NV].
- **No verificado:** cómo integra relojes y prenómina; no se encontraron páginas de tress.com.mx [NV].
- **Diferenciador:** muy usado en maquiladoras de la frontera norte.

### 17. Aspel NOI Asistente (Siigo Aspel, México)
- **Fuentes:** aspel.com.mx (folleto y ficha técnica de NOI Asistente), App Store MX, siigo.com/mx (prueba gratis).
- **Marcaje:** el celular funciona como reloj checador con **huella o NIP**, además de web.
- **Geo:** registro por GPS dentro de límites predefinidos y **"horarios en recorrido" geolocalizados**.
- **Funciones:** horarios por sucursal; descansos; vacaciones, permisos, incapacidades y faltas; envío a **Aspel NOI** (opcional para NOI 10).
- **Precio:** **gratis de 1 a 5 colaboradores**; prueba de 30 días. No se encontraron tarifas para plantillas mayores.
- **Diferenciador:** cercanía con los despachos contables que ya usan NOI.

### 18. CONTPAQi (Nóminas y Personia)
- **Fuentes:** cloud.mi.contpaqi.com/personia, factorial.mx/integracion-contpaqi-factorial, runahr.com/integraciones/contpaqi.
- **Hallazgo:** no se encontró un checador nativo de CONTPAQi. La app "Colabora" no existe en los resultados [NV]. En la práctica, otros sistemas (Factorial, Runa, Acceso 3 TITANIUM) **exportan incidencias a CONTPAQi Nóminas**.
- **Implicación:** **exportar a CONTPAQi y Aspel NOI es imprescindible en México.**

### 19. Acceso 3 TITANIUM (distribuido por Syscom, México)
- **Fuentes:** syscom.mx (blog de integración de relojes con nómina).
- Software de tiempo y asistencia para relojes ZKTeco y Suprema; se integra con Aspel NOI y CONTPAQi; reportes de incidencias y días incompletos; demo gratis.

### 20. Control2000 / Checador 2000 (México)
- **Fuentes:** control2000.com.mx (folleto CH.pdf), auxiliarrh.control2000.com.mx.
- Hardware (huella, código de barras o teclado) más software; captura manual de "situaciones especiales"; exporta afectaciones a Nómina 2000. También publica guías sobre la reforma de 2026.

### 21. CheckRH (SoftwarePaq, México)
- **Fuentes:** checkrh.com (CHECKRH.pdf y ficha técnica).
- **Marcaje:** **WhatsApp, kiosko y QR sin hardware**, geolocalización con geocercas, reconocimiento facial y **registro de actividades por voz**.
- El colaborador solo necesita WhatsApp. Se contrata por paquetes; precio no público.
- **Diferenciador:** WhatsApp como canal principal, sin instalar ninguna app. Es el modelo que más se parece al objetivo "sin fricción".

### 22. Jibble (global, con páginas en español)
- **Fuentes:** jibble.io/es (gestión de asistencia, aplicación de quiosco, control de asistencia en oficinas, ayuda para invitar miembros), help.jibble.io (planes), página de política de precios localizados en italiano, Actitime, Hivedesk, Workyard.
- **Marcaje:** app, web, **quiosco gratuito** con facial y **detección de vida (liveness)**, selfies, geocercas; **funciona sin conexión** incluso con GPS y facial.
- **Alta de empleados:** **invitación por enlace**, por correo o por teléfono, o crear el miembro sin cuenta para que fiche en el quiosco.
- **Precio:** **plan gratis con usuarios ilimitados (incluye facial y GPS)**. Premium a 3,99 USD (anual) o 4,99 USD (mensual) por usuario/mes; Ultimate a 6,99 o 9,99 USD. Tiene precios localizados por país [NV].
- **Diferenciador:** el plan gratuito marca el precio de referencia hacia abajo.

### 23. Clockify (páginas en español)
- **Fuentes:** clockify.me/es (planes y precios), help/es (planes de suscripción), Enterprise, Softabase.
- **Kiosko** desde el plan Basic. Plan gratis hasta 5 usuarios, con **exportación PDF** y API.
- **Precio (USD por usuario/mes, anual o mensual):** Basic 3,99 / 4,99; Standard 5,49 / 6,99; Pro 7,99 / 9,99; Enterprise 11,99 / 14,99. En Enterprise, los "usuarios limitados" solo fichan en el kiosko.
- Más orientado a horas por proyecto que a asistencia según la LFT.

### 24. Facture App Reloj Checador (México)
- **Fuentes:** App Store MX (id6445899984).
- Complemento de Facture App Nómina: geolocalización, **perímetro permitido** y check en un centro de trabajo concreto. App gratuita.

### 25. Kronio, ARI, RH IS y RH Ayala (apps pequeñas de la App Store mexicana)
- **Fuentes:** apps.apple.com/mx (Kronio id1522808314, ARI id1634489594, RH IS, RH Ayala).
- **Kronio:** facial; horarios fijos, flexibles, nocturnos y rotativos.
- **ARI:** **retardos y faltas automáticos**; solicitudes de vacaciones y permisos.
- Son competencia de nicho de bajo precio.

### 26. ControlRoll (PDC2.0)
- **Fuentes:** App Store MX (id6736370050).
- Solo se encontró su app de autoservicio PDC2.0: recibos de nómina, asistencia, beneficios, solicitudes y firma electrónica. Sus funciones de checador no están verificadas [NV].

### No identificados
- **Kiosko**, **Nominax**, **Asistia** y "Tiempo Real / Biométricos Mx" no aparecieron como productos en ninguna búsqueda; no hay que citarlos sin comprobarlos. "Kiosko" aparece solo como *modo* de varios productos (CheckRH, Jibble, Factorial).

### Referencias adicionales de mercado
- **Turnozo** (España): 2,99 €/empleado activo/mes con turnos y GPS; es competidor y fuente parcial.
- **Cegid LatAm:** página sobre el registro electrónico de jornada en México.
- Una guía española sitúa el control horario SaaS **entre 1,5 y 8 €/empleado/mes** (combohr).

---

## 2. Marco legal

### 2.1 México: LFT (prioridad)

**A) Reforma de la jornada de 40 horas**
- **Reforma constitucional al art. 123:** DOF del 3-mar-2026.
- **Reforma a la LFT:** DOF del 1-may-2026, edición vespertina. El texto oficial está en diputados.gob.mx: `LeyesBiblio/ref/lft/LFT_ref52_01may26.pdf` y `legis/reflxvi/096_LFT_01may26.doc`. Reforma los arts. 59, 61, 66, 68, 69 y 71, y adiciona el **art. 132 fr. XXXIV** y el **art. 994 fr. IV Bis**.
- **Calendario de la jornada semanal máxima:** 48 h en 2026, **46 h desde el 1-ene-2027**, 44 h en 2028, 42 h en 2029 y **40 h en 2030**. La reducción no puede bajar sueldos ni prestaciones.

**B) Tipos de jornada (arts. 60 y 61)**
- Los topes diarios no cambian: **diurna 8 h** (6:00 a 20:00), **nocturna 7 h** (20:00 a 6:00) y **mixta 7.5 h**.
- La jornada es mixta si la parte nocturna dura **menos de 3.5 h**; si dura más, se considera nocturna.
- Según El Imparcial, el turno nocturno llegará a 35 h semanales en 2030.

**C) Horas extra (arts. 66 a 68, ya reformados)**
- **Antes de la reforma:** hasta 3 h diarias, 3 veces por semana (9 h/semana) pagadas **al doble**; lo que excede de 9 h se paga **al triple**.
- **Ahora:**
  - **Art. 66:** tope semanal de HE pagadas al doble (100% adicional) que crece por transitorio: **9 h en 2026 y 2027, 10 h en 2028, 11 h en 2029 y 12 h en 2030** (transitorio cuarto según FiscoClic) [NV en el detalle año por año].
  - **Art. 68 (texto del DOF):** el tiempo que excede el tope del art. 66 **no puede pasar de 4 h por semana** y se paga con **200% adicional** (triple). La **jornada ordinaria más la extraordinaria no puede superar 12 h diarias**.
  - Algunas fuentes añaden un límite de 4 h extra diarias en hasta 4 días por semana [NV].
  - **Las personas menores de 18 años no pueden trabajar horas extra.**
  - Las horas extra son voluntarias.
- **Implicación para el motor:** las reglas tienen que poder **configurarse por fecha de vigencia** (tabla de topes por año) y validar el tope diario de 12 h.

**D) Descanso y prima dominical (arts. 69 a 71)**
- 1 día de descanso con goce de salario íntegro por cada 6 días trabajados.
- **Prima dominical: al menos 25%** sobre el salario de un día ordinario si se trabaja en domingo.
- Trabajar en el día de descanso o en un día festivo obligatorio se paga **doble, además del salario** del día.
- La reforma toca los arts. 69 y 71; según idconline y mediotiempo se habla de esquemas 5x2 [NV en el detalle].
- **Descanso dentro de la jornada:** al menos 30 min (art. 63; citado por el blog de Factorial).

**E) Registro electrónico obligatorio de jornada (nuevo)**
- **Art. 132 fr. XXXIV:** el patrón debe **registrar electrónicamente la hora de inicio y fin de la jornada de cada trabajador** y entregar ese registro a la autoridad cuando lo pida.
- **Vigencia:**
  - El decreto está vigente desde el 1-may-2026 (transitorio primero).
  - Las **disposiciones generales de la STPS** que definen a quién aplica, las excepciones y el procedimiento **entran en vigor el 1-ene-2027 (transitorio quinto)**.
  - Las fuentes no coinciden en si la obligación es exigible antes de esa fecha. La lectura práctica dominante es que **se exige desde el 1-ene-2027**.
- **Estado de las disposiciones de la STPS:**
  - Al **7-ago-2026** no se habían publicado (ZKTeco Tienda).
  - Al **14-oct-2026** seguían "esperándose este otoño" (Timemark).
  - El Economista anticipaba que saldrían en octubre de 2026.
  - **No se encontró publicación en el DOF al 20-oct-2026 [NV; hay que revisar el DOF].**
  - Según declaraciones de un funcionario de la STPS, **no se exigiría un dispositivo ni un formato técnico concretos** y los inspectores podrían **revisar el registro a distancia** [NV].
- **Multa por no registrar:** **de 250 a 5,000 UMA** (art. 994 fr. IV Bis). Una fuente lo convierte en unos $29,327 a $586,550 MXN.
- **Lo que la ley no define:** formato, dispositivo, uso de biometría ni plataforma. Esto puede cambiar con las disposiciones de la STPS, así que hay que diseñar el producto para adaptarse.

**F) Prueba y conservación (arts. 784, 804 y 805)**
- **Art. 784:** el patrón debe probar la jornada, las faltas y la antigüedad cuando haya controversia.
- **Art. 804 fr. III:** el patrón debe conservar y exhibir en juicio los **controles de asistencia** cuando se lleven en el centro de trabajo, **durante el último año y hasta 1 año después de terminada la relación laboral**.
- **Art. 805:** si no los exhibe, **se presumen ciertos los hechos que alega el trabajador**.
- **SCJN, contradicción de criterios 148/2022:** regula en qué momentos debe exhibir el patrón los controles de asistencia.
- **Por obligaciones fiscales y de seguridad social** (CFF art. 30 y LSS art. 15), conviene conservar **5 años, y hasta 10 en caso de auditoría**.
- **Recomendación:** retención por defecto de **5 años** desde la baja, configurable por cuenta.

**G) NOM-035-STPS-2018 (riesgo psicosocial)**
- Las **jornadas que exceden lo previsto en la LFT** y la rotación de turnos sin pausas son factores de riesgo.
- El patrón debe tener una política de prevención, identificar y analizar los factores de riesgo (obligatorio con más de 15 trabajadores) y aplicar las guías de referencia.
- Está vigente desde el 23-oct-2019 (parte de las obligaciones desde el 23-oct-2020).
- **Para el producto:** alertas de jornadas excesivas y descansos no tomados, más un reporte de "exceso de jornada" que sirva como evidencia para la NOM-035. GeoVictoria lo vende como argumento comercial.

### 2.2 México: protección de datos (nueva LFPDPPP 2025)
- **Publicación:** DOF del **20-mar-2025**, vigente desde el **21-mar-2025**. Sustituye a la ley de 2010. Última reforma: DOF del 14-nov-2025.
- **Autoridad:** el INAI desapareció. Ahora la **Secretaría Anticorrupción y Buen Gobierno (SABG)** verifica y sanciona a los particulares.
- **Reglamento:** **pendiente** según sharkit.mx (2026) [NV].
- **Datos sensibles:** la lista es enunciativa; incluye salud y los que puedan llevar a discriminación o a un riesgo grave. Las fuentes secundarias incluyen la **biometría** (huella y rostro) como dato sensible.
- **Consentimiento:**
  - Por regla general es tácito.
  - Los datos patrimoniales y financieros requieren consentimiento expreso.
  - **Los datos sensibles requieren consentimiento expreso y por escrito**: firma autógrafa, **firma electrónica o cualquier mecanismo de autenticación** (art. 8, según guías) [NV en la numeración].
  - El INAI ya había exigido consentimiento por escrito para reconocimiento facial (caso de los estadios de la Liga MX).
- **Aviso de privacidad (art. 15):**
  - Identidad del responsable.
  - Datos que se tratan, **señalando cuáles son sensibles**.
  - Finalidades, separando las que necesitan consentimiento.
  - Transferencias.
  - Medios para limitar el uso, ejercer los **derechos ARCO** y revocar el consentimiento.
- **Geolocalización:** no se encontró un criterio específico para trabajadores. Lo prudente es aplicar **proporcionalidad y minimización**: tomar la ubicación **solo al marcar** (como hacen Humand y Sesame) e informarlo en el aviso.
- **Multas:** **de 100 a 320,000 UMA**. Las fuentes dicen que se **duplican con datos sensibles** [NV].
- **No resuelto:** si existe alguna excepción laboral al consentimiento. **Hace falta revisión jurídica.**

### 2.3 España (referencia)
- **RDL 8/2019 y art. 34.9 del Estatuto de los Trabajadores:**
  - **Registro diario** con hora concreta de **inicio y fin** de cada trabajador; no vale un registro semanal ni mensual.
  - Las pausas no son obligatorias de registrar.
  - El sistema se organiza por negociación colectiva o por decisión de la empresa tras consultar a los representantes.
  - **Conservación de 4 años**, a disposición de los trabajadores, sus representantes y la Inspección.
  - Obligatorio desde el 12-may-2019.
  - Firmar en papel ha sido cuestionado como registro válido (LegalToday).
- **Real Decreto de registro horario digital, en tramitación:**
  - 30-sep-2025: el Consejo de Ministros aprueba tramitarlo por urgencia.
  - 23-mar-2026: dictamen **desfavorable** del Consejo de Estado.
  - 24-jul-2026: se acuerda aplazarlo a septiembre.
  - 9-sep-2026: Yolanda Díaz anuncia su aprobación "inmediata".
  - **Al 27 y 30-sep-2026 seguía sin aprobarse ni publicarse en el BOE**; no se encontró aprobación en octubre [NV].
- **Contenido previsto del Real Decreto:**
  - Registro **digital, personal e inalterable**.
  - **Acceso inmediato y remoto** para el trabajador, sus representantes y la Inspección de Trabajo.
  - Distinguir horas ordinarias y extraordinarias.
  - **Sanciones por cada trabajador afectado.**
  - Vigencia a los 20 días de publicarse en el BOE; los requisitos técnicos, 6 meses después de su desarrollo.
- **Por qué importa:** es el modelo que probablemente seguirá la STPS (acceso remoto del inspector e inalterabilidad).

### 2.4 Chile (referencia): Res. Exenta N°38 de 2024 de la Dirección del Trabajo
- **Origen:** desarrolla el art. 33 del Código del Trabajo (Ley 21.561). Publicada en el Diario Oficial el 9-may-2024; modificada por la Res. Ex. 9453 de 25-abr-2025 [NV].
- **Autorización previa:**
  - Los sistemas electrónicos necesitan **autorización o certificación previa de la DT**, válida **2 años**.
  - Las autorizaciones generales anteriores vencieron el 26-abr-2025.
- **Requisitos técnicos:**
  - Identificación segura del trabajador.
  - **Registros inalterables con log de auditoría o hash** de cada modificación.
  - **Comprobante por cada marca** con la geoposición, entre otros datos (art. 13).
  - Conservar los **registros de posicionamiento 5 años**.
- **Geolocalización:**
  - Está permitida, con límites (Ord. 554 de 18-ago-2025).
  - **Bloquear la marca porque el trabajador está fuera de la geocerca es una infracción** (Ord. 408 de 11-sep-2026). La ubicación se registra, pero no puede impedir que el trabajador marque.
- **Caso Rankmi:** su sistema fue rechazado por no cumplir la Res. 38 (ORD. N°433, 22-sep-2026).
- **Implicación de diseño:** en Chile la geocerca debe **marcar o alertar, nunca bloquear**. En México no hay una regla equivalente, pero lo más defendible es permitir la marca fuera de zona, etiquetarla "fuera de geocerca" y mandarla a aprobación, configurable por cuenta.

---

## 3. Matriz de funciones: imprescindibles frente a diferenciadoras (LatAm)

| Área | Imprescindible (todos lo tienen) | Diferenciador (lo tienen pocos) |
|---|---|---|
| Canales de marcaje | App móvil (iOS/Android), web, kiosko en tablet compartida | **WhatsApp** (CheckRH, Sesame, Factorial); voz (CheckRH); NFC y smartwatch (Sesame) |
| Biometría y hardware | Integración con relojes de huella o rostro (ZKTeco, Hikvision, Suprema, Control iD) | Facial en el móvil con **detección de vida** (Jibble); facial en kiosko propio |
| Antifraude | Geolocalización en cada marca; selfie | **QR dinámico** (Sesame); restricción por IP (Woffu, Bizneo); detección de GPS falso o dispositivo nuevo (no confirmado en ningún producto: oportunidad) |
| Geocercas | Radio por sucursal sobre un mapa | Varias geocercas por empleado; **rutas o recorridos geolocalizados** (Aspel); mapa de calor por sucursal (Talana); modo "alertar, no bloquear" |
| Sin conexión | Algunos relojes guardan marcas en memoria | **Marcas sin conexión en la app** con sincronización posterior (Runa, Jibble) |
| Turnos | Horario fijo; turno nocturno | Rotativos (4x4, 12x36), carga masiva desde Excel (Talana), turnos con IA (Sesame) |
| Incidencias | Retardos, faltas, permisos, vacaciones, incapacidades | Reglas de tolerancia por cuenta; justificaciones con adjunto; **alertas de HE no autorizadas** (Buk) |
| Horas extra | Cálculo diario y semanal | **Motor LFT dobles/triples con topes por año 2026-2030**, prima dominical, descanso trabajado, tope de 12 h diarias |
| Aprobaciones | Jefe aprueba ausencias | Flujos de varios niveles; aprobar HE y marcas fuera de zona |
| Alta de empleados | El administrador da de alta o invita por correo | **Invitación por enlace** (Jibble); autorregistro con **validación previa** (pre-registro tipo Shoplworks); **no se encontró "código de empresa más reglas de validación automáticas": oportunidad** |
| Campos personalizados | Pocos productos los documentan | Campos por cuenta en el alta y en reportes (diferenciador real) |
| Reportes | Excel/CSV | **PDF legal firmable** (Talana con firma electrónica), PDF por empleado y periodo, exportación a **CONTPAQi y Aspel NOI**, layout para timbrado CFDI |
| Dashboards | Asistencia del día, retardos | Mapa de calor por sucursal, ausentismo y HE como costo, KPIs de cumplimiento NOM-035 |
| Multiempresa y multisucursal | Varias sucursales por cuenta | **Un usuario en varias cuentas** (poco común; útil para despachos contables y personal compartido) |
| Cumplimiento | Aviso de privacidad | **Registro inalterable y auditable**, portal para el inspector, retención configurable, consentimiento biométrico electrónico |

---

## 4. KPIs e indicadores comunes
1. **Tasa de ausentismo (%)** = horas o días de ausencia / horas o días programados × 100. Hay que decidir qué tipos de ausencia cuentan y mantener el criterio (Talana, Factorial). Separar justificado de injustificado.
2. **Ausencias no planificadas (%)** e índice de Bradford [NV: no aparece en las fuentes, es una buena práctica].
3. **Puntualidad (%)** = marcas a tiempo / marcas totales × 100. **Retardos** por persona o sucursal y **minutos de retardo acumulados**.
4. **Salidas anticipadas** y **marcas faltantes** (entrada sin salida).
5. **Horas extra:** total, por tipo (dobles o triples), **costo de HE**, % de HE no autorizadas y **% del tope legal usado** (9 a 12 h/semana).
6. **Horas trabajadas frente a planificadas** (adherencia al horario) y cumplimiento de descansos o pausas.
7. **Exceso de jornada** (días por encima de 12 h o semanas por encima del tope), útil para la NOM-035.
8. **Asistencia en tiempo real:** presentes, ausentes y retrasados ahora, por sucursal (semáforo o mapa de calor tipo Talana).
9. **Marcas fuera de geocerca** y **marcas editadas manualmente** (salud del antifraude y de la auditoría).
10. **Costo del ausentismo** (horas no trabajadas × costo por hora), vacaciones pendientes y uso de permisos.
11. Rotación (bajas / plantilla promedio × 100) como indicador de RR.HH. relacionado.

RosterElf recomienda quedarse **solo con KPIs que lleven a una acción concreta** y evitar los de vanidad.

---

## 5. Precios de referencia

| Producto | Modelo | Precio | Moneda / fuente |
|---|---|---|---|
| Worky | por empleado/mes | **$79 Avanzado, $99 Pro** (Enterprise a medida) | MXN, Capterra y Worky 2023 |
| Runa | por empleado/mes | PRO "desde $15" (no es el módulo de asistencia) [NV] | MXN |
| Aspel NOI Asistente | por tramo | **gratis de 1 a 5 colaboradores**; resto no público | MXN |
| Sesame | por empleado/mes | 4,50 a 8 €; mínimo de 15 personas; WhatsApp +0,80 € [NV] | EUR |
| Factorial | por empleado/mes | desde unos 5,5 € [NV] | EUR |
| Bizneo | por empleado más cuota fija | unos 6 € más unos 55 €/mes [NV] | EUR |
| Woffu | por empleado | Lite solo hasta 10 empleados; unos 1,5 € [NV]; el resto a medida | EUR |
| Turnozo | por empleado activo | 2,99 € | EUR |
| Jibble | por usuario/mes | **gratis ilimitado**; Premium 3,99 a 4,99 y Ultimate 6,99 a 9,99 USD [NV] | USD |
| Clockify | por usuario/mes | Basic 3,99 a 4,99 hasta Enterprise 11,99 a 14,99 | USD, oficial |
| Anviz CrossChex Cloud | por dispositivo o administrador | gratis 1+1; **99 USD/año por dispositivo y 199 USD/año por administrador** | USD |
| ZKTeco BioTime Cloud | por usuario | "menos de 1 USD/usuario/mes" [NV] más hardware | USD |
| GeoVictoria, Buk, Talana, Humand, Endalia, Tress, CheckRH, Rankmi | cotización | no público | n/d |

**Lectura del mercado:**
- **Pymes en México:** de $15 a $100 MXN por empleado al mes (unos 0,8 a 5,5 USD).
- **Suites de LatAm:** por cotización, con descuentos por volumen.
- **España:** de 1,5 a 8 € por empleado al mes.
- **Abajo del mercado** presionan el plan gratuito de Jibble y Anviz, que cobra por dispositivo.
- **Rango que proponemos:** **$25 a $60 MXN por empleado activo al mes** (unos 1,4 a 3,3 USD), con un plan gratis o muy barato para menos de 5 o 10 empleados y add-ons (WhatsApp, biometría facial, integración de nómina) [recomendación propia, no es un dato].

---

## 6. Requisitos legales que tenemos que implementar (México primero)

**Registro de jornada (LFT art. 132 XXXIV, exigible desde el 1-ene-2027)**
- [ ] Registro **electrónico de inicio y fin de jornada por trabajador y por día**, con sello de tiempo del servidor y zona horaria de la sucursal.
- [ ] Registro de **pausas** (opcional) y tipo de jornada (diurna, nocturna o mixta) calculado a partir del horario real (regla de menos de 3.5 h nocturnas = mixta).
- [ ] **Inalterabilidad:** las marcas originales no se pueden modificar. Cada corrección se guarda como un evento nuevo con autor, motivo, fecha y versión anterior (bitácora de auditoría, idealmente con **cadena de hash**). Así se cumple la Res. 38 de Chile y lo previsto en España.
- [ ] **Exportación para la autoridad** (STPS): PDF y CSV por trabajador y periodo, **más acceso de solo lectura para un inspector** (enlace temporal), en previsión de la revisión remota.
- [ ] **Acceso del trabajador** a sus propios registros (autoservicio, buena práctica de la NOM-035, obligatorio en España).
- [ ] **Arquitectura adaptable:** reglas parametrizables para adaptarse a las disposiciones de la STPS (formato, excepciones, tamaño de empresa) cuando se publiquen. **Seguir el DOF.**

**Jornada y pago (arts. 60 a 71)**
- [ ] Motor de reglas con **vigencia por fecha:** jornada semanal máxima 48, 46, 44, 42 y 40 h para 2026 a 2030.
- [ ] Topes de HE dobles de **9, 9, 10, 11 y 12 h/semana**.
- [ ] Triples hasta **4 h/semana** de excedente.
- [ ] **Tope de 12 h diarias** entre ordinaria y extra.
- [ ] Bloqueo o alerta de HE para **menores de 18 años** (requiere guardar la fecha de nacimiento).
- [ ] Prima dominical (25% o más) y descanso u día festivo trabajado (doble adicional).
- [ ] Un día de descanso por cada 6 trabajados.
- [ ] Incidencias con catálogo que se pueda mapear a CONTPAQi y Aspel NOI.
- [ ] Alertas de jornada excesiva (**NOM-035**) y reporte de evidencia.

**Conservación (arts. 784, 804 y 805, CFF y LSS)**
- [ ] Retención **de 5 años o más tras la baja** por defecto (la LFT pide un año durante la relación más uno después; las reglas fiscales y del IMSS, 5 años), configurable por cuenta.
- [ ] Baja lógica (soft delete) sin borrado físico durante el periodo de retención.
- [ ] Respetar al mismo tiempo los derechos ARCO de cancelación: **bloquear** los datos en lugar de borrarlos mientras exista una obligación legal.

**Datos personales (LFPDPPP 2025)**
- [ ] **Aviso de privacidad** por cuenta (el patrón es el responsable y nosotros el **encargado**) con plantilla que identifique **los datos sensibles (biometría)**, la **geolocalización**, las finalidades, las transferencias y los derechos ARCO. El empleado lo acepta al darse de alta por invitación.
- [ ] **Consentimiento expreso y por escrito con firma electrónica o autenticación** antes de enrolar el rostro o la huella. Guardar evidencia (versión del aviso, hora, IP y dispositivo). Ofrecer **un método alternativo no biométrico** si el empleado no consiente (proporcionalidad).
- [ ] **Geolocalización mínima:** solo en el momento de marcar, nunca seguimiento continuo, e informarlo en la app (patrón de Humand y Sesame).
- [ ] Plantillas biométricas cifradas, sin guardar la imagen cruda si se puede evitar, y separadas de los datos de identidad.
- [ ] **Contrato de encargo** (DPA) entre la plataforma y cada cuenta; registro de transferencias (nube fuera de México).
- [ ] Portal o proceso de **derechos ARCO** y de revocación del consentimiento.
- [ ] Medidas de seguridad y bitácora de accesos. Aislamiento estricto entre cuentas (multi-tenant por `accountId`).

**Geocercas (buena práctica, siguiendo a Chile)**
- [ ] Modo por cuenta: **"alertar y aprobar"** por defecto en lugar de **"bloquear"**. Guardar distancia y precisión del GPS en cada marca.

**Si vendemos en España**
- [ ] Registro diario de inicio y fin, conservación de 4 años, acceso para la representación de los trabajadores y la Inspección.
- [ ] Prepararse para el Real Decreto digital: inalterable, acceso remoto, separación de horas ordinarias y extraordinarias.

**Si vendemos en Chile**
- [ ] **Certificación previa de la DT** según la Res. Ex. 38.
- [ ] Comprobante por cada marca (correo o PDF con geoposición).
- [ ] Hash y log de auditoría.
- [ ] Prohibido bloquear marcas.
- [ ] Conservar posicionamiento 5 años.
- [ ] Recertificación cada 2 años.

---

## 7. Fuentes consultadas

Todas vistas a través de los resultados de WebSearch; WebFetch no estaba disponible.

**Legal México: reforma LFT y registro electrónico**
1. https://www.diputados.gob.mx/LeyesBiblio/ref/lft/LFT_ref52_01may26.pdf
2. https://www.diputados.gob.mx/LeyesBiblio/legis/reflxvi/096_LFT_01may26.doc
3. https://dof.gob.mx/nota_detalle_popup.php?codigo=5786537
4. https://factorial.mx/blog/reloj-checador-digital/
5. https://www.fiscoclic.mx/jornada-laboral/guia-de-cumplimiento-reforma-40-horas.html
6. https://www.fiscoclic.mx/jornada-laboral/ley-jornada-laboral-mexico.html
7. https://www.fiscoclic.mx/jornada-laboral/
8. https://puentelibre.mx/nacional/40-horas-ley-federal-del-trabajo-registro-electronico-1-mayo-2026/
9. https://congenius.com.mx/noticias/reforma-lft-jornada-40-horas-registro-electronico/
10. https://www.gtlaw.com/en/insights/2026/5/reforma-a-la-ley-federal-del-trabajo---reduccion
11. https://www.dlvmr.com.mx/blog/reforma-a-la-jornada-laboral-analisis-de-los-nuevos-articulos-58-59-66-68-y-132-de-la-ley-federal-del-trabajo-de85s
12. https://zktecotiendaoficial.com/blog/registro-electronico-de-jornada-en-mexico-que-establece-la-lft-y-que-falta-definir/
13. https://auxiliarrh.control2000.com.mx/reloj-checador-ley-2027.html
14. https://www.timemark.com/es/blog/reloj-checador-obligatorio-2027-mexico
15. https://www.diariodemorelos.com/noticias/registro-electronico-jornada-laboral-en-mexico-cambia-1-enero-2027
16. https://www.excelsior.com.mx/nacional/registro-electronico-jornada-esperar-reglas-stps-puede-salir-caro
17. https://externalia.com/en/registro-electronico-jornada-laboral-mexico-2027/
18. https://www.elcontribuyente.mx/2026/04/horas-extra-al-triple-la-regla-que-la-reforma-no-dejo-clara/
19. https://360remoto.com.mx/blog/horas-extras-reforma-lft-2026-articulos-66-68/
20. https://solucionesmigura.com/blog/horas-extras-ley-federal-del-trabajo/
21. https://cpsmexico.com/todo-lo-que-necesitas-saber-sobre-la-reforma-a-la-lft-2026/
22. https://www.workaxle.com/es/blog/horas-extra-mexico-2027
23. https://www.ey.com/content/dam/ey-unified-site/ey-com/es-mx/technical/tax/documents/ey-law-flash-reduccion-jornada-laboral.pdf
24. https://www.elimparcial.com/mexico/2026/07/18/con-la-aplicacion-de-la-reforma-laboral-de-las-40-horas-mexico-reducira-el-turno-nocturno-a-35-horas-semanales-para-2030-aunque-la-ley-ya-conserva-el-limite-diario-de-7-horas-sin-afectar-sueldos/
25. https://idconline.mx/laboral/2026/04/23/reduccion-de-la-jornada-laboral-asi-operarian-los-nuevos-turnos-de-trabajo
26. https://www.cegid.com/lat/mx/nueva-reforma-laboral-mexico/registro-electronico-de-jornada-laboral/
27. https://kpmg.com/mx/es/tendencias/2025/12/flash-reforma-de-las-40-horas-y-salario-minimo-2026.html

**Legal México: prueba, conservación y NOM-035**
28. https://mley.mx/LFT/articulo/804/
29. https://mley.mx/LFT/articulo/784/
30. https://www.elcontribuyente.mx/2025/08/guia-de-documentos-laborales-para-el-patron-contratos-nominas-y-mas/
31. https://www.elcontribuyente.mx/2025/07/no-tires-tu-nomina-sat-e-imss-obligan-a-guardar-documentos-hasta-10-anos/
32. https://idconline.mx/laboral/2020/09/08/que-documentos-que-debe-conservar-el-patron
33. https://www.internet2.scjn.gob.mx/red2/comunicados/comunicado.asp?id=7001
34. https://www.littler.com/es/news-analysis/asap/mexico-nueva-norma-oficial-mexicana-para-prevenir-y-abordar-factores-de-riesgo
35. https://contadormx.com/nom-035-stps-2018-a-quien-aplica-y-como-cumplir-con-la-norma-mexicana/

**Legal México: LFPDPPP 2025**
36. https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp.htm
37. https://basham.com.mx/en/nueva-ley-federal-de-proteccion-de-datos-personales-en-posesion-de-los-particulares-publicada-en-el-diario-oficial-de-la-federacion/
38. https://www.legiscope.com/blog/aviso-privacidad-mexico-lfpdppp.html
39. https://www.legiscope.com/blog/lfpdppp-mexico-guia-cumplimiento.html
40. https://idconline.mx/corporativo/2025/03/28/lfpdppp-5-cambios-clave-en-el-manejo-de-datos-personales
41. https://kyc-systems.com/blog/lfpdppp
42. https://www.piranirisk.com/es/hub-regulatorio/lfpdppp-ley-proteccion-datos-mexico
43. https://sharkit.mx/nueva-lfpdppp-reglamento-pendiente/
44. https://smpslegal.com/nueva-ley-federal-de-proteccion-de-datos-personales-enposesion-de-los-particulares/
45. https://www.xataka.com.mx/seguridad/liga-mx-debera-conseguir-escrito-consentimiento-todos-a-quienes-se-les-tome-reconocimiento-facial-estadios-mexico-inai

**Legal España**
46. https://www.sage.com/es-es/blog/diccionario-empresarial/control-horario/
47. https://www.cuestioneslaborales.es/obligatoriedad-registro-jornada-trabajo/
48. https://www.legaltoday.com/practica-juridica/derecho-social-laboral/laboral/fichar-firmando-en-un-papel-no-es-valido-como-registro-de-la-jornada-2022-04-25/
49. https://www.protime.eu/es-es/noticias/registro-horario-digital-obligatorio-2026
50. https://kronjop.com/es/newsroom/control-horario/digital/obligatorio/
51. https://fichme.com/noticias/registro-horario-digital-ultima-hora
52. https://www.registrahora.es/noticias/registro-horario-digital-aplazado-septiembre-2026
53. https://jornalo.es/blog/ley-fichaje-digital-boe/
54. https://controllaboral.es/registro-horario-digital-obligatorio/

**Legal Chile**
55. https://vlex.cl/vid/resolucion-exenta-numero-38-1034788341
56. https://www.dt.gob.cl/legislacion/1624/w3-article-128566.html (Ord. 751)
57. https://www.dt.gob.cl/legislacion/1611/w3-article-129789.html (Rankmi, ORD. 433)
58. https://www.dt.gob.cl/legislacion/1611/w3-article-129731.html (geolocalización y no bloqueo)
59. https://www.dt.gob.cl/legislacion/1611/w3-article-116058.html (Talana, 2017)
60. https://www.geovictoria.com/es-cl/blog/resolucion-exenta-38-en-que-consiste/
61. https://info.buk.cl/guia-resolucion-38-exenta-sobre-sistemas-electronicos-de-registros-de-asistencia
62. https://blog.nubox.com/empresas/control-de-asistencia-laboral-con-gps

**Productos**
63. https://assets.sesamehr.com/hubfs/Manuales%20de%20uso/HR%20CONFIGURACI%C3%93N%20DE%20DISPOSITIVOS.pdf
64. https://assets.sesamehr.com/hubfs/ES%20-%20Sesame%20HR%20-%20%20Owner%20-%20Sesame%20WhatsApp-1.pdf
65. https://www.capterra.com/p/143413/SesameHR/reviews/
66. https://softabase.com/software/hr/sesame-hr
67. https://www.comparasoftware.com/sesame-hr
68. https://factorial.mx/control-asistencia
69. https://factorial.mx/funcionalidades
70. https://factorial.mx/integracion-contpaqi-factorial
71. https://jibble.io/es/resenas/factorial
72. https://www.geovictoria.com/es-mx/
73. https://www.geovictoria.com/es-mx/servicios/control-de-asistencia/
74. https://www.geovictoria.com/es-mx/blog/leyes-de-asistencia-en-mexico-lo-que-deben-saber-las-empresas
75. https://www.buk.mx/asistencia
76. https://www.buk.mx/control-de-asistencia-laboral
77. https://www.buk.mx/blog/reloj-checador-reforma-laboral
78. https://www.buk.co/precios
79. https://supportcenter.buk.cl/hc/es-419/articles/41821157229467-Reporte-de-Asistencia-por-ubicaci%C3%B3n
80. https://runahr.com/co/asistencias/
81. https://runahr.com/mx/integraciones/control-id/
82. https://runahr.com/en/integraciones/contpaqi/
83. https://www.capterra.es/software/195463/worky
84. https://landing.worky.mx/hubfs/%5BContent%5D%20Referrals/%5BOP%7CGeneral%5D%20Worky%202023.pdf
85. https://help.humand.co/hc/en-us/articles/31011880190099-Geolocation-security-and-privacy
86. https://help.humand.co/hc/en-us/articles/34205288663315-How-do-I-view-and-edit-employees-time-records
87. https://web.talana.com/productos/asistencia-y-turnos
88. https://web.talana.com/software-rrhh-transporte
89. https://www.guiaminera.cl/startups-chilenas-de-rr-hh-cierran-alianza-que-sumara-500-mil-nuevos-colaboradores-a-fines-de-2023/
90. https://runahr.com/cl/recursos/recursos-humanos/mejores-software-de-recursos-humanos-en-chile/
91. https://www.zkteco.com/en/ZKBioTimeMobileAPP
92. https://alas-la.org/wp-content/uploads/2025/02/BioTime-Cloud-2.0-Brochure-1_compressed-1.pdf
93. https://syscom.mx/blog/gestion-de-asistencia-en-la-nube-biotime-cloud-2-0
94. https://cdn.document360.io/0b8a1602-1fb0-4465-a168-a93a81974a0b/Images/Documentation/Manual_App%20M%C3%B3vil%20y%20Geo%20Cerca.pdf
95. https://anviz.com/product/118.html
96. https://support.anviz.com/hc/en-us/articles/45737200923929-CrossChex-Cloud-Subscription-s-FAQ-List
97. https://www.hikvision.com/sg/products/software/HikCentral-Professional-series/hikcentral-access-control
98. https://www.Hikvision.com/content/dam/hikvision/en/brochures-download/product-brochures/Brochure---MinMoe-Face-Recognition-Terminals.pdf
99. https://www.adiglobaldistribution.co.uk/Product/401000023
100. https://www.appvizer.es/recursos-humanos/control-horario-empleados/bizneo-gestion-del-tiempo
101. https://www.rankia.com/foros/empresas/temas/7373620-mejores-software-control-horario-espana-2026-comparativa-real-precios?page=1
102. https://www.jibble.io/es/resenas/woffu
103. https://turnozo.com/es/cambiar-de-woffu
104. https://factorial.es/blog/alternativas-endalia-soluciones/
105. https://simplify.jobs/c/Grupo-Tress
106. https://www.comparasoftware.com/kit-consultores
107. https://www.aspel.com.mx/assets/aspelcom/images/productos/noi-asistente/ficha-tecnica-noi-asistente.pdf
108. https://www.aspel.com.mx/assets/aspelcom/images/productos/noi-asistente/folleto-noi-asistente.pdf
109. https://www.siigo.com/mx/prueba-gratis-noi-asistente-aspel/
110. https://cloud.mi.contpaqi.com/personia
111. https://syscom.mx/blog/integracion-de-relojes-checadores-con-la-nomina-acceso-3-titanium
112. https://www.control2000.com.mx/productos/folletos/CH.pdf
113. https://checkrh.com/CHECKRH_FichaTecnica_ES.pdf
114. https://checkrh.com/CHECKRH.pdf
115. https://www.jibble.io/es/aplicacion-quisco-para-fichar
116. https://www.jibble.io/es/ayuda/anadir-o-invitar-miembros-del-equipo
117. https://help.jibble.io/subscription-plans/what-are-the-different-subscription-plans
118. https://www.actitime.com/software-collections/jibble-pricing
119. https://clockify.me/es/funciones-adicionales
120. https://clockify.me/help/es/administration/subscription-plans
121. https://apps.apple.com/mx/app/facture-app-reloj-checador/id6445899984
122. https://apps.apple.com/mx/app/kronio/id1522808314
123. https://apps.apple.com/mx/app/id1634489594 (ARI)
124. https://apps.apple.com/mx/app/pdc2-0/id6736370050 (ControlRoll)
125. https://www.shoplworks.com/es/help-center/help-center-admin/lang-es-register-members
126. https://combohr.com/es/blog/precio-reloj-de-control

**KPIs**
127. https://web.talana.com/es-pe/blog/kpis-rrhh-peru-indicadores-clave-para-medir-la-gestion
128. https://factorial.mx/blog/tasa-ausentismo/
129. https://www.rosterelf.com/nz/blog/attendance-kpi-review
130. https://www.shiftflow.app/es/free-tools/free-absence-percentage-calculator
131. https://blog.nubox.com/empresas/kpi-recursos-humanos
