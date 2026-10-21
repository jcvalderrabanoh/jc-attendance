import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api/api.services';
import { TokenService } from './token.service';

/** Rutas públicas del API: no llevan token y un 401 no cierra sesión. */
const PUBLIC_PATHS = [/^\/employee-auth\/(otp|verify)$/, /^\/join\//, /^\/kiosk\/activate$/];

function apiPath(url: string): string | null {
  if (url.startsWith(API_URL)) return url.slice(API_URL.length).split('?')[0];
  return null;
}

/**
 * Pone el Bearer correcto (empleado o kiosco) en las llamadas al API.
 * 401 del empleado → borra el token y manda a /entrar.
 * 401 del QR del kiosco → el dispositivo fue dado de baja → /kiosco/activar.
 * (Un 401 en /kiosk/punches es PIN incorrecto: no desactiva el kiosco.)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = apiPath(req.url);
  if (path === null || PUBLIC_PATHS.some((p) => p.test(path))) return next(req);

  const tokens = inject(TokenService);
  const router = inject(Router);
  const isKiosk = path.startsWith('/kiosk/');
  const token = isKiosk ? tokens.kioskToken() : tokens.employeeToken();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (!isKiosk) {
          tokens.clearEmployee();
          void router.navigate(['/entrar'], { queryParams: { expirada: 1 } });
        } else if (path === '/kiosk/qr') {
          tokens.clearKiosk();
          void router.navigate(['/kiosco/activar']);
        }
      }
      return throwError(() => err);
    }),
  );
};
