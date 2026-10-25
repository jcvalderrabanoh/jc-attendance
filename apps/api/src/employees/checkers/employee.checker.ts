import { Injectable } from '@nestjs/common';
import { CoreLinkService } from '../../core-link/services';
import { DepartmentDao, PositionDao } from '../../organization/daos';
import { LocationDao } from '../../locations/daos';
import { PolicyDao, ScheduleDao } from '../../schedules/daos';
import { EmployeeIdentityDao, EmploymentDao } from '../daos';
import { EmploymentDataDto } from '../dtos';
import { NormalizedIdentity } from '../rules';

/** Unicidad dentro de la cuenta y referencias válidas. */
@Injectable()
export class EmployeeChecker {
  constructor(
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
    private readonly locationDao: LocationDao,
    private readonly scheduleDao: ScheduleDao,
    private readonly policyDao: PolicyDao,
    private readonly coreLink: CoreLinkService,
  ) {}

  async validateEmployment(accountId: string, dto: EmploymentDataDto, employmentId?: string): Promise<string[]> {
    const errors: string[] = [];
    if (dto.employeeNumber) {
      const same = await this.employmentDao.findByEmployeeNumber(accountId, dto.employeeNumber);
      if (same && same.id !== employmentId) errors.push(`Ya existe un empleado con el número ${dto.employeeNumber}`);
    }
    const refs: [string | undefined, (a: string, id: string) => Promise<unknown>, string][] = [
      [dto.departmentId, (a, id) => this.departmentDao.findById(a, id), 'El departamento no existe'],
      [dto.positionId, (a, id) => this.positionDao.findById(a, id), 'El puesto no existe'],
      [dto.defaultLocationId, (a, id) => this.locationDao.findById(a, id), 'La sucursal no existe'],
      [dto.scheduleId, (a, id) => this.scheduleDao.findById(a, id), 'El horario no existe'],
      [dto.policyId, (a, id) => this.policyDao.findById(a, id), 'La política no existe'],
      [dto.managerEmploymentId, (a, id) => this.employmentDao.findById(a, id), 'El jefe directo no existe'],
    ];
    for (const [id, find, message] of refs) {
      if (id && !(await find(accountId, id))) errors.push(message);
    }
    if (dto.allowedLocationIds?.length) {
      const locations = await this.locationDao.findByIds(accountId, dto.allowedLocationIds);
      if (locations.length !== new Set(dto.allowedLocationIds).size) errors.push('Alguna sucursal permitida no existe');
    }
    return errors;
  }

  /**
   * Enlace con el usuario de jc-core (lumen-view): debe ser un usuario activo
   * de esta cuenta y no estar enlazado a otro empleado activo, porque
   * `POST /punches/self` resuelve el empleo por ese usuario. Si no cambia
   * (`current`), no se revalida: así una baja en jc-core no bloquea editar lo demás.
   */
  async validateCoreUserLink(accountId: string, coreUserId: string | null | undefined, current?: { id: string; coreUserId?: string | null }): Promise<string[]> {
    if (!coreUserId || coreUserId === current?.coreUserId) return [];
    if (!(await this.coreLink.findActiveUser(accountId, coreUserId))) return ['El usuario de lumen-view no existe en la cuenta o está inactivo'];
    const linked = await this.employmentDao.findByCoreUser(accountId, coreUserId);
    if (linked && linked.id !== current?.id) {
      const identity = await this.identityDao.findById(linked.identityId);
      const name = identity ? `${identity.firstName} ${identity.lastName}`.trim() : 'otro empleado';
      return [`Ese usuario de lumen-view ya está enlazado a ${name}`];
    }
    return [];
  }

  /** Teléfono/email/CURP ya registrados en esta cuenta para otra persona. */
  async validateIdentityInAccount(accountId: string, identity: NormalizedIdentity, identityId?: string): Promise<string[]> {
    const errors: string[] = [];
    if (identity.curp) {
      for (const other of await this.identityDao.findByCurp(identity.curp)) {
        if (other.id === identityId) continue;
        if (await this.employmentDao.findByIdentity(accountId, other.id)) errors.push('Ya existe un empleado con esa CURP en la cuenta');
      }
    }
    return errors;
  }
}
