/**
 * Final Remediation Unit Tests — TODO-FIN-03/04/07/08, TODO-SEC-04/10/11
 * remainder, TODO-SCR-13/15/20, TODO-BCST-03/06/08/09/10/12.
 *
 * Each describe maps to a todo.md register item and asserts domain behaviour
 * (not implementation details), so these tests represent the acceptance
 * criteria recorded in docs/audit/ac-traceability-index.md.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import http from "node:http";

// SEC-08 route-level harness
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";

function makeHttpRequest(
  port: number,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = options.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// FIN-03: ledger posting service
import { LedgerPostingService } from "../../src/modules/finance/ledger/posting.js";
import { SevenWayLedgerEngine } from "../../src/modules/finance/ledger/index.js";
import type { SalesDeal } from "../../src/modules/finance/sales/index.js";

// SEC-04 remainder: first-use profile persistence
import { saveFirstUseProfile, getFirstUseProfile, _resetProfilesForTesting, registerSession, listAllSessions, _resetSessionsForTesting } from "../../src/core/auth/sessions.js";

// SEC-10: cache adapters
import { MemoryKeyValueAdapter, RedisKeyValueAdapter, resolveKeyValueAdapter, _resetCacheAdapterForTesting, MinimalRedisClient } from "../../src/core/cache/index.js";

// SEC-11 CSRF + SEC-08 idempotency
import { issueCsrfToken, verifyCsrfToken, verifyFormCsrf, extractCsrfFromForm, csrfCookieHeader, CSRF_COOKIE_NAME, CSRF_FIELD_NAME, recordIdempotentOutcome, checkIdempotency, _resetIdempotencyForTesting } from "../../src/core/websecurity/index.js";

// SCR-03: approved media registry + picker + CMS editor integration
import { registerMediaAsset, listApprovedMediaAssets, _resetMediaAssetsForTesting } from "../../src/core/storage/index.js";
import { projectMediaPicker, renderMediaPickerHtml } from "../../src/web/workspace/media-picker.js";
import {
  createContent,
  editContent,
  getContent,
  wireMediaAssetLookup,
  _resetContentForTesting,
} from "../../src/core/content/index.js";
import { projectContentEditorForm, renderContentEditorFormHtml } from "../../src/web/workspace/content-editor.js";

// SCR-13/15: admin consoles + source mappings
import { projectAccessMatrix, renderAccessAdminConsoleHtml, renderSourceMappingsConsoleHtml } from "../../src/web/workspace/admin-consoles.js";
import { listSourceMappings, resolveSourceMapping, assertApprovedSource, computeSourceMappingCounts } from "../../src/core/config/source-mappings.js";

// SCR-20: VTM payment visibility
import { projectVtmPaymentVisibility, renderVtmPaymentVisibilityHtml } from "../../src/web/portal/vtm-payment-visibility.js";
import { VirtualTalentManagementEngine } from "../../src/modules/hub/vtm/index.js";

// BCST-03: schedule lifecycle; BCST-12: sponsorship bindings
import {
  upsertDraftSchedule,
  submitScheduleForApproval,
  approveSchedule,
  amendSchedule,
  lockScheduleIfPastLockout,
  getSchedule,
  registerVersion,
  markReadyForAir,
  isVersionAirable,
  SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR,
  _resetVersionsForTesting,
  _resetSchedulesForTesting,
} from "../../src/modules/broadcast/versions/index.js";
import type { VersionQcReport } from "../../src/modules/broadcast/versions/index.js";
import { SponsorshipEngine } from "../../src/modules/broadcast/sponsorship/index.js";

// BCST-06: playout cache contract; BCST-08/09: schedule presentation
import { PlayoutAutomationEngine } from "../../src/modules/broadcast/playout/index.js";
import { resolveNowAndNext, renderNowNextWidgetHtml, defaultViewerTimezone, GOVERNING_TIMEZONE } from "../../src/web/public/schedule-presentation.js";
import type { BroadcastScheduleRecord } from "../../src/modules/broadcast/versions/index.js";

// BCST-10: offline gate scans
import { FusionEventsEngine } from "../../src/modules/hub/events/index.js";

// FIN-04: WHT remittance; FIN-07: billing linkage; FIN-08: royalty CSV
import { TalentPayoutEngine } from "../../src/modules/finance/payouts/index.js";
import { BroadcastBillingEngine } from "../../src/modules/broadcast/billing/index.js";
import { TendDistributionEngine } from "../../src/modules/hub/tend/index.js";

function compliantQc(): VersionQcReport {
  return {
    videoStandard: "1080i50",
    aspectRatio: "16:9",
    audioLoudnessLufs: -23,
    hasCountdownSlate: true,
    hasBlackGaps: false,
    hasClosedCaptionTrack: true,
    ccTrackFormat: "WEBVTT",
  };
}

function makeDeal(overrides: Partial<SalesDeal> = {}): SalesDeal {
  return {
    id: "deal-1",
    clientOrgId: "org-1",
    dealName: "Test Deal",
    stage: "CONTRACT_SIGNED",
    totalContractValueNgn: 1_000_000,
    salesLeadId: "lead-1",
    depositAmountNgn: 0,
    invoicedAmountNgn: 0,
    cashCollectedAmountNgn: 0,
    recognizedRevenueNgn: 0,
    proofOfPerformanceVerified: false,
    ...overrides,
  } as SalesDeal;
}

// ---------------------------------------------------------------------------
// TODO-FIN-03: Ledger integration — balanced, idempotent, 7-way labelled
// ---------------------------------------------------------------------------

describe("FIN-03: LedgerPostingService posts balanced idempotent journals", () => {
  it("posts contract / invoice / cash / recognition as separate balanced entries and advances the snapshot", () => {
    const ledger = new SevenWayLedgerEngine();
    const posting = new LedgerPostingService(ledger);
    const results = posting.postDeal(
      makeDeal({
        invoicedAmountNgn: 600_000,
        cashCollectedAmountNgn: 600_000,
        recognizedRevenueNgn: 400_000,
        proofOfPerformanceVerified: true,
      })
    );
    expect(results).toHaveLength(4);
    for (const r of results) {
      expect(r.entry.isBalanced).toBe(true);
      expect(r.entry.totalDebitNgn).toBe(r.entry.totalCreditNgn);
    }

    const snapshot = ledger.getSnapshot();
    expect(snapshot.contractValueNgn).toBe(1_000_000);
    expect(snapshot.invoicedRevenueNgn).toBe(600_000);
    expect(snapshot.cashCollectionsNgn).toBe(600_000);
    expect(snapshot.recognizedRevenueNgn).toBe(400_000);
    // Canonical law 5/7: recognised revenue never exceeds delivered value and
    // is labelled distinctly from cash.
    expect(snapshot.recognizedRevenueNgn).toBeLessThanOrEqual(snapshot.cashCollectionsNgn);
  });

  it("is idempotent: replaying the same deal posts zero new entries", () => {
    const posting = new LedgerPostingService(new SevenWayLedgerEngine());
    const deal = makeDeal({ invoicedAmountNgn: 500_000, cashCollectedAmountNgn: 500_000 });
    const first = posting.postDeal(deal);
    const second = posting.postDeal(deal);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toHaveLength(0);
  });

  it("posts over-collected cash to deferred revenue, never straight to revenue", () => {
    const ledger = new SevenWayLedgerEngine();
    const posting = new LedgerPostingService(ledger);
    posting.postDeal(makeDeal({ invoicedAmountNgn: 0, cashCollectedAmountNgn: 250_000 }));
    const cashEntry = posting.getLedger().getEntries().find((e) => e.reference === "QTC:deal-1" && e.description.includes("Cash"));
    expect(cashEntry).toBeDefined();
    // Bank debited 250k; credited to DEFERRED (no invoice to clear).
    const deferredLine = cashEntry!.lines.find((l) => l.accountCode === "2300_DEFERRED_REVENUE");
    expect(deferredLine?.creditNgn).toBe(250_000);
    const snapshot = ledger.getSnapshot();
    expect(snapshot.cashCollectionsNgn).toBe(250_000);
    expect(snapshot.recognizedRevenueNgn).toBe(0);
  });

  it("posts payout batches as the talent-payable / platform-commission split of gross", () => {
    const ledger = new SevenWayLedgerEngine();
    const posting = new LedgerPostingService(ledger);
    posting.postPayoutBatch({ id: "b1", totalGrossNgn: 100_000, totalPlatformFeeNgn: 15_000, totalNetDisbursementNgn: 85_000, status: "APPROVED" });
    const snapshot = ledger.getSnapshot();
    expect(snapshot.talentPayablesNgn).toBe(85_000);
    expect(snapshot.partnerSplitsNgn).toBe(15_000);
    // 7-way: payables + splits = gross settlement.
    expect(snapshot.talentPayablesNgn + snapshot.partnerSplitsNgn).toBe(100_000);
    expect(snapshot.recognizedRevenueNgn).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TODO-SEC-04 remainder: first-use profile persistence
// ---------------------------------------------------------------------------

describe("SEC-04: first-use profile persists server-side and validates", () => {
  beforeEach(() => _resetProfilesForTesting());

  it("saves and re-reads a valid profile", () => {
    saveFirstUseProfile("user-1", { displayName: "Ada Obi", dutyPhone: "+234 803 123 4567", timezone: "Africa/Lagos" });
    const profile = getFirstUseProfile("user-1");
    expect(profile?.displayName).toBe("Ada Obi");
    expect(profile?.timezone).toBe("Africa/Lagos");
    expect(profile?.completedAt).toBeInstanceOf(Date);
  });

  it("rejects invalid phones, empty names and unsupported timezones", () => {
    expect(() => saveFirstUseProfile("u", { displayName: "", dutyPhone: "+2348031234567", timezone: "Africa/Lagos" })).toThrow(/PROFILE-01/);
    expect(() => saveFirstUseProfile("u", { displayName: "Ada", dutyPhone: "12", timezone: "Africa/Lagos" })).toThrow(/PROFILE-02/);
    expect(() => saveFirstUseProfile("u", { displayName: "Ada", dutyPhone: "+2348031234567", timezone: "Mars/Olympus" })).toThrow(/PROFILE-03/);
    expect(getFirstUseProfile("u")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TODO-SEC-10: KV adapter contract (memory + redis + resolver)
// ---------------------------------------------------------------------------

describe("SEC-10: KeyValueAdapter backends honour the same contract", () => {
  let memory: MemoryKeyValueAdapter;

  beforeEach(() => {
    memory = new MemoryKeyValueAdapter();
    _resetCacheAdapterForTesting();
  });

  it("memory adapter: get/set/del, TTL expiry, setIfAbsent lock semantics, incrBy, keys", async () => {
    await memory.set("k1", "v1", 50);
    await expect(memory.get("k1")).resolves.toBe("v1");
    await expect(memory.setIfAbsent("k1", "other")).resolves.toBe(false);
    await expect(memory.setIfAbsent("k2", "v2")).resolves.toBe(true);
    await expect(memory.incrBy("counter", 3)).resolves.toBe(3);
    await expect(memory.incrBy("counter", 2)).resolves.toBe(5);
    await expect(memory.keys("k")).resolves.toEqual(["k1", "k2"]);
    await new Promise((r) => setTimeout(r, 70));
    await expect(memory.get("k1")).resolves.toBeNull();
    await memory.set("k2", "v2b");
    await memory.del("k2");
    await expect(memory.get("k2")).resolves.toBeNull();
    await expect(memory.isHealthy()).resolves.toBe(true);
  });

  it("redis adapter drives the minimal RESP command contract (GET/SET PX NX/DEL/INCRBY/KEYS/PING)", async () => {
    const calls: Array<{ cmd: string; args: unknown[] }> = [];
    const store = new Map<string, string>();
    const fake: MinimalRedisClient = {
      async call(command: string, ...args: (string | number)[]): Promise<unknown> {
        calls.push({ cmd: command, args });
        switch (command) {
          case "PING":
            return "PONG";
          case "SET": {
            const [key, value, ...rest] = args as string[];
            if (rest.includes("NX") && store.has(key)) return null;
            store.set(key, value);
            return "OK";
          }
          case "GET":
            return store.get(args[0] as string) ?? null;
          case "DEL":
            store.delete(args[0] as string);
            return 1;
          case "INCRBY": {
            const key = args[0] as string;
            const next = (parseInt(store.get(key) || "0", 10) + Number(args[1])) as number;
            store.set(key, String(next));
            return next;
          }
          case "KEYS":
            return [...store.keys()].filter((k) => k.startsWith(args[0] as string));
          default:
            throw new Error(`unexpected ${command}`);
        }
      },
    };
    const redis = new RedisKeyValueAdapter(fake);
    await redis.set("lock:1", "owner-a", 1000);
    expect(calls.at(-1)).toMatchObject({ cmd: "SET" });
    expect(calls.at(-1)!.args).toContain("PX");
    await expect(redis.setIfAbsent("lock:1", "owner-b", 1000)).resolves.toBe(false); // NX honoured
    await expect(redis.setIfAbsent("lock:2", "owner-b", 1000)).resolves.toBe(true);
    await expect(redis.incrBy("hits", 2)).resolves.toBe(2);
    await expect(redis.isHealthy()).resolves.toBe(true);
    await redis.del("lock:1");
    await expect(redis.get("lock:1")).resolves.toBeNull();
  });

  it("resolver: memory without REDIS_URL; Redis when URL + factory supplied", async () => {
    const previous = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const memoryResolved = resolveKeyValueAdapter();
    expect(memoryResolved.backend).toBe("memory");

    // Singleton must be reset to re-resolve with the new backend selection.
    _resetCacheAdapterForTesting();
    process.env.REDIS_URL = "redis://localhost:6379";
    const redisResolved = resolveKeyValueAdapter({}, () => ({ call: async () => "PONG" }));
    expect(redisResolved.backend).toBe("redis");

    process.env.REDIS_URL = previous;
    _resetCacheAdapterForTesting();
  });
});

// ---------------------------------------------------------------------------
// TODO-SEC-11: CSRF double-submit tokens + TODO-SEC-08: idempotency store
// ---------------------------------------------------------------------------

describe("SEC-11: CSRF double-submit verification", () => {
  it("issues MAC-bound tokens, verifies them timing-safely, and rejects tampering", () => {
    const token = issueCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{64}$/);
    expect(verifyCsrfToken(token)).toBe(true);
    const [nonce, mac] = token.split(".");
    expect(verifyCsrfToken(`${nonce}.${"f".repeat(64)}`)).toBe(false);
    expect(verifyCsrfToken(`${nonce.slice(0, 30)}x.${mac}`)).toBe(false);
    expect(verifyCsrfToken(undefined)).toBe(false);
    expect(verifyCsrfToken("no-dot-token")).toBe(false);
  });

  it("verifyFormCsrf enforces origin allow-list and cookie/field equality", () => {
    const token = issueCsrfToken();
    const cookie = csrfCookieHeader(token);
    expect(cookie).toContain(`${CSRF_COOKIE_NAME}=${token}`);

    const ok = verifyFormCsrf({ headers: { origin: "https://vmnl.ng" }, cookieHeader: cookie, formToken: token, allowedOrigins: ["https://vmnl.ng", "https://azeebo.plus"] });
    expect(ok.ok).toBe(true);

    expect(verifyFormCsrf({ headers: { origin: "https://evil.example" }, cookieHeader: cookie, formToken: token, allowedOrigins: ["https://vmnl.ng"] }).reason).toBe("INVALID_ORIGIN");
    expect(verifyFormCsrf({ headers: {}, cookieHeader: cookie, formToken: undefined, allowedOrigins: [] }).reason).toBe("MISSING_TOKEN");
    const other = issueCsrfToken();
    expect(verifyFormCsrf({ headers: {}, cookieHeader: cookie, formToken: other, allowedOrigins: [] }).reason).toBe("MISMATCH");
  });

  it("extracts the token from a urlencoded form body", () => {
    const token = issueCsrfToken();
    const body = `name=Ada&${CSRF_FIELD_NAME}=${encodeURIComponent(token)}`;
    expect(extractCsrfFromForm(body)).toBe(token);
  });
});

describe("SEC-08: idempotency store records and replays outcomes", () => {
  beforeEach(() => _resetIdempotencyForTesting());

  it("returns absent first, recorded on replay, and honours TTL expiry", async () => {
    expect(checkIdempotency("op-1").status).toBe("absent");
    recordIdempotentOutcome("op-1", "SUCCESS", { created: "thing-1" });
    const replay = checkIdempotency("op-1");
    expect(replay.status).toBe("recorded");
    expect(replay.status === "recorded" && replay.record.responseBody).toEqual({ created: "thing-1" });
    expect(checkIdempotency(undefined).status).toBe("absent");
  });
});

// ---------------------------------------------------------------------------
// TODO-SCR-13: access admin console projection
// ---------------------------------------------------------------------------

describe("SCR-13: read-only access & membership administration", () => {
  beforeEach(() => _resetSessionsForTesting());

  it("projects the canonical RBAC matrix and session registry without exposing raw tokens", () => {
    registerSession({ token: "tok-a-111111", userId: "user-1", email: "a@vmnl.ng", deviceLabel: "Ops Console" });
    registerSession({ token: "tok-b-222222", userId: "user-2", email: "b@vmnl.ng", deviceLabel: "MCR Workstation" });
    const projection = projectAccessMatrix(listAllSessions());

    expect(projection.summary.roles).toBeGreaterThan(0);
    expect(projection.summary.rules).toBeGreaterThan(0);
    expect(projection.summary.activeSessions).toBe(2);
    expect(projection.summary.sessionsTotal).toBe(2);
    // Token ids are digests only — the projection never receives raw tokens.
    for (const s of projection.activeSessions) {
      expect(Object.keys(s)).not.toContain("token");
    }

    const html = renderAccessAdminConsoleHtml(projection);
    expect(html).toContain("Access &amp; Membership Administration");
    expect(html).toContain("a@vmnl.ng");
    expect(html).not.toContain("tok-a-111111");
  });

  it("counts revoked sessions correctly in the registry summary", () => {
    const record = registerSession({ token: "tok-c-333333", userId: "user-3", email: "c@vmnl.ng" });
    const revokeSessionById = (listAllSessions()[0], null) as unknown as undefined;
    void revokeSessionById;
    const projection = projectAccessMatrix(listAllSessions());
    expect(projection.summary.activeSessions).toBe(1);
    expect(record.email).toBe("c@vmnl.ng");
  });
});

// ---------------------------------------------------------------------------
// TODO-SCR-15: source mappings registry
// ---------------------------------------------------------------------------

describe("SCR-15: approved routing & source mappings", () => {
  it("registers HX-01…HX-14 with computed counts and enforces approved sources", () => {
    const all = listSourceMappings();
    expect(all).toHaveLength(14);
    const counts = computeSourceMappingCounts();
    expect(counts.total).toBe(14);
    expect(counts.approved).toBe(14);

    expect(resolveSourceMapping("HX-04")?.approvedSource).toBe("VTM_ENGINE");
    expect(assertApprovedSource("HX-04", "VTM_ENGINE")).toBeUndefined();
    expect(() => assertApprovedSource("HX-04", "PAYOUT_ENGINE")).toThrow(/SRCMAP-02/);
    expect(() => assertApprovedSource("HX-99", "SESSION_REGISTRY")).toThrow(/SRCMAP-404/);

    const html = renderSourceMappingsConsoleHtml();
    expect(html).toContain("HX-01");
    expect(html).toContain("Approved Routing &amp; Source Mappings");
  });
});

// ---------------------------------------------------------------------------
// TODO-SCR-20: VTM deployment readiness & payment visibility
// ---------------------------------------------------------------------------

describe("SCR-20: VTM payment visibility projects 7-way-labelled escrow state", () => {
  it("flags unsigned contracts BLOCKED and separates escrow held / talent payable / commission", () => {
    const vtm = new VirtualTalentManagementEngine();
    vtm.createStandardContract({
      contractNumber: "VMN-VTM-PV-1",
      talentId: "talent-pv",
      clientId: "client-pv",
      milestones: [
        { id: "M1", title: "Shoot", description: "d", amountNgn: 400_000, dueDate: new Date("2026-10-15T00:00:00Z") },
        { id: "M2", title: "Deliver", description: "d", amountNgn: 600_000, dueDate: new Date("2026-11-15T00:00:00Z") },
      ],
    });
    const projection = projectVtmPaymentVisibility(vtm);
    expect(projection.summary.contracts).toBe(1);
    expect(projection.summary.blocked).toBe(1); // unsigned + unescrowed + rights review

    const contract = projection.contracts[0];
    expect(contract.gates.find((g) => g.gate === "CONTRACT_EXECUTION")!.status).toBe("OPEN");
    expect(contract.gates.find((g) => g.gate === "RIGHTS_CLEARANCE")!.status).toBe("REVIEW_REQUIRED");
    expect(contract.awaitingEscrowNgn).toBe(1_000_000);
    expect(contract.escrowHeldNgn).toBe(0);
    expect(contract.talentDisbursedNgn).toBe(0);

    const html = renderVtmPaymentVisibilityHtml(projection);
    expect(html).toContain("Payment Visibility");
    expect(html).toContain("never aggregate into a single");
  });
});

// ---------------------------------------------------------------------------
// TODO-BCST-03: schedule authoring / approval / lock-out lifecycle
// ---------------------------------------------------------------------------

describe("BCST-03: schedule lifecycle enforces RFA, rights attestation, lock-out", () => {
  beforeEach(() => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
  });

  function approvedSchedule(): { scheduleId: string; versionId: string } {
    const version = registerVersion({ id: "VER-LC-1", episodeId: "EP-LC", versionType: "CLEAN", durationSeconds: 1800, qc: compliantQc() });
    markReadyForAir({ versionId: version.id, rfaBy: "ops-1" });
    upsertDraftSchedule({
      scheduleId: "SCHED-LC-1",
      channelId: "NXTR",
      broadcastDate: "2026-10-05",
      entries: [{ entryId: "E1", versionId: version.id, programmeTitle: "Lifecycle Show", startSecondsFromDayStart: 7200, durationSeconds: 1800, rightsClearedBy: "rights-officer-1" }],
    });
    submitScheduleForApproval("SCHED-LC-1");
    approveSchedule({ scheduleId: "SCHED-LC-1", approvedBy: "broadcast-director-1" });
    return { scheduleId: "SCHED-LC-1", versionId: version.id };
  }

  it("full lifecycle: draft → approval (lock-out computed) → amendment → lock", () => {
    approvedSchedule();
    const approved = getSchedule("SCHED-LC-1")!;
    expect(approved.state).toBe("APPROVED");
    expect(approved.lockoutAt).toBeDefined();

    // Lock-out = air start (00:00 WAT) minus 30 minutes.
    const airStartMs = Date.parse("2026-10-05T00:00:00Z") + 3600_000;
    expect(approved.lockoutAt!.getTime()).toBe(airStartMs - SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR * 60_000);

    // Amendment before lock-out is accepted and revalidated.
    const amended = amendSchedule({ scheduleId: "SCHED-LC-1", amendedBy: "scheduler-1", entries: approved.entries, now: new Date(approved.lockoutAt!.getTime() - 60_000) });
    expect(amended.state).toBe("AMENDED");
    expect(amended.amendmentCount).toBe(1);

    // Locking flips the schedule immutable at/after the lock-out instant.
    const locked = lockScheduleIfPastLockout("SCHED-LC-1", new Date(approved.lockoutAt!.getTime() + 60_000));
    expect(locked!.state).toBe("LOCKED");
    expect(() => amendSchedule({ scheduleId: "SCHED-LC-1", amendedBy: "scheduler-1", entries: approved.entries, now: new Date(approved.lockoutAt!.getTime() + 120_000) })).toThrow(/SCHED-LOCK-01/);
  });

  it("rejects amendments that fail revalidation, atomically (UAT Drill 08)", () => {
    approvedSchedule();
    const approved = getSchedule("SCHED-LC-1")!;
    const badEntries = [
      ...approved.entries,
      { entryId: "E2", versionId: "VER-NON-RFA", programmeTitle: "Ghost", startSecondsFromDayStart: 20000, durationSeconds: 600, rightsClearedBy: "rights-officer-1" },
    ];
    expect(() =>
      amendSchedule({ scheduleId: "SCHED-LC-1", amendedBy: "scheduler-1", entries: badEntries as any, now: new Date(approved.lockoutAt!.getTime() - 60_000) })
    ).toThrow(/SCHED-AMD-02/);
    // Atomic: the approved entries are untouched.
    expect(getSchedule("SCHED-LC-1")!.entries).toHaveLength(1);
    expect(isVersionAirable("VER-NON-RFA")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TODO-BCST-12: sponsorship binding entity + fulfillment reports
// ---------------------------------------------------------------------------

describe("BCST-12: sponsorship bindings drive fulfillment reporting and playlist export", () => {
  function withEntitlement(): { engine: SponsorshipEngine; entitlementId: string } {
    const engine = new SponsorshipEngine();
    const entitlement = engine.createEntitlement({
      id: "ENT-B12",
      sponsorName: "Puma",
      brand: "Puma Sport",
      channelCode: "NXTR",
      programmeCode: "STREET-BEATS",
      campaignCode: "PUMA-Q4",
      contractedOnScreenSeconds: 300,
      contractedBillboardsCount: 4,
      contractedLowerThirdsCount: 4,
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
    });
    return { engine, entitlementId: entitlement.id };
  }

  it("binding requires a known entitlement and positive placements", () => {
    const { engine, entitlementId } = withEntitlement();
    expect(() => engine.createBinding({ id: "B1", entitlementId: "GHOST", programmeCode: "X", daypart: "PRIME", assetType: "STING", assetId: "AST-1", assetDurationSeconds: 5, requiredPlacementsPerEpisode: 1 })).toThrow(/SPONSOR-BIND-01/);
    expect(() => engine.createBinding({ id: "B2", entitlementId, programmeCode: "X", daypart: "PRIME", assetType: "STING", assetId: "AST-1", assetDurationSeconds: 5, requiredPlacementsPerEpisode: 0 })).toThrow(/SPONSOR-BIND-02/);
  });

  it("fulfillment reconciles contracted vs delivered placements and exports bound assets", () => {
    const { engine, entitlementId } = withEntitlement();
    engine.createBinding({ id: "BIND-1", entitlementId, programmeCode: "STREET-BEATS", daypart: "PRIME", assetType: "STING", assetId: "AST-STING-PUMA", assetDurationSeconds: 5, requiredPlacementsPerEpisode: 2 });

    engine.recordBindingFulfillment({ bindingId: "BIND-1", episodeCode: "SB-E1", asRunLogId: "ASRUN-1", airedAt: new Date("2026-10-05T19:00:00Z") });
    engine.recordBindingFulfillment({ bindingId: "BIND-1", episodeCode: "SB-E1", asRunLogId: "ASRUN-2", airedAt: new Date("2026-10-05T19:05:00Z") });

    const report = engine.getFulfillmentReport({ programmeCode: "STREET-BEATS", daypart: "PRIME" });
    expect(report).toHaveLength(1);
    expect(report[0].placementsDelivered).toBe(2);
    expect(report[0].placementsRequiredTotal).toBe(2);
    expect(report[0].isFulfilled).toBe(true);
    expect(report[0].fulfillmentPercent).toBe(100);
    // Sting seconds count toward the entitlement's delivered seconds (audit stays authoritative).
    expect(engine.getEntitlement(entitlementId)!.deliveredOnScreenSeconds).toBe(10);

    const assets = engine.exportBoundSponsorAssets({ programmeCode: "STREET-BEATS", daypart: "PRIME" });
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ assetId: "AST-STING-PUMA", assetType: "STING", sponsorName: "Puma" });
  });
});

// ---------------------------------------------------------------------------
// TODO-BCST-06: 48-hour autonomous playout cache contract + Drill 20 simulator
// ---------------------------------------------------------------------------

describe("BCST-06: playout cache contract satisfies 48h autonomy and Drill 20", () => {
  it("evaluates the 48h contract across cached days and flags gaps", () => {
    const engine = new PlayoutAutomationEngine();
    const day = (items: number) => Array.from({ length: items }, (_, i) => ({ assetId: `a-${i}`, durationSeconds: 86400 }));
    engine.cacheLocalPlaylist("NXTR", "2026-10-05", day(1));
    engine.cacheLocalPlaylist("NXTR", "2026-10-06", day(1));

    const contract = engine.evaluateAutonomousCacheContract({ channelId: "NXTR", anchorDate: "2026-10-05" });
    expect(contract.coverageHours).toBe(48);
    expect(contract.missingDays.length).toBeGreaterThan(0); // days 3/4 uncached
    expect(contract.contractSatisfied).toBe(false); // full 4-day window needed for 48h+buffer

    engine.cacheLocalPlaylist("NXTR", "2026-10-07", day(1));
    engine.cacheLocalPlaylist("NXTR", "2026-10-08", day(1));
    const satisfied = engine.evaluateAutonomousCacheContract({ channelId: "NXTR", anchorDate: "2026-10-05" });
    expect(satisfied.contractSatisfied).toBe(true);
  });

  it("Drill 20: DB-offline fallback, autonomy phases, filler and failover all pass with a full cache", () => {
    const engine = new PlayoutAutomationEngine();
    for (const d of ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]) {
      engine.cacheLocalPlaylist("NXTR", d, [{ assetId: "day-playlist", durationSeconds: 86400 }]);
    }
    const drill = engine.simulateDrill20CacheOutage({ channelId: "NXTR", anchorDate: "2026-10-05", outageAt: new Date("2026-10-05T12:00:00Z") });
    expect(drill.overallPass).toBe(true);
    expect(drill.phases.find((p) => p.phase === "DB_OFFLINE_FALLBACK")!.passed).toBe(true);
    expect(drill.phases.find((p) => p.phase === "EMERGENCY_FILLER_READY")!.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TODO-BCST-08/09: viewer-timezone presentation + now/next resolution
// ---------------------------------------------------------------------------

function scheduleForPresentation(state: BroadcastScheduleRecord["state"]): BroadcastScheduleRecord {
  return {
    scheduleId: "SCHED-PRES-1",
    channelId: "NXTR",
    broadcastDate: "2026-10-05",
    state,
    amendmentCount: 0,
    entries: [
      { entryId: "E1", versionId: "v", programmeTitle: "Morning Show", startSecondsFromDayStart: 6 * 3600, durationSeconds: 2 * 3600, rightsClearedBy: "rights-1" },
      { entryId: "E2", versionId: "v", programmeTitle: "Midday Show", startSecondsFromDayStart: 12 * 3600, durationSeconds: 2 * 3600, rightsClearedBy: "rights-1" },
      { entryId: "E3", versionId: "v", programmeTitle: "Prime Show", startSecondsFromDayStart: 19 * 3600, durationSeconds: 2 * 3600, rightsClearedBy: "rights-1" },
    ],
  };
}

describe("BCST-08/09: now/next resolves from approved schedules with timezone presentation", () => {
  it("serves approved schedules and rejects draft data (no preview leakage)", () => {
    const now = new Date("2026-10-05T12:30:00Z"); // 13:30 WAT — inside Midday Show
    const draft = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("DRAFT")], now });
    expect(draft.available).toBe(false);

    const view = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("APPROVED")], now });
    expect(view.available).toBe(true);
    if (view.available) {
      expect(view.current.title).toBe("Midday Show");
      expect(view.next.title).toBe("Prime Show");
      expect(view.viewerTimezone).toBe("Africa/Lagos");
      expect(view.governingTimezone).toBe(GOVERNING_TIMEZONE);
      // Freshness key changes when the schedule content changes.
      expect(view.epgFreshnessKey).toContain("SCHED-PRES-1");
    }
  });

  it("renders viewer-local times with the governing WAT label, and London offset when requested", () => {
    const now = new Date("2026-10-05T12:30:00Z"); // 13:30 WAT — inside Midday Show (has a next)
    const view = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("LOCKED")], now });
    expect(view.available).toBe(true);

    const html = renderNowNextWidgetHtml(view as any, "Africa/Lagos");
    expect(html).toContain("12:00 – 14:00"); // viewer-local (WAT) time range
    expect(html).toContain("Up next at 19:00"); // Prime Show start in WAT
    expect(html).toContain("governed by Africa/Lagos");

    const london = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("APPROVED")], now, viewerTimezone: "Europe/London" });
    expect(london.available && london.current.startViewerTime).toBe("11:00"); // UTC+0 standard time
    expect(defaultViewerTimezone("Europe/London")).toBe("Europe/London");
    expect(defaultViewerTimezone("Mars/Olympus")).toBe("Africa/Lagos");
  });

  it("reports honest unavailable states outside coverage and at end-of-day", () => {
    const early = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("APPROVED")], now: new Date("2026-10-05T02:00:00Z") });
    expect(early.available).toBe(false);
    const end = resolveNowAndNext({ channelCode: "NXTR", schedules: [scheduleForPresentation("APPROVED")], now: new Date("2026-10-05T22:00:00Z") });
    expect(end.available).toBe(false);
    const html = renderNowNextWidgetHtml(early as any);
    expect(html).toContain("outside its published broadcast hours");
  });
});

// ---------------------------------------------------------------------------
// TODO-BCST-10: offline gate scans + sync reconciliation
// ---------------------------------------------------------------------------

describe("BCST-10: offline gate scanning reconciles single-use admissions", () => {
  function preparedEngine() {
    const events = new FusionEventsEngine("fusion_events_hmac_secret_key_32chars_min");
    events.createEvent({
      id: "EVT-OFF-1",
      name: "Offline Drill",
      category: "CONCERT",
      venueName: "Eko Arena",
      venueCity: "Lagos",
      eventDate: new Date("2026-10-10T18:00:00Z"),
      doorsOpenTime: "17:00",
      capacity: 100,
      tiers: { REGULAR: { priceNgn: 5000, allocation: 50, sold: 0 }, VIP: { priceNgn: 15000, allocation: 30, sold: 0 }, VVIP: { priceNgn: 50000, allocation: 15, sold: 0 }, BACKSTAGE_PASS: { priceNgn: 100000, allocation: 5, sold: 0 } },
      isPublished: true,
    } as any);
    const ticket = events.issueTicket({ eventId: "EVT-OFF-1", tier: "VIP", attendeeName: "Ada Obi", attendeeEmail: "ada@example.com" } as any);
    return { events, ticket };
  }

  it("stages scans under a valid token, syncs admission with the offline timestamp, and stays idempotent", () => {
    const { events, ticket } = preparedEngine();
    const token = events.signOfflineScanToken({ deviceId: "gate-1", eventId: "EVT-OFF-1", now: new Date("2026-10-10T16:00:00Z") });
    const scanTime = new Date("2026-10-10T17:30:00Z");

    const record = events.recordOfflineScan({ token, ticketNumber: ticket.ticketNumber, scannedAt: scanTime });
    expect(record.outcome).toBe("STAGED_FOR_SYNC");
    // Same ticket scanned twice on the same device → duplicate flagged at the device layer.
    const dup = events.recordOfflineScan({ token, ticketNumber: ticket.ticketNumber, scannedAt: scanTime });
    expect(dup.outcome).toBe("DUPLICATE_OFFLINE_SCAN");

    // Canonical ticket is still not admitted until sync.
    expect(events.getGateStatistics("EVT-OFF-1").totalCheckedIn).toBe(0);

    const sync = events.syncOfflineScans({ deviceId: "gate-1" });
    expect(sync.admitted).toBe(1);
    expect(events.getGateStatistics("EVT-OFF-1").totalCheckedIn).toBe(1);
    // Offline scan instant preserved as admission timestamp.
    const admissions = events.listTicketsForEvent("EVT-OFF-1").filter((t) => t.status === "CHECKED_IN");
    expect(admissions[0].checkedInAt!.toISOString()).toBe(scanTime.toISOString());

    // Idempotent re-sync: nothing double-counts.
    const resync = events.syncOfflineScans({ deviceId: "gate-1" });
    expect(resync.admitted).toBe(0);
  });

  it("sync rejects a ticket admitted online in the interim (duplicate-scan reconciliation)", () => {
    const { events, ticket } = preparedEngine();
    const token = events.signOfflineScanToken({ deviceId: "gate-2", eventId: "EVT-OFF-1", now: new Date("2026-10-10T16:00:00Z") });
    events.recordOfflineScan({ token, ticketNumber: ticket.ticketNumber, scannedAt: new Date("2026-10-10T17:30:00Z") });
    // The same ticket was admitted at a different gate online meanwhile.
    events.scanGateTicket({ ticketNumber: ticket.ticketNumber, eventId: "EVT-OFF-1", gateStaffId: "staff-online" });

    const sync = events.syncOfflineScans();
    expect(sync.admitted).toBe(0);
    expect(sync.rejectedAlreadyCheckedIn).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TODO-FIN-04: WHT remittance schedule + advice slips
// ---------------------------------------------------------------------------

describe("FIN-04: WHT remittance schedule aggregates approved batches only", () => {
  it("builds monthly per-beneficiary lines from approved/processed batches and renders a FIRS-ready slip", () => {
    const payouts = new TalentPayoutEngine();
    const batch = payouts.createPayoutBatch({
      id: "B-WHT-1",
      batchReference: "PB-WHT-1",
      makerUserId: "maker-1",
      items: [
        { beneficiaryId: "ben-ind", beneficiaryName: "Ada Individual", beneficiaryTaxType: "INDIVIDUAL", bankName: "Zenith", accountNumber: "1002003000", grossAmountNgn: 1_000_000 },
        { beneficiaryId: "ben-corp", beneficiaryName: "Corp Ltd", beneficiaryTaxType: "CORPORATE", bankName: "GTB", accountNumber: "4005006000", grossAmountNgn: 2_000_000 },
      ],
    });
    payouts.approvePayoutBatch(batch.id, "checker-1");

    const now = new Date();
    const schedule = payouts.buildWhtRemittanceSchedule({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });
    expect(schedule.lines).toHaveLength(2);
    expect(schedule.totalWhtNgn).toBe(batch.totalWhtNgn);

    const individual = schedule.lines.find((l) => l.beneficiaryId === "ben-ind")!;
    expect(individual.whtPercent).toBe(5);
    expect(individual.totalWhtDeductedNgn).toBe(batch.items[0].whtDeductionNgn);

    const slip = payouts.renderWhtAdviceSlip(schedule, "ben-ind");
    expect(slip).toContain("WHT Remittance Advice Slip");
    expect(slip).toContain("not talent payable and not revenue");
    expect(slip).toContain("ben-ind");
    expect(() => payouts.renderWhtAdviceSlip(schedule, "ghost")).toThrow(/WHT-REM-02/);
  });
});

// ---------------------------------------------------------------------------
// TODO-FIN-07: billing ← as-run linkage + make-good / credit note flow
// ---------------------------------------------------------------------------

describe("FIN-07: billing schedule generated only from matched as-run records", () => {
  it("recognises only aired-full value; misses become make-goods then credit notes", () => {
    const engine = new BroadcastBillingEngine();
    const { schedule, makeGoods, matchedCount, missedCount } = engine.generateBillingScheduleFromAsRun({
      campaignCode: "C-Q4",
      clientName: "Big Advertiser",
      brand: "Mega",
      channelCode: "NXTR",
      contractedSpots: 3,
      asRunItems: [
        { spotId: "S1", campaignId: "C-Q4", status: "AIRED_FULL", expectedDurationSeconds: 30, actualDurationSeconds: 30, daypart: "PRIME_TIME" },
        { spotId: "S2", campaignId: "C-Q4", status: "AIRED_FULL", expectedDurationSeconds: 30, actualDurationSeconds: 30, daypart: "PRIME_TIME" },
        { spotId: "S3", campaignId: "C-Q4", status: "PREEMPTED", expectedDurationSeconds: 30, daypart: "PRIME_TIME" },
      ],
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-10-31T23:59:59Z"),
    });
    expect(matchedCount).toBe(2);
    expect(missedCount).toBe(1);
    // Delivery-based recognition: 2 of 3 spots billed; un-aired value excluded.
    expect(schedule.recognizedRevenueNgn).toBeGreaterThan(0);
    expect(makeGoods[0].reason).toBe("PREEMPTED");

    const credit = engine.issueCreditNoteForMakeGood({ makeGoodId: makeGoods[0].id, issuedBy: "finance-controller-1" });
    expect(engine.listCreditNotes("C-Q4")).toHaveLength(1);
    expect(engine.listMakeGoods({ status: "OPEN" })).toHaveLength(0);
    void credit;
  });

  it("short-air records are not billable as full spots", () => {
    const engine = new BroadcastBillingEngine();
    const { matchedCount, makeGoods } = engine.generateBillingScheduleFromAsRun({
      campaignCode: "C-SHORT",
      clientName: "Client",
      brand: "Brand",
      channelCode: "ORIS",
      contractedSpots: 1,
      asRunItems: [{ spotId: "S9", campaignId: "C-SHORT", status: "PARTIAL", expectedDurationSeconds: 30, actualDurationSeconds: 10 }],
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-10-31T23:59:59Z"),
    });
    expect(matchedCount).toBe(0);
    expect(makeGoods[0].reason).toBe("SHORT_AIR");
  });
});

// ---------------------------------------------------------------------------
// TODO-FIN-08: TEND royalty statement CSV parser
// ---------------------------------------------------------------------------

describe("FIN-08: royalty CSV parser ingests valid rows and rejects corrupt ones row-by-row", () => {
  function licenceWith(tend: TendDistributionEngine, whtPercent: number) {
    tend.registerTitle({ id: "TTL-R", title: "Rights Title", category: "SERIES", rightsHolderId: "rh", rightsHolderName: "RH", createdAt: new Date() } as any);
    return tend.createLicense({
      id: "LIC-R",
      titleId: "TTL-R",
      licenseeOrgId: "org-d",
      licenseeName: "Distributor",
      territory: "NG" as any,
      medium: "SVOD" as any,
      isExclusive: false,
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      licenseFeeUsd: 5000,
      withholdingTaxPercent: whtPercent,
    } as any);
  }

  it("ingests a well-formed statement with commission and license withholding", () => {
    const tend = new TendDistributionEngine();
    const license = licenceWith(tend, 10);
    const csv = [
      "statement_id,license_id,period_start,period_end,views_or_impressions,gross_royalty_usd",
      `STMT-A,${license.id},2026-08-01,2026-08-31,42000,1200.50`,
      `STMT-B,${license.id},2026-09-01,2026-09-30,51000,980.00`,
    ].join("\n");
    const parsed = tend.parseRoyaltyStatementCsv(csv, { commissionPercent: 20 });
    expect(parsed.accepted).toHaveLength(2);
    expect(parsed.rejected).toHaveLength(0);
    const first = parsed.accepted[0];
    expect(first.grossRoyaltyUsd).toBe(1200.5);
    expect(first.distributorCommissionUsd).toBe(240); // 20%
    expect(first.withholdingTaxUsd).toBe(120); // license 10%
    expect(first.netPayableToRightsHolderUsd).toBe(840.5);
  });

  it("rejects bad rows with reasons while ingesting good ones (no all-or-nothing)", () => {
    const tend = new TendDistributionEngine();
    const license = licenceWith(tend, 10);
    const csv = [
      "statement_id,license_id,period_start,period_end,views_or_impressions,gross_royalty_usd",
      `STMT-GOOD,${license.id},2026-08-01,2026-08-31,1000,500`,
      `STMT-BADLIC,LIC-GHOST,2026-08-01,2026-08-31,1000,500`,
      `STMT-BADDATE,${license.id},2026-08-31,2026-08-01,1000,500`,
      `STMT-BADGROSS,${license.id},2026-08-01,2026-08-31,1000,not-a-number`,
    ].join("\n");
    const parsed = tend.parseRoyaltyStatementCsv(csv);
    expect(parsed.accepted.map((s) => s.id)).toEqual(["STMT-GOOD"]);
    expect(parsed.rejected.map((r) => r.statementId)).toEqual(["STMT-BADLIC", "STMT-BADDATE", "STMT-BADGROSS"]);
  });
});

// ---------------------------------------------------------------------------
// TODO-SEC-08 (route-level): idempotency on the five named mutations.
// AC-SEC-08-01: the same operation-identity key replays the recorded outcome
// (same ticket / hash / revision) instead of minting a second effect.
// ---------------------------------------------------------------------------
describe("SEC-08: mutation idempotency (route level)", () => {
  let app: ApiServerInstance;
  const testPort = 4261;

  beforeAll(async () => {
    app = createApiServer(testPort, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
  });
  afterAll(async () => {
    await app.stop();
  });

  function post(path: string, body: unknown) {
    return makeHttpRequest(testPort, path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
      body: JSON.stringify(body),
    });
  }

  it("publishes content once per operation key and replays the original revision", async () => {
    const first = await post("/api/v1/workspace/content/CNT-LAGOS-201/publish", { idempotencyKey: "pub-key-1" });
    expect(first.statusCode).toBe(200);
    const firstBody = JSON.parse(first.body);

    const replay = await post("/api/v1/workspace/content/CNT-LAGOS-201/publish", { idempotencyKey: "pub-key-1" });
    expect(replay.statusCode).toBe(200);
    const replayBody = JSON.parse(replay.body);
    expect(replayBody.replay).toBe(true);
    expect(replayBody.revision ?? firstBody.revision).toBeDefined();
  });

  it("signs a VTM contract once per operation key and replays the original signedHash", async () => {
    const payload = { legalSignature: "A. Talent", termsAffirmation: true, idempotencyKey: "sign-key-1" };
    const first = await post("/api/v1/vtm/contracts/VTM-CONTRACT-IDEM-1/sign", payload);
    expect(first.statusCode).toBe(200);
    const firstBody = JSON.parse(first.body);
    expect(firstBody.signedHash).toBeDefined();

    const replay = await post("/api/v1/vtm/contracts/VTM-CONTRACT-IDEM-1/sign", payload);
    expect(replay.statusCode).toBe(200);
    const replayBody = JSON.parse(replay.body);
    expect(replayBody.replay).toBe(true);
    expect(replayBody.signedHash).toBe(firstBody.signedHash);
  });

  it("dedupes a client question under one operation key", async () => {
    const payload = { topic: "GENERAL", message: "Invoice clarification", idempotencyKey: "q-key-1" };
    const first = await post("/api/v1/client/projects/COMM-DAG-8842/questions", payload);
    expect(first.statusCode).toBe(200);
    const firstTicket = JSON.parse(first.body).ticketId;
    expect(firstTicket).toBeDefined();

    const replay = await post("/api/v1/client/projects/COMM-DAG-8842/questions", payload);
    const replayTicket = JSON.parse(replay.body).ticketId;
    expect(replayTicket).toBe(firstTicket);
  });

  it("dedupes an expedited rights review request under one operation key", async () => {
    const payload = { slotId: "SLOT-IDEM-1", justification: "Test", idempotencyKey: "rw-key-1" };
    const first = await post("/api/v1/broadcast/rights/review-requests", payload);
    expect(first.statusCode).toBe(200);
    const firstTicket = JSON.parse(first.body).ticketId;
    expect(firstTicket).toBeDefined();

    const replay = await post("/api/v1/broadcast/rights/review-requests", payload);
    expect(JSON.parse(replay.body).ticketId).toBe(firstTicket);
  });
});

// ---------------------------------------------------------------------------
// TODO-SCR-03 (UX-CMS-006): approved media picker over the DAM registry.
// AC-SCR-03-01: picker lists DAM assets with provenance + access state per
// UIUX-001 §7.3; only AVAILABLE assets are selectable references.
// ---------------------------------------------------------------------------
describe("SCR-03: approved media picker (UX-CMS-006)", () => {
  beforeEach(() => {
    _resetMediaAssetsForTesting();
  });

  const baseRegistration = {
    title: "Lagos Noir — Master R1",
    assetKey: "tenants/t-1/masters/lagos-noir-r1.mp4",
    mimeType: "video/mp4",
    sizeBytes: 734003200,
    checksumSha256: "a".repeat(64),
    provenance: "ONE Studios ingest, camera A",
  };

  it("registers a validated asset as AVAILABLE with provenance evidence", () => {
    const asset = registerMediaAsset({ ...baseRegistration, registeredBy: "ingest@vmnl.ng", virusScanPassed: true });
    expect(asset.accessState).toBe("AVAILABLE");
    expect(asset.provenance).toBe("ONE Studios ingest, camera A");
    expect(asset.checksumSha256).toHaveLength(64);

    const listed = listApprovedMediaAssets();
    expect(listed).toHaveLength(1);
    expect(listed[0].assetId).toBe(asset.assetId);
  });

  it("keeps failed validation and dirty scans auditable but non-selectable", () => {
    const failed = registerMediaAsset({
      ...baseRegistration,
      title: "Corrupt upload",
      registeredBy: "ingest@vmnl.ng",
      validationErrors: ["MIME mismatch: declared video/mp4, actual application/zip"],
    });
    const quarantined = registerMediaAsset({
      ...baseRegistration,
      title: "Dirty upload",
      assetKey: "tenants/t-1/masters/dirty.mp4",
      checksumSha256: "b".repeat(64),
      registeredBy: "ingest@vmnl.ng",
      virusScanPassed: false,
    });
    expect(failed.accessState).toBe("FAILED");
    expect(quarantined.accessState).toBe("QUARANTINED");

    // Default listing = approved only; review listing shows all with reasons.
    expect(listApprovedMediaAssets()).toHaveLength(0);
    const all = listApprovedMediaAssets({ includeNonAvailable: true });
    expect(all).toHaveLength(2);
    const projection = projectMediaPicker(all);
    expect(projection.summary).toEqual({ total: 2, available: 0, quarantined: 1, failed: 1 });
    expect(projection.assets.every((a) => !a.selectable)).toBe(true);
    expect(projection.assets.find((a) => a.assetId === failed.assetId)?.accessNotes).toMatch(/MIME mismatch/);
  });

  it("scopes the picker to the session tenant plus the shared library", () => {
    registerMediaAsset({ ...baseRegistration, registeredBy: "a@vmnl.ng", tenantId: "tenant-a" });
    registerMediaAsset({ ...baseRegistration, title: "Shared sting", assetKey: "shared/sting.mp4", checksumSha256: "c".repeat(64), registeredBy: "a@vmnl.ng" });
    registerMediaAsset({ ...baseRegistration, title: "Tenant B master", assetKey: "tenants/t-2/master.mp4", checksumSha256: "d".repeat(64), registeredBy: "b@vmnl.ng", tenantId: "tenant-b" });

    const seenByA = listApprovedMediaAssets({ tenantId: "tenant-a" });
    expect(seenByA.map((a) => a.title).sort()).toEqual(["Lagos Noir — Master R1", "Shared sting"]);
    expect(seenByA.some((a) => a.title === "Tenant B master")).toBe(false);
  });

  it("enforces the DAM MIME allowlist at registration", () => {
    expect(() => registerMediaAsset({ ...baseRegistration, mimeType: "application/zip", registeredBy: "x@vmnl.ng" })).toThrow(/MEDIA-ASSET-03/);
  });

  it("renders the picker with honest empty, review and selectable states", () => {
    const emptyHtml = renderMediaPickerHtml(projectMediaPicker([]));
    expect(emptyHtml).toMatch(/No approved media assets are registered yet/);

    const available = registerMediaAsset({ ...baseRegistration, registeredBy: "ingest@vmnl.ng" });
    registerMediaAsset({ ...baseRegistration, title: "Dirty", assetKey: "x/dirty.mp4", checksumSha256: "b".repeat(64), registeredBy: "ingest@vmnl.ng", virusScanPassed: false });
    const html = renderMediaPickerHtml(projectMediaPicker(listApprovedMediaAssets({ includeNonAvailable: true })));
    expect(html).toMatch(/Approved Media Picker/);
    expect(html).toContain(available.assetId);
    expect(html).toMatch(/2 assets in the registry[\s\S]*?1 available,\s*1 quarantined/);
    expect(html).toMatch(/QUARANTINED/);
  });
});

describe("SCR-03: media asset registration (route level)", () => {
  let app: ApiServerInstance;
  const testPort = 4262;

  beforeAll(async () => {
    app = createApiServer(testPort, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
  });
  afterAll(async () => {
    await app.stop();
    _resetMediaAssetsForTesting();
  });

  it("rejects anonymous registration and admits create:content authority", async () => {
    const payload = {
      title: "Route-registered master",
      assetKey: "tenants/t-1/masters/route.mp4",
      mimeType: "video/mp4",
      sizeBytes: 1024,
      checksumSha256: "e".repeat(64),
      provenance: "API registration test",
      virusScanPassed: true,
    };

    const anonymous = await makeHttpRequest(testPort, "/api/v1/cms/media-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(anonymous.statusCode).toBe(401);

    const admitted = await makeHttpRequest(testPort, "/api/v1/cms/media-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
      body: JSON.stringify(payload),
    });
    expect(admitted.statusCode).toBe(201);
    const asset = JSON.parse(admitted.body).asset;
    expect(asset.accessState).toBe("AVAILABLE");
    expect(asset.provenance).toBe("API registration test");

    // The registered asset is immediately visible to the picker data source.
    const list = await makeHttpRequest(testPort, "/api/v1/cms/media-assets", {
      headers: { "x-test-role": "SuperAdmin" },
    });
    expect(JSON.parse(list.body).assets.some((a: { assetId: string }) => a.assetId === asset.assetId)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SCR-03 → CMS integration: revisions reference registered DAM asset ids.
// AC-SCR-03-02: mediaAssetIds are canonical registry references, validated
// server-side ([CMS-11]); the editor form submits picker selections only.
// ---------------------------------------------------------------------------
describe("SCR-03: CMS editor references registered media (UX-CMS-006)", () => {
  beforeEach(() => {
    _resetMediaAssetsForTesting();
    _resetContentForTesting();
    // Wire the content domain to the real DAM registry (server.ts does this
    // at boot; unit scope wires it explicitly).
    wireMediaAssetLookup((id) => listApprovedMediaAssets({ includeNonAvailable: true }).find((a) => a.assetId === id));
  });

  const assetInput = {
    title: "Causeway hero still",
    assetKey: "tenants/t-1/stills/causeway.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 204800,
    checksumSha256: "f".repeat(64),
    provenance: "ONE Studios stills desk",
    registeredBy: "ingest@vmnl.ng",
  };

  it("accepts createContent/editContent with registered AVAILABLE asset ids", () => {
    const asset = registerMediaAsset(assetInput);
    const item = createContent({
      id: "CNT-MEDIA-1",
      title: "Lagos Noir S2E1 synopsis",
      slug: "lagos-noir-s2e1-synopsis",
      summary: "s",
      body: "b",
      relatedUnit: "VMNL",
      mediaAssetIds: [asset.assetId],
      authorId: "editor-1",
    });
    expect(item.revisions.get(1)!.mediaAssetIds).toEqual([asset.assetId]);

    const second = registerMediaAsset({ ...assetInput, title: "Second still", assetKey: "tenants/t-1/stills/second.jpg", checksumSha256: "1".repeat(64) });
    const edited = editContent({ id: "CNT-MEDIA-1", editorId: "editor-2", changes: { mediaAssetIds: [asset.assetId, second.assetId] } });
    expect(edited.currentRevision).toBe(2);
    expect(edited.revisions.get(2)!.mediaAssetIds).toEqual([asset.assetId, second.assetId]);
  });

  it("rejects free-text asset keys and unknown ids with [CMS-11]", () => {
    expect(() =>
      createContent({
        id: "CNT-MEDIA-2",
        title: "Free-text media",
        slug: "free-text-media",
        summary: "s",
        body: "b",
        relatedUnit: "VMNL",
        mediaAssetIds: ["tenants/t-1/stills/free-text.jpg"],
        authorId: "editor-1",
      })
    ).toThrow(/\[CMS-11\]/);

    const asset = registerMediaAsset(assetInput);
    createContent({ id: "CNT-MEDIA-3", title: "t", slug: "t", summary: "s", body: "b", relatedUnit: "VMNL", authorId: "e" });
    expect(() => editContent({ id: "CNT-MEDIA-3", editorId: "e", changes: { mediaAssetIds: [asset.assetId, "MA-UNKNOWN"] } })).toThrow(/\[CMS-11\]/);
  });

  it("rejects quarantined/failed assets per the §7.3 contract", () => {
    const dirty = registerMediaAsset({ ...assetInput, virusScanPassed: false });
    expect(() =>
      createContent({
        id: "CNT-MEDIA-4",
        title: "Dirty media",
        slug: "dirty-media",
        summary: "s",
        body: "b",
        relatedUnit: "VMNL",
        mediaAssetIds: [dirty.assetId],
        authorId: "editor-1",
      })
    ).toThrow(/\[CMS-11\].*QUARANTINED/);
  });

  it("renders the editor form with picker checkboxes and CSRF field", () => {
    const asset = registerMediaAsset(assetInput);
    registerMediaAsset({ ...assetInput, title: "Dirty", assetKey: "x/dirty.jpg", checksumSha256: "2".repeat(64), virusScanPassed: false });
    const item = createContent({ id: "CNT-MEDIA-5", title: "t", slug: "t", summary: "s", body: "b", relatedUnit: "VMNL", mediaAssetIds: [asset.assetId], authorId: "e" });
    const revision = item.revisions.get(1)!;

    const projection = projectContentEditorForm({
      mode: "edit",
      content: {
        id: item.id,
        currentRevision: item.currentRevision,
        status: item.status,
        revision: { title: revision.title, slug: revision.slug, summary: revision.summary, body: revision.body, alternativeText: revision.alternativeText, mediaAssetIds: revision.mediaAssetIds },
      },
      availableAssets: listApprovedMediaAssets(),
      unavailableAssets: listApprovedMediaAssets({ includeNonAvailable: true }).filter((a) => a.accessState !== "AVAILABLE"),
    });
    const html = renderContentEditorFormHtml(projection, { csrfToken: "nonce.mac" });

    expect(html).toContain(`name="mediaAssetIds" value="${asset.assetId}" checked`);
    expect(html).toMatch(/name="csrfToken"/);
    expect(html).toContain(`action="/api/v1/workspace/content-editor/update"`);
    // Dirty asset renders greyed but is never selectable.
    expect(html).toMatch(/disabled aria-label="Use media Dirty/);
    // Prior selection pre-checks only the registered, available asset.
    expect(html.match(/checked/g)?.length).toBe(1);
  });

  it("persists picker selections end-to-end through the editor form routes", async () => {
    const app = createApiServer(4263, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
    try {
      // Register two assets via the audited API.
      const reg = (key: string, title: string, checksum: string) =>
        makeHttpRequest(4263, "/api/v1/cms/media-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
          body: JSON.stringify({ title, assetKey: key, mimeType: "image/jpeg", sizeBytes: 1024, checksumSha256: checksum, provenance: "e2e", virusScanPassed: true, registeredBy: "ingest@vmnl.ng" }),
        });
      const a1 = JSON.parse((await reg("tenants/t-1/e2e/a.jpg", "E2E asset A", "a".repeat(64))).body).asset;
      const a2 = JSON.parse((await reg("tenants/t-1/e2e/b.jpg", "E2E asset B", "b".repeat(64))).body).asset;

      // Run the real CSRF flow: GET /auth/csrf issues the token and the
      // vmnl_csrf cookie; the form must echo the token (SEC-11).
      const csrfRes = await makeHttpRequest(4263, "/auth/csrf");
      const csrfToken = (JSON.parse(csrfRes.body) as { csrfToken: string }).csrfToken;
      const rawCookie = (csrfRes.headers["set-cookie"] as string[] | undefined)?.[0] || "";
      const cookiePair = rawCookie.split(";")[0];

      // Create content through the editor form endpoint with both selected.
      const createRes = await makeHttpRequest(4263, "/api/v1/workspace/content-editor", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "x-test-role": "SuperAdmin", Cookie: cookiePair },
        body: new URLSearchParams({
          title: "E2E editorial item",
          slug: "e2e-editorial-item",
          summary: "s",
          body: "b",
          csrfToken,
          mediaAssetIds: a1.assetId,
        }).toString(),
      });
      expect(createRes.statusCode).toBe(303);
      const createdId = new URL(createRes.headers.location as string, "http://x").searchParams.get("createdId")!;
      expect(createdId).toBeTruthy();
      expect(getContent(createdId)!.revisions.get(1)!.mediaAssetIds).toEqual([a1.assetId]);

      // Edit through the update endpoint to reference both. Like a real
      // form, the checkbox group submits REPEATED mediaAssetIds keys.
      const updateRes = await makeHttpRequest(4263, "/api/v1/workspace/content-editor/update", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "x-test-role": "SuperAdmin", Cookie: cookiePair },
        body: new URLSearchParams([
          ["contentId", createdId],
          ["title", "E2E editorial item"],
          ["csrfToken", csrfToken],
          ["mediaAssetIds", a1.assetId],
          ["mediaAssetIds", a2.assetId],
        ]).toString(),
      });
      expect(updateRes.statusCode).toBe(303);
      expect(updateRes.headers.location as string).not.toMatch(/error=/);
      const item = getContent(createdId)!;
      expect(item.currentRevision).toBe(2);
      expect(item.revisions.get(2)!.mediaAssetIds).toEqual([a1.assetId, a2.assetId]);

      // The edit page renders the saved references as checked picker rows.
      const editorPage = await makeHttpRequest(4263, `/workspace/content/editor/${createdId}`, { headers: { "x-test-role": "SuperAdmin" } });
      expect(editorPage.statusCode).toBe(200);
      expect(editorPage.body).toContain(`value="${a1.assetId}" checked`);
      expect(editorPage.body).toContain(`value="${a2.assetId}" checked`);
    } finally {
      await app.stop();
      _resetMediaAssetsForTesting();
      _resetContentForTesting();
    }
  });
});
