import { curpBirthDate, curpCheckDigit, isValidCurp } from '../validators/curp';
import { nssCheckDigit, isValidNss } from '../validators/nss';
import { normalizePhoneE164 } from '../validators/phone';
import { isValidRfc, rfcCheckDigit, rfcKind } from '../validators/rfc';

/** Completa una CURP con su dígito verificador. */
const withCurpDigit = (first17: string) => `${first17}${curpCheckDigit(first17)}`;

describe('CURP', () => {
  it('ejemplo publicado por RENAPO (HEGG560427MVZRRL04) es válido', () => {
    expect(isValidCurp('HEGG560427MVZRRL04')).toBe(true);
    expect(curpCheckDigit('HEGG560427MVZRRL0')).toBe(4);
  });

  it.each([
    withCurpDigit('GODE561231HDFRRN0'),
    withCurpDigit('PEPJ800101HDFRRN0'),
    withCurpDigit('LOAM040229MNERPRA'), // nacida en 2004 (diferenciador letra)
    withCurpDigit('XEXX010101XNEXXXA'), // sexo X (no binario) y nacido en el extranjero
  ])('%s es válida', (curp) => {
    expect(isValidCurp(curp)).toBe(true);
    expect(isValidCurp(curp.toLowerCase())).toBe(true);
  });

  it.each([
    ['dígito verificador incorrecto', 'HEGG560427MVZRRL05'],
    ['longitud 17', 'HEGG560427MVZRRL0'],
    ['entidad inexistente', withCurpDigit('HEGG560427MXXRRL0')],
    ['sexo inválido', withCurpDigit('HEGG560427QVZRRL0')],
    ['mes 13', withCurpDigit('HEGG561327MVZRRL0')],
    ['31 de febrero', withCurpDigit('HEGG560231MVZRRL0')],
    ['29-feb en año no bisiesto (2005)', withCurpDigit('LOAM050229MNERPRA')],
    ['vocal en consonantes internas', withCurpDigit('HEGG560427MVZARL0')],
    ['vacía', ''],
  ])('inválida: %s', (_c, curp) => {
    expect(isValidCurp(curp)).toBe(false);
  });

  it.each([
    ['HEGG560427MVZRRL04', '1956-04-27'], // diferenciador numérico → 1900
    [withCurpDigit('LOAM040229MNERPRA'), '2004-02-29'], // diferenciador letra → 2000
    ['HEGG561327MVZRRL04', null],
  ])('fecha de nacimiento de %s → %s', (curp, expected) => {
    expect(curpBirthDate(curp)).toBe(expected);
  });
});

describe('RFC', () => {
  it.each([
    ['GODE561231GR8', 'fisica', true],
    ['ABC680524P73', 'moral', true],
    ['XAXX010101000', 'fisica', false], // RFC genérico: formato válido
    ['ñaña800101AB1', 'fisica', false],
  ] as const)('%s es válido (%s)', (rfc, kind, checkDigitHolds) => {
    expect(isValidRfc(rfc)).toBe(true);
    expect(rfcKind(rfc)).toBe(kind);
    expect(isValidRfc(rfc, { kind })).toBe(true);
    if (checkDigitHolds) expect(isValidRfc(rfc, { verifyCheckDigit: true })).toBe(true);
  });

  it('dígito verificador (mod 11)', () => {
    expect(rfcCheckDigit('GODE561231GR')).toBe('8');
    expect(rfcCheckDigit('ABC680524P7')).toBe('3');
    expect(isValidRfc('GODE561231GR9', { verifyCheckDigit: true })).toBe(false);
    expect(isValidRfc('GODE561231GR9')).toBe(true);
  });

  it.each([
    ['mes 13', 'GODE561331GR8'],
    ['día 32', 'GODE561232GR8'],
    ['longitud 11', 'ABC680524P7'],
    ['longitud 14', 'GODEX561231GR8'],
    ['dígitos en el nombre', 'G0DE561231GR8'],
    ['vacío', ''],
  ])('inválido: %s', (_c, rfc) => {
    expect(isValidRfc(rfc)).toBe(false);
  });

  it('restricción por tipo de persona', () => {
    expect(isValidRfc('ABC680524P73', { kind: 'fisica' })).toBe(false);
  });
});

describe('NSS', () => {
  it.each([
    ['12345678903', true],
    ['1234-5678-903', true],
    ['12345678904', false],
    ['1234567890', false],
    ['1234567890A', false],
    [`0101850123${nssCheckDigit('0101850123')}`, true],
  ])('%s → %s', (nss, expected) => {
    expect(isValidNss(nss)).toBe(expected);
  });
});

describe('teléfono a E.164', () => {
  it.each([
    ['55 1234 5678', undefined, '+525512345678'],
    ['(55) 1234-5678', undefined, '+525512345678'],
    ['55.1234.5678', undefined, '+525512345678'],
    ['+52 55 1234 5678', undefined, '+525512345678'],
    ['+52 1 55 1234 5678', undefined, '+525512345678'],
    ['044 55 1234 5678', undefined, '+525512345678'],
    ['045 33 1234 5678', undefined, '+523312345678'],
    ['01 81 1234 5678', undefined, '+528112345678'],
    ['525512345678', undefined, '+525512345678'],
    ['0052 55 1234 5678', undefined, '+525512345678'],
    ['+1 (415) 555-2671', undefined, '+14155552671'],
    ['0034 612 345 678', undefined, '+34612345678'],
    ['612 345 678', '34', '+34612345678'],
    ['+52 55 1234 567', undefined, null],
    ['5512345', undefined, null],
    ['abc', undefined, null],
    ['55-1234-5678 ext 2', undefined, null],
    ['', undefined, null],
  ])('%s (país %s) → %s', (raw, country, expected) => {
    expect(normalizePhoneE164(raw, country)).toBe(expected);
  });
});
