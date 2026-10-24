import * as jwt from 'jsonwebtoken';
import { parseAcceptedApps, verifyPlatformToken } from './platform-session';

const SECRET = 'core-secret';
const APPS = ['attendance', 'lumen-view'];
const sign = (payload: object, options: jwt.SignOptions = {}) => jwt.sign(payload, SECRET, options);
const BASE = { userId: 'u1', email: 'rh@x.mx', accountId: 'a1', role: 'staff', permissions: ['attendance.read'] };

describe('verifyPlatformToken', () => {
  it('devuelve la sesión de un token de jc-core de una app aceptada', () => {
    expect(verifyPlatformToken(sign({ ...BASE, app: 'attendance' }), SECRET, APPS)).toEqual({
      status: 'ok',
      session: { ...BASE, app: 'attendance' },
    });
  });

  it('trata como lumen-view los tokens sin claim app', () => {
    const result = verifyPlatformToken(sign(BASE), SECRET, APPS);
    expect(result).toMatchObject({ status: 'ok', session: { app: 'lumen-view' } });
  });

  it('rechaza sesiones de apps no aceptadas', () => {
    expect(verifyPlatformToken(sign({ ...BASE, app: 'anesthesia' }), SECRET, APPS)).toEqual({
      status: 'app_not_accepted',
      app: 'anesthesia',
    });
  });

  it('distingue vencido de no firmado por jc-core', () => {
    expect(verifyPlatformToken(sign(BASE, { expiresIn: -10 }), SECRET, APPS)).toEqual({ status: 'expired' });
    expect(verifyPlatformToken(jwt.sign(BASE, 'otro'), SECRET, APPS)).toEqual({ status: 'not_platform' });
    expect(verifyPlatformToken('basura', SECRET, APPS)).toEqual({ status: 'not_platform' });
  });

  it('marca como malformado un token sin cuenta', () => {
    expect(verifyPlatformToken(sign({ userId: 'u1' }), SECRET, APPS)).toEqual({ status: 'malformed' });
  });

  it('normaliza rol y permisos ausentes', () => {
    const result = verifyPlatformToken(sign({ userId: 'u1', accountId: 'a1' }), SECRET, APPS);
    expect(result).toMatchObject({ status: 'ok', session: { role: 'staff', permissions: [], email: '' } });
  });
});

describe('parseAcceptedApps', () => {
  it('usa la lista de la variable o el valor por defecto', () => {
    expect(parseAcceptedApps(' attendance , anesthesia ', ['x'])).toEqual(['attendance', 'anesthesia']);
    expect(parseAcceptedApps(undefined, ['x'])).toEqual(['x']);
    expect(parseAcceptedApps('', ['x'])).toEqual(['x']);
  });
});
