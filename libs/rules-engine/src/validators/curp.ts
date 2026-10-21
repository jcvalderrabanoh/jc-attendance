/**
 * CURP (Clave Única de Registro de Población), 18 caracteres:
 * 4 letras del nombre · AAMMDD · sexo (H/M/X) · entidad (2) ·
 * 3 consonantes internas · diferenciador de siglo (dígito ≤1999, letra ≥2000) ·
 * dígito verificador.
 */
import { validCalendarDate } from './dates';

const STATES =
  'AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE';

export const CURP_REGEX = new RegExp(
  `^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HMX](${STATES})[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\\d$`,
);

/** Diccionario oficial de RENAPO: 0–9 → 0–9, A → 10 … Ñ → 24 … Z → 36. */
const CURP_DICTIONARY = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

function normalize(curp: string): string {
  return (curp ?? '').trim().toUpperCase();
}

/**
 * Dígito verificador: Σ valor(cᵢ) × (18 − i) sobre los 17 primeros caracteres;
 * dígito = (10 − Σ mod 10) mod 10.
 */
export function curpCheckDigit(first17: string): number {
  const s = normalize(first17);
  if (s.length !== 17) throw new Error('Se esperan los 17 primeros caracteres de la CURP');
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = CURP_DICTIONARY.indexOf(s[i]);
    if (v < 0) throw new Error(`Carácter inválido en CURP: ${s[i]}`);
    sum += v * (18 - i);
  }
  return (10 - (sum % 10)) % 10;
}

/** Fecha de nacimiento `YYYY-MM-DD` codificada en la CURP, o `null` si no es válida. */
export function curpBirthDate(curp: string): string | null {
  const s = normalize(curp);
  if (s.length !== 18) return null;
  const yy = Number(s.slice(4, 6));
  const mm = Number(s.slice(6, 8));
  const dd = Number(s.slice(8, 10));
  if ([yy, mm, dd].some(Number.isNaN)) return null;
  const century = /\d/.test(s[16]) ? 1900 : 2000;
  return validCalendarDate(century + yy, mm, dd);
}

/** Estructura oficial + fecha real + dígito verificador. */
export function isValidCurp(curp: string): boolean {
  const s = normalize(curp);
  if (!CURP_REGEX.test(s)) return false;
  if (!curpBirthDate(s)) return false;
  return curpCheckDigit(s.slice(0, 17)) === Number(s[17]);
}
