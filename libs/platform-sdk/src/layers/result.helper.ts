import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CheckRulesAndProcessInterfaceResult, ProcessInterfaceResult } from './layer.interfaces';

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

/** Igual que `unwrap` para el resultado de un process. */
export function unwrapProcess<T>(result: ProcessInterfaceResult<T>): T {
  return unwrap(result.success ? ok(result.data as T) : fail<T>(result.error ?? 'Operación inválida'));
}

/** Lanza 404 si no hay registro. */
export function found<T>(value: T | null | undefined, message = 'El registro no existe'): T {
  if (value == null) throw new NotFoundException(message);
  return value;
}
