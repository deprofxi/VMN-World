/**
 * VMN World IA R1.1 — dispatch behaviour.
 *
 * Exercises the same entry point the router calls, so the tests cover path
 * acceptance, decline-to-legacy behaviour, status codes and cache headers
 * without booting a database-backed HTTP server.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../src/core/auth/index.js";
import { dispatchIARoute } from "../../src/api/routes/ia.routes.js";
import { IA_JOURNEYS, resolveIARoute } from "../../src/web/ia/index.js";
import { resetEnquiryStoreForTesting, getEnquiryByReference, listEnquiries } from "../../src/modules/hub/enquiry/index.js";
import type { RouteContext } from "../../src/api/routes/types.js";

interface Captured {
  status: number;
  body: string;
  headers: Record<string, string | number>;
}

function createResponse(url: string): { res: ServerResponse; captured: Captured } {
  const captured: Captured = { status: 0, body: "", headers: {} };
  const res = {
    req: { method: "GET", url, headers: {} as Record<string, string> },
    setHeader(name: string, value: string | number) {
      captured.headers[name] = value;
    },
    writeHead(status: number, headers?: Record<string, string | number>) {
      captured.status = status;
      if (headers) Object.assign(captured.headers, headers);
      return res;
    },
    end(chunk?: string | Buffer) {
      if (chunk) captured.body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    },
  };
  return { res: res as unknown as ServerResponse, captured };
}

async function dispatch(
  url: string,
  options: { method?: string; user?: SessionUser | null } = {}
): Promise<{ handled: boolean; captured: Captured }> {
  const { res, captured } = createResponse(url);
  const parsedUrl = new URL(url, "http://localhost");
  const handled = await dispatchIARoute({
    req: { method: options.method ?? "GET", url, headers: {} } as unknown as IncomingMessage,
    res,
    pathname: parsedUrl.pathname,
    method: options.method ?? "GET",
    parsedUrl,
    user: options.user ?? null,
  } as RouteContext);
  return { handled, captured };
}

/** Dispatch a url-encoded form POST whose body can actually be read. */
async function dispatchForm(
  url: string,
  body: URLSearchParams
): Promise<{ handled: boolean; captured: Captured }> {
  const { res, captured } = createResponse(url);
  const parsedUrl = new URL(url, "http://localhost");
  const payload = body.toString();
  const req = new PassThrough();
  // PassThrough is not an IncomingMessage, but the dispatcher only reads
  // method/url/headers off it and streams the body through, so the staged
  // properties are the only shape the dispatch needs.
  const staged = req as unknown as IncomingMessage;
  staged.headers = { "content-type": "application/x-www-form-urlencoded" };
  staged.method = "POST";
  staged.url = url;
  req.end(payload);
  const handled = await dispatchIARoute({
    req: staged,
    res,
    pathname: parsedUrl.pathname,
    method: "POST",
    parsedUrl,
    user: null,
  } as RouteContext);
  return { handled, captured };
}

const USER: SessionUser = {
  userId: "u-1",
  personId: "p-1",
  email: "operator@vmnl.ng",
  roles: ["BroadcastOperationsManager"],
};

describe("IA dispatch", () => {
  it("serves a public inventory route with revalidating public caching", async () => {
    const { handled, captured } = await dispatch("/ecosystem");
    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.headers["Content-Type"]).toBe("text/html; charset=utf-8");
    expect(captured.headers["Cache-Control"]).toBe("public, max-age=0, must-revalidate");
    expect(captured.body).toContain("IA-PUB-003");
  });

  it("takes over the legacy home and about URLs with the inventory contract", async () => {
    const home = await dispatch("/");
    expect(home.handled).toBe(true);
    expect(home.captured.body).toContain("IA-PUB-001");

    const about = await dispatch("/about");
    expect(about.handled).toBe(true);
    expect(about.captured.body).toContain("IA-PUB-002");
    // The retained corporate content is still rendered inside the IA page.
    expect(about.captured.body).toContain("About Virtual Media Network Limited");
  });

  it("declines the platform-owned identity routes", async () => {
    for (const path of ["/sign-in", "/login"]) {
      const { handled } = await dispatch(path);
      expect(handled, `${path} must stay with the identity chain`).toBe(false);
    }
  });

  it("declines unknown paths so the existing 404 chain still answers", async () => {
    const { handled, captured } = await dispatch("/not-an-inventory-route");
    expect(handled).toBe(false);
    expect(captured.status).toBe(0);
  });

  it("serves GET only", async () => {
    const { handled } = await dispatch("/about", { method: "POST" });
    expect(handled).toBe(false);
  });

  it("denies an anonymous gated request with 401 and private caching", async () => {
    const { handled, captured } = await dispatch("/broadcast/broadcast-service-registry");
    expect(handled).toBe(true);
    expect(captured.status).toBe(401);
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
    expect(captured.body).toContain("Sign in to open this screen");
  });

  it("renders an authenticated gated request without exposing any record", async () => {
    const { captured } = await dispatch("/broadcast/broadcast-service-registry", { user: USER });
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("IA-BRC-002");
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
  });

  it("passes the query through to the public search screen", async () => {
    const { captured } = await dispatch("/search?q=governance");
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("value=\"governance\"");
    expect(captured.body).toContain("/corporate-governance-overview");
  });
});

describe("IA dispatch: the enquiry wizard's record-only submission path", () => {
  it("records a valid submission through the existing enquiry contract and redirects to its receipt", async () => {
    resetEnquiryStoreForTesting();
    const body = new URLSearchParams({
      wizardScreenId: "LEAD-003",
      fullName: "Integration Visitor",
      email: "visitor@example.com",
      message: "Please share training options for our newsroom team.",
      ndprConsent: "true",
    });
    const { handled, captured } = await dispatchForm("/work-with-vmn/submit", body);
    expect(handled).toBe(true);
    expect(captured.status).toBe(303);
    const location = String(captured.headers["Location"] ?? "");
    expect(location).toMatch(/^\/enquiries\/ENQ-[^/]+\/receipt$/);
    const reference = decodeURIComponent(location.split("/")[2]);
    const record = getEnquiryByReference(reference);
    expect(record, "the request must be recorded in the enquiry store").not.toBeNull();
    expect(record?.vertical).toBe("COMMERCIAL_ADVERTISING");
    expect(record?.message.startsWith("[Intent: LEAD-003")).toBe(true);
    expect(record?.message).toContain("Please share training options");
  });

  it("deduplicates an identical resubmission to the same case reference", async () => {
    resetEnquiryStoreForTesting();
    const body = new URLSearchParams({
      wizardScreenId: "LEAD-005",
      fullName: "Idempotent Visitor",
      email: "idempotent@example.com",
      message: "Opportunity enquiry body for the idempotency check.",
      ndprConsent: "true",
    });
    const first = await dispatchForm("/work-with-vmn/submit", body);
    const second = await dispatchForm("/work-with-vmn/submit", body);
    expect(first.captured.status).toBe(303);
    expect(second.captured.status).toBe(303);
    expect(second.captured.headers["Location"]).toBe(first.captured.headers["Location"]);
  });

  it("re-renders the wizard truthfully when validation refuses the request", async () => {
    resetEnquiryStoreForTesting();
    const body = new URLSearchParams({
      wizardScreenId: "LEAD-002",
      fullName: "T",
      email: "not-an-email",
      message: "hi",
    });
    const { handled, captured } = await dispatchForm("/work-with-vmn/submit", body);
    expect(handled).toBe(true);
    expect(captured.status).toBe(422);
    expect(captured.body).toContain("The request was not recorded");
    expect(captured.body).toContain("value=\"not-an-email\"");
    expect(listEnquiries().length).toBe(0);
  });

  it("refuses a submission naming a screen this site does not publish as a wizard", async () => {
    resetEnquiryStoreForTesting();
    const body = new URLSearchParams({
      wizardScreenId: "PUB-001",
      fullName: "Spoofed Intent",
      email: "spoof@example.com",
      message: "Attempt to route through a non-wizard screen id.",
      ndprConsent: "true",
    });
    const { captured } = await dispatchForm("/work-with-vmn/submit", body);
    expect(captured.status).toBe(422);
    expect(captured.body).toContain("not one this site publishes");
  });

  it("serves GET only for ordinary paths but answers the sanctioned form endpoint on POST", async () => {
    const declined = await dispatch("/about", { method: "POST" });
    expect(declined.handled).toBe(false);
    const form = await dispatchForm("/work-with-vmn/submit", new URLSearchParams({ wizardScreenId: "LEAD-001" }));
    expect(form.handled).toBe(true);
  });
});

describe("IA dispatch: Phase 4 gated journeys", () => {
  const phase4 = IA_JOURNEYS.filter((journey) =>
    ["CIRC", "AUTH", "MISS", "CAP"].includes(journey.code)
  )
    .flatMap((journey) => journey.screens)
    .filter((screen) => screen.routeKind === "ROUTED" && screen.id !== "AUTH-001");

  function pathFor(route: string): string {
    return route.includes("{") ? route.replace(/\{[^}]+\}/g, "probe-value") : route;
  }

  it("covers the four journeys across the real dispatcher", () => {
    expect(phase4.length).toBe(57);
    for (const screen of phase4) {
      expect(resolveIARoute(pathFor(screen.route))?.screen.id, screen.id).toBe(screen.id);
    }
  });

  it("answers 401 anonymously and 200 for a session on every routed path", async () => {
    for (const screen of phase4) {
      const path = pathFor(screen.route);

      const anonymous = await dispatch(path);
      expect(anonymous.handled, `${screen.id} must be owned by IA`).toBe(true);
      expect(anonymous.captured.status, `${screen.id} must demand a session`).toBe(401);
      expect(anonymous.captured.headers["Cache-Control"]).toBe("private, no-store");
      // A denial states the gate and reveals no record.
      expect(anonymous.captured.body).not.toContain("Source not connected");

      const authed = await dispatch(path, { user: USER });
      expect(authed.captured.status, `${screen.id} must render for a session`).toBe(200);
      expect(authed.captured.headers["Cache-Control"], `${screen.id} is private`).toBe(
        "private, no-store"
      );
      expect(authed.captured.body, `${screen.id} must carry its acceptance ID`).toContain(
        screen.acceptanceId
      );
      expect(authed.captured.body, `${screen.id} must render the work or identity shell`).toMatch(
        /vmn-work-rail-title|vmn-shell-identity/
      );
    }
  });

  it("refuses to serve a gated screen as public cacheable content", async () => {
    const { captured } = await dispatch("/circle", { user: USER });
    expect(captured.headers["Cache-Control"]).not.toContain("public");
  });
});

describe("IA dispatch: Wave 1 least-privilege authorization (HTTP 403 enforcement)", () => {
  const financeUser: SessionUser = {
    userId: "u-fin",
    personId: "p-fin",
    email: "finance@vmnl.ng",
    roles: ["FinanceController"],
  };

  const rightsUser: SessionUser = {
    userId: "u-rights",
    personId: "p-rights",
    email: "rights@vmnl.ng",
    roles: ["RightsManager"],
  };

  const unauthorizedOperator: SessionUser = {
    userId: "u-op",
    personId: "p-op",
    email: "op@vmnl.ng",
    roles: ["PlayoutOperator"],
  };

  const superAdminUser: SessionUser = {
    userId: "u-admin",
    personId: "p-admin",
    email: "admin@vmnl.ng",
    roles: ["SuperAdmin"],
  };

  it("denies unauthenticated request to /finance/contracts-and-obligations-financial-index with 401", async () => {
    const { handled, captured } = await dispatch("/finance/contracts-and-obligations-financial-index");
    expect(handled).toBe(true);
    expect(captured.status).toBe(401);
    expect(captured.body).toContain("Sign in to open this screen");
  });

  it("denies unauthorized operator to /finance/contracts-and-obligations-financial-index with 403 and recourse CTA", async () => {
    const { handled, captured } = await dispatch("/finance/contracts-and-obligations-financial-index", { user: unauthorizedOperator });
    expect(handled).toBe(true);
    expect(captured.status).toBe(403);
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
    expect(captured.body).toContain("403 · Access denied");
    expect(captured.body).toContain("Your session is not cleared for this screen");
    expect(captured.body).toContain("/access-request");
    // Ensure no sensitive or placeholder card leaking
    expect(captured.body).not.toContain("Source not connected");
  });

  it("allows FinanceController to /finance/contracts-and-obligations-financial-index with 200", async () => {
    const { handled, captured } = await dispatch("/finance/contracts-and-obligations-financial-index", { user: financeUser });
    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
    expect(captured.body).toContain("FIN-005");
  });

  it("allows SuperAdmin unconditionally with 200 on finance routes", async () => {
    const { handled, captured } = await dispatch("/finance/contracts-and-obligations-financial-index", { user: superAdminUser });
    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("FIN-005");
  });

  it("denies FinanceController to /rights/title-chain-of-title-record with 403", async () => {
    const { handled, captured } = await dispatch("/rights/title-chain-of-title-record", { user: financeUser });
    expect(handled).toBe(true);
    expect(captured.status).toBe(403);
    expect(captured.body).toContain("403 · Access denied");
    expect(captured.body).toContain("IPR-003");
  });

  it("allows RightsManager to /rights/title-chain-of-title-record with 200", async () => {
    const { handled, captured } = await dispatch("/rights/title-chain-of-title-record", { user: rightsUser });
    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("IPR-003");
  });
});
