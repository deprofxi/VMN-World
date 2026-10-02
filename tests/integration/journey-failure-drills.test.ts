/**
 * Journey Failure Drills — TODO-PRC-03 (CCPP §5.7 pattern / UIUX-001 §11)
 *
 * Companion to tests/integration/enquiry-failure-drill.test.ts (J-RL1-03).
 * Exercises the recovery behaviour of the materially implemented journeys
 * J-RL1-04 (application), J-RL1-08 (schedule review), J-RL1-09 (rights
 * request), J-RL1-10 (reconciliation), J-RL1-11 (publication), J-RL1-12
 * (Azeebo+/VTM navigation) and the finance P8 journeys against their real
 * engines: invalid input, missing records, unauthorized mutation and
 * blocked states must fail safely with honest errors and no partial writes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AfcaAdmissionsService } from "../../src/modules/hub/afca/admissions.js";
import { BroadcastTrafficEngine } from "../../src/modules/broadcast/traffic/index.js";
import { BroadcastBillingEngine } from "../../src/modules/broadcast/billing/index.js";
import { reconcileAsRunLogs } from "../../src/modules/broadcast/asrun/index.js";
import { TendDistributionEngine } from "../../src/modules/hub/tend/index.js";
import { VirtualTalentManagementEngine } from "../../src/modules/hub/vtm/index.js";
import { TalentPayoutEngine } from "../../src/modules/finance/payouts/index.js";
import { FusionEventsEngine } from "../../src/modules/hub/events/index.js";
import {
  registerVersion,
  markReadyForAir,
  isVersionAirable,
  upsertDraftSchedule,
  submitScheduleForApproval,
  approveSchedule,
  amendSchedule,
  getSchedule,
  _resetVersionsForTesting,
  _resetSchedulesForTesting,
} from "../../src/modules/broadcast/versions/index.js";
import type { VersionQcReport } from "../../src/modules/broadcast/versions/index.js";

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

describe("Failure drills — J-RL1-04 AFCA application journey (CCPP §5.7)", () => {
  it("DRILL-APP-01: lookup of an unknown reference returns an honest null (no soft-404 phantom)", async () => {
    const existing = await AfcaAdmissionsService.getByReference("APP-DOES-NOT-EXIST");
    expect(existing).toBeNull();
  });

  it("DRILL-APP-02: decision on an unknown reference fails safely", async () => {
    await expect(
      AfcaAdmissionsService.recordDecision({
        reference: "APP-UNKNOWN-REF",
        reviewerId: "rev-1",
        decision: "ACCEPT" as any,
        notes: "",
        scores: undefined,
      })
    ).rejects.toThrow();
  });
});

describe("Failure drills — J-RL1-08 schedule review & mid-day amendment", () => {
  beforeEach(() => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
  });

  it("DRILL-SCHED-01: amendment after lock-out is rejected atomically and the schedule locks (UAT Drill 08)", () => {
    const version = registerVersion({ id: "VER-DRILL-1", episodeId: "EP-1", versionType: "CLEAN", durationSeconds: 1800, qc: compliantQc() });
    markReadyForAir({ versionId: version.id, rfaBy: "ops-1" });
    expect(isVersionAirable(version.id)).toBe(true);

    upsertDraftSchedule({
      scheduleId: "SCHED-DRILL-1",
      channelId: "NXTR",
      broadcastDate: "2026-09-30",
      entries: [{ entryId: "E1", versionId: version.id, programmeTitle: "Prime Show", startSecondsFromDayStart: 3600, durationSeconds: 1800, rightsClearedBy: "rights-officer-1" }],
    });
    submitScheduleForApproval("SCHED-DRILL-1");
    const approved = approveSchedule({ scheduleId: "SCHED-DRILL-1", approvedBy: "broadcast-director-1" });

    // 1 minute before lock-out: amendment succeeds and flips state to AMENDED.
    const justBefore = new Date(approved.lockoutAt!.getTime() - 60_000);
    const amended = amendSchedule({ scheduleId: "SCHED-DRILL-1", amendedBy: "scheduler-1", entries: approved.entries, now: justBefore });
    expect(amended.state).toBe("AMENDED");

    // After lock-out: the amendment is rejected and the schedule is LOCKED;
    // the previously approved entries are preserved unchanged.
    const after = new Date(approved.lockoutAt!.getTime() + 60_000);
    expect(() => amendSchedule({ scheduleId: "SCHED-DRILL-1", amendedBy: "scheduler-1", entries: approved.entries, now: after })).toThrow(/LOCKED/);
    expect(getSchedule("SCHED-DRILL-1")!.state).toBe("LOCKED");
    expect(getSchedule("SCHED-DRILL-1")!.entries).toHaveLength(1);
  });
});

describe("Failure drills — J-RL1-09 rights-attested schedule writes", () => {
  beforeEach(() => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
  });

  it("DRILL-RIGHTS-01: a schedule entry without rights attestation is rejected before approval", () => {
    const version = registerVersion({ id: "VER-DRILL-2", episodeId: "EP-2", versionType: "CLEAN", durationSeconds: 600, qc: compliantQc() });
    markReadyForAir({ versionId: version.id, rfaBy: "ops-1" });
    upsertDraftSchedule({
      scheduleId: "SCHED-DRILL-2",
      channelId: "NXTR",
      broadcastDate: "2026-10-01",
      entries: [{ entryId: "E1", versionId: version.id, programmeTitle: "No Rights Show", startSecondsFromDayStart: 0, durationSeconds: 600, rightsClearedBy: "" }],
    });
    expect(() => submitScheduleForApproval("SCHED-DRILL-2")).toThrow(/SCHED-RIGHTS-01/);
    // No partial state: the schedule must remain in DRAFT — it never advanced.
    expect(getSchedule("SCHED-DRILL-2")!.state).toBe("DRAFT");
  });
});

describe("Failure drills — J-RL1-10 reconciliation & make-good credit flow", () => {
  it("DRILL-RECON-01: preempted as-run spots become make-good obligations, and credit notes reconcile them", () => {
    const engine = new BroadcastBillingEngine();
    const report = reconcileAsRunLogs("NXTR", [
      {
        spotId: "SPOT-A",
        campaignId: "CAMP-1",
        clientName: "Client A",
        status: "AIRED_FULL",
        expectedDurationSeconds: 30,
        actualDurationSeconds: 30,
        actualStartTime: new Date(),
      },
      {
        spotId: "SPOT-B",
        campaignId: "CAMP-1",
        clientName: "Client A",
        status: "PREEMPTED",
        expectedDurationSeconds: 30,
        actualStartTime: new Date(),
      },
    ] as any);
    expect(report.totalAiredFull).toBe(1);
    expect(report.makeGoodCreditsRequired).toBe(1);

    const { makeGoods } = engine.generateBillingScheduleFromAsRun({
      campaignCode: "CAMP-1",
      clientName: "Client A",
      brand: "Brand A",
      channelCode: "NXTR",
      contractedSpots: 2,
      asRunItems: [
        { spotId: "SPOT-A", campaignId: "CAMP-1", status: "AIRED_FULL", expectedDurationSeconds: 30, actualDurationSeconds: 30 },
        { spotId: "SPOT-B", campaignId: "CAMP-1", status: "PREEMPTED", expectedDurationSeconds: 30 },
      ],
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-09-30T23:59:59Z"),
    });
    expect(makeGoods).toHaveLength(1);
    expect(makeGoods[0].reason).toBe("PREEMPTED");

    const credit = engine.issueCreditNoteForMakeGood({ makeGoodId: makeGoods[0].id, issuedBy: "finance-controller-1" });
    expect(credit.valueNgn).toBe(makeGoods[0].valueNgn);
    expect(engine.listMakeGoods({ status: "OPEN" })).toHaveLength(0);
    expect(engine.listCreditNotes("CAMP-1")).toHaveLength(1);
  });

  it("DRILL-RECON-02: double-crediting the same make-good is rejected", () => {
    const engine = new BroadcastBillingEngine();
    const { makeGoods } = engine.generateBillingScheduleFromAsRun({
      campaignCode: "CAMP-2",
      clientName: "Client B",
      brand: "Brand B",
      channelCode: "ORIS",
      contractedSpots: 1,
      asRunItems: [{ spotId: "SPOT-X", campaignId: "CAMP-2", status: "TECHNICAL_ERROR", expectedDurationSeconds: 30 }],
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-09-30T23:59:59Z"),
    });
    engine.issueCreditNoteForMakeGood({ makeGoodId: makeGoods[0].id, issuedBy: "finance-controller-1" });
    expect(() => engine.issueCreditNoteForMakeGood({ makeGoodId: makeGoods[0].id, issuedBy: "finance-controller-1" })).toThrow(/BIL-MG-02/);
  });
});

describe("Failure drills — J-RL1-11 content publication gates", () => {
  beforeEach(() => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
  });

  it("DRILL-PUB-01: non-RFA media cannot enter an approved broadcast schedule (publication blocked upstream)", () => {
    // Failed QC with no override → never airable → never approvable.
    const failed = registerVersion({
      id: "VER-FAILED-QC",
      episodeId: "EP-3",
      versionType: "MASTER",
      durationSeconds: 900,
      qc: { ...compliantQc(), hasBlackGaps: true },
    });
    expect(failed.qcStatus).toBe("FAILED");
    expect(isVersionAirable(failed.id)).toBe(false);

    upsertDraftSchedule({
      scheduleId: "SCHED-DRILL-3",
      channelId: "IMBD",
      broadcastDate: "2026-10-02",
      entries: [{ entryId: "E1", versionId: failed.id, programmeTitle: "Unverified Master", startSecondsFromDayStart: 0, durationSeconds: 900, rightsClearedBy: "rights-officer-1" }],
    });
    // Draft staging may happen, but approval validation is the hard gate.
    expect(() => submitScheduleForApproval("SCHED-DRILL-3")).toThrow(/SCHED-VAL-02/);
    expect(getSchedule("SCHED-DRILL-3")!.state).toBe("DRAFT");

    // With an explicit override, RFA is possible and the schedule becomes approvable.
    markReadyForAir({ versionId: failed.id, rfaBy: "broadcast-director-1", overrideReason: "Master control technical review approved deviation (drill evidence)" });
    expect(isVersionAirable(failed.id)).toBe(true);
    expect(() => submitScheduleForApproval("SCHED-DRILL-3")).not.toThrow();
  });
});

describe("Failure drills — J-RL1-12 Azeebo+ / VTM escrow navigation", () => {
  it("DRILL-NAV-01: escrow release requires signed contract and submitted milestone (no partial release)", () => {
    const vtm = new VirtualTalentManagementEngine();
    const contract = vtm.createStandardContract({
      contractNumber: "VMN-VTM-DRILL-1",
      talentId: "talent-1",
      clientId: "client-1",
      milestones: [{ id: "M1", title: "Milestone 1", description: "d", amountNgn: 100000, dueDate: new Date("2026-10-15T00:00:00Z") }],
    });
    // Escrow deposit before dual signature must fail (canonical law 9).
    expect(() => vtm.depositMilestoneEscrow(contract.id, "M1")).toThrow(/VTM-ESC-01/);
    // Release before deposit/submission must also fail.
    expect(() => vtm.releaseMilestoneEscrow(contract.id, "M1", "talent-manager-1")).toThrow();
    // Canonical state unchanged: milestone still PENDING_DEPOSIT.
    const after = vtm.listContracts().find((c) => c.id === contract.id)!;
    expect(after.milestones[0].status).toBe("PENDING_DEPOSIT");
  });
});

describe("Failure drills — finance journeys (P8) reconciliation safety", () => {
  it("DRILL-FIN-01: duplicate as-run spot ids abort billing generation without partial schedules", () => {
    const engine = new BroadcastBillingEngine();
    expect(() =>
      engine.generateBillingScheduleFromAsRun({
        campaignCode: "CAMP-3",
        clientName: "Client C",
        brand: "Brand C",
        channelCode: "NXTR",
        contractedSpots: 2,
        asRunItems: [
          { spotId: "SPOT-DUP", campaignId: "CAMP-3", status: "AIRED_FULL", expectedDurationSeconds: 30, actualDurationSeconds: 30 },
          { spotId: "SPOT-DUP", campaignId: "CAMP-3", status: "AIRED_FULL", expectedDurationSeconds: 30, actualDurationSeconds: 30 },
        ],
        startDate: new Date("2026-09-01T00:00:00Z"),
        endDate: new Date("2026-09-30T23:59:59Z"),
      })
    ).toThrow(/BIL-ASRUN-03/);
    expect(engine.getBillingSchedule("CAMP-3")).toBeUndefined();
  });

  it("DRILL-FIN-02: unapproved payout batches never enter the WHT remittance schedule", () => {
    const payouts = new TalentPayoutEngine();
    payouts.createPayoutBatch({
      id: "BATCH-DRILL-1",
      batchReference: "PB-DRILL-1",
      makerUserId: "maker-1",
      items: [{ beneficiaryId: "ben-1", beneficiaryName: "Ben One", beneficiaryTaxType: "INDIVIDUAL", bankName: "Zenith", accountNumber: "1234567890", grossAmountNgn: 1000000 }],
    });
    const schedule = payouts.buildWhtRemittanceSchedule({ year: new Date().getUTCFullYear(), month: new Date().getUTCMonth() + 1 });
    expect(schedule.lines).toHaveLength(0); // DRAFT batch is not remittable evidence
    expect(() => payouts.renderWhtAdviceSlip(schedule, "ben-1")).toThrow(/WHT-REM-02/);
  });

  it("DRILL-FIN-03: royalty CSV row with a tampered withholding percent is rejected, not substituted", () => {
    const tend = new TendDistributionEngine();
    tend.registerTitle({
      id: "TTL-DRILL-1",
      title: "Drill Title",
      category: "FILM",
      rightsHolderId: "rh-1",
      rightsHolderName: "Rights Holder",
      createdAt: new Date(),
    } as any);
    const license = tend.createLicense({
      id: "LIC-DRILL-1",
      titleId: "TTL-DRILL-1",
      licenseeOrgId: "org-1",
      licenseeName: "Distributor One",
      territory: "NG" as any,
      medium: "SVOD" as any,
      isExclusive: false,
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T00:00:00Z"),
      licenseFeeUsd: 1000,
    } as any);

    const csv = [
      "statement_id,license_id,period_start,period_end,views_or_impressions,gross_royalty_usd,withholding_tax_percent",
      `STMT-1,${license.id},2026-08-01,2026-08-31,1000,500.00,9`,
    ].join("\n");
    const parsed = tend.parseRoyaltyStatementCsv(csv);
    expect(parsed.accepted).toHaveLength(0);
    expect(parsed.rejected).toHaveLength(1);
    expect(parsed.rejected[0].error).toMatch(/withholding_tax_percent/);
  });
});

describe("Failure drills — offline gate scanning (BCST-10 companion)", () => {
  it("DRILL-GATE-01: expired offline tokens are refused and nothing reaches the sync queue", () => {
    const events = new FusionEventsEngine("fusion_events_hmac_secret_key_32chars_min");
    const token = events.signOfflineScanToken({ deviceId: "device-1", eventId: "EVT-DRILL", validHours: 1, now: new Date("2026-09-29T10:00:00Z") });
    // Scan attempted AFTER the token window expired — must be refused outright.
    const record = events.recordOfflineScan({ token, ticketNumber: "TCK-1", scannedAt: new Date("2026-09-30T10:00:00Z") });
    expect(record.outcome).toBe("TOKEN_EXPIRED");
    expect(events.getOfflineScanQueueSize()).toBe(0);
  });
});

describe("Failure drills — traffic engine resilience (UAT Drill 5 companion)", () => {
  it("DRILL-TRAFFIC-01: booking into an unknown break fails loudly and does not enqueue make-good silently", () => {
    const traffic = new BroadcastTrafficEngine();
    expect(() =>
      traffic.scheduleSpot({ breakId: "NOPE", spotId: "S1", campaignId: "C1", brandCategory: "BANKING_FINTECH", brandName: "Bank", durationSeconds: 30, qcStatus: "APPROVED" })
    ).toThrow(/not found/);
    expect(traffic.getMakeGoodQueue()).toHaveLength(0);
  });
});
