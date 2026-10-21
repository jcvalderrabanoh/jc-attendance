import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, CoreUserContext, CurrentAuth, EmployeeContext, Operators } from '../../common';
import { CreateRequestDto, DecideRequestDto, ListRequestsQueryDto } from '../dtos';
import { RequestsService } from '../services';

@ApiTags('Solicitudes')
@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  @Auth()
  list(@AccountId() accountId: string, @Query() q: ListRequestsQueryDto) {
    return this.service.list(accountId, q);
  }

  @Post(':id/approve')
  @Operators()
  approve(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideRequestDto) {
    return this.service.approve(user, id, dto);
  }

  @Post(':id/reject')
  @Operators()
  reject(@CurrentAuth() user: CoreUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideRequestDto) {
    return this.service.reject(user, id, dto);
  }
}

@ApiTags('App del empleado')
@Controller('me/requests')
export class MyRequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  @Auth({ kinds: ['employee'] })
  mine(@CurrentAuth() employee: EmployeeContext) {
    return this.service.mine(employee);
  }

  @Post()
  @Auth({ kinds: ['employee'] })
  create(@CurrentAuth() employee: EmployeeContext, @Body() dto: CreateRequestDto) {
    return this.service.create(employee, dto);
  }

  @Post(':id/cancel')
  @Auth({ kinds: ['employee'] })
  cancel(@CurrentAuth() employee: EmployeeContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(employee, id);
  }

  @Get('vacation-balance')
  @Auth({ kinds: ['employee'] })
  balance(@CurrentAuth() employee: EmployeeContext) {
    return this.service.vacationBalance(employee);
  }
}
