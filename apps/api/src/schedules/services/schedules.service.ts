import { Injectable } from '@nestjs/common';
import { MEXICO_HOLIDAYS } from '@jc-attendance/rules-engine';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, found, unwrap } from '../../common';
import { UpsertScheduleBluePrint } from '../blueprints';
import { HolidayDao, PolicyDao, ScheduleDao, ShiftDao } from '../daos';
import { CreateHolidayDto, UpsertPolicyDto, UpsertScheduleDto } from '../dtos';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly upsertScheduleBluePrint: UpsertScheduleBluePrint,
    private readonly policyDao: PolicyDao,
    private readonly scheduleDao: ScheduleDao,
    private readonly shiftDao: ShiftDao,
    private readonly holidayDao: HolidayDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  listPolicies(accountId: string) {
    return this.policyDao.findAll(accountId, {}, { name: 'ASC' });
  }

  async getPolicy(accountId: string, id: string) {
    return found(await this.policyDao.findById(accountId, id), 'La política no existe');
  }

  async upsertPolicy(accountId: string, dto: UpsertPolicyDto, actor: AuthContext, id?: string) {
    const before = id ? await this.getPolicy(accountId, id) : null;
    const saved = id ? await this.policyDao.update(accountId, id, dto) : await this.policyDao.create({ ...dto, accountId });
    await this.audit.process({ accountId, actor, entity: 'policy', entityId: saved!.id, action: id ? 'update' : 'create', before, after: saved });
    return saved;
  }

  async removePolicy(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.policyDao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'policy', entityId: id, action: 'delete' });
    return { deleted };
  }

  async listSchedules(accountId: string) {
    const schedules = await this.scheduleDao.findAll(accountId, {}, { name: 'ASC' });
    const shifts = await this.shiftDao.findBySchedules(accountId, schedules.map((s) => s.id));
    return schedules.map((s) => ({ ...s, shifts: shifts.filter((sh) => sh.scheduleId === s.id) }));
  }

  async upsertSchedule(accountId: string, dto: UpsertScheduleDto, actor: AuthContext, id?: string) {
    return unwrap(await this.upsertScheduleBluePrint.execute({ accountId, dto, actor, id }));
  }

  async removeSchedule(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.scheduleDao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'schedule', entityId: id, action: 'delete' });
    return { deleted };
  }

  listHolidays(accountId: string, year: number) {
    return this.holidayDao.findBetween(accountId, `${year}-01-01`, `${year}-12-31`);
  }

  async addHoliday(accountId: string, dto: CreateHolidayDto, actor: AuthContext) {
    await this.holidayDao.insertMany(accountId, [dto]);
    await this.audit.process({ accountId, actor, entity: 'holiday', action: 'create', after: { ...dto } });
    return this.listHolidays(accountId, Number(dto.date.slice(0, 4)));
  }

  /** Precarga los festivos obligatorios del art. 74 LFT del año. */
  async seedMexicoHolidays(accountId: string, year: number) {
    await this.holidayDao.insertMany(accountId, MEXICO_HOLIDAYS(year));
    return this.listHolidays(accountId, year);
  }

  async removeHoliday(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.holidayDao.remove(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'holiday', entityId: id, action: 'delete' });
    return { deleted };
  }
}
