import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from '../employees';
import { OrganizationModule } from '../organization';
import { EmployeeLoginBluePrint } from './blueprints';
import { EmployeeAuthController } from './controllers';
import { ConsentDao, OtpChallengeDao } from './daos';
import { Consent, OtpChallenge } from './entities';
import { RequestOtpProcess, VerifyOtpProcess } from './processes';
import { otpSenderProvider } from './providers';
import { EmployeeAuthService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([OtpChallenge, Consent]), EmployeesModule, OrganizationModule],
  controllers: [EmployeeAuthController],
  providers: [OtpChallengeDao, ConsentDao, otpSenderProvider, RequestOtpProcess, VerifyOtpProcess, EmployeeLoginBluePrint, EmployeeAuthService],
  exports: [ConsentDao, RequestOtpProcess, VerifyOtpProcess],
})
export class EmployeeAuthModule {}
