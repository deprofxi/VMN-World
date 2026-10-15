/**
 * TSK-17 (report.md CA-12) — the release-critical stores are durable stores.
 *
 * CA-12's defect was that ten domains kept their authoritative state in a
 * process-local `Map`, so a restart silently discarded enquiries, approvals,
 * restricted cases, risks/issues, destinations, media assets, sessions and
 * idempotency keys. A unit test inside one process cannot detect that: the Map
 * always reads back what it wrote. So every test here closes the loop through a
 * *second OS process* — `tests/helpers/durable-restart-reader.mjs`, which boots
 * the compiled `dist/src` artifact, hydrates its own read index from Postgres and
 * answers with what the database alone told it. A record the writer can see and
 * the reader cannot is exactly the bug this register item exists to kill.
 *
 * Rule 0.4a is what makes that honest, so it shapes the whole file:
 *  - the suite runs only against a reachable Postgres; without one the restart
 *    measurements below are impossible, and they are reported as skipped, never
 *    as passed;
 *  - the restart reader reports `database: false` rather than an empty record,
 *    and the test fails on that instead of shrugging;
 *  - the child reads the compiled artifact, so `dist/` is rebuilt here whenever
 *    `src/` is newer — otherwise this file would certify a stale build.
 *
 * The three claims the register asks for, each asserted separately:
 *  1. write → restart → read back, per entity (box 2);
 *  2. the HTTP response path drains the journal without the route calling it —
 *    a 201 here means the row is in Postgres, not in a Map;
 *  3. a write the database rejects is rolled back and fails closed with 503, so
 *    a caller is never told a write landed when it did not (box 1 + box 3).
 */

import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { getRepositoryMode, RepositoryUnavailableError } from "../../src/core/database/repository-mode.js";
import {
  durableJournalStats,
  flushDurableJournal,
  pendingDurableWrites,
  registerDurableStore,
  stageDurableWrite,
} from "../../src/core/database/durable-journal.js";
import { createApproval, listAllApprovals, type ApprovalItem } from "../../src/core/approvals/index.js";
import { openCase, assignCase, transitionCase, type PrivacySecurityCase } from "../../src/core/cases/index.js";
import { createRisk, createIssue, type RiskRecord, type IssueRecord } from "../../src/core/work/index.js";
import {
  registerDestination,
  verifyDestination,
  type AzeeboDestination,
} from "../../src/core/federation/destinations.js";
import { getMediaAsset, registerMediaAsset, type MediaAssetRecord } from "../../src/core/storage/index.js";
import {
  createContent,
  editContent,
  approveRevision,
  publishContent,
  submitForReview,
  wireMediaAssetLookup,
  type ContentItem,
  type ContentRevision,
} from "../../src/core/content/index.js";
import { SevenWayLedgerEngine, type JournalEntry } from "../../src/modules/finance/ledger/index.js";
import { SponsorshipEngine, type SponsorBinding } from "../../src/modules/broadcast/sponsorship/index.js";
import { QuoteToCashSalesEngine, type SalesDeal } from "../../src/modules/finance/sales/index.js";
import { registerSession, type SessionRecord } from "../../src/core/auth/sessions.js";
import { recordIdempotentOutcome } from "../../src/core/websecurity/index.js";
import { submitCommercialEnquiry, type EnquiryRecord } from "../../src/modules/hub/enquiry/index.js";
import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";

const REPO_ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const RESTART_READER = path.join(REPO_ROOT, "tests/helpers/durable-restart-reader.mjs");
const DIST_STAMP = path.join(REPO_ROOT, "dist/src/core/database/durable-journal.js");
const TSC_BIN = path.join(REPO_ROOT, "node_modules/typescript/bin/tsc");

/** One id namespace per run, so rows never collide with a previous run's. */
const RUN = `t${Date.now().toString(36)}`;

interface RestartRead {
  ok: boolean;
  entity?: string;
  key?: string;
  /** false = no reachable Postgres: the measurement was impossible, not empty. */
  database: boolean | null;
  hydrated?: unknown;
  record?: unknown;
  reason?: string;
}

/** Newest mtime of any TypeScript source the restart child is built from. */
function newestSourceMtime(dir = path.join(REPO_ROOT, "src")): number {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSourceMtime(abs));
    else if (entry.name.endsWith(".ts")) newest = Math.max(newest, fs.statSync(abs).mtimeMs);
  }
  return newest;
}

/**
 * The child process runs the production artifact, so this test must not certify
 * a build older than the sources it is supposed to be proving.
 */
function ensureCompiledArtifact(): void {
  const distMtime = fs.existsSync(DIST_STAMP) ? fs.statSync(DIST_STAMP).mtimeMs : 0;
  if (distMtime >= newestSourceMtime()) return;
  execFileSync(process.execPath, [TSC_BIN], {
    cwd: REPO_ROOT,
    stdio: "ignore",
    timeout: 600_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}

function readAfterRestart(entity: string, key: string): RestartRead {
  const stdout = execFileSync(process.execPath, [RESTART_READER, entity, key], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 120_000,
  });
  const line = stdout.trim().split("\n").at(-1) ?? "";
  if (!line) throw new Error(`[TSK-17] restart reader produced no output for '${entity}'`);
  return JSON.parse(line) as RestartRead;
}

/**
 * Drain the journal in this process, then read from a process that has never
 * seen the record. Fails loudly if the child had no database to read.
 */
async function restartRead(entity: string, key: string): Promise<Record<string, unknown>> {
  await flushDurableJournal();
  const result = readAfterRestart(entity, key);
  if (!result.ok) throw new Error(`[TSK-17] restart read failed for '${entity}' ${key}: ${result.reason}`);
  expect(result.database, `restart child must reach Postgres to measure durability for '${entity}'`).toBe(true);
  expect(result.record, `${entity} '${key}' did not survive a process restart`).not.toBeNull();
  return result.record as Record<string, unknown>;
}

const connection = await checkDatabaseConnection(true);
const DURABLE = connection.connected;
if (!DURABLE) {
  // Not a skip reason to hide behind: without Postgres the CA-12 claim is
  // unmeasurable, and the register says so (Rule 0.4a).
  console.warn(
    `[TSK-17] SKIP: no reachable Postgres (${connection.error}). ` +
      "Restart durability is NOT verified in this run."
  );
}

/** Rows created by this file, deleted on the way out so the suite stays repeatable. */
const cleanup: Array<() => Promise<unknown>> = [];

/**
 * Every restart below is a real child process with a real Prisma cold start
 * (~8s wall on this machine), so the per-test budget is about machine speed,
 * not about the behaviour under test. The assertions themselves are unchanged.
 */
function restartIt(name: string, fn: () => Promise<void> | void): void {
  it(name, fn, 180_000);
}

describe.skipIf(!DURABLE)("TSK-17: release-critical stores survive a process restart", () => {
  beforeAll(() => {
    ensureCompiledArtifact();
  }, 600_000);

  afterAll(async () => {
    for (const drop of cleanup) await drop();
  });

  restartIt("hydrates the enquiry queue from Postgres and keeps the intake contract intact", async () => {
    const { enquiry } = await submitCommercialEnquiry({
      fullName: "Durability Probe",
      email: `probe+${RUN}@vmnl.ng`,
      phone: "+2348030000000",
      organisationName: "VMNL Fixture Media",
      message: "Restart durability probe for the commercial intake queue.",
      ndprConsent: true,
      vertical: "SPONSORSHIP",
      idempotencyKey: `enq-idem-${RUN}`,
    });
    cleanup.push(() => getPrismaClient().commercialEnquiry.deleteMany({ where: { id: enquiry.id } }));

    const stored = (await restartRead("enquiry", enquiry.reference)) as unknown as EnquiryRecord;
    expect(stored.id).toBe(enquiry.id);
    expect(stored.fullName).toBe("Durability Probe");
    expect(stored.email).toBe(`probe+${RUN}@vmnl.ng`);
    expect(stored.vertical).toBe("SPONSORSHIP");
    expect(stored.submissionStatus).toBe("RECEIVED");
    expect(stored.ndprConsent).toBe(true);
    // The ISO strings round-trip to Date objects in the durable layer.
    expect(new Date(stored.createdAt).getTime()).toBe(new Date(enquiry.createdAt).getTime());
    expect(stored.retryCount).toBe(0);
  });

  restartIt("persists an approval with its NGN scope exact, not as a float approximation", async () => {
    const item = createApproval({
      id: `APV-${RUN}-FIN`,
      category: "FINANCIAL_ADJUSTMENT",
      subject: "Rate-card correction for the durability probe",
      justification: "Register item TSK-17 requires this row to survive a restart.",
      financialScopeNgn: 12345678.91,
      initiatorId: "usr-durability",
      initiatorName: `probe+${RUN}@vmnl.ng`,
      objectRevision: 3,
    });
    cleanup.push(() => getPrismaClient().approvalItem.deleteMany({ where: { id: item.id } }));

    const stored = (await restartRead("approval", item.id)) as unknown as ApprovalItem;
    expect(stored.status).toBe("PENDING");
    // Decimal(14,2) → exact two-dp money, the finance discipline TSK-34 pins.
    expect(stored.financialScopeNgn).toBe(12345678.91);
    expect(stored.currency).toBe("NGN");
    expect(stored.objectRevision).toBe(3);
    expect(stored.requiresFourEyes).toBe(true);
  });

  restartIt("keeps the restricted case queue durable, including its audit trail", async () => {
    const kase = openCase({
      id: `CASE-${RUN}`,
      type: "PRIVACY_REQUEST",
      subject: "Data subject access request — durability probe",
      detail: "Case detail text must never appear in a log line.",
      reporterContact: `reporter+${RUN}@vmnl.ng`,
      dataSubjects: ["per-durability-1", "per-durability-2"],
    });
    assignCase(kase.id, "usr-case-owner");
    transitionCase(kase.id, "usr-case-owner", "TRIAGED", "Routed to the privacy desk");
    cleanup.push(() => getPrismaClient().privacySecurityCase.deleteMany({ where: { id: kase.id } }));

    const stored = (await restartRead("case", kase.id)) as unknown as PrivacySecurityCase;
    expect(stored.status).toBe("TRIAGED");
    expect(stored.assignedCaseOwner).toBe("usr-case-owner");
    expect(stored.dataSubjects).toEqual(["per-durability-1", "per-durability-2"]);
    // Nested payload survives as JSON: OPENED + ASSIGNED + TRANSITION entries.
    expect(stored.auditTrail.map((entry) => entry.action)).toEqual([
      "CASE_OPENED",
      "CASE_ASSIGNED",
      "TRANSITION_TRIAGED",
    ]);
    expect(new Date(stored.slaDueAt).getTime()).toBe(new Date(kase.slaDueAt).getTime());
  });

  restartIt("persists a risk and an issue, including the issue → risk linkage", async () => {
    const risk = createRisk({
      id: `RSK-${RUN}`,
      title: "Transmission outage on a primary playout path",
      category: "OPERATIONAL",
      likelihood: 3,
      impact: 5,
      mitigation: "Failover to the secondary encoder is rehearsed weekly.",
      owner: "usr-risk-owner",
      reviewDueAt: new Date(Date.UTC(2026, 10, 1, 9, 0, 0)),
    });
    const issue = createIssue({
      id: `ISS-${RUN}`,
      title: "Encoder failover not exercised in the last rehearsal",
      description: "Found while verifying the durability of the work graph.",
      severity: "S2",
      raisedBy: "usr-issue-raiser",
      linkedRiskId: risk.id,
    });
    cleanup.push(
      () => getPrismaClient().riskRecord.deleteMany({ where: { id: risk.id } }),
      () => getPrismaClient().issueRecord.deleteMany({ where: { id: issue.id } })
    );

    const storedRisk = (await restartRead("risk", risk.id)) as unknown as RiskRecord;
    expect(storedRisk.status).toBe("OPEN");
    expect(storedRisk.likelihood).toBe(3);
    expect(storedRisk.impact).toBe(5);
    expect(new Date(storedRisk.reviewDueAt).getTime()).toBe(new Date(risk.reviewDueAt).getTime());

    const storedIssue = (await restartRead("issue", issue.id)) as unknown as IssueRecord;
    expect(storedIssue.severity).toBe("S2");
    expect(storedIssue.status).toBe("OPEN");
    // Application-side linkage (no FK by design): the id must survive verbatim.
    expect(storedIssue.linkedRiskId).toBe(risk.id);
  });

  restartIt("keeps Azeebo+ destination verification state durable, registrant included", async () => {
    const dest = registerDestination({
      id: `DST-${RUN}`,
      universe: "vmnl-durability-universe",
      universalUrl: "https://destinations.invalid/vmnl/probe",
      registeredBy: "usr-dest-registrant",
    });
    verifyDestination(dest.id, "usr-dest-verifier");
    cleanup.push(() => getPrismaClient().azeeboDestination.deleteMany({ where: { id: dest.id } }));

    const stored = (await restartRead("destination", dest.id)) as unknown as AzeeboDestination;
    // A restart must not resurrect CANDIDATE state over a recorded VERIFIED one.
    expect(stored.status).toBe("VERIFIED");
    expect(stored.verifiedBy).toBe("usr-dest-verifier");
    expect(stored.universalUrl).toBe("https://destinations.invalid/vmnl/probe");
    expect(stored.campaignContextAllowed).toBe(true);
  });

  restartIt("persists a DAM master with exact byte size and its access state", async () => {
    const record = registerMediaAsset({
      title: `Durability probe master ${RUN}`,
      assetKey: `dam/${RUN}/master.mp4`,
      tenantId: "vmnl",
      mimeType: "video/mp4",
      sizeBytes: 8_589_934_592,
      checksumSha256: "a".repeat(64),
      provenance: "Ingest — durability probe",
      virusScanPassed: true,
      registeredBy: "usr-dam-operator",
      assetId: `MA-${RUN.toUpperCase()}`,
    });
    cleanup.push(() => getPrismaClient().mediaAssetRecord.deleteMany({ where: { id: record.assetId } }));

    const stored = (await restartRead("mediaAsset", record.assetId)) as unknown as MediaAssetRecord;
    // BigInt column: an 8 GiB master must not come back truncated or rounded.
    expect(stored.sizeBytes).toBe(8_589_934_592);
    expect(stored.accessState).toBe("AVAILABLE");
    expect(stored.checksumSha256).toBe("a".repeat(64));
    expect(stored.assetKey).toBe(`dam/${RUN}/master.mp4`);
    expect(stored.registeredBy).toBe("usr-dam-operator");
  });

  restartIt("keeps a session durable without ever storing the raw token", async () => {
    const token = `raw-token-${RUN}`;
    const session = registerSession({
      token,
      userId: "usr-durability",
      email: `probe+${RUN}@vmnl.ng`,
      deviceLabel: "Durability probe workstation",
      ipAddress: "10.0.0.7",
    });
    cleanup.push(() => getPrismaClient().sessionRecord.deleteMany({ where: { id: session.tokenId } }));

    const readBack = await restartRead("session", session.tokenId);
    const stored = readBack as unknown as SessionRecord;
    expect(stored.userId).toBe("usr-durability");
    expect(stored.deviceLabel).toBe("Durability probe workstation");
    // The key is the sha-256 digest; the raw credential is nowhere in the row.
    expect(stored.tokenId).toBe(session.tokenId);
    expect(JSON.stringify(readBack)).not.toContain(token);
  });

  restartIt("replays an idempotency outcome from Postgres, response body included", async () => {
    const key = `idem-${RUN}`;
    recordIdempotentOutcome(key, "SUCCESS", { reference: `ENQ-${RUN}`, replayed: false });
    cleanup.push(() => getPrismaClient().idempotencyRecord.deleteMany({ where: { id: key } }));

    const stored = await restartRead("idempotency", key);
    expect(stored.outcome).toBe("SUCCESS");
    expect(stored.responseBody).toEqual({ reference: `ENQ-${RUN}`, replayed: false });
  });

  restartIt("keeps a CMS revision chain durable, including the superseded revision", async () => {
    // Production wires the DAM lookup at boot (server.ts); the CMS module stays
    // decoupled from the storage singleton, so a test that exercises canonical
    // media references has to wire it the same way.
    wireMediaAssetLookup(getMediaAsset);

    const master = registerMediaAsset({
      title: `CMS probe master ${RUN}`,
      assetKey: `dam/${RUN}/cms-master.mp4`,
      tenantId: "vmnl",
      mimeType: "video/mp4",
      sizeBytes: 1_048_576,
      checksumSha256: "b".repeat(64),
      provenance: "Ingest — CMS durability probe",
      virusScanPassed: true,
      registeredBy: "usr-dam-operator",
      assetId: `MA-CMS-${RUN.toUpperCase()}`,
    });
    const id = `CNT-${RUN}`;
    createContent({
      id,
      title: "Durability probe article",
      slug: `durability-probe-${RUN}`,
      summary: "Revision 1 of the CMS durability probe.",
      body: "Body text of the first revision.",
      relatedUnit: "unit-sponsorship",
      mediaAssetIds: [master.assetId],
      claimSources: ["internal://as-run/" + RUN],
      alternativeText: "Descriptive alternative text.",
      authorId: "usr-cms-author",
    });
    submitForReview(id);
    approveRevision(id, "usr-cms-approver");
    // The §8.13 invariant: editing published-ready content mints revision 2 and
    // leaves revision 1 intact. Both halves have to survive the restart.
    editContent({ id, editorId: "usr-cms-author", changes: { title: "Durability probe article (corrected)" } });
    submitForReview(id);
    approveRevision(id, "usr-cms-approver");
    publishContent({ id, publisherId: "usr-cms-publisher" });
    cleanup.push(
      () => getPrismaClient().contentItemRecord.deleteMany({ where: { id } }),
      () => getPrismaClient().contentRevisionRecord.deleteMany({ where: { contentId: id } }),
      () => getPrismaClient().mediaAssetRecord.deleteMany({ where: { id: master.assetId } })
    );

    const stored = (await restartRead("content", id)) as unknown as Omit<ContentItem, "revisions"> & {
      revisions: Array<[number, ContentRevision]>;
    };
    expect(stored.status).toBe("PUBLISHED");
    expect(stored.currentRevision).toBe(2);
    expect(stored.revisions).toHaveLength(2);

    const [firstRev, first] = stored.revisions[0]!;
    expect(firstRev).toBe(1);
    // The approved revision was never silently mutated.
    expect(first.title).toBe("Durability probe article");
    expect(first.approvedBy).toBe("usr-cms-approver");
    expect(first.approvedAt).toBeTruthy();
    // Canonical media reference survives as an id, not as a free-text key.
    expect(first.mediaAssetIds).toEqual([master.assetId]);
    expect(first.claimSources).toEqual(["internal://as-run/" + RUN]);

    const [, second] = stored.revisions[1]!;
    expect(second.title).toBe("Durability probe article (corrected)");
    expect(second.revision).toBe(2);
    expect(stored.publication).toMatchObject({
      revision: 2,
      publishedBy: "usr-cms-publisher",
    });
  });

  restartIt("persists a balanced journal entry with its two lines and exact totals", async () => {
    const engine = new SevenWayLedgerEngine();
    const entry = engine.postJournalEntry({
      id: `JE-${RUN}`,
      reference: `JRN-${RUN}`,
      description: "Linear sponsorship invoice — durability probe",
      lines: [
        { accountCode: "1010_BANK_CASH", accountName: "Bank and cash", debitNgn: 7_500_000.55, creditNgn: 0 },
        { accountCode: "4010_LINEAR_AD_REVENUE", accountName: "Linear advertising revenue", debitNgn: 0, creditNgn: 7_500_000.55 },
      ],
    });
    expect(entry.isBalanced).toBe(true);
    cleanup.push(() => getPrismaClient().journalEntryRecord.deleteMany({ where: { id: entry.id } }));

    const stored = (await restartRead("journal", entry.id)) as unknown as JournalEntry;
    // The lines are the evidence; a journal that comes back without them is worthless.
    expect(stored.lines).toHaveLength(2);
    expect(stored.lines.map((line) => line.accountCode)).toEqual([
      "1010_BANK_CASH",
      "4010_LINEAR_AD_REVENUE",
    ]);
    // Decimal(14,2): the balanced pair must still balance to the exact kobo.
    expect(stored.totalDebitNgn).toBe(7_500_000.55);
    expect(stored.totalCreditNgn).toBe(7_500_000.55);
    expect(stored.totalDebitNgn).toBe(stored.totalCreditNgn);
    expect(stored.isBalanced).toBe(true);
    expect(stored.reference).toBe(`JRN-${RUN}`);
    expect(new Date(stored.postedAt).getTime()).toBe(new Date(entry.postedAt).getTime());
  });

  restartIt("persists a sponsor binding with its placement counter and fulfilment evidence", async () => {
    const engine = new SponsorshipEngine();
    engine.createEntitlement({
      id: `SPE-${RUN}`,
      sponsorName: "Durability Probe Beverages",
      brand: "ProbeCola",
      channelCode: "vmnl-main",
      programmeCode: "PROBE-SHOW",
      campaignCode: `CMP-${RUN}`,
      contractedOnScreenSeconds: 60,
      contractedBillboardsCount: 4,
      contractedLowerThirdsCount: 0,
      startDate: new Date(Date.UTC(2026, 9, 1)),
      endDate: new Date(Date.UTC(2026, 10, 1)),
    });
    const binding = engine.createBinding({
      id: `SPB-${RUN}`,
      // The entitlement itself is stated as process-side (CA-12 lists the binding),
      // so the durable row is the binding + its evidence, addressed by id.
      entitlementId: `SPE-${RUN}`,
      programmeCode: "PROBE-SHOW",
      daypart: "PRIME",
      assetType: "STING",
      assetId: "AST-PROBE-STING-15S",
      assetDurationSeconds: 15,
      requiredPlacementsPerEpisode: 2,
    });
    const firstAiring = engine.recordBindingFulfillment({
      bindingId: binding.id,
      episodeCode: `EP-${RUN}-01`,
      asRunLogId: `ARL-${RUN}-1`,
      airedAt: new Date(Date.UTC(2026, 9, 5, 20, 0, 0)),
    });
    const secondAiring = engine.recordBindingFulfillment({
      bindingId: binding.id,
      episodeCode: `EP-${RUN}-01`,
      asRunLogId: `ARL-${RUN}-2`,
      airedAt: new Date(Date.UTC(2026, 9, 6, 20, 0, 0)),
    });
    cleanup.push(
      () => getPrismaClient().sponsorFulfillmentRecord.deleteMany({ where: { bindingId: binding.id } }),
      () => getPrismaClient().sponsorBindingRecord.deleteMany({ where: { id: binding.id } })
    );

    const stored = (await restartRead("sponsorBinding", binding.id)) as unknown as SponsorBinding;
    // The delivery counter is the audited number — it must not reset to 0.
    expect(stored.fulfilledPlacements).toBe(2);
    expect(stored.requiredPlacementsPerEpisode).toBe(2);
    expect(stored.assetType).toBe("STING");
    expect(stored.entitlementId).toBe(`SPE-${RUN}`);
    expect(stored.daypart).toBe("PRIME");

    const evidence = (await restartRead(
      "sponsorFulfillment",
      `${binding.id}:${secondAiring.asRunLogId}`
    )) as unknown as typeof secondAiring;
    expect(evidence.bindingId).toBe(binding.id);
    expect(evidence.placementsFulfilled).toBe(1);
    expect(evidence.fulfillmentPercent).toBe(secondAiring.fulfillmentPercent);
    expect(evidence.isComplete).toBe(true);
    expect(new Date(evidence.airedAt).getTime()).toBe(new Date(secondAiring.airedAt).getTime());

    const firstEvidence = await restartRead("sponsorFulfillment", `${binding.id}:${firstAiring.asRunLogId}`);
    expect(firstEvidence.isComplete).toBe(false);
    expect(firstEvidence.fulfillmentPercent).toBe(50);
  });

  // TSK-60 box 3: the counterparty portal's record list is the Quote-to-Cash
  // portfolio, and until this store existed a process restart emptied it while
  // the page still labelled the rows canonical.
  restartIt("persists a signed deal through cash and recognition with every money counter exact", async () => {
    const engine = new QuoteToCashSalesEngine();
    const deal = engine.createDeal({
      id: `SD-${RUN}-FULL`,
      clientOrgId: `ORG-${RUN}-CLIENT`,
      dealName: "Durability probe sponsorship — prime-time billboards",
      // Every figure below is a multiple of 0.25, so both the domain arithmetic
      // and the Decimal(14,2) round trip are exact to the kobo.
      totalContractValueNgn: 7_500_000.5,
      salesLeadId: "usr-sales-lead",
    });
    engine.advanceStage(deal.id, "PROPOSAL");
    engine.signContract({ dealId: deal.id, salesLeadId: "usr-sales-lead", financeApproverId: "usr-finance-controller" });
    engine.recordDeposit(deal.id, 2_500_000.25);
    engine.generateInvoice(deal.id, "https://pof.vmnl.ng/probe-aircheck.pdf", 5_000_000.25);
    engine.recordCashPayment(deal.id, 5_000_000);
    engine.recognizeRevenue(deal.id, 0.25);
    const live = engine.getDeal(deal.id)!;
    expect(live.stage).toBe("REVENUE_RECOGNIZED");

    cleanup.push(() =>
      getPrismaClient().salesDealRecord.deleteMany({ where: { id: { in: [`SD-${RUN}-FULL`, `SD-${RUN}-LEAD`] } } })
    );

    const stored = (await restartRead("salesDeal", deal.id)) as unknown as SalesDeal;
    // The portal filters on clientOrgId: a portfolio that comes back scoped to
    // the wrong organisation leaks one counterparty's commercials to another.
    expect(stored.clientOrgId).toBe(`ORG-${RUN}-CLIENT`);
    expect(stored.dealName).toBe("Durability probe sponsorship — prime-time billboards");
    expect(stored.stage).toBe("REVENUE_RECOGNIZED");
    expect(stored.totalContractValueNgn).toBe(7_500_000.5);
    expect(stored.depositAmountNgn).toBe(2_500_000.25);
    expect(stored.invoicedAmountNgn).toBe(5_000_000.25);
    expect(stored.cashCollectedAmountNgn).toBe(7_500_000.25);
    expect(stored.recognizedRevenueNgn).toBe(7_500_000.5);
    // Canonical Law 7 across a restart: the durable record must not recognise
    // more than it was contracted for.
    expect(stored.recognizedRevenueNgn).toBeLessThanOrEqual(stored.totalContractValueNgn);
    expect(stored.proofOfPerformanceVerified).toBe(true);
    expect(stored.proofDocumentUrl).toBe("https://pof.vmnl.ng/probe-aircheck.pdf");
    // Dual authorisation is the evidence the contract is signed; both stamps and
    // the distinct approver must survive, or the desk re-signs a live contract.
    expect(stored.financeApproverId).toBe("usr-finance-controller");
    expect(new Date(stored.salesLeadApprovedAt!).getTime()).toBe(new Date(live.salesLeadApprovedAt!).getTime());
    expect(new Date(stored.financeApprovedAt!).getTime()).toBe(new Date(live.financeApprovedAt!).getTime());
    expect(new Date(stored.depositPaidAt!).getTime()).toBe(new Date(live.depositPaidAt!).getTime());
    expect(new Date(stored.createdAt).getTime()).toBe(new Date(live.createdAt).getTime());
  });

  restartIt("does not invent an approval stamp or proof document a deal never had", async () => {
    const engine = new QuoteToCashSalesEngine();
    const lead = engine.createDeal({
      id: `SD-${RUN}-LEAD`,
      clientOrgId: `ORG-${RUN}-CLIENT`,
      dealName: "Durability probe — unsigned lead",
      totalContractValueNgn: 1_250_000,
      salesLeadId: "usr-sales-lead",
    });

    const stored = (await restartRead("salesDeal", lead.id)) as unknown as SalesDeal;
    expect(stored.stage).toBe("LEAD");
    expect(stored.totalContractValueNgn).toBe(1_250_000);
    // NULL columns hydrate as absent fields, so the projection cannot claim a
    // signature, a deposit date or a proof document that was never recorded.
    expect(stored).not.toHaveProperty("salesLeadApprovedAt");
    expect(stored).not.toHaveProperty("financeApproverId");
    expect(stored).not.toHaveProperty("financeApprovedAt");
    expect(stored).not.toHaveProperty("depositPaidAt");
    expect(stored).not.toHaveProperty("proofDocumentUrl");
    expect(stored.proofOfPerformanceVerified).toBe(false);
    expect(stored.depositAmountNgn).toBe(0);
    expect(stored.recognizedRevenueNgn).toBe(0);
  });

  restartIt("reports every staged write as persisted, never as sandbox-deferred", () => {
    expect(getRepositoryMode()).toBe("fail_closed");
    expect(pendingDurableWrites()).toBe(0);
    const stats = durableJournalStats();
    expect(stats.failed).toBe(0);
    expect(stats.sandboxDeferred).toBe(0);
    // Thirteen entity writes above (the Quote-to-Cash probe adds two deal rows);
    // in-place mutations coalesce into one row each.
    expect(stats.persisted).toBeGreaterThanOrEqual(14);
  });
});

describe.skipIf(!DURABLE)("TSK-17: the HTTP response path is what drains the journal", () => {
  let app: ApiServerInstance;
  let port = 0;

  beforeAll(async () => {
    ensureCompiledArtifact();
    app = createApiServer(0, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
    port = (app.server.address() as { port: number }).port;
  }, 600_000);

  afterAll(async () => {
    await app.stop();
  });

  function request(
    method: string,
    urlPath: string,
    body?: Record<string, unknown>,
    extraHeaders?: Record<string, string>
  ): Promise<{ statusCode: number; json: Record<string, unknown> }> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          method,
          path: urlPath,
          headers: {
            "Content-Type": "application/json",
            "x-test-role": "SuperAdmin",
            ...extraHeaders,
            ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve({
              statusCode: res.statusCode ?? 0,
              json: text ? (JSON.parse(text) as Record<string, unknown>) : {},
            });
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  restartIt("a 201 enquiry response means the row is already in Postgres", async () => {
    const before = durableJournalStats().persisted;
    const res = await request("POST", "/api/v1/enquiries", {
      fullName: "Http Drain Probe",
      email: `drain+${RUN}@vmnl.ng`,
      organisationName: "VMNL Fixture Media",
      message: "Submits over the real router so the response choke point is proven.",
      ndprConsent: true,
      vertical: "SPONSORSHIP",
      idempotencyKey: `drain-idem-${RUN}`,
    });
    expect(res.statusCode).toBe(201);
    const reference = String(res.json.reference);
    expect(reference).toMatch(/^ENQ-\d{8}-[A-F0-9]{4}$/);

    // No test called flushDurableJournal(): sendJson did, and the child process
    // sees the row. That is the difference between a Map and a durable store.
    expect(pendingDurableWrites()).toBe(0);
    expect(durableJournalStats().persisted).toBeGreaterThan(before);
    const stored = await restartRead("enquiry", reference);
    expect(stored.fullName).toBe("Http Drain Probe");
    cleanup.push(() => getPrismaClient().commercialEnquiry.deleteMany({ where: { reference } }));

    // TSK-18 (box 1 + box 2): the ledger entry the enquiry recorded drained in
    // the SAME transaction as its row, and a second process can read it from the
    // table. Before this task the entry lived only in the writer's memory, so an
    // attested action could outlive its row — or vanish with the process while
    // the row stayed.
    const ledger = await restartRead("auditLedger", `CommercialEnquiry:${reference}`);
    expect(ledger.action).toBe("ENQUIRY_RECEIVED");
    expect(ledger.hashPayload).toContain(reference);
    cleanup.push(() => getPrismaClient().auditLog.deleteMany({ where: { resourceId: reference } }));
  });

  restartIt("fails closed with 503 and rolls the approval back when Postgres rejects the row", async () => {
    // 1e13 NGN does not fit the Decimal(14,2) scope column, so the durable write
    // is rejected — the response must not be a 201, and the optimistic index
    // entry must not survive it.
    const res = await request("POST", "/api/v1/workspace/approvals", {
      category: "FINANCIAL_ADJUSTMENT",
      subject: "Overflow scope proves the fail-closed path",
      justification: "TSK-17 negative control over the real HTTP path.",
      financialScopeNgn: 1e13,
      objectRevision: 1,
    });

    expect(res.statusCode).toBe(503);
    expect(res.json.code).toBe("REPOSITORY_UNAVAILABLE");
    // Rolled back out of the read index: nothing is left claiming the write landed.
    expect(
      listAllApprovals().filter((item) => item.subject === "Overflow scope proves the fail-closed path")
    ).toEqual([]);
    expect(pendingDurableWrites()).toBe(0);
  });

  restartIt("refuses a provider replay in a process that never saw the original webhook (TSK-19)", async () => {
    // AUD-07's claim lived only in the KV backend: lose Redis and restart, and
    // the provider's retry was free to credit the same payment twice. The
    // unique row is now the authority, so the child below — a fresh OS process
    // with an empty in-memory KV adapter and no knowledge of the event — must
    // still be refused.
    const secret = `tsk19-durability-secret-${RUN}`;
    const previousSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = secret;
    const eventId = Number(`${Date.now()}${process.pid}`.replace(/\D/g, "").slice(0, 14));
    const payload = {
      event: "charge.success",
      data: {
        id: eventId,
        reference: `TSK19-${RUN}`,
        amount: 100_000,
        currency: "NGN",
        status: "success",
      },
    };

    try {
      const signature = createHmac("sha512", secret).update(JSON.stringify(payload)).digest("hex");
      const delivered = await request("POST", "/api/v1/webhooks/paystack", payload, {
        "x-paystack-signature": signature,
      });
      expect(delivered.statusCode).toBe(200);
      expect(delivered.json.message).toBe("Paystack webhook processed");
      expect(delivered.json.duplicate).toBeUndefined();

      const row = await getPrismaClient().providerEventClaim.findUnique({
        where: { id: `paystack:${eventId}` },
      });
      expect(row?.provider).toBe("paystack");
      expect(row?.eventId).toBe(String(eventId));
      cleanup.push(() =>
        getPrismaClient().providerEventClaim.deleteMany({
          where: { provider: "paystack", eventId: String(eventId) },
        })
      );

      const record = await restartRead("providerClaim", `paystack:${eventId}`);
      expect(record.replayRefused).toBe(true);
      // TSK-19: the second phase is what makes the refusal safe. A new process
      // sees the *stamped* row, so it refuses the replay instead of taking the
      // claim over — and the stamp it read is the one this process wrote before
      // answering 200, i.e. ingestion progress itself survived the restart.
      expect(typeof record.ingestedAt).toBe("string");
      expect(Number.isNaN(Date.parse(String(record.ingestedAt)))).toBe(false);

      // Same provider, same process, seconds later: refused by the KV mirror this
      // time, and answered with the 200 marker that makes the provider stop.
      const replay = await request("POST", "/api/v1/webhooks/paystack", payload, {
        "x-paystack-signature": signature,
      });
      expect(replay.statusCode).toBe(200);
      expect(replay.json.duplicate).toBe(true);
      expect(replay.json.message).toBe("Paystack webhook duplicate acknowledged");
    } finally {
      if (previousSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
      else process.env.PAYSTACK_SECRET_KEY = previousSecret;
    }
  });
});

describe.skipIf(!DURABLE)("TSK-17: the journal fails closed when a durable write is rejected", () => {
  interface NegativePayload {
    id: string;
  }
  const optimisticIndex = new Map<string, string>();

  beforeAll(() => {
    registerDurableStore<NegativePayload>("durability-negative-control", async (payload) => {
      // Stands in for a constraint violation on a *reachable* database.
      throw new Error(`[TSK-17 TEST] durable write rejected for ${payload.id}`);
    });
  });

  restartIt("runs the rollback and throws RepositoryUnavailableError in fail-closed mode", async () => {
    optimisticIndex.set("nc-1", "optimistic entry that must not survive");
    stageDurableWrite<NegativePayload>({
      store: "durability-negative-control",
      key: "nc-1",
      payload: { id: "nc-1" },
      rollback: () => optimisticIndex.delete("nc-1"),
    });
    expect(pendingDurableWrites()).toBe(1);

    let thrown: unknown;
    try {
      await flushDurableJournal();
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(RepositoryUnavailableError);
    expect((thrown as RepositoryUnavailableError).code).toBe("REPOSITORY_UNAVAILABLE");
    expect((thrown as RepositoryUnavailableError).status).toBe(503);
    // The optimistic read-index entry is gone: nothing claims a write that failed.
    expect(optimisticIndex.size).toBe(0);
    expect(pendingDurableWrites()).toBe(0);
    expect(durableJournalStats().failed).toBeGreaterThanOrEqual(1);
  });

  restartIt("refuses to stage a write for a store nobody registered", () => {
    expect(() =>
      stageDurableWrite({
        store: "no-such-durable-store",
        key: "x",
        payload: {},
        rollback: () => {},
      })
    ).toThrowError(/no persister registered/);
  });
});
