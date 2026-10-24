import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, CoreUserContext, fail, ok, StatusForEntityEnum } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { EmploymentDao, IdentityDataRule, EmployeeIdentityDao } from '../../employees';
import { EMPLOYEE_ACTIVATED_EVENT } from '../../employees/events';
import { OnboardingStatusEnum } from '../../employees/entities';
import { OnboardingRequestDao } from '../daos';
import { ResubmitOnboardingDto, ReviewDecisionDto } from '../dtos';
import { OnboardingRequest, ReviewStatusEnum } from '../entities';
import { ONBOARDING_DECIDED_EVENT, ONBOARDING_SUBMITTED_EVENT, OnboardingEventPayload } from '../events';
import { GatherOnboardingFactsProcess, InvitationDaoLookup } from '../processes';
import { OnboardingRulesEvaluator } from '../rules';

export type ReviewAction = 'approve' | 'reject' | 'request_info';

export interface ReviewOnboardingInput {
  accountId: string;
  requestId: string;
  action: ReviewAction;
  dto: ReviewDecisionDto;
  actor: CoreUserContext;
}

/** Decisión de RH sobre una solicitud de alta. */
@Injectable()
export class ReviewOnboardingBluePrint implements BasicBluePrintInterface<ReviewOnboardingInput, OnboardingRequest> {
  constructor(
    private readonly requestDao: OnboardingRequestDao,
    private readonly employmentDao: EmploymentDao,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ accountId, requestId, action, dto, actor }: ReviewOnboardingInput): Promise<CheckRulesAndProcessInterfaceResult<OnboardingRequest>> {
    const request = await this.requestDao.findById(accountId, requestId);
    if (!request) return fail('La solicitud no existe');
    if (![ReviewStatusEnum.Pending, ReviewStatusEnum.NeedsInfo].includes(request.reviewStatus)) {
      return fail('La solicitud ya fue resuelta');
    }
    if (action === 'request_info' && !dto.comment) return fail('Indica qué información falta');
    if (action === 'reject' && !dto.comment) return fail('Indica el motivo del rechazo');

    if (dto.employeeNumber && action === 'approve') {
      const same = await this.employmentDao.findByEmployeeNumber(accountId, dto.employeeNumber);
      if (same && same.id !== request.employmentId) return fail(`Ya existe un empleado con el número ${dto.employeeNumber}`);
    }

    const reviewStatus = { approve: ReviewStatusEnum.Approved, reject: ReviewStatusEnum.Rejected, request_info: ReviewStatusEnum.NeedsInfo }[action];
    const saved = await this.requestDao.update(accountId, requestId, {
      reviewStatus,
      reviewedByUserId: actor.userId,
      reviewedAt: new Date(),
      reviewComment: dto.comment ?? null,
    });
    if (request.employmentId) {
      if (action === 'approve') {
        await this.employmentDao.update(accountId, request.employmentId, {
          onboardingStatus: OnboardingStatusEnum.Approved,
          status: StatusForEntityEnum.Active,
          ...(dto.employeeNumber ? { employeeNumber: dto.employeeNumber } : {}),
        });
        this.eventEmitter.emit(EMPLOYEE_ACTIVATED_EVENT, { accountId, employmentId: request.employmentId, identityId: request.identityId });
      } else if (action === 'reject') {
        await this.employmentDao.update(accountId, request.employmentId, {
          onboardingStatus: OnboardingStatusEnum.Rejected,
          status: StatusForEntityEnum.Deleted,
        });
      }
    }
    await this.audit.process({ accountId, actor, entity: 'onboarding_request', entityId: requestId, action, before: request, after: saved });
    const payload: OnboardingEventPayload = { accountId, requestId, identityId: request.identityId ?? null, reviewStatus, comment: dto.comment };
    this.eventEmitter.emit(ONBOARDING_DECIDED_EVENT, payload);
    return ok(saved!);
  }
}

export interface ResubmitOnboardingInput {
  requestId: string;
  identityId: string;
  dto: ResubmitOnboardingDto;
  actor: AuthContext;
}

/** El empleado corrige su alta cuando RH le pidió información. Vuelve a la cola. */
@Injectable()
export class ResubmitOnboardingBluePrint implements BasicBluePrintInterface<ResubmitOnboardingInput, OnboardingRequest> {
  constructor(
    private readonly requestDao: OnboardingRequestDao,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly identityRule: IdentityDataRule,
    private readonly customFields: CustomFieldsService,
    private readonly gatherFacts: GatherOnboardingFactsProcess,
    private readonly invitations: InvitationDaoLookup,
    private readonly evaluator: OnboardingRulesEvaluator,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ requestId, identityId, dto, actor }: ResubmitOnboardingInput): Promise<CheckRulesAndProcessInterfaceResult<OnboardingRequest>> {
    const request = await this.requestDao.findByIdForIdentity(requestId, identityId);
    if (!request) return fail('La solicitud no existe');
    if (request.reviewStatus !== ReviewStatusEnum.NeedsInfo) return fail('Tu solicitud no tiene cambios pendientes');
    const accountId = request.accountId;
    const current = await this.identityDao.findById(identityId);
    if (!current) return fail('No encontramos tu registro');

    // El teléfono es el acceso: no se cambia aquí.
    const { phone: _phone, ...editable } = dto.identity ?? {};
    const { value: patch, errors: formatErrors } = this.identityRule.normalize(editable);
    const merged = { ...current, ...patch };
    const cfInput = { ...request.customFields, ...(dto.customFields ?? {}) };
    const cf = await this.customFields.validateValues(accountId, CustomFieldEntityEnum.Employment, cfInput, { onboarding: true });
    const invitation = await this.invitations.find(accountId, request.invitationId);
    const facts = await this.gatherFacts.process({
      accountId,
      invitation,
      identity: merged,
      selfIdentityId: identityId,
      customFields: cf.values,
      customFieldErrors: cf.errors,
      formatErrors,
      privacyAccepted: true,
      phoneVerified: true,
    });
    const evaluation = this.evaluator.evaluate(await this.gatherFacts.rulesFor(accountId), facts);
    if (evaluation.blocked) return fail(...evaluation.results.filter((r) => r.outcome === 'fail').map((r) => r.message));

    if (Object.keys(patch).length) await this.identityDao.update(identityId, patch);
    if (request.employmentId) {
      const employment = await this.employmentDao.findById(accountId, request.employmentId);
      await this.employmentDao.update(accountId, request.employmentId, { customFields: { ...(employment?.customFields ?? {}), ...cf.values } });
    }
    const saved = await this.requestDao.update(accountId, requestId, {
      reviewStatus: ReviewStatusEnum.Pending,
      submittedData: { ...request.submittedData, ...editable },
      customFields: cf.values,
      validationResults: evaluation.results,
      riskScore: evaluation.riskScore,
    });
    await this.audit.process({ accountId, actor, entity: 'onboarding_request', entityId: requestId, action: 'resubmit', after: saved });
    this.eventEmitter.emit(ONBOARDING_SUBMITTED_EVENT, { accountId, requestId, identityId, reviewStatus: ReviewStatusEnum.Pending });
    return ok(saved!);
  }
}
