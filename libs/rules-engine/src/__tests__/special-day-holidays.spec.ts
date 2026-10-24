import { calculateWorkday } from '../calculate-workday';
import { MEXICO_HOLIDAYS, isMexicoHoliday } from '../holidays';
import { specialDayPay } from '../special-day';
import { dayOfWeek } from '../tz';
import { basePolicy, dayShift, punch } from './fixtures';

describe('festivos del art. 74 LFT', () => {
  it('2026', () => {
    expect(MEXICO_HOLIDAYS(2026).map((h) => h.date)).toEqual([
      '2026-01-01',
      '2026-02-02',
      '2026-03-16',
      '2026-05-01',
      '2026-09-16',
      '2026-11-16',
      '2026-12-25',
    ]);
  });

  it.each([
    [2027, '2027-02-01', '2027-03-15', '2027-11-15'],
    [2028, '2028-02-07', '2028-03-20', '2028-11-20'],
  ])('lunes móviles de %i', (year, feb, mar, nov) => {
    const dates = MEXICO_HOLIDAYS(year).map((h) => h.date);
    expect(dates).toEqual(expect.arrayContaining([feb, mar, nov]));
    for (const d of [feb, mar, nov]) expect(dayOfWeek(d)).toBe(1);
  });

  it.each([
    [2024, '2024-10-01'],
    [2030, '2030-10-01'],
    [2018, '2018-12-01'],
  ])('transmisión del Poder Ejecutivo en %i: %s', (year, date) => {
    expect(MEXICO_HOLIDAYS(year)).toHaveLength(8);
    expect(isMexicoHoliday(date)).toBe(true);
  });

  it('sin transmisión del Ejecutivo fuera del ciclo de 6 años', () => {
    expect(MEXICO_HOLIDAYS(2026)).toHaveLength(7);
    expect(isMexicoHoliday('2026-10-01')).toBe(false);
    expect(isMexicoHoliday('2026-12-01')).toBe(false);
  });
});

describe('día especial trabajado', () => {
  it('festivo trabajado (16-sep-2026) se paga doble', () => {
    const date = '2026-09-16';
    const r = calculateWorkday({
      date,
      timeZone: 'America/Mexico_City',
      shift: dayShift,
      punches: [punch('in', '2026-09-16T15:00:00Z'), punch('out', '2026-09-17T00:00:00Z')],
      policy: basePolicy,
      isHoliday: isMexicoHoliday(date),
      isRestDay: false,
      isMinor: false,
      calcVersion: 'v1',
    });
    expect(r.status).toBe('holiday');
    expect(specialDayPay(r, { isHoliday: true, isRestDay: false, isSunday: false, sundayPremium: true })).toEqual({
      holidayWorkedMinutes: 480,
      restDayWorkedMinutes: 0,
      sundayPremiumApplies: false,
    });
  });

  it.each([
    // [caso, trabajado, banderas, esperado]
    ['descanso trabajado', 480, { isHoliday: false, isRestDay: true, isSunday: false, sundayPremium: true }, { holidayWorkedMinutes: 0, restDayWorkedMinutes: 480, sundayPremiumApplies: false }],
    ['domingo con prima', 480, { isHoliday: false, isRestDay: false, isSunday: true, sundayPremium: true }, { holidayWorkedMinutes: 0, restDayWorkedMinutes: 0, sundayPremiumApplies: true }],
    ['domingo sin prima en la política', 480, { isHoliday: false, isRestDay: false, isSunday: true, sundayPremium: false }, { holidayWorkedMinutes: 0, restDayWorkedMinutes: 0, sundayPremiumApplies: false }],
    ['domingo no trabajado', 0, { isHoliday: false, isRestDay: false, isSunday: true, sundayPremium: true }, { holidayWorkedMinutes: 0, restDayWorkedMinutes: 0, sundayPremiumApplies: false }],
    ['festivo en día de descanso: solo cuenta como festivo', 300, { isHoliday: true, isRestDay: true, isSunday: false, sundayPremium: true }, { holidayWorkedMinutes: 300, restDayWorkedMinutes: 0, sundayPremiumApplies: false }],
  ])('%s', (_c, worked, flags, expected) => {
    expect(specialDayPay({ workedMinutes: worked }, flags)).toEqual(expected);
  });
});
