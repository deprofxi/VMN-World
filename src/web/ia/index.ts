/**
 * VMN World IA R1.1 — registry lookups.
 *
 * The generated registry is the only source of screen truth. This module adds
 * indexes and route matching; it never mutates or reinterprets a record.
 */

import { IA_REGISTRY, IA_REGISTRY_SOURCE } from "./registry.generated.js";
import type { IAScreen } from "./types.js";

export { IA_REGISTRY, IA_REGISTRY_SOURCE };
export type { IAScreen } from "./types.js";
export type { IAGate, IAArchetype, IARouteKind, IARegistrySource } from "./types.js";

const BY_ID: ReadonlyMap<string, IAScreen> = new Map(
  IA_REGISTRY.map((screen) => [screen.id, screen])
);

/**
 * Route owners are records that define a URL. Content instances share their
 * template's URL and are resolved as data, not as separate routes.
 */
const ROUTE_OWNERS: readonly IAScreen[] = IA_REGISTRY.filter(
  (screen) => screen.routeKind === "ROUTED" && screen.archetype !== "CONTENT_INSTANCE"
);

const CONFLICTING_OWNERS: readonly IAScreen[] = IA_REGISTRY.filter(
  (screen) =>
    screen.routeKind === "ROUTED" &&
    screen.archetype === "CONTENT_INSTANCE" &&
    !ROUTE_OWNERS.some((owner) => owner.route === screen.route)
);

/** Route templates that also carry content instances. */
const ROUTES_WITH_INSTANCES: ReadonlySet<string> = new Set(
  IA_REGISTRY.filter((screen) => screen.archetype === "CONTENT_INSTANCE").map(
    (screen) => screen.route
  )
);

const STATIC_ROUTES: ReadonlyMap<string, IAScreen> = new Map(
  [...ROUTE_OWNERS, ...CONFLICTING_OWNERS]
    .filter((screen) => !screen.route.includes("{"))
    .map((screen) => [screen.route, screen])
);

export interface IAParamRoute {
  pattern: string;
  regex: RegExp;
  paramNames: readonly string[];
  screen: IAScreen;
}

function compilePattern(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const source = pattern
    .split("/")
    .map((segment) => {
      const match = /^\{([^}]+)\}$/.exec(segment);
      if (match) {
        paramNames.push(match[1]);
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${source}$`), paramNames };
}

const PARAM_ROUTES: readonly IAParamRoute[] = [
  ...ROUTE_OWNERS,
  ...CONFLICTING_OWNERS,
]
  .filter((screen) => screen.route.includes("{"))
  .map((screen) => {
    const { regex, paramNames } = compilePattern(screen.route);
    return { pattern: screen.route, regex, paramNames, screen };
  })
  .sort((a, b) => {
    // More literal segments first, so /brands/ten beats /brands/{slug}.
    const literalDelta =
      b.pattern.split("/").filter((s) => !s.startsWith("{")).length -
      a.pattern.split("/").filter((s) => !s.startsWith("{")).length;
    return literalDelta !== 0 ? literalDelta : a.pattern.localeCompare(b.pattern);
  });

export interface IARouteMatch {
  screen: IAScreen;
  params: Readonly<Record<string, string>>;
  /** True when a content instance shares this route (e.g. the brand template). */
  sharedWithInstances: boolean;
}

/** Resolve a pathname to its IA screen. Static routes win over parameterised ones. */
export function resolveIARoute(pathname: string): IARouteMatch | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  const staticScreen = STATIC_ROUTES.get(path);
  if (staticScreen) {
    return {
      screen: staticScreen,
      params: {},
      sharedWithInstances: ROUTES_WITH_INSTANCES.has(staticScreen.route),
    };
  }

  for (const route of PARAM_ROUTES) {
    const match = route.regex.exec(path);
    if (!match) continue;
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1]);
    });
    return {
      screen: route.screen,
      params,
      sharedWithInstances: ROUTES_WITH_INSTANCES.has(route.pattern),
    };
  }

  return undefined;
}

export function getIAScreen(id: string): IAScreen | undefined {
  return BY_ID.get(id);
}

export function isIAPublic(screen: IAScreen): boolean {
  return screen.gate === "W0";
}

/** Screens hosted (modal, drawer, tab, edge state) by the given host screen. */
export function getHostedChildren(host: IAScreen): readonly IAScreen[] {
  return IA_REGISTRY.filter(
    (screen) =>
      screen.routeKind !== "ROUTED" &&
      (screen.hostScreenId === host.id ||
        (screen.hostPath !== "" && screen.hostPath === host.route))
  );
}

/** Content instances that render through the given route template. */
export function getContentInstances(routePattern: string): readonly IAScreen[] {
  return IA_REGISTRY.filter(
    (screen) => screen.archetype === "CONTENT_INSTANCE" && screen.route === routePattern
  );
}

export interface IAJourneyGroup {
  code: string;
  name: string;
  screens: readonly IAScreen[];
  routedCount: number;
  publicCount: number;
  hostedCount: number;
  gates: readonly string[];
}

function buildJourneys(): readonly IAJourneyGroup[] {
  const groups = new Map<string, IAScreen[]>();
  for (const screen of IA_REGISTRY) {
    const list = groups.get(screen.journeyCode);
    if (list) list.push(screen);
    else groups.set(screen.journeyCode, [screen]);
  }
  return [...groups.entries()]
    .map(([code, screens]) => ({
      code,
      name: screens[0].journey,
      screens,
      routedCount: screens.filter((screen) => screen.routeKind === "ROUTED").length,
      publicCount: screens.filter((screen) => screen.gate === "W0").length,
      hostedCount: screens.filter((screen) => screen.routeKind !== "ROUTED").length,
      gates: [...new Set(screens.map((screen) => screen.gate))].sort(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export const IA_JOURNEYS: readonly IAJourneyGroup[] = buildJourneys();

/** Public, routed pages — the sitemap's source. Content instances are excluded. */
export const IA_PUBLIC_PAGES: readonly IAScreen[] = ROUTE_OWNERS.filter(
  (screen) => screen.gate === "W0"
).sort((a, b) => a.route.localeCompare(b.route));

/** Every primary route pattern, for tests and diagnostics. */
export const IA_ROUTE_PATTERNS: readonly string[] = ROUTE_OWNERS.map((screen) => screen.route).sort();

export function iaGateLabel(gate: IAScreen["gate"]): string {
  switch (gate) {
    case "W0":
      return "Public · no session required";
    case "W1":
      return "Read access · authenticated session";
    case "W2":
      return "Work access · authenticated session";
    case "W3":
      return "Specialist access · authenticated session";
    case "W4":
      return "Human-gated · authenticated session and recorded authority";
    case "G":
      return "Conditional · authenticated session";
  }
}

export function iaJourneyHref(code: string): string {
  return `/sitemap#journey-${code.toLowerCase()}`;
}

/** Normalise a title for headings, keeping the inventory's own wording. */
export function iaScreenTitle(screen: IAScreen): string {
  return screen.screenName;
}
