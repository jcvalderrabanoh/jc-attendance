import * as jwt from 'jsonwebtoken';

function ownSecret(): string {
  const secret = process.env.EMPLOYEE_JWT_SECRET;
  if (!secret) throw new Error('EMPLOYEE_JWT_SECRET is required');
  return secret;
}

/** Token del empleado (OTP). `accountId`/`employmentId` cuando ya eligió patrón. */
export function signEmployeeToken(
  claims: { identityId: string; accountId?: string | null; employmentId?: string | null },
  expiresIn: string | number = '30d',
): string {
  return jwt.sign({ scope: 'employee', ...claims }, ownSecret(), { expiresIn } as jwt.SignOptions);
}

/** Token de kiosco: larga vida, se revoca dando de baja el dispositivo. */
export function signKioskToken(claims: { deviceId: string; accountId: string; locationId: string | null }): string {
  return jwt.sign({ scope: 'kiosk', ...claims }, ownSecret(), { expiresIn: '365d' });
}
