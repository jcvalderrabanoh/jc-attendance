import { liveMinutes, primaryActionFor, secondaryActionsFor, shiftMinutes, stateAfter, weekBars } from './check.logic';

describe('check.logic', () => {
  it('el botón grande sigue el estado', () => {
    expect(primaryActionFor('out')).toEqual(expect.objectContaining({ type: 'in', label: 'Registrar entrada' }));
    expect(primaryActionFor('in')).toEqual(expect.objectContaining({ type: 'out', label: 'Registrar salida', tone: 'out' }));
    expect(primaryActionFor('on_break').type).toBe('break_end');
  });

  it('descanso como acción secundaria', () => {
    expect(secondaryActionsFor('out')).toEqual([]);
    expect(secondaryActionsFor('in').map((a) => a.type)).toEqual(['break_start']);
    expect(secondaryActionsFor('on_break').map((a) => a.type)).toEqual(['out']);
  });

  it('estado tras cada tipo de marcaje', () => {
    expect(stateAfter('in')).toBe('in');
    expect(stateAfter('break_end')).toBe('in');
    expect(stateAfter('break_start')).toBe('on_break');
    expect(stateAfter('out')).toBe('out');
  });

  it('contador en vivo: suma lo transcurrido solo si está dentro', () => {
    const t0 = Date.parse('2026-10-21T15:00:00Z');
    expect(liveMinutes({ state: 'in', todayMinutes: 120 }, t0, t0 + 30 * 60_000)).toBe(150);
    expect(liveMinutes({ state: 'out', todayMinutes: 120 }, t0, t0 + 30 * 60_000)).toBe(120);
    expect(liveMinutes({ state: 'on_break', todayMinutes: 120 }, t0, t0 + 30 * 60_000)).toBe(120);
    expect(liveMinutes({ state: 'in', todayMinutes: 10 }, t0, t0 - 60_000)).toBe(10); // reloj hacia atrás
  });

  it('minutos del turno: descuenta comida y cruza medianoche', () => {
    expect(shiftMinutes({ startTime: '08:00:00', endTime: '17:00:00', breakMinutes: 60 })).toBe(480);
    expect(shiftMinutes({ startTime: '22:00', endTime: '06:00', breakMinutes: 30 })).toBe(450);
    expect(shiftMinutes(null)).toBeNull();
  });

  it('barras de la semana: hoy usa el contador en vivo y lo futuro va vacío', () => {
    const perDay = [
      { date: '2026-10-19', minutes: 480 },
      { date: '2026-10-20', minutes: 240 },
      { date: '2026-10-21', minutes: 0 },
      { date: '2026-10-22', minutes: 0 },
    ];
    const bars = weekBars(perDay, '2026-10-20', 300, 480);
    expect(bars.map((b) => b.minutes)).toEqual([480, 300, 0, 0]);
    expect(bars[0].percent).toBe(100);
    expect(bars[1].isToday).toBe(true);
    expect(bars[2].isFuture).toBe(true);
    expect(bars[0].label).toMatch(/^Lun/);
  });
});
