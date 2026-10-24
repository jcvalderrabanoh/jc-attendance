import { Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { EmployeeContext, found } from '../../common';
import { ConsentDao } from '../../employee-auth/daos';
import { EmployeeIdentityDao, EmploymentDao } from '../../employees/daos';
import { OnboardingRequestDao } from '../../onboarding/daos';
import { PunchDao } from '../../punches/daos';
import { EmployeeRequestDao } from '../../requests/daos';

/**
 * Derecho de acceso (ARCO, LFPDPPP): el empleado descarga todo lo que el
 * Checador guarda de él, por cada empresa para la que trabaja.
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly identityDao: EmployeeIdentityDao,
    private readonly employmentDao: EmploymentDao,
    private readonly consentDao: ConsentDao,
    private readonly punchDao: PunchDao,
    private readonly requestDao: EmployeeRequestDao,
    private readonly onboardingDao: OnboardingRequestDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async export(employee: EmployeeContext) {
    const identity = found(await this.identityDao.findById(employee.identityId), 'No encontramos tu registro');
    const employments = await this.employmentDao.findAllForIdentity(identity.id);
    const since = new Date(Date.now() - 5 * 365 * 86_400_000);
    const perAccount = await Promise.all(
      employments.map(async (e) => ({
        accountId: e.accountId,
        employment: e,
        consents: await this.consentDao.findActive(identity.id, e.accountId),
        punches: (await this.punchDao.findForEmploymentBetween(e.accountId, e.id, since, new Date())).map(({ hash, prevHash, ...p }) => p),
        requests: (await this.requestDao.findPage(e.accountId, { employmentId: e.id }, 1, 200)).items,
      })),
    );
    const onboarding = await this.onboardingDao.findAllForIdentity(identity.id);
    await this.audit.process({ accountId: employee.accountId, actor: employee, entity: 'identity', entityId: identity.id, action: 'arco_export' });
    return {
      generatedAt: new Date().toISOString(),
      notice: 'Datos personales que el Checador conserva sobre ti (derecho de acceso, LFPDPPP). Para rectificar, cancelar u oponerte, contacta a la empresa responsable.',
      identity,
      employments: perAccount,
      onboardingRequests: onboarding,
    };
  }
}
