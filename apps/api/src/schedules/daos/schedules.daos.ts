import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { TenantDao } from '../../common';
import { Holiday, Policy, Schedule, Shift } from '../entities';

@Injectable()
export class PolicyDao extends TenantDao<Policy> {
  constructor(@InjectRepository(Policy) repository: Repository<Policy>) {
    super(repository);
  }
}

@Injectable()
export class ScheduleDao extends TenantDao<Schedule> {
  constructor(@InjectRepository(Schedule) repository: Repository<Schedule>) {
    super(repository);
  }
}

@Injectable()
export class ShiftDao {
  constructor(@InjectRepository(Shift) private readonly repository: Repository<Shift>) {}

  findBySchedules(accountId: string, scheduleIds: string[]): Promise<Shift[]> {
    if (scheduleIds.length === 0) return Promise.resolve([]);
    return this.repository.find({ where: { accountId, scheduleId: In(scheduleIds) }, order: { dayOfWeek: 'ASC' } });
  }

  /** Reemplaza la semana completa de un horario. */
  async replaceForSchedule(accountId: string, scheduleId: string, shifts: Partial<Shift>[]): Promise<Shift[]> {
    await this.repository.delete({ accountId, scheduleId });
    if (shifts.length === 0) return [];
    return this.repository.save(shifts.map((s) => this.repository.create({ ...s, accountId, scheduleId })));
  }
}

@Injectable()
export class HolidayDao {
  constructor(@InjectRepository(Holiday) private readonly repository: Repository<Holiday>) {}

  findBetween(accountId: string, from: string, to: string): Promise<Holiday[]> {
    return this.repository.find({ where: { accountId, date: Between(from, to) }, order: { date: 'ASC' } });
  }

  /** Inserta sin duplicar (índice único accountId+date). */
  async insertMany(accountId: string, holidays: { date: string; name: string; mandatory?: boolean }[]): Promise<void> {
    if (holidays.length === 0) return;
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(holidays.map((h) => ({ accountId, date: h.date, name: h.name, mandatory: h.mandatory ?? true })))
      .orIgnore()
      .execute();
  }

  async remove(accountId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ accountId, id });
    return (result.affected ?? 0) > 0;
  }
}
