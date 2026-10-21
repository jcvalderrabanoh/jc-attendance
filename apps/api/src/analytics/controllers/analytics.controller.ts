import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, CoreUserContext, CurrentAuth } from '../../common';
import { AnalyticsRangeDto, ChartQueryDto } from '../dtos';
import { AnalyticsService } from '../services';

@ApiTags('Analítica')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @Auth()
  dashboard(@AccountId() accountId: string, @Query('locationId') locationId?: string) {
    return this.service.dashboard(accountId, locationId);
  }

  /** Tablero de grupo: todas las cuentas del usuario con el Checador. */
  @Get('group')
  @Auth()
  group(@CurrentAuth() user: CoreUserContext) {
    return this.service.group(user.email);
  }

  @Get('presence')
  @Auth()
  presence(@AccountId() accountId: string) {
    return this.service.presence(accountId);
  }

  @Get('daily-attendance')
  @Auth()
  daily(@AccountId() accountId: string, @Query() q: AnalyticsRangeDto) {
    return this.service.range(accountId, q);
  }

  @Get('chart-options')
  @Auth()
  options(@AccountId() accountId: string) {
    return this.service.chartOptions(accountId);
  }

  @Get('chart')
  @Auth()
  chart(@AccountId() accountId: string, @Query() q: ChartQueryDto) {
    return this.service.chart(accountId, q);
  }
}
