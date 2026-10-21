import { PunchReviewStatusEnum, PunchTypeEnum } from '../entities';
import { nextPunchType, PunchRiskInput, PunchRiskRule } from './punch-risk.rule';

const base = (over: Partial<PunchRiskInput> = {}): PunchRiskInput => ({
  type: PunchTypeEnum.In,
  lastType: PunchTypeEnum.Out,
  geofenceFlags: [],
  requireGeofence: true,
  requireSelfie: false,
  hasSelfie: false,
  requireQr: false,
  qrValid: null,
  offline: false,
  offlineMinutes: 0,
  allowOffline: true,
  maxOfflineHours: 24,
  minutesBeforeShift: 5,
  earlyClockInMinutes: 60,
  ...over,
});

describe('PunchRiskRule', () => {
  const rule = new PunchRiskRule();

  it('marcaje limpio se aprueba solo', () => {
    expect(rule.evaluate(base())).toEqual({ flags: [], reviewStatus: PunchReviewStatusEnum.AutoOk });
  });

  it('fuera de geocerca va a revisión (no se bloquea)', () => {
    const r = rule.evaluate(base({ geofenceFlags: ['out_of_geofence'] }));
    expect(r.reviewStatus).toBe(PunchReviewStatusEnum.Pending);
  });

  it('si la política no exige geocerca, la ubicación no marca', () => {
    expect(rule.evaluate(base({ geofenceFlags: ['out_of_geofence'], requireGeofence: false })).flags).toEqual([]);
  });

  it('dos entradas seguidas marcan secuencia', () => {
    expect(rule.evaluate(base({ lastType: PunchTypeEnum.In })).flags).toContain('sequence');
  });

  it('offline viejo o no permitido va a revisión; offline reciente solo informa', () => {
    expect(rule.evaluate(base({ offline: true, offlineMinutes: 10 })).reviewStatus).toBe(PunchReviewStatusEnum.AutoOk);
    expect(rule.evaluate(base({ offline: true, offlineMinutes: 2000 })).flags).toContain('offline_too_old');
    expect(rule.evaluate(base({ offline: true, allowOffline: false })).flags).toContain('offline_not_allowed');
  });

  it('selfie y QR exigidos por política', () => {
    expect(rule.evaluate(base({ requireSelfie: true })).flags).toContain('no_selfie');
    expect(rule.evaluate(base({ requireQr: true, qrValid: null })).flags).toContain('qr_invalid');
    expect(rule.evaluate(base({ requireQr: true, qrValid: true })).flags).not.toContain('qr_invalid');
  });

  it('entrada muy anticipada solo informa', () => {
    const r = rule.evaluate(base({ minutesBeforeShift: 120 }));
    expect(r.flags).toEqual(['early_clock_in']);
    expect(r.reviewStatus).toBe(PunchReviewStatusEnum.AutoOk);
  });

  it('el tipo siguiente alterna entrada/salida', () => {
    expect(nextPunchType(null)).toBe(PunchTypeEnum.In);
    expect(nextPunchType(PunchTypeEnum.In)).toBe(PunchTypeEnum.Out);
    expect(nextPunchType(PunchTypeEnum.BreakEnd)).toBe(PunchTypeEnum.Out);
    expect(nextPunchType(PunchTypeEnum.Out)).toBe(PunchTypeEnum.In);
  });
});
