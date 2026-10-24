import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { EmployeeChecker } from '../checkers';
import { EmploymentDao } from '../daos';
import { CreateEmployeeDto } from '../dtos';
import { Employment, OnboardingStatusEnum } from '../entities';
import { EMPLOYEE_ACTIVATED_EVENT, EmployeeEventPayload } from '../events';
import { ResolveIdentityProcess } from '../processes';
import { IdentityDataRule } from '../rules';

export interface CreateEmployeeInput {
  accountId: string;
  dto: CreateEmployeeDto;
  actor: AuthContext | null;
  onboardingStatus?: OnboardingStatusEnum;
  verified?: { phone?: boolean; email?: boolean };
  /** Los campos personalizados ya vienen validados (alta por liga). */
  skipCustomFieldValidation?: boolean;
  /**
   * Alta por liga: el formato de CURP/RFC/NSS ya lo evaluaron las reglas de la
   * cuenta (que pueden dejarlo como simple advertencia).
   */
  identityRulesApplied?: boolean;
}

/** Alta de empleado: identidad global (o la existente) + empleo en la cuenta. */
@Injectable()
export class CreateEmployeeBluePrint implements BasicBluePrintInterface<CreateEmployeeInput, Employment> {
  constructor(
    private readonly identityRule: IdentityDataRule,
    private readonly checker: EmployeeChecker,
    private readonly customFields: CustomFieldsService,
    private readonly resolveIdentity: ResolveIdentityProcess,
    private readonly employmentDao: EmploymentDao,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateEmployeeInput): Promise<CheckRulesAndProcessInterfaceResult<Employment>> {
    const { accountId, dto, actor } = input;
    const normalized = this.identityRule.normalize(dto.identity);
    const identityData = normalized.value;
    const errors = input.identityRulesApplied ? normalized.errors.filter((e) => !/CURP|RFC|NSS/.test(e)) : normalized.errors;
    errors.push(...(await this.checker.validateEmployment(accountId, dto)));
    errors.push(...(await this.checker.validateIdentityInAccount(accountId, identityData)));
    let customFields = dto.customFields ?? {};
    if (!input.skipCustomFieldValidation) {
      const cf = await this.customFields.validateValues(accountId, CustomFieldEntityEnum.Employment, dto.customFields);
      errors.push(...cf.errors);
      customFields = cf.values;
    }
    if (errors.length) return fail(...errors);

    const resolved = await this.resolveIdentity.process(identityData, input.verified);
    if (!resolved.success) return fail(resolved.error!);
    const { identity } = resolved.data!;
    if (await this.employmentDao.findByIdentity(accountId, identity.id)) {
      return fail('Esta persona ya está registrada como empleado en la cuenta');
    }
    const age = this.identityRule.ageOn(identity.birthDate);
    const { identity: _ignored, hourlyRate, dailySalary, ...employmentData } = dto;
    const employment = await this.employmentDao.create({
      ...employmentData,
      accountId,
      identityId: identity.id,
      customFields,
      hourlyRate: hourlyRate?.toString() ?? null,
      dailySalary: dailySalary?.toString() ?? null,
      isMinor: dto.isMinor ?? (age !== null && age < 18),
      onboardingStatus: input.onboardingStatus ?? OnboardingStatusEnum.Approved,
    });
    await this.audit.process({ accountId, actor, entity: 'employment', entityId: employment.id, action: 'create', after: employment });
    if (employment.onboardingStatus === OnboardingStatusEnum.Approved) {
      const payload: EmployeeEventPayload = { accountId, employmentId: employment.id, identityId: identity.id };
      this.eventEmitter.emit(EMPLOYEE_ACTIVATED_EVENT, payload);
    }
    return ok(employment);
  }
}
