// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** Base config for all TypeScript source */
export const baseConfig = [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },
];

// Relaxed rules for test files (tests/**/*.test.ts)
export const testConfig = [
  {
    files: ["tests/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

// Even more relaxed rules for type-level test files (tests/**/*.test-d.ts)
export const typeLevelTestConfig = [
  {
    files: ["tests/**/*.test-d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
];
