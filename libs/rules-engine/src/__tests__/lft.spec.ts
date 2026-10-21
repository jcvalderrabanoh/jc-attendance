import { DAILY_MAX, DAILY_MAX_MINUTES, LFT_VERSIONS, classifyJornada, resolveLftVersion } from '../lft';
import { workdayDateFor } from '../workday-date';
import { dayShift, nightShift } from './fixtures';

describe('versiones LFT por fecha de vigencia', () => {
  it.each([
    ['2025-12-31', '2026-01-01', 48, 9],
    ['2026-01-01', '2026-01-01', 48, 9],
    ['2026-12-31', '2026-01-01', 48, 9],
    ['2027-01-01', '2027-01-01', 46, 9],
    ['2028-06-15', '2028-01-01', 44, 10],
    ['2029-03-01', '2029-01-01', 42, 11],
    ['2030-01-01', '2030-01-01', 40, 12],
    ['2035-01-01', '2030-01-01', 40, 12],
  ])('%s → vigente desde %s (%i h, %i h dobles)', (date, validFrom, weekly, doubleCap) => {
    const v = resolveLftVersion(date);
    expect(v).toMatchObject({ validFrom, weeklyHoursLimit: weekly, weeklyDoubleOvertimeCap: doubleCap });
    expect(v.weeklyTripleOvertimeCap).toBe(4);
    expect(v.dailyMaxWithOvertime).toBe(12);
  });

  it('las versiones son inmutables', () => {
    expect(Object.isFrozen(LFT_VERSIONS)).toBe(true);
    expect(Object.isFrozen(LFT_VERSIONS[0])).toBe(true);
  });

  it('jornada máxima diaria por tipo', () => {
    expect(DAILY_MAX).toEqual({ diurna: 8, nocturna: 7, mixta: 7.5 });
    expect(DAILY_MAX_MINUTES).toEqual({ diurna: 480, nocturna: 420, mixta: 450 });
  });
});

describe('clasificación de jornada (art. 60)', () => {
  it.each([
    ['09:00', '18:00', 'diurna'],
    ['06:00', '14:00', 'diurna'],
    ['12:00', '20:00', 'diurna'],
    ['05:00', '13:00', 'mixta'], // 1 h nocturna
    ['14:00', '21:30', 'mixta'], // 1.5 h nocturna
    ['16:00', '23:29', 'mixta'], // 3 h 29 min
    ['16:00', '23:30', 'nocturna'], // exactamente 3.5 h
    ['22:00', '06:00', 'nocturna'],
    ['18:00', '02:00', 'nocturna'], // 6 h nocturna
    ['00:00', '08:00', 'nocturna'], // 6 h nocturna
  ])('%s–%s es %s', (start, end, expected) => {
    expect(classifyJornada(start, end)).toBe(expected);
  });
});

describe('día laboral de un marcaje', () => {
  const zone = 'America/Mexico_City'; // UTC−6 todo el año
  it.each([
    ['turno nocturno, 02:00 → día anterior', '2026-03-11T08:00:00Z', nightShift, '2026-03-10'],
    ['turno nocturno, salida tardía 07:00 → día anterior', '2026-03-11T13:00:00Z', nightShift, '2026-03-10'],
    ['turno nocturno, entrada anticipada 21:30 → mismo día', '2026-03-12T03:30:00Z', nightShift, '2026-03-11'],
    ['turno diurno, 10:00 → mismo día', '2026-03-11T16:00:00Z', dayShift, '2026-03-11'],
    ['sin turno, 21:00 local → fecha local', '2026-03-11T03:00:00Z', undefined, '2026-03-10'],
  ])('%s', (_label, iso, shift, expected) => {
    expect(workdayDateFor(new Date(iso), shift, zone)).toBe(expected);
  });

  it('turno nocturno con horario de verano (Europe/Madrid)', () => {
    // 2026-03-29 02:30Z = 04:30 CEST, dentro del turno que empezó el 28
    expect(workdayDateFor(new Date('2026-03-29T02:30:00Z'), nightShift, 'Europe/Madrid')).toBe('2026-03-28');
  });
});
