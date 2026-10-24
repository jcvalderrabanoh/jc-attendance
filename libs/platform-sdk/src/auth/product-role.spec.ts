import { ProductRoleMap, resolveProductRole } from './product-role';

const MAP: ProductRoleMap<string> = {
  admin: 'admin',
  byPermission: [
    ['x.manage', 'manager'],
    ['x.read', 'reader'],
  ],
};

describe('resolveProductRole', () => {
  it('el admin de la cuenta entra con el rol de admin sin permisos', () => {
    expect(resolveProductRole('admin', [], MAP)).toBe('admin');
  });

  it('gana el permiso más alto', () => {
    expect(resolveProductRole('staff', ['x.read', 'x.manage'], MAP)).toBe('manager');
    expect(resolveProductRole('staff', ['x.read'], MAP)).toBe('reader');
  });

  it('sin permisos del producto no hay acceso', () => {
    expect(resolveProductRole('staff', ['otro.read'], MAP)).toBeNull();
  });
});
