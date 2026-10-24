import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AccountId, Auth, AuthContext, CurrentAuth, KioskContext, ManagersOnly } from '../../common';
import { ActivateKioskDto, CreateKioskDto, UpsertLocationDto } from '../dtos';
import { LocationsService } from '../services';

@ApiTags('Ubicaciones y kioscos')
@Controller()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('locations')
  @Auth({ kinds: ['core', 'employee', 'kiosk'] })
  list(@AccountId() accountId: string) {
    return this.locationsService.list(accountId);
  }

  @Get('locations/:id')
  @Auth()
  get(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.get(accountId, id);
  }

  @Post('locations')
  @ManagersOnly()
  create(@AccountId() accountId: string, @Body() dto: UpsertLocationDto, @CurrentAuth() actor: AuthContext) {
    return this.locationsService.upsert(accountId, dto, actor);
  }

  @Put('locations/:id')
  @ManagersOnly()
  update(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertLocationDto, @CurrentAuth() actor: AuthContext) {
    return this.locationsService.upsert(accountId, dto, actor, id);
  }

  @Delete('locations/:id')
  @ManagersOnly()
  remove(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.locationsService.remove(accountId, id, actor);
  }

  @Get('kiosks')
  @ManagersOnly()
  listKiosks(@AccountId() accountId: string) {
    return this.locationsService.listKiosks(accountId);
  }

  @Post('kiosks')
  @ManagersOnly()
  createKiosk(@AccountId() accountId: string, @Body() dto: CreateKioskDto, @CurrentAuth() actor: AuthContext) {
    return this.locationsService.createKioskDevice(accountId, dto, actor);
  }

  @Delete('kiosks/:id')
  @ManagersOnly()
  revokeKiosk(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @CurrentAuth() actor: AuthContext) {
    return this.locationsService.revokeDevice(accountId, id, actor);
  }

  /** Público: la tablet canjea el código de activación. */
  @Post('kiosk/activate')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  activate(@Body() dto: ActivateKioskDto) {
    return this.locationsService.activate(dto.code);
  }

  /** QR rotativo que muestra el kiosco. */
  @Get('kiosk/qr')
  @Auth({ kinds: ['kiosk'] })
  qr(@CurrentAuth() kiosk: KioskContext) {
    return this.locationsService.qr(kiosk.accountId, kiosk.deviceId);
  }
}
