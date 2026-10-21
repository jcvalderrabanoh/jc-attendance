# @jc-attendance/pwa — app del empleado y kiosco

PWA en Angular 19 (standalone + Angular Material 19) para checar entrada y
salida desde el celular y desde una tablet de kiosco. Habla con `apps/api`
(`/api/v1`) con tokens Bearer propios (empleado por OTP, kiosco por código de
activación) guardados en `localStorage`.

## Correr

```bash
npm install                          # en la raíz del monorepo
npm start -w @jc-attendance/pwa      # http://localhost:4300 (API en http://localhost:3100/api/v1)
npm run build -w @jc-attendance/pwa  # producción → apps/pwa/dist/pwa/browser
npm test -w @jc-attendance/pwa       # Jest (jest-preset-angular, jsdom, fake-indexeddb)
npm run typecheck -w @jc-attendance/pwa
```

- `src/environments/environment.development.ts`: `apiUrl` de desarrollo
  (`http://localhost:3100/api/v1`). En producción (`environment.ts`) es
  `/api/v1`: servir la PWA y el API detrás del mismo dominio (proxy inverso)
  o cambiar `apiUrl` y agregar el origen a `CORS_ORIGINS` del API.
- El service worker solo se registra en el build de producción. Para probar
  instalación y modo offline: `npm run build -w @jc-attendance/pwa` y servir
  `dist/pwa/browser` con cualquier servidor estático con *fallback* a
  `index.html` (p. ej. `npx serve -s apps/pwa/dist/pwa/browser`).
  La geolocalización y la cámara requieren HTTPS (o `localhost`).

## Pantallas

| Ruta | Pantalla | Stitch |
|---|---|---|
| `/unirse/:token` | A1 Alta por liga (3 pasos: datos + OTP, datos laborales y campos personalizados, consentimientos) | `docs/stitch/A1.png` |
| `/entrar` | A2 Acceso por OTP (teléfono +52 o email, 6 casillas, reenvío con temporizador) | A2 |
| `/cuentas` | A3 Selector de patrón (empresa predeterminada fijable) | A3 |
| `/` | A4 Checar: botón único, reloj, contador en vivo, turno, semana, último marcaje | A4 |
| (hoja) | A5 Verificación: precisión del GPS, QR del kiosco, selfie opcional | A5 |
| `/historial` | A6 Semana: total vs. 48 h, estado por día (Retardo/Falta/Pendiente), marcajes | A6 |
| `/solicitudes` | A7 Pendientes/Resueltas, saldo de vacaciones, nueva solicitud | A7 |
| `/perfil` | A8 Datos, campos editables, consentimientos (revocar), cambiar de empresa, salir | A8 |
| `/kiosco/activar` | B2 Activar tablet con código de 8 caracteres | B2 |
| `/kiosco` | B1 QR rotativo + teclado de número de empleado y PIN | B1 |

A5 es una *bottom sheet* sobre A4 (no una ruta): así el marcaje no pierde el
estado de la pantalla ni el contador.

## Marcaje y cola offline

`core/punch/punch.service.ts` + `core/offline/punch-queue.service.ts`:

1. Cada marcaje lleva `idempotencyKey = crypto.randomUUID()` y `clientAt`
   (hora del dispositivo). Reenviar la misma clave nunca duplica.
2. Sin red (`navigator.onLine === false`) o si la petición falla por red
   (status 0/502/503/504) se guarda en IndexedDB (`att-offline` › `punches`)
   y se muestra «Sin conexión: se enviará al reconectar». La pantalla refleja
   el cambio de estado (entrada → salida) para seguir la secuencia.
3. Se reenvía con `offline: true`, en orden de `clientAt`:
   - al volver la red (`online`),
   - al abrir la app y al volver a primer plano (`visibilitychange`),
   - con **Background Sync** (`sync` tag `att-punch-queue`) donde existe,
     desde `public/sw-main.js` (que importa `ngsw-worker.js`),
   - antes de un marcaje nuevo en línea (para no invertir el orden).
4. Un 4xx al reenviar marca el marcaje como rechazado y se le muestra al
   empleado con el motivo del API; 401/408/429/5xx/red lo dejan pendiente.

La geolocalización se lee **una vez** al confirmar (`enableHighAccuracy`,
10 s); nunca hay rastreo. El consentimiento de geolocalización se pide una
sola vez (`POST /employee-auth/consents ['geolocation']`). La selfie
(cámara frontal → canvas → JPEG ≤ 400 KB) y el QR del kiosco son opcionales;
si el API devuelve `no_selfie` o `qr_invalid` en `riskFlags`, la app recuerda
que la política los pide y lo sugiere en la hoja A5. El QR se lee con
`BarcodeDetector` y, si no existe (Safari/iOS, Firefox), con `jsqr` cargado
bajo demanda.

## PWA

- `ngsw-config.json`: precarga del shell (JS/CSS/index), íconos y fuentes en
  caché perezosa. El API nunca se cachea (los marcajes no deben servirse de
  caché); A4 guarda el último `GET /me/status` en `localStorage` para abrir
  sin red.
- `public/manifest.webmanifest`: `display: standalone`, `theme_color #0F4C5C`,
  íconos 192/512 y *maskable*.

### Limitaciones en iOS (Safari / PWA instalada)

- **Sin Background Sync**: la cola se envía cuando el empleado vuelve a abrir
  la app o la trae a primer plano con red. Por eso el banner muestra cuántos
  marcajes faltan por enviar.
- La PWA se instala con «Compartir › Agregar a inicio» (no hay aviso de
  instalación). iOS puede borrar el almacenamiento (IndexedDB/localStorage)
  de una PWA que no se usa en varias semanas; los tokens viven 30 días.
- Los permisos de ubicación y cámara se piden por sesión en algunas
  versiones; la app tolera que se nieguen (marca sin GPS → el API lo deja
  pendiente de revisión).
- `BarcodeDetector` no existe: el QR usa `jsqr` (chunk aparte, ~27 KB gzip).
- Pantalla completa no está disponible en iPadOS: para el kiosco, instalar
  la PWA en inicio y usar Acceso guiado.

## Accesibilidad

Español (es-MX), Inter, objetivos táctiles ≥ 48 px, foco visible, estados con
ícono + texto (nunca solo color), resultados del marcaje en `aria-live`
(A4 y kiosco), `prefers-reduced-motion` respetado. Paleta: petróleo
`#0F4C5C`, ámbar `#F2A541`, verde `#2E7D32`, rojo `#C62828`.
