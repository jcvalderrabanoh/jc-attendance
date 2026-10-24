import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAuthModule } from '../employee-auth';
import { EmployeesModule } from '../employees';
import { LocationsModule } from '../locations';
import { OrganizationModule } from '../organization';
import { SchedulesModule } from '../schedules';
import { RegisterPunchBluePrint } from './blueprints';
import { KioskPunchesController, MyPunchesController, PunchesController } from './controllers';
import { PunchDao, PunchPhotoDao } from './daos';
import { Punch, PunchPhoto } from './entities';
import { GeoConsentProcess, VerifyKioskQrProcess } from './processes';
import { PunchRiskRule } from './rules';
import { PunchesService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Punch, PunchPhoto]), EmployeesModule, EmployeeAuthModule, LocationsModule, OrganizationModule, SchedulesModule],
  controllers: [PunchesController, MyPunchesController, KioskPunchesController],
  providers: [PunchDao, PunchPhotoDao, PunchRiskRule, VerifyKioskQrProcess, GeoConsentProcess, RegisterPunchBluePrint, PunchesService],
  exports: [PunchDao, RegisterPunchBluePrint],
})
export class PunchesModule {}
