import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ActorRoleEnum } from '../enums';
import { AttendanceAuthGuard, resolveAttendanceRole } from './attendance-auth.guard';

describe('AttendanceAuthGuard', () => {
  const env = { ...process.env };
  beforeAll(() => {
    process.env.JWT_SECRET = 'core';
    process.env.EMPLOYEE_JWT_SECRET = 'own';
    delete process.env.ATTENDANCE_ACCEPTED_APPS;
  });
  afterAll(() => (process.env = env));

  const core = (claims: object) => jwt.sign({ userId: 'u1', accountId: 'a1', email: 'x@y.z', role: 'admin', permissions: [], ...claims }, 'core');
  const guardWith = (entitled: boolean) =>
    new AttendanceAuthGuard(new Reflector(), { hasAttendanceApp: async () => entitled });

  it('acepta sesiones de lumen-view, anestesia y del Checador (mismo usuario en todos los sistemas)', () => {
    const guard = guardWith(true);
    for (const app of ['lumen-view', 'anesthesia', 'attendance']) {
      expect(guard.decode(core({ app })).kind).toBe('core');
    }
    // Tokens viejos sin claim app = lumen-view.
    expect(guard.decode(core({})).kind).toBe('core');
  });

  it('rechaza apps no aceptadas', () => {
    expect(() => guardWith(true).decode(core({ app: 'otra' }))).toThrow(ForbiddenException);
  });

  it('distingue tokens de empleado y de kiosco', () => {
    const guard = guardWith(true);
    expect(guard.decode(jwt.sign({ scope: 'employee', identityId: 'i1' }, 'own')).kind).toBe('employee');
    expect(guard.decode(jwt.sign({ scope: 'kiosk', deviceId: 'd1', accountId: 'a1' }, 'own')).kind).toBe('kiosk');
    expect(() => guard.decode(jwt.sign({ scope: 'employee', identityId: 'i1' }, 'otra'))).toThrow(UnauthorizedException);
  });

  it('mapea permisos de producto de jc-core a roles del Checador', () => {
    expect(resolveAttendanceRole('admin', [])).toBe(ActorRoleEnum.Admin);
    expect(resolveAttendanceRole('staff', ['attendance.read', 'attendance.manage'])).toBe(ActorRoleEnum.Rh);
    expect(resolveAttendanceRole('staff', ['attendance.supervise'])).toBe(ActorRoleEnum.Supervisor);
    expect(resolveAttendanceRole('staff', ['attendance.inspect'])).toBe(ActorRoleEnum.Inspector);
    expect(resolveAttendanceRole('staff', ['attendance.read'])).toBe(ActorRoleEnum.Inspector);
    expect(resolveAttendanceRole('staff', ['studies.read'])).toBeNull();
  });

  it('un usuario sin permisos del Checador no entra aunque la cuenta lo tenga', () => {
    expect(() => guardWith(true).decode(core({ role: 'staff', permissions: ['studies.read'] }))).toThrow(ForbiddenException);
  });
});
