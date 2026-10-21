import { Global, Module } from '@nestjs/common';
import { ATTENDANCE_ENTITLEMENT } from '../common';
import { CoreAccountDao } from './daos';
import { CoreLinkService } from './services';

@Global()
@Module({
  providers: [
    CoreAccountDao,
    CoreLinkService,
    { provide: ATTENDANCE_ENTITLEMENT, useExisting: CoreLinkService },
  ],
  exports: [CoreLinkService, ATTENDANCE_ENTITLEMENT],
})
export class CoreLinkModule {}
