import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, CurrentAuth, EmployeeContext } from '../../common';
import { PrivacyService } from '../services';

@ApiTags('App del empleado')
@Controller('me/data-export')
export class PrivacyController {
  constructor(private readonly service: PrivacyService) {}

  @Get()
  @Auth({ kinds: ['employee'] })
  export(@CurrentAuth() employee: EmployeeContext) {
    return this.service.export(employee);
  }
}
