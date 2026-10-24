import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

export const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');

/** Token aleatorio URL-safe (≥128 bits). */
export const randomToken = (bytes = 24): string => randomBytes(bytes).toString('base64url');

/** Código numérico de `digits` dígitos (OTP, activación). */
export const randomDigits = (digits = 6): string =>
  Array.from({ length: digits }, () => randomInt(0, 10).toString()).join('');

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Hash con sal fija del servidor para secretos cortos (PIN, OTP). */
export function hashSecret(value: string): string {
  const pepper = process.env.EMPLOYEE_JWT_SECRET || 'dev-pepper';
  return createHmac('sha256', pepper).update(value).digest('hex');
}

/**
 * TOTP (RFC 6238, HMAC-SHA1) para el QR rotativo del kiosco. `step` en
 * segundos; devuelve 8 dígitos.
 */
export function totp(secret: string, at: number = Date.now(), step = 30): string {
  const counter = Math.floor(at / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', Buffer.from(secret, 'base64url')).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 100_000_000;
  return code.toString().padStart(8, '0');
}

/** Valida un TOTP aceptando el paso anterior (latencia de escaneo). */
export function verifyTotp(secret: string, code: string, at: number = Date.now(), step = 30): boolean {
  return [0, -1].some((drift) => safeEqual(totp(secret, at + drift * step * 1000, step), code));
}
