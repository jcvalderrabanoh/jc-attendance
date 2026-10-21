import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, AuthContext, CurrentAuth, EmployeeContext, ManagersOnly } from '../../common';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  SetKioskPinDto,
  TerminateEmployeeDto,
  UpdateEmployeeDto,
  UpdateMyProfileDto,
} from '../dtos';
import { EmployeesService } from '../services';

@ApiTags('Empleados')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @Auth()
  list(@AccountId() accountId: string, @Query() query: ListEmployeesQueryDto) {
    return this.service.list(accountId, query);
  }

  @Get(':id')
  @Auth()
  get(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(accountId, id);
  }

  @Post()
  @ManagersOnly()
  create(@AccountId() accountId: string, @Body() dto: CreateEmployeeDto, @CurrentAuth() actor: AuthContext) {
    return this.service.create(accountId, dto, actor);
  }

  @Put(':id')
  @ManagersOnly()
  update(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto, @CurrentAuth() actor: AuthContext) {
    return this.service.update(accountId, id, dto, actor);
  }

  @Post(':id/terminate')
  @ManagersOnly()
  terminate(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TerminateEmployeeDto, @CurrentAuth() actor: AuthContext) {
    return this.service.terminate(accountId, id, dto, actor);
  }

  @Post(':id/kiosk-pin')
  @ManagersOnly()
  setKioskPin(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetKioskPinDto, @CurrentAuth() actor: AuthContext) {
    return this.service.setKioskPin(accountId, id, dto.pin, actor);
  }
}

@ApiTags('App del empleado')
@Controller('me')
export class MyProfileController {
  constructor(private readonly service: EmployeesService) {}

  @Get('employments')
  @Auth({ kinds: ['employee'] })
  employments(@CurrentAuth() employee: EmployeeContext) {
    return this.service.myEmployments(employee.identityId);
  }

  @Get('profile')
  @Auth({ kinds: ['employee'] })
  profile(@CurrentAuth() employee: EmployeeContext) {
    return this.service.myProfile(employee);
  }

  @Patch('profile')
  @Auth({ kinds: ['employee'] })
  updateProfile(@CurrentAuth() employee: EmployeeContext, @Body() dto: UpdateMyProfileDto) {
    return this.service.updateMyProfile(employee, dto);
  }
}
