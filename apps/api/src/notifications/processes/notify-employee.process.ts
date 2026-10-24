import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmployeeIdentityDao } from '../../employees/daos';
import { AccountSettingsDao } from '../../organization/daos';
import { NOTIFICATION_SENDER, NotificationSender } from '../providers';

/** Avisa al empleado por WhatsApp (o el canal configurado). Nunca falla al llamador. */
@Injectable()
export class NotifyEmployeeProcess {
  private readonly logger = new Logger(NotifyEmployeeProcess.name);

  constructor(
    private readonly identityDao: EmployeeIdentityDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    @Inject(NOTIFICATION_SENDER) private readonly sender: NotificationSender,
  ) {}

  async process(identityId: string | null, accountId: string, build: (company: string, firstName: string) => string): Promise<void> {
    if (!identityId) return;
    try {
      const identity = await this.identityDao.findById(identityId);
      const to = identity?.phoneE164 ?? identity?.email;
      if (!identity || !to) return;
      const company = (await this.accountSettingsDao.findByAccount(accountId))?.displayName ?? 'tu empresa';
      await this.sender.send(to, build(company, identity.firstName));
    } catch (err) {
      this.logger.error(`No se notificó a ${identityId}: ${(err as Error).message}`);
    }
  }
}
