import { Injectable } from '@nestjs/common';
import { normalizePhoneE164 } from '@jc-attendance/rules-engine';
import { DepartmentDao, PositionDao } from '../../organization/daos';
import { LocationDao } from '../../locations/daos';
import { ScheduleDao } from '../../schedules/daos';
import { UpsertInvitationDto } from '../dtos';
import { InvitationKindEnum } from '../entities';

@Injectable()
export class InvitationChecker {
  constructor(
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
    private readonly locationDao: LocationDao,
    private readonly scheduleDao: ScheduleDao,
  ) {}

  async validate(accountId: string, dto: UpsertInvitationDto): Promise<string[]> {
    const errors: string[] = [];
    if (dto.kind === InvitationKindEnum.Personal && !dto.targetPhone && !dto.targetEmail) {
      errors.push('Una liga personal necesita el teléfono o email de la persona');
    }
    if (dto.targetPhone && !normalizePhoneE164(dto.targetPhone)) errors.push('Teléfono destino inválido');
    if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) errors.push('La vigencia debe ser futura');
    const refs: [string | undefined, Promise<unknown> | null, string][] = [
      [dto.defaultDepartmentId, dto.defaultDepartmentId ? this.departmentDao.findById(accountId, dto.defaultDepartmentId) : null, 'El departamento no existe'],
      [dto.defaultPositionId, dto.defaultPositionId ? this.positionDao.findById(accountId, dto.defaultPositionId) : null, 'El puesto no existe'],
      [dto.defaultLocationId, dto.defaultLocationId ? this.locationDao.findById(accountId, dto.defaultLocationId) : null, 'La sucursal no existe'],
      [dto.defaultScheduleId, dto.defaultScheduleId ? this.scheduleDao.findById(accountId, dto.defaultScheduleId) : null, 'El horario no existe'],
    ];
    for (const [id, lookup, message] of refs) if (id && !(await lookup)) errors.push(message);
    return errors;
  }
}
