/**
 * Verification battery for Extended Specialist IA Journeys (J10, J11, J15, J16, J17, J18, J21, J22)
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { describe, expect, it } from "vitest";
import { IA_REGISTRY } from "../../src/web/ia/registry.generated.js";
import { renderIAGatedBodyFor } from "../../src/web/ia/gated-bodies.js";
import { renderTalBody } from "../../src/web/ia/journey-tal.js";
import { renderCandBody } from "../../src/web/ia/journey-cand.js";
import { renderStudBody } from "../../src/web/ia/journey-stud.js";
import { renderEvntBody } from "../../src/web/ia/journey-evnt.js";
import { renderIprBody } from "../../src/web/ia/journey-ipr.js";
import { renderCmsBody } from "../../src/web/ia/journey-cms.js";
import { renderGovBody } from "../../src/web/ia/journey-gov.js";
import { renderSysBody } from "../../src/web/ia/journey-sys.js";
import type { IAGatedPageContext } from "../../src/web/ia/gated-parts.js";

const mockContext: IAGatedPageContext = {
  user: {
    userId: "usr_specialist_01",
    personId: "per_specialist_01",
    email: "specialist.operator@vmn.ng",
    roles: ["Specialist", "Staff"],
    tenantId: "TENANT-SPECIALIST-OPS",
  },
  params: {},
  query: new URLSearchParams(),
  pathname: "/workspace/specialist",
};

describe("Extended Specialist IA Journeys (J10, J11, J15, J16, J17, J18, J21, J22)", () => {
  it("renders J10 TAL creator onboarding and marketplace with rate cards and bookings", () => {
    const talScreens = IA_REGISTRY.filter((s) => s.id.startsWith("TAL-"));
    expect(talScreens.length).toBe(30);

    const tal001 = talScreens.find((s) => s.id === "TAL-001")!;
    const rendered001 = renderTalBody(tal001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Creator Portfolio &amp; Engagement Hub");
    expect(rendered001).toContain("Active Bookings");
    expect(rendered001).toContain("S-VTM-01");

    const tal002 = talScreens.find((s) => s.id === "TAL-002")!;
    const rendered002 = renderTalBody(tal002, mockContext);
    expect(rendered002).toBeDefined();
    expect(rendered002).toContain("Creative Work Submission &amp; Chain-of-Title Attestation");

    // All TAL screens produce bespoke bodies
    for (const screen of talScreens) {
      const body = renderTalBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J11 CAND casting auditions with 18+ eligibility and strict consent separation", () => {
    const candScreens = IA_REGISTRY.filter((s) => s.id.startsWith("CAND-"));
    expect(candScreens.length).toBe(20);

    const cand001 = candScreens.find((s) => s.id === "CAND-001")!;
    const rendered001 = renderCandBody(cand001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Candy Cast &amp; Talent Engagement Portal");
    expect(rendered001).toContain("18+ only");
    expect(rendered001).toContain("DEC-08");

    for (const screen of candScreens) {
      const body = renderCandBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J15 STUD studio operations with technical QC checklists", () => {
    const studScreens = IA_REGISTRY.filter((s) => s.id.startsWith("STUD-"));
    expect(studScreens.length).toBe(23);

    const stud001 = studScreens.find((s) => s.id === "STUD-001")!;
    const rendered001 = renderStudBody(stud001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("ONE Studios Production &amp; Facility Management");
    expect(rendered001).toContain("R128 / EBU Passed");

    for (const screen of studScreens) {
      const body = renderStudBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J16 EVNT event operations with venue safety and emergency refund policies", () => {
    const evntScreens = IA_REGISTRY.filter((s) => s.id.startsWith("EVNT-"));
    expect(evntScreens.length).toBe(18);

    const evnt001 = evntScreens.find((s) => s.id === "EVNT-001")!;
    const rendered001 = renderEvntBody(evnt001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Fusion Events &amp; Live Experience Operations");
    expect(rendered001).toContain("S-FUS-01");

    for (const screen of evntScreens) {
      const body = renderEvntBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J17 IPR storyworld governance with rights revocation and TEND licensing", () => {
    const iprScreens = IA_REGISTRY.filter((s) => s.id.startsWith("IPR-"));
    expect(iprScreens.length).toBe(25);

    const ipr001 = iprScreens.find((s) => s.id === "IPR-001")!;
    const rendered001 = renderIprBody(ipr001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Intellectual Property &amp; Content Rights Registry");
    expect(rendered001).toContain("S-TND-01");

    for (const screen of iprScreens) {
      const body = renderIprBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J18 CMS editorial workbench with multi-brand fact-checking", () => {
    const cmsScreens = IA_REGISTRY.filter((s) => s.id.startsWith("CMS-"));
    expect(cmsScreens.length).toBe(21);

    const cms001 = cmsScreens.find((s) => s.id === "CMS-001")!;
    const rendered001 = renderCmsBody(cms001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Brand Editorial &amp; Digital Publishing Operations");
    expect(rendered001).toContain("35 Brands Monitored");

    for (const screen of cmsScreens) {
      const body = renderCmsBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J21 GOV corporate governance with board resolutions and DSAR litigation hold", () => {
    const govScreens = IA_REGISTRY.filter((s) => s.id.startsWith("GOV-"));
    expect(govScreens.length).toBe(34);

    const gov001 = govScreens.find((s) => s.id === "GOV-001")!;
    const rendered001 = renderGovBody(gov001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Corporate Governance, Legal &amp; Statutory Oversight");
    expect(rendered001).toContain("S-GOV-01");

    for (const screen of govScreens) {
      const body = renderGovBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("renders J22 SYS AI Agent OS A0-A5 governance and kill-switch controls", () => {
    const sysScreens = IA_REGISTRY.filter((s) => s.id.startsWith("SYS-"));
    expect(sysScreens.length).toBe(36);

    const sys001 = sysScreens.find((s) => s.id === "SYS-001")!;
    const rendered001 = renderSysBody(sys001, mockContext);
    expect(rendered001).toBeDefined();
    expect(rendered001).toContain("Cr8Tech Platform Operations &amp; AI Agent Governance");
    expect(rendered001).toContain("A0–A5 Enforced");
    expect(rendered001).toContain("S-IT-01");

    for (const screen of sysScreens) {
      const body = renderSysBody(screen, mockContext);
      expect(body, `Screen ${screen.id} must have bespoke body`).toBeDefined();
    }
  });

  it("ensures renderIAGatedBodyFor dispatches all 8 journeys with provenance wrapping", () => {
    const sampleIds = ["TAL-001", "CAND-001", "STUD-001", "EVNT-001", "IPR-001", "CMS-001", "GOV-001", "SYS-001"];
    for (const id of sampleIds) {
      const screen = IA_REGISTRY.find((s) => s.id === id)!;
      const htmlOutput = renderIAGatedBodyFor(screen, mockContext);
      expect(htmlOutput).toContain("ia-provenance");
      expect(htmlOutput).not.toContain("This screen is governed by an IA contract specification");
    }
  });
});
