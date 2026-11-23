/**
 * Unit verification for bespoke specialist bodies in IA gated journeys:
 * - FIN (Finance & Commercial Performance - 24 routed screens)
 * - BRC (Broadcast Operations & Playout - 17 routed screens)
 */

import { describe, expect, it } from "vitest";
import { escapeHtml } from "../../src/web/components/index.js";
import { renderFinBody } from "../../src/web/ia/journey-fin.js";
import { renderBrcBody } from "../../src/web/ia/journey-brc.js";
import { renderCltBody } from "../../src/web/ia/journey-clt.js";
import { renderPartBody } from "../../src/web/ia/journey-part.js";
import { renderLearnBody } from "../../src/web/ia/journey-learn.js";
import { getIAScreen, IA_JOURNEYS } from "../../src/web/ia/index.js";
import type { IAGatedPageContext } from "../../src/web/ia/gated-parts.js";
import type { SessionUser } from "../../src/core/auth/index.js";

const DUMMY_USER: SessionUser = {
  userId: "u-fin",
  personId: "p-fin",
  email: "specialist@vmnl.ng",
  roles: ["FinanceController", "BroadcastDirector"],
};

const DUMMY_CTX: IAGatedPageContext = {
  user: DUMMY_USER,
  params: {},
  query: new URLSearchParams(),
  pathname: "/finance",
};

describe("IA Specialist Journey: FIN (Finance)", () => {
  const finJourney = IA_JOURNEYS.find((j) => j.code === "FIN");
  expect(finJourney).toBeDefined();

  const routedScreens = finJourney!.screens.filter((s) => s.routeKind === "ROUTED");

  it("renders bespoke specialist bodies for all routed FIN screens", () => {
    expect(routedScreens.length).toBe(24);

    for (const screen of routedScreens) {
      const rendered = renderFinBody(screen, DUMMY_CTX);
      expect(rendered, `${screen.id} must have a bespoke body`).toBeDefined();
      expect(rendered).toContain(escapeHtml(screen.screenName));
    }
  });

  it("FIN-001 surfaces the 7-way financial separation pillars and Law 7 isolation", () => {
    const fin001 = getIAScreen("FIN-001")!;
    const body = renderFinBody(fin001, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("7-Way Financial Separation");
    expect(body).toContain("Contract Value");
    expect(body).toContain("Gross Merchandise Value");
    expect(body).toContain("Invoiced Revenue");
    expect(body).toContain("Recognized Revenue");
    expect(body).toContain("Cash Collections");
    expect(body).toContain("Talent Payables");
    expect(body).toContain("Partner Splits");
    expect(body).toContain("Internal Unit Allocations");
    expect(body).toContain("Canonical Law 7 Active");
  });

  it("FIN-013 surfaces the 13-week cash outlook and liquidity buffer", () => {
    const fin013 = getIAScreen("FIN-013")!;
    const body = renderFinBody(fin013, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("13-Week");
    expect(body).toContain("Cash Buffer Invariant");
  });

  it("FIN-005 surfaces enforceable financial obligations", () => {
    const fin005 = getIAScreen("FIN-005")!;
    const body = renderFinBody(fin005, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Financial Commitments &amp; Enforceable Obligations");
  });

  it("returns undefined for non-FIN screens", () => {
    const brc001 = getIAScreen("BRC-001")!;
    expect(renderFinBody(brc001, DUMMY_CTX)).toBeUndefined();
  });
});

describe("IA Specialist Journey: BRC (Broadcast Operations)", () => {
  const brcJourney = IA_JOURNEYS.find((j) => j.code === "BRC");
  expect(brcJourney).toBeDefined();

  const routedScreens = brcJourney!.screens.filter((s) => s.routeKind === "ROUTED");

  it("renders bespoke specialist bodies for all routed BRC screens", () => {
    for (const screen of routedScreens) {
      const rendered = renderBrcBody(screen, DUMMY_CTX);
      expect(rendered, `${screen.id} must have a bespoke body`).toBeDefined();
      expect(rendered).toContain(escapeHtml(screen.screenName));
    }
  });

  it("BRC-001 surfaces primary and secondary linear channel status", () => {
    const brc001 = getIAScreen("BRC-001")!;
    const body = renderBrcBody(brc001, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("TEN Root");
    expect(body).toContain("TEN Urban");
    expect(body).toContain("StarTimes DTT");
  });

  it("BRC-004 surfaces the 24/7 daypart structure and rate multipliers", () => {
    const brc004 = getIAScreen("BRC-004")!;
    const body = renderBrcBody(brc004, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Prime Time (16:00 – 23:00)");
    expect(body).toContain("Rate Multiplier 2.5x");
  });

  it("BRC-009 enforces Canonical Law 8 rights preflight checks", () => {
    const brc009 = getIAScreen("BRC-009")!;
    const body = renderBrcBody(brc009, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Canonical Law 8");
    expect(body).toContain("No Un-Cleared Content on Air");
  });

  it("returns undefined for non-BRC screens", () => {
    const fin001 = getIAScreen("FIN-001")!;
    expect(renderBrcBody(fin001, DUMMY_CTX)).toBeUndefined();
  });
});

describe("IA Specialist Journey: CLT (Client Commissioning & Delivery)", () => {
  it("renders CLT-001 with client scoping and commissioning portfolio", () => {
    const clt001 = getIAScreen("CLT-001")!;
    const body = renderCltBody(clt001, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Client Engagement &amp; Commissioning Portfolio");
    expect(body).toContain(DUMMY_USER.email);
  });

  it("renders CLT-011 deliverable review with controlled decision invariants", () => {
    const clt011 = getIAScreen("CLT-011")!;
    const body = renderCltBody(clt011, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Controlled Decision Rule");
    expect(body).toContain("NBC Technical Standards");
  });

  it("renders CLT-016 tax invoice with 3-way reconciliation proof-of-air binding", () => {
    const clt016 = getIAScreen("CLT-016")!;
    const body = renderCltBody(clt016, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Proof-of-Performance Binding");
    expect(body).toContain("Proof-of-Air Certificates");
  });

  it("returns undefined for non-CLT screens", () => {
    const brc001 = getIAScreen("BRC-001")!;
    expect(renderCltBody(brc001, DUMMY_CTX)).toBeUndefined();
  });
});

describe("IA Specialist Journey: PART (Institutional Partnerships & Sponsors)", () => {
  it("renders PART-001 with institutional workspace and sponsor commitments", () => {
    const part001 = getIAScreen("PART-001")!;
    const body = renderPartBody(part001, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Institutional Partnerships &amp; Sponsorship Hub");
    expect(body).toContain(DUMMY_USER.email);
  });

  it("renders PART-009 with playout binding invariants and sting assets", () => {
    const part009 = getIAScreen("PART-009")!;
    const body = renderPartBody(part009, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Playout Binding Invariant");
    expect(body).toContain("validateSponsorBinding");
  });

  it("returns undefined for non-PART screens", () => {
    const clt001 = getIAScreen("CLT-001")!;
    expect(renderPartBody(clt001, DUMMY_CTX)).toBeUndefined();
  });
});

describe("IA Specialist Journey: LEARN (Creative Academy & Competency)", () => {
  it("renders LEARN-001 discovery catalog with professional creative tracks", () => {
    const learn001 = getIAScreen("LEARN-001")!;
    const body = renderLearnBody(learn001, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("African Creative Academy (AFCA) Professional Programmes");
    expect(body).toContain("Advanced Digital Cinematography");
  });

  it("renders LEARN-002 application overview with no-auto-admission rule", () => {
    const learn002 = getIAScreen("LEARN-002")!;
    const body = renderLearnBody(learn002, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Admission Invariant: No Auto-Admission");
  });

  it("renders LEARN-009 learner dashboard with verifiable credentials and rubrics", () => {
    const learn009 = getIAScreen("LEARN-009")!;
    const body = renderLearnBody(learn009, DUMMY_CTX);
    expect(body).toBeDefined();
    expect(body).toContain("Learner Academic Portal &amp; Competency Progression");
    expect(body).toContain(DUMMY_USER.email);
  });

  it("returns undefined for non-LEARN screens", () => {
    const part001 = getIAScreen("PART-001")!;
    expect(renderLearnBody(part001, DUMMY_CTX)).toBeUndefined();
  });
});
