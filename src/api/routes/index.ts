/**
 * Modular Domain Route Table & Dispatcher (AUD-24)
 * Bridges domain-specific route modules into the central HTTP router.
 */

import { DomainRoute, RouteContext } from "./types.js";
import { privacyRoutes } from "./privacy.routes.js";
import { enquiryRoutes } from "./enquiry.routes.js";
import { broadcastRoutes } from "./broadcast.routes.js";
import { commercialRoutes } from "./commercial.routes.js";
import { hubRoutes } from "./hubs.routes.js";
import { financeRoutes } from "./finance.routes.js";
import { intelligenceRoutes } from "./intelligence.routes.js";
import { brandingDomainRoutes } from "./branding.domain-routes.js";

export * from "./types.js";
export * from "./privacy.routes.js";
export * from "./enquiry.routes.js";
export * from "./broadcast.routes.js";
export * from "./commercial.routes.js";
export * from "./hubs.routes.js";
export * from "./finance.routes.js";
export * from "./intelligence.routes.js";
export * from "./branding.domain-routes.js";

export const domainRouteTable: DomainRoute[] = [
  ...privacyRoutes,
  ...enquiryRoutes,
  ...broadcastRoutes,
  ...commercialRoutes,
  ...hubRoutes,
  ...financeRoutes,
  ...intelligenceRoutes,
  ...brandingDomainRoutes,
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
