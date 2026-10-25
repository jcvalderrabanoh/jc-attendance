import { EmployeeChecker } from './employee.checker';

const ACCOUNT = 'acc-1';
const USER = 'user-1';

function build(opts: { activeUser?: boolean; linkedTo?: { id: string; identityId: string } | null } = {}) {
  const coreLink = { findActiveUser: jest.fn().mockResolvedValue(opts.activeUser === false ? null : { id: USER }) };
  const employmentDao = { findByCoreUser: jest.fn().mockResolvedValue(opts.linkedTo ?? null) };
  const identityDao = { findById: jest.fn().mockResolvedValue({ firstName: 'Juan', lastName: 'Pérez' }) };
  const none = {} as never;
  const checker = new EmployeeChecker(employmentDao as never, identityDao as never, none, none, none, none, none, coreLink as never);
  return { checker, coreLink, employmentDao };
}

describe('EmployeeChecker.validateCoreUserLink', () => {
  it('sin usuario (o desenlazando con null) no valida nada', async () => {
    const { checker, coreLink } = build();
    expect(await checker.validateCoreUserLink(ACCOUNT, undefined)).toEqual([]);
    expect(await checker.validateCoreUserLink(ACCOUNT, null, { id: 'emp-1', coreUserId: USER })).toEqual([]);
    expect(coreLink.findActiveUser).not.toHaveBeenCalled();
  });

  it('usuario activo de la cuenta y libre → válido', async () => {
    const { checker, coreLink } = build();
    expect(await checker.validateCoreUserLink(ACCOUNT, USER)).toEqual([]);
    expect(coreLink.findActiveUser).toHaveBeenCalledWith(ACCOUNT, USER);
  });

  it('usuario inexistente, de otra cuenta o inactivo → error', async () => {
    const { checker } = build({ activeUser: false });
    expect(await checker.validateCoreUserLink(ACCOUNT, USER)).toEqual(['El usuario de lumen-view no existe en la cuenta o está inactivo']);
  });

  it('ya enlazado a otro empleado activo → error con su nombre', async () => {
    const { checker } = build({ linkedTo: { id: 'emp-2', identityId: 'id-2' } });
    expect(await checker.validateCoreUserLink(ACCOUNT, USER)).toEqual(['Ese usuario de lumen-view ya está enlazado a Juan Pérez']);
    expect(await checker.validateCoreUserLink(ACCOUNT, USER, { id: 'emp-1', coreUserId: null })).toHaveLength(1);
  });

  it('el mismo empleo puede reenlazarse a su usuario', async () => {
    const { checker } = build({ linkedTo: { id: 'emp-1', identityId: 'id-1' } });
    expect(await checker.validateCoreUserLink(ACCOUNT, USER, { id: 'emp-1', coreUserId: null })).toEqual([]);
  });

  it('si el enlace no cambia no se revalida (una baja en jc-core no bloquea editar)', async () => {
    const { checker, coreLink } = build({ activeUser: false });
    expect(await checker.validateCoreUserLink(ACCOUNT, USER, { id: 'emp-1', coreUserId: USER })).toEqual([]);
    expect(coreLink.findActiveUser).not.toHaveBeenCalled();
  });
});
