import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AUTH_OPTIONS_KEY, AuthOptions } from '../decorators/auth.decorator';
import { ActorRoleEnum } from '../enums';
import { AuthContext, CoreUserContext } from '../interfaces';

/** Lo implementa `CoreLinkService`; se inyecta por token para no acoplar `common` a `core-link`. */
export const ATTENDANCE_ENTITLEMENT = 'ATTENDANCE_ENTITLEMENT';
export interface AttendanceEntitlement {
  hasAttendanceApp(accountId: string): Promise<boolean>;
}

/** Claim `app` que exige este servicio en los tokens de jc-core. */
export const ATTENDANCE_APP = 'attendance';

/** Permisos de jc-core que dan un rol dentro del Checador. */
export const ATTENDANCE_PERMISSIONS = {
  rh: 'attendance:rh',
  supervisor: 'attendance:supervisor',
  inspector: 'attendance:inspector',
} as const;

export function resolveAttendanceRole(role: string, permissions: string[]): ActorRoleEnum {
  if (role === 'admin') return ActorRoleEnum.Admin;
  if (permissions.includes(ATTENDANCE_PERMISSIONS.rh)) return ActorRoleEnum.Rh;
  if (permissions.includes(ATTENDANCE_PERMISSIONS.inspector)) return ActorRoleEnum.Inspector;
  // Por defecto un usuario de jc-core con la app contratada supervisa: ve y
  // aprueba, pero no configura la cuenta.
  return ActorRoleEnum.Supervisor;
}

/**
 * Un solo guard para los tres tipos de sesión:
 * - `core`: JWT de jc-core (mismo `JWT_SECRET`) con `app = attendance`.
 * - `employee` / `kiosk`: JWT propio firmado con `EMPLOYEE_JWT_SECRET`.
 * El decorador `@Auth()` dice qué tipos y roles acepta el endpoint.
 */
@Injectable()
export class AttendanceAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(ATTENDANCE_ENTITLEMENT) private readonly entitlement?: AttendanceEntitlement,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<AuthOptions>(AUTH_OPTIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }
    const auth = this.decode(header.slice(7));

    if (!options.kinds.includes(auth.kind)) {
      throw new ForbiddenException('Este tipo de sesión no puede usar este recurso');
    }
    if (auth.kind === 'core' && options.roles?.length && !options.roles.includes(auth.attendanceRole)) {
      throw new ForbiddenException('Tu rol no permite esta acción');
    }
    // Sesión válida no basta: la cuenta tiene que tener el Checador contratado
    // (fila activa en public.account_apps), igual que el AppAccessGuard de jc-core.
    if (auth.kind === 'core' && this.entitlement && !(await this.entitlement.hasAttendanceApp(auth.accountId))) {
      throw new ForbiddenException('La cuenta no tiene contratado el Checador');
    }
    request.auth = auth;
    return true;
  }

  decode(token: string): AuthContext {
    const coreSecret = process.env.JWT_SECRET;
    const ownSecret = process.env.EMPLOYEE_JWT_SECRET;
    if (coreSecret) {
      const core = this.tryVerify(token, coreSecret);
      if (core) return this.toCoreContext(core);
    }
    if (ownSecret) {
      const own = this.tryVerify(token, ownSecret);
      if (own?.scope === 'employee' && own.identityId) {
        return {
          kind: 'employee',
          identityId: own.identityId,
          employmentId: own.employmentId ?? null,
          accountId: own.accountId ?? null,
        };
      }
      if (own?.scope === 'kiosk' && own.deviceId && own.accountId) {
        return { kind: 'kiosk', deviceId: own.deviceId, accountId: own.accountId, locationId: own.locationId ?? null };
      }
    }
    throw new UnauthorizedException('Invalid token');
  }

  private tryVerify(token: string, secret: string): any | null {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired. Please refresh token');
      }
      return null;
    }
  }

  private toCoreContext(payload: any): CoreUserContext {
    if (payload.app !== ATTENDANCE_APP) {
      throw new ForbiddenException('La sesión no es del Checador (app != attendance)');
    }
    if (!payload.userId || !payload.accountId) {
      throw new UnauthorizedException('Invalid token');
    }
    const permissions: string[] = Array.isArray(payload.permissions) ? payload.permissions : [];
    return {
      kind: 'core',
      userId: payload.userId,
      email: payload.email,
      accountId: payload.accountId,
      role: payload.role ?? 'staff',
      permissions,
      attendanceRole: resolveAttendanceRole(payload.role ?? 'staff', permissions),
    };
  }
}
