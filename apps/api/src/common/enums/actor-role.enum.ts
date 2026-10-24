/**
 * Roles dentro del Checador. Admin/Rh/Supervisor/Inspector son usuarios de
 * jc-core (su `role` llega en el JWT); Employee es la identidad propia del
 * Checador (token de empleado).
 */
export enum ActorRoleEnum {
  Admin = 'admin',
  Rh = 'rh',
  Supervisor = 'supervisor',
  Inspector = 'inspector',
  Employee = 'employee',
}
