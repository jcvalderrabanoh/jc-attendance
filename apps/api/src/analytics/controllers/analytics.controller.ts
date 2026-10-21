import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth } from '../../common';
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
