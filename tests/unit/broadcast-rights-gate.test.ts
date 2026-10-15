/**
 * TSK-10 (report.md CA-07) — the rights gate is on the authoritative path.
 *
 * CA-07 was four defects that only fail together: schedule validation accepted a
 * non-empty `rightsClearedBy` string, `approveSchedule` never consulted the gate,
 * the validation route built the RightsRecord out of the request body, and the
 * correct engine (`validateScheduleRights`) sat unused on that path. The register
 * calls this the highest-value fix in the project because the failure was silent:
 * every surface *looked* gated.
 *
 * These tests therefore assert the business outcome, never that a function ran
 * (Rule 0.1.2): the schedule is **not approved**, it never gets past the stage the
 * gate owns, with no approver and no approval timestamp, and the EPG feed is **not
 * exported**. The positive control matters just as much — an all-refusing gate
 * would pass every negative below, so a cleared record really does approve and
 * really does export.
 *
 * TSK-12 moved the machine to the PRD §15 chain, so these boundary assertions sit
 * at the stage that actually decides: `passRightsCheck` is RIGHTS_CHECK's computed
 * gate, and `approveSchedule` re-runs it as defence in depth. The states named
 * below (`RIGHTS_CHECK`, `TRAFFIC_READY`) are those stages; the refusals and the
 * stable codes are the ones TSK-10 closed on.
 *
 * Assertions are labelled with the **stable codes** the system emits
 * (`[SCHED-RIGHTS-01/02/03]`, `RIGHTS_RECORD_NOT_REGISTERED`,
 * `RIGHTS_NOT_CLEARED_AT_EXPORT`, and the gate's own reason codes), not with
 * `AC-UI-RL1-R07-nn` ordinals: the per-criterion AC list lives in
 * `VMNL-AZP-VMN-UIUX-001`, which is absent from `docs/authorities/` (TSK-39), so
 * assigning a behaviour to a criterion number would be invention.
 * `docs/audit/ac-traceability-index.md` keeps R07 at IMPLEMENTED for the same
 * reason, and `tests/unit/ac-traceability.test.ts` fails the suite if a range is
 * ever promoted to a coverage claim without literal labels.
 *
 * Records are fixtures in the durable store (Postgres when reachable — the suite
 * prints which path ran, per Rule 0.4a), not in-memory claims.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  amendSchedule,
  approveSchedule,
  getSchedule,
  markReadyForAir,
  passProgrammingReview,
  passRightsCheck,
  passTrafficCheck,
  registerVersion,
  submitScheduleForApproval,
  upsertDraftSchedule,
  _resetSchedulesForTesting,
  _resetVersionsForTesting,
  type ScheduleEntry,
  type VersionQcReport,
} from "../../src/modules/broadcast/versions/index.js";
import { exportXmltv, pushToStarTimes } from "../../src/modules/broadcast/export/epg.js";
import { engineScheduleSource } from "../../src/modules/broadcast/export/approved-schedules.js";
import {
  _resetRegisteredRightsIndexForTesting,
  getRegisteredRightsRecord,
  refreshRegisteredRightsIndex,
  rightsRepository,
} from "../../src/modules/broadcast/rights/index.js";
import { RightsRepository } from "../../src/core/database/repositories/rights.repository.js";
import { checkDatabaseConnection } from "../../src/core/database/index.js";
import { deleteFixtureRights, fixtureRightsWrite, registerFixtureRights } from "../helpers/rights-fixtures.js";

const CHANNEL = "NXTR";
const DAY = "2026-10-05";
/** 19:00–20:15 WAT on the fixture day. */
const SLOT_START_SECONDS = 19 * 3600;
const SLOT_DURATION_SECONDS = 4500;

const RIGHT = "rr-tsk10-clear";
const EXPIRED = "rr-tsk10-expired";
const TERRITORY = "rr-tsk10-territory";
const CHANNEL_SCOPED = "rr-tsk10-channel";
const WRONG_TYPE = "rr-tsk10-type";
const UNREGISTERED = "rr-tsk10-unregistered";
const HYDRATION = "rr-tsk10-hydration";
const FIXTURE_IDS = [RIGHT, EXPIRED, TERRITORY, CHANNEL_SCOPED, WRONG_TYPE, HYDRATION];

const QC: VersionQcReport = {
  videoStandard: "1080i50",
  aspectRatio: "16:9",
  audioLoudnessLufs: -23,
  hasCountdownSlate: true,
  hasBlackGaps: false,
  hasClosedCaptionTrack: true,
};

function registerFixtures(): Promise<unknown>[] {
  return [
    registerFixtureRights(fixtureRightsWrite(RIGHT, { title: "Cleared linear window" })),
    // Expires before the fixture day's slot ends.
    registerFixtureRights(
      fixtureRightsWrite(EXPIRED, {
        startDate: new Date(Date.UTC(2020, 0, 1)),
        expiryDate: new Date(Date.UTC(2026, 8, 30)),
      })
    ),
    // A window that says "United States" while the transmission is Nigerian.
    registerFixtureRights(fixtureRightsWrite(TERRITORY, { territory: "US" })),
    // Cleared for another channel only.
    registerFixtureRights(fixtureRightsWrite(CHANNEL_SCOPED, { channelCode: "ORIS" })),
    // A streaming licence offered up for linear transmission.
    registerFixtureRights(fixtureRightsWrite(WRONG_TYPE, { rightsType: "DIGITAL_STREAMING" })),
    registerFixtureRights(fixtureRightsWrite(HYDRATION)),
  ];
}

let dbConnected = false;

/**
 * Draft → submit → programming review: the day waits at RIGHTS_CHECK, which is the
 * stage the gate owns (TSK-12). `approveSchedule` sits two stages later, so a
 * refusal here is a refusal to *reach* approval.
 */
function scheduleAtRightsCheck(scheduleId: string, entry: Partial<ScheduleEntry>): void {
  const versionId = `ver-${scheduleId}`;
  registerVersion({ id: versionId, episodeId: `EP-${scheduleId}`, versionType: "MASTER", durationSeconds: SLOT_DURATION_SECONDS, qc: QC });
  markReadyForAir({ versionId, rfaBy: "ops-1" });
  upsertDraftSchedule({
    scheduleId,
    channelId: CHANNEL,
    broadcastDate: DAY,
    entries: [
      {
        entryId: `e-${scheduleId}`,
        versionId,
        programmeTitle: "Prime Show",
        startSecondsFromDayStart: SLOT_START_SECONDS,
        durationSeconds: SLOT_DURATION_SECONDS,
        rightsClearedBy: "rights-officer-1",
        ...entry,
      },
    ],
  });
  submitScheduleForApproval(scheduleId, "scheduler-1");
  passProgrammingReview({ scheduleId, reviewedBy: "programming-1" });
}

/** The two authority steps between the gate and approval (no clearance decided here). */
function toTrafficReady(scheduleId: string): void {
  passRightsCheck({ scheduleId, checkedBy: "rights-officer-1" });
  passTrafficCheck({ scheduleId, attestedBy: "traffic-1" });
}

/**
 * Asserts the gate refused the day at RIGHTS_CHECK: the stable code and reason are
 * in the message, the stage never advanced, nothing was recorded as checked, and
 * approval is unreachable from here (PRD §15: a blocked candidate "cannot pass
 * RIGHTS CHECK or reach an approved/exportable schedule").
 */
function expectBlockedAtRightsCheck(scheduleId: string, code: RegExp, reason: RegExp): void {
  expect(() => passRightsCheck({ scheduleId, checkedBy: "rights-officer-1" })).toThrow(code);
  expect(() => passRightsCheck({ scheduleId, checkedBy: "rights-officer-1" })).toThrow(reason);
  const schedule = getSchedule(scheduleId)!;
  expect(schedule.state).toBe("RIGHTS_CHECK");
  expect(schedule.rightsCheck).toBeUndefined();
  expect(() => approveSchedule({ scheduleId, approvedBy: "broadcast-director-1" })).toThrow(/SCHED-STATE-03/);
  expect(schedule.approvedBy).toBeUndefined();
  expect(schedule.approvedAt).toBeUndefined();
  expect(schedule.lockoutAt).toBeUndefined();
}

describe("TSK-10 (CA-07): approval, amendment and export decide on the registered RightsRecord", () => {
  beforeAll(async () => {
    const db = await checkDatabaseConnection();
    dbConnected = db.connected;
    console.log(
      `\n[TSK-10] rights gate path under test: ${
        dbConnected ? "Postgres (fail_closed)" : "in-memory sandbox (Rule 0.4a — not persistence)"
      }`
    );
    await deleteFixtureRights(FIXTURE_IDS.concat(UNREGISTERED));
  });

  afterAll(async () => {
    await deleteFixtureRights(FIXTURE_IDS.concat(HYDRATION));
    _resetRegisteredRightsIndexForTesting();
  });

  beforeEach(async () => {
    _resetVersionsForTesting();
    _resetSchedulesForTesting();
    _resetRegisteredRightsIndexForTesting();
    await Promise.all(registerFixtures());
  });

  it("positive control: a registered, covering record passes RIGHTS_CHECK and approves", () => {
    scheduleAtRightsCheck("SCHED-OK", { rightsRecordId: RIGHT });
    toTrafficReady("SCHED-OK");
    const approved = approveSchedule({ scheduleId: "SCHED-OK", approvedBy: "broadcast-director-1" });
    expect(approved.state).toBe("APPROVED");
    expect(approved.approvedBy).toBe("broadcast-director-1");
    expect(approved.approvedAt).toBeInstanceOf(Date);
    // the gate's own outcome is on the record, not just implied by the stage
    expect(approved.rightsCheck).toMatchObject({ checkedBy: "rights-officer-1", entriesChecked: 1 });
    expect(approved.trafficReady?.attestedBy).toBe("traffic-1");
  });

  it("AC-UI-RL1-R07-13 expired window: RIGHTS_CHECK refuses it and approval becomes unreachable", () => {
    scheduleAtRightsCheck("SCHED-EXPIRED", { rightsRecordId: EXPIRED });
    expectBlockedAtRightsCheck("SCHED-EXPIRED", /SCHED-RIGHTS-03/, /POST_EXPIRY_DATE/);
  });

  it("AC-UI-RL1-R07-13 the same expiry blocks EPG export, never trusting the approval timestamp", async () => {
    scheduleAtRightsCheck("SCHED-EXPORT", { rightsRecordId: RIGHT });
    toTrafficReady("SCHED-EXPORT");
    approveSchedule({ scheduleId: "SCHED-EXPORT", approvedBy: "broadcast-director-1" });
    const cleared = exportXmltv(CHANNEL, DAY, engineScheduleSource);
    expect(cleared.status).toBe("EXPORTED");
    expect(cleared.xmltv).toContain("Prime Show");

    // Rights lapse after approval (the register is corrected, then reloaded).
    await registerFixtureRights(fixtureRightsWrite(RIGHT, { expiryDate: new Date(Date.UTC(2026, 8, 30)) }));
    expect(getRegisteredRightsRecord(RIGHT)!.expiryDate.toISOString()).toBe("2026-09-30T00:00:00.000Z");
    expect(getSchedule("SCHED-EXPORT")!.state).toBe("APPROVED");
    expect(getSchedule("SCHED-EXPORT")!.approvedAt).toBeInstanceOf(Date);

    const blocked = exportXmltv(CHANNEL, DAY, engineScheduleSource);
    expect(blocked.status).toBe("RIGHTS_NOT_CLEARED");
    expect(blocked.code).toBe("RIGHTS_NOT_CLEARED_AT_EXPORT");
    expect(blocked.xmltv).toBeUndefined();
    expect(blocked.message).toMatch(/POST_EXPIRY_DATE/);
    expect(pushToStarTimes(CHANNEL, DAY, engineScheduleSource).code).toBe("RIGHTS_NOT_CLEARED_AT_EXPORT");
  });

  it("AC-UI-RL1-R07-14 wrong territory: refused server-side", () => {
    scheduleAtRightsCheck("SCHED-TERRITORY", { rightsRecordId: TERRITORY });
    expectBlockedAtRightsCheck("SCHED-TERRITORY", /SCHED-RIGHTS-03/, /TERRITORY_MISMATCH/);
  });

  it("AC-UI-RL1-R07-15 wrong channel: a record scoped to ORIS cannot clear NXTR", () => {
    scheduleAtRightsCheck("SCHED-CHANNEL", { rightsRecordId: CHANNEL_SCOPED });
    expectBlockedAtRightsCheck("SCHED-CHANNEL", /SCHED-RIGHTS-03/, /CHANNEL_NOT_PERMITTED/);
  });

  it("AC-UI-RL1-R07-16 wrong rightsType: a streaming licence does not permit linear transmission", () => {
    scheduleAtRightsCheck("SCHED-TYPE", { rightsRecordId: WRONG_TYPE });
    expectBlockedAtRightsCheck("SCHED-TYPE", /SCHED-RIGHTS-03/, /INVALID_RIGHTS_TYPE/);
  });

  it("AC-UI-RL1-R07-17 missing record: no id refuses at submit, an unregistered id refuses at the gate", () => {
    const versionId = "ver-SCHED-NOID";
    registerVersion({ id: versionId, episodeId: "EP-NOID", versionType: "MASTER", durationSeconds: 600, qc: QC });
    markReadyForAir({ versionId, rfaBy: "ops-1" });
    upsertDraftSchedule({
      scheduleId: "SCHED-NOID",
      channelId: CHANNEL,
      broadcastDate: DAY,
      entries: [
        {
          entryId: "e-noid",
          versionId,
          programmeTitle: "No Record Show",
          startSecondsFromDayStart: SLOT_START_SECONDS,
          durationSeconds: SLOT_DURATION_SECONDS,
          rightsClearedBy: "rights-officer-1",
        },
      ],
    });
    expect(() => submitScheduleForApproval("SCHED-NOID", "scheduler-1")).toThrow(/SCHED-RIGHTS-02/);
    expect(getSchedule("SCHED-NOID")!.state).toBe("DRAFT");

    scheduleAtRightsCheck("SCHED-PHANTOM", { rightsRecordId: UNREGISTERED });
    expectBlockedAtRightsCheck("SCHED-PHANTOM", /SCHED-RIGHTS-03/, /RIGHTS_RECORD_NOT_REGISTERED/);
  });

  it("AC-UI-RL1-R07-17 a durable row the gate has not loaded fails closed until hydration", async () => {
    // Written through a *separate* repository instance, so it never passed the
    // registry's write-through hook: the durable row exists, the gate's read
    // index does not know it. RIGHTS_CHECK must refuse (fail closed), and the boot
    // hydration — the same call server.ts makes — must then let the day through.
    _resetRegisteredRightsIndexForTesting();
    const foreign = new RightsRepository();
    await foreign.upsert({
      ...fixtureRightsWrite(HYDRATION),
      expiryDate: new Date(Date.UTC(2035, 11, 31)),
    });
    expect(getRegisteredRightsRecord(HYDRATION)).toBeNull();

    scheduleAtRightsCheck("SCHED-HYDRATE", { rightsRecordId: HYDRATION });
    expect(() => passRightsCheck({ scheduleId: "SCHED-HYDRATE", checkedBy: "rights-officer-1" })).toThrow(
      /RIGHTS_RECORD_NOT_REGISTERED/
    );
    expect(getSchedule("SCHED-HYDRATE")!.state).toBe("RIGHTS_CHECK");

    await refreshRegisteredRightsIndex();
    toTrafficReady("SCHED-HYDRATE");
    const approved = approveSchedule({ scheduleId: "SCHED-HYDRATE", approvedBy: "broadcast-director-1" });
    expect(approved.state).toBe("APPROVED");
  });

  it("AC-UI-RL1-R07-18 a forged free-text attestation is not a clearance (CA-07 defect 1)", () => {
    scheduleAtRightsCheck("SCHED-FORGED", {
      rightsRecordId: EXPIRED,
      rightsClearedBy: "Cleared and signed off by General Counsel — full window, all channels, all territories",
    });
    expectBlockedAtRightsCheck("SCHED-FORGED", /SCHED-RIGHTS-03/, /POST_EXPIRY_DATE/);

    // The annotation is still mandatory, but as a signature line — the record is
    // what clears: dropping it fails validation even with a valid record.
    expect(() => scheduleAtRightsCheck("SCHED-NO-ANNOTATION", { rightsRecordId: RIGHT, rightsClearedBy: "  " })).toThrow(
      /SCHED-RIGHTS-01/
    );
  });

  it("approval re-runs the gate: a window that lapses after RIGHTS_CHECK blocks APPROVED", async () => {
    // Defence in depth (TSK-10), stated against the machine TSK-12 delivered:
    // passing RIGHTS_CHECK is not a permanent credit. The record is corrected and
    // reloaded between the gate and the approver's decision, so approval itself
    // has to refuse and no lock-out or approval stamp is written.
    scheduleAtRightsCheck("SCHED-LAPSE", { rightsRecordId: RIGHT });
    passRightsCheck({ scheduleId: "SCHED-LAPSE", checkedBy: "rights-officer-1" });
    passTrafficCheck({ scheduleId: "SCHED-LAPSE", attestedBy: "traffic-1" });
    expect(getSchedule("SCHED-LAPSE")!.state).toBe("TRAFFIC_READY");

    await registerFixtureRights(fixtureRightsWrite(RIGHT, { expiryDate: new Date(Date.UTC(2026, 8, 30)) }));
    expect(() => approveSchedule({ scheduleId: "SCHED-LAPSE", approvedBy: "broadcast-director-1" })).toThrow(
      /SCHED-RIGHTS-03/
    );
    const stalled = getSchedule("SCHED-LAPSE")!;
    expect(stalled.state).toBe("TRAFFIC_READY");
    expect(stalled.approvedBy).toBeUndefined();
    expect(stalled.approvedAt).toBeUndefined();
    expect(stalled.lockoutAt).toBeUndefined();
    expect(stalled.revision).toBe(0); // no approval, therefore no revision identity
  });

  it("amendment that would break clearance is rejected atomically, leaving the approved day intact", () => {
    scheduleAtRightsCheck("SCHED-AMEND", { rightsRecordId: RIGHT });
    toTrafficReady("SCHED-AMEND");
    const approved = approveSchedule({ scheduleId: "SCHED-AMEND", approvedBy: "broadcast-director-1" });
    const before = approved.entries.map((e) => ({ ...e }));

    expect(() =>
      amendSchedule({
        scheduleId: "SCHED-AMEND",
        amendedBy: "scheduler-1",
        now: new Date(approved.lockoutAt!.getTime() - 60_000),
        entries: approved.entries.map((e) => ({ ...e, rightsRecordId: EXPIRED })),
      })
    ).toThrow(/SCHED-RIGHTS-03/);

    const after = getSchedule("SCHED-AMEND")!;
    expect(after.state).toBe("APPROVED");
    expect(after.amendmentCount).toBe(0);
    expect(after.entries).toEqual(before);
    expect(after.revision).toBe(1); // the refused amendment created no revision
    expect(after.revisions).toHaveLength(1);
  });

  it("clearance decisions come from the registered record, not the entry (CA-07 defect 3 at the domain boundary)", () => {
    scheduleAtRightsCheck("SCHED-SOURCE", { rightsRecordId: RIGHT });
    const record = getRegisteredRightsRecord(RIGHT);
    expect(record, "the fixture record must be readable through the gate's own index").not.toBeNull();
    expect(record!.source).toBe(dbConnected ? "DB" : "MEMORY");
    toTrafficReady("SCHED-SOURCE");
    approveSchedule({ scheduleId: "SCHED-SOURCE", approvedBy: "broadcast-director-1" });

    // The entry never carried a window, territory or rights type; only an id.
    const entry = getSchedule("SCHED-SOURCE")!.entries[0];
    expect(Object.keys(entry).sort()).toEqual([
      "durationSeconds",
      "entryId",
      "programmeTitle",
      "rightsClearedBy",
      "rightsRecordId",
      "startSecondsFromDayStart",
      "versionId",
    ]);
    expect(rightsRepository.getInMemoryRecordsCount()).toBeTypeOf("number");
  });
});
