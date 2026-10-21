import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthContext } from '../interfaces';

/** Sesión completa (`core`, `employee` o `kiosk`). */
export const CurrentAuth = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthContext => {
  return ctx.switchToHttp().getRequest().auth;
});

/** `accountId` de la sesión. Falla si un empleado aún no eligió patrón. */
export const AccountId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const auth: AuthContext = ctx.switchToHttp().getRequest().auth;
  if (!auth?.accountId) {
    throw new ForbiddenException('Elige primero la cuenta (patrón) con la que trabajas');
  }
  return auth.accountId;
});
