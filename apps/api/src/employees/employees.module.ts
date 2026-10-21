import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomFieldsModule } from '../custom-fields';
import { LocationsModule } from '../locations';
import { OrganizationModule } from '../organization';
import { SchedulesModule } from '../schedules';
import { CreateEmployeeBluePrint, TerminateEmployeeBluePrint, UpdateEmployeeBluePrint } from './blueprints';
import { EmployeeChecker } from './checkers';
import { EmployeesController, MyProfileController } from './controllers';
import { EmployeeIdentityDao, EmploymentDao } from './daos';
import { EmployeeIdentity, Employment } from './entities';
import { ResolveIdentityProcess } from './processes';
import { IdentityDataRule } from './rules';
import { EmployeesService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeIdentity, Employment]), OrganizationModule, LocationsModule, SchedulesModule, CustomFieldsModule],
  controllers: [EmployeesController, MyProfileController],
  providers: [
    EmployeeIdentityDao,
    EmploymentDao,
    IdentityDataRule,
    EmployeeChecker,
    ResolveIdentityProcess,
    CreateEmployeeBluePrint,
    UpdateEmployeeBluePrint,
    TerminateEmployeeBluePrint,
    EmployeesService,
  ],
  exports: [EmployeeIdentityDao, EmploymentDao, IdentityDataRule, ResolveIdentityProcess, CreateEmployeeBluePrint, EmployeesService],
})
export class EmployeesModule {}
