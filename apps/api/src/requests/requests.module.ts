import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from '../employees';
import { PunchesModule } from '../punches';
import { TimesheetsModule } from '../timesheets';
import { CreateRequestBluePrint, DecideRequestBluePrint } from './blueprints';
import { RequestChecker } from './checkers';
import { MyRequestsController, RequestsController } from './controllers';
import { EmployeeRequestDao } from './daos';
import { EmployeeRequest } from './entities';
import { RequestDecidedListener } from './listeners';
import { RequestsService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeRequest]), EmployeesModule, PunchesModule, TimesheetsModule],
  controllers: [RequestsController, MyRequestsController],
  providers: [EmployeeRequestDao, RequestChecker, CreateRequestBluePrint, DecideRequestBluePrint, RequestDecidedListener, RequestsService],
  exports: [EmployeeRequestDao],
})
export class RequestsModule {}
