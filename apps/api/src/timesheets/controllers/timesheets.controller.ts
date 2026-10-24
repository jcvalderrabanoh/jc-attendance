import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, AuthContext, CoreUserContext, CurrentAuth, EmployeeContext, ManagersOnly, Operators } from '../../common';
import { DateRangeQueryDto, IncidentDecisionDto, ListIncidentsQueryDto, RecalculateDto, TimesheetQueryDto } from '../dtos';
import { IncidentStatusEnum } from '../entities';
import { TimesheetsService } from '../services';

@ApiTags('Hojas de horas e incidencias')
@Controller()
export class TimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get('timesheets')
  @Auth()
  summary(@AccountId() accountId: string, @Query() q: TimesheetQueryDto) {
    return this.service.summary(accountId, q);
  }

  @Get('timesheets/:employmentId')
  @Auth()
  employee(@AccountId() accountId: string, @Param('employmentId', ParseUUIDPipe) id: string, @Query() q: DateRangeQueryDto) {
    return this.service.employeeDays(accountId, id, q.from, q.to);
  }

  @Post('timesheets/recalculate')
  @ManagersOnly()
  recalculate(@AccountId() accountId: string, @Body() dto: RecalculateDto, @CurrentAuth() actor: AuthContext) {
    return this.service.recalculateRange(accountId, dto, actor);
  }

  @Get('pay-periods')
  @Auth()
  payPeriods(@AccountId() accountId: string) {
    return this.service.payPeriods(accountId);
  }

  @Post('pay-periods/:id/close')
  @ManagersOnly()
  close(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.closePayPeriod(user, id);
  }

  @Get('incidents')
  @Auth()
  incidents(@AccountId() accountId: string, @Query() q: ListIncidentsQueryDto) {
    return this.service.incidents(accountId, q);
  }

  @Post('incidents/:id/justify')
  @Operators()
  justify(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: IncidentDecisionDto) {
    return this.service.decideIncident(user, id, IncidentStatusEnum.Justified, dto);
  }

  @Post('incidents/:id/dismiss')
  @Operators()
  dismiss(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: IncidentDecisionDto) {
    return this.service.decideIncident(user, id, IncidentStatusEnum.Dismissed, dto);
  }

  @Get('me/timesheet')
  @Auth({ kinds: ['employee'] })
  mine(@CurrentAuth() employee: EmployeeContext, @Query() q: DateRangeQueryDto) {
    return this.service.myTimesheet(employee, q.from, q.to);
  }
}
