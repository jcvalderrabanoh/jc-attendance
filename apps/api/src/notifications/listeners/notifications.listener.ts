import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmploymentDao } from '../../employees/daos';
import { ONBOARDING_DECIDED_EVENT, OnboardingEventPayload } from '../../onboarding/events';
import { REQUEST_DECIDED_EVENT, RequestDecidedPayload } from '../../requests/events';
import { NotifyEmployeeProcess } from '../processes';

const APP_URL = () => (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly notify: NotifyEmployeeProcess,
    private readonly employmentDao: EmploymentDao,
  ) {}

  @OnEvent(ONBOARDING_DECIDED_EVENT, { async: true })
  async onboardingDecided(p: OnboardingEventPayload): Promise<void> {
    await this.notify.process(p.identityId, p.accountId, (company, name) => {
      switch (p.reviewStatus) {
        case 'approved':
          return `Hola ${name}, ${company} aprobó tu alta en el Checador. Ya puedes registrar tu entrada: ${APP_URL()}`;
        case 'rejected':
          return `Hola ${name}, ${company} no aprobó tu alta en el Checador.${p.comment ? ` Motivo: ${p.comment}` : ''}`;
        default:
          return `Hola ${name}, ${company} necesita que completes tu alta${p.comment ? `: ${p.comment}` : ''}. Entra a ${APP_URL()}`;
      }
    });
  }

  @OnEvent(REQUEST_DECIDED_EVENT, { async: true })
  async requestDecided(p: RequestDecidedPayload): Promise<void> {
    const employment = await this.employmentDao.findById(p.accountId, p.employmentId);
    await this.notify.process(employment?.identityId ?? null, p.accountId, (company, name) =>
      `Hola ${name}, ${company} ${p.approved ? 'aprobó' : 'rechazó'} tu solicitud del ${p.fromDate}${p.toDate !== p.fromDate ? ` al ${p.toDate}` : ''}.`,
    );
  }
}
