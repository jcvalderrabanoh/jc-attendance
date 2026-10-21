import { Body, Controller, Get, Ip, Param, ParseUUIDPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { AccountId, Auth, CoreUserContext, CurrentAuth, EmployeeContext, KioskContext, Operators } from '../../common';
import { KioskPunchDto, ListPunchesQueryDto, ManualPunchDto, RegisterPunchDto, ReviewPunchDto } from '../dtos';
import { PunchesService } from '../services';

@ApiTags('Marcajes')
@Controller('punches')
export class PunchesController {
  constructor(private readonly service: PunchesService) {}

  @Get()
  @Auth()
  list(@AccountId() accountId: string, @Query() query: ListPunchesQueryDto) {
    return this.service.list(accountId, query);
  }

  /** Usuario de jc-core enlazado a un empleo checa desde core-front. */
  @Post('self')
  @Auth()
  selfPunch(@CurrentAuth() user: CoreUserContext, @Body() dto: RegisterPunchDto, @Ip() ip: string) {
    return this.service.registerAsCoreUser(user, dto, ip);
  }

  @Post('manual')
  @Operators()
  manual(@CurrentAuth() user: CoreUserContext, @Body() dto: ManualPunchDto) {
    return this.service.manual(user, dto);
  }

  @Post(':id/review')
  @Operators()
  review(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewPunchDto) {
    return this.service.review(user, id, dto);
  }

  @Get(':id/photo')
  @Auth()
  async photo(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const photo = await this.service.photo(accountId, id);
    res.setHeader('content-type', photo.mimeType);
    res.setHeader('cache-control', 'private, max-age=3600');
    res.send(photo.data);
  }
}

@ApiTags('App del empleado')
@Controller('me')
export class MyPunchesController {
  constructor(private readonly service: PunchesService) {}

  @Post('punches')
  @Auth({ kinds: ['employee'] })
  punch(@CurrentAuth() employee: EmployeeContext, @Body() dto: RegisterPunchDto, @Ip() ip: string) {
    return this.service.registerAsEmployee(employee, dto, ip);
  }

  @Get('punches')
  @Auth({ kinds: ['employee'] })
  mine(@CurrentAuth() employee: EmployeeContext, @Query('from') from: string, @Query('to') to: string) {
    return this.service.myPunches(employee, from, to);
  }

  @Get('status')
  @Auth({ kinds: ['employee'] })
  status(@CurrentAuth() employee: EmployeeContext) {
    return this.service.myStatus(employee);
  }
}

@ApiTags('Kiosco')
@Controller('kiosk')
export class KioskPunchesController {
  constructor(private readonly service: PunchesService) {}

  @Post('punches')
  @Auth({ kinds: ['kiosk'] })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  punch(@CurrentAuth() kiosk: KioskContext, @Body() dto: KioskPunchDto) {
    return this.service.registerAtKiosk(kiosk, dto);
  }
}
