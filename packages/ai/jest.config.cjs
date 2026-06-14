module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@codementor-ai/types$": "<rootDir>/../types/index.ts"
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
