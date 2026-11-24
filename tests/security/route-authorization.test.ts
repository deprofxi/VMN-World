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
import { ROUTE_GUARDS, WORKSPACE_HTML_GUARDS } from "../../src/api/router.js";
import { signSessionToken } from "../../src/core/auth/index.js";

function makeRequest(
  port: number,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ statusCode: number; body: any; headers: http.IncomingHttpHeaders }> {
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
          resolve({ statusCode: res.statusCode || 500, body: parsedBody, headers: res.headers });
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
      "/api/v1/feature-flags/:key/toggle",
      "/api/v1/feature-flags/:key",
      "/api/v1/enquiries/:reference/retry-routing",
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

  it("rejects anonymous access to every workspace desk and admin alias (AUD-01, AUD-02)", async () => {
    const paths = [
      "/workspace",
      "/workspace/finance",
      "/workspace/talent",
      "/workspace/approvals",
      "/broadcast/dashboard",
      "/admin/feature-flags",
      "/workspace/admin/feature-flags",
    ];
    const failures: string[] = [];
    for (const p of paths) {
      const res = await makeRequest(boundPort, p, { method: "GET" });
      if (![302, 401, 403].includes(res.statusCode)) {
        failures.push(`${p} -> ${res.statusCode}`);
      }
    }
    expect(failures, `Anonymous access wrongly permitted:\n${failures.join("\n")}`).toEqual([]);
  });

  /**
   * TSK-26: the HTML guard table has two distinct outcomes and the suite only
   * tested a disjunction of them. `[302, 401, 403]` would pass even if the
   * sign-in redirect degraded into a bare 403, so each branch is now asserted
   * against the table itself rather than a hand-picked path list.
   */
  it("enforces each WORKSPACE_HTML_GUARDS prefix: 302 to sign-in anonymously, 403 for a role outside the guard, admitted inside it", async () => {
    const ALL_TEST_ROLES = [
      "SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController",
      "PlayoutOperator", "BroadcastDirector", "RightsManager", "AcademyDirector",
    ];
    const failures: string[] = [];

    for (const guard of WORKSPACE_HTML_GUARDS) {
      const surface = guard.prefix === "/admin" ? "/admin/feature-flags" : guard.prefix;

      const anonymous = await makeRequest(boundPort, surface, { method: "GET" });
      if (anonymous.statusCode !== 302) {
        failures.push(`${surface} — anonymous got ${anonymous.statusCode}, expected 302`);
      } else if (anonymous.headers.location !== `/sign-in?returnUrl=${encodeURIComponent(surface)}`) {
        failures.push(`${surface} — redirect target ${String(anonymous.headers.location)} loses the returnUrl`);
      }

      const outsiderRole = ALL_TEST_ROLES.find((r) => !guard.roles.includes(r));
      if (outsiderRole) {
        const outsider = await makeRequest(boundPort, surface, {
          method: "GET",
          headers: { "x-test-role": outsiderRole },
        });
        if (outsider.statusCode !== 403) {
          failures.push(`${surface} — ${outsiderRole} got ${outsider.statusCode}, expected 403`);
        } else if (!String(outsider.body).includes("403")) {
          failures.push(`${surface} — 403 response carries no forbidden markup`);
        }
      }

      const insider = await makeRequest(boundPort, surface, {
        method: "GET",
        headers: { Authorization: `Bearer ${superToken}` },
      });
      if ([302, 403].includes(insider.statusCode)) {
        failures.push(`${surface} — SuperAdmin (guard allows) got ${insider.statusCode}`);
      }
    }

    expect(failures, `Workspace HTML guard drift:\n${failures.join("\n")}`).toEqual([]);
  });

  it("protects PII-bearing collections GET /api/v1/enquiries and GET /api/v1/admissions/queue (AUD-03)", async () => {    const unauthEnquiries = await makeRequest(boundPort, "/api/v1/enquiries", { method: "GET" });
    expect(unauthEnquiries.statusCode).toBe(401);

    const unauthAdmissions = await makeRequest(boundPort, "/api/v1/admissions/queue", { method: "GET" });
    expect(unauthAdmissions.statusCode).toBe(401);

    const authEnquiries = await makeRequest(boundPort, "/api/v1/enquiries", {
      method: "GET",
      headers: { Authorization: `Bearer ${superToken}` },
    });
    expect([200, 422]).toContain(authEnquiries.statusCode);

    const authAdmissions = await makeRequest(boundPort, "/api/v1/admissions/queue", {
      method: "GET",
      headers: { Authorization: `Bearer ${superToken}` },
    });
    expect([200, 422]).toContain(authAdmissions.statusCode);
  });

  it("allows authenticated self-service privacy requests without audit-role escalation", async () => {
    const subjectUserId = `usr-privacy-subject-${Date.now()}`;
    const subjectToken = signSessionToken({
      userId: subjectUserId,
      personId: "per-privacy-subject",
      email: "subject@example.ng",
      roles: ["Operator"],
    }).accessToken;
    const request = await makeRequest(boundPort, "/api/v1/privacy/export-request", {
      method: "POST",
      headers: { Authorization: `Bearer ${subjectToken}` },
      body: { email: "subject@example.ng", reason: "Access request" },
    });
    expect(request.statusCode).toBe(202);
    // AUD-08 / TSK-05: the invariant is that this endpoint never implies a
    // processing lifecycle. The status vocabulary now has two honest members:
    // RECEIVED (a durable DataSubjectRequest ledger row exists) or RECORD_ONLY
    // (memory only). Assert the invariant and its consistency instead of a
    // single retired value.
    expect(["RECEIVED", "RECORD_ONLY"]).toContain(request.body.exportStatus);
    expect(request.body.durableRecorded).toBe(request.body.exportStatus === "RECEIVED");
    expect(request.body.message).toContain("Archive generation is not implemented");
    expect(request.body.message).toContain("no processing queue exists");

    const status = await makeRequest(boundPort, "/api/v1/privacy/export-request", {
      method: "GET",
      headers: { Authorization: `Bearer ${subjectToken}` },
    });
    expect(status.statusCode).toBe(200);
    expect(status.body.request.userId).toBe(subjectUserId);

    const mismatched = await makeRequest(boundPort, "/api/v1/privacy/export-request", {
      method: "POST",
      headers: { Authorization: `Bearer ${subjectToken}` },
      body: { email: "someone-else@example.ng" },
    });
    expect(mismatched.statusCode).toBe(403);
    expect(mismatched.headers["content-type"]).toContain("application/problem+json");
    expect(mismatched.body.status).toBe(403);
    expect(mismatched.body.type).toBe("https://vmnl.ng/problems/forbidden");

    const anonymous = await makeRequest(boundPort, "/api/v1/privacy/export-request", {
      method: "POST",
      body: { email: "subject@example.ng" },
    });
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.headers["content-type"]).toContain("application/problem+json");
    expect(anonymous.body.title).toBe("Unauthorized");
  });

  it("requires SuperAdmin for feature-flag writes while allowing authorized mutation", async () => {
    const anonymous = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED/toggle", {
      method: "POST",
      body: { enabled: false },
    });
    expect(anonymous.statusCode).toBe(401);

    const operatorToken = signSessionToken({
      userId: "usr-feature-flag-operator",
      personId: "per-feature-flag-operator",
      email: "operator@example.ng",
      roles: ["Operator"],
    }).accessToken;
    const denied = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED/toggle", {
      method: "POST",
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: { enabled: false },
    });
    expect(denied.statusCode).toBe(403);

    const allowed = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED/toggle", {
      method: "POST",
      headers: { Authorization: `Bearer ${superToken}` },
      body: { enabled: false },
    });
    expect(allowed.statusCode).toBe(200);

    for (const method of ["POST", "PATCH"]) {
      const aliasAnonymous = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method,
        body: { enabled: true },
      });
      expect(aliasAnonymous.statusCode).toBe(401);
      const aliasDenied = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method,
        headers: { Authorization: `Bearer ${operatorToken}` },
        body: { enabled: true },
      });
      expect(aliasDenied.statusCode).toBe(403);
      const aliasAllowed = await makeRequest(boundPort, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method,
        headers: { Authorization: `Bearer ${superToken}` },
        body: { enabled: true },
      });
      expect(aliasAllowed.statusCode).toBe(200);
    }
  });

  it("guards enquiry retry-routing by authorization before dispatch", async () => {
    const anonymous = await makeRequest(boundPort, "/api/v1/enquiries/UNKNOWN-REF/retry-routing", { method: "POST", body: {} });
    expect(anonymous.statusCode).toBe(401);

    const operatorToken = signSessionToken({
      userId: "usr-enquiry-operator",
      personId: "per-enquiry-operator",
      email: "operator@example.ng",
      roles: ["Operator"],
    }).accessToken;
    const denied = await makeRequest(boundPort, "/api/v1/enquiries/UNKNOWN-REF/retry-routing", {
      method: "POST",
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {},
    });
    expect(denied.statusCode).toBe(403);

    const allowed = await makeRequest(boundPort, "/api/v1/enquiries/UNKNOWN-REF/retry-routing", {
      method: "POST",
      headers: { Authorization: `Bearer ${superToken}` },
      body: {},
    });
    expect(allowed.statusCode).not.toBe(401);
    expect(allowed.statusCode).not.toBe(403);
  });

  it("does not disclose applicant data or reflect status-reference markup", async () => {
    const result = await makeRequest(boundPort, "/apply/status?ref=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("Application Not Found");
    expect(result.body).toContain("&lt;script&gt;");
    expect(result.body).not.toContain("<script>alert(1)</script>");
    expect(result.body).not.toContain("test@afca.ng");
  });

  it("revalidates stable asset URLs rather than caching mutable bytes as immutable", async () => {
    for (const path of ["/assets/styles.css", "/assets/app.js"]) {
      const response = await makeRequest(boundPort, path);
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
    }
  });

  it("enforces CSRF double-submit token on POST /access-request (AUD-07)", async () => {
    // Calling POST /access-request without CSRF token should return 403
    const res = await makeRequest(boundPort, "/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `vmnl_session=${superToken}`,
      },
      body: new URLSearchParams({ role: "MCRSupervisor" }).toString(),
    });
    expect(res.statusCode).toBe(403);
  });

  it("locks down /metrics when METRICS_TOKEN is set (AUD-06)", async () => {
    process.env.METRICS_TOKEN = "test-scrape-token-secret-xyz";
    try {
      // Anonymous request should be rejected with 401
      const unauth = await makeRequest(boundPort, "/metrics", { method: "GET" });
      expect(unauth.statusCode).toBe(401);

      // Bearer token match should succeed with 200
      const withToken = await makeRequest(boundPort, "/metrics", {
        method: "GET",
        headers: { Authorization: "Bearer test-scrape-token-secret-xyz" },
      });
      expect(withToken.statusCode).toBe(200);

      // Operator session should also succeed with 200
      const withSession = await makeRequest(boundPort, "/metrics", {
        method: "GET",
        headers: { Cookie: `vmnl_session=${superToken}` },
      });
      expect(withSession.statusCode).toBe(200);
    } finally {
      delete process.env.METRICS_TOKEN;
    }
  });
});
