import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok } from '../../common';
import { CatalogChecker, CatalogKind } from '../checkers';
import { DepartmentDao, PositionDao } from '../daos';
import { UpsertCatalogItemDto } from '../dtos';
import { Department, Position } from '../entities';

export interface UpsertCatalogItemInput {
  kind: CatalogKind;
  accountId: string;
  id?: string;
  dto: UpsertCatalogItemDto;
  actor: AuthContext;
}

/** Crea o actualiza un departamento o puesto. */
@Injectable()
export class UpsertCatalogItemBluePrint
  implements BasicBluePrintInterface<UpsertCatalogItemInput, Department | Position>
{
  constructor(
    private readonly checker: CatalogChecker,
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute(input: UpsertCatalogItemInput): Promise<CheckRulesAndProcessInterfaceResult<Department | Position>> {
    const { kind, accountId, id, dto, actor } = input;
    const errors = await this.checker.validate(kind, accountId, dto.name, id, dto.parentId);
    if (errors.length) return fail(...errors);

    const data =
      kind === 'department'
        ? { name: dto.name.trim(), code: dto.code ?? null, parentId: dto.parentId ?? null }
        : { name: dto.name.trim(), code: dto.code ?? null };
    let saved: Department | Position | null;
    if (kind === 'department') {
      saved = id ? await this.departmentDao.update(accountId, id, data) : await this.departmentDao.create({ ...data, accountId });
    } else {
      saved = id ? await this.positionDao.update(accountId, id, data) : await this.positionDao.create({ ...data, accountId });
    }
    if (!saved) return fail('El registro no existe');
    await this.audit.process({ accountId, actor, entity: kind, entityId: saved.id, action: id ? 'update' : 'create', after: saved });
    return ok(saved);
  }
}
