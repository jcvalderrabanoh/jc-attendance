import { vacationDaysForYears } from './request.checker';

describe('vacationDaysForYears (LFT art. 76)', () => {
  it.each([
    [0, 0],
    [1, 12],
    [2, 14],
    [5, 20],
    [6, 22],
    [10, 22],
    [11, 24],
    [16, 26],
  ])('%i años → %i días', (years, days) => {
    expect(vacationDaysForYears(years)).toBe(days);
  });
});
