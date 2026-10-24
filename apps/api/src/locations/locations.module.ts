import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsertLocationBluePrint } from './blueprints';
import { LocationChecker } from './checkers';
import { LocationsController } from './controllers';
import { DeviceDao, LocationDao } from './daos';
import { Device, Location } from './entities';
import { ActivateKioskProcess, CreateKioskProcess, KioskQrProcess } from './processes';
import { GeofenceRule } from './rules';
import { LocationsService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Device])],
  controllers: [LocationsController],
  providers: [
    LocationDao,
    DeviceDao,
    LocationChecker,
    GeofenceRule,
    UpsertLocationBluePrint,
    CreateKioskProcess,
    ActivateKioskProcess,
    KioskQrProcess,
    LocationsService,
  ],
  exports: [LocationDao, DeviceDao, GeofenceRule],
})
export class LocationsModule {}
