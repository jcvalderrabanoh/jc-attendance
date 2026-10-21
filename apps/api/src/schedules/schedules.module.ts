import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationModule } from '../organization';
import { UpsertScheduleBluePrint } from './blueprints';
import { ScheduleChecker } from './checkers';
import { SchedulesController } from './controllers';
import { HolidayDao, PolicyDao, ScheduleDao, ShiftDao } from './daos';
import { Holiday, Policy, Schedule, Shift } from './entities';
import { AccountBootstrappedSchedulesListener } from './listeners';
import { SeedAccountDefaultsProcess } from './processes';
import { PolicyResolverService, SchedulesService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Shift, Policy, Holiday]), OrganizationModule],
  controllers: [SchedulesController],
  providers: [
    PolicyDao,
    ScheduleDao,
    ShiftDao,
    HolidayDao,
    ScheduleChecker,
    UpsertScheduleBluePrint,
    SeedAccountDefaultsProcess,
    AccountBootstrappedSchedulesListener,
    PolicyResolverService,
    SchedulesService,
  ],
  exports: [PolicyResolverService, HolidayDao, PolicyDao, ScheduleDao, ShiftDao],
})
export class SchedulesModule {}
