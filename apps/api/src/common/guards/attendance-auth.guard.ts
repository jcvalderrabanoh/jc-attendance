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
import { parseAcceptedApps, PlatformSession, ProductRoleMap, resolveProductRole, verifyPlatformToken } from '@jc/platform-sdk';
import * as jwt from 'jsonwebtoken';
import { AUTH_OPTIONS_KEY, AuthOptions } from '../decorators/auth.decorator';
import { ActorRoleEnum } from '../enums';
import { AuthContext, CoreUserContext } from '../interfaces';

/** Lo implementa `CoreLinkService`; se inyecta por token para no acoplar `common` a `core-link`. */
export const ATTENDANCE_ENTITLEMENT = 'ATTENDANCE_ENTITLEMENT';
export interface AttendanceEntitlement {
  hasAttendanceApp(accountId: string): Promise<boolean>;
}

/** Identificador del Checador en `account_apps` de jc-core. */
export const ATTENDANCE_APP = 'attendance';

/**
 * Apps de jc-core cuyas sesiones se aceptan. El mismo usuario entra desde
 * lumen-view (las pantallas del Checador viven en core-front), anestesia o la
 * propia app; lo que decide el acceso es que la CUENTA tenga contratado el
 * Checador (fila activa en `account_apps`), no desde qué app inició sesión.
 */
export function acceptedCoreApps(): string[] {
  return parseAcceptedApps(process.env.ATTENDANCE_ACCEPTED_APPS, ['attendance', 'lumen-view', 'anesthesia']);
}

/**
 * Permisos de producto del Checador en jc-core (`PRODUCT_PERMISSIONS`). No se
 * conceden por rol; el admin de la cuenta no los necesita.
 */
export const ATTENDANCE_PERMISSIONS = {
  manage: 'attendance.manage',
  supervise: 'attendance.supervise',
  inspect: 'attendance.inspect',
  read: 'attendance.read',
} as const;

const ATTENDANCE_ROLES: ProductRoleMap<ActorRoleEnum> = {
  admin: ActorRoleEnum.Admin,
  byPermission: [
    [ATTENDANCE_PERMISSIONS.manage, ActorRoleEnum.Rh],
    [ATTENDANCE_PERMISSIONS.supervise, ActorRoleEnum.Supervisor],
    [ATTENDANCE_PERMISSIONS.inspect, ActorRoleEnum.Inspector],
    [ATTENDANCE_PERMISSIONS.read, ActorRoleEnum.Inspector],
  ],
};

/** Rol dentro del Checador, o `null` si el usuario no tiene acceso al Checador. */
export function resolveAttendanceRole(role: string, permissions: string[]): ActorRoleEnum | null {
  return resolveProductRole(role, permissions, ATTENDANCE_ROLES);
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
      const core = verifyPlatformToken(token, coreSecret, acceptedCoreApps());
      switch (core.status) {
        case 'ok':
          return this.toCoreContext(core.session);
        case 'expired':
          throw new UnauthorizedException('Token expired. Please refresh token');
        case 'app_not_accepted':
          throw new ForbiddenException(`Las sesiones de ${core.app} no pueden usar el Checador`);
        case 'malformed':
          throw new UnauthorizedException('Invalid token');
        case 'not_platform':
          break; // puede ser un token propio (empleado o kiosco)
      }
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

  private toCoreContext(session: PlatformSession): CoreUserContext {
    const attendanceRole = resolveAttendanceRole(session.role, session.permissions);
    if (!attendanceRole) {
      throw new ForbiddenException('Tu usuario no tiene permisos del Checador (attendance.*)');
    }
    return {
      kind: 'core',
      userId: session.userId,
      email: session.email,
      accountId: session.accountId,
      role: session.role,
      permissions: session.permissions,
      attendanceRole,
    };
  }
}
