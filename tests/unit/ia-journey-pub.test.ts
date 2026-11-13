/**
 * VMN World IA R1.1 — PUB journey behaviour and gate matrix.
 *
 * Every public page must render anonymously, tie itself to its inventory row,
 * and show no operational value the environment cannot source.
 */

import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../src/core/auth/index.js";
import { getIAScreen, IA_PUBLIC_PAGES, IA_REGISTRY, resolveIARoute } from "../../src/web/ia/index.js";
import { renderIAPublicBody } from "../../src/web/ia/journey-pub.js";
import { evaluateIAAccess, renderIAResponse } from "../../src/api/routes/ia.routes.js";

const ANON: SessionUser | null = null;
const OPERATOR: SessionUser = {
  userId: "test-broadcast-operator",
  personId: "test-person-operator",
  email: "operator@vmnl.ng",
  roles: ["BroadcastOperationsManager"],
};

function context(pathname: string) {
  const url = new URL(pathname, "http://localhost");
  return { pathname: url.pathname, query: url.searchParams, params: {} };
}

function render(pathname: string, user: SessionUser | null = ANON) {
  const match = resolveIARoute(new URL(pathname, "http://localhost").pathname);
  expect(match, `${pathname} did not resolve`).toBeDefined();
  const url = new URL(pathname, "http://localhost");
  return renderIAResponse(match!, { pathname: url.pathname, user, query: url.searchParams });
}

const PUB_ROUTED = IA_PUBLIC_PAGES.filter((screen) => screen.journeyCode === "PUB");

describe("PUB journey inventory coverage", () => {
  it("covers the 18 routed public pages", () => {
    expect(PUB_ROUTED).toHaveLength(18);
  });

  it("has four hosted states, each attached to a public host", () => {
    const hosted = IA_REGISTRY.filter(
      (screen) => screen.journeyCode === "PUB" && screen.routeKind !== "ROUTED"
    );
    expect(hosted.map((screen) => screen.id).sort()).toEqual([
      "PUB-014",
      "PUB-015",
      "PUB-018",
      "PUB-022",
    ]);
  });

  it("renders every public page anonymously with its acceptance reference", () => {
    for (const screen of PUB_ROUTED) {
      const rendered = render(screen.route);
      expect(rendered.status, `${screen.route} should be public`).toBe(200);
      expect(rendered.html).toContain(screen.acceptanceId);
      expect(rendered.html).toContain("Screen provenance");
      expect(rendered.html).toContain(screen.evidenceContract.slice(0, 40));
    }
  });

  it("renders a single h1 per public page and a labelled status strip", () => {
    for (const screen of PUB_ROUTED) {
      const rendered = render(screen.route);
      const h1Count = (rendered.html.match(/<h1[\s>]/g) ?? []).length;
      expect(h1Count, `${screen.route} has ${h1Count} h1 elements`).toBe(1);
      expect(rendered.html).toContain("W0 · Public · no session required");
    }
  });
});

describe("PUB journey hosted states", () => {
  it("shows the hosted no-results state when public search finds nothing", () => {
    const rendered = render("/search?q=quasar-ingestion-lattice");
    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain("PUB-014");
    expect(rendered.html).toContain("No eligible results");
    expect(rendered.html).toContain("Nothing public matches");
  });

  it("shows the contact-intent selector on the contact centre", () => {
    const rendered = render("/contact");
    expect(rendered.html).toContain("PUB-015");
    expect(rendered.html).toContain("Which team should receive this?");
  });

  it("shows the cookie preference centre on the privacy page", () => {
    const rendered = render("/privacy");
    expect(rendered.html).toContain("PUB-018");
    expect(rendered.html).toContain("Cookie preference centre");
    // An unconnected preference store must not present a save action.
    expect(rendered.html).not.toContain("Save preferences");
  });

  it("shows the statement revision history on the corporate home", () => {
    const rendered = render("/");
    expect(rendered.html).toContain("PUB-022");
    expect(rendered.html).toContain("Published statement revision history");
  });
});

describe("PUB journey search", () => {
  it("searches only public pages and echoes the query safely", () => {
    const rendered = render("/search?q=governance");
    expect(rendered.html).toContain("governance");
    expect(rendered.html).toContain("/corporate-governance-overview");
    for (const match of rendered.html.matchAll(/<li><a href="([^"]+)"/g)) {
      expect(IA_PUBLIC_PAGES.some((screen) => screen.route === match[1])).toBe(true);
    }
  });

  it("escapes a hostile query instead of rendering it as markup", () => {
    const rendered = render("/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
    expect(rendered.html).toContain("&lt;script&gt;");
  });
});

describe("PUB journey sitemap", () => {
  it("lists every public route from the registry, not a hand-written list", () => {
    const rendered = render("/sitemap");
    expect(rendered.status).toBe(200);
    for (const screen of PUB_ROUTED) {
      expect(rendered.html).toContain(`href="${screen.route}"`);
    }
    expect(rendered.html).toContain("journey-pub");
  });

  it("does not disclose restricted routes", () => {
    const rendered = render("/sitemap");
    expect(rendered.html).toContain(`${IA_PUBLIC_PAGES.length} public pages`);

    // Every route the index publishes must itself be a W0 screen. A public
    // route may live under /workspace (LEARN-001 does), so the check is the
    // gate, not the path prefix.
    const publicRoutes = new Set(IA_PUBLIC_PAGES.map((screen) => screen.route));
    for (const match of rendered.html.matchAll(/<li><a href="([^"]+)"/g)) {
      expect(publicRoutes.has(match[1]), `${match[1]} is not a public IA route`).toBe(true);
    }
  });
});

describe("IA gate matrix", () => {
  it("treats W0 as public and every other gate as session-bound", () => {
    const publicScreen = getIAScreen("PUB-002")!;
    const specialist = getIAScreen("BRC-002")!;
    expect(publicScreen.gate).toBe("W0");
    expect(specialist.gate).toBe("W3");
    expect(evaluateIAAccess(publicScreen, ANON)).toBe("PUBLIC");
    expect(evaluateIAAccess(specialist, ANON)).toBe("SESSION_REQUIRED");
    expect(evaluateIAAccess(specialist, OPERATOR)).toBe("AUTHENTICATED");
  });

  it("answers an anonymous gated request with 401 and no screen content", () => {
    const rendered = render("/broadcast/broadcast-service-registry");
    expect(rendered.status).toBe(401);
    expect(rendered.html).toContain("Sign in to open this screen");
    expect(rendered.html).toContain("/sign-in?returnUrl=");
    // The denial page may state the gate; it must not carry the screen's contract.
    expect(rendered.html).not.toContain(getIAScreen("BRC-002")!.acceptanceId);
  });

  it("renders the scoped surface to an authenticated session as source-not-connected", () => {
    const rendered = render("/broadcast/broadcast-service-registry", OPERATOR);
    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain("Source not connected");
    expect(rendered.html).toContain(getIAScreen("BRC-002")!.acceptanceId);
  });

  it("keeps every gated route reachable as either 401 or a rendered contract", () => {
    for (const path of [
      "/broadcast/broadcast-operations-home",
      "/rights",
      "/finance",
      "/academy",
    ]) {
      const match = resolveIARoute(path);
      if (!match) continue;
      expect(match.screen.gate).not.toBe("W0");
      expect(render(path).status).toBe(401);
      expect(render(path, OPERATOR).status).toBe(200);
    }
  });
});

describe("PUB journey truthfulness", () => {
  it("renders no fabricated counts, dates or carriage numbers in J01 page bodies", () => {
    for (const screen of PUB_ROUTED) {
      const body = renderIAPublicBody(screen, context(screen.route));
      expect(body, `${screen.id} has no bespoke body`).toBeDefined();
      expect(body!).not.toMatch(/DTT Ch\.\s*\d/);
      expect(body!).not.toMatch(/DTH Ch\.\s*\d/);
      expect(body!).not.toMatch(/\bN(0|[1-9]\d?)\b viewers/);
      expect(body!).not.toMatch(/\b(19|20)\d{2}-\d{2}-\d{2}\b/);
    }
  });

  it("discloses unconnected sources instead of showing a zero", () => {
    for (const id of ["PUB-004", "PUB-007", "PUB-010", "PUB-019"]) {
      const screen = getIAScreen(id)!;
      const body = renderIAPublicBody(screen, context(screen.route))!;
      expect(body).toContain("Source not connected");
    }
  });

  it("never renders a private workspace link inside a public page body", () => {
    for (const screen of PUB_ROUTED) {
      // The sitemap publishes inventory routes verbatim, including the one W0
      // route that lives under /workspace; it is checked by its gate above.
      if (screen.id === "PUB-020") continue;
      const body = renderIAPublicBody(screen, context(screen.route))!;
      expect(body).not.toContain("/workspace");
      expect(body).not.toContain("vmnl_session");
    }
  });
});
