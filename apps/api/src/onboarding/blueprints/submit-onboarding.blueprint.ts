import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok, signEmployeeToken } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { ConsentDao } from '../../employee-auth/daos';
import { ConsentKindEnum } from '../../employee-auth/entities';
import { VerifyOtpProcess } from '../../employee-auth/processes';
import { CreateEmployeeBluePrint, IdentityDataRule } from '../../employees';
import { OnboardingStatusEnum } from '../../employees/entities';
import { AccountSettingsDao } from '../../organization/daos';
import { InvitationDao, OnboardingRequestDao } from '../daos';
import { SubmitOnboardingDto } from '../dtos';
import { ReviewStatusEnum, RuleResult } from '../entities';
import { ONBOARDING_DECIDED_EVENT, ONBOARDING_SUBMITTED_EVENT, OnboardingEventPayload } from '../events';
import { CheckInvitationProcess, GatherOnboardingFactsProcess } from '../processes';
import { OnboardingRulesEvaluator } from '../rules';

export interface SubmitOnboardingInput {
  token: string;
  dto: SubmitOnboardingDto;
  ip: string | null;
  userAgent: string | null;
}

export interface SubmitOnboardingResult {
  requestId: string;
  reviewStatus: ReviewStatusEnum;
  /** Token de empleado para seguir el estado de su alta desde el PWA. */
  token: string;
  /** Solo advertencias e información (lo bloqueante no llega aquí). */
  findings: RuleResult[];
}

/**
 * Alta por liga: valida con las reglas de la cuenta, verifica el teléfono por
 * OTP (al final, para que un dato mal capturado no queme el código), consume
 * un uso de la liga, crea identidad + empleo pendiente y la solicitud. Si todo
 * está en verde y la liga no exige revisión, se aprueba sola.
 */
@Injectable()
export class SubmitOnboardingBluePrint implements BasicBluePrintInterface<SubmitOnboardingInput, SubmitOnboardingResult> {
  private readonly logger = new Logger(SubmitOnboardingBluePrint.name);

  constructor(
    private readonly checkInvitation: CheckInvitationProcess,
    private readonly gatherFacts: GatherOnboardingFactsProcess,
    private readonly evaluator: OnboardingRulesEvaluator,
    private readonly identityRule: IdentityDataRule,
    private readonly customFields: CustomFieldsService,
    private readonly verifyOtp: VerifyOtpProcess,
    private readonly invitationDao: InvitationDao,
    private readonly requestDao: OnboardingRequestDao,
    private readonly createEmployee: CreateEmployeeBluePrint,
    private readonly consentDao: ConsentDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ token, dto, ip, userAgent }: SubmitOnboardingInput): Promise<CheckRulesAndProcessInterfaceResult<SubmitOnboardingResult>> {
    const invitationCheck = await this.checkInvitation.process(token);
    if (!invitationCheck.success) return fail(invitationCheck.error!);
    const invitation = invitationCheck.data!;
    const accountId = invitation.accountId;

    const { value: identity, errors: formatErrors } = this.identityRule.normalize(dto.identity);
    if (invitation.targetPhone && identity.phoneE164 !== invitation.targetPhone) {
      return fail('Esta liga es personal y no corresponde a tu teléfono');
    }
    const cf = await this.customFields.validateValues(accountId, CustomFieldEntityEnum.Employment, dto.customFields, { onboarding: true });
    const facts = await this.gatherFacts.process({
      accountId,
      invitation,
      identity,
      customFields: cf.values,
      customFieldErrors: cf.errors,
      formatErrors,
      privacyAccepted: dto.consents.includes(ConsentKindEnum.PrivacyNotice),
      phoneVerified: true, // se comprueba abajo, tras las reglas de datos
    });
    const rules = await this.gatherFacts.rulesFor(accountId);
    const evaluation = this.evaluator.evaluate(rules, facts);
    if (evaluation.blocked) {
      return fail(...evaluation.results.filter((r) => r.outcome === 'fail').map((r) => r.message));
    }

    const otp = await this.verifyOtp.process(identity.phoneE164!, dto.otpCode);
    if (!otp.success) return fail(otp.error!);
    if (!(await this.invitationDao.redeem(invitation.id))) return fail('La liga ya alcanzó su límite de registros');

    const autoApprove = !invitation.requireApproval && evaluation.warnings === 0;
    const created = await this.createEmployee.execute({
      accountId,
      actor: null,
      verified: { phone: true },
      skipCustomFieldValidation: true,
      onboardingStatus: autoApprove ? OnboardingStatusEnum.Approved : OnboardingStatusEnum.Pending,
      dto: {
        identity: dto.identity,
        customFields: cf.values,
        departmentId: invitation.defaultDepartmentId ?? undefined,
        positionId: invitation.defaultPositionId ?? undefined,
        defaultLocationId: invitation.defaultLocationId ?? undefined,
        scheduleId: invitation.defaultScheduleId ?? undefined,
      },
    });
    if (!created.isValid) return created as unknown as CheckRulesAndProcessInterfaceResult<SubmitOnboardingResult>;
    const employment = created.data!;

    const settings = await this.accountSettingsDao.findByAccount(accountId);
    for (const kind of new Set(dto.consents)) {
      await this.consentDao.create({
        identityId: employment.identityId,
        accountId,
        kind,
        version: settings?.privacyNoticeVersion ?? '1',
        ip,
        userAgent: userAgent?.slice(0, 300) ?? null,
      });
    }

    const reviewStatus = autoApprove ? ReviewStatusEnum.Approved : ReviewStatusEnum.Pending;
    const request = await this.requestDao.create({
      accountId,
      invitationId: invitation.id,
      identityId: employment.identityId,
      employmentId: employment.id,
      submittedData: { ...dto.identity } as Record<string, unknown>,
      customFields: cf.values,
      validationResults: evaluation.results,
      riskScore: evaluation.riskScore,
      reviewStatus,
      reviewedAt: autoApprove ? new Date() : null,
      reviewComment: autoApprove ? 'Aprobada automáticamente: todas las reglas en verde' : null,
    });
    const payload: OnboardingEventPayload = { accountId, requestId: request.id, identityId: employment.identityId, reviewStatus };
    this.eventEmitter.emit(autoApprove ? ONBOARDING_DECIDED_EVENT : ONBOARDING_SUBMITTED_EVENT, payload);
    this.logger.log(`Alta ${request.id} (${reviewStatus}) en ${accountId}, riesgo ${evaluation.riskScore}`);

    return ok({
      requestId: request.id,
      reviewStatus,
      token: signEmployeeToken({
        identityId: employment.identityId,
        accountId: autoApprove ? accountId : null,
        employmentId: autoApprove ? employment.id : null,
      }),
      findings: evaluation.results.filter((r) => r.outcome !== 'pass'),
    });
  }
}
