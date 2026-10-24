import { Injectable } from '@nestjs/common';
import { BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok, signEmployeeToken } from '../../common';
import { EmployeeIdentityDao, EmploymentDao } from '../../employees/daos';
import { OnboardingStatusEnum } from '../../employees/entities';
import { VerifyOtpProcess } from '../processes';

export interface EmployeeLoginInput {
  destination: string;
  code: string;
}

export interface EmployeeLoginResult {
  token: string;
  identityId: string;
  firstName: string;
  /** Si trabaja para un solo patrón ya viene seleccionado. */
  accountId: string | null;
  employmentId: string | null;
  requiresAccountSelection: boolean;
  employments: { employmentId: string; accountId: string; onboardingStatus: string }[];
}

/**
 * OTP válido → token de empleado. Con un solo empleo aprobado el token ya
 * lleva la cuenta; con varios, el PWA muestra el selector de patrón.
 */
@Injectable()
export class EmployeeLoginBluePrint implements BasicBluePrintInterface<EmployeeLoginInput, EmployeeLoginResult> {
  constructor(
    private readonly verifyOtp: VerifyOtpProcess,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly employmentDao: EmploymentDao,
  ) {}

  async execute(input: EmployeeLoginInput): Promise<CheckRulesAndProcessInterfaceResult<EmployeeLoginResult>> {
    const verified = await this.verifyOtp.process(input.destination, input.code);
    if (!verified.success) return fail(verified.error!);
    const { destination, kind } = verified.data!;
    const identity = kind === 'phone' ? await this.identityDao.findByPhone(destination) : await this.identityDao.findByEmail(destination);
    if (!identity) return fail('No encontramos tu registro; pide a tu empresa la liga de alta');

    const now = new Date();
    if (kind === 'phone' && !identity.phoneVerifiedAt) await this.identityDao.update(identity.id, { phoneVerifiedAt: now });
    if (kind === 'email' && !identity.emailVerifiedAt) await this.identityDao.update(identity.id, { emailVerifiedAt: now });

    const employments = await this.employmentDao.findAllForIdentity(identity.id);
    const approved = employments.filter((e) => e.onboardingStatus === OnboardingStatusEnum.Approved);
    const single = approved.length === 1 ? approved[0] : null;
    return ok({
      token: signEmployeeToken({ identityId: identity.id, accountId: single?.accountId ?? null, employmentId: single?.id ?? null }),
      identityId: identity.id,
      firstName: identity.firstName,
      accountId: single?.accountId ?? null,
      employmentId: single?.id ?? null,
      requiresAccountSelection: approved.length > 1,
      employments: employments.map((e) => ({ employmentId: e.id, accountId: e.accountId, onboardingStatus: e.onboardingStatus })),
    });
  }
}
