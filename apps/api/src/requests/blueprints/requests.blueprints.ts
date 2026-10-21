import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecordAuditProcess } from '../../audit/processes';
import { BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, CoreUserContext, EmployeeContext, fail, ok } from '../../common';
import { RegisterPunchBluePrint } from '../../punches/blueprints';
import { PunchSourceEnum, PunchTypeEnum } from '../../punches/entities';
import { RequestChecker } from '../checkers';
import { EmployeeRequestDao } from '../daos';
import { CreateRequestDto, DecideRequestDto } from '../dtos';
import { EmployeeRequest, RequestStatusEnum, RequestTypeEnum } from '../entities';
import { REQUEST_DECIDED_EVENT, RequestDecidedPayload } from '../events';

export interface CreateRequestInput {
  employee: EmployeeContext;
  dto: CreateRequestDto;
}

@Injectable()
export class CreateRequestBluePrint implements BasicBluePrintInterface<CreateRequestInput, EmployeeRequest> {
  constructor(
    private readonly checker: RequestChecker,
    private readonly requestDao: EmployeeRequestDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  async execute({ employee, dto }: CreateRequestInput): Promise<CheckRulesAndProcessInterfaceResult<EmployeeRequest>> {
    if (!employee.accountId || !employee.employmentId) return fail('Elige primero la empresa');
    const errors = await this.checker.validate(employee.accountId, employee.employmentId, dto);
    if (errors.length) return fail(...errors);
    const request = await this.requestDao.create({
      accountId: employee.accountId,
      employmentId: employee.employmentId,
      type: dto.type,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      payload: dto.payload ?? {},
      comment: dto.comment ?? null,
    });
    await this.audit.process({ accountId: employee.accountId, actor: employee, entity: 'request', entityId: request.id, action: 'create', after: request });
    return ok(request);
  }
}

export interface DecideRequestInput {
  user: CoreUserContext;
  requestId: string;
  approve: boolean;
  dto: DecideRequestDto;
}

/**
 * Aprobación de 1 nivel. Una corrección de marcaje aprobada se registra como
 * marcaje manual que sustituye al original (nunca se edita); un permiso o
 * vacaciones recalculan sus días.
 */
@Injectable()
export class DecideRequestBluePrint implements BasicBluePrintInterface<DecideRequestInput, EmployeeRequest> {
  constructor(
    private readonly requestDao: EmployeeRequestDao,
    private readonly registerPunch: RegisterPunchBluePrint,
    private readonly audit: RecordAuditProcess,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ user, requestId, approve, dto }: DecideRequestInput): Promise<CheckRulesAndProcessInterfaceResult<EmployeeRequest>> {
    const request = await this.requestDao.findById(user.accountId, requestId);
    if (!request) return fail('La solicitud no existe');
    if (request.requestStatus !== RequestStatusEnum.Pending) return fail('La solicitud ya fue resuelta');
    if (!approve && !dto.comment) return fail('Indica el motivo del rechazo');

    if (approve && request.type === RequestTypeEnum.PunchCorrection) {
      const p = request.payload as { punchType: PunchTypeEnum; at: string; replacesPunchId?: string };
      const punch = await this.registerPunch.execute({
        accountId: user.accountId,
        employmentId: request.employmentId,
        source: PunchSourceEnum.Manual,
        actor: user,
        type: p.punchType,
        idempotencyKey: `correction-${request.id}`,
        clientAt: new Date(p.at),
        manual: { at: new Date(p.at), reason: `Corrección solicitada por el empleado (${request.id})`, replacesPunchId: p.replacesPunchId ?? null, userId: user.userId },
      });
      if (!punch.isValid) return fail(...punch.constraints.map((c) => c.error ?? 'No se pudo registrar la corrección'));
    }

    const saved = await this.requestDao.update(user.accountId, requestId, {
      requestStatus: approve ? RequestStatusEnum.Approved : RequestStatusEnum.Rejected,
      decidedByUserId: user.userId,
      decidedAt: new Date(),
      decisionComment: dto.comment ?? null,
    });
    await this.audit.process({ accountId: user.accountId, actor: user, entity: 'request', entityId: requestId, action: approve ? 'approve' : 'reject', before: request, after: saved });
    const payload: RequestDecidedPayload = {
      accountId: user.accountId,
      requestId,
      employmentId: request.employmentId,
      fromDate: request.fromDate,
      toDate: request.toDate,
      approved: approve,
    };
    this.eventEmitter.emit(REQUEST_DECIDED_EVENT, payload);
    return ok(saved!);
  }
}
