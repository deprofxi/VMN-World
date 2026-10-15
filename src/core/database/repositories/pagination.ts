/** Bounded, stable keyset paging shared by repository list operations. */
export const MAX_REPOSITORY_PAGE_SIZE = 100;

export interface RepositoryListOptions {
  /** Last unique key returned by the previous page; the next page starts after it. */
  after?: string;
  /** Requested page size, clamped to 1..MAX_REPOSITORY_PAGE_SIZE. */
  limit?: number;
}

export interface RepositoryListPage<T> {
  rows: T[];
  nextCursor?: string;
}

export function createRepositoryListPage<T>(rows: T[], keyOf: (row: T) => string, limit: number): RepositoryListPage<T> {
  return {
    rows: rows.slice(0, limit),
    nextCursor: rows.length > limit ? keyOf(rows[limit - 1]!) : undefined,
  };
}

export function normalizeRepositoryListOptions(options: RepositoryListOptions = {}): { after: string; limit: number } {
  const requested = Number.isFinite(options.limit) ? Math.trunc(options.limit!) : MAX_REPOSITORY_PAGE_SIZE;
  const after = typeof options.after === "string" && options.after.length > 0 && options.after.length <= 256
    ? options.after
    : "";
  return { after, limit: Math.max(1, Math.min(MAX_REPOSITORY_PAGE_SIZE, requested)) };
}

/**
 * Cursor semantics shared by the memory and Prisma list paths: `after` is a
 * strict comparison bound, so it works even when the referenced row no longer
 * exists (a deleted page anchor must not strand the caller). The Prisma paths
 * therefore use `{ key: { gt: after } }`, not `cursor`/`skip`, which fails when
 * the anchor is absent and silently falls the caller back onto the in-memory
 * store. AUD-23 / TSK-05.
 */
export function paginateMemoryRows<T>(
  rows: T[],
  keyOf: (row: T) => string,
  options: { after: string; limit: number }
): RepositoryListPage<T> {
  const filtered = rows
    .slice()
    .sort((left, right) => keyOf(left).localeCompare(keyOf(right)))
    .filter((row) => !options.after || keyOf(row) > options.after);
  return createRepositoryListPage(filtered, keyOf, options.limit);
}
