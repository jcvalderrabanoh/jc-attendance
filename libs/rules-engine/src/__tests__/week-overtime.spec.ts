import { resolveLftVersion } from '../lft';
import { calculateWeekOvertime } from '../week-overtime';
import { wd } from './fixtures';

const DAYS_2026 = ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'];
const DAYS_2027 = ['2027-03-08', '2027-03-09', '2027-03-10', '2027-03-11', '2027-03-12', '2027-03-13'];
const lft2026 = resolveLftVersion('2026-03-09');
const lft2027 = resolveLftVersion('2027-03-08');
const lft2028 = resolveLftVersion('2028-03-06');

/** Semana de 6 días con el mismo trabajado/extra diario. */
const week = (dates: string[], worked: number, ot: number) => dates.map((d) => wd(d, worked, ot));

describe('horas extra semanales (modo LFT)', () => {
  it.each([
    // [caso, días, lft, trabajado diario, extra diario, dobles, triples, excede tope triple]
    ['2026: 6×8 h = 48 h, sin extra', DAYS_2026, lft2026, 480, 0, 0, 0, false],
    ['2027: 6×8 h = 48 h, 2 h sobre el límite de 46 h', DAYS_2027, lft2027, 480, 0, 120, 0, false],
    ['2026: 6×9 h, 6 h diarias ya cuentan el exceso semanal', DAYS_2026, lft2026, 540, 60, 360, 0, false],
    ['2026: 6×10 h = 12 h extra → 9 dobles + 3 triples', DAYS_2026, lft2026, 600, 120, 540, 180, false],
    ['2026: 6×11.5 h = 21 h extra → 9 dobles + 12 triples (> 4 h)', DAYS_2026, lft2026, 690, 210, 540, 720, true],
    ['2028: 6×11.5 h = 69 h → 21 h diarias + 4 h sobre 44 h; 10 dobles + 15 triples', DAYS_2026, lft2028, 690, 210, 600, 900, true],
    ['2026: 9 h dobles + 4 h triples justas no excede', DAYS_2026, lft2026, 610, 130, 540, 240, false],
  ])('%s', (_c, dates, lft, worked, ot, dbl, tpl, exceeded) => {
    const r = calculateWeekOvertime(week(dates, worked, ot), lft, { isMinor: false });
    expect(r.doubleMinutes).toBe(dbl);
    expect(r.tripleMinutes).toBe(tpl);
    expect(r.exceededTripleCap).toBe(exceeded);
    expect(r.totalOvertimeMinutes).toBe(dbl + tpl);
    expect(r.minorOvertimeBlocked).toBe(false);
  });

  it('el exceso semanal se asigna al último día trabajado', () => {
    const r = calculateWeekOvertime(week(DAYS_2027, 480, 0), lft2027, { isMinor: false });
    expect(r.weeklyExcessMinutes).toBe(120);
    expect(r.perDay.map((d) => d.doubleMinutes)).toEqual([0, 0, 0, 0, 0, 120]);
  });

  it('dobles y triples se reparten en orden cronológico', () => {
    const r = calculateWeekOvertime(week(DAYS_2026, 600, 120).reverse(), lft2026, { isMinor: false });
    expect(r.perDay).toEqual([
      { date: '2026-03-09', doubleMinutes: 120, tripleMinutes: 0 },
      { date: '2026-03-10', doubleMinutes: 120, tripleMinutes: 0 },
      { date: '2026-03-11', doubleMinutes: 120, tripleMinutes: 0 },
      { date: '2026-03-12', doubleMinutes: 120, tripleMinutes: 0 },
      { date: '2026-03-13', doubleMinutes: 60, tripleMinutes: 60 },
      { date: '2026-03-14', doubleMinutes: 0, tripleMinutes: 120 },
    ]);
  });

  it('extra diario + exceso semanal que no estaba contado', () => {
    // 5×8 h + 1×10 h (2 h extra diarias) = 50 h; en 2027 el exceso sobre 46 h es 4 h → 2 h adicionales
    const days = [...week(DAYS_2027.slice(0, 5), 480, 0), wd(DAYS_2027[5], 600, 120)];
    const r = calculateWeekOvertime(days, lft2027, { isMinor: false });
    expect(r.weeklyExcessMinutes).toBe(120);
    expect(r.doubleMinutes).toBe(240);
  });

  it('menor de edad: 0 extra pagada y alerta', () => {
    const r = calculateWeekOvertime(week(DAYS_2026, 540, 60), lft2026, { isMinor: true });
    expect(r).toMatchObject({ doubleMinutes: 0, tripleMinutes: 0, exceededTripleCap: false, minorOvertimeBlocked: true, totalOvertimeMinutes: 360 });
    expect(r.perDay.every((d) => d.doubleMinutes === 0 && d.tripleMinutes === 0)).toBe(true);
  });

  it('menor de edad sin extra: sin alerta', () => {
    const r = calculateWeekOvertime(week(DAYS_2026, 420, 0), lft2026, { isMinor: true });
    expect(r.minorOvertimeBlocked).toBe(false);
  });

  it.each([
    ['none', 0],
    ['daily', 0], // solo lo diario: 6×8 h no tiene exceso diario
    ['weekly', 120],
    ['LFT_MX', 120],
  ] as const)('modo %s en 2027 con 6×8 h → %i min', (mode, expected) => {
    const r = calculateWeekOvertime(week(DAYS_2027, 480, 0), lft2027, { isMinor: false, mode });
    expect(r.doubleMinutes + r.tripleMinutes).toBe(expected);
  });
});
