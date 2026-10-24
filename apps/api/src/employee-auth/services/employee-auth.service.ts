import { ForbiddenException, Injectable } from '@nestjs/common';
import { EmployeeContext, signEmployeeToken, unwrap, unwrapProcess } from '../../common';
import { EmploymentDao } from '../../employees/daos';
import { OnboardingStatusEnum } from '../../employees/entities';
import { AccountSettingsDao } from '../../organization/daos';
import { EmployeeLoginBluePrint } from '../blueprints';
import { ConsentDao } from '../daos';
import { ConsentKindEnum, OtpChannelEnum } from '../entities';
import { RequestOtpProcess } from '../processes';

@Injectable()
export class EmployeeAuthService {
  constructor(
    private readonly requestOtp: RequestOtpProcess,
    private readonly loginBluePrint: EmployeeLoginBluePrint,
    private readonly employmentDao: EmploymentDao,
    private readonly consentDao: ConsentDao,
    private readonly accountSettingsDao: AccountSettingsDao,
  ) {}

  async sendCode(destination: string, channel: OtpChannelEnum | undefined, ip: string | null) {
    return unwrapProcess(await this.requestOtp.process(destination, channel, ip));
  }

  async login(destination: string, code: string) {
    return unwrap(await this.loginBluePrint.execute({ destination, code }));
  }

  /** Cambia de patrón: nuevo token con esa cuenta. */
  async selectEmployment(employee: EmployeeContext, employmentId: string) {
    const employment = (await this.employmentDao.findAllForIdentity(employee.identityId)).find((e) => e.id === employmentId);
    if (!employment) throw new ForbiddenException('Ese empleo no es tuyo');
    if (employment.onboardingStatus !== OnboardingStatusEnum.Approved) {
      throw new ForbiddenException('Tu alta con esa empresa sigue en revisión');
    }
    return {
      token: signEmployeeToken({ identityId: employee.identityId, accountId: employment.accountId, employmentId: employment.id }),
      accountId: employment.accountId,
      employmentId: employment.id,
    };
  }

  async consents(employee: EmployeeContext) {
    if (!employee.accountId) return [];
    return this.consentDao.findActive(employee.identityId, employee.accountId);
  }

  /** Consentimiento expreso con evidencia (LFPDPPP): versión del aviso, IP y navegador. */
  async grant(employee: EmployeeContext, accountId: string, kinds: ConsentKindEnum[], ip: string | null, userAgent: string | null) {
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const version = settings?.privacyNoticeVersion ?? '1';
    for (const kind of kinds) {
      await this.consentDao.create({ identityId: employee.identityId, accountId, kind, version, ip, userAgent: userAgent?.slice(0, 300) ?? null });
    }
    return this.consentDao.findActive(employee.identityId, accountId);
  }

  async revoke(employee: EmployeeContext, accountId: string, kind: ConsentKindEnum) {
    await this.consentDao.revoke(employee.identityId, accountId, kind);
    return this.consentDao.findActive(employee.identityId, accountId);
  }
}
