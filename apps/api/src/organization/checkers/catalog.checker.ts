import { Injectable } from '@nestjs/common';
import { DepartmentDao, PositionDao } from '../daos';

export type CatalogKind = 'department' | 'position';

/** Nombre único por cuenta y padre existente (departamentos). */
@Injectable()
export class CatalogChecker {
  constructor(
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
  ) {}

  async validate(kind: CatalogKind, accountId: string, name: string, id?: string, parentId?: string): Promise<string[]> {
    const errors: string[] = [];
    if (!name?.trim()) errors.push('El nombre es obligatorio');
    const dao = kind === 'department' ? this.departmentDao : this.positionDao;
    const existing = name ? await dao.findByName(accountId, name) : null;
    if (existing && existing.id !== id) {
      errors.push(`Ya existe ${kind === 'department' ? 'un departamento' : 'un puesto'} con ese nombre`);
    }
    if (kind === 'department' && parentId) {
      if (parentId === id) errors.push('Un departamento no puede ser su propio padre');
      else if (!(await this.departmentDao.findById(accountId, parentId))) {
        errors.push('El departamento padre no existe');
      }
    }
    return errors;
  }
}
