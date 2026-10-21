import { Injectable, Logger } from '@nestjs/common';
import { sha256 } from '../../common';
import { ReportJobDao } from '../daos';
import { ReportFormatEnum, ReportJob } from '../entities';
import { renderCsv, renderPdf, renderXlsx } from '../renderers';
import { BuildReportDocumentProcess } from './build-report-document.process';

/** Genera el archivo de un job y lo guarda. Reejecutable: lo usa la cola con reintentos. */
@Injectable()
export class GenerateReportProcess {
  private readonly logger = new Logger(GenerateReportProcess.name);

  constructor(
    private readonly reportJobDao: ReportJobDao,
    private readonly buildDocument: BuildReportDocumentProcess,
  ) {}

  async process(job: ReportJob): Promise<void> {
    await this.reportJobDao.markRunning(job.id);
    try {
      const doc = await this.buildDocument.process(job);
      const file =
        job.format === ReportFormatEnum.Pdf ? await renderPdf(doc) : job.format === ReportFormatEnum.Xlsx ? await renderXlsx(doc) : renderCsv(doc);
      const params = job.params as { from: string; to: string };
      const fileName = `${job.type}_${params.from}_${params.to}.${job.format}`;
      await this.reportJobDao.markDone(job.id, file, fileName, sha256(file));
    } catch (err) {
      this.logger.error(`Reporte ${job.id} falló: ${(err as Error).message}`);
      await this.reportJobDao.markFailed(job.id, (err as Error).message);
      throw err;
    }
  }
}
