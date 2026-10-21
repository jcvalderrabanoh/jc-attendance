import { Injectable } from '@nestjs/common';
import { localMinuteOfDay, dayOfWeek, localDateOf, parseWallTime } from '@jc-attendance/rules-engine';
import { sha256, verifyTotp } from '../../common';
import { ConsentDao } from '../../employee-auth/daos';
import { ConsentKindEnum } from '../../employee-auth/entities';
import { DeviceDao } from '../../locations/daos';
import { DeviceKindEnum } from '../../locations/entities';
import { Shift } from '../../schedules/entities';
import { Punch } from '../entities';

export interface QrCheck {
  valid: boolean;
  deviceId: string | null;
  locationId: string | null;
}

/** Valida el QR rotativo `att1.<deviceId>.<totp>` contra el secreto del kiosco. */
@Injectable()
export class VerifyKioskQrProcess {
  constructor(private readonly deviceDao: DeviceDao) {}

  async process(accountId: string, payload: string): Promise<QrCheck> {
    const match = /^att1\.([0-9a-f-]{36})\.(\d{8})$/.exec(payload.trim());
    if (!match) return { valid: false, deviceId: null, locationId: null };
    const device = await this.deviceDao.findWithSecret(accountId, match[1]);
    if (!device?.secret || device.kind !== DeviceKindEnum.Kiosk) return { valid: false, deviceId: null, locationId: null };
    return { valid: verifyTotp(device.secret, match[2]), deviceId: device.id, locationId: device.locationId ?? null };
  }
}

/** ¿Dio su consentimiento de geolocalización para esta cuenta? (LFPDPPP) */
@Injectable()
export class GeoConsentProcess {
  constructor(private readonly consentDao: ConsentDao) {}

  async process(identityId: string, accountId: string): Promise<boolean> {
    const consents = await this.consentDao.findActive(identityId, accountId);
    return consents.some((c) => c.kind === ConsentKindEnum.Geolocation);
  }
}

/** Hash encadenado por empleado: cualquier alteración posterior rompe la cadena (LFT 132-XXXIV). */
export function punchHash(prevHash: string | null, p: Pick<Punch, 'employmentId' | 'type' | 'effectiveAt' | 'serverAt' | 'lat' | 'lng' | 'idempotencyKey' | 'source'>): string {
  return sha256(
    [prevHash ?? 'GENESIS', p.employmentId, p.type, p.source, p.effectiveAt.toISOString(), p.serverAt.toISOString(), p.lat ?? '', p.lng ?? '', p.idempotencyKey].join('|'),
  );
}

/** Minutos que faltan para el inicio del turno de hoy (negativo si ya empezó); null sin turno. */
export function minutesBeforeShiftStart(at: Date, timeZone: string, shifts: Map<number, Shift>): number | null {
  const shift = shifts.get(dayOfWeek(localDateOf(at, timeZone)));
  if (!shift) return null;
  return parseWallTime(shift.startTime) - localMinuteOfDay(at, timeZone);
}
