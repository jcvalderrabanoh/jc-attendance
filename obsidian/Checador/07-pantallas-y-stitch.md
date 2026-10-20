---
proyecto: Checador
fuente: jc-attendance/docs/07-pantallas-y-stitch.md
sincronizado: 2026-10-20
tags: [checador, asistencia]
---

# 07 · Pantallas y propuesta en Stitch

Cada pantalla tiene: ruta, quién la usa, propósito, contenido y el **prompt
listo para Google Stitch** (stitch.withgoogle.com). Flujo acordado: al
construir cada pantalla se genera su propuesta en Stitch con este prompt, se
revisa, se exporta (HTML/Figma) y se enlaza aquí en la columna «Stitch».

**Prefijo común para todos los prompts (pegar antes de cada uno):**

> Diseña una pantalla para "Checador", un SaaS de control de asistencia para
> PyMEs en México. Estilo: Material 3, limpio, profesional, color primario azul
> petróleo (#0F4C5C), acento ámbar (#F2A541) para alertas, verde (#2E7D32) para
> "a tiempo", rojo (#C62828) para faltas. Tipografía Inter. Textos en español de
> México. Accesible (contraste AA, objetivos táctiles ≥ 48 px).

## A. App del empleado (PWA móvil)

| # | Ruta | Pantalla | Propósito | Stitch |
|---|---|---|---|---|
| A1 | `/unirse/:token` | Alta por liga | Registro del empleado desde la invitación | — |
| A2 | `/entrar` | Acceso por OTP | Teléfono/email → código WhatsApp/SMS | — |
| A3 | `/cuentas` | Selector de patrón | Empleado que trabaja para varias cuentas | — |
| A4 | `/` | Checar | Botón único de entrada/salida, estado y ubicación | — |
| A5 | `/checar/confirmar` | Verificación | Selfie / QR / geocerca antes de confirmar | — |
| A6 | `/historial` | Mis registros | Marcajes y horas por día/semana | — |
| A7 | `/solicitudes` | Solicitudes | Permisos, vacaciones, corrección de marcaje | — |
| A8 | `/perfil` | Mi perfil | Datos, campos personalizados editables, consentimientos | — |

**Prompts:**
- **A1** — Pantalla móvil de registro por invitación. Encabezado con logo y nombre de la empresa que invita ("Te invitó Panadería La Espiga"). Formulario por pasos (stepper de 3): 1) nombre, apellidos, teléfono WhatsApp, email opcional; 2) datos laborales: CURP, RFC, NSS y campos personalizados de la empresa (un select "Talla de uniforme", un campo fecha); 3) aviso de privacidad con casillas separadas para consentir geolocalización y biometría, y subir foto de INE. Botón "Enviar para validación". Mensaje final: "Tu alta está en revisión".
- **A2** — Login móvil sin contraseña: campo de teléfono con prefijo +52, botón "Enviarme código por WhatsApp", enlace "Usar email". Segunda vista con 6 casillas de código OTP y temporizador de reenvío.
- **A3** — Lista de empresas donde trabaja el empleado, cada tarjeta con logo, nombre, sucursal y estado de hoy ("Entrada 08:58"). Opción de fijar la predeterminada.
- **A4** — Pantalla principal móvil: saludo, reloj grande con hora actual, botón circular gigante "Registrar entrada" (cambia a "Registrar salida" en rojo cuando está dentro), chip de ubicación "Sucursal Centro · dentro de la geocerca", contador de horas trabajadas hoy en vivo, turno de hoy (08:00–17:00) y mini resumen de la semana (barras por día). Banner discreto "Sin conexión: se enviará al reconectar".
- **A5** — Verificación de marcaje: vista de cámara frontal con óvalo guía para selfie y texto "Parpadea para verificar", mini mapa con círculo de geocerca y punto del usuario, alternativa "Escanear QR del kiosco". Botón confirmar.
- **A6** — Historial: selector de semana, total de horas vs. objetivo con barra de progreso, lista por día con entrada/salida, horas, etiquetas "Retardo", "Hora extra", "Pendiente de revisión".
- **A7** — Solicitudes: pestañas Pendientes/Resueltas, botón flotante "Nueva solicitud" con tipos (Vacaciones, Permiso, Incapacidad, Corregir marcaje), saldo de días de vacaciones visible.
- **A8** — Perfil: foto, datos personales, campos personalizados, sección "Privacidad" con interruptores de consentimientos y enlace a aviso de privacidad, "Cerrar sesión".

## B. Kiosco (tablet en sucursal)

| # | Ruta | Pantalla | Propósito | Stitch |
|---|---|---|---|---|
| B1 | `/kiosco` | Kiosco | QR rotativo + checado por rostro/PIN | — |
| B2 | `/kiosco/activar` | Activar kiosco | Vincular tablet a sucursal con código | — |

- **B1** — Pantalla horizontal de tablet: a la izquierda QR grande que se renueva cada 30 s con barra de tiempo; a la derecha cámara para reconocimiento facial y teclado numérico para PIN. Arriba nombre de la sucursal y reloj. Al checar, tarjeta de confirmación con foto, nombre y "Entrada registrada 08:57 · A tiempo".
- **B2** — Activación: campo de código de 8 caracteres generado desde la consola, selección de sucursal, botón "Activar este dispositivo".

## C. Consola del patrón / RH (web)

| # | Ruta | Pantalla | Propósito | Stitch |
|---|---|---|---|---|
| C1 | `/tablero` | Tablero | KPIs de hoy y tendencias | — |
| C2 | `/en-vivo` | Asistencia en vivo | Quién está dentro, por sucursal, en mapa | — |
| C3 | `/empleados` | Empleados | Lista, filtros, alta, importación | — |
| C4 | `/empleados/:id` | Ficha de empleado | Datos, turno, historial, horas, incidencias | — |
| C5 | `/invitaciones` | Ligas de alta | Crear y administrar ligas/QR de registro | — |
| C6 | `/validaciones` | Validación de altas | Cola de solicitudes con resultado de reglas | — |
| C7 | `/marcajes` | Marcajes | Registro, revisión de banderas, corrección | — |
| C8 | `/hojas-de-horas` | Hojas de horas | Jornadas por periodo, aprobación y cierre | — |
| C9 | `/incidencias` | Incidencias y solicitudes | Retardos, faltas, permisos, aprobaciones | — |
| C10 | `/turnos` | Turnos | Calendario de turnos y asignación | — |
| C11 | `/ubicaciones` | Ubicaciones | Sucursales, geocercas en mapa, kioscos | — |
| C12 | `/reportes` | Reportes | Generar PDF/Excel y descargar | — |
| C13 | `/analitica` | Analítica | Gráficos configurables (incluye campos personalizados) | — |
| C14 | `/configuracion/politicas` | Políticas | Tolerancias, redondeo, horas extra | — |
| C15 | `/configuracion/campos` | Campos personalizados | Definir campos | — |
| C16 | `/configuracion/reglas-alta` | Reglas de validación | Reglas de alta por liga | — |
| C17 | `/configuracion/general` | General | Periodos de pago, días festivos, privacidad, marca | — |
| C18 | `/auditoria` | Bitácora | Quién cambió qué | — |

- **C1** — Dashboard web desktop con barra lateral (Tablero, En vivo, Empleados, Marcajes, Hojas de horas, Incidencias, Turnos, Ubicaciones, Reportes, Analítica, Configuración) y selector de cuenta arriba. Fila de 6 tarjetas KPI: Presentes ahora (84/96), Puntualidad hoy 91 %, Ausentismo del mes 3.2 %, Horas extra semana 126 h, Marcajes por revisar 7, Altas pendientes 3. Debajo: gráfico de líneas de asistencia 30 días, mapa de calor de entradas por hora y día, barras de horas extra por sucursal, tabla "Retardos de hoy".
- **C2** — Vista en vivo: mapa con pines por sucursal y contador, lista lateral agrupada por sucursal con avatar, hora de entrada y estado (Dentro, En descanso, Salió, No ha llegado). Filtros por departamento.
- **C3** — Tabla de empleados con búsqueda, filtros (sucursal, departamento, estado, campos personalizados), columnas configurables, acciones masivas, botones "Invitar por liga", "Importar Excel", "Agregar".
- **C4** — Ficha: encabezado con foto y datos, pestañas Resumen (horas del periodo, puntualidad, saldo vacaciones), Asistencia (calendario mensual con colores por estado), Marcajes, Solicitudes, Documentos, Campos personalizados.
- **C5** — Ligas de alta: tabla de ligas con nombre, sucursal/departamento por defecto, usos (12/50), vence, requiere aprobación; diálogo "Nueva liga" con esas opciones; botón copiar liga, mostrar QR y compartir por WhatsApp.
- **C6** — Cola de validación tipo bandeja: lista a la izquierda, detalle a la derecha con datos enviados, documentos, y checklist de reglas con ✓/⚠/✗ (CURP válida, teléfono único, posible duplicado de rostro). Botones Aprobar, Pedir información, Rechazar con motivo.
- **C7** — Tabla de marcajes con filtros por fecha, sucursal, banderas; cada fila muestra selfie miniatura, hora, tipo, distancia a geocerca, chips de riesgo; panel lateral con mapa y foto para aprobar/rechazar; botón "Agregar marcaje manual" con motivo obligatorio.
- **C8** — Hojas de horas: selector de periodo de pago, tabla por empleado con horas normales, extra dobles, extra triples, nocturnas, retardos, faltas, estado de aprobación; botón "Cerrar periodo" y "Exportar prenómina".
- **C9** — Bandeja de incidencias y solicitudes con pestañas, tarjetas con tipo, empleado, fechas, adjuntos, aprobación en un clic y comentario.
- **C10** — Calendario semanal tipo planner: filas empleados, columnas días, bloques de turno de colores arrastrables, plantillas de turno a la izquierda, indicador de horas semanales por persona con alerta si excede 48 h.
- **C11** — Ubicaciones: lista de sucursales y mapa grande donde se dibuja la geocerca (círculo con slider de radio o polígono), sección de kioscos vinculados y restricciones Wi-Fi/IP.
- **C12** — Galería de reportes como tarjetas (Asistencia diaria, Hoja de horas por empleado, Horas extra, Incidencias, Prenómina, Puntualidad por sucursal), cada una con filtros y formato PDF/Excel; tabla de reportes generados con estado y descarga.
- **C13** — Constructor de gráficos: elegir métrica (horas, retardos, faltas, horas extra), dimensión (sucursal, departamento, campo personalizado, día de la semana), tipo de gráfico y periodo; vista previa grande; guardar en tablero.
- **C14** — Formulario de política: tolerancia de entrada/salida, redondeo, retardo a partir de, falta a partir de, salida automática, requisitos de verificación (selfie, geocerca, QR), modo de horas extra (LFT México: dobles las primeras 9 semanales, triples después), aprobación de horas extra; vista previa con un ejemplo de jornada calculada.
- **C15** — Lista de campos personalizados arrastrable con tipo, obligatorio, visible/editable por el empleado, usar en reportes y gráficos; diálogo para crear campo con opciones.
- **C16** — Reglas de validación de alta con interruptores y configuración: CURP/RFC/NSS válidos, teléfono y CURP únicos, dominio de email permitido, edad mínima, documentos requeridos, detección de rostro duplicado; severidad Bloquear/Advertir.
- **C17** — Configuración general: periodicidad de pago, inicio de semana, días festivos (precargados LFT), zona horaria, aviso de privacidad, retención de datos, marca (logo/colores).
- **C18** — Bitácora: tabla cronológica con actor, acción, entidad y diff antes/después expandible.

## D. Reportes PDF (plantillas)

D1 Hoja de horas individual con firma del empleado · D2 Lista de asistencia
diaria por sucursal · D3 Reporte de horas extra (dobles/triples) · D4
Incidencias del periodo · D5 Prenómina · D6 Indicadores ejecutivos con gráficos.

- **D1** — Documento carta vertical: encabezado con logo y datos del patrón (razón social, RFC, registro patronal), datos del empleado, tabla diaria (fecha, turno, entrada, salida, descanso, horas, extra, incidencia), totales, y líneas de firma de empleado y RH. Pie con folio y hash de verificación.
