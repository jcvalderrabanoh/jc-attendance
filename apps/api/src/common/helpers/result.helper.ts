import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CheckRulesAndProcessInterfaceResult, ProcessInterfaceResult } from '../interfaces';

export const ok = <T>(data: T): CheckRulesAndProcessInterfaceResult<T> => ({ isValid: true, constraints: [], data });

export const fail = <T>(...errors: string[]): CheckRulesAndProcessInterfaceResult<T> => ({
  isValid: false,
  constraints: errors.map((error) => ({ success: false, error })),
});

/** Convierte el resultado de un blueprint en la respuesta HTTP (o la excepción). */
export function unwrap<T>(result: CheckRulesAndProcessInterfaceResult<T>): T {
  if (result.isValid) return result.data as T;
  const message = result.constraints.map((c: ProcessInterfaceResult<T>) => c.error).filter(Boolean).join('; ');
  if (/no existe|no encontrad/i.test(message)) throw new NotFoundException(message);
  if (/ya existe|duplicad|ya está/i.test(message)) throw new ConflictException(message);
  throw new BadRequestException(message || 'Operación inválida');
}
