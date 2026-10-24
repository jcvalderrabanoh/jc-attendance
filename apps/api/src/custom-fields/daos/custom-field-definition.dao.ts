import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantDao } from '../../common';
import { CustomFieldDefinition, CustomFieldEntityEnum } from '../entities';

@Injectable()
export class CustomFieldDefinitionDao extends TenantDao<CustomFieldDefinition> {
  constructor(@InjectRepository(CustomFieldDefinition) repository: Repository<CustomFieldDefinition>) {
    super(repository);
  }

  findForEntity(accountId: string, entity: CustomFieldEntityEnum): Promise<CustomFieldDefinition[]> {
    return this.findAll(accountId, { entity }, { sortOrder: 'ASC', createdAt: 'ASC' });
  }

  findByKey(accountId: string, entity: CustomFieldEntityEnum, key: string): Promise<CustomFieldDefinition | null> {
    return this.repository.findOne({ where: { accountId, entity, key, ...this.notDeleted() } });
  }

  /** ¿Hay algún registro con valor para esa clave? (la clave deja de poder cambiar). */
  async keyHasValues(accountId: string, entity: CustomFieldEntityEnum, key: string): Promise<boolean> {
    const table = { employment: 'employments', location: 'locations', punch: 'punches', request: 'requests' }[entity];
    const rows = await this.repository.query(
      `SELECT 1 FROM "attendance"."${table}" WHERE "accountId" = $1 AND "customFields" ? $2 LIMIT 1`,
      [accountId, key],
    );
    return rows.length > 0;
  }
}
