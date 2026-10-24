/**
 * Permisos de producto (`PRODUCT_PERMISSIONS` de jc-core: `attendance.*`,
 * `anesthesia.*`…) → rol dentro del producto. No se conceden por rol de
 * plataforma; el admin de la cuenta entra con el rol de mayor nivel.
 */
export interface ProductRoleMap<R> {
  /** Rol que recibe el admin de la cuenta. */
  admin: R;
  /** Del permiso más alto al más bajo; gana el primero que tenga el usuario. */
  byPermission: ReadonlyArray<readonly [permission: string, role: R]>;
}

/** Rol del usuario en el producto, o `null` si no tiene acceso a él. */
export function resolveProductRole<R>(role: string, permissions: readonly string[], map: ProductRoleMap<R>): R | null {
  if (role === 'admin') return map.admin;
  for (const [permission, productRole] of map.byPermission) {
    if (permissions.includes(permission)) return productRole;
  }
  return null;
}
