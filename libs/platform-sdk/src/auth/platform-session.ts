import * as jwt from 'jsonwebtoken';

/**
 * Sesión de un usuario de la plataforma (jc-core) tal como viaja en su JWT:
 * `{ userId, email, accountId, role, permissions, app }`. La firma jc-core con
 * `JWT_SECRET`; cada producto la verifica con el mismo secreto.
 */
export interface PlatformSession {
  userId: string;
  email: string;
  accountId: string;
  role: string;
  permissions: string[];
  /** App con la que inició sesión (`lumen-view`, `anesthesia`, `attendance`…). */
  app: string;
}

export type VerifyPlatformTokenResult =
  | { status: 'ok'; session: PlatformSession }
  /** Firma válida pero vencido: el front debe renovar. */
  | { status: 'expired' }
  /** No lo firmó jc-core (puede ser un token propio del producto). */
  | { status: 'not_platform' }
  /** Firma válida, pero la sesión es de una app que este producto no acepta. */
  | { status: 'app_not_accepted'; app: string }
  /** Firma válida sin `userId`/`accountId`. */
  | { status: 'malformed' };

/** Tokens anteriores al claim `app` son de lumen-view (así los trata jc-core). */
export const LEGACY_DEFAULT_APP = 'lumen-view';

/**
 * Verifica un JWT de jc-core. No lanza: el producto decide qué excepción
 * corresponde a cada resultado (y si prueba después su propio secreto).
 */
export function verifyPlatformToken(
  token: string,
  secret: string,
  acceptedApps: readonly string[],
): VerifyPlatformTokenResult {
  let payload: jwt.JwtPayload | string;
  try {
    payload = jwt.verify(token, secret);
  } catch (err) {
    return err instanceof jwt.TokenExpiredError ? { status: 'expired' } : { status: 'not_platform' };
  }
  if (typeof payload === 'string') return { status: 'not_platform' };

  const app = typeof payload.app === 'string' ? payload.app : LEGACY_DEFAULT_APP;
  if (!acceptedApps.includes(app)) return { status: 'app_not_accepted', app };
  if (!payload.userId || !payload.accountId) return { status: 'malformed' };

  return {
    status: 'ok',
    session: {
      userId: String(payload.userId),
      email: String(payload.email ?? ''),
      accountId: String(payload.accountId),
      role: typeof payload.role === 'string' ? payload.role : 'staff',
      permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
      app,
    },
  };
}

/** Lista separada por comas (p. ej. una variable de entorno) → apps aceptadas. */
export function parseAcceptedApps(value: string | undefined, fallback: readonly string[]): string[] {
  const apps = (value ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  return apps.length ? apps : [...fallback];
}
