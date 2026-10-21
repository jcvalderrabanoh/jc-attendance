import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PUNCH_CHANGED_EVENT, PunchChangedPayload } from '../../punches/events';
import { RecalculateWorkdayProcess } from '../processes';

/** Cada marcaje nuevo o revisado recalcula su jornada (en segundo plano: no frena el marcaje). */
@Injectable()
export class PunchChangedListener {
  private readonly logger = new Logger(PunchChangedListener.name);

  constructor(private readonly recalculate: RecalculateWorkdayProcess) {}

  @OnEvent(PUNCH_CHANGED_EVENT, { async: true, promisify: true })
  async handle({ accountId, employmentId, at }: PunchChangedPayload): Promise<void> {
    try {
      const date = await this.recalculate.workdayDateOf(accountId, employmentId, new Date(at));
      if (date) await this.recalculate.process(accountId, employmentId, date);
    } catch (err) {
      this.logger.error(`No se recalculó la jornada de ${employmentId}: ${(err as Error).message}`);
    }
  }
}
