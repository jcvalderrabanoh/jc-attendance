import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { fail, found, ok, unwrap, unwrapProcess } from './result.helper';

describe('result helpers', () => {
  it('unwrap devuelve el dato de un resultado válido', () => {
    expect(unwrap(ok(5))).toBe(5);
  });

  it('unwrap traduce el mensaje a la excepción HTTP', () => {
    expect(() => unwrap(fail('El empleado no existe'))).toThrow(NotFoundException);
    expect(() => unwrap(fail('La CURP ya existe'))).toThrow(ConflictException);
    expect(() => unwrap(fail('Formato inválido'))).toThrow(BadRequestException);
  });

  it('unwrapProcess y found', () => {
    expect(unwrapProcess({ success: true, data: 'x' })).toBe('x');
    expect(() => unwrapProcess({ success: false, error: 'mal' })).toThrow(BadRequestException);
    expect(() => found(null)).toThrow(NotFoundException);
    expect(found(0)).toBe(0);
  });
});
