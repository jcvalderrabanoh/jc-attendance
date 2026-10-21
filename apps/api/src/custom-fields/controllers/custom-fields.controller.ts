import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, AuthContext, CurrentAuth, ManagersOnly } from '../../common';
import { UpsertCustomFieldDto } from '../dtos';
import { CustomFieldEntityEnum } from '../entities';
import { CustomFieldsService } from '../services';

@ApiTags('Campos personalizados')
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly service: CustomFieldsService) {}

  @Get()
  @Auth({ kinds: ['core', 'employee'] })
  list(@AccountId() accountId: string, @Query('entity') entity?: CustomFieldEntityEnum) {
    return this.service.list(accountId, entity);
  }

  @Post()
  @ManagersOnly()
  create(@AccountId() accountId: string, @Body() dto: UpsertCustomFieldDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsert(accountId, dto, actor);
  }

  @Put(':id')
  @ManagersOnly()
  update(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertCustomFieldDto, @CurrentAuth() actor: AuthContext) {
    return this.service.upsert(accountId, dto, actor, id);
  }

  @Delete(':id')
  @ManagersOnly()
  remove(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.service.remove(accountId, id, actor);
  }
}
