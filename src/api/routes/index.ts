/**
 * Modular Domain Route Table & Dispatcher (AUD-24)
 * Bridges domain-specific route modules into the central HTTP router.
 */

import { DomainRoute, RouteContext } from "./types.js";
import { privacyRoutes } from "./privacy.routes.js";
import { enquiryRoutes } from "./enquiry.routes.js";

export * from "./types.js";
export * from "./privacy.routes.js";
export * from "./enquiry.routes.js";

export const domainRouteTable: DomainRoute[] = [
  ...privacyRoutes,
  ...enquiryRoutes,
];

export async function dispatchDomainRoute(ctx: RouteContext): Promise<boolean> {
  for (const route of domainRouteTable) {
    if (route.method !== ctx.method) continue;

    const matches =
      typeof route.pathname === "string"
        ? route.pathname === ctx.pathname
        : route.pathname.test(ctx.pathname);

    if (matches) {
      const handled = await route.handle(ctx);
      return handled !== false;
    }
  }
  return false;
}
