# @jc-attendance/rules-engine

Motor de cálculo de jornada (LFT México, reforma DOF 1-may-2026) y validadores
de alta. **TypeScript puro, sin dependencias en runtime**: las zonas horarias se
resuelven con `Intl.DateTimeFormat` (incluye horario de verano).

Diseño y reglas: `docs/05-reglas-y-validaciones.md` §2–3 y
`docs/06-cumplimiento-legal.md`.

```bash
npm run typecheck   # tsc --noEmit -p tsconfig.json (incluye los specs)
npm test            # jest
npm run build       # tsc -p tsconfig.build.json → dist/
```

## API

| Export | Qué hace |
|---|---|
| `calculateWorkday(input)` | Un día laboral → `WorkdayResult` (trabajado, descanso, nocturnos, retardo, salida anticipada, extra diaria bruta, estado, incidencias). |
| `calculateWeekOvertime(workdays, lft, { isMinor, mode? })` | Clasifica la extra de la semana en dobles/triples; alerta si las triples pasan de 4 h; menores → 0 y alerta. |
| `specialDayPay(workday, flags)` | Minutos de festivo / descanso trabajado y si aplica prima dominical. |
| `workdayDateFor(instant, shift, timeZone)` | Día laboral de un marcaje (el día en que empieza el turno). |
| `LFT_VERSIONS`, `resolveLftVersion(date)` | Límite semanal 48→40 h (2026–2030) y topes de extra por fecha de vigencia. |
| `DAILY_MAX`, `DAILY_MAX_MINUTES`, `classifyJornada(start, end)` | Jornada diurna 8 h / nocturna 7 h / mixta 7.5 h (ventana nocturna 20:00–06:00, umbral 3.5 h). |
| `MEXICO_HOLIDAYS(year)`, `isMexicoHoliday(date)` | Festivos del art. 74. |
| `isValidCurp`, `curpBirthDate`, `curpCheckDigit` | CURP: estructura, fecha real y dígito verificador. |
| `isValidRfc(rfc, { kind?, verifyCheckDigit? })`, `rfcKind`, `rfcCheckDigit` | RFC física (13) / moral (12); dígito mod 11 opcional. |
| `isValidNss`, `nssCheckDigit` | NSS IMSS: 11 dígitos con verificador Luhn. |
| `normalizePhoneE164(raw, defaultCountry = '52')` | Teléfono → E.164 o `null` (quita `044`/`045`/`01` y el `1` de `+521`). |
| `zonedTimeToUtc`, `toZonedParts`, `localDateOf`, `timeZoneOffsetMs`, `addDays` | Utilidades de zona horaria. |

## Decisiones del cálculo

- **Marcas intactas**: tolerancia y redondeo se aplican a los minutos calculados;
  `firstIn`/`lastOut` son siempre las marcas reales.
- **Emparejamiento** por máquina de estados: salida sin entrada, descanso sin
  fin, etc. → `missing_punch`. Sin salida → `incomplete` y no se cuentan
  minutos del tramo abierto. Doble entrada seguida → se ignora la segunda.
- **Marcajes**: `rejected` se ignoran; `pending` se cuentan y se listan en
  `pendingPunchIds`.
- **Descanso no pagado** sin marcas: se descuenta `shift.breakMinutes` si lo
  trabajado es mayor. Si hay marcas de descanso, se descuenta lo marcado.
- **Redondeo** (`roundingMode`/`roundingMinutes`) solo sobre `workedMinutes`
  (y por tanto sobre la extra).
- **Retardo** = `firstIn − scheduledStart − graceIn`. El día pasa a `late` si
  además el retraso desde la hora programada es ≥ `lateThresholdMinutes`.
  Retraso > `absenceAfterMinutes` (si > 0) → `absent`.
- **Salida anticipada** = `scheduledEnd − lastOut − graceOut`.
- **Nocturnos**: minutos reales trabajados entre 20:00 y 06:00 locales.
- **Extra diaria** (`overtimeMinutes`) = trabajado − jornada máxima del tipo.
  Con `overtimeRequiresApproval` se marca `overtimePendingApproval`.
- **Semana**: extra = Σ extra diaria + exceso sobre `weeklyHoursLimit` no
  contado ya (asignado a los últimos días). Dobles hasta el tope del año en
  orden cronológico, luego triples.
- **Día laboral** de turnos que cruzan medianoche: corte en el punto medio del
  tiempo libre (22:00–06:00 → 14:00).
- **Horario de verano**: hora inexistente → se adelanta (02:30 → 03:30); hora
  repetida → primera ocurrencia.
