import { FormControl } from '@angular/forms';
import { CustomFieldDefinition } from '../../core/api/models';
import { CURP_RE, cleanCustomFields, emailDomainValidator, mxPhoneValidator, splitServerErrors, validatorsFor } from './join.logic';

const field = (f: Partial<CustomFieldDefinition>): CustomFieldDefinition => ({
  key: 'k', label: 'K', type: 'text', options: [], required: false, validation: {}, ...f,
});

describe('join.logic (alta por liga)', () => {
  it('valida campos personalizados según su definición', () => {
    const c = new FormControl<unknown>('', validatorsFor(field({ required: true, validation: { regex: '^[A-Z]{3}$' } })));
    expect(c.hasError('required')).toBe(true);
    c.setValue('abc');
    expect(c.hasError('pattern')).toBe(true);
    c.setValue('ABC');
    expect(c.valid).toBe(true);
    const n = new FormControl<unknown>(200, validatorsFor(field({ type: 'number', validation: { max: 100 } })));
    expect(n.hasError('max')).toBe(true);
    const b = new FormControl<unknown>(false, validatorsFor(field({ type: 'boolean', required: true })));
    expect(b.hasError('required')).toBe(true);
  });

  it('regex inválida en la definición no rompe el formulario', () => {
    expect(() => validatorsFor(field({ validation: { regex: '([' } }))).not.toThrow();
  });

  it('dominios de email permitidos', () => {
    const v = emailDomainValidator(['espiga.mx']);
    expect(v(new FormControl('ana@espiga.mx'))).toBeNull();
    expect(v(new FormControl('ana@gmail.com'))).toEqual({ domain: 'espiga.mx' });
    expect(emailDomainValidator([])(new FormControl('ana@gmail.com'))).toBeNull();
  });

  it('teléfono MX de 10 dígitos', () => {
    expect(mxPhoneValidator(new FormControl('55 1234 5678'))).toBeNull();
    expect(mxPhoneValidator(new FormControl('1234'))).toEqual({ phone: true });
  });

  it('CURP con estructura oficial', () => {
    expect(CURP_RE.test('GOMC900101HDFRRR09')).toBe(true);
    expect(CURP_RE.test('GOMC900101')).toBe(false);
  });

  it('limpia vacíos y convierte números', () => {
    const defs = [field({ key: 'talla', type: 'select' }), field({ key: 'hijos', type: 'number' }), field({ key: 'nota' }), field({ key: 'tags', type: 'multiselect' })];
    expect(cleanCustomFields(defs, { talla: 'M', hijos: '2', nota: '', tags: [] })).toEqual({ talla: 'M', hijos: 2 });
  });

  it('separa los mensajes que el API junta con "; "', () => {
    expect(splitServerErrors('La CURP no es válida; Ya existe alguien con ese teléfono')).toEqual(['La CURP no es válida', 'Ya existe alguien con ese teléfono']);
  });
});
