import { HttpErrorResponse } from '@angular/common/http';

/** Sin red / el servidor no respondió: el marcaje puede encolarse. */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse)) return false;
  return err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504;
}

/** Mensaje legible de un error del API (Nest: `message` string o arreglo de class-validator). */
export function apiErrorMessage(err: unknown, fallback = 'Algo salió mal. Intenta de nuevo.'): string {
  if (err instanceof HttpErrorResponse) {
    if (isNetworkError(err)) return 'Sin conexión con el servidor. Revisa tu internet.';
    const body = err.error as { message?: string | string[] } | string | null;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      if (Array.isArray(body.message)) return body.message.join('. ');
      if (typeof body.message === 'string' && body.message) return body.message;
    }
    if (err.status === 429) return 'Demasiados intentos. Espera un minuto.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
