import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from '../employees';
import { LocationsModule } from '../locations';
import { OrganizationModule } from '../organization';
import { PunchesModule } from '../punches';
import { EmployeeRequest } from '../requests/entities';
import { SchedulesModule } from '../schedules';
import { TimesheetsController } from './controllers';
import { ApprovedLeaveDao, IncidentDao, PayPeriodDao, WorkdayDao } from './daos';
import { Incident, PayPeriod, Workday } from './entities';
import { AttendanceJobs } from './jobs';
import { PunchChangedListener } from './listeners';
import { RecalculateWorkdayProcess } from './processes';
import { TimesheetsService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workday, Incident, PayPeriod, EmployeeRequest]),
    EmployeesModule,
    LocationsModule,
    OrganizationModule,
    PunchesModule,
    SchedulesModule,
  ],
  controllers: [TimesheetsController],
  providers: [WorkdayDao, IncidentDao, PayPeriodDao, ApprovedLeaveDao, RecalculateWorkdayProcess, PunchChangedListener, AttendanceJobs, TimesheetsService],
  exports: [WorkdayDao, IncidentDao, RecalculateWorkdayProcess, TimesheetsService],
})
export class TimesheetsModule {}
