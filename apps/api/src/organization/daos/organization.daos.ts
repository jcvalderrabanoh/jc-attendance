import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantDao } from '../../common';
import { AccountSettings, Department, Position } from '../entities';

@Injectable()
export class DepartmentDao extends TenantDao<Department> {
  constructor(@InjectRepository(Department) repository: Repository<Department>) {
    super(repository);
  }

  findByName(accountId: string, name: string): Promise<Department | null> {
    return this.repository
      .createQueryBuilder('d')
      .where('d.accountId = :accountId AND lower(d.name) = lower(:name) AND d.status != :deleted', {
        accountId,
        name: name.trim(),
        deleted: 'deleted',
      })
      .getOne();
  }
}

@Injectable()
export class PositionDao extends TenantDao<Position> {
  constructor(@InjectRepository(Position) repository: Repository<Position>) {
    super(repository);
  }

  findByName(accountId: string, name: string): Promise<Position | null> {
    return this.repository
      .createQueryBuilder('p')
      .where('p.accountId = :accountId AND lower(p.name) = lower(:name) AND p.status != :deleted', {
        accountId,
        name: name.trim(),
        deleted: 'deleted',
      })
      .getOne();
  }
}

/** Upsert, igual que el DAO de enterprise-config de jc-core. */
@Injectable()
export class AccountSettingsDao {
  constructor(@InjectRepository(AccountSettings) private readonly repository: Repository<AccountSettings>) {}

  findByAccount(accountId: string): Promise<AccountSettings | null> {
    return this.repository.findOne({ where: { accountId } });
  }

  async upsert(accountId: string, data: Partial<AccountSettings>): Promise<AccountSettings> {
    const current = await this.findByAccount(accountId);
    const entity = current ? this.repository.merge(current, data) : this.repository.create({ ...data, accountId });
    return this.repository.save(entity);
  }
}
