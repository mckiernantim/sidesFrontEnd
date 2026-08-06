module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: [
      '<rootDir>/setup-jest.ts',
      'jest-extended/all'
    ],
    moduleNameMapper: {
      "^src/(.*)$": "<rootDir>/src/$1"
    },
    testPathIgnorePatterns: [
      '<rootDir>/node_modules/',
      '<rootDir>/dist/',
      '<rootDir>/src/test.ts',
    ],
    watchman: false,
  };
  