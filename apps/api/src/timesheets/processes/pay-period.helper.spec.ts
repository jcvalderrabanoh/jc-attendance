import { PayPeriodFrequencyEnum } from '../../organization/entities';
import { payPeriodFor } from './pay-period.helper';

describe('payPeriodFor', () => {
  it.each([
    [PayPeriodFrequencyEnum.Weekly, '2026-10-21', { startDate: '2026-10-19', endDate: '2026-10-25' }],
    [PayPeriodFrequencyEnum.Semimonthly, '2026-10-21', { startDate: '2026-10-16', endDate: '2026-10-31' }],
    [PayPeriodFrequencyEnum.Semimonthly, '2026-02-03', { startDate: '2026-02-01', endDate: '2026-02-15' }],
    [PayPeriodFrequencyEnum.Monthly, '2026-02-10', { startDate: '2026-02-01', endDate: '2026-02-28' }],
  ])('%s que contiene %s', (freq, date, expected) => {
    expect(payPeriodFor(date, freq, 1)).toEqual(expected);
  });

  it('catorcenas de 14 días consecutivas', () => {
    const a = payPeriodFor('2026-10-21', PayPeriodFrequencyEnum.Biweekly, 1);
    expect(Date.parse(a.endDate) - Date.parse(a.startDate)).toBe(13 * 86_400_000);
    expect(a.startDate <= '2026-10-21' && a.endDate >= '2026-10-21').toBe(true);
  });
});
