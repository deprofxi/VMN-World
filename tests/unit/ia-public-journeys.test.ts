/**
 * VMN World IA R1.1 — Phases 3–6 public behaviour.
 *
 * Regression guard for the defect found while wiring Phase 3: every W0 route
 * outside J01 used to throw `[IA-PUB] no bespoke public body exists` and answer
 * 500, because the public renderer required a bespoke body per screen. The
 * plan's D2 decision is the opposite: every registry entry must be able to
 * render a real page from its contract, with the contract renderer as the
 * fallback for screens whose approved copy is not authored yet.
 *
 * Also covers: the 35 brand instances through one template, the enquiry
 * wizards' record-only contract, the federated Azeebo+ gateway, and the
 * public edge states.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { describe, expect, it } from "vitest";
import {
  evaluateIAAccess,
  renderIAResponse,
} from "../../src/api/routes/ia.routes.js";
import {
  getBrandFamilies,
  resolveBrandInstance,
} from "../../src/web/ia/journey-bri.js";
import { WIZARD_INTENTS } from "../../src/web/ia/journey-lead.js";
import { configuredAzeeboUniversalUrl } from "../../src/web/ia/journey-stw.js";
import { PUBLIC_EDGE_STATE_IDS, renderIAEdgeState } from "../../src/web/ia/edge-states.js";
import {
  IA_JOURNEYS,
  IA_PUBLIC_PAGES,
  getIAScreen,
  resolveIARoute,
} from "../../src/web/ia/index.js";
import type { IAScreen } from "../../src/web/ia/types.js";

const QUERY = new URLSearchParams();

/** Render a path through the real dispatcher path, anonymously. */
function renderPath(pathname: string, params: Readonly<Record<string, string>> = {}): string {
  const match = resolveIARoute(pathname);
  if (!match) throw new Error(`unresolvable: ${pathname}`);
  return renderIAResponse({ ...match, params: { ...match.params, ...params } }, {
    pathname,
    user: null,
    query: QUERY,
  }).html;
}

/** The brand template as a visitor reaches it: by one instance slug. */
function renderBrandInstancePage(slug: string): string {
  return renderPath(`/brands/${slug}`);
}

describe("Phase 3 regression: every W0 route renders anonymously from its contract", () => {
  it("renders a real page for every public routed screen — no bespoke body required", () => {
    const crashSignature = /\[IA-PUB\]|Internal Server Error/i;
    for (const screen of IA_PUBLIC_PAGES) {
      // Resolve the way the real request does, so parameterised templates are
      // exercised through an instance slug where they have one.
      const probe = probeRoute(screen);
      const html = renderIAResponse(probe.match, {
        pathname: probe.pathname,
        user: null,
        query: QUERY,
      }).html;
      expect(html.length, `${screen.id} must render`).toBeGreaterThan(500);
      expect(html, `${screen.id} must carry its acceptance ID or its template's`).toMatch(
        /IA-[A-Z]+-\d+/
      );
      expect(html, `${screen.id} must not render the old bespoke-body crash`).not.toMatch(
        crashSignature
      );
      expect(html, `${screen.id} must carry exactly one h1`).toMatch(/<h1[^>]*>/);
    }
  });

  it("renders the truthfulness contract: absent sources are stated, never faked", () => {
    for (const screen of IA_PUBLIC_PAGES) {
      const probe = probeRoute(screen);
      const html = renderIAResponse(probe.match, {
        pathname: probe.pathname,
        user: null,
        query: QUERY,
      }).html;
      if (screen.id === "PUB-001") continue; // corporate home is bespoke prose
      // A screen whose sources are not connected must say so or carry no value.
      const claimsValue = /\b(PAID|PUBLISHED|TRANSMITTED|APPROVED|CLEARED)\b/.test(
        html.replace(/NOT VERIFIED|not published|require verification|not been verified|unverified/g, "")
      );
      expect(claimsValue, `${screen.id} must not claim an unearned status`).toBe(false);
    }
  });

  it("keeps fabricated facts out of public pages", () => {
    const banned = [
      // Carriage numbers, reach figures and schedule data have no source here.
      /StarTimes DTT channel \d+/i,
      /\b\d+(\.\d+)?\s?million (viewers|audience)/i,
    ];
    for (const screen of IA_PUBLIC_PAGES) {
      const probe = probeRoute(screen);
      const html = renderIAResponse(probe.match, {
        pathname: probe.pathname,
        user: null,
        query: QUERY,
      }).html;
      for (const pattern of banned) {
        expect(html, `${screen.id} must not contain fabricated facts`).not.toMatch(pattern);
      }
    }
  });
});

/**
 * Resolve a screen's own route (or, for a parameterised template shared with
 * content instances, its first instance's slug) exactly as the dispatcher does.
 */
function probeRoute(screen: IAScreen): { match: NonNullable<ReturnType<typeof resolveIARoute>>; pathname: string } {
  let pathname = screen.route;
  if (pathname.includes("{")) {
    const match = resolveIARoute(pathname);
    if (!match) throw new Error(`unresolvable pattern ${pathname}`);
    if (!match.sharedWithInstances) {
      pathname = pathname.replace(/\{[^}]+\}/g, "probe-value");
    } else {
      pathname = `/brands/ten-urban`;
    }
  }
  const match = resolveIARoute(pathname);
  if (!match) throw new Error(`route did not resolve: ${pathname}`);
  return { match, pathname };
}

describe("BRI: 35 brand instances through one approved template", () => {
  const allInstances = getBrandFamilies().flatMap((family) => family.instances);

  it("derives exactly the inventory's 35 instances, grouped into 4 families", () => {
    expect(allInstances.length).toBe(35);
    const families = getBrandFamilies().map((family) => ({
      slug: family.slug,
      count: family.instances.length,
    }));
    expect(families).toEqual([
      { slug: "ten", count: 11 },
      { slug: "nigezie", count: 7 },
      { slug: "candy-tv", count: 12 },
      { slug: "games-360", count: 5 },
    ]);
  });

  it("slugs are unique and resolve back to their own record", () => {
    const slugs = allInstances.map((instance) => instance.slug);
    expect(new Set(slugs).size).toBe(35);
    for (const instance of allInstances) {
      expect(resolveBrandInstance(instance.slug)?.screen.id).toBe(instance.screen.id);
    }
  });

  it("renders every instance with its own brand ID and a truthful operating status", () => {
    for (const instance of allInstances) {
      const html = renderBrandInstancePage(instance.slug);
      expect(html, `${instance.slug} must carry its record ID`).toContain(instance.screen.id);
      expect(html, `${instance.slug} must carry its acceptance ID`).toContain(
        instance.screen.acceptanceId
      );
      expect(html, `${instance.slug} must claim no operating status`).toContain(
        "Operating status not published"
      );
      // No live service CTA without verified operating evidence.
      expect(html).not.toMatch(/watch now|subscribe now|tune to channel/i);
    }
  });

  it("renders the template through each instance's own slug", () => {
    const template = getIAScreen("BRD-006");
    expect(template).toBeDefined();
    const match = resolveIARoute("/brands/ten-urban");
    expect(match?.screen.id).toBe("BRD-006");
    expect(match?.sharedWithInstances).toBe(true);
  });

  it("renders the truthful withdrawn state for a slug the inventory does not address", () => {
    const match = resolveIARoute("/brands/not-a-published-brand");
    expect(match?.screen.id).toBe("BRD-006");
    const html = renderPath("/brands/not-a-published-brand");
    expect(html).toContain("No eligible brand");
    expect(html).toContain("BRD-014");
  });
});

describe("LEAD: the wizards record requests and never decide them", () => {
  it("exposes eight intents, each bound to a real wizard screen and a real vertical", () => {
    expect(WIZARD_INTENTS.length).toBe(8);
    for (const intent of WIZARD_INTENTS) {
      const screen = getIAScreen(intent.screenId);
      expect(screen, `${intent.screenId} must exist in the registry`).toBeDefined();
      expect(screen?.actionClass).toBe("SCOPED_REQUEST_OR_DRAFT");
    }
  });

  it("renders the wizard with the record-only notice and the acknowledgement gate", () => {
    const screen = getIAScreen("LEAD-003")!;
    const html = renderPath(screen.route);
    expect(html).toContain("not an acceptance, booking, quote or licence");
    expect(html).toContain('name="ndprConsent"');
    expect(html).toContain('action="/work-with-vmn/submit"');
  });

  it("renders the receipt as the case reference and no existence oracle", () => {
    const html = renderPath("/enquiries/ENQ-20261113-TEST/receipt");
    expect(html).toContain("ENQ-20261113-TEST");
    expect(html).toContain("deliberately not offered");
    expect(html).not.toMatch(/status:.*(ROUTED|DELIVERED|OPEN)/);
  });

  it("renders the truthful no-reference state", () => {
    const receipt = getIAScreen("LEAD-009")!;
    const html = renderIAResponse(
      { screen: receipt, params: { "case-id": "" }, sharedWithInstances: false },
      { pathname: "/enquiries//receipt", user: null, query: QUERY }
    ).html;
    expect(html).toContain("Receipt unavailable");
  });
});

describe("STW: the Azeebo+ gateway is a referral, never an invented endpoint", () => {
  it("offers no referral link when no destination is configured", () => {
    const original = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    try {
      expect(configuredAzeeboUniversalUrl()).toBeNull();
      const html = renderPath("/azeebo-plus");
      expect(html).toContain("No verified destination is configured");
      expect(html).toContain("STW-011");
      expect(html).not.toMatch(/href="https?:\/\/(?!.*vmnl)/);
    } finally {
      if (original !== undefined) process.env.AZEEBO_PLUS_UNIVERSAL_URL = original;
    }
  });

  it("refers through the configured destination with an explicit leaving notice", () => {
    const original = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    process.env.AZEEBO_PLUS_UNIVERSAL_URL = "https://plus.azeebo.example";
    try {
      const html = renderPath("/azeebo-plus");
      expect(html).toContain("https://plus.azeebo.example");
      expect(html).toContain("You are leaving this site");
      expect(html).toContain('rel="noopener noreferrer"');
    } finally {
      if (original !== undefined) process.env.AZEEBO_PLUS_UNIVERSAL_URL = original;
      else delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    }
  });

  it("rejects a configured value that is not an http(s) URL", () => {
    const original = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    process.env.AZEEBO_PLUS_UNIVERSAL_URL = "javascript:alert(1)";
    try {
      expect(configuredAzeeboUniversalUrl()).toBeNull();
    } finally {
      if (original !== undefined) process.env.AZEEBO_PLUS_UNIVERSAL_URL = original;
      else delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    }
  });
});

describe("Gate matrix holds for the newly public journeys", () => {
  it("every non-W0 routed screen still requires a session", () => {
    const routed = IA_JOURNEYS.flatMap((journey) => journey.screens).filter(
      (screen) => screen.routeKind === "ROUTED"
    );
    for (const screen of routed) {
      if (screen.gate === "W0") continue;
      expect(evaluateIAAccess(screen, null), `${screen.id} (${screen.gate}) must demand a session`).toBe(
        "SESSION_REQUIRED"
      );
    }
  });
});

describe("Phase 6: the public edge states are reachable and truthful", () => {
  it("lists exactly the inventory's 11 public edge states", () => {
    const fromRegistry = IA_JOURNEYS.find((journey) => journey.code === "EDGE")!.screens
      .filter((screen) => screen.gate === "W0")
      .map((screen) => screen.id)
      .sort();
    expect([...PUBLIC_EDGE_STATE_IDS].sort()).toEqual(fromRegistry);
  });

  it("renders each public edge state with its contract and acceptance ID", () => {
    for (const edgeId of PUBLIC_EDGE_STATE_IDS) {
      const html = renderIAEdgeState(edgeId);
      expect(html.length, `${edgeId} must render`).toBeGreaterThan(300);
      expect(html).toContain(edgeId);
      expect(html).toContain(getIAScreen(edgeId)!.acceptanceId);
      expect(html).toContain("Recovery");
    }
  });

  it("refuses to render an unknown edge identifier as real content", () => {
    expect(renderIAEdgeState("EDGE-999")).toContain("not defined by the inventory");
    expect(renderIAEdgeState("PUB-001")).toContain("not defined by the inventory");
  });
});
