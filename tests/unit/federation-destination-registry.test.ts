/**
 * TSK-35 — Azeebo+ destination registry hardening (report.md CA-15).
 *
 * Authority: PRD R1.2A §41, CLAUDE.md `<azeebo>` ("Never invent production
 * endpoints"), HX-13. Asserts business outcomes: what a destination may be
 * navigated to, and that the product never supplies a partner origin itself.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  registerDestination,
  verifyDestination,
  revokeDestination,
  deprecateDestination,
  blockDestination,
  isVerifiedDestination,
  listDestinations,
  resolveNavigationUrl,
  getConfiguredFederationOrigin,
  _resetDestinationsForTesting,
} from "../../src/core/federation/destinations.js";
import { AzeeboLinkGateway } from "../../src/modules/federation/azeebo/links.js";
import { _resetConfigForTesting } from "../../src/core/config/index.js";
import { renderAzeeboGatewayPageHtml } from "../../src/web/public/surface-a.js";
import { VMN_ENTERPRISE_PILLARS } from "../../src/web/public/corporate.js";

const ORIGIN = "https://partner.example.test";
const DEST = { id: "dest-nxtr", universe: "azeebo-plus", universalUrl: `${ORIGIN}/u/vmn-street-vibes`, registeredBy: "ops@vmnl.ng" };

// Pin the deployment origin for the whole file so no assertion depends on a
// developer's local .env; the fail-closed cases clear it explicitly.
const ORIGINAL_ORIGIN = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
beforeEach(() => {
  process.env.AZEEBO_PLUS_UNIVERSAL_URL = ORIGIN;
  _resetConfigForTesting();
});
afterAll(() => {
  if (ORIGINAL_ORIGIN === undefined) delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
  else process.env.AZEEBO_PLUS_UNIVERSAL_URL = ORIGINAL_ORIGIN;
  _resetConfigForTesting();
});

function useFederationOrigin(url: string | undefined) {
  const previous = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
  if (url === undefined) delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
  else process.env.AZEEBO_PLUS_UNIVERSAL_URL = url;
  _resetConfigForTesting();
  return () => {
    if (previous === undefined) delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    else process.env.AZEEBO_PLUS_UNIVERSAL_URL = previous;
    _resetConfigForTesting();
  };
}

describe("TSK-35: registration is not verification (PRD §41)", () => {
  beforeEach(() => _resetDestinationsForTesting());

  it("a newly registered destination is CANDIDATE and cannot be used as a publication gate", () => {
    const dest = registerDestination(DEST);
    expect(dest.status).toBe("CANDIDATE");
    expect(dest.verifiedAt).toBeUndefined();
    expect(isVerifiedDestination("dest-nxtr")).toBe(false);
    expect(resolveNavigationUrl("dest-nxtr").fallbackUsed).toBe(true);
  });

  it("only an explicit, named verification promotes a CANDIDATE to VERIFIED", () => {
    registerDestination(DEST);
    expect(() => verifyDestination("dest-nxtr", "")).toThrow(/DEST-05/);
    const verified = verifyDestination("dest-nxtr", "rights@vmnl.ng");
    expect(verified.status).toBe("VERIFIED");
    expect(verified.verifiedBy).toBe("rights@vmnl.ng");
    expect(verified.verifiedAt).toBeInstanceOf(Date);
    expect(isVerifiedDestination("dest-nxtr")).toBe(true);
    // Re-verification is not a state: a verified destination is already terminal
    // for the candidate transition.
    expect(() => verifyDestination("dest-nxtr", "again@vmnl.ng")).toThrow(/DEST-04/);
  });

  it("rejects non-https and relative origins before they can enter the registry", () => {
    registerDestination(DEST);
    expect(() => registerDestination({ ...DEST, id: "d2", universalUrl: "http://insecure.example" })).toThrow(/DEST-02/);
    expect(() => registerDestination({ ...DEST, id: "d3", universalUrl: "/relative/path" })).toThrow(/DEST-01/);
    expect(listDestinations().map((d) => d.id)).toEqual(["dest-nxtr"]);
  });
});

describe("TSK-35: full PRD §41 status set", () => {
  beforeEach(() => {
    _resetDestinationsForTesting();
    registerDestination(DEST);
    verifyDestination("dest-nxtr", "rights@vmnl.ng");
  });

  it.each([
    ["revoked", (id: string) => revokeDestination(id, "ops@vmnl.ng", "window ended")],
    ["deprecated", (id: string) => deprecateDestination(id, "ops@vmnl.ng", "superseded")],
    ["blocked", (id: string) => blockDestination(id, "ops@vmnl.ng", "partner incident")],
  ] as const)("%s destination is no longer navigable", (_name, transition) => {
    const dest = transition("dest-nxtr");
    expect(["REVOKED", "DEPRECATED", "BLOCKED"]).toContain(dest.status);
    expect(isVerifiedDestination("dest-nxtr")).toBe(false);
    expect(dest.statusReason).toBeTruthy();
  });

  it("a BLOCKED destination keeps its verification record for audit", () => {
    const before = listDestinations()[0];
    const verifiedAt = before.verifiedAt;
    const blocked = blockDestination("dest-nxtr", "ops@vmnl.ng", "partner incident");
    expect(blocked.verifiedAt).toBe(verifiedAt);
    expect(blocked.verifiedBy).toBe("rights@vmnl.ng");
    expect(blocked.status).toBe("BLOCKED");
  });

  it("status changes require a named operator", () => {
    expect(() => blockDestination("dest-nxtr", "")).toThrow(/DEST-06/);
    expect(() => revokeDestination("nope", "ops@vmnl.ng")).toThrow(/DEST-03/);
  });
});

describe("TSK-35: navigation resolution never invents an endpoint", () => {
  const originalRegistry = () => _resetDestinationsForTesting();
  beforeEach(originalRegistry);

  it("uses the verified destination and attaches attribution when campaign context is allowed", () => {
    registerDestination(DEST);
    verifyDestination("dest-nxtr", "rights@vmnl.ng");
    const nav = resolveNavigationUrl("dest-nxtr", { utm_source: "vmn_nxtr", utm_medium: "linear_qr" });
    expect(nav.fallbackUsed).toBe(false);
    expect(nav.url).toContain(`${ORIGIN}/u/vmn-street-vibes`);
    expect(nav.url).toContain("utm_source=vmn_nxtr");
  });

  it("suppresses campaign context when the destination forbids it", () => {
    registerDestination({ ...DEST, campaignContextAllowed: false });
    verifyDestination("dest-nxtr", "rights@vmnl.ng");
    const nav = resolveNavigationUrl("dest-nxtr", { utm_source: "vmn_nxtr" });
    expect(nav.url).not.toContain("utm_source");
  });

  it("falls back to the explicitly configured origin for an unusable destination", () => {
    const nav = resolveNavigationUrl("dest-unknown");
    expect(nav.fallbackUsed).toBe(true);
    expect(nav.url).toBe(ORIGIN);
  });

  it("fails closed with no origin configured — no guessed production domain is returned", () => {
    const restore = useFederationOrigin(undefined);
    try {
      expect(getConfiguredFederationOrigin()).toBeUndefined();
      expect(() => resolveNavigationUrl("dest-unknown")).toThrow(/DEST-07/);
    } finally {
      restore();
    }
  });
});

describe("TSK-35: link gateway requires an explicit partner origin", () => {
  const params = { universe: "VERTICAL" as const, contentId: "street-vibes-ep42", campaignId: "CMP-X" };

  it("an unconfigured gateway refuses to mint a universal link", () => {
    const gateway = new AzeeboLinkGateway();
    expect(gateway.isConfigured()).toBe(false);
    expect(() => gateway.createUniversalLink(params)).toThrow(/LINK-01/);
  });

  it("a configured gateway emits links from the configured origin only", () => {
    const gateway = new AzeeboLinkGateway({ universalBaseUrl: `${ORIGIN}/` });
    const link = gateway.createUniversalLink(params);
    expect(link.universalUrl.startsWith(`${ORIGIN}/u/vertical/`)).toBe(true);
    expect(link.universalUrl).not.toContain("azeebo.plus");
  });

  it("records no scan target for an unknown tracking id", () => {
    const gateway = new AzeeboLinkGateway({ universalBaseUrl: ORIGIN });
    const res = gateway.recordScan({ trackingId: "CORRUPTED", deviceType: "ANDROID", ipHashSha256: "hash", scannedAt: new Date() });
    expect(res.success).toBe(false);
    expect(res.targetUrl).toBeUndefined();
  });
});

describe("TSK-35 drill: federation failure cannot corrupt VMN canonical records", () => {
  beforeEach(() => {
    _resetDestinationsForTesting();
    delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    _resetConfigForTesting();
  });

  it("a failed destination transition leaves the registry record unchanged", () => {
    registerDestination(DEST);
    verifyDestination("dest-nxtr", "rights@vmnl.ng");
    const snapshot = { ...listDestinations()[0] };

    expect(() => verifyDestination("dest-nxtr", "second@vmnl.ng")).toThrow(/DEST-04/);
    expect(() => blockDestination("missing", "ops@vmnl.ng")).toThrow(/DEST-03/);
    expect(() => new AzeeboLinkGateway().createUniversalLink({ universe: "MOVIES", contentId: "m1", campaignId: "C" })).toThrow(/LINK-01/);

    const after = listDestinations()[0];
    expect(after).toEqual(snapshot);
    expect(after.status).toBe("VERIFIED");
    expect(after.verifiedBy).toBe("rights@vmnl.ng");
  });

  it("navigation failure is a thrown condition, never a silently rewritten destination", () => {
    registerDestination({ ...DEST, universalUrl: "https://partner.example.test" });
    // CANDIDATE: not usable, and the unconfigured fallback must not substitute a URL.
    expect(() => resolveNavigationUrl("dest-nxtr")).toThrow(/DEST-07/);
    expect(listDestinations()[0].universalUrl).toBe("https://partner.example.test");
  });
});

describe("TSK-35: public pages never supply a partner origin", () => {
  it("ships no outbound link to any domain while no origin is configured", () => {
    const restore = useFederationOrigin(undefined);
    try {
      const html = renderAzeeboGatewayPageHtml();
      expect(html).not.toMatch(/<a\s[^>]*href="https?:\/\//);
      expect(html).toContain("Outbound federation disabled");
    } finally {
      restore();
    }
  });

  it("links to the configured origin, verbatim and no other", () => {
    const restore = useFederationOrigin(`${ORIGIN}/`);
    try {
      const html = renderAzeeboGatewayPageHtml();
      expect(html).toContain(`href="${ORIGIN}"`);
      expect(html).not.toContain("Outbound federation disabled");
    } finally {
      restore();
    }
  });

  it("the corporate pillar routes through the internal information page", () => {
    const federated = VMN_ENTERPRISE_PILLARS.find((p) => p.name.startsWith("Azeebo+"));
    expect(federated?.route).toBe("/azeebo");
  });
});
