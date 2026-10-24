import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, AuthContext, CurrentAuth, ManagersOnly } from '../../common';
import { CreateHolidayDto, UpsertPolicyDto, UpsertScheduleDto } from '../dtos';
import { SchedulesService } from '../services';

@ApiTags('Turnos, políticas y festivos')
@Controller()
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Get('policies')
  @Auth()
  listPolicies(@AccountId() accountId: string) {
    return this.service.listPolicies(accountId);
  }

  @Get('policies/:id')
  @Auth()
  getPolicy(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPolicy(accountId, id);
  }

  @Post('policies')
  @ManagersOnly()
  createPolicy(@AccountId() accountId: string, @Body() dto: UpsertPolicyDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsertPolicy(accountId, dto, actor);
  }

  @Put('policies/:id')
  @ManagersOnly()
  updatePolicy(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertPolicyDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsertPolicy(accountId, dto, actor, id);
  }

  @Delete('policies/:id')
  @ManagersOnly()
  removePolicy(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.removePolicy(accountId, id, actor);
  }

  @Get('schedules')
  @Auth({ kinds: ['core', 'employee'] })
  listSchedules(@AccountId() accountId: string) {
    return this.service.listSchedules(accountId);
  }

  @Post('schedules')
  @ManagersOnly()
  createSchedule(@AccountId() accountId: string, @Body() dto: UpsertScheduleDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsertSchedule(accountId, dto, actor);
  }

  @Put('schedules/:id')
  @ManagersOnly()
  updateSchedule(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertScheduleDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsertSchedule(accountId, dto, actor, id);
  }

  @Delete('schedules/:id')
  @ManagersOnly()
  removeSchedule(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.removeSchedule(accountId, id, actor);
  }

  @Get('holidays')
  @Auth({ kinds: ['core', 'employee'] })
  listHolidays(@AccountId() accountId: string, @Query('year', ParseIntPipe) year: number) {
    return this.service.listHolidays(accountId, year);
  }

  @Post('holidays')
  @ManagersOnly()
  addHoliday(@AccountId() accountId: string, @Body() dto: CreateHolidayDto, @CurrentAuth() actor: AuthContext) {
    return this.service.addHoliday(accountId, dto, actor);
  }

  @Post('holidays/seed-mx/:year')
  @ManagersOnly()
  seedHolidays(@AccountId() accountId: string, @Param('year', ParseIntPipe) year: number) {
    return this.service.seedMexicoHolidays(accountId, year);
  }

  @Delete('holidays/:id')
  @ManagersOnly()
  removeHoliday(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.removeHoliday(accountId, id, actor);
  }
}
