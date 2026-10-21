import { Global, Module } from '@nestjs/common';
import { ATTENDANCE_ENTITLEMENT } from '../common';
import { CoreUsersController } from './controllers';
import { CoreAccountDao } from './daos';
import { CoreLinkService } from './services';

@Global()
@Module({
  controllers: [CoreUsersController],
  providers: [
    CoreAccountDao,
    CoreLinkService,
    { provide: ATTENDANCE_ENTITLEMENT, useExisting: CoreLinkService },
  ],
  exports: [CoreLinkService, ATTENDANCE_ENTITLEMENT],
})
export class CoreLinkModule {}
