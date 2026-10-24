import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

/** Requiere sesión de empleado. */
export const employeeGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  return tokens.isEmployeeAuthenticated() ? true : inject(Router).createUrlTree(['/entrar']);
};

/** Requiere sesión con patrón elegido (para checar, historial, solicitudes). */
export const employmentGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const router = inject(Router);
  if (!tokens.isEmployeeAuthenticated()) return router.createUrlTree(['/entrar']);
  return tokens.hasEmployment() ? true : router.createUrlTree(['/cuentas']);
};

/** Ya con sesión, /entrar redirige a la app. */
export const guestGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  if (!tokens.isEmployeeAuthenticated()) return true;
  return inject(Router).createUrlTree([tokens.hasEmployment() ? '/' : '/cuentas']);
};

export const kioskGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  return tokens.isKioskActivated() ? true : inject(Router).createUrlTree(['/kiosco/activar']);
};
