import { Injectable, Logger } from '@nestjs/common';
import { AuthContext } from '../../common';
import { AuditLogDao } from '../daos';

export interface AuditEntry {
  accountId: string | null;
  actor: AuthContext | null;
  entity: string;
  entityId?: string | null;
  action: string;
  before?: object | null;
  after?: object | null;
}

/**
 * Escribe una línea en la bitácora. Nunca hace fallar al llamador: si la
 * bitácora falla se registra en el log (eventual consistency, como jc-core).
 */
@Injectable()
export class RecordAuditProcess {
  private readonly logger = new Logger(RecordAuditProcess.name);

  constructor(private readonly auditLogDao: AuditLogDao) {}

  async process(entry: AuditEntry): Promise<void> {
    try {
      const actor = entry.actor;
      await this.auditLogDao.insert({
        accountId: entry.accountId,
        actorType: actor ? (actor.kind === 'core' ? 'user' : actor.kind) : 'system',
        actorId: actor
          ? actor.kind === 'core'
            ? actor.userId
            : actor.kind === 'employee'
              ? actor.identityId
              : actor.deviceId
          : null,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        action: entry.action,
        before: (entry.before as Record<string, unknown>) ?? null,
        after: (entry.after as Record<string, unknown>) ?? null,
      });
    } catch (err) {
      this.logger.error(`No se pudo registrar ${entry.entity}.${entry.action}: ${(err as Error).message}`);
    }
  }
}
