import { Module } from '@nestjs/common';
import { CustomFieldsModule } from '../custom-fields';
import { OrganizationModule } from '../organization';
import { AnalyticsController } from './controllers';
import { AnalyticsDao } from './daos';
import { AnalyticsService } from './services';

@Module({
  imports: [OrganizationModule, CustomFieldsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsDao, AnalyticsService],
  exports: [AnalyticsService, AnalyticsDao],
})
export class AnalyticsModule {}
