import { Injectable } from '@nestjs/common';
import { CoreUserContext, found, unwrap } from '../../common';
import { RequestReportBluePrint } from '../blueprints';
import { ReportJobDao } from '../daos';
import { CreateReportDto } from '../dtos';
import { ReportFormatEnum, ReportJobStatusEnum, ReportTypeEnum } from '../entities';

const MIME: Record<ReportFormatEnum, string> = {
  [ReportFormatEnum.Pdf]: 'application/pdf',
  [ReportFormatEnum.Xlsx]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ReportFormatEnum.Csv]: 'text/csv; charset=utf-8',
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly requestReport: RequestReportBluePrint,
    private readonly reportJobDao: ReportJobDao,
  ) {}

  /** Catálogo para la galería de reportes (C12). */
  catalog() {
    return [
      { type: ReportTypeEnum.Timesheet, label: 'Hoja de horas por empleado', description: 'Entradas, salidas, horas, extra y firmas', formats: ['pdf', 'xlsx', 'csv'] },
      { type: ReportTypeEnum.DailyAttendance, label: 'Asistencia diaria', description: 'Lista por día con estado de cada persona', formats: ['pdf', 'xlsx', 'csv'] },
      { type: ReportTypeEnum.Incidents, label: 'Incidencias', description: 'Retardos, faltas y marcajes faltantes', formats: ['pdf', 'xlsx', 'csv'] },
      { type: ReportTypeEnum.Overtime, label: 'Horas extra', description: 'Dobles, triples y nocturnas (LFT)', formats: ['pdf', 'xlsx', 'csv'] },
      { type: ReportTypeEnum.Payroll, label: 'Prenómina', description: 'Incidencias para CONTPAQi / Aspel NOI', formats: ['xlsx', 'csv', 'pdf'] },
      { type: ReportTypeEnum.LegalRecord, label: 'Registro de jornada (LFT 132-XXXIV)', description: 'Para la autoridad laboral, con huella por día', formats: ['pdf', 'csv'] },
    ];
  }

  async request(user: CoreUserContext, dto: CreateReportDto) {
    return unwrap(await this.requestReport.execute({ user, dto }));
  }

  list(accountId: string, page?: number, limit?: number) {
    return this.reportJobDao.list(accountId, page, limit);
  }

  async get(accountId: string, id: string) {
    return found(await this.reportJobDao.findById(accountId, id), 'El reporte no existe');
  }

  async file(accountId: string, id: string) {
    const job = found(await this.reportJobDao.findWithFile(accountId, id), 'El reporte no existe');
    if (job.jobStatus !== ReportJobStatusEnum.Done || !job.file) return null;
    return { buffer: job.file, fileName: job.fileName ?? `reporte.${job.format}`, mimeType: MIME[job.format], sha256: job.sha256 };
  }
}
