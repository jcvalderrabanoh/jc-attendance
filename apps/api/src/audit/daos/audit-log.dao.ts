import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePagination, PaginatedResult } from '../../common';
import { AuditLog } from '../entities';

@Injectable()
export class AuditLogDao {
  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  insert(entry: Partial<AuditLog>): Promise<AuditLog> {
    return this.repository.save(this.repository.create(entry));
  }

  async findPage(
    accountId: string,
    filters: { entity?: string; entityId?: string; page?: number; limit?: number },
  ): Promise<PaginatedResult<AuditLog>> {
    const { page, limit, skip } = normalizePagination(filters.page, filters.limit);
    const where: Record<string, unknown> = { accountId };
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    const [items, total] = await this.repository.findAndCount({ where, order: { at: 'DESC' }, skip, take: limit });
    return { items, total, page, limit };
  }
}
