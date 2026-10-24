import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusForEntityEnum, TenantDao } from '../../common';
import { Device, DeviceKindEnum, Location } from '../entities';

@Injectable()
export class LocationDao extends TenantDao<Location> {
  constructor(@InjectRepository(Location) repository: Repository<Location>) {
    super(repository);
  }

  findByName(accountId: string, name: string): Promise<Location | null> {
    return this.repository
      .createQueryBuilder('l')
      .where('l.accountId = :accountId AND lower(l.name) = lower(:name) AND l.status != :deleted', {
        accountId,
        name: name.trim(),
        deleted: StatusForEntityEnum.Deleted,
      })
      .getOne();
  }
}

@Injectable()
export class DeviceDao extends TenantDao<Device> {
  constructor(@InjectRepository(Device) repository: Repository<Device>) {
    super(repository);
  }

  /** Busca kioscos pendientes de activar con ese código (hash). Sin accountId: el código es la llave. */
  findPendingKioskByCode(codeHash: string): Promise<Device | null> {
    return this.repository.findOne({
      where: { activationCodeHash: codeHash, kind: DeviceKindEnum.Kiosk, status: StatusForEntityEnum.Active },
    });
  }

  findWithSecret(accountId: string, id: string): Promise<Device | null> {
    return this.repository
      .createQueryBuilder('d')
      .addSelect('d.secret')
      .where('d.id = :id AND d.accountId = :accountId AND d.status = :active', { id, accountId, active: StatusForEntityEnum.Active })
      .getOne();
  }

  async touch(id: string): Promise<void> {
    await this.repository.update({ id }, { lastSeenAt: new Date() });
  }
}
