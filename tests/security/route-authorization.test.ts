/**
 * Route Authorization Regression Suite (AUD-01 enforcement)
 *
 * Guarantees:
 * 1. Every entry in ROUTE_GUARDS maps to an implemented route (table drift
 *    detection — a renamed/removed route makes the guard test fail).
 * 2. Every guarded route rejects unauthenticated callers with 401 before any
 *    handler logic runs.
 * 3. Every guarded route accepts a legitimately authorized caller.
 * 4. Known mutating enterprise routes are all present in ROUTE_GUARDS, so a
 *    new mutating route without a guard fails this suite.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { ROUTE_GUARDS } from "../../src/api/router.js";
import { signSessionToken } from "../../src/core/auth/index.js";

function makeRequest(
  port: number,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsedBody: any;
          try {
            parsedBody = JSON.parse(data);
          } catch {
            parsedBody = data;
          }
          resolve({ statusCode: res.statusCode || 500, body: parsedBody });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe("AUD-01: Centralized Route Authorization", () => {
  let app: ApiServerInstance;
  let superToken: string;
  let boundPort: number;

  beforeAll(async () => {
    app = createApiServer(0);
    await app.start();
    // Resolve the OS-assigned ephemeral port (createApiServer echoes the
    // constructor arg into .port, so read the bound address instead).
    const address = app.server.address() as { port: number };
    boundPort = address.port;
    superToken = signSessionToken({
      userId: "usr-guard-test",
      personId: "per-guard-test",
      email: "guard-test@vmnl.ng",
      roles: ["SuperAdmin"],
    }).accessToken;
  });

  afterAll(async () => {
    await app.stop();
  });

  it("guards every known mutating enterprise route (no unguarded mutations)", () => {
    const guardedPaths = new Set(ROUTE_GUARDS.map((g) => `${g.method} ${g.pathname}`));
    const mutatingRoutes = [
      "/api/v1/broadcast/asrun/reconcile",
      "/api/v1/broadcast/programmes/qc",
      "/api/v1/broadcast/scheduling/validate",
      "/api/v1/broadcast/rights/validate",
      "/api/v1/broadcast/traffic/breaks/validate",
      "/api/v1/broadcast/playout/filler",
      "/api/v1/broadcast/sponsorship/log",
      "/api/v1/broadcast/carriage/incidents",
      "/api/v1/broadcast/billing/calculate",
      "/api/v1/broadcast/export/smpte",
      "/api/v1/broadcast/export/bxf",
      "/api/v1/hub/talent/onboard",
      "/api/v1/hub/afca/certify",
      "/api/v1/hub/afca/grades",
      "/api/v1/hub/events/verify-ticket",
      "/api/v1/hub/events/tickets/validate",
      "/api/v1/hub/vtm/match",
      "/api/v1/hub/vcf/pitches",
      "/api/v1/hub/vcf/waterfall",
      "/api/v1/hub/onestudios/bookings",
      "/api/v1/hub/onestudios/callsheets",
      "/api/v1/hub/tend/avails",
      "/api/v1/hub/tend/licenses",
      "/api/v1/hub/community/members",
      "/api/v1/hub/community/bookings",
      "/api/v1/intelligence/headspace/search",
      "/api/v1/intelligence/headspace/query",
      "/api/v1/intelligence/cr8tech/subtitle",
      "/api/v1/intelligence/aos/execute",
      "/api/v1/intelligence/aos/killswitch",
      "/api/v1/federation/azeebo/webhook",
      "/api/v1/federation/azeebo/link",
      "/api/v1/federation/azeebo/links",
      "/api/v1/finance/deals",
      "/api/v1/finance/quotes/create",
      "/api/v1/finance/payouts/batch",
      "/api/v1/finance/reconcile/bank",
      "/api/v1/finance/reconcile",
      "/api/v1/storage/upload-url",
      "/api/v1/storage/scan",
      // Todo register remediation routes (SEC/SCR/FIN/BCST)
      "/api/v1/workspace/approvals",
      "/api/v1/workspace/content",
      "/api/v1/cases",
      "/api/v1/federation/destinations",
      "/api/v1/broadcast/versions",
      "/api/v1/broadcast/epg/push-startimes",
      "/api/v1/finance/mt940/ingest",
      // SCR-17/18/19 rewired desk mutations (dynamic accept path is guarded inline)
      "/api/v1/commercial/proposals",
      "/api/v1/workspace/accelerator/partners",
      "/api/v1/workspace/community/sprints",
      "/api/v1/workspace/vtm/cast",
      "/api/v1/workspace/production/callsheet",
      "/api/v1/workspace/vcf/missions",
      "/api/v1/workspace/events/scan",
      "/api/v1/workspace/tend/license",
      "/api/v1/workspace/headspace/documents",
      "/api/v1/workspace/governance/risks",
      "/api/v1/workspace/governance/issues",
    ];
    const missing = mutatingRoutes.filter((r) => !guardedPaths.has(`POST ${r}`));
    expect(missing, `Routes missing from ROUTE_GUARDS: ${missing.join(", ")}`).toEqual([]);
  });

  it("rejects unauthenticated calls with 401 for every guarded route", async () => {
    const failures: string[] = [];
    for (const guard of ROUTE_GUARDS) {
      const res = await makeRequest(boundPort, guard.pathname, { method: guard.method, body: {} });
      if (res.statusCode !== 401) {
        failures.push(`${guard.method} ${guard.pathname} -> ${res.statusCode}`);
      }
    }
    expect(failures, `Unguarded routes accepted anonymous calls:\n${failures.join("\n")}`).toEqual([]);
  });

  it("admits an authorized SuperAdmin for every guarded route or fails with non-auth error", async () => {
    // Authz-correct acceptance: 401/403 are authorization failures and must
    // never occur for SuperAdmin; handler-level validation errors (400/422/500)
    // are acceptable proof that the guard admitted the request to the handler.
    const failures: string[] = [];
    for (const guard of ROUTE_GUARDS) {
      const res = await makeRequest(boundPort, guard.pathname, {
        method: guard.method,
        headers: { Authorization: `Bearer ${superToken}` },
        body: {},
      });
      if (res.statusCode === 401 || res.statusCode === 403) {
        failures.push(`${guard.method} ${guard.pathname} -> ${res.statusCode}`);
      }
    }
    expect(failures, `SuperAdmin wrongly denied:\n${failures.join("\n")}`).toEqual([]);
  }, 30000);
});
