import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePagination, PaginatedResult } from '../../common';
import { ReportJob, ReportJobStatusEnum } from '../entities';

@Injectable()
export class ReportJobDao {
  constructor(@InjectRepository(ReportJob) private readonly repository: Repository<ReportJob>) {}

  create(data: Partial<ReportJob>): Promise<ReportJob> {
    return this.repository.save(this.repository.create(data));
  }

  findById(accountId: string, id: string): Promise<ReportJob | null> {
    return this.repository.findOne({ where: { accountId, id } });
  }

  findWithFile(accountId: string, id: string): Promise<ReportJob | null> {
    return this.repository.createQueryBuilder('r').addSelect('r.file').where('r.id = :id AND r.accountId = :accountId', { id, accountId }).getOne();
  }

  async list(accountId: string, page?: number, limit?: number): Promise<PaginatedResult<ReportJob>> {
    const p = normalizePagination(page, limit);
    const [items, total] = await this.repository.findAndCount({ where: { accountId }, order: { createdAt: 'DESC' }, skip: p.skip, take: p.limit });
    return { items, total, page: p.page, limit: p.limit };
  }

  async markRunning(id: string): Promise<void> {
    await this.repository.update({ id }, { jobStatus: ReportJobStatusEnum.Running });
  }

  async markDone(id: string, file: Buffer, fileName: string, sha256: string): Promise<void> {
    await this.repository.update({ id }, { jobStatus: ReportJobStatusEnum.Done, file, fileName, sha256, finishedAt: new Date(), error: null });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.repository.update({ id }, { jobStatus: ReportJobStatusEnum.Failed, error: error.slice(0, 2000), finishedAt: new Date() });
  }
}
