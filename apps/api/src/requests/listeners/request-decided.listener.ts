import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { addDays } from '@jc-attendance/rules-engine';
import { RecalculateWorkdayProcess } from '../../timesheets/processes';
import { REQUEST_DECIDED_EVENT, RequestDecidedPayload } from '../events';

/** Permiso/vacaciones aprobados cambian el estado de esos días (ya no son falta). */
@Injectable()
export class RequestDecidedListener {
  private readonly logger = new Logger(RequestDecidedListener.name);

  constructor(private readonly recalculate: RecalculateWorkdayProcess) {}

  @OnEvent(REQUEST_DECIDED_EVENT, { async: true, promisify: true })
  async handle(p: RequestDecidedPayload): Promise<void> {
    if (!p.approved) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      for (let d = p.fromDate; d <= p.toDate && d <= today; d = addDays(d, 1)) {
        await this.recalculate.process(p.accountId, p.employmentId, d);
      }
    } catch (err) {
      this.logger.error(`No se recalcularon los días de ${p.requestId}: ${(err as Error).message}`);
    }
  }
}
