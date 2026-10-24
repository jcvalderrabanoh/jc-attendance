import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ACCOUNT_BOOTSTRAPPED_EVENT, AccountBootstrappedPayload } from '../../organization/events';
import { SeedAccountDefaultsProcess } from '../processes';

@Injectable()
export class AccountBootstrappedSchedulesListener {
  private readonly logger = new Logger(AccountBootstrappedSchedulesListener.name);

  constructor(private readonly seedDefaults: SeedAccountDefaultsProcess) {}

  @OnEvent(ACCOUNT_BOOTSTRAPPED_EVENT, { async: true, promisify: true })
  async handle(payload: AccountBootstrappedPayload): Promise<void> {
    try {
      await this.seedDefaults.process(payload.accountId);
    } catch (err) {
      this.logger.error(`No se sembraron horarios de ${payload.accountId}: ${(err as Error).message}`);
    }
  }
}
