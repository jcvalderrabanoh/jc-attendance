import { Injectable } from '@nestjs/common';
import { PunchDao } from '../../punches/daos';
import { PunchTypeEnum } from '../../punches/entities';
import { EmployeeRequestDao } from '../daos';
import { CreateRequestDto } from '../dtos';
import { RequestTypeEnum } from '../entities';

/** Días de vacaciones por año de servicio (LFT art. 76, reforma 2023). */
export function vacationDaysForYears(years: number): number {
  if (years < 1) return 0;
  if (years <= 5) return 10 + years * 2;
  return 20 + Math.floor((years - 1) / 5) * 2;
}

@Injectable()
export class RequestChecker {
  constructor(
    private readonly requestDao: EmployeeRequestDao,
    private readonly punchDao: PunchDao,
  ) {}

  async validate(accountId: string, employmentId: string, dto: CreateRequestDto): Promise<string[]> {
    const errors: string[] = [];
    if (dto.fromDate > dto.toDate) errors.push('La fecha final es anterior a la inicial');
    if (Date.parse(dto.toDate) - Date.parse(dto.fromDate) > 90 * 86_400_000) errors.push('Máximo 90 días por solicitud');
    if ([RequestTypeEnum.Vacation, RequestTypeEnum.Permission, RequestTypeEnum.SickLeave].includes(dto.type)) {
      if ((await this.requestDao.findOverlapping(accountId, employmentId, dto.fromDate, dto.toDate)).length) {
        errors.push('Ya tienes una solicitud en esas fechas');
      }
    }
    if (dto.type === RequestTypeEnum.PunchCorrection) {
      const p = dto.payload ?? {};
      if (!Object.values(PunchTypeEnum).includes(p.punchType as PunchTypeEnum)) errors.push('Indica el tipo de marcaje (entrada/salida)');
      if (!p.at || Number.isNaN(Date.parse(String(p.at)))) errors.push('Indica la hora correcta');
      else if (Date.parse(String(p.at)) > Date.now()) errors.push('La hora corregida no puede ser futura');
      if (p.replacesPunchId) {
        const punch = await this.punchDao.findById(accountId, String(p.replacesPunchId));
        if (!punch || punch.employmentId !== employmentId) errors.push('El marcaje a corregir no es tuyo');
      }
    }
    if (dto.type === RequestTypeEnum.Overtime) {
      const minutes = Number(dto.payload?.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 12 * 60) errors.push('Indica los minutos extra (máx. 12 h)');
    }
    return errors;
  }
}
