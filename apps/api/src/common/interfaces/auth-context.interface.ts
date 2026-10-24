import { ActorRoleEnum } from '../enums';

/** Usuario de jc-core (patrón, RH, supervisor) tal como llega en su JWT. */
export interface CoreUserContext {
  kind: 'core';
  userId: string;
  email: string;
  accountId: string;
  role: string;
  permissions: string[];
  /** Rol efectivo dentro del Checador. */
  attendanceRole: ActorRoleEnum;
}

/** Empleado autenticado con OTP (token propio del Checador). */
export interface EmployeeContext {
  kind: 'employee';
  identityId: string;
  /** Empleo activo en la cuenta elegida; null mientras no elija patrón. */
  employmentId: string | null;
  accountId: string | null;
}

/** Kiosco vinculado a una sucursal. */
export interface KioskContext {
  kind: 'kiosk';
  deviceId: string;
  accountId: string;
  locationId: string | null;
}

export type AuthContext = CoreUserContext | EmployeeContext | KioskContext;
