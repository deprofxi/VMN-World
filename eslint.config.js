import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "archive/**",
      "prisma/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
    },
  },
  // AUD-28: trust boundaries (API transport + core services) must not use
  // untyped `any`. Per-module override keeps the rule targeted while the
  // wider codebase migrates.
  {
    files: ["src/api/**/*.ts", "src/core/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
