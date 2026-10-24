/**
 * Normalización de teléfonos a E.164 (`+<código país><número>`).
 * Reglas de México (código 52): número nacional de 10 dígitos; se eliminan
 * los prefijos antiguos `044`/`045` (celular), `01` (larga distancia) y el
 * `1` móvil tras el `+52` (`+521…`), retirados en 2019–2020.
 */

/** Devuelve el teléfono en E.164 o `null` si no se puede normalizar. */
export function normalizePhoneE164(raw: string, defaultCountry = '52'): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/[^\d\s()+.\-]/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, '');
  let international = false;
  if (trimmed.startsWith('+')) {
    international = true;
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
    international = true;
  }

  const country = defaultCountry.replace(/\D/g, '');
  if (!international) {
    if (country === '52') {
      if (/^(044|045)\d{10}$/.test(digits)) digits = digits.slice(3);
      else if (/^01\d{10}$/.test(digits)) digits = digits.slice(2);
      if (digits.length === 10) digits = `52${digits}`;
      else if (!/^521?\d{10}$/.test(digits)) return null;
    } else {
      digits = `${country}${digits.replace(/^0+/, '')}`;
    }
  }

  if (/^521\d{10}$/.test(digits)) digits = `52${digits.slice(3)}`;
  if (digits.startsWith('52') && digits.length !== 12) return null;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}
