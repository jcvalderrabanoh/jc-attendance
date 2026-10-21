import { calculateWorkday, CalculateWorkdayInput } from '../calculate-workday';
import type { Policy, Punch, Shift } from '../types';
import { basePolicy, dayShift, nightShift, punch } from './fixtures';

const MX = 'America/Mexico_City'; // UTC−6, sin horario de verano desde 2022
const DATE = '2026-03-10';

/** Hora local de Ciudad de México del 10-mar-2026 → ISO UTC (acepta "+1" para el día siguiente). */
function mx(hhmm: string, nextDay = false): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2026, 2, 10 + (nextDay ? 1 : 0), h + 6, m)).toISOString();
}

function run(overrides: Partial<CalculateWorkdayInput> & { punches: Punch[] }) {
  return calculateWorkday({
    date: DATE,
    timeZone: MX,
    shift: dayShift,
    policy: basePolicy,
    isHoliday: false,
    isRestDay: false,
    isMinor: false,
    calcVersion: 'v1',
    ...overrides,
  });
}

const types = (r: ReturnType<typeof run>) => r.incidents.map((i) => i.type);

describe('cálculo de jornada diaria', () => {
  it('día normal 09:00–18:00 con comida no pagada sin marcas', () => {
    const r = run({ punches: [punch('in', mx('09:00')), punch('out', mx('18:00'))] });
    expect(r).toMatchObject({
      date: DATE,
      workedMinutes: 480,
      breakMinutes: 60,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      nightMinutes: 0,
      status: 'ok',
      jornadaType: 'diurna',
      calcVersion: 'v1',
      lftValidFrom: '2026-01-01',
    });
    expect(r.scheduledStart?.toISOString()).toBe('2026-03-10T15:00:00.000Z');
    expect(r.scheduledEnd?.toISOString()).toBe('2026-03-11T00:00:00.000Z');
    expect(r.incidents).toEqual([]);
  });

  describe('retardos y faltas', () => {
    it.each([
      // [entrada, retardo esperado, estado, incidencias]
      ['09:00', 0, 'ok', []],
      ['09:10', 0, 'ok', []], // dentro de la tolerancia
      ['09:11', 1, 'late', ['late']],
      ['09:25', 15, 'late', ['late']],
      ['11:00', 110, 'late', ['late']], // justo en el umbral de falta (120)
      ['11:30', 140, 'absent', ['absence']], // pasado el umbral de falta
    ])('entrada %s → retardo %i, estado %s', (inAt, late, status, incidents) => {
      const r = run({ punches: [punch('in', mx(inAt)), punch('out', mx('18:00'))] });
      expect(r.lateMinutes).toBe(late);
      expect(r.status).toBe(status);
      expect(types(r)).toEqual(incidents);
    });

    it('umbral de retardo de la política: por debajo no marca el día como late', () => {
      const policy: Policy = { ...basePolicy, graceInMinutes: 5, lateThresholdMinutes: 15 };
      const r = run({ policy, punches: [punch('in', mx('09:12')), punch('out', mx('18:00'))] });
      expect(r.lateMinutes).toBe(7);
      expect(r.status).toBe('ok');
    });

    it('sin marcajes en día laborable → falta', () => {
      const r = run({ punches: [] });
      expect(r.status).toBe('absent');
      expect(types(r)).toEqual(['absence']);
      expect(r.workedMinutes).toBe(0);
    });

    it('con permiso aprobado no hay falta', () => {
      const r = run({ punches: [], isOnLeave: true });
      expect(r.status).toBe('leave');
      expect(r.incidents).toEqual([]);
    });
  });

  describe('emparejamiento de marcajes', () => {
    it('falta la salida → incompleto + missing_punch', () => {
      const r = run({ punches: [punch('in', mx('09:00'))] });
      expect(r.status).toBe('incomplete');
      expect(types(r)).toEqual(['missing_punch']);
      expect(r.workedMinutes).toBe(0);
      expect(r.lastOut).toBeUndefined();
    });

    it('salida sin entrada → missing_punch', () => {
      const r = run({ punches: [punch('out', mx('08:00')), punch('in', mx('09:00')), punch('out', mx('18:00'))] });
      expect(types(r)).toEqual(['missing_punch']);
      expect(r.workedMinutes).toBe(480);
    });

    it('descanso marcado no pagado se descuenta (y no se duplica el del turno)', () => {
      const r = run({
        punches: [
          punch('in', mx('09:00')),
          punch('break_start', mx('13:00')),
          punch('break_end', mx('13:45')),
          punch('out', mx('18:00')),
        ],
      });
      expect(r.workedMinutes).toBe(495);
      expect(r.breakMinutes).toBe(45);
      expect(r.overtimeMinutes).toBe(15);
    });

    it('descanso pagado cuenta como trabajado', () => {
      const shift: Shift = { ...dayShift, paidBreak: true, breakMinutes: 30, endTime: '17:30' };
      const r = run({
        shift,
        punches: [
          punch('in', mx('09:00')),
          punch('break_start', mx('13:00')),
          punch('break_end', mx('13:30')),
          punch('out', mx('17:30')),
        ],
      });
      expect(r.workedMinutes).toBe(510);
      expect(r.breakMinutes).toBe(30);
    });

    it('descanso sin fin antes de la salida → missing_punch, se cuenta como descanso', () => {
      const r = run({ punches: [punch('in', mx('09:00')), punch('break_start', mx('17:00')), punch('out', mx('18:00'))] });
      expect(r.workedMinutes).toBe(480);
      expect(r.breakMinutes).toBe(60);
      expect(types(r)).toEqual(['missing_punch']);
    });

    it('marcajes rechazados se ignoran y los pendientes se cuentan señalados', () => {
      const r = run({
        punches: [
          punch('in', mx('07:00'), 'rejected'),
          punch('in', mx('09:00'), 'pending'),
          punch('out', mx('18:00'), 'approved'),
        ],
      });
      expect(r.firstIn?.toISOString()).toBe(mx('09:00'));
      expect(r.workedMinutes).toBe(480);
      expect(r.pendingPunchIds).toHaveLength(1);
      expect(r.status).toBe('ok');
    });

    it('marcajes desordenados se ordenan por instante', () => {
      const r = run({ punches: [punch('out', mx('18:00')), punch('in', mx('09:00'))] });
      expect(r.workedMinutes).toBe(480);
      expect(r.incidents).toEqual([]);
    });
  });

  it.each([
    ['17:50', 0], // dentro de la tolerancia de salida
    ['17:30', 20],
  ])('salida %s → salida anticipada %i min', (outAt, early) => {
    const r = run({ punches: [punch('in', mx('09:00')), punch('out', mx(outAt))] });
    expect(r.earlyLeaveMinutes).toBe(early);
    expect(types(r)).toEqual(early > 0 ? ['early_leave'] : []);
  });

  describe('redondeo sobre el valor calculado (09:00–18:07 = 487 min)', () => {
    it.each([
      ['none', 15, 487],
      ['nearest', 15, 480],
      ['up', 15, 495],
      ['down', 15, 480],
      ['nearest', 10, 490],
      ['up', 0, 487],
    ] as const)('modo %s cada %i min → %i', (roundingMode, roundingMinutes, expected) => {
      const r = run({
        policy: { ...basePolicy, roundingMode, roundingMinutes },
        punches: [punch('in', mx('09:00')), punch('out', mx('18:07'))],
      });
      expect(r.workedMinutes).toBe(expected);
      expect(r.lastOut?.toISOString()).toBe(mx('18:07')); // la marca real se conserva
    });
  });

  describe('turno nocturno que cruza la medianoche', () => {
    it('22:00–06:00: 480 min nocturnos, jornada nocturna, 60 min extra', () => {
      const r = run({ shift: nightShift, punches: [punch('in', mx('22:00')), punch('out', mx('06:00', true))] });
      expect(r).toMatchObject({ workedMinutes: 480, nightMinutes: 480, jornadaType: 'nocturna', overtimeMinutes: 60, status: 'ok' });
      expect(r.scheduledStart?.toISOString()).toBe('2026-03-11T04:00:00.000Z');
      expect(r.scheduledEnd?.toISOString()).toBe('2026-03-11T12:00:00.000Z');
    });

    it('minutos nocturnos parciales en jornada mixta 14:00–21:30', () => {
      const shift: Shift = { startTime: '14:00', endTime: '21:30', crossesMidnight: false, breakMinutes: 0, paidBreak: false };
      const r = run({ shift, punches: [punch('in', mx('14:00')), punch('out', mx('21:30'))] });
      expect(r).toMatchObject({ workedMinutes: 450, nightMinutes: 90, jornadaType: 'mixta', overtimeMinutes: 0 });
    });

    it('el tipo de jornada explícito del turno tiene prioridad', () => {
      const r = run({
        shift: { ...nightShift, jornadaType: 'mixta' },
        punches: [punch('in', mx('22:00')), punch('out', mx('06:00', true))],
      });
      expect(r.jornadaType).toBe('mixta');
      expect(r.overtimeMinutes).toBe(30);
    });
  });

  describe('cambio de horario de verano (Europe/Madrid, turno 22:00–06:00)', () => {
    it.each([
      // [día laboral, entrada UTC, salida UTC, minutos reales, extra]
      ['2026-03-28', '2026-03-28T21:00:00Z', '2026-03-29T04:00:00Z', 420, 0], // adelanto: la noche dura 7 h
      ['2026-10-24', '2026-10-24T20:00:00Z', '2026-10-25T05:00:00Z', 540, 120], // atraso: la noche dura 9 h
      ['2026-06-10', '2026-06-10T20:00:00Z', '2026-06-11T04:00:00Z', 480, 60],
    ])('%s: %s → %s = %i min', (date, inAt, outAt, worked, ot) => {
      const r = calculateWorkday({
        date,
        timeZone: 'Europe/Madrid',
        shift: nightShift,
        punches: [punch('in', inAt), punch('out', outAt)],
        policy: basePolicy,
        isHoliday: false,
        isRestDay: false,
        isMinor: false,
        calcVersion: 'v1',
      });
      expect(r.scheduledStart?.toISOString()).toBe(new Date(inAt).toISOString());
      expect(r.scheduledEnd?.toISOString()).toBe(new Date(outAt).toISOString());
      expect(r.workedMinutes).toBe(worked);
      expect(r.nightMinutes).toBe(worked);
      expect(r.overtimeMinutes).toBe(ot);
      expect(r.lateMinutes).toBe(0);
      expect(r.earlyLeaveMinutes).toBe(0);
    });

    it('America/Tijuana: el día del adelanto la entrada programada usa UTC−7', () => {
      const r = calculateWorkday({
        date: '2026-03-08',
        timeZone: 'America/Tijuana',
        shift: dayShift,
        punches: [punch('in', '2026-03-08T16:00:00Z'), punch('out', '2026-03-09T01:00:00Z')],
        policy: basePolicy,
        isHoliday: false,
        isRestDay: true,
        isMinor: false,
        calcVersion: 'v1',
      });
      expect(r.workedMinutes).toBe(480);
      expect(r.status).toBe('rest');
    });
  });

  describe('horas extra y límites', () => {
    it('jornada + extra > 12 h → daily_limit_exceeded', () => {
      const r = run({ punches: [punch('in', mx('06:00')), punch('out', mx('19:30'))] });
      expect(r.workedMinutes).toBe(750);
      expect(r.overtimeMinutes).toBe(270);
      expect(types(r)).toContain('daily_limit_exceeded');
    });

    it('exactamente 12 h no genera incidencia', () => {
      const r = run({ punches: [punch('in', mx('06:00')), punch('out', mx('19:00'))] });
      expect(r.workedMinutes).toBe(720);
      expect(types(r)).not.toContain('daily_limit_exceeded');
    });

    it('menor de edad con extra → minor_overtime', () => {
      const r = run({ isMinor: true, punches: [punch('in', mx('09:00')), punch('out', mx('19:00'))] });
      expect(r.overtimeMinutes).toBe(60);
      expect(types(r)).toEqual(['minor_overtime']);
    });

    it('menor de edad sin extra → sin incidencia', () => {
      const r = run({ isMinor: true, punches: [punch('in', mx('09:00')), punch('out', mx('18:00'))] });
      expect(r.incidents).toEqual([]);
    });

    it('extra pendiente de aprobación si la política lo exige', () => {
      const policy: Policy = { ...basePolicy, overtimeRequiresApproval: true };
      const r = run({ policy, punches: [punch('in', mx('09:00')), punch('out', mx('19:00'))] });
      expect(r.overtimePendingApproval).toBe(true);
    });

    it('modo de extra none → 0', () => {
      const policy: Policy = { ...basePolicy, overtimeMode: 'none' };
      const r = run({ policy, punches: [punch('in', mx('09:00')), punch('out', mx('19:00'))] });
      expect(r.overtimeMinutes).toBe(0);
    });
  });

  describe('festivos y descansos', () => {
    it('festivo trabajado: estado holiday, sin retardo aunque llegue tarde', () => {
      const r = run({ isHoliday: true, punches: [punch('in', mx('10:00')), punch('out', mx('18:00'))] });
      expect(r).toMatchObject({ status: 'holiday', workedMinutes: 420, lateMinutes: 0 });
      expect(r.scheduledStart).toBeUndefined();
      expect(r.incidents).toEqual([]);
    });

    it('festivo sin marcajes: holiday, no es falta', () => {
      const r = run({ isHoliday: true, punches: [] });
      expect(r.status).toBe('holiday');
      expect(r.incidents).toEqual([]);
    });

    it('descanso sin marcajes: rest', () => {
      expect(run({ isRestDay: true, punches: [] }).status).toBe('rest');
    });
  });

  it('sin turno: calcula trabajado y clasifica la jornada por las marcas', () => {
    const r = run({ shift: null, punches: [punch('in', mx('22:00')), punch('out', mx('05:00', true))] });
    expect(r).toMatchObject({ workedMinutes: 420, jornadaType: 'nocturna', lateMinutes: 0, status: 'ok' });
  });

  it('no modifica los marcajes de entrada', () => {
    const punches = [punch('out', mx('18:00')), punch('in', mx('09:00'))];
    const copy = punches.map((p) => ({ ...p }));
    run({ punches });
    expect(punches).toEqual(copy);
  });
});
