# 01 · Investigación de mercado (síntesis)

**Alcance:** 57 productos analizados (31 globales/EE. UU./UE + 26 LatAm/México/
España) y 401 URLs de 252 dominios (ver [09 · Fuentes](09-fuentes.md)). Anexos
completos con ficha por producto:
[A · Benchmark global](investigacion/A-benchmark-global.md) ·
[B · LatAm, México y marco legal](investigacion/B-latam-mexico-legal.md) ·
[C · Técnica, UX y Stitch](investigacion/C-tecnica-ux-stitch.md).

## 1. Productos analizados

| Segmento | Productos |
|---|---|
| Relojes checadores PyME (EE. UU.) | Deputy, When I Work, Homebase, Connecteam, Clockify, Jibble, Buddy Punch, QuickBooks Time, ClockShark, Hubstaff, TimeCamp, 7shifts, Sling, Timeero |
| Seguimiento de tiempo por proyecto | Toggl Track, Harvest, Everhour |
| Suites HCM / nómina | Rippling, Gusto, ADP Workforce Now, UKG Ready/Pro, Paycom, Paychex Flex, Workday, Replicon |
| Europa | Factorial, Personio, Kenjo, Bizneo, Woffu, Calamari, Sesame, Endalia |
| LatAm suites | GeoVictoria, Buk, Runa, Worky, Humand, Talana, Rankmi, Tress |
| México nómina/checador | Aspel NOI Asistente, CONTPAQi, CheckRH, Control2000, Acceso 3 TITANIUM, Facture App, Kronio/ARI |
| Hardware + nube | ZKTeco BioTime, Anviz CrossChex, Hikvision HikCentral |

## 2. Qué ofrece el mercado

**Lo que todos tienen (table stakes, > 75 %):**
- Marcaje desde la app móvil y la web.
- GPS en cada marcaje y geocerca, que en EE. UU. suele cobrarse en plan medio o alto.
- Kiosco con PIN.
- Aprobación de hojas de horas.
- Horas extra.
- Exportación a nómina o CSV.
- Invitación por SMS o email.
- Turnos.
- Recordatorios de descanso.

En México además es imprescindible la exportación a **CONTPAQi** y **Aspel NOI**.

**Diferenciadores (pocos los tienen):**

| Función | Quién | Frecuencia |
|---|---|---|
| Liga de alta con **aprobación** y campos obligatorios/extra | Connecteam | raro |
| Un empleado en **varias organizaciones** con selector | Jibble | raro |
| Facial con **liveness** | Jibble | ~5 % |
| Marcaje fuera de zona → **solicitud de aprobación** en vez de bloqueo | Connecteam, Personio | raro |
| QR dinámico | Sesame, Kenjo, Factorial | ~30 % (UE) |
| Offline | Jibble, ClockShark, Runa | ~25 % |
| Marcar por WhatsApp | CheckRH, Sesame, Factorial | ~15 % |
| Costo laboral vs. ventas | Deputy, 7shifts, Sling | nicho |
| Mapa de calor por sucursal + PDF firmable | Talana | nicho |
| Alertas de horas extra no autorizadas | Buk | nicho |

**Hueco detectado:** ningún producto de LatAm encontrado combina **liga de alta
+ reglas de validación automáticas (CURP/RFC/NSS, duplicados) + cola de
aprobación + campos personalizados que alimentan gráficos**. Ese es el
posicionamiento propuesto.

## 3. KPIs que muestran los competidores
1. Horas trabajadas por empleado, sucursal y departamento.
2. Horas programadas vs. reales.
3. Horas extra: horas, %, dobles/triples y no autorizadas.
4. Saldo de horas contra la jornada.
5. Ausentismo, planificado y no planificado.
6. Puntualidad, retardos y minutos acumulados.
7. Salidas anticipadas.
8. Inasistencias a turno (no-shows).
9. Marcas faltantes.
10. Cumplimiento de descansos.
11. Marcajes fuera de geocerca o sospechosos.
12. Marcajes editados a mano.
13. Quién está dentro ahora.
14. Patrones por día y hora (mapa de calor).
15. Costo laboral y su % sobre ventas.
16. Saldo de vacaciones.
17. Exceso de jornada (evidencia para la NOM-035).

## 4. Precios de referencia (2026, mayormente fuentes secundarias [NV])

| Modelo | Ejemplos | Rango |
|---|---|---|
| Por usuario/mes | Deputy, Jibble, Clockify, Factorial, Sesame, Worky | 2–10 USD (mediana 5–6); Worky $79–99 MXN |
| Base + usuario | QuickBooks Time, ClockShark, Buddy Punch | 19–60 USD base + 5–14 USD |
| Por ubicación | Homebase, 7shifts | 30–150 USD/ubicación |
| Plana por tramo | Connecteam | 29–119 USD hasta 30 usuarios |
| Freemium ilimitado | Jibble, Aspel NOI Asistente (1–5) | 0 |
| Suite HCM | UKG, Paycom, Workday | 12–42 USD/empleado |

**Propuesta para nosotros:**
- **$25–60 MXN por empleado activo al mes.**
- Plan gratis hasta 5–10 empleados.
- Add-ons: WhatsApp, biometría y analítica avanzada. La analítica es lo que Deputy cobra aparte, a 1.50 USD.

## 5. Conclusiones que guían el producto
1. **Cumplimiento legal como motor de venta.** La reforma a la LFT (DOF 1-may-2026) obliga a llevar un **registro electrónico de jornada**. Las disposiciones de la STPS entran en vigor el 1-ene-2027. Ver [06 · Cumplimiento legal](06-cumplimiento-legal.md).
2. **El alta por liga con validación es el diferenciador central.**
3. **Antifraude por puntaje de riesgo, no por bloqueo.** Un marcaje dudoso va a revisión. Chile incluso sanciona impedir el marcaje por geocerca.
4. **Multicuenta en ambos lados.** Un patrón puede administrar varias cuentas (ya lo resuelve jc-core) y un empleado puede trabajar para varios patrones.
5. **Analítica sobre campos personalizados**, sin add-on extra en el plan medio.
6. **Exportar a CONTPAQi/Aspel NOI desde el MVP.**
