import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok } from '../../common';
import { CustomFieldChecker } from '../checkers';
import { CustomFieldDefinitionDao } from '../daos';
import { UpsertCustomFieldDto } from '../dtos';
import { CustomFieldDefinition } from '../entities';

export interface UpsertCustomFieldInput {
  accountId: string;
  id?: string;
  dto: UpsertCustomFieldDto;
  actor: AuthContext;
}

@Injectable()
export class UpsertCustomFieldBluePrint implements BasicBluePrintInterface<UpsertCustomFieldInput, CustomFieldDefinition> {
  constructor(
    private readonly checker: CustomFieldChecker,
    private readonly dao: CustomFieldDefinitionDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute({ accountId, id, dto, actor }: UpsertCustomFieldInput): Promise<CheckRulesAndProcessInterfaceResult<CustomFieldDefinition>> {
    const errors = await this.checker.validateUpsert(accountId, dto, id);
    if (errors.length) return fail(...errors);
    const data = { ...dto, options: dto.options ?? [], validation: dto.validation ?? {} };
    // Solo los campos editables por el empleado pueden pedirse en la liga de alta.
    if (data.askOnOnboarding) data.editableByEmployee = true;
    const saved = id ? await this.dao.update(accountId, id, data) : await this.dao.create({ ...data, accountId });
    await this.audit.process({ accountId, actor, entity: 'custom_field', entityId: saved!.id, action: id ? 'update' : 'create', after: saved });
    return ok(saved!);
  }
}
