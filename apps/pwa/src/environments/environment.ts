/**
 * Producción: la PWA vive en `https://core.lumen-view.com/asistencia/` y el API
 * en `/attendance/` del mismo dominio (nginx → :3100), así que no hay CORS.
 */
export const environment = {
  production: true,
  apiUrl: '/attendance/api/v1',
};
