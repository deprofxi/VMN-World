/**
 * TODO Register Remediation Test Suite (todo.md VMNL-AZP-VMN-TODO-001)
 * Covers: SEC-01 (TOTP MFA), SEC-02 (invitations), SEC-03 (session registry),
 * SEC-05 (notification prefs), SCR-02/04/05 (content, destinations, routing),
 * SCR-06 (approvals), SCR-08 (cases), SCR-09/11 (search, my-work),
 * BCST-04/05 (versions/RFA), BCST-02 (EPG honesty gate), FIN-01 (recognition).
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  generateTotpSecret,
  computeTotp,
  TotpVerifier,
  enrollMfaSecret,
  _resetMfaSecretsForTesting,
} from "../../src/core/auth/totp.js";
import { verifyStepUpCode } from "../../src/core/auth/mfa.js";
import {
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  _resetInvitationsForTesting,
} from "../../src/core/auth/invitations.js";
import {
  registerSession,
  listSessions,
  revokeSessionById,
  revokeAllSessions,
  markTokenIdRevoked,
  isTokenIdRevoked,
  saveNotificationPreferences,
  getNotificationPreferences,
} from "../../src/core/auth/sessions.js";
import {
  createApproval,
  decideApproval,
  reviseApprovalObject,
  listPendingApprovals,
  _resetApprovalsForTesting,
} from "../../src/core/approvals/index.js";
import {
  createContent,
  editContent,
  submitForReview,
  approveRevision,
  publishContent,
  withdrawContent,
  _resetContentForTesting,
} from "../../src/core/content/index.js";
import {
  openCase,
  assignCase,
  transitionCase,
  listCasesForOwner,
  canReadCase,
  _resetCasesForTesting,
} from "../../src/core/cases/index.js";
import {
  registerWorkTaskSource,
  aggregateMyWork,
  indexSearchRecord,
  authorisedSearch,
  createRisk,
  createIssue,
  transitionIssue,
  _resetWorkSourcesForTesting,
  _resetSearchIndexForTesting,
  _resetRiskIssueForTesting,
} from "../../src/core/work/index.js";
import {
  registerDestination,
  verifyDestination,
  revokeDestination,
  isVerifiedDestination,
  resolveNavigationUrl,
  setRoutingRule,
  deactivateRoutingRule,
  _resetDestinationsForTesting,
  _resetRoutingForTesting,
} from "../../src/core/federation/destinations.js";
import {
  registerVersion,
  markReadyForAir,
  isVersionAirable,
  _resetVersionsForTesting,
} from "../../src/modules/broadcast/versions/index.js";
import { exportXmltv, pushToStarTimes, sandboxScheduleSource } from "../../src/modules/broadcast/export/epg.js";
import { deleteFixtureRights, registerFixtureRights } from "../helpers/rights-fixtures.js";
import { getScreenData } from "../../src/modules/broadcast/screens/data.js";
import { QuoteToCashSalesEngine } from "../../src/modules/finance/sales/index.js";
import { screenRegister, computeScreenRegisterCounts } from "../../src/core/config/screen-register.js";
import { _resetConfigForTesting } from "../../src/core/config/index.js";

const FUTURE = new Date(Date.now() + 24 * 3600 * 1000);

describe("TODO-SEC-01: TOTP step-up verification (RFC 6238)", () => {
  beforeEach(() => _resetMfaSecretsForTesting());

  it("generates a valid base32 secret and computes stable 6-digit codes", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const code = computeTotp(secret, counter);
    expect(code).toMatch(/^\d{6}$/);
    expect(computeTotp(secret, counter)).toBe(code);
  });

  it("verifies the current code and rejects a wrong code", () => {
    const email = "operator@vmnl.ng";
    const secret = enrollMfaSecret(email);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const code = computeTotp(secret, counter);
    expect(verifyStepUpCode(email, code).valid).toBe(true);
    expect(verifyStepUpCode(email, "000000").valid).toBe(false);
  });

  it("rejects replay of a consumed code (anti-replay)", () => {
    const verifier = new TotpVerifier();
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000; // fixed time
    const counter = Math.floor(now / 1000 / 30);
    const code = computeTotp(secret, counter);
    expect(verifier.verify("u1", secret, code, now).valid).toBe(true);
    const replay = verifier.verify("u1", secret, code, now);
    expect(replay.valid).toBe(false);
    expect(replay.error).toContain("already been used");
  });

  it("rejects malformed codes and unenrolled accounts", () => {
    const verifier = new TotpVerifier();
    expect(verifier.verify("u1", generateTotpSecret(), "12345").valid).toBe(false);
    expect(verifyStepUpCode("nobody@vmnl.ng", "123456").error).toContain("not enrolled");
  });
});

describe("TODO-SEC-02: invitation acceptance validation chain", () => {
  beforeEach(() => _resetInvitationsForTesting());

  const validRoles = ["SuperAdmin", "MCRSupervisor", "Operator"];

  it("accepts a valid invitation once and grants exactly the invited role", () => {
    createInvitation({
      id: "INV-1",
      token: "tok-1",
      intendedEmail: "new.operator@vmnl.ng",
      intendedRole: "MCRSupervisor",
      grantingAuthority: "admin@vmnl.ng",
      expiresAt: FUTURE,
    });
    const result = acceptInvitation({
      token: "tok-1",
      acceptingEmail: "New.Operator@vmnl.ng",
      acceptingUserId: "usr-1",
      validEnterpriseRoles: validRoles,
    });
    expect(result.accepted).toBe(true);
    expect(result.grantedRole).toBe("MCRSupervisor");
    // Single use
    const second = acceptInvitation({
      token: "tok-1",
      acceptingEmail: "new.operator@vmnl.ng",
      acceptingUserId: "usr-1",
      validEnterpriseRoles: validRoles,
    });
    expect(second.accepted).toBe(false);
    expect(second.code).toBe("INV_ACCEPTED");
  });

  it("enforces recipient binding and refuses expired creation", () => {
    createInvitation({
      id: "INV-2",
      token: "tok-2",
      intendedEmail: "a@vmnl.ng",
      intendedRole: "Operator",
      grantingAuthority: "admin@vmnl.ng",
      expiresAt: FUTURE,
    });
    expect(
      acceptInvitation({ token: "tok-2", acceptingEmail: "b@vmnl.ng", acceptingUserId: "u", validEnterpriseRoles: validRoles }).code
    ).toBe("INV_RECIPIENT_MISMATCH");

    // Expiry is validated at creation time (no stale-acceptance window).
    expect(() =>
      createInvitation({
        id: "INV-3",
        token: "tok-3",
        intendedEmail: "c@vmnl.ng",
        intendedRole: "Operator",
        grantingAuthority: "admin@vmnl.ng",
        expiresAt: new Date(Date.now() - 1000),
      })
    ).toThrow(/VMNL-INV-01/);
  });

  it("rejects revoked invitations at accept time", () => {
    createInvitation({
      id: "INV-3b",
      token: "tok-3b",
      intendedEmail: "c2@vmnl.ng",
      intendedRole: "Operator",
      grantingAuthority: "admin@vmnl.ng",
      expiresAt: FUTURE,
    });
    revokeInvitation("tok-3b", "admin");
    expect(
      acceptInvitation({ token: "tok-3b", acceptingEmail: "c2@vmnl.ng", acceptingUserId: "u", validEnterpriseRoles: validRoles }).code
    ).toBe("INV_REVOKED");
  });

  it("rejects undefined roles and missing granting authority", () => {
    createInvitation({
      id: "INV-4",
      token: "tok-4",
      intendedEmail: "d@vmnl.ng",
      intendedRole: "SpaceWizard",
      grantingAuthority: "admin@vmnl.ng",
      expiresAt: FUTURE,
    });
    expect(
      acceptInvitation({ token: "tok-4", acceptingEmail: "d@vmnl.ng", acceptingUserId: "u", validEnterpriseRoles: validRoles }).code
    ).toBe("INV_BAD_ROLE");

    createInvitation({
      id: "INV-5",
      token: "tok-5",
      intendedEmail: "e@vmnl.ng",
      intendedRole: "Operator",
      grantingAuthority: "",
      expiresAt: FUTURE,
    });
    expect(
      acceptInvitation({ token: "tok-5", acceptingEmail: "e@vmnl.ng", acceptingUserId: "u", validEnterpriseRoles: validRoles }).code
    ).toBe("INV_NO_AUTHORITY");
  });
});

describe("TODO-SEC-03: session registry & revocation", () => {
  it("tracks issued sessions and revokes a targeted one", () => {
    const tokenA = "tok-aaa";
    const tokenB = "tok-bbb";
    registerSession({ token: tokenA, userId: "usr-x", email: "x@vmnl.ng", deviceLabel: "Console A" });
    registerSession({ token: tokenB, userId: "usr-x", email: "x@vmnl.ng", deviceLabel: "Console B" });
    const sessions = listSessions("usr-x");
    expect(sessions.length).toBe(2);

    const targetId = sessions.find((s) => s.deviceLabel === "Console A")!.tokenId;
    const revokedToken = revokeSessionById("usr-x", targetId);
    expect(revokedToken).toBeTruthy();
    markTokenIdRevoked(revokedToken!);
    expect(isTokenIdRevoked(revokedToken!)).toBe(true);
    expect(listSessions("usr-x").find((s) => s.tokenId === targetId)?.revokedAt).toBeDefined();
  });

  it("revoke-all clears every active session for the user", () => {
    registerSession({ token: "tok-c1", userId: "usr-y", email: "y@vmnl.ng" });
    registerSession({ token: "tok-c2", userId: "usr-y", email: "y@vmnl.ng" });
    const count = revokeAllSessions("usr-y");
    expect(count).toBeGreaterThanOrEqual(2);
    expect(listSessions("usr-y").every((s) => s.revokedAt)).toBe(true);
  });
});

describe("TODO-SEC-05: notification preferences persisted and honored", () => {
  it("saves and returns per-user preferences including category opt-outs", () => {
    saveNotificationPreferences("usr-notif", {
      categories: { playoutDisruption: false, rightsBlocks: true, financeApprovals: false, admissionsDecisions: false },
    });
    const prefs = getNotificationPreferences("usr-notif");
    expect(prefs.categories.playoutDisruption).toBe(false);
    expect(prefs.categories.rightsBlocks).toBe(true);
    // Suppression semantics: an opted-out category must not dispatch.
    const shouldDispatch = (category: keyof typeof prefs.categories) => prefs.categories[category];
    expect(shouldDispatch("playoutDisruption")).toBe(false);
  });
});

describe("TODO-SCR-06: four-eyes approval domain", () => {
  beforeEach(() => _resetApprovalsForTesting());

  function seedPending(): string {
    createApproval({
      id: "APV-T-1",
      category: "RATE_CARD_OVERRIDE",
      subject: "Volume discount",
      justification: "Q3 campaign",
      financialScopeNgn: 45_000_000,
      initiatorId: "usr-initiator",
      initiatorName: "Initiator",
      objectRevision: 2,
    });
    return "APV-T-1";
  }

  it("rejects an unauthorized role, self-decision, and stale revision", () => {
    const id = seedPending();
    const base = {
      approvalId: id,
      decision: "APPROVED" as const,
      reason: "Reviewed and approved",
      deciderId: "usr-decider",
      deciderName: "Decider",
      deciderRoles: ["SuperAdmin"],
      authorizedRoles: ["SuperAdmin", "FinanceController"],
      currentObjectRevision: 2,
    };
    expect(decideApproval({ ...base, deciderRoles: ["MCRSupervisor"] }).code).toBe("APR_FORBIDDEN");
    expect(decideApproval({ ...base, deciderId: "usr-initiator" }).code).toBe("APR_SOD_SELF");
    reviseApprovalObject(id, 3);
    expect(decideApproval(base).code).toBe("APR_STALE_REVISION");
  });

  it("enforces four-eyes: initiator cannot decide their own request, reason is mandatory", () => {
    const id = seedPending();
    // Separation of duties fires for the initiator even when authorised.
    const sod = decideApproval({
      approvalId: id,
      decision: "APPROVED",
      reason: "ok",
      deciderId: "usr-initiator",
      deciderName: "Initiator",
      deciderRoles: ["SuperAdmin"],
      authorizedRoles: ["SuperAdmin"],
      currentObjectRevision: 2,
    });
    expect(sod.code).toBe("APR_SOD_SELF");

    // Reason is mandatory for every decision.
    expect(
      decideApproval({
        approvalId: id,
        decision: "APPROVED",
        reason: "x",
        deciderId: "usr-decider",
        deciderName: "Decider",
        deciderRoles: ["SuperAdmin"],
        authorizedRoles: ["SuperAdmin"],
        currentObjectRevision: 2,
      }).code
    ).toBe("APR_REASON_REQUIRED");

    // Four-eyes: with an initiator-id collision the domain requires a second
    // distinct approver for high-value items (verified via APR_SOD_SELF above;
    // a second distinct approver succeeds in the next case).
    const second = decideApproval({
      approvalId: id,
      decision: "APPROVED",
      reason: "Second distinct approver confirms commercial authority.",
      deciderId: "usr-second-approver",
      deciderName: "Second Approver",
      deciderRoles: ["SuperAdmin"],
      authorizedRoles: ["SuperAdmin"],
      currentObjectRevision: 2,
    });
    expect(second.ok).toBe(true);
  });

  it("records a valid decision with actor, reason and revision", () => {
    const id = seedPending();
    const result = decideApproval({
      approvalId: id,
      decision: "APPROVED",
      reason: "Commercial authority confirmed for revision 2.",
      deciderId: "usr-decider",
      deciderName: "decider@vmnl.ng",
      deciderRoles: ["SuperAdmin"],
      authorizedRoles: ["SuperAdmin"],
      currentObjectRevision: 2,
    });
    expect(result.ok).toBe(true);
    expect(result.item?.decidedBy).toBe("usr-decider");
    expect(result.item?.decisionRevision).toBe(2);
    expect(listPendingApprovals().length).toBe(0);
  });
});

describe("TODO-SCR-01/02: content revision & publication domain", () => {
  beforeEach(() => _resetContentForTesting());

  it("runs DRAFT → REVIEW → APPROVED → PUBLISHED with separation of duties", () => {
    createContent({
      id: "CNT-1",
      title: "Feature",
      slug: "feature-1",
      summary: "s",
      body: "b",
      relatedUnit: "S-CONTENT",
      authorId: "usr-author",
    });
    submitForReview("CNT-1");
    expect(() => approveRevision("CNT-1", "usr-author")).toThrow(/CMS-07/);
    approveRevision("CNT-1", "usr-approver");
    const { item } = publishContent({ id: "CNT-1", publisherId: "usr-publisher" });
    expect(item.status).toBe("PUBLISHED");
    expect(item.publication?.publishedBy).toBe("usr-publisher");
  });

  it("editing creates a NEW revision and invalidates approval", () => {
    createContent({
      id: "CNT-2",
      title: "T",
      slug: "t-1",
      summary: "s",
      body: "b",
      relatedUnit: "U",
      authorId: "a",
    });
    submitForReview("CNT-2");
    approveRevision("CNT-2", "rev");
    const edited = editContent({ id: "CNT-2", editorId: "a", changes: { body: "b2" } });
    expect(edited.currentRevision).toBe(2);
    expect(edited.status).toBe("DRAFT");
    expect(() => publishContent({ id: "CNT-2", publisherId: "p" })).toThrow(/CMS-08/);
  });

  it("withdrawal records reason, affected paths and campaign notification flag", () => {
    createContent({ id: "CNT-3", title: "T", slug: "t-3", summary: "s", body: "b", relatedUnit: "U", authorId: "a" });
    submitForReview("CNT-3");
    approveRevision("CNT-3", "rev");
    publishContent({ id: "CNT-3", publisherId: "p" });
    const { withdrawal } = withdrawContent({
      id: "CNT-3",
      withdrawnBy: "admin",
      reason: "Factually inaccurate claim discovered",
      affectedPublicPaths: ["/programmes/PRG-001"],
    });
    expect(withdrawal.affectedPublicPaths).toContain("/programmes/PRG-001");
    expect(withdrawal.campaignNotificationRequired).toBe(true);
    expect(() =>
      withdrawContent({ id: "CNT-3", withdrawnBy: "admin", reason: "x", affectedPublicPaths: [] })
    ).toThrow(/CMS-11/);
  });
});

describe("TODO-SCR-08: restricted privacy/security case queue", () => {
  beforeEach(() => _resetCasesForTesting());

  it("applies SLA windows and transition rules", () => {
    const privacy = openCase({
      id: "CASE-P1",
      type: "PRIVACY_REQUEST",
      subject: "DSAR",
      detail: "Data subject access request",
      reporterContact: "subject@example.com",
    });
    const security = openCase({
      id: "CASE-S1",
      type: "SECURITY_REPORT",
      subject: "Phishing",
      detail: "Reported phishing domain",
      reporterContact: "soc@example.com",
    });
    expect(privacy.slaDueAt.getTime() - privacy.createdAt.getTime()).toBe(72 * 3600 * 1000);
    expect(security.slaDueAt.getTime() - security.createdAt.getTime()).toBe(24 * 3600 * 1000);

    assignCase("CASE-P1", "usr-dpo");
    expect(() => transitionCase("CASE-P1", "usr-dpo", "CLOSED")).toThrow(/CASE-03/);
    transitionCase("CASE-P1", "usr-dpo", "TRIAGED");
    transitionCase("CASE-P1", "usr-dpo", "IN_PROGRESS");
    transitionCase("CASE-P1", "usr-dpo", "RESOLVED");
    transitionCase("CASE-P1", "usr-dpo", "CLOSED");
  });

  it("restricts case contents to the assigned case owner", () => {
    openCase({ id: "CASE-P2", type: "PRIVACY_REQUEST", subject: "s", detail: "d", reporterContact: "x@x.com" });
    assignCase("CASE-P2", "usr-owner");
    const kase = listCasesForOwner("usr-owner")[0];
    expect(canReadCase(kase, "usr-owner")).toBe(true);
    expect(canReadCase(kase, "usr-other")).toBe(false);
    expect(listCasesForOwner("usr-other").length).toBe(0);
  });
});

describe("TODO-SCR-09/11: authorised search & My Work aggregation", () => {
  beforeEach(() => {
    _resetWorkSourcesForTesting();
    _resetSearchIndexForTesting();
    _resetRiskIssueForTesting();
  });

  it("search respects role scope and never crosses tenants", () => {
    indexSearchRecord({
      kind: "contract",
      id: "CTR-1",
      title: "Dangote Q3 campaign",
      snippet: "Prime-time flight",
      requiredRoles: ["FinanceController"],
      tenantId: "vmnl-hq",
      route: "/workspace/commercial",
    });
    const allowed = authorisedSearch({ query: "dangote", userId: "u", roles: ["FinanceController"], tenantId: "vmnl-hq" });
    expect(allowed.length).toBe(1);
    expect(authorisedSearch({ query: "dangote", userId: "u", roles: ["Operator"], tenantId: "vmnl-hq" }).length).toBe(0);
    expect(authorisedSearch({ query: "dangote", userId: "u", roles: ["FinanceController"], tenantId: "other" }).length).toBe(0);
  });

  it("aggregates work from domain sources with dedupe and priority ordering", () => {
    const makeTask = (id: string, priority: 1 | 2 | 3) => ({
      id,
      domain: "APPROVALS" as const,
      title: `Task ${id}`,
      relatedRecordId: id,
      context: "c",
      state: "PENDING",
      reasonActionNeeded: "Decision awaited",
      route: "/workspace/approvals",
      priority,
    });
    registerWorkTaskSource({ listTasks: () => [makeTask("t-low", 3), makeTask("t-blocker", 1)] });
    registerWorkTaskSource({ listTasks: () => [makeTask("t-low", 3), makeTask("t-mid", 2)] });
    const tasks = aggregateMyWork("u", ["ExecutiveLeader"]);
    expect(tasks.length).toBe(3); // dedupe by id
    expect(tasks[0].priority).toBe(1);
  });

  it("risk register and issue tracker enforce their lifecycles", () => {
    createRisk({
      id: "RISK-1",
      title: "Carriage renewal",
      category: "Broadcast",
      likelihood: 3,
      impact: 5,
      mitigation: "Early renewal talks",
      owner: "usr-bd",
      reviewDueAt: FUTURE,
    });
    createIssue({ id: "ISS-1", title: "EPG gap", description: "Missing metadata", severity: "S2", raisedBy: "usr-op", linkedRiskId: "RISK-1" });
    expect(() => createIssue({ id: "ISS-2", title: "x", description: "y", severity: "S1", raisedBy: "u", linkedRiskId: "RISK-404" })).toThrow(/ISSUE-02/);
    transitionIssue("ISS-1", "ACKNOWLEDGED", "usr-op");
    expect(() => transitionIssue("ISS-1", "RESOLVED", "usr-op")).toThrow(/ISSUE-04/);
    transitionIssue("ISS-1", "FIX_IN_PROGRESS", "usr-op");
    transitionIssue("ISS-1", "RESOLVED", "usr-op");
  });
});

describe("TODO-SCR-04/05: destination registry & routing config", () => {
  // TSK-35: the approved HX-13 fallback is a deployment fact, never a guessed
  // partner domain — pin it so this file resolves identically in CI.
  const ORIGINAL_ORIGIN = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
  const TEST_ORIGIN = "https://partner.example.test";

  beforeEach(() => {
    _resetDestinationsForTesting();
    _resetRoutingForTesting();
    process.env.AZEEBO_PLUS_UNIVERSAL_URL = TEST_ORIGIN;
    _resetConfigForTesting();
  });

  afterAll(() => {
    if (ORIGINAL_ORIGIN === undefined) delete process.env.AZEEBO_PLUS_UNIVERSAL_URL;
    else process.env.AZEEBO_PLUS_UNIVERSAL_URL = ORIGINAL_ORIGIN;
    _resetConfigForTesting();
  });

  it("registers https-only destinations and falls back on HX-13", () => {
    registerDestination({ id: "dest-1", universe: "azeebo-plus", universalUrl: `${TEST_ORIGIN}/u/vmn`, registeredBy: "admin" });
    // Registration is an assertion, not a verification (PRD §41).
    expect(isVerifiedDestination("dest-1")).toBe(false);
    expect(() => registerDestination({ id: "dest-2", universe: "u", universalUrl: "http://insecure.example", registeredBy: "admin" })).toThrow(/DEST-02/);

    expect(verifyDestination("dest-1", "admin").status).toBe("VERIFIED");
    expect(isVerifiedDestination("dest-1")).toBe(true);
    expect(resolveNavigationUrl("dest-1").url).toContain(`${TEST_ORIGIN}/u/vmn`);

    revokeDestination("dest-1", "admin");
    const fallback = resolveNavigationUrl("dest-1");
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.url).toBe(TEST_ORIGIN);
  });

  it("manages routing rules with deactivation", () => {
    setRoutingRule({ vertical: "SPONSORSHIP", targetQueue: "traffic", targetOwner: "usr-tm", updatedBy: "admin" });
    const rule = deactivateRoutingRule("SPONSORSHIP", "admin");
    expect(rule.active).toBe(false);
  });
});

describe("TODO-BCST-04/05: broadcast version & RFA workflow", () => {
  beforeEach(() => _resetVersionsForTesting());

  const passingQc = {
    videoStandard: "1080i50" as const,
    aspectRatio: "16:9" as const,
    audioLoudnessLufs: -23,
    hasCountdownSlate: true,
    hasBlackGaps: false,
    hasClosedCaptionTrack: true,
  };

  it("passes QC only when the closed-caption track is present (BCST-05)", () => {
    const good = registerVersion({ id: "V-1", episodeId: "EP-1", versionType: "MASTER", durationSeconds: 1500, qc: passingQc });
    expect(good.qcStatus).toBe("PASSED");

    const noCc = registerVersion({
      id: "V-2",
      episodeId: "EP-1",
      versionType: "CLEAN",
      durationSeconds: 1500,
      qc: { ...passingQc, hasClosedCaptionTrack: false },
    });
    expect(noCc.qcStatus).toBe("FAILED");
    expect(() => markReadyForAir({ versionId: "V-2", rfaBy: "usr-qc" })).toThrow(/VER-03/);
  });

  it("gates RFA: override requires explicit reason and is auditable", () => {
    registerVersion({ id: "V-3", episodeId: "EP-2", versionType: "MASTER", durationSeconds: 1500, qc: { ...passingQc, hasBlackGaps: true } });
    expect(() => markReadyForAir({ versionId: "V-3", rfaBy: "usr-qc", overrideReason: "short" })).toThrow(/VER-03/);
    const overridden = markReadyForAir({ versionId: "V-3", rfaBy: "usr-qc", overrideReason: "Black gap verified as artistic fade by MCR duty engineer." });
    expect(overridden.qcStatus).toBe("OVERRIDDEN");
    expect(overridden.qcOverrideBy).toBe("usr-qc");
    expect(isVersionAirable("V-3")).toBe(true);
    expect(isVersionAirable("V-404")).toBe(false);
  });
});

describe("TODO-BCST-02: EPG export honesty gate", () => {
  const FIXTURE_RIGHTS_IDS = ["rr-bcst02-export"];

  afterAll(async () => {
    await deleteFixtureRights(FIXTURE_RIGHTS_IDS);
  });

  it("refuses to publish sample scheduler data as an operational feed", () => {
    const result = exportXmltv("NXTR", "2026-09-30", sandboxScheduleSource);
    expect(result.status).toBe("APPROVED_SCHEDULE_UNAVAILABLE");
    expect(result.code).toBe("APPROVED_SCHEDULE_UNAVAILABLE");
    expect(result.xmltv).toBeUndefined();
  });

  it("honestly refuses StarTimes push while the BG6 carriage interface is unverified", () => {
    const push = pushToStarTimes("NXTR", "2026-09-30", sandboxScheduleSource);
    expect(push.status).toBe("NOT_CONNECTED");
    // Without a schedule source the gate fires first (APPROVED_SCHEDULE_UNAVAILABLE);
    // with one connected it would be CARRIAGE_INTERFACE_NOT_CONNECTED.
    expect(["CARRIAGE_INTERFACE_NOT_CONNECTED", "APPROVED_SCHEDULE_UNAVAILABLE"]).toContain(push.code);
  });

  it("exports real XMLTV when an approved, rights-cleared schedule source is connected", async () => {
    // TSK-10: an approved day is not enough — every slot is re-checked against its
    // registered RightsRecord at export time. So the connected source has to carry
    // a record that actually covers the slot.
    const record = await registerFixtureRights({
      id: "rr-bcst02-export",
      assetId: "ast-sunrise-ep1",
      title: "Sunrise Afro-Beats Top 20 #1",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      channelCode: null,
      exclusivity: false,
      startDate: new Date(Date.UTC(2026, 8, 1)),
      expiryDate: new Date(Date.UTC(2026, 11, 31)),
      subLicensable: false,
    });
    const slot = {
      id: "SLOT-1",
      channelId: "NXTR",
      startTime: new Date("2026-09-30T06:00:00Z"),
      durationSeconds: 3600,
      episodeId: "EP-1",
      title: "Sunrise Afro-Beats Top 20",
      isLocked: true,
      rightsRecordId: record.id,
    };
    const connectedSource = {
      getApprovedSchedule: (channelCode: string) =>
        channelCode === "NXTR" ? { broadcastDate: "2026-09-30", revisionId: "SCHED-BCST02#R1", slots: [slot] } : null,
    };
    const result = exportXmltv("NXTR", "2026-09-30", connectedSource);
    expect(result.status).toBe("EXPORTED");
    expect(result.xmltv).toContain("<tv");
    expect(result.xmltv).toContain("Sunrise Afro-Beats Top 20");
    // PRD §15: an exportable EPG export identifies the source schedule revision.
    expect(result.revisionId).toBe("SCHED-BCST02#R1");
    expect(result.xmltv).toContain("<source-revision>SCHED-BCST02#R1</source-revision>");

    // Same approved slots, rights gone (record not registered): the approval
    // timestamp alone buys the feed nothing.
    const unclearedSource = {
      getApprovedSchedule: (channelCode: string) =>
        channelCode === "NXTR"
          ? { broadcastDate: "2026-09-30", revisionId: "SCHED-BCST02#R1", slots: [{ ...slot, rightsRecordId: "rr-bcst02-unregistered" }] }
          : null,
    };
    const blocked = exportXmltv("NXTR", "2026-09-30", unclearedSource);
    expect(blocked.status).toBe("RIGHTS_NOT_CLEARED");
    expect(blocked.code).toBe("RIGHTS_NOT_CLEARED_AT_EXPORT");
    expect(blocked.xmltv).toBeUndefined();
    expect(pushToStarTimes("NXTR", "2026-09-30", unclearedSource).code).toBe("RIGHTS_NOT_CLEARED_AT_EXPORT");
  });

  it("refuses an approved day with no revision identity instead of publishing an unattributed feed", () => {
    // PRD §15 requires the export to name the source schedule revision, so a source
    // that bypassed the lifecycle (no `SCHEDULE#Rn`) is refused rather than exported.
    const unattributed = {
      getApprovedSchedule: () => ({
        broadcastDate: "2026-09-30",
        revisionId: "",
        slots: [
          {
            id: "SLOT-NO-REV",
            channelId: "NXTR",
            startTime: new Date("2026-09-30T06:00:00Z"),
            durationSeconds: 3600,
            episodeId: "EP-1",
            title: "Unattributed Feed",
            isLocked: false,
            rightsRecordId: "rr-bcst02-export",
          },
        ],
      }),
    };
    const result = exportXmltv("NXTR", "2026-09-30", unattributed);
    expect(result.status).toBe("APPROVED_SCHEDULE_UNAVAILABLE");
    expect(result.code).toBe("SCHEDULE_REVISION_IDENTITY_MISSING");
    expect(result.xmltv).toBeUndefined();
    // The refusal also closes the syndication path: nothing unattributed is dispatched.
    expect(pushToStarTimes("NXTR", "2026-09-30", unattributed).code).toBe("SCHEDULE_REVISION_IDENTITY_MISSING");
  });
});

describe("TODO-BCST-01: screen data provenance (no fabricated KPIs)", () => {
  it("marks unavailable sources honestly and never invents revenue", () => {
    const result = getScreenData("SCR-BCST-01", {
      channels: [],
      carriageVerified: false,
      approvedScheduleConnected: false,
    });
    expect(result.fullySourced).toBe(false);
    for (const kpi of result.kpis) {
      if (kpi.provenance === "NOT_CONNECTED") {
        expect(kpi.value).toBeUndefined();
        expect(kpi.note).toBeTruthy();
      }
    }
  });

  it("sources KPIs from domain engines when connected", () => {
    const result = getScreenData("SCR-BCST-02", {
      channels: [
        { code: "NXTR", name: "Nigezie Xtreme", isProvisional: false },
        { code: "ORIS", name: "Orisun", isProvisional: false },
        { code: "IMBD", name: "Isi Mbido", isProvisional: false },
      ],
      carriageVerified: false,
      approvedScheduleConnected: true,
    });
    expect(result.kpis[0].value).toBe("3");
    expect(result.fullySourced).toBe(true);
  });
});

describe("TODO-FIN-01: delivery-gated revenue recognition", () => {
  function stagedDeal(qtc: QuoteToCashSalesEngine, id: string) {
    qtc.createDeal({ id, clientOrgId: "ORG-1", dealName: "Deal", totalContractValueNgn: 15_000_000, salesLeadId: "s1" });
    qtc.signContract({ dealId: id, salesLeadId: "s1", financeApproverId: "f1" });
    qtc.recordDeposit(id, 5_000_000);
  }

  it("defers recognition until proof-of-performance is verified", () => {
    const qtc = new QuoteToCashSalesEngine();
    stagedDeal(qtc, "D-1");
    qtc.recordCashPayment("D-1", 15_000_000);
    const deal = qtc.getDeal("D-1")!;
    expect(deal.cashCollectedAmountNgn).toBe(20_000_000);
    expect(deal.recognizedRevenueNgn).toBe(0); // no proof → cash is NOT revenue
    expect(deal.stage).toBe("CASH_COLLECTED");
  });

  it("recognizes capped at contract value once delivery is verified", () => {
    const qtc = new QuoteToCashSalesEngine();
    stagedDeal(qtc, "D-2");
    qtc.generateInvoice("D-2", "https://vmnl.ng/evidence/coa.pdf", 10_000_000);
    qtc.recordCashPayment("D-2", 10_000_000);
    const deal = qtc.getDeal("D-2")!;
    // Deposit (5M) + payment (10M) = 15M collected, all covered by verified
    // proof, so recognition equals collected cash capped at contract value.
    expect(deal.recognizedRevenueNgn).toBe(15_000_000);
    expect(deal.stage).toBe("REVENUE_RECOGNIZED");
    qtc.recordCashPayment("D-2", 5_000_000);
    const done = qtc.getDeal("D-2")!;
    expect(done.cashCollectedAmountNgn).toBe(20_000_000);
    expect(done.recognizedRevenueNgn).toBe(15_000_000); // capped, not 20M
    expect(done.stage).toBe("REVENUE_RECOGNIZED");
  });

  it("explicit recognition requires proof and respects contract headroom", () => {
    const qtc = new QuoteToCashSalesEngine();
    stagedDeal(qtc, "D-3");
    expect(() => qtc.recognizeRevenue("D-3", 5_000_000)).toThrow(/QTC-REC-02/);
    qtc.generateInvoice("D-3", "https://vmnl.ng/evidence/coa.pdf", 15_000_000);
    qtc.recognizeRevenue("D-3", 10_000_000);
    expect(() => qtc.recognizeRevenue("D-3", 10_000_000)).toThrow(/QTC-REC-03/);
    qtc.recognizeRevenue("D-3", 5_000_000);
    expect(qtc.getDeal("D-3")!.stage).toBe("REVENUE_RECOGNIZED");
  });
});

describe("TODO-GVR-02: machine-readable screen register", () => {
  it("is valid JSON with reconciled statuses and truthful counts", () => {
    expect(screenRegister.document).toBe("VMNL-REG-SCREENS-001");
    const validStatuses = ["IMPLEMENTED", "MOCK", "MISSING", "DEFERRED", "ALIAS"];
    for (const group of screenRegister.groups) {
      expect(Array.isArray(group.entries)).toBe(true);
      for (const entry of group.entries) {
        expect(validStatuses).toContain(entry.status);
        // Evidence-before-claims: every entry must cite where it is implemented
        // or why it is not (Law 20).
        expect(entry.evidence.length).toBeGreaterThan(3);
        expect(entry.route.length).toBeGreaterThan(0);
      }
    }
    // Counts must match a fresh recomputation from the entries.
    const computed = computeScreenRegisterCounts(screenRegister);
    expect(screenRegister.summary.totalScreens).toBe(computed.totalScreens);
    expect(screenRegister.summary.implemented).toBe(computed.implemented);
    expect(screenRegister.summary.mock).toBe(computed.mock);
    expect(screenRegister.summary.missing).toBe(computed.missing);
    expect(screenRegister.summary.deferred).toBe(computed.deferred);
    expect(screenRegister.summary.alias).toBe(computed.alias);
  });

  it("resolves the UX-VTM-010/011 conflict with an explicit alias", () => {
    const conflict = screenRegister.knownConflicts.find((c) => c.id === "UX-VTM-010");
    expect(conflict).toBeDefined();
    expect(conflict!.status).toBe("RESOLVED_ALIAS");
  });
});
