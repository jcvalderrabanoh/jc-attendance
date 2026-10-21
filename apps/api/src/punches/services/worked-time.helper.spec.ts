import { Punch, PunchReviewStatusEnum, PunchTypeEnum } from '../entities';
import { liveWorkedMinutes } from './worked-time.helper';

const p = (type: PunchTypeEnum, iso: string, reviewStatus = PunchReviewStatusEnum.AutoOk) => ({ type, effectiveAt: new Date(iso), reviewStatus }) as Punch;

describe('liveWorkedMinutes', () => {
  it('cuenta el tramo abierto hasta ahora', () => {
    const r = liveWorkedMinutes([p(PunchTypeEnum.In, '2026-10-20T15:00:00Z')], new Date('2026-10-20T17:30:00Z'));
    expect(r).toEqual({ minutes: 150, state: 'in' });
  });

  it('descuenta el descanso y respeta rechazados', () => {
    const r = liveWorkedMinutes(
      [
        p(PunchTypeEnum.In, '2026-10-20T15:00:00Z'),
        p(PunchTypeEnum.BreakStart, '2026-10-20T19:00:00Z'),
        p(PunchTypeEnum.BreakEnd, '2026-10-20T20:00:00Z'),
        p(PunchTypeEnum.Out, '2026-10-20T21:00:00Z', PunchReviewStatusEnum.Rejected),
      ],
      new Date('2026-10-20T22:00:00Z'),
    );
    expect(r).toEqual({ minutes: 240 + 120, state: 'in' });
  });

  it('en descanso no suma', () => {
    const r = liveWorkedMinutes([p(PunchTypeEnum.In, '2026-10-20T15:00:00Z'), p(PunchTypeEnum.BreakStart, '2026-10-20T16:00:00Z')], new Date('2026-10-20T18:00:00Z'));
    expect(r).toEqual({ minutes: 60, state: 'on_break' });
  });
});
