import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    // TSK-61: before any test file loads, create + `prisma migrate deploy` the
    // suite's dedicated `<db>_test` database and export it as DATABASE_URL, so
    // the gate is green on a seeded *or* unseeded development database. Runs
    // for `test`, `test:coverage` and focused `vitest run` alike — a `pretest`
    // script would not cover the latter two.
    globalSetup: ["tests/global-setup.ts"],
    // TSK-05: the DB-backed repository suites write to one shared Postgres and
    // assert on the rows they seeded, so files must not interleave. The forks
    // pool still isolates module state per file; this only removes cross-file
    // races on the database. (Vitest 4: worker counts are top-level options.)
    pool: "forks",
    minWorkers: 1,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // AUD-18: baseline measured 2026-10-06 (73.26 lines / 63.97 branches /
      // 78.7 functions / 74.43 statements). Floors sit just below the
      // measured baseline so coverage cannot silently regress — ratchet
      // upward as the debt burns down.
      // 2026-10-18 (PR-27, plan phase 4.2): branch floor 62 → 70. `pnpm
      // test:coverage` has measured 70.16 / 70.34 / 70.43 / 70.79 branches
      // across the 2026-10-15 → 2026-10-18 pins, so 70 clears every observed
      // run with margin while making a ~1-point regression fatal.
      thresholds: {
        lines: 72,
        branches: 70,
        functions: 77,
        statements: 73,
      },
      exclude: [
        "node_modules/**",
        "dist/**",
        "tests/**",
        "scripts/**",
        "prisma/**",
        "**/*.d.ts",
      ],
    },
  },
});
