import { Injectable } from '@nestjs/common';
import { classifyJornada, parseWallTime } from '@jc-attendance/rules-engine';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok } from '../../common';
import { ScheduleChecker } from '../checkers';
import { ScheduleDao, ShiftDao } from '../daos';
import { UpsertScheduleDto } from '../dtos';
import { Schedule, Shift } from '../entities';

export interface UpsertScheduleInput {
  accountId: string;
  id?: string;
  dto: UpsertScheduleDto;
  actor: AuthContext;
}

export interface ScheduleWithShifts extends Schedule {
  shifts: (Shift & { jornadaType: string })[];
  warnings: string[];
}

@Injectable()
export class UpsertScheduleBluePrint implements BasicBluePrintInterface<UpsertScheduleInput, ScheduleWithShifts> {
  constructor(
    private readonly checker: ScheduleChecker,
    private readonly scheduleDao: ScheduleDao,
    private readonly shiftDao: ShiftDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute({ accountId, id, dto, actor }: UpsertScheduleInput): Promise<CheckRulesAndProcessInterfaceResult<ScheduleWithShifts>> {
    const { errors, warnings } = this.checker.validate(dto);
    if (errors.length) return fail(...errors);
    const data = { name: dto.name.trim(), type: dto.type, weeklyHoursTarget: dto.weeklyHoursTarget?.toString() ?? null };
    const schedule = id ? await this.scheduleDao.update(accountId, id, data) : await this.scheduleDao.create({ ...data, accountId });
    if (!schedule) return fail('El horario no existe');
    const shifts = await this.shiftDao.replaceForSchedule(
      accountId,
      schedule.id,
      dto.shifts.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        crossesMidnight: parseWallTime(s.endTime) <= parseWallTime(s.startTime),
        breakMinutes: s.breakMinutes ?? 0,
        paidBreak: s.paidBreak ?? false,
      })),
    );
    await this.audit.process({ accountId, actor, entity: 'schedule', entityId: schedule.id, action: id ? 'update' : 'create', after: { ...schedule, shifts } });
    return ok({
      ...schedule,
      shifts: shifts.map((s) => ({ ...s, jornadaType: classifyJornada(s.startTime, s.endTime) })),
      warnings,
    });
  }
}
