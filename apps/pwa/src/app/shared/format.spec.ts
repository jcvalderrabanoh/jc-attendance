import { addDaysIso, formatMinutes, hoursShort, weekStartIso } from './format';
import { isMxMobile, maskDestination, toE164Mx } from './phone';

describe('format', () => {
  it('minutos legibles', () => {
    expect(formatMinutes(425)).toBe('7 h 05 min');
    expect(formatMinutes(-3)).toBe('0 h 00 min');
    expect(hoursShort(510)).toBe('8.5 h');
    expect(hoursShort(480)).toBe('8 h');
  });

  it('semanas que empiezan en lunes', () => {
    expect(weekStartIso('2026-10-21')).toBe('2026-10-19'); // miércoles → lunes
    expect(weekStartIso('2026-10-25')).toBe('2026-10-19'); // domingo
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('teléfonos MX', () => {
    expect(toE164Mx('55 1234 5678')).toBe('+525512345678');
    expect(toE164Mx('+1 415 555 0000')).toBe('+14155550000');
    expect(isMxMobile('5512345678')).toBe(true);
    expect(maskDestination('+525512345678')).toBe('•••• 5678');
    expect(maskDestination('ana@espiga.mx')).toBe('an•••@espiga.mx');
  });
});
