import { Injectable, computed, signal } from '@angular/core';
import { EmploymentRef } from '../api/models';
import { safeStorage } from './storage';

export const EMPLOYEE_TOKEN_KEY = 'att.employeeToken';
export const KIOSK_TOKEN_KEY = 'att.kioskToken';
export const LOGIN_INFO_KEY = 'att.login';

export interface EmployeeClaims {
  scope: 'employee';
  identityId: string;
  accountId?: string | null;
  employmentId?: string | null;
  exp?: number;
}

export interface KioskClaims {
  scope: 'kiosk';
  deviceId: string;
  accountId: string;
  locationId: string | null;
  exp?: number;
}

/** Lo que devolvió el último login: para el selector de patrón (A3) y el saludo. */
export interface LoginInfo {
  firstName: string;
  employments: EmploymentRef[];
}

/** Decodifica el payload de un JWT (sin verificar: la firma la valida el API). */
export function decodeJwt<T>(token: string | null | undefined): T | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const json = decodeURIComponent(
      Array.from(atob(b64))
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function notExpired(claims: { exp?: number } | null, now = Date.now()): boolean {
  return Boolean(claims) && (!claims!.exp || claims!.exp * 1000 > now);
}

/**
 * Tokens Bearer del empleado (OTP) y del kiosco, en localStorage.
 * Son independientes: una tablet de kiosco no comparte sesión con el empleado.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly employee = signal<string | null>(safeStorage.get(EMPLOYEE_TOKEN_KEY));
  private readonly kiosk = signal<string | null>(safeStorage.get(KIOSK_TOKEN_KEY));
  private readonly login = signal<LoginInfo | null>(safeStorage.getJson<LoginInfo>(LOGIN_INFO_KEY));

  readonly employeeToken = this.employee.asReadonly();
  readonly kioskToken = this.kiosk.asReadonly();
  readonly loginInfo = this.login.asReadonly();
  readonly employeeClaims = computed(() => decodeJwt<EmployeeClaims>(this.employee()));
  readonly kioskClaims = computed(() => decodeJwt<KioskClaims>(this.kiosk()));

  /** Sesión de empleado vigente (con o sin patrón elegido). */
  isEmployeeAuthenticated(now = Date.now()): boolean {
    const claims = this.employeeClaims();
    return claims?.scope === 'employee' && notExpired(claims, now);
  }

  /** Ya eligió patrón: puede checar y ver su historial. */
  hasEmployment(): boolean {
    const claims = this.employeeClaims();
    return Boolean(claims?.accountId && claims?.employmentId);
  }

  isKioskActivated(now = Date.now()): boolean {
    const claims = this.kioskClaims();
    return claims?.scope === 'kiosk' && notExpired(claims, now);
  }

  setEmployeeToken(token: string): void {
    safeStorage.set(EMPLOYEE_TOKEN_KEY, token);
    this.employee.set(token);
  }

  setLoginInfo(info: LoginInfo): void {
    safeStorage.setJson(LOGIN_INFO_KEY, info);
    this.login.set(info);
  }

  clearEmployee(): void {
    safeStorage.remove(EMPLOYEE_TOKEN_KEY);
    safeStorage.remove(LOGIN_INFO_KEY);
    this.employee.set(null);
    this.login.set(null);
  }

  setKioskToken(token: string): void {
    safeStorage.set(KIOSK_TOKEN_KEY, token);
    this.kiosk.set(token);
  }

  clearKiosk(): void {
    safeStorage.remove(KIOSK_TOKEN_KEY);
    this.kiosk.set(null);
  }
}
