/**
 * NSS (Número de Seguridad Social del IMSS), 11 dígitos:
 * subdelegación (2) · año de alta (2) · año de nacimiento (2) · consecutivo (4) ·
 * dígito verificador (Luhn sobre los 10 primeros).
 */

/** Luhn: pesos 1,2,1,2…; los productos ≥ 10 suman sus dígitos. */
export function nssCheckDigit(first10: string): number {
  if (!/^\d{10}$/.test(first10)) throw new Error('Se esperan los 10 primeros dígitos del NSS');
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let v = Number(first10[i]) * (i % 2 === 0 ? 1 : 2);
    if (v > 9) v -= 9;
    sum += v;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidNss(nss: string): boolean {
  const s = (nss ?? '').replace(/[\s-]/g, '');
  if (!/^\d{11}$/.test(s)) return false;
  return nssCheckDigit(s.slice(0, 10)) === Number(s[10]);
}
