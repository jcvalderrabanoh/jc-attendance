import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, unwrap } from '../../common';
import { UpsertCustomFieldBluePrint } from '../blueprints';
import { CustomFieldDefinitionDao } from '../daos';
import { UpsertCustomFieldDto } from '../dtos';
import { CustomFieldEntityEnum } from '../entities';
import { CustomFieldValuesRule, ValidateValuesOptions } from '../rules';

@Injectable()
export class CustomFieldsService {
  constructor(
    private readonly upsertBluePrint: UpsertCustomFieldBluePrint,
    private readonly dao: CustomFieldDefinitionDao,
    private readonly valuesRule: CustomFieldValuesRule,
    private readonly audit: RecordAuditProcess,
  ) {}

  list(accountId: string, entity?: CustomFieldEntityEnum) {
    return entity ? this.dao.findForEntity(accountId, entity) : this.dao.findAll(accountId, {}, { entity: 'ASC', sortOrder: 'ASC' });
  }

  async upsert(accountId: string, dto: UpsertCustomFieldDto, actor: AuthContext, id?: string) {
    return unwrap(await this.upsertBluePrint.execute({ accountId, dto, actor, id }));
  }

  async remove(accountId: string, id: string, actor: AuthContext) {
    // Soft delete: los valores capturados se conservan para el histórico.
    const deleted = await this.dao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'custom_field', entityId: id, action: 'delete' });
    return { deleted };
  }

  /** Lo usan empleados, altas y sucursales para validar `customFields`. */
  async validateValues(accountId: string, entity: CustomFieldEntityEnum, values: Record<string, unknown> | undefined, options?: ValidateValuesOptions) {
    const definitions = await this.dao.findForEntity(accountId, entity);
    return this.valuesRule.validate(definitions, values, options);
  }
}
