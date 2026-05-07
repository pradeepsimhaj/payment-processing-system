import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',

  testEnvironment: 'node',

  roots: ['<rootDir>/src/tests'],

  moduleFileExtensions: ['ts', 'js'],

  testMatch: ['**/*.test.ts'],

  clearMocks: true,

  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.ts'],
};

export default config;