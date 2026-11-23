/**
 * Reviewed public URLs eligible for crawler indexing and sitemap output.
 * Private, prototype, alias, and unverified dynamic routes are intentionally excluded.
 *
 * Every entry here must serve 200. The IA successors of the retired legacy routes
 * (`/channels/*` → `/media-and-audience-overview`, `/hub` → the creative-economy
 * overview, `/help` → `/support`) are listed instead of the retired paths, because
 * submitting a 301 to a crawler spends crawl budget on a redirect we already know
 * the destination of. `tests/unit/retired-route-guard.test.ts` enforces that.
 */
export const PUBLIC_INDEXABLE_ROUTES = [
  "/",
  "/about",
  "/media-and-audience-overview",
  "/programmes/PRG-001",
  "/creative-economy-hub-overview",
  "/partners",
  "/insights",
  "/careers",
  "/azeebo",
  "/schedule",
  "/advertising",
  "/contact",
  "/support",
  "/privacy",
  "/accessibility",
] as const;

export const PUBLIC_INDEXABLE_PATHS: ReadonlySet<string> = new Set(PUBLIC_INDEXABLE_ROUTES);
