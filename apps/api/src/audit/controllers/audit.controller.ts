import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, ActorRoleEnum, Auth } from '../../common';
import { AuditLogDao } from '../daos';

@ApiTags('Bitácora')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditLogDao: AuditLogDao) {}

  @Get()
  @Auth({ roles: [ActorRoleEnum.Admin, ActorRoleEnum.Rh, ActorRoleEnum.Inspector] })
  list(
    @AccountId() accountId: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogDao.findPage(accountId, { entity, entityId, page, limit });
  }
}
