/**
 * TSK-12 (report.md CA-14) — the schedule lifecycle IS the PRD §15 machine.
 *
 * CA-14's finding was not that five states were wrong in isolation, but that
 * `TODO-BCST-03` was declared closed on the strength of a machine the authority
 * does not describe: `DRAFT | PENDING_APPROVAL | APPROVED | AMENDED | LOCKED`
 * against "DRAFT → PROGRAMMING REVIEW → RIGHTS CHECK → TRAFFIC READY → APPROVED →
 * PLAYLIST GENERATED → ON AIR → AS-RUN RECONCILED → ARCHIVED"
 * (`docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md` §15), with revision
 * identity absent entirely.
 *
 * So this suite is transition tests, edge by edge (the register's stated evidence):
 *  - every forward edge of the chain, in order, with the record each stage writes;
 *  - every out-of-order attempt refused, leaving the state untouched;
 *  - every stage authority mandatory (an empty actor is refused, not defaulted);
 *  - the two PRD stages that must not be advanceable by hand: ON AIR and
 *    AS-RUN RECONCILED require operational evidence, and a certificate id is
 *    verified against the proof-of-air registry rather than taken on trust;
 *  - revision identity: approval creates `SCHEDULE#R1`, an amendment appends `R2`
 *    and never rewrites `R1`, and the superseded snapshot stays addressable;
 *  - the first test reads the authority document itself, so the code cannot drift
 *    away from §15 again without failing CI.
 *
 * Rights fixtures are durable rows (`tests/helpers/rights-fixtures.ts`), because
 * since TSK-10 the gate decides on registered `RightsRecord`s — a lifecycle test
 * that cleared rights by assertion would be testing a machine that cannot exist.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRD_SCHEDULE_CHAIN,
  amendSchedule,
  approveSchedule,
  archiveSchedule,
  generatePlaylist,
  getApprovedRevision,
  getSchedule,
  getScheduleRevision,
  getVersion,
  isApprovedForAir,
  isVersionAirable,
  lockScheduleIfPastLockout,
  markOnAir,
  markReadyForAir,
  passProgrammingReview,
  passRightsCheck,
  passTrafficCheck,
  reconcileAsRun,
  registerVersion,
  submitScheduleForApproval,
  upsertDraftSchedule,
  _resetSchedulesForTesting,
  _resetVersionsForTesting,
  type BroadcastScheduleRecord,
  type ScheduleAirEvidence,
  type ScheduleEntry,
  type VersionQcReport,
} from "../../src/modules/broadcast/versions/index.js";
import { getProofOfAirCertificate, registerProofOfAirCertificate } from "../../src/modules/broadcast/asrun/index.js";
import { exportXmltv } from "../../src/modules/broadcast/export/epg.js";
import { engineScheduleSource } from "../../src/modules/broadcast/export/approved-schedules.js";
import { _resetRegisteredRightsIndexForTesting } from "../../src/modules/broadcast/rights/index.js";
import { approvePreAirChain, deleteFixtureRights, fixtureRightsWrite, registerFixtureRights } from "../helpers/rights-fixtures.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PRD = "docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md";

const CHANNEL = "NXTR";
/** A day that has already aired, so as-run evidence is not time-travel. */
const DAY = "2026-10-05";
const QC: VersionQcReport = {
  videoStandard: "1080i50",
  aspectRatio: "16:9",
  audioLoudnessLufs: -23,
  hasCountdownSlate: true,
  hasBlackGaps: false,
  hasClosedCaptionTrack: true,
};

const CLEAR = "rr-tsk12-clear";
const EXPIRED = "rr-tsk12-expired";
const FIXTURE_IDS = [CLEAR, EXPIRED];

/** Certificate ids used by the evidence tests; registered, never invented per call. */
const CERT_OK = "POA-TSK12-OK";
const CERT_UNVERIFIED = "POA-TSK12-UNVERIFIED";
const CERT_OTHER_CHANNEL = "POA-TSK12-ORIS";

function certificate(id: string, overrides: Partial<Parameters<typeof registerProofOfAirCertificate>[0]> = {}): void {
  registerProofOfAirCertificate({
    certificateId: id,
    channelCode: CHANNEL,
    clientName: "VMNL continuity",
    campaignId: "CMP-TSK12",
    spotId: `SPOT-${id}`,
    airedTimestamp: new Date(`${DAY}T19:00:00Z`),
    durationSeconds: 4500,
    cryptographicSignature: "sig-tsk12",
    isVerified: true,
    generatedAt: new Date(`${DAY}T20:15:00Z`),
    ...overrides,
  } as Parameters<typeof registerProofOfAirCertificate>[0]);
}

/** One entry at 20:00 WAT-ish, cleared against `CLEAR` unless overridden. */
function entry(entryId: string, overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  const versionId = `ver-${entryId}`;
  if (!getVersion(versionId)) {
    registerVersion({ id: versionId, episodeId: `EP-${entryId}`, versionType: "MASTER", durationSeconds: 4500, qc: QC });
    markReadyForAir({ versionId, rfaBy: "qc-1" });
  }
  return {
    entryId,
    versionId,
    programmeTitle: "Prime Show",
    startSecondsFromDayStart: 19 * 3600,
    durationSeconds: 4500,
    rightsClearedBy: "rights-officer-1",
    rightsRecordId: CLEAR,
    ...overrides,
  };
}

function draft(scheduleId: string, entries: ScheduleEntry[]): BroadcastScheduleRecord {
  return upsertDraftSchedule({ scheduleId, channelId: CHANNEL, broadcastDate: DAY, entries });
}

/** DRAFT → TRAFFIC_READY (the gate is run for real, so only a clearable day walks this far). */
function toTrafficReady(scheduleId: string, entries: ScheduleEntry[]): BroadcastScheduleRecord {
  draft(scheduleId, entries);
  submitScheduleForApproval(scheduleId, "scheduler-1");
  passProgrammingReview({ scheduleId, reviewedBy: "programming-1" });
  passRightsCheck({ scheduleId, checkedBy: "rights-officer-1" });
  return passTrafficCheck({ scheduleId, attestedBy: "traffic-1" });
}

function approved(scheduleId: string, entries: ScheduleEntry[]): BroadcastScheduleRecord {
  toTrafficReady(scheduleId, entries);
  return approveSchedule({ scheduleId, approvedBy: "broadcast-director-1" });
}

/** APPROVED → PLAYLIST_GENERATED → ON_AIR from real evidence. */
function onAir(scheduleId: string, evidence?: ScheduleAirEvidence): BroadcastScheduleRecord {
  generatePlaylist({ scheduleId, generatedBy: "playout-automation-1" });
  return markOnAir({
    scheduleId,
    evidence: evidence ?? {
      source: "PLAYOUT_AS_RUN_LOG",
      evidenceId: "ASRUN-TSK12-1",
      observedAt: new Date(`${DAY}T18:58:00Z`),
      channelCode: CHANNEL,
    },
  });
}

function stages(scheduleId: string): string[] {
  return getSchedule(scheduleId)!.stageTrail.map((t) => t.stage);
}

describe("TSK-12 (CA-14): the schedule machine is the PRD §15 chain", () => {
  beforeAll(async () => {
    await deleteFixtureRights(FIXTURE_IDS);
    await Promise.all([
      registerFixtureRights(fixtureRightsWrite(CLEAR, { title: "TSK-12 cleared window" })),
      registerFixtureRights(fixtureRightsWrite(EXPIRED, { expiryDate: new Date(Date.UTC(2026, 8, 30)) })),
    ]);
    certificate(CERT_OK);
    certificate(CERT_UNVERIFIED, { isVerified: false, cryptographicSignature: "" });
    certificate(CERT_OTHER_CHANNEL, { certificateId: CERT_OTHER_CHANNEL, channelCode: "ORIS" });
  });

  afterAll(async () => {
    await deleteFixtureRights(FIXTURE_IDS);
    _resetRegisteredRightsIndexForTesting();
  });

  beforeEach(() => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
  });

  it("the states in code are the states in the authority document, in order", () => {
    // The instrument, not the assertion: CA-14 happened because nobody re-read §15
    // against the enum. This parses the authority line and compares.
    const authority = fs.readFileSync(path.join(REPO_ROOT, PRD), "utf8");
    const lines = authority.split("\n").map((l) => l.trim());
    const header = lines.findIndex((l) => l.startsWith("Normal schedule states are:"));
    expect(header, `${PRD} §15 no longer states the normal schedule chain`).toBeGreaterThan(-1);
    const chainLine = lines.slice(header + 1).find((l) => l.length > 0) ?? "";
    const documented = chainLine
      .split("→")
      .map((s) => s.trim().toUpperCase().replace(/[\s-]+/g, "_"))
      .filter(Boolean);
    expect(documented).toEqual([...PRD_SCHEDULE_CHAIN]);
  });

  it("walks every PRD stage in order, each one writing its own record", () => {
    const record = approved("SCHED-TSK12-FULL", [entry("e1"), entry("e2", { startSecondsFromDayStart: 20250 })]);
    expect(record.state).toBe("APPROVED");
    expect(record.rightsCheck).toMatchObject({ checkedBy: "rights-officer-1", entriesChecked: 2 });
    expect(record.trafficReady).toMatchObject({ attestedBy: "traffic-1" });
    expect(record.approvedBy).toBe("broadcast-director-1");

    const aired = onAir("SCHED-TSK12-FULL");
    expect(aired.state).toBe("ON_AIR");
    expect(aired.playlist).toMatchObject({ revisionId: "SCHED-TSK12-FULL#R1" });

    const reconciled = reconcileAsRun({
      scheduleId: "SCHED-TSK12-FULL",
      reconciledBy: "as-run-officer-1",
      evidence: [
        { entryId: "e1", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
        { entryId: "e2", source: "CARRIER_UPLINK_TELEMETRY", evidenceId: "RF-TSK12-2", observedAt: new Date(`${DAY}T20:14:00Z`), channelCode: CHANNEL },
      ],
    });
    expect(reconciled.state).toBe("AS_RUN_RECONCILED");
    expect(reconciled.asRunReconciled?.entriesReconciled).toBe(2);

    const archived = archiveSchedule({ scheduleId: "SCHED-TSK12-FULL", archivedBy: "archivist-1" });
    expect(archived.state).toBe("ARCHIVED");
    expect(archived.archivedAt).toBeInstanceOf(Date);

    // The trail is the machine's audit trail, not just the last state.
    expect(stages("SCHED-TSK12-FULL")).toEqual([
      "DRAFT",
      "PROGRAMMING_REVIEW",
      "RIGHTS_CHECK",
      "TRAFFIC_READY",
      "APPROVED",
      "PLAYLIST_GENERATED",
      "ON_AIR",
      "AS_RUN_RECONCILED",
      "ARCHIVED",
    ]);
    // Every stage carries a named actor: no stage is anonymous.
    for (const transition of getSchedule("SCHED-TSK12-FULL")!.stageTrail) {
      expect(transition.actor.trim().length, `${transition.stage} recorded no actor`).toBeGreaterThan(0);
    }
  });

  it("refuses every stage out of order, leaving the state untouched", () => {
    draft("SCHED-TSK12-ORDER", [entry("e1")]);

    // nothing may be signed off, checked, attested or approved before submit
    expect(() => passProgrammingReview({ scheduleId: "SCHED-TSK12-ORDER", reviewedBy: "programming-1" })).toThrow(/SCHED-STATE-05/);
    expect(() => passRightsCheck({ scheduleId: "SCHED-TSK12-ORDER", checkedBy: "rights-officer-1" })).toThrow(/SCHED-STATE-06/);
    expect(() => passTrafficCheck({ scheduleId: "SCHED-TSK12-ORDER", attestedBy: "traffic-1" })).toThrow(/SCHED-STATE-07/);
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-ORDER", approvedBy: "director" })).toThrow(/SCHED-STATE-03/);
    expect(() => generatePlaylist({ scheduleId: "SCHED-TSK12-ORDER", generatedBy: "playout-automation-1" })).toThrow(/SCHED-STATE-08/);
    expect(() => markOnAir({ scheduleId: "SCHED-TSK12-ORDER", evidence: { source: "PLAYOUT_AS_RUN_LOG", evidenceId: "X", observedAt: new Date(), channelCode: CHANNEL } })).toThrow(
      /SCHED-STATE-09/
    );
    expect(() => reconcileAsRun({ scheduleId: "SCHED-TSK12-ORDER", reconciledBy: "officer", evidence: [] })).toThrow(/SCHED-STATE-10/);
    expect(() => archiveSchedule({ scheduleId: "SCHED-TSK12-ORDER", archivedBy: "archivist-1" })).toThrow(/SCHED-STATE-11/);
    expect(getSchedule("SCHED-TSK12-ORDER")!.state).toBe("DRAFT");

    // after submit, only programming review is legal
    submitScheduleForApproval("SCHED-TSK12-ORDER", "scheduler-1");
    expect(getSchedule("SCHED-TSK12-ORDER")!.state).toBe("PROGRAMMING_REVIEW");
    expect(() => submitScheduleForApproval("SCHED-TSK12-ORDER", "scheduler-1")).toThrow(/SCHED-STATE-02/);
    expect(() => passRightsCheck({ scheduleId: "SCHED-TSK12-ORDER", checkedBy: "rights-officer-1" })).toThrow(/SCHED-STATE-06/);
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-ORDER", approvedBy: "director" })).toThrow(/SCHED-STATE-03/);

    passProgrammingReview({ scheduleId: "SCHED-TSK12-ORDER", reviewedBy: "programming-1" });
    expect(() => passProgrammingReview({ scheduleId: "SCHED-TSK12-ORDER", reviewedBy: "programming-1" })).toThrow(/SCHED-STATE-05/);
    expect(() => passTrafficCheck({ scheduleId: "SCHED-TSK12-ORDER", attestedBy: "traffic-1" })).toThrow(/SCHED-STATE-07/);
    // RIGHTS_CHECK is where the gate lives: a blocked candidate stops here (PRD §15)
    expect(() => passRightsCheck({ scheduleId: "SCHED-TSK12-ORDER", checkedBy: "" })).toThrow(/SCHED-RIGHTS-04/);
    passRightsCheck({ scheduleId: "SCHED-TSK12-ORDER", checkedBy: "rights-officer-1" });
    expect(getSchedule("SCHED-TSK12-ORDER")!.state).toBe("TRAFFIC_READY");
    // TRAFFIC_READY is the stage name; the attestation is the substance. A day that
    // reached the stage without a recorded traffic officer is not approvable.
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-ORDER", approvedBy: "director" })).toThrow(/SCHED-APR-03/);
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-ORDER", approvedBy: "" })).toThrow(/SCHED-APR-01/);
    expect(getSchedule("SCHED-TSK12-ORDER")!.state).toBe("TRAFFIC_READY");
    expect(() => archiveSchedule({ scheduleId: "SCHED-TSK12-ORDER", archivedBy: "archivist-1" })).toThrow(/SCHED-STATE-11/);

    passTrafficCheck({ scheduleId: "SCHED-TSK12-ORDER", attestedBy: "traffic-1" });
    approveSchedule({ scheduleId: "SCHED-TSK12-ORDER", approvedBy: "broadcast-director-1" });
    expect(() => passTrafficCheck({ scheduleId: "SCHED-TSK12-ORDER", attestedBy: "traffic-1" })).toThrow(/SCHED-STATE-07/);
    expect(() => markOnAir({ scheduleId: "SCHED-TSK12-ORDER", evidence: { source: "PLAYOUT_AS_RUN_LOG", evidenceId: "X", observedAt: new Date(), channelCode: CHANNEL } })).toThrow(
      /SCHED-STATE-09/
    );
  });

  it("a blocked candidate cannot pass RIGHTS_CHECK, so it never reaches approval or export", () => {
    draft("SCHED-TSK12-BLOCKED", [entry("e1", { rightsRecordId: EXPIRED })]);
    submitScheduleForApproval("SCHED-TSK12-BLOCKED", "scheduler-1");
    passProgrammingReview({ scheduleId: "SCHED-TSK12-BLOCKED", reviewedBy: "programming-1" });

    expect(() => passRightsCheck({ scheduleId: "SCHED-TSK12-BLOCKED", checkedBy: "rights-officer-1" })).toThrow(/SCHED-RIGHTS-03/);
    const blocked = getSchedule("SCHED-TSK12-BLOCKED")!;
    expect(blocked.state).toBe("RIGHTS_CHECK");
    expect(blocked.rightsCheck).toBeUndefined();
    // PRD §15: "cannot pass RIGHTS CHECK or reach an approved/exportable schedule,
    // executable playlist or transmission" — each of those is refused, not skipped.
    expect(() => passTrafficCheck({ scheduleId: "SCHED-TSK12-BLOCKED", attestedBy: "traffic-1" })).toThrow(/SCHED-STATE-07/);
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-BLOCKED", approvedBy: "director" })).toThrow(/SCHED-STATE-03/);
    expect(() => generatePlaylist({ scheduleId: "SCHED-TSK12-BLOCKED", generatedBy: "playout-automation-1" })).toThrow(/SCHED-STATE-08/);
    expect(exportXmltv(CHANNEL, DAY, engineScheduleSource).code).toBe("APPROVED_SCHEDULE_UNAVAILABLE");
  });

  it("no stage accepts an anonymous authority, and a refusal never advances the day", () => {
    draft("SCHED-TSK12-ACTOR", [entry("e1")]);
    expect(() => submitScheduleForApproval("SCHED-TSK12-ACTOR", "   ")).toThrow(/SCHED-SUB-01/);
    expect(getSchedule("SCHED-TSK12-ACTOR")!.state).toBe("DRAFT");
    submitScheduleForApproval("SCHED-TSK12-ACTOR", "scheduler-1");
    expect(() => passProgrammingReview({ scheduleId: "SCHED-TSK12-ACTOR", reviewedBy: "" })).toThrow(/SCHED-PRV-01/);
    expect(getSchedule("SCHED-TSK12-ACTOR")!.state).toBe("PROGRAMMING_REVIEW");
    passProgrammingReview({ scheduleId: "SCHED-TSK12-ACTOR", reviewedBy: "programming-1" });
    expect(() => passRightsCheck({ scheduleId: "SCHED-TSK12-ACTOR", checkedBy: "  " })).toThrow(/SCHED-RIGHTS-04/);
    expect(getSchedule("SCHED-TSK12-ACTOR")!.state).toBe("RIGHTS_CHECK");
    passRightsCheck({ scheduleId: "SCHED-TSK12-ACTOR", checkedBy: "rights-officer-1" });
    expect(() => passTrafficCheck({ scheduleId: "SCHED-TSK12-ACTOR", attestedBy: "" })).toThrow(/SCHED-TRAF-01/);
    expect(getSchedule("SCHED-TSK12-ACTOR")!.trafficReady).toBeUndefined();
    // the stage itself was entered by the rights gate; only a named officer can
    // attest it, and until that attestation exists approval refuses (SCHED-APR-03)
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-ACTOR", approvedBy: "broadcast-director-1" })).toThrow(/SCHED-APR-03/);
    passTrafficCheck({ scheduleId: "SCHED-TSK12-ACTOR", attestedBy: "traffic-1" });
    approveSchedule({ scheduleId: "SCHED-TSK12-ACTOR", approvedBy: "broadcast-director-1" });
    expect(() => generatePlaylist({ scheduleId: "SCHED-TSK12-ACTOR", generatedBy: "" })).toThrow(/SCHED-PLS-01/);
    expect(() => reconcileAsRun({ scheduleId: "SCHED-TSK12-ACTOR", reconciledBy: "", evidence: [] })).toThrow(/SCHED-STATE-10/);
    expect(stages("SCHED-TSK12-ACTOR")).toEqual(["DRAFT", "PROGRAMMING_REVIEW", "RIGHTS_CHECK", "TRAFFIC_READY", "APPROVED"]);
  });

  it("approval records the revision identity and freezes the approved entry set", () => {
    const record = approved("SCHED-TSK12-REV", [entry("e1"), entry("e2", { startSecondsFromDayStart: 20250 })]);
    expect(record.revision).toBe(1);
    expect(record.revisionId).toBe("SCHED-TSK12-REV#R1");
    const r1 = getScheduleRevision("SCHED-TSK12-REV", "SCHED-TSK12-REV#R1")!;
    expect(r1.producedBy).toBe("APPROVAL");
    expect(r1.approvedBy).toBe("broadcast-director-1");
    expect(r1.entries.map((e) => e.entryId)).toEqual(["e1", "e2"]);
    expect(Object.isFrozen(r1.entries)).toBe(true);
    expect(Object.isFrozen(r1.entries[0])).toBe(true);
    expect(getApprovedRevision(record)?.revisionId).toBe("SCHED-TSK12-REV#R1");
    expect(getScheduleRevision("SCHED-TSK12-REV", "SCHED-TSK12-REV#R9")).toBeUndefined();
  });

  it("an amendment creates a new revision instead of overwriting what was approved", () => {
    const record = approved("SCHED-TSK12-AMD", [entry("e1")]);

    const amended = amendSchedule({
      scheduleId: "SCHED-TSK12-AMD",
      amendedBy: "scheduler-1",
      now: new Date(record.lockoutAt!.getTime() - 60_000),
      entries: [entry("e1"), entry("e2", { startSecondsFromDayStart: 20250 })],
    });

    expect(amended.state).toBe("AMENDED");
    expect(amended.revision).toBe(2);
    expect(amended.revisionId).toBe("SCHED-TSK12-AMD#R2");
    expect(amended.amendmentCount).toBe(1);
    // nothing executable had been handed to playout at this point, and a day that
    // has one is out of amendment's reach (`a day already handed to playout…`)
    expect(amended.playlist).toBeUndefined();
    // R1 is still addressable and unchanged: what was approved stays auditable
    const r1 = getScheduleRevision("SCHED-TSK12-AMD", "SCHED-TSK12-AMD#R1")!;
    expect(r1.entries).toHaveLength(1);
    expect(r1.entries[0].entryId).toBe("e1");
    const r2 = getScheduleRevision("SCHED-TSK12-AMD", "SCHED-TSK12-AMD#R2")!;
    expect(r2.producedBy).toBe("AMENDMENT");
    expect(r2.actor).toBe("scheduler-1");
    expect(r2.entries.map((e) => e.entryId)).toEqual(["e1", "e2"]);
    expect(stages("SCHED-TSK12-AMD")).toEqual([
      "DRAFT",
      "PROGRAMMING_REVIEW",
      "RIGHTS_CHECK",
      "TRAFFIC_READY",
      "APPROVED",
      "AMENDED",
    ]);

    // regenerating now names R2, and the EPG export carries it
    generatePlaylist({ scheduleId: "SCHED-TSK12-AMD", generatedBy: "playout-automation-1" });
    expect(getSchedule("SCHED-TSK12-AMD")!.playlist?.revisionId).toBe("SCHED-TSK12-AMD#R2");
    const feed = exportXmltv(CHANNEL, DAY, engineScheduleSource);
    expect(feed.status).toBe("EXPORTED");
    expect(feed.revisionId).toBe("SCHED-TSK12-AMD#R2");
    expect(feed.xmltv).toContain("<source-revision>SCHED-TSK12-AMD#R2</source-revision>");
  });

  it("a day already handed to playout cannot be amended", () => {
    approved("SCHED-TSK12-PLS", [entry("e1")]);
    generatePlaylist({ scheduleId: "SCHED-TSK12-PLS", generatedBy: "playout-automation-1" });
    expect(() =>
      amendSchedule({ scheduleId: "SCHED-TSK12-PLS", amendedBy: "scheduler-1", entries: [entry("e1")], now: new Date(Date.now() - 86_400_000) })
    ).toThrow(/SCHED-STATE-04/);
    expect(getSchedule("SCHED-TSK12-PLS")!.revision).toBe(1);
  });

  it("ON AIR is evidence-only: no planning flag, no unverifiable certificate, no impossible air time", () => {
    approved("SCHED-TSK12-AIR", [entry("e1")]);

    // right shape, wrong stage: the executable playlist has not been handed over
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
      })
    ).toThrow(/SCHED-STATE-09/);

    generatePlaylist({ scheduleId: "SCHED-TSK12-AIR", generatedBy: "playout-automation-1" });
    // no artifact at all, and an artifact with no identity
    expect(() => markOnAir({ scheduleId: "SCHED-TSK12-AIR", evidence: {} as ScheduleAirEvidence })).toThrow(/SCHED-AIR-02/);
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PLAYOUT_AS_RUN_LOG", evidenceId: "   ", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
      })
    ).toThrow(/SCHED-AIR-02/);
    // a certificate id that is not in the proof-of-air registry is not evidence
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PROOF_OF_AIR_CERTIFICATE", evidenceId: "POA-TSK12-GHOST", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
      })
    ).toThrow(/SCHED-AIR-05/);
    expect(getProofOfAirCertificate(CERT_UNVERIFIED)).toBeDefined();
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PROOF_OF_AIR_CERTIFICATE", evidenceId: CERT_UNVERIFIED, observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
      })
    ).toThrow(/SCHED-AIR-06/);
    // evidence that contradicts the certificate it cites
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PROOF_OF_AIR_CERTIFICATE", evidenceId: CERT_OK, observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: "ORIS" },
      })
    ).toThrow(/SCHED-AIR-07/);
    // a real, verified certificate — but for another channel's transmission
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PROOF_OF_AIR_CERTIFICATE", evidenceId: CERT_OTHER_CHANNEL, observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: "ORIS" },
      })
    ).toThrow(/SCHED-AIR-09/);
    // an observed air time outside the broadcast day cannot describe this schedule
    expect(() =>
      markOnAir({
        scheduleId: "SCHED-TSK12-AIR",
        evidence: { source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-OTHER-DAY", observedAt: new Date("2020-01-01T00:00:00Z"), channelCode: CHANNEL },
      })
    ).toThrow(/SCHED-AIR-08/);
    expect(getSchedule("SCHED-TSK12-AIR")!.state).toBe("PLAYLIST_GENERATED");
    expect(getSchedule("SCHED-TSK12-AIR")!.onAir).toBeUndefined();

    // the verified certificate does advance it, and carries the planned-vs-actual note
    const aired = markOnAir({
      scheduleId: "SCHED-TSK12-AIR",
      evidence: {
        source: "PROOF_OF_AIR_CERTIFICATE",
        evidenceId: CERT_OK,
        observedAt: new Date(`${DAY}T18:59:10Z`),
        channelCode: CHANNEL,
        note: "Planned 19:00:00 WAT; actual 19:59:10 WAT, 70s late rollover from the preceding programme",
      },
    });
    expect(aired.state).toBe("ON_AIR");
    expect(aired.onAir?.evidenceId).toBe(CERT_OK);
    expect(aired.onAir?.note).toContain("70s late rollover");
  });

  it("as-run reconciliation needs evidence for every entry and preserves the difference", () => {
    approved("SCHED-TSK12-REC", [entry("e1"), entry("e2", { startSecondsFromDayStart: 20250 })]);
    onAir("SCHED-TSK12-REC");

    // partial evidence: the day is not reconciled on the strength of one log
    expect(() =>
      reconcileAsRun({
        scheduleId: "SCHED-TSK12-REC",
        reconciledBy: "as-run-officer-1",
        evidence: [{ entryId: "e1", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL }],
      })
    ).toThrow(/SCHED-REC-01/);
    expect(getSchedule("SCHED-TSK12-REC")!.state).toBe("ON_AIR");

    // an artifact for a slot that is not on the day
    expect(() =>
      reconcileAsRun({
        scheduleId: "SCHED-TSK12-REC",
        reconciledBy: "as-run-officer-1",
        evidence: [
          { entryId: "e1", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
          { entryId: "e-ghost", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-2", observedAt: new Date(`${DAY}T20:14:00Z`), channelCode: CHANNEL },
        ],
      })
    ).toThrow(/SCHED-REC-02/);

    // two artifacts for one slot: the actual air of a slot is a single fact
    expect(() =>
      reconcileAsRun({
        scheduleId: "SCHED-TSK12-REC",
        reconciledBy: "as-run-officer-1",
        evidence: [
          { entryId: "e1", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
          { entryId: "e1", source: "CARRIER_UPLINK_TELEMETRY", evidenceId: "RF-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
          { entryId: "e2", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-2", observedAt: new Date(`${DAY}T20:14:00Z`), channelCode: CHANNEL },
        ],
      })
    ).toThrow(/SCHED-REC-04/);

    const reconciled = reconcileAsRun({
      scheduleId: "SCHED-TSK12-REC",
      reconciledBy: "as-run-officer-1",
      evidence: [
        { entryId: "e1", source: "PLAYOUT_AS_RUN_LOG", evidenceId: "ASRUN-TSK12-1", observedAt: new Date(`${DAY}T18:58:00Z`), channelCode: CHANNEL },
        {
          entryId: "e2",
          source: "PROOF_OF_AIR_CERTIFICATE",
          evidenceId: CERT_OK,
          observedAt: new Date(`${DAY}T20:14:00Z`),
          channelCode: CHANNEL,
          note: "Emergency substitution: filler played 11s short, authorised by continuity",
        },
      ],
    });
    expect(reconciled.state).toBe("AS_RUN_RECONCILED");
    expect(reconciled.asRunReconciled?.entriesReconciled).toBe(2);
    expect(reconciled.asRunReconciled?.evidence.map((e) => e.evidenceId)).toEqual(["ASRUN-TSK12-1", CERT_OK]);
    // the planned-versus-actual difference survives reconciliation rather than being corrected away
    expect(reconciled.asRunReconciled?.evidence[1].note).toContain("filler played 11s short");

    expect(() => archiveSchedule({ scheduleId: "SCHED-TSK12-REC", archivedBy: "" })).toThrow(/SCHED-ARC-01/);
    expect(() => reconcileAsRun({ scheduleId: "SCHED-TSK12-REC", reconciledBy: "as-run-officer-1", evidence: [] })).toThrow(/SCHED-STATE-10/);
    const archived = archiveSchedule({ scheduleId: "SCHED-TSK12-REC", archivedBy: "archivist-1" });
    expect(archived.state).toBe("ARCHIVED");
    // an archived day is still the approved record of what aired; it cannot be reopened
    expect(() => amendSchedule({ scheduleId: "SCHED-TSK12-REC", amendedBy: "scheduler-1", entries: [entry("e1")], now: new Date() })).toThrow(/SCHED-STATE-04/);
    expect(() => archiveSchedule({ scheduleId: "SCHED-TSK12-REC", archivedBy: "archivist-1" })).toThrow(/SCHED-STATE-11/);
  });

  it("LOCKED and AMENDED are controls over an approved day, not weakened approvals", () => {
    const record = approved("SCHED-TSK12-LOCK", [entry("e1")]);
    expect(isApprovedForAir(record.state)).toBe(true);

    // past lock-out the day is immutable, still approved for air, and still exportable
    const locked = lockScheduleIfPastLockout("SCHED-TSK12-LOCK", new Date(record.lockoutAt!.getTime() + 60_000))!;
    expect(locked.state).toBe("LOCKED");
    expect(isApprovedForAir(locked.state)).toBe(true);
    expect(() => upsertDraftSchedule({ scheduleId: "SCHED-TSK12-LOCK", channelId: CHANNEL, broadcastDate: DAY, entries: [entry("e1")] })).toThrow(/SCHED-STATE-01/);
    expect(exportXmltv(CHANNEL, DAY, engineScheduleSource).status).toBe("EXPORTED");

    // a locked day can still be evidenced ON AIR once its playlist exists, and stays locked
    generatePlaylist({ scheduleId: "SCHED-TSK12-LOCK", generatedBy: "playout-automation-1" });
    expect(getSchedule("SCHED-TSK12-LOCK")!.state).toBe("LOCKED");
    const aired = markOnAir({
      scheduleId: "SCHED-TSK12-LOCK",
      evidence: { source: "CARRIER_UPLINK_TELEMETRY", evidenceId: "RF-TSK12-LOCK", observedAt: new Date(`${DAY}T19:00:05Z`), channelCode: CHANNEL },
    });
    expect(aired.state).toBe("ON_AIR");
    // and the approved-for-air set excludes every planning stage
    for (const planning of ["DRAFT", "PROGRAMMING_REVIEW", "RIGHTS_CHECK", "TRAFFIC_READY"] as const) {
      expect(isApprovedForAir(planning)).toBe(false);
    }
  });

  it("re-drafting an amended day discards the gates that were passed against the old entries", () => {
    const record = approved("SCHED-TSK12-REDRAFT", [entry("e1")]);
    amendSchedule({
      scheduleId: "SCHED-TSK12-REDRAFT",
      amendedBy: "scheduler-1",
      now: new Date(record.lockoutAt!.getTime() - 60_000),
      entries: [entry("e1"), entry("e2", { startSecondsFromDayStart: 20250 })],
    });

    const back = upsertDraftSchedule({ scheduleId: "SCHED-TSK12-REDRAFT", channelId: CHANNEL, broadcastDate: DAY, entries: [entry("e1")] });
    expect(back.state).toBe("DRAFT");
    expect(back.rightsCheck).toBeUndefined();
    expect(back.trafficReady).toBeUndefined();
    expect(back.approvedBy).toBe("broadcast-director-1"); // the record of what was approved is history, not a live gate
    // the revision history is what was approved, so re-drafting never erases it
    expect(back.revision).toBe(2);
    expect(back.revisions.map((r) => r.revisionId)).toEqual(["SCHED-TSK12-REDRAFT#R1", "SCHED-TSK12-REDRAFT#R2"]);
    // and the day must walk the chain again before it can air
    expect(() => approveSchedule({ scheduleId: "SCHED-TSK12-REDRAFT", approvedBy: "director" })).toThrow(/SCHED-STATE-03/);
    // once a playlist exists for a revision the day is out of reach of re-drafting
    approvePreAirChain("SCHED-TSK12-REDRAFT", { approvedBy: "broadcast-director-1" });
    generatePlaylist({ scheduleId: "SCHED-TSK12-REDRAFT", generatedBy: "playout-automation-1" });
    expect(() => upsertDraftSchedule({ scheduleId: "SCHED-TSK12-REDRAFT", channelId: CHANNEL, broadcastDate: DAY, entries: [entry("e1")] })).toThrow(
      /SCHED-STATE-01/
    );
    expect(getSchedule("SCHED-TSK12-REDRAFT")!.playlist?.revisionId).toBe("SCHED-TSK12-REDRAFT#R3");
  });

  it("isVersionAirable stays the technical precondition of every stage", () => {
    const versionId = "ver-not-rfa";
    registerVersion({ id: versionId, episodeId: "EP-NOT-RFA", versionType: "MASTER", durationSeconds: 600, qc: { ...QC, hasBlackGaps: true } });
    expect(isVersionAirable(versionId)).toBe(false);
    draft("SCHED-TSK12-QC", [{ entryId: "e1", versionId, programmeTitle: "Black Gaps", startSecondsFromDayStart: 0, durationSeconds: 600, rightsClearedBy: "rights-officer-1", rightsRecordId: CLEAR }]);
    expect(() => submitScheduleForApproval("SCHED-TSK12-QC", "scheduler-1")).toThrow(/SCHED-VAL-02/);
    expect(getSchedule("SCHED-TSK12-QC")!.state).toBe("DRAFT");
  });
});
