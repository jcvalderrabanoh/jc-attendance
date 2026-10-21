import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { normalizePagination, PaginatedResult, StatusForEntityEnum, TenantDao } from '../../common';
import { EmployeeIdentity, Employment, OnboardingStatusEnum } from '../entities';

export interface EmploymentListFilters {
  search?: string;
  departmentId?: string;
  locationId?: string;
  status?: StatusForEntityEnum;
  onboardingStatus?: OnboardingStatusEnum;
  /** Filtro exacto por campos personalizados: { talla: 'M' }. */
  customFields?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

export interface EmploymentRow extends Employment {
  identity: EmployeeIdentity;
}

@Injectable()
export class EmployeeIdentityDao {
  constructor(@InjectRepository(EmployeeIdentity) private readonly repository: Repository<EmployeeIdentity>) {}

  findById(id: string): Promise<EmployeeIdentity | null> {
    return this.repository.findOne({ where: { id, status: Not(StatusForEntityEnum.Deleted) } });
  }

  findByIds(ids: string[]): Promise<EmployeeIdentity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repository.find({ where: { id: In(ids) } });
  }

  findByPhone(phoneE164: string): Promise<EmployeeIdentity | null> {
    return this.repository.findOne({ where: { phoneE164, status: Not(StatusForEntityEnum.Deleted) } });
  }

  findByEmail(email: string): Promise<EmployeeIdentity | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase(), status: Not(StatusForEntityEnum.Deleted) } });
  }

  findByCurp(curp: string): Promise<EmployeeIdentity[]> {
    return this.repository.find({ where: { curp: curp.toUpperCase(), status: Not(StatusForEntityEnum.Deleted) } });
  }

  create(data: Partial<EmployeeIdentity>): Promise<EmployeeIdentity> {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: Partial<EmployeeIdentity>): Promise<EmployeeIdentity | null> {
    const current = await this.findById(id);
    if (!current) return null;
    return this.repository.save(this.repository.merge(current, data));
  }
}

@Injectable()
export class EmploymentDao extends TenantDao<Employment> {
  constructor(@InjectRepository(Employment) repository: Repository<Employment>) {
    super(repository);
  }

  findByIdentity(accountId: string, identityId: string): Promise<Employment | null> {
    return this.repository.findOne({ where: { accountId, identityId, ...this.notDeleted() } });
  }

  /** Todos los empleos (de cualquier cuenta) de una identidad: el selector de patrón. */
  findAllForIdentity(identityId: string): Promise<Employment[]> {
    return this.repository.find({ where: { identityId, status: StatusForEntityEnum.Active }, order: { createdAt: 'ASC' } });
  }

  /** Usuario de jc-core que también checa (mismo login para lumen-view y el Checador). */
  findByCoreUser(accountId: string, coreUserId: string): Promise<Employment | null> {
    return this.repository.findOne({ where: { accountId, coreUserId, status: StatusForEntityEnum.Active } });
  }

  findByEmployeeNumber(accountId: string, employeeNumber: string): Promise<Employment | null> {
    return this.repository.findOne({ where: { accountId, employeeNumber, ...this.notDeleted() } });
  }

  findWithPin(accountId: string, id: string): Promise<Employment | null> {
    return this.repository
      .createQueryBuilder('e')
      .addSelect('e.kioskPinHash')
      .where('e.id = :id AND e.accountId = :accountId AND e.status = :active', { id, accountId, active: StatusForEntityEnum.Active })
      .getOne();
  }

  /** Empleado por número + PIN (kiosco): devuelve el empleo con el hash para comparar. */
  findByNumberWithPin(accountId: string, employeeNumber: string): Promise<Employment | null> {
    return this.repository
      .createQueryBuilder('e')
      .addSelect('e.kioskPinHash')
      .where('e.accountId = :accountId AND e.employeeNumber = :employeeNumber AND e.status = :active', {
        accountId,
        employeeNumber,
        active: StatusForEntityEnum.Active,
      })
      .getOne();
  }

  activeIds(accountId: string): Promise<{ id: string }[]> {
    return this.repository.find({
      select: { id: true },
      where: { accountId, status: StatusForEntityEnum.Active, onboardingStatus: OnboardingStatusEnum.Approved },
    });
  }

  async list(accountId: string, f: EmploymentListFilters): Promise<PaginatedResult<EmploymentRow>> {
    const { page, limit, skip } = normalizePagination(f.page, f.limit);
    const qb = this.repository
      .createQueryBuilder('e')
      .innerJoinAndMapOne('e.identity', EmployeeIdentity, 'i', 'i.id = e.identityId')
      .where('e.accountId = :accountId', { accountId })
      .andWhere('e.status != :deleted', { deleted: StatusForEntityEnum.Deleted });
    if (f.status) qb.andWhere('e.status = :status', { status: f.status });
    if (f.onboardingStatus) qb.andWhere('e.onboardingStatus = :ob', { ob: f.onboardingStatus });
    if (f.departmentId) qb.andWhere('e.departmentId = :dep', { dep: f.departmentId });
    if (f.locationId) {
      qb.andWhere('(e.defaultLocationId = :loc OR e.allowedLocationIds @> :locJson::jsonb)', { loc: f.locationId, locJson: JSON.stringify([f.locationId]) });
    }
    if (f.customFields && Object.keys(f.customFields).length) {
      // Usa el índice GIN jsonb_path_ops.
      qb.andWhere('e.customFields @> :cf::jsonb', { cf: JSON.stringify(f.customFields) });
    }
    if (f.search?.trim()) {
      qb.andWhere(
        `(lower(i.firstName || ' ' || i.lastName) LIKE lower(:q) OR i.phoneE164 LIKE :q OR lower(i.email) LIKE lower(:q) OR e.employeeNumber ILIKE :q OR i.curp ILIKE :q)`,
        { q: `%${f.search.trim()}%` },
      );
    }
    const [items, total] = await qb.orderBy('i.lastName', 'ASC').addOrderBy('i.firstName', 'ASC').skip(skip).take(limit).getManyAndCount();
    return { items: items as EmploymentRow[], total, page, limit };
  }
}
