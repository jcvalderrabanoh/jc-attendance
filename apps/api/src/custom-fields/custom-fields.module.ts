import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsertCustomFieldBluePrint } from './blueprints';
import { CustomFieldChecker } from './checkers';
import { CustomFieldsController } from './controllers';
import { CustomFieldDefinitionDao } from './daos';
import { CustomFieldDefinition } from './entities';
import { CustomFieldValuesRule } from './rules';
import { CustomFieldsService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([CustomFieldDefinition])],
  controllers: [CustomFieldsController],
  providers: [CustomFieldDefinitionDao, CustomFieldChecker, CustomFieldValuesRule, UpsertCustomFieldBluePrint, CustomFieldsService],
  exports: [CustomFieldsService, CustomFieldDefinitionDao],
})
export class CustomFieldsModule {}
