import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, unwrap } from '../../common';
import { UpsertCatalogItemBluePrint } from '../blueprints';
import { CatalogKind } from '../checkers';
import { AccountSettingsDao, DepartmentDao, PositionDao } from '../daos';
import { UpdateAccountSettingsDto, UpsertCatalogItemDto } from '../dtos';
import { AccountSettings } from '../entities';
import { BootstrapAccountProcess } from '../processes';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly upsertCatalogItem: UpsertCatalogItemBluePrint,
    private readonly bootstrapAccount: BootstrapAccountProcess,
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  /** Configuración de la cuenta; la crea (y siembra valores por defecto) la primera vez. */
  getSettings(accountId: string): Promise<AccountSettings> {
    return this.bootstrapAccount.process(accountId);
  }

  async updateSettings(accountId: string, dto: UpdateAccountSettingsDto, actor: AuthContext): Promise<AccountSettings> {
    const before = await this.getSettings(accountId);
    const saved = await this.accountSettingsDao.upsert(accountId, dto);
    await this.audit.process({ accountId, actor, entity: 'account_settings', entityId: null, action: 'update', before, after: saved });
    return saved;
  }

  list(kind: CatalogKind, accountId: string) {
    return kind === 'department'
      ? this.departmentDao.findAll(accountId, {}, { name: 'ASC' })
      : this.positionDao.findAll(accountId, {}, { name: 'ASC' });
  }

  async upsert(kind: CatalogKind, accountId: string, dto: UpsertCatalogItemDto, actor: AuthContext, id?: string) {
    return unwrap(await this.upsertCatalogItem.execute({ kind, accountId, dto, actor, id }));
  }

  async remove(kind: CatalogKind, accountId: string, id: string, actor: AuthContext): Promise<{ deleted: boolean }> {
    const dao = kind === 'department' ? this.departmentDao : this.positionDao;
    const deleted = await dao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: kind, entityId: id, action: 'delete' });
    return { deleted };
  }
}
