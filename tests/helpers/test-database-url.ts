/**
 * TSK-61 — dedicated test database URL derivation.
 *
 * The test suite used to inherit whatever state the ambient `DATABASE_URL`
 * pointed at (a golden-seeded development database makes ten suites fail on
 * seeded rows — `docs/handoffs/LATEST.md` records that "environment fact"
 * recurring on 2026-10-08, 2026-10-12 and 2026-10-16). This module derives
 * the isolated target the suite provisions and connects to instead, so
 * `pnpm test` is deterministic regardless of how the development database was
 * last seeded. The development database itself is never written to.
 *
 * Precedence mirrors `src/core/config/index.ts` exactly (shell env → `.env`
 * file → sandbox fallback literal), because the suite must target the same
 * database the application would have used, suffixed with `_test`.
 */

/** Same literal as the non-production fallback in `src/core/config/index.ts` (getConfig). */
export const SANDBOX_FALLBACK_DATABASE_URL =
  "postgresql://vmn_user:vmn_sandbox_only_password@localhost:5432/vmnl_enterprise?schema=public";

/** Appended to the ambient database name to isolate the suite. */
export const TEST_DATABASE_SUFFIX = "_test";

/** PostgreSQL requires an unquoted identifier of this shape for CREATE DATABASE. */
const SAFE_DATABASE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Strip any password before a URL appears in a log line or error message. */
export function redactDatabaseUrl(url: string): string {
  return url.replace(/(:\/\/[^:/@\s]+):[^@\s]*@/, "$1:***@");
}

function parse(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(`[TSK-61] database URL is not parseable: ${redactDatabaseUrl(url)}`);
  }
}

/** Database name from the URL path (`/vmnl_enterprise` → `vmnl_enterprise`). */
export function databaseNameOf(url: string): string {
  const name = decodeURIComponent(parse(url).pathname.replace(/^\//, ""));
  if (!name) {
    throw new Error(`[TSK-61] database URL carries no database name: ${redactDatabaseUrl(url)}`);
  }
  return name;
}

/** Same URL with only the database name replaced; host, auth and query preserved. */
export function withDatabaseName(url: string, databaseName: string): string {
  const parsed = parse(url);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

/** Maintenance-database URL (host/credentials kept, Prisma query stripped) for server-side SQL. */
export function maintenanceDatabaseUrl(url: string): string {
  const parsed = parse(url);
  parsed.pathname = "/postgres";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

/** `CREATE DATABASE` is only safe with a validated identifier; quote-escaping is not attempted. */
export function assertSafeDatabaseName(databaseName: string): void {
  if (!SAFE_DATABASE_NAME.test(databaseName)) {
    throw new Error(
      `[TSK-61] database name "${databaseName}" is not a safe unquoted PostgreSQL identifier; ` +
        `set TEST_DATABASE_URL to a name matching ${SAFE_DATABASE_NAME.source}`,
    );
  }
}

/**
 * Resolve the database the application would connect to:
 * shell/env `DATABASE_URL` → parsed `.env` contents → sandbox fallback.
 *
 * The `.env` file is passed as parsed contents rather than loaded with
 * `dotenv.config()` here on purpose: loading it into the setup process would
 * also export `NODE_ENV=development`, which is the documented measurement
 * error that fails ~80 guard tests (`docs/handoffs/LATEST.md`, environment note).
 */
export function resolveBaseDatabaseUrl(
  env: Record<string, string | undefined>,
  fileValues: Record<string, string | undefined> = {},
): string {
  const fromEnv = env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  const fromFile = fileValues.DATABASE_URL?.trim();
  if (fromFile) return fromFile;
  return SANDBOX_FALLBACK_DATABASE_URL;
}

/**
 * Dedicated suite target: `TEST_DATABASE_URL` when the operator supplies one,
 * otherwise the base database name suffixed with `_test`.
 * The result is always validated as a safe CREATE DATABASE identifier.
 */
export function deriveTestDatabaseUrl(baseUrl: string, override?: string): string {
  const target =
    override && override.trim() !== ""
      ? override.trim()
      : withDatabaseName(baseUrl, `${databaseNameOf(baseUrl)}${TEST_DATABASE_SUFFIX}`);
  assertSafeDatabaseName(databaseNameOf(target));
  return target;
}
