# 05 · Reglas y validaciones

Siguen la arquitectura por capas de jc-core: **checkers** = validación de
input y reglas simples; **rules** = reglas que cruzan entidades; resultado
`CheckRulesAndProcessInterfaceResult<T>`.

## 1. Validación del alta por liga (`onboarding_rules`, configurable por cuenta)

| Regla (`ruleKey`) | Qué valida | Capa | Severidad por defecto |
|---|---|---|---|
| `invitation_valid` | Token existe (hash), no vencido, `usesCount < maxUses` (canje atómico `UPDATE … WHERE usesCount < maxUses RETURNING`), no revocado | checker | block (fija) |
| `phone_verified` | OTP del teléfono validado | checker | block (fija) |
| `phone_format` / `email_format` | E.164 / RFC 5322; normalizados | checker | block |
| `email_domain` | Dominio en `allowedEmailDomains` de la liga | checker | block |
| `curp_format` | 18 caracteres, estructura oficial y **dígito verificador** (mod 10) | checker | block |
| `rfc_format` | 12/13 caracteres, homoclave | checker | warn |
| `nss_format` | 11 dígitos, dígito verificador (Luhn) | checker | warn |
| `curp_rfc_consistency` | Fecha de nacimiento y nombre coinciden entre CURP y RFC | rule | warn |
| `min_age` | Edad ≥ 18 por defecto (≥ 15 con restricciones LFT si la cuenta lo habilita; menores marcados → sin horas extra) | rule | block |
| `unique_in_account` | CURP / teléfono / email / número de empleado no repetidos en la cuenta | rule | block |
| `existing_identity` | La identidad ya existe en otra cuenta → se **vincula**, no se duplica (multicuenta) | rule | info |
| `required_fields` | Campos obligatorios de la liga y de los campos personalizados | checker | block |
| `custom_field_validation` | Regex, mínimo/máximo, opciones válidas según la definición | checker | block |
| `document_required` | INE/comprobante subidos si la cuenta lo exige | rule | block |
| `duplicate_face` | Selfie de alta no coincide con otra identidad de la cuenta (F2, requiere consentimiento biométrico) | rule | warn |
| `consents_accepted` | Aviso de privacidad aceptado; consentimientos de geolocalización/biometría si la política los exige | checker | block |
| `custom_regex` | Regla libre de la cuenta sobre un campo | checker | configurable |

**Resultado:**
- Si alguna regla con severidad `block` falla, se rechaza al instante y se le dice al empleado qué corregir.
- Si alguna regla con severidad `warn` falla, el alta va a la cola con el riesgo resaltado.
- Si todo pasa y la liga no exige revisión, la aprobación es automática.

En todos los casos se guarda `validationResults` para auditoría.

## 2. Validación del marcaje

| Regla | Detalle | Resultado si falla |
|---|---|---|
| `employment_active` | Empleo aprobado y activo, dentro de fecha de alta | block |
| `sequence` | No hay dos entradas seguidas ni una salida sin entrada (con tolerancia; se sugiere el tipo correcto) | block / sugerencia |
| `debounce` | Ignora el doble toque < 60 s (idempotencia por `Idempotency-Key`) | dedupe |
| `shift_window` | Entrada no antes de X min del turno (ref. Homebase/7shifts) | configurable block/flag |
| `geofence` | Distancia ≤ radio + margen; polígono con `ST_Covers` | **flag + revisión** (default), block opcional |
| `gps_accuracy` | `accuracy ≤ minAccuracyMeters` (precisión al 68 %) | flag |
| `qr_valid` | QR TOTP vigente, de ese kiosco, no usado | block |
| `selfie_required` / `face_match` / `liveness` | Según política y consentimiento | flag |
| `device_trusted` | Dispositivo conocido; nuevo → flag | flag |
| `offline_age` | Offline > `maxOfflineHours` → "hora no verificada" | flag |
| `ip_allowed` | Para marcaje web | block/flag |
| `minor_overtime` | Menor de 18 años no puede generar horas extra | alerta + bloqueo de extra |
| `daily_limit` | Jornada + extra > 12 h | alerta (NOM-035) |

## 3. Motor de cálculo de jornada (`libs/rules-engine`)

**Entrada:**
- Los marcajes del día laboral.
- El turno asignado.
- La política efectiva.
- El calendario de festivos.
- La **versión legal vigente** a la fecha: tabla `lft_versions`, con el límite semanal y los topes de horas extra por año.

**Pasos:**
1. **Día laboral:** se calcula con la hora de inicio del turno en la zona IANA de la sucursal (`AT TIME ZONE`). Un turno de 22:00 a 06:00 pertenece al día en que empieza.
2. **Emparejar marcajes:** entrada/salida y descansos. Si falta una marca, se crea la incidencia `missing_punch`.
3. **Tolerancia y redondeo:** se aplican al valor calculado; la marca real se conserva siempre.
4. **Minutos:**
   - Trabajados.
   - Descanso: se descuenta si no es pagado.
   - Nocturnos: entre las 20:00 y las 06:00.
   - Tipo de jornada: diurna, nocturna o mixta (mixta si la parte nocturna dura menos de 3.5 h).
5. **Retardo:** `firstIn − scheduledStart − tolerancia` > 0. Pasado el umbral de falta → `absent`.
6. **Horas extra (modo LFT):**
   - Exceso sobre la jornada diaria del tipo de turno.
   - Se acumula por semana.
   - Dobles hasta el tope del año.
   - Lo que pasa del tope son triples (máximo 4 h a la semana; alerta si se excede).
   - Si la política exige aprobación, el tiempo extra queda "pendiente" hasta que se aprueba.
7. **Día especial:** festivo o descanso trabajado se paga doble; el domingo lleva prima dominical.
8. **Resultado:** se guarda `workdays` con `calcVersion`, lo que permite recalcular un periodo si cambia la política mientras no esté cerrado.

**Pruebas:** tablas de casos por cada regla, incluidos el cruce de medianoche, el cambio de horario de verano, 2026 frente a 2027 (48 → 46 h), menores de edad y festivos.

## 4. Validación de campos personalizados
Por cada definición se genera un JSON Schema. El checker valida `customFields` al crear o actualizar. Las reglas:
- Una `key` no puede cambiar si ya tiene valores.
- Borrar un campo es soft delete: los valores se conservan para el histórico.
- El tipo `select` solo acepta opciones activas.
