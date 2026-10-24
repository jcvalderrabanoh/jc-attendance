import { Injectable } from '@nestjs/common';
import { classifyJornada, DAILY_MAX_MINUTES, parseWallTime } from '@jc-attendance/rules-engine';
import { UpsertScheduleDto } from '../dtos';

export interface ScheduleCheck {
  errors: string[];
  /** Avisos que no bloquean (p. ej. turno mayor a la jornada legal). */
  warnings: string[];
}

@Injectable()
export class ScheduleChecker {
  validate(dto: UpsertScheduleDto): ScheduleCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const days = new Set<number>();
    let weeklyMinutes = 0;
    for (const shift of dto.shifts) {
      if (days.has(shift.dayOfWeek)) errors.push(`Hay dos turnos para el día ${shift.dayOfWeek}`);
      days.add(shift.dayOfWeek);
      const start = parseWallTime(shift.startTime);
      let end = parseWallTime(shift.endTime);
      if (end === start) errors.push(`El turno del día ${shift.dayOfWeek} empieza y termina a la misma hora`);
      if (end < start) end += 24 * 60;
      const paid = end - start - (shift.paidBreak ? 0 : shift.breakMinutes ?? 0);
      weeklyMinutes += paid;
      const jornada = classifyJornada(shift.startTime, shift.endTime);
      if (paid > DAILY_MAX_MINUTES[jornada]) {
        warnings.push(`El turno del día ${shift.dayOfWeek} (${shift.startTime}–${shift.endTime}) supera la jornada ${jornada} máxima de la LFT`);
      }
    }
    if (weeklyMinutes > 48 * 60) warnings.push('El horario supera 48 h semanales (LFT 2026; 46 h desde 2027)');
    if (dto.shifts.length === 7) warnings.push('El horario no deja día de descanso (LFT art. 69: uno por cada seis trabajados)');
    return { errors, warnings };
  }
}
