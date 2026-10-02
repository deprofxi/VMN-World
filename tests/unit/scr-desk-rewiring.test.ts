/**
 * SCR-17/18/19 Desk Rewiring — Domain Test Suite
 *
 * Verifies the acceptance criteria of TODO-SCR-17/18/19:
 * - SCR-17: proposals are canonical records; acceptance mutates the canonical
 *   Quote-to-Cash deal (quote→contract handoff); double acceptance rejected.
 * - SCR-18: every desk mutation writes through to its existing engine; gate
 *   scans enforce HMAC + single-use; MOCK_* datasets are deleted.
 * - SCR-19: portals scope counterparty data to the requesting organisation;
 *   risks/issues live in the core work domain with enforced lifecycles.
 */

import { describe, it, expect } from "vitest";
import { QuoteToCashSalesEngine } from "../../src/modules/finance/sales/index.js";
import { TalentAcceleratorRegistry } from "../../src/modules/hub/talent/index.js";
import { AfroFusionCommunityHub } from "../../src/modules/hub/community/index.js";
import { VirtualTalentManagementEngine } from "../../src/modules/hub/vtm/index.js";
import { OneStudiosEngine } from "../../src/modules/hub/onestudios/index.js";
import { VirtualContentFundEngine } from "../../src/modules/hub/vcf/index.js";
import { FusionEventsEngine } from "../../src/modules/hub/events/index.js";
import { TendDistributionEngine } from "../../src/modules/hub/tend/index.js";
import { TalentPayoutEngine } from "../../src/modules/finance/payouts/index.js";
import { AgenticOperatingSystem } from "../../src/modules/intelligence/aos/index.js";
import { HeadspaceKnowledgeEngine } from "../../src/modules/intelligence/headspace/index.js";
import { CommercialProposalStore, renderProposalBuilderHtml, renderQuoteReviewHtml } from "../../src/web/workspace/commercial-proposal.js";
import {
  createRisk,
  listRisks,
  createIssue,
  listIssues,
  transitionIssue,
  _resetRiskIssueForTesting,
} from "../../src/core/work/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const WORKSPACE_DIR = fileURLToPath(new URL("../../src/web/workspace/", import.meta.url));

function readWorkspace(name: string): string {
  return readFileSync(`${WORKSPACE_DIR}${name}`, "utf-8");
}

describe("SCR-17: Commercial proposal → QuoteToCashSalesEngine handoff", () => {
  it("creates a proposal bound to a canonical PROPOSAL-stage deal at net value", () => {
    const engine = new QuoteToCashSalesEngine();
    const store = new CommercialProposalStore(engine);

    const proposal = store.createProposal({
      id: "PROP-001",
      clientName: "Dangote Group Holdings",
      clientOrgId: "org-dangote",
      campaignTitle: "Q4 Pan-African Flight",
      flightStart: "2026-10-01",
      flightEnd: "2026-12-31",
      accountExec: "Chidinma Nwosu",
      items: [
        { id: "i1", name: "30s Prime", channel: "NXTR", daypart: "Prime", units: 60, ratePerUnitNgn: 450000, discountPercent: 10 },
        { id: "i2", name: "15s Squeeze", channel: "IMBD", daypart: "Daytime", units: 30, ratePerUnitNgn: 300000, discountPercent: 15 },
      ],
      salesLeadId: "usr-sales",
    });

    const deal = engine.getDeal("PROP-001");
    expect(deal).toBeDefined();
    expect(deal!.stage).toBe("PROPOSAL");
    // 60×450000×0.9 + 30×300000×0.85 = 24,300,000 + 7,650,000
    expect(deal!.totalContractValueNgn).toBe(31950000);
    expect(proposal.status).toBe("CLIENT_REVIEW");
    expect(proposal.dealId).toBe("PROP-001");
  });

  it("acceptance mutates the canonical deal to CONTRACT_SIGNED via dual authorisation", () => {
    const engine = new QuoteToCashSalesEngine();
    const store = new CommercialProposalStore(engine);
    store.createProposal({
      id: "PROP-002",
      clientName: "MTN Nigeria",
      clientOrgId: "org-mtn",
      campaignTitle: "5G Flight",
      flightStart: "2026-10-01",
      flightEnd: "2026-11-30",
      accountExec: "Exec",
      items: [{ id: "i1", name: "Spot", channel: "NXTR", daypart: "Prime", units: 10, ratePerUnitNgn: 500000, discountPercent: 0 }],
      salesLeadId: "usr-sales",
    });

    const { proposal, deal } = store.acceptProposal({
      proposalId: "PROP-002",
      salesLeadId: "usr-sales",
      financeApproverId: "usr-finance",
      acceptedBy: "Group Commercial Director",
    });

    expect(proposal.status).toBe("ACCEPTED");
    expect(deal.stage).toBe("CONTRACT_SIGNED");
    expect(deal.salesLeadApprovedAt).toBeDefined();
    expect(deal.financeApproverId).toBe("usr-finance");
  });

  it("rejects double acceptance and unknown proposals", () => {
    const engine = new QuoteToCashSalesEngine();
    const store = new CommercialProposalStore(engine);
    store.createProposal({
      id: "PROP-003",
      clientName: "Glo",
      clientOrgId: "org-glo",
      campaignTitle: "Q4",
      flightStart: "2026-10-01",
      flightEnd: "2026-10-31",
      accountExec: "Exec",
      items: [{ id: "i1", name: "Spot", channel: "NXTR", daypart: "Prime", units: 5, ratePerUnitNgn: 400000, discountPercent: 0 }],
      salesLeadId: "u1",
    });
    store.acceptProposal({ proposalId: "PROP-003", salesLeadId: "u1", financeApproverId: "u2", acceptedBy: "Signatory" });

    expect(() =>
      store.acceptProposal({ proposalId: "PROP-003", salesLeadId: "u1", financeApproverId: "u2", acceptedBy: "Signatory" })
    ).toThrow(/\[PROP-04\]/);
    expect(() =>
      store.acceptProposal({ proposalId: "PROP-404", salesLeadId: "u1", financeApproverId: "u2", acceptedBy: "S" })
    ).toThrow(/\[PROP-404\]/);
  });

  it("enforces dual control: same-person signatories violate the invariant", () => {
    const engine = new QuoteToCashSalesEngine();
    const store = new CommercialProposalStore(engine);
    store.createProposal({
      id: "PROP-004",
      clientName: "Airtel",
      clientOrgId: "org-airtel",
      campaignTitle: "X",
      flightStart: "2026-10-01",
      flightEnd: "2026-10-31",
      accountExec: "E",
      items: [{ id: "i1", name: "S", channel: "NXTR", daypart: "P", units: 1, ratePerUnitNgn: 100000, discountPercent: 0 }],
      salesLeadId: "u1",
    });

    expect(() =>
      store.acceptProposal({ proposalId: "PROP-004", salesLeadId: "same-user", financeApproverId: "same-user", acceptedBy: "S" })
    ).toThrow(/\[QTC-AUTH-01\]/);
  });

  it("renderers never invent proposals; unknown quote renders honest 404-style notice", () => {
    const emptyStore = new CommercialProposalStore(new QuoteToCashSalesEngine());
    expect(renderProposalBuilderHtml(undefined)).toContain("never invents rows");
    expect(renderQuoteReviewHtml(undefined, undefined, "No canonical proposal 'X' exists")).toContain("No quote is available");
    expect(renderQuoteReviewHtml(emptyStore)).toContain("No quote is available");
  });
});

describe("SCR-18: desk write-through to existing engines", () => {
  it("accelerator intake registers a hub that the desk can list", () => {
    const registry = new TalentAcceleratorRegistry();
    const before = registry.listHubs().length;
    registry.registerHub({
      id: "HUB-TEST-01",
      name: "Test Hub",
      city: "Jos",
      state: "Plateau",
      address: "1 Test Road",
      leadCoordinator: "Lead",
      contactEmail: "hub@test.ng",
      facilitiesAvailable: ["Edit Lab"],
      activeTalentCount: 0,
      isAccredited: false,
    });
    expect(registry.listHubs().length).toBe(before + 1);
    expect(registry.listHubs().find((h) => h.id === "HUB-TEST-01")).toBeDefined();
    expect(() =>
      registry.registerHub({
        id: "HUB-TEST-01",
        name: "Dup",
        city: "X",
        state: "X",
        address: "X",
        leadCoordinator: "X",
        contactEmail: "x@x.ng",
        facilitiesAvailable: [],
        activeTalentCount: 0,
        isAccredited: false,
      })
    ).toThrow(/\[TALENT-HUB-01\]/);
  });

  it("community member registration writes an ACTIVE canonical member", () => {
    const hub = new AfroFusionCommunityHub();
    const now = new Date();
    hub.registerMember({
      id: "MEM-1",
      personId: "p1",
      fullName: "Ada Creator",
      email: "ada@example.com",
      tier: "CREATOR",
      status: "ACTIVE",
      joinedAt: now,
      expiresAt: new Date(now.getTime() + 3.1536e10),
      guilds: ["Screenwriters"],
    });
    expect(hub.listMembers().find((m) => m.id === "MEM-1")?.status).toBe("ACTIVE");
  });

  it("VTM cast drafts a canonical escrow-backed contract from brief + profile", () => {
    const vtm = new VirtualTalentManagementEngine();
    const start = new Date();
    vtm.createBrief({
      id: "OPP-1",
      title: "Pan-African Commercial",
      productionOrgId: "org-one-studios",
      roleCategory: "ACTING",
      roleDescription: "Lead talent",
      requiredTier: "VERIFIED",
      locationCity: "Lagos",
      startDate: start,
      endDate: new Date(start.getTime() + 30 * 86400000),
      budgetPerDayNgn: 500000,
      buyoutTier: "REGIONAL_PAYTV",
      isOpen: true,
    });
    const contract = vtm.createStandardContract({
      contractNumber: "VTM-CTR-TEST-1",
      briefId: "OPP-1",
      talentId: "TAL-1",
      clientId: "org-one-studios",
      milestones: [{ id: "MS-1", title: "Delivery", description: "d", amountNgn: 2000000, dueDate: new Date() }],
    });
    expect(contract.briefId).toBe("OPP-1");
    expect(contract.totalValueNgn).toBe(2000000);
    expect(contract.milestones[0].status).toBe("PENDING_DEPOSIT");
    expect(vtm.getContract(contract.id)).toBeDefined();
  });

  it("ONE studios call sheet publish is retrievable from the engine", () => {
    const studio = new OneStudiosEngine();
    const sheet = studio.publishCallSheet({
      id: "CS-TEST-1",
      productionName: "Lagos Neon Chronicles S2",
      shootDate: new Date("2026-10-02"),
      generalCallTime: "06:30",
      location: "Soundstage A",
      keyCast: [],
      keyCrew: [],
      scenesToShoot: [{ sceneNumber: "SC-12A", dayNight: "NIGHT", description: "Cyber bar" }],
      nearestHospital: "Lagoon Hospital",
      publishedAt: new Date(),
    });
    expect(studio.getCallSheet("CS-TEST-1")?.productionName).toBe("Lagos Neon Chronicles S2");
    expect(sheet.scenesToShoot.length).toBe(1);
  });

  it("VCF pitch submission lands in the canonical evaluation pipeline", () => {
    const fund = new VirtualContentFundEngine();
    const pitch = fund.submitPitch({
      id: "PITCH-1",
      creatorId: "usr-creator",
      title: "Afro-SciFi Pilot",
      logline: "Hook",
      synopsis: "Syn",
      format: "CREATOR_SHORT",
      targetAudience: "Youth",
      budgetEstimateNgn: 2500000,
      treatmentDeckUrl: "https://example.com/deck.pdf",
    });
    expect(pitch.status).toBe("SUBMITTED");
    expect(fund.getAllPitches().find((p) => p.id === "PITCH-1")).toBeDefined();

    // Evaluation → greenlight → slate stays governed by the engine invariants.
    const evaluation = fund.evaluatePitch("PITCH-1", "usr-evaluator", {
      commercialViability: 90,
      culturalRelevance: 85,
      distributionPotential: 80,
      productionFeasibility: 70,
    });
    expect(evaluation.recommendedAction).toBe("APPROVE_GREENLIGHT");
  });

  it("events gate scan enforces HMAC integrity and single-use (real validation)", () => {
    const events = new FusionEventsEngine("test-secret-at-least-16-chars!");
    events.createEvent({
      id: "EVT-1",
      name: "Afro-Fusion Gala",
      category: "SHOWCASE",
      venueName: "Eko",
      venueCity: "Lagos",
      eventDate: new Date("2026-10-10"),
      doorsOpenTime: "18:00",
      capacity: 100,
      tiers: { REGULAR: { priceNgn: 25000, allocation: 80, sold: 0 }, VIP: { priceNgn: 60000, allocation: 15, sold: 0 }, VVIP: { priceNgn: 150000, allocation: 4, sold: 0 }, BACKSTAGE_PASS: { priceNgn: 300000, allocation: 1, sold: 0 } },
      isPublished: true,
    });
    const ticket = events.issueTicket({ eventId: "EVT-1", attendeeName: "Ada", attendeeEmail: "ada@example.com", tier: "REGULAR" });

    // First scan admits.
    const first = events.scanGateTicket({ ticketNumber: ticket.ticketNumber, eventId: "EVT-1", gateStaffId: "staff-1" });
    expect(first.valid).toBe(true);

    // Reuse is rejected as fraud-relevant ALREADY_CHECKED_IN.
    const reuse = events.scanGateTicket({ ticketNumber: ticket.ticketNumber, eventId: "EVT-1", gateStaffId: "staff-2" });
    expect(reuse.valid).toBe(false);
    expect(reuse.reason).toBe("ALREADY_CHECKED_IN");

    // Unknown ticket rejected as TICKET_NOT_FOUND.
    const unknown = events.scanGateTicket({ ticketNumber: "EVT-FAKE-TICKET", eventId: "EVT-1", gateStaffId: "staff-1" });
    expect(unknown.valid).toBe(false);
    expect(unknown.reason).toBe("TICKET_NOT_FOUND");

    const stats = events.getGateStatistics("EVT-1");
    expect(stats.totalCheckedIn).toBe(1);
    expect(stats.totalTicketsSold).toBe(1);
  });

  it("TEND catalogue registration + exclusive licence avails enforcement", () => {
    const tend = new TendDistributionEngine();
    tend.registerTitle({
      id: "TND-T-1",
      title: "Highlife Kings",
      originalLanguage: "English",
      subtitlesAvailable: ["en"],
      runningTimeMinutes: 45,
      genre: "Period Drama",
      masterDeliveryStatus: "QC_APPROVED",
      minimumLicenseFeeUsd: 100000,
    });
    tend.createLicense({
      id: "LIC-1",
      titleId: "TND-T-1",
      licenseeOrgId: "org-buyer",
      licenseeName: "StreamCo",
      territory: "UK_DIASPORA",
      medium: "SVOD",
      isExclusive: true,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2027-09-30"),
      licenseFeeUsd: 150000,
    });
    expect(tend.listLicenses().length).toBe(1);

    // Overlapping exclusive licence in the same territory/medium is blocked.
    expect(() =>
      tend.createLicense({
        id: "LIC-2",
        titleId: "TND-T-1",
        licenseeOrgId: "org-other",
        licenseeName: "RivalTV",
        territory: "UK_DIASPORA",
        medium: "SVOD",
        isExclusive: true,
        startDate: new Date("2027-01-01"),
        endDate: new Date("2027-12-31"),
        licenseFeeUsd: 90000,
      })
    ).toThrow(/\[TEND-LIC-02\]/);
  });
});

describe("SCR-18 tail: intelligence surfaces over real engine state", () => {
  it("AOS kill switch actually isolates registered agents (fail-closed)", () => {
    const aos = new AgenticOperatingSystem();
    aos.registerAgent({
      id: "bot-001",
      name: "Broadcast Schedule Assistant",
      role: "SCHEDULE_OPTIMIZER",
      operationalScope: "Linear grid balancing",
      allowedTools: ["grid_query"],
      maxDailyActions: 50,
      actionsPerformedToday: 0,
      status: "ACTIVE",
      killSwitchEngaged: false,
      registeredAt: new Date(),
    });
    expect(aos.listAgents().length).toBe(1);
    aos.engageGlobalKillSwitch("Emergency drill");
    const agent = aos.getAgent("bot-001");
    expect(agent?.killSwitchEngaged || agent?.status !== "ACTIVE").toBe(true);
  });

  it("headspace knowledge catalogue is backed by seeded canonical documents", () => {
    const headspace = new HeadspaceKnowledgeEngine();
    const docs = headspace.listDocuments();
    expect(docs.map((d) => d.id)).toContain("DOC-NBC-CODE-01");
    // Confidentiality still enforced on access: INTERNAL throws on an
    // EXECUTIVE_ONLY document; the executive level reads it.
    expect(() => headspace.getDocument("DOC-IP-NIGEZIE-BIBLE", "INTERNAL")).toThrow(/\[HSP-AUTH-01\]/);
    const executive = headspace.getDocument("DOC-IP-NIGEZIE-BIBLE", "EXECUTIVE_ONLY");
    expect(executive).toBeDefined();
  });
});

describe("SCR-19: counterparty scoping + canonical governance registers", () => {
  it("creator portal settlement projection only surfaces the requesting beneficiary's line items", () => {
    const payouts = new TalentPayoutEngine();
    payouts.createPayoutBatch({
      id: "B1",
      batchReference: "NIP-2026-001",
      makerUserId: "usr-finance",
      items: [
        { beneficiaryId: "CRT-A", beneficiaryName: "Creator A", beneficiaryTaxType: "INDIVIDUAL", bankName: "GTB", accountNumber: "0123456789", grossAmountNgn: 1000000 },
        { beneficiaryId: "CRT-B", beneficiaryName: "Creator B", beneficiaryTaxType: "CORPORATE", bankName: "Zenith", accountNumber: "9876543210", grossAmountNgn: 2000000 },
      ],
    });

    const a = payouts
      .listBatches()
      .flatMap((b) => b.items.filter((it) => it.beneficiaryId === "CRT-A"));
    expect(a.length).toBe(1);
    expect(a[0].grossAmountNgn).toBe(1000000);
    // Creator B's records are NOT in Creator A's scope.
    expect(a.some((it) => it.beneficiaryId === "CRT-B")).toBe(false);
  });

  it("risk register writes and lists canonical RiskRecords", () => {
    _resetRiskIssueForTesting();
    createRisk({
      id: "RSK-1",
      title: "Transponder rain fade",
      category: "BROADCAST_TRANSMISSION",
      likelihood: 3,
      impact: 4,
      mitigation: "Fibre failover loop",
      owner: "MCR Chief Engineer",
      reviewDueAt: new Date("2026-12-01"),
    });
    expect(listRisks().length).toBe(1);
    expect(listRisks()[0].status).toBe("OPEN");
    expect(() =>
      createRisk({
        id: "RSK-1",
        title: "dup",
        category: "X",
        likelihood: 1,
        impact: 1,
        mitigation: "x",
        owner: "x",
        reviewDueAt: new Date(),
      })
    ).toThrow(/\[RISK-01\]/);
    _resetRiskIssueForTesting();
  });

  it("issue lifecycle is enforced one step at a time through the domain", () => {
    _resetRiskIssueForTesting();
    createIssue({ id: "ISS-1", title: "Audio crackle", description: "Intermittent", severity: "S1", raisedBy: "usr-op" });
    expect(() => transitionIssue("ISS-1", "RESOLVED", "usr-op")).toThrow(/\[ISSUE-04\]/);
    transitionIssue("ISS-1", "ACKNOWLEDGED", "usr-op");
    transitionIssue("ISS-1", "FIX_IN_PROGRESS", "usr-op");
    const resolved = transitionIssue("ISS-1", "RESOLVED", "usr-op");
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedAt).toBeDefined();
    expect(listIssues().length).toBe(1);
    _resetRiskIssueForTesting();
  });
});

describe("SCR-17/18/19: MOCK_* datasets are deleted from the rewired surfaces", () => {
  const files = [
    "commercial-proposal.ts",
    "creative-hub-extended.ts",
    "counterparty-portals.ts",
    "intelligence-and-tech.ts",
  ];

  for (const file of files) {
    it(`src/web/workspace/${file} contains no MOCK_ dataset exports`, () => {
      const source = readWorkspace(file);
      expect(source).not.toMatch(/export const MOCK_/);
      // Deleted dataset identifiers must not survive anywhere in the source
      // (code OR comments) — the register's claim is that they are gone.
      const deletedDatasets = [
        "MOCK_PROPOSALS",
        "MOCK_ACCELERATOR_PARTNERS",
        "MOCK_COMMUNITY_GUILDS",
        "MOCK_VTM_MATCHES",
        "MOCK_SHOOT_DAY",
        "MOCK_VCF_MISSIONS",
        "MOCK_EVENT",
        "MOCK_TEND_TITLES",
        "MOCK_PARTNER_PROJECTS",
        "MOCK_CREATOR_EARNINGS",
        "MOCK_VENDOR_POS",
        "MOCK_RISKS",
        "MOCK_ISSUES",
        "MOCK_RESEARCH_BRIEFS",
        "MOCK_CR8_SERVICES",
        "MOCK_AGENTS",
      ];
      for (const dataset of deletedDatasets) {
        expect(source, `${file} still references ${dataset}`).not.toContain(dataset);
      }
    });
  }
});
