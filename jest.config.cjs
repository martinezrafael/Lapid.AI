module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  moduleNameMapper: {
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
          },
          target: "es2022", // Garante compatibilidade com o Node moderno
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
};
