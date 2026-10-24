import { Body, Controller, Delete, Get, Headers, Ip, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AccountId, Auth, AuthContext, CoreUserContext, CurrentAuth, EmployeeContext, ManagersOnly, Operators } from '../../common';
import {
  JoinOtpDto,
  ListOnboardingQueryDto,
  ResubmitOnboardingDto,
  ReviewDecisionDto,
  SubmitOnboardingDto,
  UpdateOnboardingRuleDto,
  UpsertInvitationDto,
} from '../dtos';
import { OnboardingService } from '../services';

@ApiTags('Altas: ligas, reglas y validación')
@Controller()
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('invitations')
  @ManagersOnly()
  listInvitations(@AccountId() accountId: string) {
    return this.service.listInvitations(accountId);
  }

  @Post('invitations')
  @ManagersOnly()
  createInvitation(@AccountId() accountId: string, @Body() dto: UpsertInvitationDto, @CurrentAuth() actor: CoreUserContext) {
    return this.service.createInvitation(accountId, dto, actor);
  }

  @Put('invitations/:id')
  @ManagersOnly()
  updateInvitation(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertInvitationDto, @CurrentAuth() actor: AuthContext) {
    return this.service.updateInvitation(accountId, id, dto, actor);
  }

  @Post('invitations/:id/regenerate')
  @ManagersOnly()
  regenerate(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.regenerateInvitation(accountId, id, actor);
  }

  @Delete('invitations/:id')
  @ManagersOnly()
  removeInvitation(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.removeInvitation(accountId, id, actor);
  }

  @Get('onboarding/rules')
  @ManagersOnly()
  listRules(@AccountId() accountId: string) {
    return this.service.listRules(accountId);
  }

  @Put('onboarding/rules/:ruleKey')
  @ManagersOnly()
  updateRule(@AccountId() accountId: string, @Param('ruleKey') ruleKey: string, @Body() dto: UpdateOnboardingRuleDto, @CurrentAuth() actor: AuthContext) {
    return this.service.updateRule(accountId, ruleKey, dto, actor);
  }

  @Get('onboarding/requests')
  @Operators()
  listRequests(@AccountId() accountId: string, @Query() query: ListOnboardingQueryDto) {
    return this.service.listRequests(accountId, query);
  }

  @Get('onboarding/requests/:id')
  @Operators()
  getRequest(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRequest(accountId, id);
  }

  @Post('onboarding/requests/:id/approve')
  @ManagersOnly()
  approve(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewDecisionDto, @CurrentAuth() actor: CoreUserContext) {
    return this.service.review(accountId, id, 'approve', dto, actor);
  }

  @Post('onboarding/requests/:id/reject')
  @ManagersOnly()
  reject(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewDecisionDto, @CurrentAuth() actor: CoreUserContext) {
    return this.service.review(accountId, id, 'reject', dto, actor);
  }

  @Post('onboarding/requests/:id/request-info')
  @ManagersOnly()
  requestInfo(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewDecisionDto, @CurrentAuth() actor: CoreUserContext) {
    return this.service.review(accountId, id, 'request_info', dto, actor);
  }
}

/** Formulario público de alta por liga (`/unirse/:token` en el PWA). */
@ApiTags('Altas: formulario público')
@Controller('join')
@UseGuards(ThrottlerGuard)
export class JoinController {
  constructor(private readonly service: OnboardingService) {}

  @Get(':token')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  info(@Param('token') token: string) {
    return this.service.joinInfo(token);
  }

  @Post(':token/otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  otp(@Param('token') token: string, @Body() dto: JoinOtpDto, @Ip() ip: string) {
    return this.service.joinOtp(token, dto.phone, ip);
  }

  @Post(':token')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  submit(@Param('token') token: string, @Body() dto: SubmitOnboardingDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.service.submit(token, dto, ip, userAgent ?? null);
  }
}

@ApiTags('App del empleado')
@Controller('me/onboarding')
export class MyOnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get()
  @Auth({ kinds: ['employee'] })
  mine(@CurrentAuth() employee: EmployeeContext) {
    return this.service.myRequests(employee);
  }

  @Put(':id')
  @Auth({ kinds: ['employee'] })
  resubmit(@CurrentAuth() employee: EmployeeContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResubmitOnboardingDto) {
    return this.service.resubmit(employee, id, dto);
  }
}
