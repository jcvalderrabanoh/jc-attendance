import { Injectable } from '@nestjs/common';
import { CoreUserContext, EmployeeContext, found, unwrap } from '../../common';
import { EmployeeIdentityDao, EmploymentDao } from '../../employees/daos';
import { CreateRequestBluePrint, DecideRequestBluePrint } from '../blueprints';
import { vacationDaysForYears } from '../checkers';
import { EmployeeRequestDao } from '../daos';
import { CreateRequestDto, DecideRequestDto, ListRequestsQueryDto } from '../dtos';
import { RequestStatusEnum } from '../entities';

@Injectable()
export class RequestsService {
  constructor(
    private readonly createBluePrint: CreateRequestBluePrint,
    private readonly decideBluePrint: DecideRequestBluePrint,
    private readonly requestDao: EmployeeRequestDao,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
  ) {}

  async list(accountId: string, q: ListRequestsQueryDto) {
    const where: Record<string, unknown> = {};
    if (q.status) where.requestStatus = q.status;
    if (q.type) where.type = q.type;
    if (q.employmentId) where.employmentId = q.employmentId;
    const page = await this.requestDao.findPage(accountId, where, q.page, q.limit);
    const employments = await this.employmentDao.findByIds(accountId, [...new Set(page.items.map((r) => r.employmentId))]);
    const identities = await this.identityDao.findByIds(employments.map((e) => e.identityId));
    const name = (employmentId: string) => {
      const e = employments.find((x) => x.id === employmentId);
      const i = e && identities.find((x) => x.id === e.identityId);
      return i ? `${i.firstName} ${i.lastName}` : '—';
    };
    return { ...page, items: page.items.map((r) => ({ ...r, employeeName: name(r.employmentId) })), pendingCount: await this.requestDao.countPending(accountId) };
  }

  async approve(user: CoreUserContext, id: string, dto: DecideRequestDto) {
    return unwrap(await this.decideBluePrint.execute({ user, requestId: id, approve: true, dto }));
  }

  async reject(user: CoreUserContext, id: string, dto: DecideRequestDto) {
    return unwrap(await this.decideBluePrint.execute({ user, requestId: id, approve: false, dto }));
  }

  // ── Empleado ─────────────────────────────────────────────────────────────

  async create(employee: EmployeeContext, dto: CreateRequestDto) {
    return unwrap(await this.createBluePrint.execute({ employee, dto }));
  }

  async mine(employee: EmployeeContext) {
    if (!employee.accountId || !employee.employmentId) return [];
    return (await this.requestDao.findPage(employee.accountId, { employmentId: employee.employmentId }, 1, 100)).items;
  }

  async cancel(employee: EmployeeContext, id: string) {
    const request = found(employee.accountId ? await this.requestDao.findById(employee.accountId, id) : null, 'La solicitud no existe');
    if (request.employmentId !== employee.employmentId || request.requestStatus !== RequestStatusEnum.Pending) {
      return request;
    }
    return this.requestDao.update(employee.accountId!, id, { requestStatus: RequestStatusEnum.Cancelled });
  }

  /** Saldo de vacaciones del año según antigüedad (LFT art. 76). */
  async vacationBalance(employee: EmployeeContext) {
    if (!employee.accountId || !employee.employmentId) return null;
    const employment = found(await this.employmentDao.findById(employee.accountId, employee.employmentId), 'No encontramos tu registro');
    const year = new Date().getUTCFullYear();
    const years = employment.hireDate ? Math.floor((Date.now() - Date.parse(employment.hireDate)) / (365.25 * 86_400_000)) : 0;
    const entitled = vacationDaysForYears(years);
    const taken = await this.requestDao.vacationDaysTaken(employment.id, year);
    return { year, yearsOfService: years, entitled, taken, available: Math.max(0, entitled - taken) };
  }
}
