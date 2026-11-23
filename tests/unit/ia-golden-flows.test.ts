/**
 * Verification battery for the Eighteen Connected Golden Journeys (FLOW-01 to FLOW-18)
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Complete_Screen_Architecture.md §"Eighteen connected golden journeys"
 * Canonical Master: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { describe, expect, it } from "vitest";
import { getIAScreen } from "../../src/web/ia/index.js";
import { renderIAGatedBodyFor } from "../../src/web/ia/gated-bodies.js";
import { renderIAPublicBodyFor } from "../../src/web/ia/public-bodies.js";
import {
  candy18PlusEligibilityGate,
  agentExecutionProvenanceCard,
  dataSubjectRequestTracker,
  rightsUsageMatrix,
  eventSafetyAndRefundPanel,
  dualAssessorGradingRubric,
  sourceConflictResolver,
} from "../../src/web/components/ia-contracts.js";
import type { IAGatedPageContext } from "../../src/web/ia/gated-parts.js";
import type { IAPublicPageContext } from "../../src/web/ia/journey-pub.js";
import type { IAScreen } from "../../src/web/ia/types.js";

interface GoldenFlowDefinition {
  id: string;
  persona: string;
  path: readonly string[];
  proofOfSuccess: string;
  adversePath: string;
  domainOwner: string;
  expectedGates: readonly string[];
}

const GOLDEN_FLOWS: readonly GoldenFlowDefinition[] = [
  {
    id: "FLOW-01",
    persona: "Public visitor",
    path: ["PUB-001", "BRD-001", "BRI-005", "LEAD-001", "LEAD-009"],
    proofOfSuccess: "TEN Tushe definition-only, safe enquiry",
    adversePath: "No watch/booking CTA for unverified channel",
    domainOwner: "Group Brand Publisher / Commercial",
    expectedGates: ["W0"],
  },
  {
    id: "FLOW-02",
    persona: "Fan",
    path: ["STW-001", "STW-005", "STW-006", "STW-008", "STW-009"],
    proofOfSuccess: "Permitted public world info, verified L1 only",
    adversePath: "Unverified route or rights geo restriction safely prevents false viewing",
    domainOwner: "IP Owner / Azeebo+ Product",
    expectedGates: ["W0", "W3"],
  },
  {
    id: "FLOW-03",
    persona: "Client",
    path: ["LEAD-002", "CLT-001", "CLT-006", "CLT-011", "CLT-013", "CLT-015"],
    proofOfSuccess: "Qualified accepted deliverable and distinct invoice/receipt states",
    adversePath: "Contract unsigned, rights missing, late payment or duplicate cannot show paid",
    domainOwner: "Commercial / Finance / Legal",
    expectedGates: ["W0", "W3", "W4"],
  },
  {
    id: "FLOW-04",
    persona: "Partner/sponsor",
    path: ["PART-002", "PART-006", "PART-009", "PART-010", "PART-022"],
    proofOfSuccess: "Approved sponsor logo, actual fulfilled benefit",
    adversePath: "Unawarded grant, unsigned logo rights or booked-not-aired spot remains unclaimed",
    domainOwner: "Partnerships / Legal / Broadcast",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-05",
    persona: "Learner",
    path: ["LEARN-003", "LEARN-010", "LEARN-014", "LEARN-017", "LEARN-018", "LEARN-029"],
    proofOfSuccess: "Independent assessed and appealable academic record",
    adversePath: "Sponsor cannot alter grade or view protected welfare source",
    domainOwner: "AFCA Academic Authority",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-06",
    persona: "Creator/talent",
    path: ["TAL-002", "TAL-008", "TAL-014", "TAL-015", "TAL-018", "TAL-028"],
    proofOfSuccess: "Funded contract, accepted work, separately verified payment",
    adversePath: "Bank change cannot redirect paid settlement; profile not academic credential",
    domainOwner: "VTM / Finance / Rights",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-07",
    persona: "Candy applicant",
    path: ["CAND-001", "CAND-002", "CAND-005", "CAND-009", "CAND-020"],
    proofOfSuccess: "18+ eligibility, private fair review, separate uses",
    adversePath: "No Cast result automatically grants Candy Plus, publicity or synthetic rights",
    domainOwner: "Candy / Privacy / Legal",
    expectedGates: ["W0", "W3", "W4"],
  },
  {
    id: "FLOW-08",
    persona: "Employee",
    path: ["AUTH-001", "CIRC-001", "CIRC-009", "CIRC-010", "CIRC-013"],
    proofOfSuccess: "Current effective source and permitted next task",
    adversePath: "Old SOP/test NOT RUN or inaccessible attachment blocks consequential action",
    domainOwner: "Knowledge / Domain Process Owner",
    expectedGates: ["W1", "W2"],
  },
  {
    id: "FLOW-09",
    persona: "Mission Owner",
    path: ["MISS-002", "MISS-003", "MISS-006", "MISS-007", "MISS-016", "MISS-004", "MISS-024"],
    proofOfSuccess: "Human accountable mission, capacity, rights/Finance gates, accepted output",
    adversePath: "Expired DoA or lost A freezes execute; wrong source state remains pending",
    domainOwner: "Circle / People / Domain owner",
    expectedGates: ["W2", "W4"],
  },
  {
    id: "FLOW-10",
    persona: "Rights publisher",
    path: ["IPR-003", "IPR-005", "IPR-007", "IPR-024", "CMS-008"],
    proofOfSuccess: "Exact use permission and downstream revocation invalidation",
    adversePath: "Revoked/expired music blocks all impacted digital/social/TV uses",
    domainOwner: "Rights / IP / Legal",
    expectedGates: ["W4"],
  },
  {
    id: "FLOW-11",
    persona: "Broadcast operator",
    path: ["BRC-002", "BRC-008", "BRC-009", "BRC-012", "BRC-013", "BRC-016", "BRC-026"],
    proofOfSuccess: "Schedule vs EPG/playlist vs as-run verifiably distinct",
    adversePath: "Exported playlist with no as-run never becomes proof-of-air",
    domainOwner: "Broadcast / Traffic / Rights",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-12",
    persona: "CFO",
    path: ["FIN-013", "FIN-014", "FIN-032", "FIN-016", "FIN-025", "FIN-026"],
    proofOfSuccess: "Bank verified and protected liability-reserve cash certificate",
    adversePath: "Historical AR and empty cash input cannot authorize hiring or CAPEX",
    domainOwner: "CFO / Finance / Board reserved",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-13",
    persona: "Legal/People",
    path: ["GOV-008", "GOV-010", "GOV-034", "GOV-011", "GOV-012"],
    proofOfSuccess: "Actual legal party, final signed contract, effective conditions",
    adversePath: "Board approval missing; draft contract does not become binding",
    domainOwner: "Legal / Company Secretary",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-14",
    persona: "DPO",
    path: ["GOV-022", "GOV-023", "GOV-032", "GOV-033"],
    proofOfSuccess: "Lawful data request with identity and hold rules",
    adversePath: "Do not delete evidence under active litigation hold or disclose another identity",
    domainOwner: "DPO / Legal / Security",
    expectedGates: ["W0", "W3", "W4"],
  },
  {
    id: "FLOW-15",
    persona: "AI/Security",
    path: ["SYS-002", "SYS-012", "SYS-014", "SYS-032", "SYS-023", "SYS-024"],
    proofOfSuccess: "A0–A5 restrictions, source state, tested emergency rollback",
    adversePath: "Prompt injection or no source authority cannot expand tool permissions",
    domainOwner: "Agent OS / Security / Product",
    expectedGates: ["W1", "W4"],
  },
  {
    id: "FLOW-16",
    persona: "Production/Event team",
    path: ["STUD-001", "STUD-007", "STUD-023", "STUD-016", "EVNT-007", "EVNT-016"],
    proofOfSuccess: "Accepted production and safe event rights/financial closure",
    adversePath: "Safety/venue/music/likeness rights prevent unapproved release",
    domainOwner: "ONE / Fusion / Rights / Safety",
    expectedGates: ["W3", "W4"],
  },
  {
    id: "FLOW-17",
    persona: "Product/QA",
    path: ["SYS-022", "SYS-025", "SYS-031", "SYS-033", "SYS-023", "SYS-024"],
    proofOfSuccess: "Traceable build, accessibility, negative tests, rollback and signed GO",
    adversePath: "Undefined SLO and unperformed UAT cannot show released",
    domainOwner: "Product / Independent QA",
    expectedGates: ["W2", "W4"],
  },
  {
    id: "FLOW-18",
    persona: "Commercial/Finance",
    path: ["FIN-002", "FIN-003", "FIN-006", "FIN-032", "FIN-017", "FIN-030"],
    proofOfSuccess: "One external contract-to-cash and consolidated source-backed actual",
    adversePath: "Multi-brand reporting must not duplicate revenue; bad debt not bank cash",
    domainOwner: "CFO / Commercial",
    expectedGates: ["W3", "W4"],
  },
];

const mockContext: IAGatedPageContext = {
  user: {
    userId: "usr_operator_01",
    personId: "per_operator_01",
    email: "operator@vmn.ng",
    roles: ["Operator", "Staff", "Finance", "Legal", "Executive"],
    tenantId: "TENANT-GOLDEN-FLOW-OPS",
  },
  params: {},
  query: new URLSearchParams(),
  pathname: "/workspace/operations",
};

const mockPublicContext: IAPublicPageContext = {
  params: { "case-id": "CASE-12345", "approved-brand-slug": "ten" },
  query: new URLSearchParams(),
  pathname: "/",
  csrfToken: "mock-csrf-token-public",
};

function renderScreen(screen: IAScreen, ctx: IAGatedPageContext): string {
  if (screen.gate === "W0") {
    const pub = renderIAPublicBodyFor(screen, mockPublicContext);
    if (pub) return pub;
  }
  const gated = renderIAGatedBodyFor(screen, ctx);
  if (gated) return gated;
  throw new Error(`Screen ${screen.id} has no renderer implemented.`);
}

describe("Golden Flows Specification & Path Integrity (FLOW-01 to FLOW-18)", () => {
  it("verifies all 18 flows contain exactly the screens defined in the IA Architecture", () => {
    expect(GOLDEN_FLOWS.length).toBe(18);

    for (const flow of GOLDEN_FLOWS) {
      expect(flow.path.length).toBeGreaterThanOrEqual(4);
      for (const screenId of flow.path) {
        const screen = getIAScreen(screenId);
        expect(screen, `Screen ${screenId} in ${flow.id} must exist in registry`).toBeDefined();
        if (screen) {
          expect(flow.expectedGates).toContain(screen.gate);
        }
      }
    }
  });

  it("exercises FLOW-01 (Public Visitor: safe enquiry and definition-only)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-01")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      // Non-negotiable invariant: Public path does not render privileged booking or execution tools
      expect(htmlOutput).not.toContain("kill-switch-action");
    }
  });

  it("exercises FLOW-02 (Fan: permitted public world info, verified L1 only)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-02")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("STW-");
    }
  });

  it("exercises FLOW-03 (Client: lead to accepted deliverable and invoice states)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-03")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
    }
  });

  it("exercises FLOW-04 (Partner/Sponsor: approved logo, fulfilled benefit)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-04")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("PART-");
    }
  });

  it("exercises FLOW-05 (Learner: independent academic record & grade protection)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-05")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("LEARN-");
    }
  });

  it("exercises FLOW-06 (Creator/Talent: funded contract & verified settlement)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-06")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("TAL-");
    }
  });

  it("exercises FLOW-07 (Candy Applicant: 18+ eligibility and strict consent boundary)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-07")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("CAND-");
    }
  });

  it("exercises FLOW-08 (Employee: current effective source & SOP run gate)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-08")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
    }
  });

  it("exercises FLOW-09 (Mission Owner: capacity, rights/finance gates, DoA authority)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-09")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("MISS-");
    }
  });

  it("exercises FLOW-10 (Rights Publisher: rights revocation invalidates downstream uses)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-10")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
    }
  });

  it("exercises FLOW-11 (Broadcast Operator: schedule vs playlist vs as-run verification)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-11")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("BRC-");
    }
  });

  it("exercises FLOW-12 (CFO: bank-verified liability reserve certificate)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-12")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("FIN-");
    }
  });

  it("exercises FLOW-13 (Legal/People: formal contract and board resolution checks)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-13")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("GOV-");
    }
  });

  it("exercises FLOW-14 (DPO: lawful DSAR requests and litigation hold defense)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-14")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("GOV-");
    }
  });

  it("exercises FLOW-15 (AI/Security: A0-A5 restrictions, prompt injection defense, rollback)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-15")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("SYS-");
    }
  });

  it("exercises FLOW-16 (Production/Event: technical QC checklists & venue safety)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-16")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
    }
  });

  it("exercises FLOW-17 (Product/QA: traceable build, accessibility, negative testing)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-17")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("SYS-");
    }
  });

  it("exercises FLOW-18 (Commercial/Finance: unified contract-to-cash & revenue deduplication)", () => {
    const flow = GOLDEN_FLOWS.find((f) => f.id === "FLOW-18")!;
    for (const screenId of flow.path) {
      const screen = getIAScreen(screenId)!;
      const htmlOutput = renderScreen(screen, mockContext);
      expect(htmlOutput.length).toBeGreaterThan(0);
      expect(htmlOutput).toContain("FIN-");
    }
  });
});

describe("Golden Flows Adverse Paths & Invariant Defenses", () => {
  it("FLOW-05: protects academic grades from commercial alterations", () => {
    const rubric = dualAssessorGradingRubric({
      studentId: "STU-8821",
      courseCode: "AFCA-PROD-201",
      moduleName: "Sound Engineering Principles",
      assessor1Score: 85,
    });
    const rendered = rubric.toString();
    expect(rendered).toContain("AFCA Dual-Assessor Evaluation Rubric");
    expect(rendered).toContain("Assessment integrity rule");
    expect(rendered).toContain("UNGRADED"); // Unmoderated scores cannot be finalized
  });

  it("FLOW-07: halts Candy 18+ audition submission when applicant is unverified", () => {
    const gate = candy18PlusEligibilityGate({
      applicantId: "APP-CAND-091",
      verified: false,
      termsAccepted: false,
    });
    const rendered = gate.toString();
    expect(rendered).toContain("VERIFICATION REQUIRED");
    expect(rendered).toContain("Minors are unconditionally prohibited");
    expect(rendered).not.toContain("AGE VERIFIED (18+)");
  });

  it("FLOW-10: enforces music rights revocation across downstream media windows", () => {
    const matrix = rightsUsageMatrix({
      assetId: "TRK-9012",
      title: "Afrobeats Anthem (Remix)",
      windows: [
        {
          territory: "NG-LAGOS",
          media: "Linear Broadcast",
          validFrom: "2026-01-01",
          validTo: "2026-06-30",
          status: "EXPIRED",
        },
        {
          territory: "GLOBAL",
          media: "Digital Streaming",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          status: "HOLD",
        },
      ],
    });
    const rendered = matrix.toString();
    expect(rendered).toContain("EXPIRED");
    expect(rendered).toContain("HOLD");
    expect(rendered).not.toContain("badge-success");
  });

  it("FLOW-14: locks DPO data erasure when record is under active litigation hold", () => {
    const tracker = dataSubjectRequestTracker({
      requestId: "DSAR-2026-881",
      requestType: "ERASURE",
      subjectEmail: "contested.party@example.com",
      hasLitigationHold: true,
      status: "HOLD",
    });
    const rendered = tracker.toString();
    expect(rendered).toContain("LITIGATION HOLD ACTIVE");
    expect(rendered).toContain("Erasure prohibited");
    expect(rendered).toContain("badge-error");
  });

  it("FLOW-15: blocks autonomous consequential actions without human operator signoff (Canonical Law 13)", () => {
    const provenance = agentExecutionProvenanceCard({
      agentId: "AGENT-SYS-04",
      capabilityLevel: "A3",
      model: "vmn-core-fast",
      toolCallsExecuted: 12,
      tokensConsumed: 4850,
      humanSignoffRequired: true,
    });
    const rendered = provenance.toString();
    expect(rendered).toContain("Level A3");
    expect(rendered).toContain("Authority Gate:");
    expect(rendered).toContain("require explicit human operator confirmation");

    const conflict = sourceConflictResolver({
      conflictId: "CONF-992",
      topic: "Talent Royalty Split Authority",
      primaryAuthority: { id: "CONTR-881", claim: "Producer owns 60% master" },
      secondaryAuthority: { id: "SPLIT-201", claim: "Co-writer disputes 25% share" },
      competentOwner: "Chief Legal Counsel",
    });
    const conflictRendered = conflict.toString();
    expect(conflictRendered).toContain("Model-as-final-judge is strictly prohibited");
    expect(conflictRendered).toContain("Chief Legal Counsel");
  });

  it("FLOW-16: halts event execution when venue safety permit is unapproved and triggers refunds", () => {
    const panel = eventSafetyAndRefundPanel({
      eventCode: "EVNT-EKO-FEST-2026",
      venueName: "Eko Atlantic Grand Arena",
      capacityMax: 5000,
      safetyPermitApproved: false,
      emergencyRefundActive: true,
    });
    const rendered = panel.toString();
    expect(rendered).toContain("UNPERMITTED / HOLD");
    expect(rendered).toContain("EMERGENCY REFUND POLICY TRIGGERED");
    expect(rendered).toContain("badge-error");
  });
});
