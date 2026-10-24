import { DeepPartial, FindOptionsOrder, FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { StatusForEntityEnum } from './status-for-entity.enum';
import { normalizePagination } from './pagination.helper';
import { PaginatedResult } from '../layers/layer.interfaces';

type TenantRow = { id: string; accountId: string; status?: StatusForEntityEnum };

/**
 * Operaciones estándar de un DAO multi-tenant: toda lectura y escritura exige
 * `accountId` y excluye lo borrado (soft delete). Los DAOs concretos la
 * extienden y añaden sus consultas.
 */
export abstract class TenantDao<T extends TenantRow> {
  protected constructor(protected readonly repository: Repository<T>) {}

  protected notDeleted(): FindOptionsWhere<T> {
    return { status: Not(StatusForEntityEnum.Deleted) } as unknown as FindOptionsWhere<T>;
  }

  findById(accountId: string, id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id, accountId, ...this.notDeleted() } as FindOptionsWhere<T> });
  }

  findByIds(accountId: string, ids: string[]): Promise<T[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repository.find({ where: { id: In(ids), accountId, ...this.notDeleted() } as FindOptionsWhere<T> });
  }

  findAll(accountId: string, where: FindOptionsWhere<T> = {}, order?: FindOptionsOrder<T>): Promise<T[]> {
    return this.repository.find({
      where: { accountId, ...this.notDeleted(), ...where } as FindOptionsWhere<T>,
      order: order ?? ({ createdAt: 'ASC' } as unknown as FindOptionsOrder<T>),
    });
  }

  async findPage(
    accountId: string,
    where: FindOptionsWhere<T> = {},
    page?: number,
    limit?: number,
    order?: FindOptionsOrder<T>,
  ): Promise<PaginatedResult<T>> {
    const p = normalizePagination(page, limit);
    const [items, total] = await this.repository.findAndCount({
      where: { accountId, ...this.notDeleted(), ...where } as FindOptionsWhere<T>,
      order: order ?? ({ createdAt: 'DESC' } as unknown as FindOptionsOrder<T>),
      skip: p.skip,
      take: p.limit,
    });
    return { items, total, page: p.page, limit: p.limit };
  }

  create(data: DeepPartial<T>): Promise<T> {
    return this.repository.save(this.repository.create(data));
  }

  async update(accountId: string, id: string, data: DeepPartial<T>): Promise<T | null> {
    const current = await this.findById(accountId, id);
    if (!current) return null;
    return this.repository.save(this.repository.merge(current, data));
  }

  async softDelete(accountId: string, id: string): Promise<boolean> {
    const result = await this.repository.update({ id, accountId } as FindOptionsWhere<T>, {
      status: StatusForEntityEnum.Deleted,
    } as never);
    return (result.affected ?? 0) > 0;
  }
}
