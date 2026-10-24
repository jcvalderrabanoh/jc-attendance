import { addDays, dayOfWeek, localDateOf, timeZoneOffsetMs, toZonedParts, zonedTimeToUtc } from '../tz';

const H = 3_600_000;

describe('zona horaria con Intl', () => {
  describe.each([
    ['America/Mexico_City', '2026-01-15T12:00:00Z', -6],
    ['America/Mexico_City', '2026-07-15T12:00:00Z', -6],
    ['America/Chihuahua', '2026-01-15T12:00:00Z', -6],
    ['America/Chihuahua', '2026-07-15T12:00:00Z', -6],
    ['America/Tijuana', '2026-01-15T12:00:00Z', -8],
    ['America/Tijuana', '2026-07-15T12:00:00Z', -7],
    ['Europe/Madrid', '2026-01-15T12:00:00Z', 1],
    ['Europe/Madrid', '2026-07-15T12:00:00Z', 2],
  ])('desfase de %s en %s', (zone, iso, hours) => {
    it(`es UTC${hours >= 0 ? '+' : ''}${hours}`, () => {
      expect(timeZoneOffsetMs(new Date(iso), zone)).toBe(hours * H);
    });
  });

  it.each([
    // [fecha, hora, zona, instante UTC esperado]
    ['2026-03-10', '09:00', 'America/Mexico_City', '2026-03-10T15:00:00.000Z'],
    ['2026-03-07', '09:00', 'America/Tijuana', '2026-03-07T17:00:00.000Z'],
    ['2026-03-08', '09:00', 'America/Tijuana', '2026-03-08T16:00:00.000Z'],
    // Hueco del adelanto: 02:30 no existe → 03:30 hora de verano
    ['2026-03-08', '02:30', 'America/Tijuana', '2026-03-08T10:30:00.000Z'],
    ['2026-03-29', '02:30', 'Europe/Madrid', '2026-03-29T01:30:00.000Z'],
    // Hora repetida del atraso: se toma la primera ocurrencia
    ['2026-10-25', '02:30', 'Europe/Madrid', '2026-10-25T00:30:00.000Z'],
    ['2026-11-01', '01:30', 'America/Tijuana', '2026-11-01T08:30:00.000Z'],
  ])('zonedTimeToUtc(%s %s, %s) = %s', (date, time, zone, expected) => {
    expect(zonedTimeToUtc(date, time, zone).toISOString()).toBe(expected);
  });

  it('ida y vuelta UTC → local → UTC fuera de los cambios de horario', () => {
    const instant = new Date('2026-06-01T23:45:00Z');
    const p = toZonedParts(instant, 'Europe/Madrid');
    expect(p).toEqual({ year: 2026, month: 6, day: 2, hour: 1, minute: 45, second: 0 });
    expect(zonedTimeToUtc('2026-06-02', '01:45', 'Europe/Madrid').toISOString()).toBe(instant.toISOString());
  });

  it('fecha local y utilidades de calendario', () => {
    expect(localDateOf(new Date('2026-03-11T03:00:00Z'), 'America/Mexico_City')).toBe('2026-03-10');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(dayOfWeek('2026-10-25')).toBe(0);
  });
});
