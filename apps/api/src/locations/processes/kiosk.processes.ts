import { Injectable } from '@nestjs/common';
import { hashSecret, ProcessInterfaceResult, randomToken, signKioskToken, totp } from '../../common';
import { DeviceDao } from '../daos';
import { Device, DeviceKindEnum } from '../entities';

const ACTIVATION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Alta de kiosco: genera un código de activación de 8 caracteres (24 h). */
@Injectable()
export class CreateKioskProcess {
  constructor(private readonly deviceDao: DeviceDao) {}

  async process(accountId: string, name: string, locationId: string): Promise<ProcessInterfaceResult<{ device: Device; activationCode: string }>> {
    const activationCode = Array.from({ length: 8 }, () => ACTIVATION_ALPHABET[Math.floor(Math.random() * ACTIVATION_ALPHABET.length)]).join('');
    const device = await this.deviceDao.create({
      accountId,
      kind: DeviceKindEnum.Kiosk,
      name,
      locationId,
      activationCodeHash: hashSecret(activationCode),
      activationExpiresAt: new Date(Date.now() + 24 * 3600_000),
    });
    return { success: true, data: { device, activationCode } };
  }
}

/** La tablet canjea el código por su token de kiosco y su secreto TOTP. */
@Injectable()
export class ActivateKioskProcess {
  constructor(private readonly deviceDao: DeviceDao) {}

  async process(code: string): Promise<ProcessInterfaceResult<{ token: string; device: Device }>> {
    const device = await this.deviceDao.findPendingKioskByCode(hashSecret(code.toUpperCase()));
    if (!device || !device.activationExpiresAt || device.activationExpiresAt < new Date()) {
      return { success: false, error: 'Código de activación inválido o vencido' };
    }
    const saved = await this.deviceDao.update(device.accountId, device.id, {
      activationCodeHash: null,
      activationExpiresAt: null,
      activatedAt: new Date(),
      secret: randomToken(20),
    });
    const token = signKioskToken({ deviceId: device.id, accountId: device.accountId, locationId: device.locationId ?? null });
    return { success: true, data: { token, device: saved as Device } };
  }
}

/** Contenido del QR rotativo: `att1.<deviceId>.<totp>`; cambia cada 30 s. */
@Injectable()
export class KioskQrProcess {
  static readonly STEP_SECONDS = 30;

  constructor(private readonly deviceDao: DeviceDao) {}

  async process(accountId: string, deviceId: string): Promise<ProcessInterfaceResult<{ payload: string; expiresInSeconds: number }>> {
    const device = await this.deviceDao.findWithSecret(accountId, deviceId);
    if (!device?.secret) return { success: false, error: 'El kiosco no existe o no está activado' };
    await this.deviceDao.touch(deviceId);
    const now = Date.now();
    const step = KioskQrProcess.STEP_SECONDS;
    return {
      success: true,
      data: {
        payload: `att1.${device.id}.${totp(device.secret, now, step)}`,
        expiresInSeconds: step - Math.floor(now / 1000) % step,
      },
    };
  }
}
