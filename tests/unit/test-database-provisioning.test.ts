/**
 * TSK-61 — the dedicated test database is derived, validated and wired in.
 *
 * The provisioning itself (CREATE DATABASE + `prisma migrate deploy`) runs in
 * `tests/global-setup.ts` before every Vitest run; these tests pin the pure
 * derivation rules and the wiring that make `pnpm test` deterministic against
 * a seeded development database. The end-to-end proof is the full suite
 * exiting 0 while `vmnl_enterprise` stays golden-seeded — recorded with the
 * TSK-61 evidence artifact in `docs/audit/evidence/`.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

import {
  SANDBOX_FALLBACK_DATABASE_URL,
  TEST_DATABASE_SUFFIX,
  assertSafeDatabaseName,
  databaseNameOf,
  deriveTestDatabaseUrl,
  maintenanceDatabaseUrl,
  redactDatabaseUrl,
  resolveBaseDatabaseUrl,
  withDatabaseName,
} from "../helpers/test-database-url.js";

const AMBIENT = "postgresql://root@localhost:5432/vmnl_enterprise?schema=public";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const vitestConfigSource = readFileSync(path.join(repoRoot, "vitest.config.ts"), "utf8");

describe("TSK-61: dedicated test database derivation", () => {
  it("suffixes the database name with _test and preserves host, auth and query", () => {
    const derived = deriveTestDatabaseUrl(AMBIENT);
    expect(derived).toBe(
      `postgresql://root@localhost:5432/vmnl_enterprise${TEST_DATABASE_SUFFIX}?schema=public`,
    );
    expect(databaseNameOf(derived)).toBe(`vmnl_enterprise${TEST_DATABASE_SUFFIX}`);
    // The development database itself must never be the derived target.
    expect(databaseNameOf(derived)).not.toBe(databaseNameOf(AMBIENT));
  });

  it("honours an explicit TEST_DATABASE_URL override and validates its name too", () => {
    expect(deriveTestDatabaseUrl(AMBIENT, "postgresql://root@localhost:5432/vmn_ci_test")).toBe(
      "postgresql://root@localhost:5432/vmn_ci_test",
    );
    expect(() => deriveTestDatabaseUrl(AMBIENT, "postgresql://root@localhost:5432/bad-name")).toThrow(
      /safe unquoted PostgreSQL identifier/,
    );
    // Empty/whitespace overrides fall back to derivation rather than creating an empty name.
    expect(deriveTestDatabaseUrl(AMBIENT, "   ")).toBe(
      `postgresql://root@localhost:5432/vmnl_enterprise${TEST_DATABASE_SUFFIX}?schema=public`,
    );
  });

  it("refuses database names CREATE DATABASE cannot run without quoting", () => {
    expect(() => deriveTestDatabaseUrl("postgresql://root@localhost:5432/vmnl-test")).toThrow(
      /safe unquoted PostgreSQL identifier/,
    );
    expect(() => assertSafeDatabaseName("has space")).toThrow(/safe unquoted PostgreSQL identifier/);
    expect(() => assertSafeDatabaseName("ok_name_1")).not.toThrow();
  });

  it("resolves the base URL with the application's precedence: env > .env > sandbox fallback", () => {
    const file = { DATABASE_URL: "postgresql://from-file@localhost:5432/from_file" };
    expect(resolveBaseDatabaseUrl({ DATABASE_URL: "postgresql://from-env@localhost:5432/from_env" }, file)).toBe(
      "postgresql://from-env@localhost:5432/from_env",
    );
    expect(resolveBaseDatabaseUrl({}, file)).toBe("postgresql://from-file@localhost:5432/from_file");
    expect(resolveBaseDatabaseUrl({}, {})).toBe(SANDBOX_FALLBACK_DATABASE_URL);
    expect(resolveBaseDatabaseUrl({ DATABASE_URL: "  " }, {})).toBe(SANDBOX_FALLBACK_DATABASE_URL);
  });

  it("builds the maintenance URL against postgres without the Prisma query parameter", () => {
    const admin = maintenanceDatabaseUrl(AMBIENT);
    expect(admin).toBe("postgresql://root@localhost:5432/postgres");
    expect(admin).not.toContain("schema=");
  });

  it("never prints a password and rejects a URL with no database name", () => {
    expect(redactDatabaseUrl("postgresql://user:secret@localhost:5432/db")).toBe(
      "postgresql://user:***@localhost:5432/db",
    );
    expect(redactDatabaseUrl("postgresql://user@localhost:5432/db")).toBe(
      "postgresql://user@localhost:5432/db",
    );
    expect(() => databaseNameOf("postgresql://user@localhost:5432/")).toThrow(/no database name/);
    expect(() => databaseNameOf("not a url")).toThrow(/not parseable/);
    expect(withDatabaseName(AMBIENT, "other")).toBe("postgresql://root@localhost:5432/other?schema=public");
  });

  it("wires the provisioning global setup into the Vitest run before any test file", () => {
    // Read the config as text rather than importing it: the config file is
    // deliberately outside the tsconfig program (it carries worker-count
    // options the config type does not model), and importing it from a test
    // would pull it into typecheck.
    expect(vitestConfigSource).toMatch(/globalSetup:\s*\["tests\/global-setup\.ts"\]/);
    const setupPath = path.join(repoRoot, "tests", "global-setup.ts");
    expect(existsSync(setupPath), "the provisioning module must exist").toBe(true);
  });
});
