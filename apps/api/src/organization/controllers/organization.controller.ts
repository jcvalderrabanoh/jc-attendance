import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, Auth, AuthContext, CurrentAuth, ManagersOnly } from '../../common';
import { UpdateAccountSettingsDto, UpsertCatalogItemDto } from '../dtos';
import { OrganizationService } from '../services';

@ApiTags('Organización')
@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('settings')
  @Auth()
  getSettings(@AccountId() accountId: string) {
    return this.organizationService.getSettings(accountId);
  }

  @Patch('settings')
  @ManagersOnly()
  updateSettings(@AccountId() accountId: string, @Body() dto: UpdateAccountSettingsDto, @CurrentAuth() actor: AuthContext) {
    return this.organizationService.updateSettings(accountId, dto, actor);
  }

  @Get('departments')
  @Auth()
  listDepartments(@AccountId() accountId: string) {
    return this.organizationService.list('department', accountId);
  }

  @Post('departments')
  @ManagersOnly()
  createDepartment(@AccountId() accountId: string, @Body() dto: UpsertCatalogItemDto, @CurrentAuth() actor: AuthContext) {
    return this.organizationService.upsert('department', accountId, dto, actor);
  }

  @Put('departments/:id')
  @ManagersOnly()
  updateDepartment(
    @AccountId() accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCatalogItemDto,
    @CurrentAuth() actor: AuthContext,
  ) {
    return this.organizationService.upsert('department', accountId, dto, actor, id);
  }

  @Delete('departments/:id')
  @ManagersOnly()
  removeDepartment(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.organizationService.remove('department', accountId, id, actor);
  }

  @Get('positions')
  @Auth()
  listPositions(@AccountId() accountId: string) {
    return this.organizationService.list('position', accountId);
  }

  @Post('positions')
  @ManagersOnly()
  createPosition(@AccountId() accountId: string, @Body() dto: UpsertCatalogItemDto, @CurrentAuth() actor: AuthContext) {
    return this.organizationService.upsert('position', accountId, dto, actor);
  }

  @Put('positions/:id')
  @ManagersOnly()
  updatePosition(
    @AccountId() accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCatalogItemDto,
    @CurrentAuth() actor: AuthContext,
  ) {
    return this.organizationService.upsert('position', accountId, dto, actor, id);
  }

  @Delete('positions/:id')
  @ManagersOnly()
  removePosition(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.organizationService.remove('position', accountId, id, actor);
  }
}
