import { Module } from '@nestjs/common';
import { EmployeeAuthModule } from '../employee-auth';
import { EmployeesModule } from '../employees';
import { OnboardingModule } from '../onboarding';
import { PunchesModule } from '../punches';
import { RequestsModule } from '../requests';
import { PrivacyController } from './controllers';
import { PrivacyService } from './services';

@Module({
  imports: [EmployeesModule, EmployeeAuthModule, PunchesModule, RequestsModule, OnboardingModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
})
export class PrivacyModule {}
