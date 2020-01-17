// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const path = require('path');

const nodeModulesPath = path.resolve(__dirname, 'node_modules');

module.exports = {
  coverageReporters: process.env.GITHUB_ACTIONS
    ? ['lcovonly', 'text']
    : ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 93,
      functions: 92,
      lines: 95,
    },
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!**/IAccessInfo.ts', '!**/IQueryInfo.ts'],
  coverageDirectory: './test/.coverage',
  moduleFileExtensions: ['json', 'ts', 'tsx', 'js', 'jsx'],
  modulePaths: [nodeModulesPath],
  rootDir: path.resolve(__dirname),
  roots: ['<rootDir>/src', '<rootDir>/lib', '<rootDir>/test'],
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  verbose: true,
};
