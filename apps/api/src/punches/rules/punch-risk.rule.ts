import { Injectable } from '@nestjs/common';
import { PunchReviewStatusEnum, PunchTypeEnum } from '../entities';

/** Banderas que mandan un marcaje a revisión. Las demás solo informan. */
export const REVIEW_FLAGS = new Set([
  'out_of_geofence',
  'low_accuracy',
  'no_location',
  'offline_too_old',
  'offline_not_allowed',
  'no_selfie',
  'qr_invalid',
  'sequence',
  'ip_not_allowed',
]);

export interface PunchRiskInput {
  type: PunchTypeEnum;
  lastType: PunchTypeEnum | null;
  geofenceFlags: string[];
  requireGeofence: boolean;
  requireSelfie: boolean;
  hasSelfie: boolean;
  requireQr: boolean;
  qrValid: boolean | null;
  offline: boolean;
  offlineMinutes: number;
  allowOffline: boolean;
  maxOfflineHours: number;
  minutesBeforeShift: number | null;
  earlyClockInMinutes: number;
}

export interface PunchRiskResult {
  flags: string[];
  reviewStatus: PunchReviewStatusEnum;
}

/** Siguiente tipo esperado según el último marcaje. */
export function nextPunchType(lastType: PunchTypeEnum | null): PunchTypeEnum {
  return lastType === PunchTypeEnum.In || lastType === PunchTypeEnum.BreakEnd ? PunchTypeEnum.Out : PunchTypeEnum.In;
}

const VALID_AFTER: Record<PunchTypeEnum, (PunchTypeEnum | null)[]> = {
  [PunchTypeEnum.In]: [null, PunchTypeEnum.Out],
  [PunchTypeEnum.Out]: [PunchTypeEnum.In, PunchTypeEnum.BreakEnd],
  [PunchTypeEnum.BreakStart]: [PunchTypeEnum.In, PunchTypeEnum.BreakEnd],
  [PunchTypeEnum.BreakEnd]: [PunchTypeEnum.BreakStart],
};

/**
 * Puntaje de riesgo del marcaje: nunca lo descarta, lo manda a revisión
 * (docs/05 §2; en Chile bloquear por geocerca incluso es infracción).
 */
@Injectable()
export class PunchRiskRule {
  evaluate(i: PunchRiskInput): PunchRiskResult {
    const flags = new Set<string>();
    if (i.requireGeofence) i.geofenceFlags.forEach((f) => flags.add(f));
    if (!VALID_AFTER[i.type].includes(i.lastType)) flags.add('sequence');
    if (i.requireSelfie && !i.hasSelfie) flags.add('no_selfie');
    if (i.requireQr && i.qrValid !== true) flags.add('qr_invalid');
    if (i.qrValid === false) flags.add('qr_invalid');
    if (i.offline) {
      flags.add('offline');
      if (!i.allowOffline) flags.add('offline_not_allowed');
      if (i.offlineMinutes > i.maxOfflineHours * 60) flags.add('offline_too_old');
    }
    if (i.type === PunchTypeEnum.In && i.minutesBeforeShift !== null && i.minutesBeforeShift > i.earlyClockInMinutes) {
      flags.add('early_clock_in');
    }
    const needsReview = [...flags].some((f) => REVIEW_FLAGS.has(f));
    return { flags: [...flags], reviewStatus: needsReview ? PunchReviewStatusEnum.Pending : PunchReviewStatusEnum.AutoOk };
  }
}
