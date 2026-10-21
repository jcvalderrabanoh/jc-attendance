import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomFieldsModule } from '../custom-fields';
import { EmployeeAuthModule } from '../employee-auth';
import { EmployeesModule } from '../employees';
import { LocationsModule } from '../locations';
import { OrganizationModule } from '../organization';
import { SchedulesModule } from '../schedules';
import { ResubmitOnboardingBluePrint, ReviewOnboardingBluePrint, SubmitOnboardingBluePrint } from './blueprints';
import { InvitationChecker } from './checkers';
import { JoinController, MyOnboardingController, OnboardingController } from './controllers';
import { InvitationDao, OnboardingRequestDao, OnboardingRuleDao } from './daos';
import { Invitation, OnboardingRequest, OnboardingRule } from './entities';
import { CheckInvitationProcess, CreateInvitationTokenProcess, GatherOnboardingFactsProcess, InvitationDaoLookup } from './processes';
import { OnboardingRulesEvaluator } from './rules';
import { OnboardingService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, OnboardingRequest, OnboardingRule]),
    EmployeesModule,
    EmployeeAuthModule,
    CustomFieldsModule,
    OrganizationModule,
    LocationsModule,
    SchedulesModule,
  ],
  controllers: [OnboardingController, JoinController, MyOnboardingController],
  providers: [
    InvitationDao,
    OnboardingRequestDao,
    OnboardingRuleDao,
    InvitationChecker,
    OnboardingRulesEvaluator,
    CreateInvitationTokenProcess,
    CheckInvitationProcess,
    GatherOnboardingFactsProcess,
    InvitationDaoLookup,
    SubmitOnboardingBluePrint,
    ReviewOnboardingBluePrint,
    ResubmitOnboardingBluePrint,
    OnboardingService,
  ],
  exports: [OnboardingRequestDao],
})
export class OnboardingModule {}
