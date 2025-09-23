module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/server.js',
    '!src/config/**',
    '!src/middlewares/**',
    '!src/routes/**',
    '!src/services/**',
    '!src/utils/**',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  reporters: ['default', 'jest-junit'],
};