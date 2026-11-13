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
      "scripts/**",
      "*.config.js",
      "*.config.ts",
      "docs/audit/evidence/**/*.mjs",
      "docs/audit/evidence/**/*.js",
      // Machine-generated from the IA inventory; editing it by hand is already
      // forbidden by `pnpm ia:generate --check`, so lint has nothing to add.
      "src/web/ia/registry.generated.ts",
    ],
  },
  {
    // TSK-17's restart child is a plain Node ESM helper: it runs the compiled
    // artifact in a second process, so it cannot be TypeScript and it is not
    // part of the tsconfig program. Declare the Node globals it legitimately
    // uses instead of turning rules off.
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        process: "readonly",
        URL: "readonly",
        console: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "prefer-const": "error",
    },
  }
);
