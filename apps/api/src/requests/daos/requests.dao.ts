import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantDao } from '../../common';
import { EmployeeRequest, RequestStatusEnum } from '../entities';

@Injectable()
export class EmployeeRequestDao extends TenantDao<EmployeeRequest> {
  constructor(@InjectRepository(EmployeeRequest) repository: Repository<EmployeeRequest>) {
    super(repository);
  }

  countPending(accountId: string): Promise<number> {
    return this.repository.count({ where: { accountId, requestStatus: RequestStatusEnum.Pending } });
  }

  /** Solicitudes que se traslapan con un rango (para evitar dobles vacaciones). */
  findOverlapping(accountId: string, employmentId: string, from: string, to: string): Promise<EmployeeRequest[]> {
    return this.repository
      .createQueryBuilder('r')
      .where('r.accountId = :accountId AND r.employmentId = :employmentId', { accountId, employmentId })
      .andWhere('r.requestStatus IN (:...st)', { st: [RequestStatusEnum.Pending, RequestStatusEnum.Approved] })
      .andWhere('r.fromDate <= :to AND r.toDate >= :from', { from, to })
      .andWhere("r.type IN ('vacation','permission','sick_leave')")
      .getMany();
  }

  /** Días de vacaciones aprobados en un año (saldo LFT art. 76). */
  async vacationDaysTaken(employmentId: string, year: number): Promise<number> {
    const rows = await this.repository.query(
      `SELECT COALESCE(SUM(("toDate" - "fromDate") + 1), 0)::int AS days FROM "attendance"."requests"
        WHERE "employmentId" = $1 AND "type" = 'vacation' AND "requestStatus" = 'approved'
          AND EXTRACT(YEAR FROM "fromDate") = $2`,
      [employmentId, year],
    );
    return rows[0]?.days ?? 0;
  }
}
