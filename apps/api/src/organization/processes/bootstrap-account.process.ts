import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoreLinkService } from '../../core-link';
import { AccountSettingsDao } from '../daos';
import { AccountSettings } from '../entities';
import { ACCOUNT_BOOTSTRAPPED_EVENT, AccountBootstrappedPayload } from '../events';

/**
 * Primera entrada de una cuenta: crea su configuración (zona horaria de
 * jc-core) y avisa a los módulos para que siembren política, horario,
 * festivos y reglas de alta por defecto. Idempotente.
 */
@Injectable()
export class BootstrapAccountProcess {
  private readonly logger = new Logger(BootstrapAccountProcess.name);

  constructor(
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly coreLink: CoreLinkService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async process(accountId: string): Promise<AccountSettings> {
    const existing = await this.accountSettingsDao.findByAccount(accountId);
    if (existing) return existing;

    const coreAccount = await this.coreLink.getAccount(accountId);
    const settings = await this.accountSettingsDao.upsert(accountId, {
      displayName: coreAccount?.name ?? null,
      timeZone: coreAccount?.timeZone || 'America/Mexico_City',
    });
    const payload: AccountBootstrappedPayload = { accountId, timeZone: settings.timeZone };
    // Los listeners siembran en segundo plano y deben ser idempotentes.
    await this.eventEmitter.emitAsync(ACCOUNT_BOOTSTRAPPED_EVENT, payload).catch((err) => {
      this.logger.error(`Bootstrap parcial de ${accountId}: ${err.message}`);
    });
    return settings;
  }
}
