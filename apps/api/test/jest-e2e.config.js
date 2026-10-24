module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  moduleNameMapper: { '^@jc-attendance/rules-engine$': '<rootDir>/../../libs/rules-engine/src' },
  testTimeout: 60000,
};
