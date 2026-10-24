import * as api from '../index';

describe('API pública', () => {
  it.each([
    'LFT_VERSIONS',
    'resolveLftVersion',
    'DAILY_MAX',
    'classifyJornada',
    'workdayDateFor',
    'calculateWorkday',
    'calculateWeekOvertime',
    'specialDayPay',
    'MEXICO_HOLIDAYS',
    'isValidCurp',
    'curpBirthDate',
    'isValidRfc',
    'isValidNss',
    'normalizePhoneE164',
    'zonedTimeToUtc',
    'toZonedParts',
  ])('exporta %s', (name) => {
    expect((api as Record<string, unknown>)[name]).toBeDefined();
  });
});
