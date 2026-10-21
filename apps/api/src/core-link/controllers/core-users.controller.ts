import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountId, ManagersOnly } from '../../common';
import { CoreLinkService } from '../services';

/** Usuarios de jc-core de la cuenta (solo lectura): para enlazar un empleado a su login de lumen-view. */
@ApiTags('Organización')
@Controller('core-users')
export class CoreUsersController {
  constructor(private readonly coreLink: CoreLinkService) {}

  @Get()
  @ManagersOnly()
  list(@AccountId() accountId: string, @Query('search') search?: string) {
    return this.coreLink.listAccountUsers(accountId, search);
  }
}
