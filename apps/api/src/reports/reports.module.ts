import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from '../employees';
import { OrganizationModule } from '../organization';
import { PunchesModule } from '../punches';
import { TimesheetsModule } from '../timesheets';
import { RequestReportBluePrint } from './blueprints';
import { REPORTS_QUEUE } from './config';
import { ReportsController } from './controllers';
import { ReportJobDao } from './daos';
import { ReportJob } from './entities';
import { BuildReportDocumentProcess, GenerateReportProcess } from './processes';
import { ReportsQueueProcessor } from './queue';
import { ReportsService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportJob]),
    BullModule.registerQueue({ name: REPORTS_QUEUE }),
    EmployeesModule,
    OrganizationModule,
    PunchesModule,
    TimesheetsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportJobDao, BuildReportDocumentProcess, GenerateReportProcess, RequestReportBluePrint, ReportsQueueProcessor, ReportsService],
})
export class ReportsModule {}
