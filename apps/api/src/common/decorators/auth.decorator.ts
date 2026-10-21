import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceAuthGuard } from '../guards/attendance-auth.guard';
import { ActorRoleEnum } from '../enums';

export const AUTH_OPTIONS_KEY = 'attendance:auth';

export interface AuthOptions {
  kinds: Array<'core' | 'employee' | 'kiosk'>;
  roles?: ActorRoleEnum[];
}

/**
 * Protege un endpoint. Sin argumentos: solo usuarios de jc-core con cualquier
 * rol. `@Auth({ kinds: ['employee'] })` para la app del empleado.
 */
export const Auth = (options: Partial<AuthOptions> = {}) =>
  applyDecorators(
    SetMetadata(AUTH_OPTIONS_KEY, { kinds: options.kinds ?? ['core'], roles: options.roles }),
    UseGuards(AttendanceAuthGuard),
    ApiBearerAuth(),
  );

/** Atajo: solo quien configura la cuenta (dueño/admin y RH). */
export const ManagersOnly = () => Auth({ roles: [ActorRoleEnum.Admin, ActorRoleEnum.Rh] });

/** Atajo: quien opera el día a día (sin inspector). */
export const Operators = () =>
  Auth({ roles: [ActorRoleEnum.Admin, ActorRoleEnum.Rh, ActorRoleEnum.Supervisor] });
