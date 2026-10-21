import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { normalizePagination, PaginatedResult } from '../../common';
import { Punch, PunchPhoto, PunchReviewStatusEnum } from '../entities';

export interface PunchListFilters {
  from?: Date;
  to?: Date;
  employmentId?: string;
  locationId?: string;
  reviewStatus?: PunchReviewStatusEnum;
  flaggedOnly?: boolean;
  page?: number;
  limit?: number;
}

/** Marcajes: solo inserción y cambio de revisión (el trigger de BD impide lo demás). */
@Injectable()
export class PunchDao {
  constructor(@InjectRepository(Punch) private readonly repository: Repository<Punch>) {}

  insert(data: Partial<Punch>): Promise<Punch> {
    return this.repository.save(this.repository.create(data));
  }

  findById(accountId: string, id: string): Promise<Punch | null> {
    return this.repository.findOne({ where: { id, accountId } });
  }

  findByIdempotencyKey(idempotencyKey: string): Promise<Punch | null> {
    return this.repository.findOne({ where: { idempotencyKey } });
  }

  /** Último marcaje del empleado (para la cadena de hash y el tipo siguiente). */
  findLast(employmentId: string): Promise<Punch | null> {
    return this.repository.findOne({ where: { employmentId }, order: { createdAt: 'DESC', id: 'DESC' } });
  }

  /** Último marcaje válido (no rechazado) por momento efectivo. */
  findLastEffective(employmentId: string): Promise<Punch | null> {
    return this.repository
      .createQueryBuilder('p')
      .where('p.employmentId = :employmentId AND p.reviewStatus != :rejected', { employmentId, rejected: PunchReviewStatusEnum.Rejected })
      .orderBy('p.effectiveAt', 'DESC')
      .getOne();
  }

  findForEmploymentBetween(accountId: string, employmentId: string, from: Date, to: Date): Promise<Punch[]> {
    return this.repository.find({ where: { accountId, employmentId, effectiveAt: Between(from, to) }, order: { effectiveAt: 'ASC' } });
  }

  findForEmploymentsBetween(accountId: string, employmentIds: string[], from: Date, to: Date): Promise<Punch[]> {
    if (employmentIds.length === 0) return Promise.resolve([]);
    return this.repository.find({ where: { accountId, employmentId: In(employmentIds), effectiveAt: Between(from, to) }, order: { effectiveAt: 'ASC' } });
  }

  async list(accountId: string, f: PunchListFilters): Promise<PaginatedResult<Punch>> {
    const { page, limit, skip } = normalizePagination(f.page, f.limit);
    const qb = this.repository.createQueryBuilder('p').where('p.accountId = :accountId', { accountId });
    if (f.from) qb.andWhere('p.effectiveAt >= :from', { from: f.from });
    if (f.to) qb.andWhere('p.effectiveAt < :to', { to: f.to });
    if (f.employmentId) qb.andWhere('p.employmentId = :emp', { emp: f.employmentId });
    if (f.locationId) qb.andWhere('p.locationId = :loc', { loc: f.locationId });
    if (f.reviewStatus) qb.andWhere('p.reviewStatus = :rs', { rs: f.reviewStatus });
    if (f.flaggedOnly) qb.andWhere(`jsonb_array_length(p.riskFlags) > 0`);
    const [items, total] = await qb.orderBy('p.effectiveAt', 'DESC').skip(skip).take(limit).getManyAndCount();
    return { items, total, page, limit };
  }

  countPendingReview(accountId: string): Promise<number> {
    return this.repository.count({ where: { accountId, reviewStatus: PunchReviewStatusEnum.Pending } });
  }

  async setReview(accountId: string, id: string, reviewStatus: PunchReviewStatusEnum, userId: string | null): Promise<Punch | null> {
    await this.repository.update({ id, accountId }, { reviewStatus, reviewedByUserId: userId, reviewedAt: new Date() });
    return this.findById(accountId, id);
  }

  /** Para la salida automática: entradas abiertas antes de un límite. */
  async findOpenSince(limit: Date): Promise<Punch[]> {
    return this.repository.query(
      `SELECT DISTINCT ON (p."employmentId") p.* FROM "attendance"."punches" p
        WHERE p."reviewStatus" != 'rejected'
        ORDER BY p."employmentId", p."effectiveAt" DESC`,
    ).then((rows: Punch[]) => rows.filter((r) => (r.type === 'in' || r.type === 'break_end') && new Date(r.effectiveAt) < limit));
  }
}

@Injectable()
export class PunchPhotoDao {
  constructor(@InjectRepository(PunchPhoto) private readonly repository: Repository<PunchPhoto>) {}

  insert(data: Partial<PunchPhoto>): Promise<PunchPhoto> {
    return this.repository.save(this.repository.create(data));
  }

  async punchIdsWithPhoto(accountId: string, punchIds: string[]): Promise<Set<string>> {
    if (punchIds.length === 0) return new Set();
    const rows = await this.repository.find({ select: { punchId: true }, where: { accountId, punchId: In(punchIds) } });
    return new Set(rows.map((r) => r.punchId));
  }

  findByPunch(accountId: string, punchId: string): Promise<PunchPhoto | null> {
    return this.repository.findOne({ where: { accountId, punchId } });
  }
}
