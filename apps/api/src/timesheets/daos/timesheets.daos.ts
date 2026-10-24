import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { normalizePagination, PaginatedResult } from '../../common';
import { RequestStatusEnum, RequestTypeEnum, EmployeeRequest } from '../../requests/entities';
import { Incident, IncidentStatusEnum, IncidentTypeEnum, PayPeriod, Workday } from '../entities';

@Injectable()
export class WorkdayDao {
  constructor(@InjectRepository(Workday) private readonly repository: Repository<Workday>) {}

  findOne(employmentId: string, date: string): Promise<Workday | null> {
    return this.repository.findOne({ where: { employmentId, date } });
  }

  async upsert(data: Partial<Workday> & { employmentId: string; date: string }): Promise<Workday> {
    const current = await this.findOne(data.employmentId, data.date);
    return this.repository.save(current ? this.repository.merge(current, data) : this.repository.create(data));
  }

  findForEmployment(accountId: string, employmentId: string, from: string, to: string): Promise<Workday[]> {
    return this.repository.find({ where: { accountId, employmentId, date: Between(from, to) }, order: { date: 'ASC' } });
  }

  findForAccount(accountId: string, from: string, to: string, employmentIds?: string[]): Promise<Workday[]> {
    return this.repository.find({
      where: { accountId, date: Between(from, to), ...(employmentIds ? { employmentId: In(employmentIds) } : {}) },
      order: { date: 'ASC' },
    });
  }

  async lockRange(accountId: string, from: string, to: string): Promise<number> {
    const r = await this.repository.update({ accountId, date: Between(from, to) }, { locked: true });
    return r.affected ?? 0;
  }
}

@Injectable()
export class IncidentDao {
  constructor(@InjectRepository(Incident) private readonly repository: Repository<Incident>) {}

  /** Sustituye las incidencias automáticas abiertas del día (las justificadas se conservan). */
  async replaceForDay(accountId: string, employmentId: string, date: string, incidents: { type: IncidentTypeEnum; detail?: string }[]): Promise<void> {
    const existing = await this.repository.find({ where: { employmentId, date } });
    const keep = new Set(existing.filter((i) => i.status !== IncidentStatusEnum.Open).map((i) => i.type));
    const wanted = new Set(incidents.map((i) => i.type));
    const toDelete = existing.filter((i) => i.status === IncidentStatusEnum.Open && !wanted.has(i.type) && i.type !== IncidentTypeEnum.WeeklyTripleCapExceeded);
    if (toDelete.length) await this.repository.delete(toDelete.map((i) => i.id));
    for (const incident of incidents) {
      if (keep.has(incident.type)) continue;
      const current = existing.find((i) => i.type === incident.type);
      if (current) await this.repository.update(current.id, { detail: incident.detail ?? null });
      else await this.repository.save(this.repository.create({ accountId, employmentId, date, type: incident.type, detail: incident.detail ?? null }));
    }
  }

  async setWeeklyCapIncident(accountId: string, employmentId: string, date: string, exceeded: boolean, detail: string): Promise<void> {
    const current = await this.repository.findOne({ where: { employmentId, date, type: IncidentTypeEnum.WeeklyTripleCapExceeded } });
    if (exceeded && !current) {
      await this.repository.save(this.repository.create({ accountId, employmentId, date, type: IncidentTypeEnum.WeeklyTripleCapExceeded, detail }));
    } else if (!exceeded && current?.status === IncidentStatusEnum.Open) {
      await this.repository.delete(current.id);
    }
  }

  async list(
    accountId: string,
    f: { from?: string; to?: string; type?: IncidentTypeEnum; status?: IncidentStatusEnum; employmentId?: string; page?: number; limit?: number },
  ): Promise<PaginatedResult<Incident>> {
    const { page, limit, skip } = normalizePagination(f.page, f.limit);
    const where: Record<string, unknown> = { accountId };
    if (f.from && f.to) where.date = Between(f.from, f.to);
    if (f.type) where.type = f.type;
    if (f.status) where.status = f.status;
    if (f.employmentId) where.employmentId = f.employmentId;
    const [items, total] = await this.repository.findAndCount({ where, order: { date: 'DESC' }, skip, take: limit });
    return { items, total, page, limit };
  }

  findById(accountId: string, id: string): Promise<Incident | null> {
    return this.repository.findOne({ where: { accountId, id } });
  }

  async setStatus(accountId: string, id: string, status: IncidentStatusEnum, justificationRequestId?: string | null): Promise<Incident | null> {
    await this.repository.update({ accountId, id }, { status, ...(justificationRequestId !== undefined ? { justificationRequestId } : {}) });
    return this.findById(accountId, id);
  }

  findForEmploymentDates(employmentId: string, from: string, to: string): Promise<Incident[]> {
    return this.repository.find({ where: { employmentId, date: Between(from, to) } });
  }
}

@Injectable()
export class PayPeriodDao {
  constructor(@InjectRepository(PayPeriod) private readonly repository: Repository<PayPeriod>) {}

  list(accountId: string): Promise<PayPeriod[]> {
    return this.repository.find({ where: { accountId }, order: { startDate: 'DESC' }, take: 52 });
  }

  findById(accountId: string, id: string): Promise<PayPeriod | null> {
    return this.repository.findOne({ where: { accountId, id } });
  }

  findContaining(accountId: string, date: string): Promise<PayPeriod | null> {
    return this.repository.findOne({ where: { accountId, startDate: LessThanOrEqual(date), endDate: MoreThanOrEqual(date) } });
  }

  async ensure(accountId: string, startDate: string, endDate: string): Promise<PayPeriod> {
    const existing = await this.repository.findOne({ where: { accountId, startDate } });
    return existing ?? this.repository.save(this.repository.create({ accountId, startDate, endDate }));
  }

  async close(accountId: string, id: string, userId: string): Promise<PayPeriod | null> {
    await this.repository.update({ accountId, id }, { closedAt: new Date(), closedByUserId: userId });
    return this.findById(accountId, id);
  }
}

/** Lectura de permisos/vacaciones aprobados (tabla del módulo requests). */
@Injectable()
export class ApprovedLeaveDao {
  constructor(@InjectRepository(EmployeeRequest) private readonly repository: Repository<EmployeeRequest>) {}

  async isOnLeave(employmentId: string, date: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        employmentId,
        requestStatus: RequestStatusEnum.Approved,
        type: In([RequestTypeEnum.Vacation, RequestTypeEnum.Permission, RequestTypeEnum.SickLeave]),
        fromDate: LessThanOrEqual(date),
        toDate: MoreThanOrEqual(date),
      },
    });
    return count > 0;
  }
}
