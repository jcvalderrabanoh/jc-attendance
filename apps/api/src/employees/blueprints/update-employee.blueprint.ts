import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, fail, ok, StatusForEntityEnum } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { EmployeeChecker } from '../checkers';
import { EmployeeIdentityDao, EmploymentDao } from '../daos';
import { TerminateEmployeeDto, UpdateEmployeeDto } from '../dtos';
import { Employment } from '../entities';
import { EMPLOYEE_TERMINATED_EVENT } from '../events';
import { IdentityDataRule } from '../rules';

export interface UpdateEmployeeInput {
  accountId: string;
  employmentId: string;
  dto: UpdateEmployeeDto;
  actor: AuthContext;
}

/**
 * Edita datos laborales y, si se mandan, los de identidad. Los datos de
 * identidad son de la persona: si trabaja para otros patrones, solo se
 * permiten nombre/CURP/RFC/NSS (no teléfono ni email, que son su acceso).
 */
@Injectable()
export class UpdateEmployeeBluePrint implements BasicBluePrintInterface<UpdateEmployeeInput, Employment> {
  constructor(
    private readonly identityRule: IdentityDataRule,
    private readonly checker: EmployeeChecker,
    private readonly customFields: CustomFieldsService,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute({ accountId, employmentId, dto, actor }: UpdateEmployeeInput): Promise<CheckRulesAndProcessInterfaceResult<Employment>> {
    const current = await this.employmentDao.findById(accountId, employmentId);
    if (!current) return fail('El empleado no existe');
    const errors = await this.checker.validateEmployment(accountId, dto, employmentId);

    let identityPatch: ReturnType<IdentityDataRule['normalize']>['value'] | null = null;
    if (dto.identity) {
      const { value, errors: idErrors } = this.identityRule.normalize(dto.identity);
      errors.push(...idErrors);
      const sharing = (await this.employmentDao.findAllForIdentity(current.identityId)).length > 1;
      if (sharing && (value.phoneE164 !== undefined || value.email !== undefined)) {
        errors.push('El teléfono y el email los cambia la persona desde su app (trabaja para más de un patrón)');
      }
      if (value.phoneE164) {
        const other = await this.identityDao.findByPhone(value.phoneE164);
        if (other && other.id !== current.identityId) errors.push('Ese teléfono ya pertenece a otra persona');
      }
      errors.push(...(await this.checker.validateIdentityInAccount(accountId, value, current.identityId)));
      identityPatch = value;
    }
    let customFields: Record<string, unknown> | undefined;
    if (dto.customFields) {
      const merged = { ...current.customFields, ...dto.customFields };
      const cf = await this.customFields.validateValues(accountId, CustomFieldEntityEnum.Employment, merged);
      errors.push(...cf.errors);
      customFields = cf.values;
    }
    if (errors.length) return fail(...errors);

    if (identityPatch && Object.keys(identityPatch).length) await this.identityDao.update(current.identityId, identityPatch);
    const { identity: _ignored, hourlyRate, dailySalary, ...employmentData } = dto;
    const saved = await this.employmentDao.update(accountId, employmentId, {
      ...employmentData,
      ...(customFields ? { customFields } : {}),
      ...(hourlyRate !== undefined ? { hourlyRate: hourlyRate.toString() } : {}),
      ...(dailySalary !== undefined ? { dailySalary: dailySalary.toString() } : {}),
    });
    await this.audit.process({ accountId, actor, entity: 'employment', entityId: employmentId, action: 'update', before: current, after: saved });
    return ok(saved!);
  }
}

export interface TerminateEmployeeInput {
  accountId: string;
  employmentId: string;
  dto: TerminateEmployeeDto;
  actor: AuthContext;
}

/** Baja: cierra el acceso y conserva los registros (retención LFT 804–805). */
@Injectable()
export class TerminateEmployeeBluePrint implements BasicBluePrintInterface<TerminateEmployeeInput, Employment> {
  constructor(
    private readonly employmentDao: EmploymentDao,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ accountId, employmentId, dto, actor }: TerminateEmployeeInput): Promise<CheckRulesAndProcessInterfaceResult<Employment>> {
    const current = await this.employmentDao.findById(accountId, employmentId);
    if (!current) return fail('El empleado no existe');
    if (current.status === StatusForEntityEnum.Inactive) return fail('El empleado ya está dado de baja');
    const saved = await this.employmentDao.update(accountId, employmentId, {
      status: StatusForEntityEnum.Inactive,
      terminationDate: dto.terminationDate,
    });
    await this.audit.process({ accountId, actor, entity: 'employment', entityId: employmentId, action: 'terminate', before: current, after: { ...saved, reason: dto.reason } });
    this.eventEmitter.emit(EMPLOYEE_TERMINATED_EVENT, { accountId, employmentId, identityId: current.identityId });
    return ok(saved!);
  }
}
