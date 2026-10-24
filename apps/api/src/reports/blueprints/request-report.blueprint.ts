import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BasicBluePrintInterface, CheckRulesAndProcessInterfaceResult, CoreUserContext, fail, ok } from '../../common';
import { reportsInline, REPORTS_JOB_OPTIONS, REPORTS_QUEUE } from '../config';
import { ReportJobDao } from '../daos';
import { CreateReportDto } from '../dtos';
import { ReportJob } from '../entities';
import { ActionKeyOfReportsEnum } from '../enums';
import { GenerateReportProcess } from '../processes';

export interface RequestReportInput {
  user: CoreUserContext;
  dto: CreateReportDto;
}

/** Registra el pedido de reporte y lo encola (o lo genera en línea si no hay Redis). */
@Injectable()
export class RequestReportBluePrint implements BasicBluePrintInterface<RequestReportInput, ReportJob> {
  private readonly logger = new Logger(RequestReportBluePrint.name);

  constructor(
    private readonly reportJobDao: ReportJobDao,
    private readonly generate: GenerateReportProcess,
    @Optional() @InjectQueue(REPORTS_QUEUE) private readonly queue?: Queue,
  ) {}

  async execute({ user, dto }: RequestReportInput): Promise<CheckRulesAndProcessInterfaceResult<ReportJob>> {
    if (dto.from > dto.to) return fail('El rango de fechas está invertido');
    if (Date.parse(dto.to) - Date.parse(dto.from) > 93 * 86_400_000) return fail('El rango máximo es de 3 meses');
    const { type, format, ...params } = dto;
    const job = await this.reportJobDao.create({ accountId: user.accountId, type, format, params: params as Record<string, unknown>, requestedByUserId: user.userId });
    if (reportsInline() || !this.queue) {
      await this.generate.process(job).catch(() => undefined);
    } else {
      await this.queue.add(ActionKeyOfReportsEnum.Generate, { accountId: user.accountId, reportJobId: job.id }, REPORTS_JOB_OPTIONS);
    }
    return ok((await this.reportJobDao.findById(user.accountId, job.id))!);
  }
}
