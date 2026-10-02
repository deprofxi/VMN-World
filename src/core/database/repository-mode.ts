/**
 * Repository resilience policy (AUD-07).
 *
 * CLAUDE.md canonical law: one canonical truth. A database outage must never
 * cause a caller to believe a write succeeded when it did not reach the
 * authoritative store. Repositories therefore operate in one of two explicit
 * modes:
 *
 * - "fail_closed" (default): a failed Prisma write/read raises
 *   RepositoryUnavailableError, which the API layer maps to HTTP 503.
 * - "memory_fallback": the legacy sandbox behaviour — failures degrade to the
 *   in-memory store and the returned record is tagged `source: "MEMORY"`.
 *
 * The mode is a deliberate, per-deployment decision (ALLOW_SANDBOX_FALLBACK),
 * never a silent default.
 */

export type RepositoryMode = "fail_closed" | "memory_fallback";

const mode: RepositoryMode =
  process.env.ALLOW_SANDBOX_FALLBACK === "true" ? "memory_fallback" : "fail_closed";

export function getRepositoryMode(): RepositoryMode {
  return mode;
}

export class RepositoryUnavailableError extends Error {
  public readonly code = "REPOSITORY_UNAVAILABLE";
  public readonly status = 503;

  constructor(operation: string, resource: string, cause?: unknown) {
    super(
      `[VMNL-REPO-ERROR] ${resource} ${operation} failed and the repository is operating fail-closed (no in-memory fallback configured).`,
      { cause: cause instanceof Error ? cause : undefined }
    );
    this.name = "RepositoryUnavailableError";
  }
}

/**
 * Uniform catch-site handler: throws RepositoryUnavailableError in
 * fail_closed mode, or warns and lets the caller fall back to memory.
 */
export async function handleRepoError(
  resource: string,
  operation: string,
  err: unknown
): Promise<void> {
  if (mode === "fail_closed") {
    throw new RepositoryUnavailableError(operation, resource, err);
  }
  console.warn(
    `[VMNL-REPO-WARN] Prisma ${resource} ${operation} failed, falling back to memory: ${
      err instanceof Error ? err.message : String(err)
    }`
  );
}

/**
 * Runs `fn`; on error either rethrows (fail_closed) or returns null so the
 * caller can fall back to its memory store.
 */
export async function withRepositoryMode<T>(
  resource: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (mode === "fail_closed") {
      throw new RepositoryUnavailableError(operation, resource, err);
    }
    console.warn(
      `[VMNL-REPO-WARN] Prisma ${resource} ${operation} failed, falling back to memory: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }
}
