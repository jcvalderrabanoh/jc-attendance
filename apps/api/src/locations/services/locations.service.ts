import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, found, unwrap, unwrapProcess } from '../../common';
import { UpsertLocationBluePrint } from '../blueprints';
import { DeviceDao, LocationDao } from '../daos';
import { CreateKioskDto, UpsertLocationDto } from '../dtos';
import { DeviceKindEnum } from '../entities';
import { ActivateKioskProcess, CreateKioskProcess, KioskQrProcess } from '../processes';

@Injectable()
export class LocationsService {
  constructor(
    private readonly upsertLocation: UpsertLocationBluePrint,
    private readonly locationDao: LocationDao,
    private readonly deviceDao: DeviceDao,
    private readonly createKiosk: CreateKioskProcess,
    private readonly activateKiosk: ActivateKioskProcess,
    private readonly kioskQr: KioskQrProcess,
    private readonly audit: RecordAuditProcess,
  ) {}

  list(accountId: string) {
    return this.locationDao.findAll(accountId, {}, { name: 'ASC' });
  }

  async get(accountId: string, id: string) {
    return found(await this.locationDao.findById(accountId, id), 'La sucursal no existe');
  }

  async upsert(accountId: string, dto: UpsertLocationDto, actor: AuthContext, id?: string) {
    return unwrap(await this.upsertLocation.execute({ accountId, dto, actor, id }));
  }

  async remove(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.locationDao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'location', entityId: id, action: 'delete' });
    return { deleted };
  }

  listKiosks(accountId: string) {
    return this.deviceDao.findAll(accountId, { kind: DeviceKindEnum.Kiosk });
  }

  async createKioskDevice(accountId: string, dto: CreateKioskDto, actor: AuthContext) {
    await this.get(accountId, dto.locationId);
    const result = await this.createKiosk.process(accountId, dto.name, dto.locationId);
    await this.audit.process({ accountId, actor, entity: 'device', entityId: result.data!.device.id, action: 'create' });
    const { device, activationCode } = result.data!;
    return { id: device.id, name: device.name, locationId: device.locationId, activationCode, activationExpiresAt: device.activationExpiresAt };
  }

  async activate(code: string) {
    return unwrapProcess(await this.activateKiosk.process(code));
  }

  async qr(accountId: string, deviceId: string) {
    return unwrapProcess(await this.kioskQr.process(accountId, deviceId));
  }

  async revokeDevice(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.deviceDao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'device', entityId: id, action: 'revoke' });
    return { deleted };
  }
}
