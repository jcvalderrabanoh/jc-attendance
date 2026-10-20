# 06 · Cumplimiento legal

> Fuentes y detalle: [anexo B](investigacion/B-latam-mexico-legal.md) §2.
> Corte de la investigación: 20-oct-2026. Lo marcado [NV] requiere revisión
> jurídica antes de venderse como "cumplimiento garantizado".

## México: Ley Federal del Trabajo (reforma DOF 1-may-2026)

| Tema | Regla | Impacto en producto |
|---|---|---|
| Registro electrónico (art. 132 fr. XXXIV) | El patrón registra electrónicamente el inicio y fin de la jornada de cada trabajador y lo entrega a la autoridad si lo pide. Multa de 250 a 5,000 UMA (art. 994 fr. IV Bis). Las disposiciones generales de la STPS entran en vigor el **1-ene-2027**; al 14-oct-2026 no estaban publicadas [NV]. | Marcajes inmutables con hora del servidor, reporte para la autoridad, acceso de inspector de solo lectura y parámetros configurables para cuando salgan las disposiciones. |
| Jornada semanal | 48 h en 2026 → 46 h (2027) → 44 h (2028) → 42 h (2029) → 40 h (2030). Los máximos diarios no cambian: diurna 8 h, nocturna 7 h, mixta 7.5 h. | Motor de reglas **versionado por fecha de vigencia**; alerta de turnos que excedan el límite del año. |
| Horas extra (arts. 66–68) | Se pagan dobles hasta el tope semanal: 9 h en 2026–27, 10 en 2028, 11 en 2029 y 12 en 2030 [NV para el calendario]. Lo que excede se paga triple, con un máximo de 4 h semanales. Jornada más extra ≤ 12 h diarias. Prohibidas a menores de 18 años. | Clasificación automática de dobles y triples; bloqueo o alerta para menores y para quien pase de 12 h. |
| Descanso y festivos (arts. 69–75) | 1 día de descanso por cada 6 trabajados. Prima dominical ≥ 25 %. Descanso o festivo trabajado se paga doble, además del salario. | Catálogo de festivos del art. 74 precargado; cálculo de prima dominical y de descanso trabajado. |
| Conservación (arts. 804–805) | Se conservan el último año de la relación y 1 año después; si no se exhiben, se presume cierto lo que diga el trabajador. | Retención por defecto de **5 años** tras la baja (fiscal/IMSS), configurable, con bloqueo en lugar de borrado. |
| NOM-035 | El exceso de jornada es un factor de riesgo psicosocial. | Alertas e informe de exceso de jornada como evidencia. |

## México: nueva LFPDPPP (DOF 20-mar-2025)
- Los datos **biométricos son sensibles** y requieren consentimiento **expreso y por escrito**, que puede darse con firma electrónica o un mecanismo de autenticación.
- El aviso de privacidad (art. 15) debe identificar los datos sensibles.
- La autoridad ahora es la Secretaría Anticorrupción y Buen Gobierno; el INAI desapareció. El reglamento sigue pendiente [NV].
- Multas de 100 a 320,000 UMA.
- No hay un criterio específico sobre geolocalización. Por prudencia, **tomar la ubicación solo al marcar**, nunca rastreo continuo.
- Rol: el patrón es el **responsable** y nosotros somos **encargados**. Hace falta un contrato de encargo en los términos de servicio.

## Referencias
- **España** (RDL 8/2019, art. 34.9 ET): registro diario conservado 4 años. El nuevo RD de registro digital (registro inalterable y acceso remoto de la Inspección) sigue sin publicarse.
- **Chile** (Res. Exenta 38/2024): certificación previa de la DT, registros inalterables con hash, comprobante por marca y 5 años de conservación de la geoposición. **Bloquear la marca por estar fuera de la geocerca es infracción** (Ord. 408, 11-sep-2026). Es referencia útil si se expande a Chile.

## Checklist de requisitos (entra al backlog)
- [ ] L1. Marcaje con `serverAt` (hora del servidor) + `clientAt`; offline marcado como "hora no verificada".
- [ ] L2. Marcajes **append-only**: una corrección es un nuevo registro con autor, motivo y referencia; cadena de hash diaria por cuenta (opcional sello RFC 3161).
- [ ] L3. Reporte "Registro de jornada" PDF/CSV por trabajador y periodo para la autoridad + rol **Inspector** de solo lectura con expiración.
- [ ] L4. El empleado ve y descarga sus propios registros.
- [ ] L5. Motor LFT con vigencia por fecha (jornadas, dobles/triples, 12 h, menores, prima dominical, descanso, festivos).
- [ ] L6. Alertas de exceso de jornada (NOM-035).
- [ ] L7. Retención configurable, 5 años por defecto; bloqueo en lugar de borrado.
- [ ] L8. Aviso de privacidad por cuenta que identifique biometría y geolocalización; contrato de encargado.
- [ ] L9. Consentimiento biométrico expreso con evidencia (fecha, IP, versión) y **alternativa no biométrica** (PIN/QR).
- [ ] L10. Ubicación solo al marcar.
- [ ] L11. Geocerca en modo **alertar y aprobar** por defecto; bloquear es opcional y la cuenta lo elige.
- [ ] L12. Derechos ARCO (acceso, rectificación, cancelación, oposición) y aislamiento estricto por cuenta.
- [ ] L13. Monitorear el DOF para las disposiciones de la STPS (tarea recurrente) y ajustar parámetros.
