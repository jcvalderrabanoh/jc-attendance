import { Body, Controller, Get, Headers, Ip, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AccountId, Auth, CurrentAuth, EmployeeContext } from '../../common';
import { GrantConsentsDto, RequestOtpDto, RevokeConsentDto, SelectEmploymentDto, VerifyOtpDto } from '../dtos';
import { EmployeeAuthService } from '../services';

@ApiTags('Acceso del empleado')
@Controller('employee-auth')
export class EmployeeAuthController {
  constructor(private readonly service: EmployeeAuthService) {}

  @Post('otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.service.sendCode(dto.destination, dto.channel, ip);
  }

  @Post('verify')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify(@Body() dto: VerifyOtpDto) {
    return this.service.login(dto.destination, dto.code);
  }

  @Post('select-employment')
  @Auth({ kinds: ['employee'] })
  select(@CurrentAuth() employee: EmployeeContext, @Body() dto: SelectEmploymentDto) {
    return this.service.selectEmployment(employee, dto.employmentId);
  }

  @Get('consents')
  @Auth({ kinds: ['employee'] })
  consents(@CurrentAuth() employee: EmployeeContext) {
    return this.service.consents(employee);
  }

  @Post('consents')
  @Auth({ kinds: ['employee'] })
  grant(
    @CurrentAuth() employee: EmployeeContext,
    @AccountId() accountId: string,
    @Body() dto: GrantConsentsDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.service.grant(employee, accountId, dto.kinds, ip, userAgent ?? null);
  }

  @Post('consents/revoke')
  @Auth({ kinds: ['employee'] })
  revoke(@CurrentAuth() employee: EmployeeContext, @AccountId() accountId: string, @Body() dto: RevokeConsentDto) {
    return this.service.revoke(employee, accountId, dto.kind);
  }
}
