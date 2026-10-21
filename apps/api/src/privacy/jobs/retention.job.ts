import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecordAuditProcess } from '../../audit/processes';
import { RetentionDao } from '../daos';

/** Mensual (día 1, 03:15 UTC): anonimiza a quien ya pasó el plazo de conservación. */
@Injectable()
export class RetentionJob {
  private readonly logger = new Logger(RetentionJob.name);

  constructor(
    private readonly retentionDao: RetentionDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  @Cron('15 3 1 * *')
  async run(): Promise<number> {
    if (process.env.DISABLE_JOBS === 'true') return 0;
    return this.execute();
  }

  async execute(): Promise<number> {
    const ids = await this.retentionDao.identitiesPastRetention();
    for (const id of ids) {
      await this.retentionDao.anonymize(id);
      await this.audit.process({ accountId: null, actor: null, entity: 'identity', entityId: id, action: 'retention_anonymize' });
    }
    if (ids.length) this.logger.log(`Retención: ${ids.length} personas anonimizadas`);
    return ids.length;
  }
}
