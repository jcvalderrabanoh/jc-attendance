import { Module } from '@nestjs/common';
import { EmployeeAuthModule } from '../employee-auth';
import { EmployeesModule } from '../employees';
import { OnboardingModule } from '../onboarding';
import { PunchesModule } from '../punches';
import { RequestsModule } from '../requests';
import { PrivacyController } from './controllers';
import { RetentionDao } from './daos';
import { RetentionJob } from './jobs';
import { PrivacyService } from './services';

@Module({
  imports: [EmployeesModule, EmployeeAuthModule, PunchesModule, RequestsModule, OnboardingModule],
  controllers: [PrivacyController],
  providers: [PrivacyService, RetentionDao, RetentionJob],
  exports: [RetentionJob],
})
export class PrivacyModule {}
