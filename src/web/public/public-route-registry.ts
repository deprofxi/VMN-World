/**
 * Reviewed public URLs eligible for crawler indexing and sitemap output.
 * Private, prototype, alias, and unverified dynamic routes are intentionally excluded.
 */
export const PUBLIC_INDEXABLE_ROUTES = [
  "/",
  "/about",
  "/channels",
  "/channels/nxtr",
  "/channels/orisun",
  "/channels/isimbido",
  "/programmes/PRG-001",
  "/hub",
  "/partners",
  "/insights",
  "/careers",
  "/azeebo",
  "/schedule",
  "/advertising",
  "/contact",
  "/help",
  "/privacy",
  "/accessibility",
] as const;

export const PUBLIC_INDEXABLE_PATHS: ReadonlySet<string> = new Set(PUBLIC_INDEXABLE_ROUTES);
