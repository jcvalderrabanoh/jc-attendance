/**
 * RFC (Registro Federal de Contribuyentes):
 * - persona física, 13: 4 letras · AAMMDD · homoclave (3);
 * - persona moral, 12: 3 letras · AAMMDD · homoclave (3).
 */
import { validCalendarDate } from './dates';

export const RFC_FISICA_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z\d]{2}[A\d]$/;
export const RFC_MORAL_REGEX = /^[A-ZÑ&]{3}\d{6}[A-Z\d]{2}[A\d]$/;

export type RfcKind = 'fisica' | 'moral';

export interface RfcOptions {
  /** Restringe a un tipo de persona. */
  kind?: RfcKind;
  /** Verifica también el dígito verificador (mod 11). Por defecto no: hay RFC antiguos que no lo cumplen. */
  verifyCheckDigit?: boolean;
}

const RFC_DICTIONARY = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';

function normalize(rfc: string): string {
  return (rfc ?? '').trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Dígito verificador del SAT (mod 11) para los 11/12 primeros caracteres. */
export function rfcCheckDigit(rfcWithoutDigit: string): string {
  let s = normalize(rfcWithoutDigit);
  if (s.length === 11) s = ` ${s}`; // persona moral: se completa a 12
  if (s.length !== 12) throw new Error('Se esperan los 11 (moral) o 12 (física) primeros caracteres del RFC');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const v = RFC_DICTIONARY.indexOf(s[i]);
    if (v < 0) throw new Error(`Carácter inválido en RFC: ${s[i]}`);
    sum += v * (13 - i);
  }
  const r = sum % 11;
  if (r === 0) return '0';
  const d = 11 - r;
  return d === 10 ? 'A' : String(d);
}

/** Tipo de persona según la estructura, o `null` si no es un RFC válido. */
export function rfcKind(rfc: string): RfcKind | null {
  const s = normalize(rfc);
  if (RFC_FISICA_REGEX.test(s)) return 'fisica';
  if (RFC_MORAL_REGEX.test(s)) return 'moral';
  return null;
}

export function isValidRfc(rfc: string, opts: RfcOptions = {}): boolean {
  const s = normalize(rfc);
  const kind = rfcKind(s);
  if (!kind || (opts.kind && opts.kind !== kind)) return false;
  const offset = kind === 'fisica' ? 4 : 3;
  const yy = Number(s.slice(offset, offset + 2));
  const mm = Number(s.slice(offset + 2, offset + 4));
  const dd = Number(s.slice(offset + 4, offset + 6));
  // El año de 2 dígitos no fija el siglo; basta con que la fecha exista en alguno (29-feb).
  if (!validCalendarDate(2000 + yy, mm, dd) && !validCalendarDate(1900 + yy, mm, dd)) return false;
  if (opts.verifyCheckDigit) return rfcCheckDigit(s.slice(0, -1)) === s.slice(-1);
  return true;
}
