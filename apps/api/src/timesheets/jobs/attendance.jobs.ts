import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, localDateOf, localMinuteOfDay } from '@jc-attendance/rules-engine';
import { EmploymentDao } from '../../employees/daos';
import { AccountSettingsDao } from '../../organization/daos';
import { PunchDao } from '../../punches/daos';
import { RegisterPunchBluePrint } from '../../punches/blueprints';
import { PunchSourceEnum, PunchTypeEnum } from '../../punches/entities';
import { PolicyResolverService } from '../../schedules/services';
import { RecalculateWorkdayProcess } from '../processes';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Tareas programadas. Cada una es idempotente (se puede reejecutar) y nunca
 * frena a la otra si falla.
 */
@Injectable()
export class AttendanceJobs {
  private readonly logger = new Logger(AttendanceJobs.name);
  private running = false;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly employmentDao: EmploymentDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly punchDao: PunchDao,
    private readonly registerPunch: RegisterPunchBluePrint,
    private readonly policyResolver: PolicyResolverService,
    private readonly recalculate: RecalculateWorkdayProcess,
  ) {}

  /**
   * Cierre del día: entre la 01:00 y 01:59 locales de cada cuenta recalcula la
   * jornada de ayer de todos sus empleados (así aparecen las faltas sin marcaje).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async closeYesterday(): Promise<void> {
    if (process.env.DISABLE_JOBS === 'true' || this.running) return;
    this.running = true;
    try {
      const accounts: { accountId: string }[] = await this.dataSource.query(`SELECT "accountId" FROM "attendance"."account_settings"`);
      for (const { accountId } of accounts) {
        const settings = await this.accountSettingsDao.findByAccount(accountId);
        const tz = settings?.timeZone ?? 'America/Mexico_City';
        const now = new Date();
        if (Math.floor(localMinuteOfDay(now, tz) / 60) !== 1) continue;
        await this.closeDay(accountId, addDays(localDateOf(now, tz), -1));
      }
    } catch (err) {
      this.logger.error(`Cierre diario: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  async closeDay(accountId: string, date: string): Promise<number> {
    const employments = await this.employmentDao.activeIds(accountId);
    for (const { id } of employments) await this.recalculate.process(accountId, id, date);
    return employments.length;
  }

  /** Salida automática: entradas abiertas más de `autoClockOutAfterHours` (queda en revisión). */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoClockOut(): Promise<void> {
    if (process.env.DISABLE_JOBS === 'true') return;
    try {
      const open = await this.punchDao.findOpenSince(new Date(Date.now() - 8 * 3600_000));
      for (const punch of open) {
        const employment = await this.employmentDao.findById(punch.accountId, punch.employmentId);
        if (!employment) continue;
        const policy = await this.policyResolver.policyFor(punch.accountId, employment.policyId);
        const at = new Date(new Date(punch.effectiveAt).getTime() + policy.autoClockOutAfterHours * 3600_000);
        if (at > new Date()) continue;
        await this.registerPunch.execute({
          accountId: punch.accountId,
          employmentId: punch.employmentId,
          source: PunchSourceEnum.Auto,
          actor: null as never,
          type: PunchTypeEnum.Out,
          idempotencyKey: `auto-out-${punch.id}`,
          clientAt: at,
          offline: true,
          customFields: { autoClockOutOf: punch.id },
        });
        this.logger.warn(`Salida automática para ${punch.employmentId} (entrada ${punch.id})`);
      }
    } catch (err) {
      this.logger.error(`Salida automática: ${(err as Error).message}`);
    }
  }
}
