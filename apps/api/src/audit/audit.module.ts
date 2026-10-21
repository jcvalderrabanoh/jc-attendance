import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './controllers';
import { AuditLogDao } from './daos';
import { AuditLog } from './entities';
import { RecordAuditProcess } from './processes';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditLogDao, RecordAuditProcess],
  exports: [RecordAuditProcess],
})
export class AuditModule {}
