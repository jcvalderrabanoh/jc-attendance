import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsertCatalogItemBluePrint } from './blueprints';
import { CatalogChecker } from './checkers';
import { OrganizationController } from './controllers';
import { AccountSettingsDao, DepartmentDao, PositionDao } from './daos';
import { AccountSettings, Department, Position } from './entities';
import { BootstrapAccountProcess } from './processes';
import { OrganizationService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Position, AccountSettings])],
  controllers: [OrganizationController],
  providers: [
    DepartmentDao,
    PositionDao,
    AccountSettingsDao,
    CatalogChecker,
    UpsertCatalogItemBluePrint,
    BootstrapAccountProcess,
    OrganizationService,
  ],
  exports: [OrganizationService, AccountSettingsDao, DepartmentDao, PositionDao],
})
export class OrganizationModule {}
