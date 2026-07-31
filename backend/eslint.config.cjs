const eslintJs = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/**", "dist/**", "seed/**"] },

  // Archivos JavaScript (CommonJS)
  {
    files: ["**/*.{js,cjs}"],
    ...eslintJs.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },

  // Archivos TypeScript
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
];
