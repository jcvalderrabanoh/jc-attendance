---
tags: [manual, checador]
fuente: Notion › Manual de usuario › 18 · Checador (copiar a la bóveda en Lumen-view/Plataforma clínica/Manual de usuario/)
---
# 18 · Checador (control de asistencia)

> El **Checador** registra las entradas y salidas de tu personal y calcula horas, retardos, faltas y horas extra según la Ley Federal del Trabajo (LFT). Está en el menú **Checador**. Se contrata aparte: si tu cuenta no lo tiene verás *«La cuenta no tiene contratado el Checador»* en cada pantalla. Para ver el menú necesitas el permiso `attendance.read` (el administrador de la cuenta lo ve siempre).

## Quién puede hacer qué
**RH** (`attendance.manage`) configura todo y cierra periodos; **Supervisor** (`attendance.supervise`) revisa y aprueba; `attendance.read` o `attendance.inspect` solo consultan. Si tu rol no alcanza verás *«Tu rol no permite esta acción»*; los permisos los da un administrador en **Seguridad › Usuarios**.

## Cómo checa el personal
Hay tres formas, y todas terminan en **Marcajes**:
1. **App del empleado** (celular): entra con su teléfono o correo y un código por WhatsApp/SMS y pulsa checar; según la política se le pide selfie, ubicación o el QR del kiosco. Ahí también ve sus registros y manda solicitudes.
2. **Kiosco** (tablet en la sucursal): el empleado escribe su **número de empleado** y su **PIN de kiosco**.
3. **Desde lumen-view**: si el empleado está **enlazado a tu usuario de lumen-view**, en **Checador › Tablero** aparece el botón **Checar entrada** (o **Checar salida** si ya estás dentro). Si no estás enlazado verás *«Tu usuario no está enlazado a un registro de empleado»*: pide a RH que edite tu ficha en **Empleados** y elija tu **Usuario de lumen-view**.

## Primeros pasos (puesta en marcha)
1. **Configuración › General**: nombre comercial, zona horaria, periodo de pago, datos del patrón y días festivos.
2. **Ubicaciones**: crea tus sucursales con su geocerca y, si usarás tablet, un kiosco.
3. **Configuración › Horarios** y **Configuración › Políticas**: define turnos, tolerancias y horas extra; marca una política como **Usar en la cuenta**.
4. **Empleados**: agrégalos uno por uno o comparte una **Liga de alta** para que se registren solos.

## Tablero
Indicadores de hoy (**Presentes ahora**, **Puntualidad hoy**, **Ausentismo del mes**, **Horas extra semana**) y pendientes (**Altas pendientes**, **Marcajes por revisar**, **Solicitudes pendientes**: púlsalos para ir a revisarlos), más gráficos de asistencia, entradas por hora, horas extra y retardos. Filtra por **Sucursal** y pulsa **Actualizar**.

## Empleados
- **Agregar empleado**: datos personales y laborales (número de empleado, teléfono, CURP, RFC, NSS, sucursal, horario…) y, opcional, su **Usuario de lumen-view** para que cheque con su mismo login. Marca **Es menor de edad** si aplica (sin horas extra).
- **Invitar por liga**: te lleva a **Ligas de alta**.
- Filtra por **Buscar**, **Departamento**, **Sucursal**, **Estado** o tus campos personalizados; **Limpiar** quita los filtros.
- En el menú de cada fila (⋮): **Ver ficha**, **Editar**, **PIN de kiosco** (de 4 a 6 dígitos) y **Dar de baja**. Al dar de baja, sus registros se conservan el tiempo que marca la retención de datos.
- **Ficha del empleado**: elige **Desde**/**Hasta** y pulsa **Ver periodo** para ver horas trabajadas, extra dobles y triples, nocturnas, retardos, faltas, sus jornadas día por día y sus marcajes.

## Ligas de alta (autorregistro)
1. Pulsa **Nueva liga**: nombre, **Para una persona** o **Multiuso (grupo, cartel o QR)**, sucursal por defecto, **Usos máximos**, **Vence** y si **RH aprueba cada alta** (si se apaga, las altas sin alertas se aprueban solas).
2. Al crearla aparece **Copiar liga**, **Compartir por WhatsApp** y **Descargar QR**. Guárdala en ese momento: por seguridad la liga solo se muestra al crearla o al **regenerarla**.
3. En la lista puedes **Regenerar** (la liga anterior deja de servir) o **Eliminar**. Una liga sin usos disponibles aparece como **Agotada**.

## Validación de altas
Bandeja de quienes se registraron con una liga. Filtra por **Pendientes**, **Falta información**, **Aprobadas**, **Rechazadas** o **Todas**. Elige una solicitud para ver los datos enviados, el riesgo (0–100) y cada regla con ✓ (cumple), ⚠ (advertencia) o ✗ (no cumple). Después:
- **Aprobar** (puedes asignar el **Número de empleado**),
- **Pedir información** o **Rechazar** — ambos piden un **Comentario para el solicitante**.

## Marcajes
Registro de entradas y salidas. Filtra por **Desde**/**Hasta**, **Revisión**, **Sucursal** o **Solo con banderas** y pulsa **Buscar**.
- Las **banderas** (*Fuera de geocerca*, *GPS impreciso*, *Enviado tarde sin conexión*…) no bloquean: el marcaje queda **Por revisar**.
- Pulsa la cámara para ver la **selfie**. En **Acciones**: aprobar (✓), rechazar (✗, pide motivo) o corregir (lápiz).
- **Agregar marcaje manual**: empleado, tipo, fecha y hora y **Motivo**. Queda en la bitácora quién lo capturó y por qué.
- Los marcajes **no se borran ni se editan**: una corrección crea un registro nuevo y el original se conserva.

## Hojas de horas
Totales por empleado del periodo: horas, extra dobles y triples, nocturnas, retardos, faltas, jornadas incompletas, días por revisar y domingos/festivos.
1. Elige **Periodo de pago** o **Rango personalizado**, filtra por departamento o sucursal y pulsa **Ver**.
2. **Recalcular** vuelve a calcular el periodo (por ejemplo, tras corregir marcajes o cambiar una política).
3. **Exportar**: **Prenómina (Excel)**, **Prenómina (CSV)**, **Hoja de horas (PDF)** u **Horas extra (Excel)**; se generan en **Reportes**.
4. **Cerrar periodo** lo deja fijo para la nómina (muestra un candado).

## Incidencias y solicitudes
- **Incidencias**: retardos, faltas y marcajes faltantes que detecta el sistema. Filtra por fechas, estado y tipo; pulsa **Justificar** o **Descartar**.
- **Solicitudes**: vacaciones, permisos, incapacidades y correcciones de marcaje que pide el empleado desde su app. Pulsa **Aprobar** o **Rechazar**, con comentario opcional para el empleado.

## Ubicaciones y kioscos
- **Nueva sucursal**: nombre, **Latitud**/**Longitud** (en Google Maps: clic derecho › copiar coordenadas), **Radio (metros)** de 20 a 5000 y **Precisión GPS máxima** (peor que eso se marca «GPS impreciso»).
- **Nuevo kiosco**: genera un **código de activación**; escríbelo en la tablet (app del kiosco › Activar). Solo se muestra esa vez. Un kiosco aparece **Pendiente de activar** hasta que se usa el código; **Revocar** lo desconecta.

## Reportes
Elige el reporte (hoja de horas, asistencia, prenómina, registro de jornada para la autoridad…), **Desde**/**Hasta** (máximo 3 meses) y el **Formato** (PDF, Excel o CSV). Se preparan en segundo plano: en **Reportes generados** pulsa **Actualizar** y, cuando diga *Listo*, **Descargar**.

## Analítica
Elige **Métrica**, **Agrupar por** (sucursal, departamento, día o campo personalizado) y fechas, y pulsa **Graficar**; **Ver datos en tabla** muestra los números.

## Configuración
- **General**: nombre comercial, zona horaria, periodo de pago, qué hacer **Fuera de la geocerca**, retención tras la baja, datos del patrón (razón social, RFC, registro patronal IMSS), aviso de privacidad y **Días festivos** (**Cargar festivos de ley** precarga los del art. 74 de la LFT).
- **Políticas**: **Nueva política** con tolerancias, minutos para retardo y falta, redondeo, verificación (**Exigir geocerca**, **Exigir selfie**, **Exigir QR del kiosco**, **Permitir marcar sin conexión**) y horas extra. **Usar en la cuenta** la vuelve la política por defecto.
- **Horarios**: **Nuevo horario** con un turno por día de la semana. Si el horario rompe algún límite de la LFT, se muestran sus advertencias.
- **Campos personalizados**: **Nuevo campo** (talla de uniforme, turno, ruta…) para empleados, sucursales, marcajes o solicitudes; decide si se pide en el alta, si aparece en reportes y si se puede graficar.
- **Reglas de alta**: qué se revisa cuando alguien se registra con una liga (CURP, duplicados, edad mínima, dominios de email, regla propia). **Bloquear** rechaza el envío; **Advertir** lo deja pasar a revisión de RH. Las marcadas como **Obligatoria** no se pueden cambiar.

## Bitácora
Quién cambió qué en el Checador, con **Antes** y **Después**.

## Preguntas frecuentes del Checador
- **Un empleado dice que checó y no aparece:** busca en **Marcajes** con su fecha y **Revisión: Todas**; si marcó sin conexión, llega cuando el celular recupera señal (bandera *Enviado tarde sin conexión*). Si de verdad falta, usa **Agregar marcaje manual** con el motivo.
- **Las horas no cuadran tras corregir algo:** en **Hojas de horas** pulsa **Recalcular**.
- **Perdí la liga de alta:** no se puede volver a ver; pulsa **Regenerar** (la anterior deja de funcionar) y compártela de nuevo.
- **Un empleado olvidó su PIN del kiosco:** en **Empleados**, menú ⋮ › **PIN de kiosco** y asígnale uno nuevo.

## Relacionado
- [[11 Seguridad (Usuarios)]]
