import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok } from '../../common';
import { LocationChecker } from '../checkers';
import { LocationDao } from '../daos';
import { UpsertLocationDto } from '../dtos';
import { GeofenceKindEnum, Location } from '../entities';

export interface UpsertLocationInput {
  accountId: string;
  id?: string;
  dto: UpsertLocationDto;
  actor: AuthContext;
}

@Injectable()
export class UpsertLocationBluePrint implements BasicBluePrintInterface<UpsertLocationInput, Location> {
  constructor(
    private readonly checker: LocationChecker,
    private readonly locationDao: LocationDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute({ accountId, id, dto, actor }: UpsertLocationInput): Promise<CheckRulesAndProcessInterfaceResult<Location>> {
    const errors = await this.checker.validateUpsert(accountId, dto, id);
    if (errors.length) return fail(...errors);
    const before = id ? await this.locationDao.findById(accountId, id) : null;
    if (id && !before) return fail('La sucursal no existe');
    const data = { ...dto, name: dto.name.trim(), geofenceKind: dto.geofenceKind ?? GeofenceKindEnum.Circle };
    const saved = id ? await this.locationDao.update(accountId, id, data) : await this.locationDao.create({ ...data, accountId });
    await this.audit.process({ accountId, actor, entity: 'location', entityId: saved!.id, action: id ? 'update' : 'create', before, after: saved });
    return ok(saved!);
  }
}
