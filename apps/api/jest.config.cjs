module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/src/routes/github.webhook.test.ts"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@codementor-ai/ai/(.*)$": "<rootDir>/../../packages/ai/$1.ts",
    "^@codementor-ai/types$": "<rootDir>/../../packages/types/index.ts"
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          esModuleInterop: true,
          target: "ES2022",
          types: ["jest", "node"]
        }
      }
    ]
  }
};
