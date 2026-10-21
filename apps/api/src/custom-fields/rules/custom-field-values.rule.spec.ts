import { CustomFieldDefinition, CustomFieldTypeEnum } from '../entities';
import { CustomFieldValuesRule } from './custom-field-values.rule';

const def = (over: Partial<CustomFieldDefinition>): CustomFieldDefinition =>
  ({ key: 'k', label: 'Campo', type: CustomFieldTypeEnum.Text, options: [], required: false, validation: {}, editableByEmployee: true, askOnOnboarding: false, ...over }) as CustomFieldDefinition;

describe('CustomFieldValuesRule', () => {
  const rule = new CustomFieldValuesRule();

  it('exige los obligatorios y descarta claves desconocidas', () => {
    const r = rule.validate([def({ key: 'talla', required: true })], { otra: 'x' });
    expect(r.errors).toEqual(['«Campo» es obligatorio']);
    expect(r.values).toEqual({});
  });

  it('en validación parcial no exige obligatorios ausentes', () => {
    expect(rule.validate([def({ key: 'talla', required: true })], {}, { partial: true }).errors).toEqual([]);
  });

  it.each([
    [CustomFieldTypeEnum.Number, '12,5', 12.5],
    [CustomFieldTypeEnum.Boolean, 'sí', true],
    [CustomFieldTypeEnum.Email, ' Ana@Mail.com ', 'ana@mail.com'],
    [CustomFieldTypeEnum.Date, '2026-10-20', '2026-10-20'],
  ])('normaliza %s', (type, input, expected) => {
    const r = rule.validate([def({ key: 'x', type })], { x: input });
    expect(r.errors).toEqual([]);
    expect(r.values.x).toEqual(expected);
  });

  it('valida opciones de lista', () => {
    const d = def({ key: 'talla', type: CustomFieldTypeEnum.Select, options: ['CH', 'M', 'G'] });
    expect(rule.validate([d], { talla: 'XL' }).errors[0]).toContain('opción inválida');
    expect(rule.validate([d], { talla: 'M' }).values).toEqual({ talla: 'M' });
  });

  it('aplica mínimo/máximo y regex', () => {
    const n = def({ key: 'n', type: CustomFieldTypeEnum.Number, validation: { min: 1, max: 5 } });
    expect(rule.validate([n], { n: 9 }).errors[0]).toContain('máximo 5');
    const t = def({ key: 't', validation: { regex: '^[A-Z]{3}$' } });
    expect(rule.validate([t], { t: 'ab' }).errors[0]).toContain('formato');
  });

  it('como empleado solo acepta los editables', () => {
    const r = rule.validate([def({ key: 'sueldo', editableByEmployee: false }), def({ key: 'talla' })], { sueldo: '1', talla: 'M' }, { asEmployee: true });
    expect(r.values).toEqual({ talla: 'M' });
  });

  it('en alta solo pide los marcados para la liga', () => {
    const r = rule.validate([def({ key: 'a', required: true }), def({ key: 'b', askOnOnboarding: true })], { b: 'x' }, { onboarding: true });
    expect(r.errors).toEqual([]);
    expect(r.values).toEqual({ b: 'x' });
  });
});
