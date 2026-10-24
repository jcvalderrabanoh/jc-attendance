import { Injectable, Logger } from '@nestjs/common';
import { MEXICO_HOLIDAYS } from '@jc-attendance/rules-engine';
import { AccountSettingsDao } from '../../organization/daos';
import { HolidayDao, PolicyDao, ScheduleDao, ShiftDao } from '../daos';

/**
 * Valores por defecto de una cuenta nueva: política general (LFT México),
 * horario L–V 09:00–18:00 con 60 min de comida y festivos del art. 74 de
 * este año y el siguiente. Idempotente: si ya hay política, no hace nada.
 */
@Injectable()
export class SeedAccountDefaultsProcess {
  private readonly logger = new Logger(SeedAccountDefaultsProcess.name);

  constructor(
    private readonly policyDao: PolicyDao,
    private readonly scheduleDao: ScheduleDao,
    private readonly shiftDao: ShiftDao,
    private readonly holidayDao: HolidayDao,
    private readonly accountSettingsDao: AccountSettingsDao,
  ) {}

  async process(accountId: string): Promise<void> {
    const year = new Date().getUTCFullYear();
    await this.holidayDao.insertMany(accountId, [...MEXICO_HOLIDAYS(year), ...MEXICO_HOLIDAYS(year + 1)]);

    const existing = await this.policyDao.findAll(accountId);
    if (existing.length > 0) return;

    const policy = await this.policyDao.create({ accountId, name: 'Política general' });
    const schedule = await this.scheduleDao.create({ accountId, name: 'Oficina L–V 09:00–18:00', weeklyHoursTarget: '40' });
    await this.shiftDao.replaceForSchedule(
      accountId,
      schedule.id,
      [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '18:00', breakMinutes: 60, paidBreak: false })),
    );
    await this.accountSettingsDao.upsert(accountId, { defaultPolicyId: policy.id, defaultScheduleId: schedule.id });
    this.logger.log(`Valores por defecto sembrados para ${accountId}`);
  }
}
