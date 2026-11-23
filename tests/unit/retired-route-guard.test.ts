/**
 * Every shipped surface must point at a live page, not at a retired route.
 *
 * The router permanently redirects seven legacy paths (decision D1) to their IA
 * successors. Those redirects are a courtesy for bookmarks and old links; a link
 * the application itself renders is a defect, because it makes the visitor pay a
 * second request to reach a page we already know the address of.
 *
 * This is not hypothetical. The first run of this file found eighteen rendered
 * links and ten source declarations pointing at the seven retired paths: the
 * home page's pillar cards, six entries in the sitemap's indexable registry, the
 * ecosystem map, the channel and programme breadcrumbs, the channel-not-found
 * state, the proof-of-air breadcrumb, two prototype cards that pointed at paths
 * never served at all, and the router's enquiry confirmation. Each of those was
 * found by this file, not by a reviewer.
 *
 * Two readers, deliberately:
 *  - the route table is parsed out of the router, so the guard cannot drift from
 *    the list it is guarding against;
 *  - the check runs over rendered HTML reached by crawling from `/`, so a link
 *    assembled at runtime is judged by what the browser actually receives, and
 *    over the source of every shipped module, so a page behind a gate is judged
 *    even when the crawl cannot reach it.
 *
 * The redirect table stays a table of exact paths. `/hub/afca` and `/help/operator`
 * are live children of retired parents and are not flagged; only the retired
 * path itself is.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { relative, join } from "node:path";

import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { IA_PUBLIC_PAGES } from "../../src/web/ia/index.js";
import { PROTOTYPE_SCENARIO_CATALOG, PROTOTYPE_SCREEN_CATALOG } from "../../src/web/public/prototypes.js";
import { PUBLIC_INDEXABLE_ROUTES } from "../../src/web/public/public-route-registry.js";
import { PRIMARY_NAV } from "../../src/web/public/site-registry.js";
import {
  REPO_ROOT,
  ROUTER_SOURCE,
  internalLinkTargets,
  parseLegacyRedirects,
  pathLiterals,
  pathOf,
  retiredPathSet,
} from "../helpers/retired-routes.js";

const redirects = parseLegacyRedirects();
const retired = retiredPathSet(redirects);

let app: ApiServerInstance | undefined;
let port = 0;
let authHeader: Record<string, string> = {};

interface Fetched {
  status: number;
  location: string | null;
  contentType: string;
  body: string;
}

function get(path: string): Promise<Fetched> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET", headers: { "Accept-Encoding": "identity", ...authHeader } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            location: res.headers.location ?? null,
            contentType: String(res.headers["content-type"] ?? ""),
            body: Buffer.concat(chunks).toString("utf8"),
          })
        );
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error(`retirement probe timed out on ${path}`)));
    req.end();
  });
}

/** Paths a visitor can reach without guessing, plus the IA's public set. */
function seeds(): string[] {
  const routes = new Set<string>(["/", "/prototypes", ...PRIMARY_NAV.map((entry) => entry.href)]);
  for (const route of PUBLIC_INDEXABLE_ROUTES) routes.add(route);
  for (const screen of IA_PUBLIC_PAGES) {
    if (!screen.route.includes("{")) routes.add(screen.route);
  }
  for (const screen of PROTOTYPE_SCREEN_CATALOG) routes.add(`/prototypes?screen=${screen.id}`);
  for (const scenario of PROTOTYPE_SCENARIO_CATALOG) routes.add(`/prototypes?scenario=${scenario.id}`);
  return [...routes];
}

/** Same-origin links the crawler is allowed to follow. */
function followable(target: string): boolean {
  const path = pathOf(target);
  return (
    path.startsWith("/") &&
    !path.startsWith("/api/") &&
    !path.startsWith("/assets/") &&
    !path.startsWith("/metrics")
  );
}

beforeAll(async () => {
  app = createApiServer(0);
  await app.start();
  port = (app.server.address() as { port: number }).port;
  // An operator session, so gated consoles render their chrome (and their links)
  // instead of a sign-in gate.
  authHeader = {
    Authorization: `Bearer ${signSessionToken({
      userId: "usr-retirement-guard",
      personId: "per-retirement-guard",
      email: "retirement-guard@vmnl.ng",
      roles: ["SuperAdmin"],
    }).accessToken}`,
  };
}, 60000);

afterAll(() => app?.server.close());

describe("retired-route guard: the application never links a path the router retires", () => {
  it("reads the router's retirement table rather than a copy of it", () => {
    // The table is the authority; this file has no list of its own to go stale.
    const source = readFileSync(ROUTER_SOURCE, "utf8");
    expect(parseLegacyRedirects(source)).toEqual(redirects);
    expect(redirects.length).toBeGreaterThan(0);
    expect(new Set(redirects.map((redirect) => redirect.from)).size).toBe(redirects.length);
    for (const redirect of redirects) {
      expect(redirect.to.startsWith("/"), `${redirect.from} must redirect to a site path`).toBe(true);
      expect(retired.has(redirect.to), `${redirect.from} → ${redirect.to} would be a redirect chain`).toBe(false);
    }
  });

  it("refuses to grade a table it cannot read, instead of passing vacuously", () => {
    // The guard is an instrument; this is its self-test. If the table moves or
    // changes shape, the guard must fail loudly rather than check an empty set.
    expect(() => parseLegacyRedirects("const LEGACY_REDIRECTS = new Map();")).toThrow(/no longer declared/);
    expect(() =>
      parseLegacyRedirects(
        'const LEGACY_REDIRECTS: ReadonlyMap<string, string> = new Map([\n      ["/channels", "/media-and-audience-overview"],\n      ["/hub", toWherever],\n    ]);'
      )
    ).toThrow(/cannot read/);
    expect(() =>
      parseLegacyRedirects("const LEGACY_REDIRECTS: ReadonlyMap<string, string> = new Map([\n    ]);")
    ).toThrow(/parsed empty/);
  });

  it("sends every retired path to a page that actually serves", async () => {
    for (const redirect of redirects) {
      const res = await get(redirect.from);
      expect(res.status, `${redirect.from} must keep redirecting, not 404`).toBe(301);
      expect(res.location, `${redirect.from} must point at ${redirect.to}`).toMatch(
        new RegExp(`^${redirect.to.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\?.*)?$`)
      );

      const target = await get(redirect.to);
      expect(target.status, `${redirect.from} redirects to ${redirect.to}, which must serve`).toBe(200);
    }
  });

  it("renders no link to a retired path on any page reachable from the home page", async () => {
    const queue = seeds();
    const visited = new Set<string>();
    const offenders: string[] = [];
    let scanned = 0;

    while (queue.length > 0 && visited.size < 200) {
      const path = queue.shift() as string;
      if (visited.has(path) || !followable(path)) continue;
      visited.add(path);

      const res = await get(path);
      if (res.status !== 200 || !res.contentType.includes("text/html")) continue;
      scanned += 1;

      for (const target of internalLinkTargets(res.body)) {
        if (retired.has(pathOf(target))) {
          offenders.push(`${path} renders a link to ${target}`);
        }
        if (!visited.has(target) && followable(target)) queue.push(target);
      }
    }

    // A crawl that reached nothing would pass this test for the wrong reason.
    expect(scanned, "the crawl must actually walk the site").toBeGreaterThan(25);
    expect(
      offenders.sort(),
      "a rendered link to a retired route makes the visitor pay for a redirect we already know about"
    ).toEqual([]);
  }, 180000);

  it("declares no retired path in the source of a shipped module", () => {
    // Rendered HTML cannot cover pages behind a gate, or a surface only reachable
    // from a console the crawl never opens; the modules that emit those pages are
    // therefore read directly. The router is the one module allowed to name a
    // retired path: that is where the table lives.
    const offenders: string[] = [];
    const modules: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (full.endsWith(".ts")) modules.push(full);
      }
    };
    walk(join(REPO_ROOT, "src"));

    for (const file of modules) {
      if (file === ROUTER_SOURCE) continue;
      for (const literal of pathLiterals(file, readFileSync(file, "utf8"))) {
        const path = pathOf(literal.literal);
        if (retired.has(path)) {
          offenders.push(`${relative(REPO_ROOT, file)}:${literal.line} declares ${path}`);
        }
      }
    }

    expect(modules.length).toBeGreaterThan(100);
    expect(offenders.sort(), "a shipped module names a retired path instead of its successor").toEqual([]);
  });
});
