import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { REPORTS_QUEUE } from '../config';
import { ReportJobDao } from '../daos';
import { ActionKeyOfReportsEnum } from '../enums';
import { GenerateReportProcess } from '../processes';

@Processor(REPORTS_QUEUE)
export class ReportsQueueProcessor {
  private readonly logger = new Logger(ReportsQueueProcessor.name);

  constructor(
    private readonly reportJobDao: ReportJobDao,
    private readonly generate: GenerateReportProcess,
  ) {}

  @Process(ActionKeyOfReportsEnum.Generate)
  async handle(job: Job<{ accountId: string; reportJobId: string }>): Promise<void> {
    const reportJob = await this.reportJobDao.findById(job.data.accountId, job.data.reportJobId);
    if (!reportJob) {
      this.logger.warn(`Job de reporte ${job.data.reportJobId} ya no existe`);
      return;
    }
    await this.generate.process(reportJob);
  }
}
