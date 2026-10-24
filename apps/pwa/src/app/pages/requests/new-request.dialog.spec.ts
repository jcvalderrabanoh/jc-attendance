import { buildRequestBody } from './new-request.dialog';

const base = { fromDate: '2026-10-20', toDate: '2026-10-22', punchType: 'in', time: '08:55', minutes: null, comment: '' };

describe('buildRequestBody (POST /me/requests)', () => {
  it('vacaciones: rango de fechas sin payload', () => {
    expect(buildRequestBody({ ...base, type: 'vacation', comment: '  Viaje ' })).toEqual({ type: 'vacation', fromDate: '2026-10-20', toDate: '2026-10-22', comment: 'Viaje' });
  });

  it('corrección de marcaje: un día, punchType y hora ISO', () => {
    const body = buildRequestBody({ ...base, type: 'punch_correction' });
    expect(body.toDate).toBe('2026-10-20');
    expect(body.payload).toEqual({ punchType: 'in', at: new Date('2026-10-20T08:55:00').toISOString() });
  });

  it('horas extra: minutos en el payload', () => {
    expect(buildRequestBody({ ...base, type: 'overtime', minutes: 90 }).payload).toEqual({ minutes: 90 });
  });
});
