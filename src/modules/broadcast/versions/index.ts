/**
 * Broadcast Version & Ready-For-Air Workflow — TASK-P2-02 completion
 * (todo.md TODO-BCST-04, TODO-BCST-05)
 * Authority: R1.2A §14 / tasks.md TASK-P2-02 — hierarchical Title → Season →
 * Episode → Broadcast Version (Master/Clean/Subtitled/Censored) with technical
 * QC gate; non-compliant masters cannot be marked RFA without explicit
 * technical override.
 */

import {
  checkScheduleEntriesClearance,
  formatClearanceFailures,
  scheduleDayStartUtc,
} from "../rights/schedule-clearance.js";
import { getProofOfAirCertificate } from "../asrun/index.js";

export type BroadcastVersionType = "MASTER" | "CLEAN" | "SUBTITLED" | "CENSORED";

export interface VersionQcReport {
  videoStandard: "1080i50" | "720p50";
  aspectRatio: "16:9";
  audioLoudnessLufs: number; // EBU R128 target -23 ±1
  hasCountdownSlate: boolean;
  hasBlackGaps: boolean;
  /** TODO-BCST-05: closed-caption/subtitle track presence is part of the gate. */
  hasClosedCaptionTrack: boolean;
  ccTrackFormat?: "CEA-608" | "OP-42" | "WEBVTT";
}

export interface BroadcastVersionRecord {
  id: string;
  episodeId: string;
  versionType: BroadcastVersionType;
  mediaAssetId?: string;
  durationSeconds: number;
  qc: VersionQcReport;
  qcStatus: "PENDING" | "PASSED" | "FAILED" | "OVERRIDDEN";
  qcOverrideBy?: string;
  qcOverrideReason?: string;
  readyForAir: boolean;
  rfaAt?: Date;
  rfaBy?: string;
  createdAt: Date;
}

const versions = new Map<string, BroadcastVersionRecord>();

function validateQc(qc: VersionQcReport): { compliant: boolean; failures: string[] } {
  const failures: string[] = [];
  if (qc.videoStandard !== "1080i50" && qc.videoStandard !== "720p50") failures.push("Invalid video standard.");
  if (qc.aspectRatio !== "16:9") failures.push("Aspect ratio must be 16:9.");
  if (qc.audioLoudnessLufs < -24 || qc.audioLoudnessLufs > -22) failures.push("Audio loudness out of EBU R128 spec (-23 ±1 LUFS).");
  if (!qc.hasCountdownSlate) failures.push("Missing countdown slate.");
  if (qc.hasBlackGaps) failures.push("Unrendered black frame gaps present.");
  if (!qc.hasClosedCaptionTrack) failures.push("Missing closed-caption/subtitle track (broadcast QC requirement).");
  return { compliant: failures.length === 0, failures };
}

export function registerVersion(params: {
  id: string;
  episodeId: string;
  versionType: BroadcastVersionType;
  durationSeconds: number;
  qc: VersionQcReport;
  mediaAssetId?: string;
}): BroadcastVersionRecord {
  if (versions.has(params.id)) {
    throw new Error(`[VER-01] Version '${params.id}' already registered.`);
  }
  const { compliant } = validateQc(params.qc);
  const record: BroadcastVersionRecord = {
    ...params,
    qcStatus: compliant ? "PASSED" : "FAILED",
    readyForAir: false,
    createdAt: new Date(),
  };
  versions.set(params.id, record);
  return record;
}

export function getVersion(id: string): BroadcastVersionRecord | undefined {
  return versions.get(id);
}

export function listVersionsForEpisode(episodeId: string): BroadcastVersionRecord[] {
  return [...versions.values()].filter((v) => v.episodeId === episodeId);
}

/**
 * Marks a version Ready For Air. Only PASSED versions qualify; a FAILED
 * version requires an explicit technical override with authority + reason,
 * and is then marked OVERRIDDEN (auditable), never silently PASSED.
 */
export function markReadyForAir(params: {
  versionId: string;
  rfaBy: string;
  overrideReason?: string;
}): BroadcastVersionRecord {
  const version = versions.get(params.versionId);
  if (!version) throw new Error(`[VER-02] Version '${params.versionId}' not found.`);

  if (version.qcStatus === "FAILED") {
    if (!params.overrideReason || params.overrideReason.trim().length < 10) {
      throw new Error("[VER-03] Non-compliant media masters cannot be marked RFA without an explicit technical override reason (≥10 chars).");
    }
    version.qcStatus = "OVERRIDDEN";
    version.qcOverrideBy = params.rfaBy;
    version.qcOverrideReason = params.overrideReason.trim();
  }
  if (version.qcStatus !== "PASSED" && version.qcStatus !== "OVERRIDDEN") {
    throw new Error(`[VER-04] QC must be PASSED or OVERRIDDEN before RFA (current: ${version.qcStatus}).`);
  }

  version.readyForAir = true;
  version.rfaAt = new Date();
  version.rfaBy = params.rfaBy;
  return version;
}

/**
 * Schedule-side helper: only RFA versions may be loaded into playlists.
 */
export function isVersionAirable(versionId: string): boolean {
  const version = versions.get(versionId);
  return Boolean(version && version.readyForAir);
}

export function _resetVersionsForTesting(): void {
  versions.clear();
  schedules.clear();
}

// ---------------------------------------------------------------------------
// TODO-BCST-03 / TSK-12: Schedule lifecycle — PRD §15 chain
//
// Authority: `VMNL-AZP-VMN-BRD-PRD-001-R1.2A` §15 ("Normal schedule states are:
// DRAFT → PROGRAMMING REVIEW → RIGHTS CHECK → TRAFFIC READY → APPROVED →
// PLAYLIST GENERATED → ON AIR → AS-RUN RECONCILED → ARCHIVED").
// `report.md` CA-14 recorded that the code shipped a five-state machine
// (DRAFT | PENDING_APPROVAL | APPROVED | AMENDED | LOCKED) and that BCST-03 was
// declared closed on the strength of it. This is the reconciled machine.
//
// What each stage actually enforces — stated plainly, because CA-07's lesson is
// that a gate which only *looks* automated is worse than an honest manual one:
//  - `PROGRAMMING_REVIEW` — structural validation only: RFA versions, no
//    overlaps, positive durations, an attestation and a `rightsRecordId` on every
//    entry, no empty or contradictory `episodeCode`. Editorial sign-off is an
//    authority step (`passProgrammingReview`, named reviewer).
//  - `RIGHTS_CHECK` — the computed gate (TSK-10): `validateScheduleRights` over
//    the **registered** `RightsRecord` for every entry. This is the stage PRD §15
//    means by "a blocked candidate … cannot pass RIGHTS CHECK".
//  - `TRAFFIC_READY` — commercial/traffic control is an **authority attestation**
//    by a named traffic officer, not a computed inventory check. Automating it is
//    `tasks.md` TSK-11/TSK-16; claiming it were computed here would be the same
//    fabrication CA-08 reported.
//  - `APPROVED` — exploitation decision by a named approver; requires
//    `TRAFFIC_READY` *and* re-runs the rights gate itself (defence in depth: the
//    approval path can never approve an uncleared slot even if called wrongly).
//  - `PLAYLIST_GENERATED` / `EPG export` — bound to the schedule **revision**.
//  - `ON_AIR`, `AS_RUN_RECONCILED` — PRD §15: these "depend on actual operational
//    evidence rather than a manually advanced planning flag", so each requires an
//    evidence artifact (`markOnAir`, `reconcileAsRun`); a certificate-id claim is
//    verified against the proof-of-air registry, and the whole day reconciles only
//    when every entry has evidence.
//
// Revision identity (PRD §15): "An approved schedule has a revision identity… A
// later approved change creates a new revision; it does not overwrite earlier
// approval or what actually aired." Approval creates `R1`; each amendment appends
// a new immutable snapshot and bumps the revision; exports and as-run records name
// the revision they were produced from.
//
// `LOCKED` and `AMENDED` are implementation controls, not PRD stages: LOCKED is
// the past-lock-out immutability flag on an approved day, AMENDED is an approved
// day carried at a newer revision. Neither weakens a gate, and both remain
// approved-for-air sources for EPG export.
// ---------------------------------------------------------------------------

/** PRD §15 normal states, in order, plus the two implementation controls. */
export const PRD_SCHEDULE_CHAIN = [
  "DRAFT",
  "PROGRAMMING_REVIEW",
  "RIGHTS_CHECK",
  "TRAFFIC_READY",
  "APPROVED",
  "PLAYLIST_GENERATED",
  "ON_AIR",
  "AS_RUN_RECONCILED",
  "ARCHIVED",
] as const;

export type PrdScheduleState = (typeof PRD_SCHEDULE_CHAIN)[number];
export type ScheduleControlState = "AMENDED" | "LOCKED";
export type ScheduleState = PrdScheduleState | ScheduleControlState;

/** States that may legitimately feed EPG/playlist export: an approved day at any later stage. */
const APPROVED_FOR_AIR: ScheduleState[] = [
  "APPROVED",
  "AMENDED",
  "LOCKED",
  "PLAYLIST_GENERATED",
  "ON_AIR",
  "AS_RUN_RECONCILED",
  "ARCHIVED",
];

export function isApprovedForAir(state: ScheduleState): boolean {
  return APPROVED_FOR_AIR.includes(state);
}

export interface ScheduleEntry {
  entryId: string;
  versionId: string;
  programmeTitle: string;
  startSecondsFromDayStart: number;
  durationSeconds: number;
  /**
   * Attestation annotation only — **never** the gate (TSK-10 / report.md CA-07).
   * Who signed off on the rights for this entry, kept for the audit trail. A
   * non-empty string here has no clearance authority: the decision is taken by
   * `validateScheduleRights` against the registered `RightsRecord` named by
   * `rightsRecordId` below.
   */
  rightsClearedBy: string;
  /**
   * The durable `RightsRecord` this slot is cleared against (TSK-10). Mandatory
   * for submit, approval and amendment: an entry that names no record — or names
   * one the store does not hold — cannot be approved, because there is nothing
   * for the gate to check the air window, territory, channel and rights type
   * against. Optional in the type only so legacy in-memory entries still load;
   * `[SCHED-RIGHTS-02]` refuses them at the lifecycle boundary.
   */
  rightsRecordId?: string;
  /**
   * Optional canonical episode reference (`BroadcastEpisode.episodeCode`).
   * When present, schedule presentation can surface the episode's registered
   * DAM master on the now/next widget (SCR-03 follow-on). Optional so legacy
   * entries remain valid; validated on submit/amend — a blank value or one
   * that contradicts the entry's own version is rejected (one episode truth),
   * never stored as a free-text guess.
   */
  episodeCode?: string;
}

/**
 * One immutable revision of an approved schedule (PRD §15: "An approved schedule
 * has a revision identity… A later approved change creates a new revision; it
 * does not overwrite earlier approval or what actually aired").
 */
export interface ScheduleRevision {
  revisionId: string;
  revision: number;
  /** The transition that produced this revision. */
  producedBy: "APPROVAL" | "AMENDMENT";
  actor: string;
  at: Date;
  approvedBy?: string;
  approvedAt?: Date;
  /** Frozen snapshot — later amendments never rewrite it. */
  entries: readonly ScheduleEntry[];
}

/**
 * Operational evidence for a post-approval stage. PRD §15 forbids advancing
 * ON AIR / AS-RUN RECONCILED from a planning flag, so an advance requires a named
 * artifact from the as-run / playout / carrier leg; certificate-id claims are
 * verified against the proof-of-air registry rather than taken on trust.
 */
export interface ScheduleAirEvidence {
  source: "PLAYOUT_AS_RUN_LOG" | "PROOF_OF_AIR_CERTIFICATE" | "CARRIER_UPLINK_TELEMETRY";
  evidenceId: string;
  /** When it actually aired, from the evidence — not when the record was written. */
  observedAt: Date;
  channelCode: string;
  /** Planned-versus-actual difference, preserved rather than corrected away. */
  note?: string;
}

export interface ScheduleStageTransition {
  stage: ScheduleState;
  at: Date;
  actor: string;
  detail?: string;
}

export interface BroadcastScheduleRecord {
  scheduleId: string;
  channelId: string;
  broadcastDate: string; // YYYY-MM-DD in Africa/Lagos — the governing timezone
  state: ScheduleState;
  entries: ScheduleEntry[];
  lockoutAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  amendmentCount: number;
  /** 1-based revision counter; 0 until the day is approved. */
  revision: number;
  /** `SCHEDULE#Rn` identity of what is currently approved for air. */
  revisionId?: string;
  revisions: ScheduleRevision[];
  stageTrail: ScheduleStageTransition[];
  /** Rights-gate outcome for the current entry set (TSK-10, computed). */
  rightsCheck?: { checkedBy: string; at: Date; entriesChecked: number };
  /** Traffic/commercial control attestation — authority step, see the machine header. */
  trafficReady?: { attestedBy: string; at: Date };
  /** Playlist/EPG generation, bound to the revision it was generated from. */
  playlist?: { generatedBy: string; at: Date; revisionId: string; playlistId: string };
  onAir?: ScheduleAirEvidence;
  /** Per-entry operational evidence, preserved so planned-versus-actual stays visible. */
  asRunReconciled?: {
    reconciledBy: string;
    at: Date;
    entriesReconciled: number;
    evidence: Array<{ entryId: string; source: ScheduleAirEvidence["source"]; evidenceId: string; observedAt: Date; note?: string }>;
  };
  archivedAt?: Date;
}

const schedules = new Map<string, BroadcastScheduleRecord>();
export const SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR = 30;

function requireActor(value: string | undefined, code: string, label: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`[${code}] ${label} is mandatory (auditable stage authority).`);
  }
  return value.trim();
}

/** Append a stage to the trail and return the record for chaining assertions. */
function recordStage(
  schedule: BroadcastScheduleRecord,
  stage: ScheduleState,
  actor: string,
  at: Date = new Date(),
  detail?: string
): BroadcastScheduleRecord {
  schedule.stageTrail.push({ stage, at, actor, detail });
  return schedule;
}

function snapshotEntries(entries: ScheduleEntry[]): ScheduleEntry[] {
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))) as readonly ScheduleEntry[] as ScheduleEntry[];
}

function validateScheduleEntries(entries: ScheduleEntry[]): string[] {
  const errors: string[] = [];
  const sorted = [...entries].sort((a, b) => a.startSecondsFromDayStart - b.startSecondsFromDayStart);
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.durationSeconds <= 0) {
      errors.push(`[SCHED-VAL-03] Entry '${entry.entryId}' has a non-positive duration.`);
    }
    if (!entry.rightsClearedBy || entry.rightsClearedBy.trim().length === 0) {
      errors.push(`[SCHED-RIGHTS-01] Entry '${entry.entryId}' has no rights-clearance attestation (rightsClearedBy is mandatory).`);
    }
    if (!entry.rightsRecordId || entry.rightsRecordId.trim().length === 0) {
      errors.push(`[SCHED-RIGHTS-02] Entry '${entry.entryId}' names no RightsRecord (rightsRecordId is mandatory): an attestation string cannot clear a slot.`);
    }
    if (!isVersionAirable(entry.versionId)) {
      errors.push(`[SCHED-VAL-02] Entry '${entry.entryId}' references version '${entry.versionId}' which is not Ready-For-Air.`);
    }
    if (entry.episodeCode !== undefined) {
      if (typeof entry.episodeCode !== "string" || entry.episodeCode.trim().length === 0) {
        errors.push(`[SCHED-VAL-06] Entry '${entry.entryId}' carries an empty episodeCode — omit the field instead of supplying a blank episode reference.`);
      } else {
        const version = getVersion(entry.versionId);
        if (version && version.episodeId.trim() !== entry.episodeCode.trim()) {
          errors.push(`[SCHED-VAL-07] Entry '${entry.entryId}' episodeCode '${entry.episodeCode.trim()}' contradicts version '${entry.versionId}' episode '${version.episodeId}' (one episode truth).`);
        }
      }
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevEnd = prev.startSecondsFromDayStart + prev.durationSeconds;
      if (entry.startSecondsFromDayStart < prevEnd) {
        errors.push(`[SCHED-VAL-01] Overlap: entry '${entry.entryId}' starts at ${entry.startSecondsFromDayStart}s before '${prev.entryId}' ends at ${prevEnd}s.`);
      }
    }
  }
  return errors;
}

export function upsertDraftSchedule(params: {
  scheduleId: string;
  channelId: string;
  broadcastDate: string;
  entries: ScheduleEntry[];
}): BroadcastScheduleRecord {
  const existing = schedules.get(params.scheduleId);
  if (existing && existing.state !== "DRAFT" && existing.state !== "AMENDED") {
    throw new Error(`[SCHED-STATE-01] Schedule '${params.scheduleId}' is '${existing.state}'; entries can only be authored in DRAFT or AMENDED.`);
  }
  const record: BroadcastScheduleRecord = existing
    ? {
        ...existing,
        channelId: params.channelId,
        broadcastDate: params.broadcastDate,
        entries: [...params.entries],
        state: "DRAFT",
        amendmentCount: existing.amendmentCount,
        // Re-drafting discards the gates that were passed against the *previous*
        // entry set: the rights check and the traffic attestation belong to those
        // entries, not to these. (A generated playlist cannot be re-drafted at all —
        // `[SCHED-STATE-01]` refuses anything outside DRAFT/AMENDED.)
        rightsCheck: undefined,
        trafficReady: undefined,
      }
    : {
        scheduleId: params.scheduleId,
        channelId: params.channelId,
        broadcastDate: params.broadcastDate,
        state: "DRAFT",
        entries: [...params.entries],
        amendmentCount: 0,
        revision: 0,
        revisions: [],
        stageTrail: [{ stage: "DRAFT", at: new Date(), actor: "SCHEDULER", detail: "Draft authored" }],
      };
  schedules.set(params.scheduleId, record);
  return record;
}

/**
 * DRAFT/AMENDED → PROGRAMMING_REVIEW. Structural validation only (RFA versions,
 * no overlaps, attestation + `rightsRecordId` on every entry, `episodeCode`
 * consistency). PRD §15 keeps the rights decision at RIGHTS_CHECK, so this handoff
 * deliberately does **not** clear anything.
 */
export function submitScheduleForApproval(scheduleId: string, submittedBy = "SCHEDULER"): BroadcastScheduleRecord {
  // The actor is required *before* anything is read or written: a blank authority
  // must leave the day exactly as it was, not half-advanced into review.
  const actor = requireActor(submittedBy, "SCHED-SUB-01", "submittedBy");
  const schedule = schedules.get(scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${scheduleId}' not found.`);
  if (schedule.state !== "DRAFT" && schedule.state !== "AMENDED") {
    throw new Error(`[SCHED-STATE-02] Only DRAFT or AMENDED schedules can be submitted for approval (current: ${schedule.state}).`);
  }
  if (schedule.entries.length === 0) {
    throw new Error("[SCHED-VAL-04] Cannot submit an empty schedule for approval.");
  }
  const errors = validateScheduleEntries(schedule.entries);
  if (errors.length > 0) {
    throw new Error(`[SCHED-VAL-00] Schedule validation failed: ${errors.join(" | ")}`);
  }
  schedule.state = "PROGRAMMING_REVIEW";
  return recordStage(schedule, "PROGRAMMING_REVIEW", actor);
}

/** PROGRAMMING_REVIEW → RIGHTS_CHECK: editorial sign-off by a named reviewer. */
export function passProgrammingReview(params: { scheduleId: string; reviewedBy: string }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "PROGRAMMING_REVIEW") {
    throw new Error(`[SCHED-STATE-05] Only PROGRAMMING_REVIEW schedules can be signed off (current: ${schedule.state}).`);
  }
  const reviewedBy = requireActor(params.reviewedBy, "SCHED-PRV-01", "reviewedBy");
  schedule.state = "RIGHTS_CHECK";
  return recordStage(schedule, "RIGHTS_CHECK", reviewedBy, new Date(), "Programming review signed off; rights check pending");
}

/**
 * RIGHTS_CHECK → TRAFFIC_READY. This is the computed gate (TSK-10):
 * `validateScheduleRights` over the registered `RightsRecord` of every entry. A
 * blocked candidate cannot pass it, so PRD §15's "cannot pass RIGHTS CHECK or
 * reach an approved/exportable schedule" is enforced here rather than only at
 * approval — and a refusal leaves the day in RIGHTS_CHECK, never further.
 */
export function passRightsCheck(params: { scheduleId: string; checkedBy: string }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "RIGHTS_CHECK") {
    throw new Error(`[SCHED-STATE-06] Only RIGHTS_CHECK schedules can be put through the rights gate (current: ${schedule.state}).`);
  }
  const checkedBy = requireActor(params.checkedBy, "SCHED-RIGHTS-04", "checkedBy");
  const clearance = clearScheduleEntries(schedule);
  if (!clearance.allowed) {
    throw new Error(
      `[SCHED-RIGHTS-03] Schedule '${params.scheduleId}' cannot pass RIGHTS_CHECK — the rights gate blocks ` +
        `${clearance.failures.length} of ${clearance.entriesChecked} entries: ${formatClearanceFailures(clearance.failures)}`
    );
  }
  schedule.rightsCheck = { checkedBy, at: new Date(), entriesChecked: clearance.entriesChecked };
  schedule.state = "TRAFFIC_READY";
  return recordStage(schedule, "TRAFFIC_READY", checkedBy, schedule.rightsCheck.at, `Rights gate cleared ${clearance.entriesChecked}/${clearance.entriesChecked} entries`);
}

/**
 * TRAFFIC_READY → APPROVED (pending the approver's decision). Traffic/commercial
 * control is an **attestation by a named officer**, not a computed inventory
 * check — automating it is TSK-11/TSK-16 and claiming otherwise would repeat
 * CA-08's fabrication. Recorded as `[SCHED-TRAF-01]` when the officer is missing.
 */
export function passTrafficCheck(params: { scheduleId: string; attestedBy: string }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "TRAFFIC_READY") {
    throw new Error(`[SCHED-STATE-07] Only TRAFFIC_READY schedules can be attested by traffic (current: ${schedule.state}).`);
  }
  const attestedBy = requireActor(params.attestedBy, "SCHED-TRAF-01", "attestedBy");
  // The day already *entered* TRAFFIC_READY when the rights gate cleared it; this is
  // the officer satisfying that stage, so it is written on the record rather than
  // appended as a second stage entry. `stageTrail` stays the chain of stages entered.
  schedule.trafficReady = { attestedBy, at: new Date() };
  return schedule;
}

/**
 * Runs the rights gate over a schedule's entries against their **registered**
 * RightsRecords. The episode identity comes from the version the entry points
 * at, so an entry can only claim an episode its own master already carries.
 */
function clearScheduleEntries(schedule: { channelId: string; broadcastDate: string; entries: ScheduleEntry[] }) {
  return checkScheduleEntriesClearance({
    channelId: schedule.channelId,
    broadcastDate: schedule.broadcastDate,
    entries: schedule.entries.map((entry) => ({
      entryId: entry.entryId,
      rightsRecordId: entry.rightsRecordId,
      startSecondsFromDayStart: entry.startSecondsFromDayStart,
      durationSeconds: entry.durationSeconds,
      episodeId: getVersion(entry.versionId)?.episodeId ?? entry.episodeCode,
    })),
  });
}

/**
 * TRAFFIC_READY → APPROVED, and computes the lock-out instant: 30 minutes before
 * air (broadcastDate 00:00 Africa/Lagos ≈ 23:00 UTC the prior day). Lock-out
 * protects the playout cache changeover window.
 *
 * Approval is the authoritative exploitation decision, so the rights gate runs
 * here as well as at RIGHTS_CHECK (TSK-10 — defence in depth): every entry must
 * clear against its registered RightsRecord. A single failing entry leaves the
 * schedule exactly where it was — the attestation string in `rightsClearedBy`
 * grants no authority, and no approval is written.
 */
export function approveSchedule(params: { scheduleId: string; approvedBy: string }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "TRAFFIC_READY") {
    throw new Error(
      `[SCHED-STATE-03] Only TRAFFIC_READY schedules can be approved (current: ${schedule.state}). ` +
        "PRD §15 requires PROGRAMMING_REVIEW → RIGHTS_CHECK → TRAFFIC_READY before APPROVED."
    );
  }
  const approvedBy = requireActor(params.approvedBy, "SCHED-APR-01", "approvedBy");
  if (!schedule.rightsCheck) {
    throw new Error(`[SCHED-APR-02] Schedule '${params.scheduleId}' has no recorded rights-gate pass; approval would skip RIGHTS_CHECK.`);
  }
  if (!schedule.trafficReady) {
    throw new Error(`[SCHED-APR-03] Schedule '${params.scheduleId}' has no traffic/commercial attestation; approval would skip the traffic control.`);
  }
  const clearance = clearScheduleEntries(schedule);
  if (!clearance.allowed) {
    throw new Error(
      `[SCHED-RIGHTS-03] Schedule '${params.scheduleId}' approval refused — the rights gate blocks ` +
        `${clearance.failures.length} of ${clearance.entriesChecked} entries: ${formatClearanceFailures(clearance.failures)}`
    );
  }
  const airStartUtcMs = scheduleDayStartUtc(schedule.broadcastDate).getTime();
  const at = new Date();
  schedule.approvedBy = approvedBy;
  schedule.approvedAt = at;
  schedule.lockoutAt = new Date(airStartUtcMs - SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR * 60 * 1000);
  schedule.state = "APPROVED";
  appendRevision(schedule, "APPROVAL", approvedBy, at);
  return recordStage(schedule, "APPROVED", approvedBy, at, `Approved as ${schedule.revisionId}`);
}

/**
 * Revision identity (PRD §15): approval creates `SCHEDULE#R1` and every later
 * approved change creates a new revision. The snapshot is frozen, so an earlier
 * approval and what was scheduled against it stay addressable forever.
 */
function appendRevision(
  schedule: BroadcastScheduleRecord,
  producedBy: ScheduleRevision["producedBy"],
  actor: string,
  at: Date
): ScheduleRevision {
  schedule.revision += 1;
  schedule.revisionId = `${schedule.scheduleId}#R${schedule.revision}`;
  const revision: ScheduleRevision = {
    revisionId: schedule.revisionId,
    revision: schedule.revision,
    producedBy,
    actor,
    at,
    approvedBy: schedule.approvedBy,
    approvedAt: schedule.approvedAt,
    entries: snapshotEntries(schedule.entries),
  };
  schedule.revisions.push(revision);
  return revision;
}

/**
 * Locks an approved day once the lock-out instant has passed. LOCKED is the
 * past-lock-out immutability control over APPROVED / AMENDED / PLAYLIST_GENERATED:
 * it does not replace the PRD chain, and a locked day stays approved for air.
 */
export function lockScheduleIfPastLockout(scheduleId: string, now: Date = new Date()): BroadcastScheduleRecord | null {
  const schedule = schedules.get(scheduleId);
  if (!schedule) return null;
  const preAir = schedule.state === "APPROVED" || schedule.state === "AMENDED" || schedule.state === "PLAYLIST_GENERATED";
  if (preAir && schedule.lockoutAt && now.getTime() >= schedule.lockoutAt.getTime()) {
    schedule.state = "LOCKED";
  }
  return schedule;
}

/**
 * Amends an APPROVED/AMENDED schedule before lock-out. The candidate day is
 * revalidated in full (downstream protection) and the rights attestations
 * re-checked; a failing validation rejects the whole amendment atomically.
 */
export function amendSchedule(params: { scheduleId: string; entries: ScheduleEntry[]; amendedBy: string; now?: Date }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state === "LOCKED") {
    throw new Error(`[SCHED-LOCK-01] Schedule '${params.scheduleId}' is LOCKED (past ${schedule.lockoutAt?.toISOString()}); mid-air amendments are forbidden. Author a new schedule.`);
  }
  if (schedule.state !== "APPROVED" && schedule.state !== "AMENDED") {
    throw new Error(`[SCHED-STATE-04] Only APPROVED or AMENDED schedules can be amended (current: ${schedule.state}).`);
  }
  const amendedBy = requireActor(params.amendedBy, "SCHED-AMD-01", "amendedBy");
  const now = params.now || new Date();
  if (schedule.lockoutAt && now.getTime() >= schedule.lockoutAt.getTime()) {
    schedule.state = "LOCKED";
    throw new Error(`[SCHED-LOCK-02] Lock-out has passed (${schedule.lockoutAt.toISOString()}); schedule is now LOCKED and the amendment was rejected.`);
  }
  const errors = validateScheduleEntries(params.entries);
  if (errors.length > 0) {
    throw new Error(`[SCHED-AMD-02] Amendment revalidation failed — write rejected atomically: ${errors.join(" | ")}`);
  }
  // An AMENDED schedule is still air-approved, so the candidate entries carry the
  // same clearance authority as the original ones: the gate re-decides every entry
  // before the write lands (TSK-10).
  const clearance = clearScheduleEntries({ channelId: schedule.channelId, broadcastDate: schedule.broadcastDate, entries: params.entries });
  if (!clearance.allowed) {
    throw new Error(
      `[SCHED-RIGHTS-03] Amendment of schedule '${params.scheduleId}' rejected atomically — the rights gate blocks ` +
        `${clearance.failures.length} of ${clearance.entriesChecked} entries: ${formatClearanceFailures(clearance.failures)}`
    );
  }
  schedule.entries = [...params.entries];
  schedule.state = "AMENDED";
  schedule.amendmentCount += 1;
  // The gate just re-decided *these* entries, so the recorded rights pass belongs to
  // the new entry set, not the one it replaced.
  schedule.rightsCheck = { checkedBy: amendedBy, at: now, entriesChecked: clearance.entriesChecked };
  // PRD §15: the amendment creates a new revision rather than overwriting R1. No
  // playlist needs discarding here — a day with an executable playlist is already
  // past amendment (`[SCHED-STATE-04]`), so a playlist always names the revision
  // currently approved for air.
  appendRevision(schedule, "AMENDMENT", amendedBy, now);
  return recordStage(schedule, "AMENDED", amendedBy, now, `Amended as ${schedule.revisionId} (amendment #${schedule.amendmentCount})`);
}

/**
 * PLAYLIST_GENERATED — the executable playlist is bound to the revision it was
 * generated from (PRD §15: "Every exportable playlist and EPG export identifies
 * the source schedule revision"). A later amendment clears it: what playout holds
 * must match what is currently approved, never what was approved before.
 */
export function generatePlaylist(params: { scheduleId: string; generatedBy: string; at?: Date }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  const preAir = schedule.state === "APPROVED" || schedule.state === "AMENDED" || schedule.state === "LOCKED";
  if (!preAir) {
    throw new Error(
      `[SCHED-STATE-08] Only an approved day that has not aired can generate a playlist (current: ${schedule.state}). ` +
        "PRD §15 puts PLAYLIST_GENERATED after APPROVED."
    );
  }
  const generatedBy = requireActor(params.generatedBy, "SCHED-PLS-01", "generatedBy");
  if (!schedule.revisionId) {
    throw new Error(`[SCHED-PLS-02] Schedule '${params.scheduleId}' has no revision identity; a playlist cannot name the revision it exports.`);
  }
  const at = params.at || new Date();
  schedule.playlist = { generatedBy, at, revisionId: schedule.revisionId, playlistId: `${schedule.revisionId}#PL` };
  // A locked day stays locked: LOCKED is the immutability control over the entries,
  // so generating the executable playlist must not quietly un-mark it.
  if (schedule.state !== "LOCKED") schedule.state = "PLAYLIST_GENERATED";
  return recordStage(schedule, "PLAYLIST_GENERATED", generatedBy, at, `Playlist ${schedule.playlist.playlistId} from ${schedule.revisionId}`);
}

/**
 * Verifies an operational-evidence claim. A proof-of-air certificate is checked
 * against the proof-of-air registry — an unregistered or unverifiable id is
 * refused, because PRD §15 makes ON AIR depend on *actual* operational evidence
 * rather than on whatever string a caller supplies.
 */
function verifyAirEvidence(evidence: ScheduleAirEvidence, label: string): void {
  if (!evidence || typeof evidence !== "object") {
    throw new Error(`[SCHED-AIR-02] ${label} requires operational evidence (source, evidenceId, observedAt, channelCode).`);
  }
  if (evidence.source !== "PLAYOUT_AS_RUN_LOG" && evidence.source !== "PROOF_OF_AIR_CERTIFICATE" && evidence.source !== "CARRIER_UPLINK_TELEMETRY") {
    throw new Error(`[SCHED-AIR-02] ${label} evidence source '${String(evidence.source)}' is not an accepted operational artifact.`);
  }
  requireActor(evidence.evidenceId, "SCHED-AIR-02", `${label} evidenceId`);
  requireActor(evidence.channelCode, "SCHED-AIR-04", `${label} evidence channelCode`);
  if (!(evidence.observedAt instanceof Date) || Number.isNaN(evidence.observedAt.getTime())) {
    throw new Error(`[SCHED-AIR-03] ${label} evidence has no real observedAt — the air time must come from the evidence, not from the plan.`);
  }
  if (evidence.source !== "PROOF_OF_AIR_CERTIFICATE") return;
  const certificate = getProofOfAirCertificate(evidence.evidenceId);
  if (!certificate) {
    throw new Error(
      `[SCHED-AIR-05] ${label} cites proof-of-air certificate '${evidence.evidenceId}' which is not in the proof-of-air registry. ` +
        "ON AIR cannot be advanced from an unverifiable certificate id."
    );
  }
  if (!certificate.isVerified || !certificate.cryptographicSignature) {
    throw new Error(`[SCHED-AIR-06] ${label} cites certificate '${evidence.evidenceId}' which is not verified/signed; the claim was refused.`);
  }
  if (certificate.channelCode !== evidence.channelCode) {
    throw new Error(
      `[SCHED-AIR-07] ${label} evidence channelCode '${evidence.channelCode}' contradicts certificate '${certificate.certificateId}' channelCode ` +
        `'${certificate.channelCode}'.`
    );
  }
}

/**
 * The evidence has to name the channel the schedule is for. Playout logs and
 * carrier telemetry are per-channel artifacts, so a certificate from another
 * channel describes a different transmission.
 */
function assertEvidenceChannel(schedule: { channelId: string }, evidence: ScheduleAirEvidence, label: string): void {
  if (evidence.channelCode !== schedule.channelId) {
    throw new Error(
      `[SCHED-AIR-09] ${label} evidence '${evidence.evidenceId}' names channel '${evidence.channelCode}' but schedule ` +
        `'${schedule.channelId}' is the day being advanced.`
    );
  }
}

/**
 * An operational artifact has to belong to the broadcast day it is being used to
 * evidence: `observedAt` must fall inside the WAT day the schedule covers.
 * Otherwise a log from any other day could advance this one.
 */
function assertEvidenceOnBroadcastDay(
  schedule: { scheduleId: string; broadcastDate: string },
  evidence: ScheduleAirEvidence,
  label: string
): void {
  const dayStartMs = scheduleDayStartUtc(schedule.broadcastDate).getTime();
  const dayEndMs = dayStartMs + 24 * 3600 * 1000;
  const observed = evidence.observedAt.getTime();
  if (observed < dayStartMs || observed >= dayEndMs) {
    throw new Error(
      `[SCHED-AIR-08] ${label} evidence '${evidence.evidenceId}' observedAt ${evidence.observedAt.toISOString()} is outside the ` +
        `broadcast day ${schedule.broadcastDate} (Africa/Lagos) schedule '${schedule.scheduleId}' covers.`
    );
  }
}

/**
 * PLAYLIST_GENERATED → ON_AIR from operational evidence (playout as-run log,
 * verified proof-of-air certificate, or carrier uplink telemetry). There is no
 * manual `markOnAir` without evidence: PRD §15 explicitly forbids advancing this
 * stage from a planning flag.
 */
export function markOnAir(params: { scheduleId: string; evidence: ScheduleAirEvidence }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "PLAYLIST_GENERATED" && schedule.state !== "LOCKED") {
    throw new Error(`[SCHED-STATE-09] Only PLAYLIST_GENERATED (or LOCKED) schedules can be evidenced ON AIR (current: ${schedule.state}).`);
  }
  if (!schedule.playlist) {
    throw new Error(`[SCHED-AIR-01] Schedule '${schedule.scheduleId}' has no generated playlist; nothing executable has been handed to playout.`);
  }
  const evidence = params.evidence;
  verifyAirEvidence(evidence, `Schedule '${schedule.scheduleId}' ON_AIR`);
  assertEvidenceChannel(schedule, evidence, `Schedule '${schedule.scheduleId}' ON_AIR`);
  assertEvidenceOnBroadcastDay(schedule, evidence, `Schedule '${schedule.scheduleId}' ON_AIR`);
  schedule.onAir = { ...evidence, observedAt: new Date(evidence.observedAt.getTime()) };
  schedule.state = "ON_AIR";  return recordStage(
    schedule,
    "ON_AIR",
    evidence.evidenceId,
    evidence.observedAt,
    `${evidence.source} ${evidence.evidenceId} @ ${evidence.observedAt.toISOString()}${evidence.note ? ` — ${evidence.note}` : ""}`
  );
}

/**
 * ON_AIR → AS_RUN_RECONCILED: every entry of the aired day needs its own
 * operational evidence, and the planned-versus-actual difference is preserved on
 * the record rather than corrected away. Partial evidence leaves the day ON_AIR —
 * reconciliation is all-or-nothing, so a day is never reported as reconciled on
 * the strength of the entries that happened to have logs.
 */
export function reconcileAsRun(params: {
  scheduleId: string;
  reconciledBy: string;
  evidence: Array<ScheduleAirEvidence & { entryId: string }>;
  at?: Date;
}): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "ON_AIR") {
    throw new Error(`[SCHED-STATE-10] Only ON_AIR schedules can be as-run reconciled (current: ${schedule.state}).`);
  }
  const reconciledBy = requireActor(params.reconciledBy, "SCHED-REC-00", "reconciledBy");
  const known = new Map(schedule.entries.map((entry) => [entry.entryId, entry]));
  const seen = new Map<string, ScheduleAirEvidence & { entryId: string }>();
  for (const item of params.evidence) {
    if (!known.has(item.entryId)) {
      throw new Error(`[SCHED-REC-02] As-run evidence '${item.evidenceId}' names entry '${item.entryId}' which is not on schedule '${schedule.scheduleId}'.`);
    }
    if (seen.has(item.entryId)) {
      throw new Error(`[SCHED-REC-04] Entry '${item.entryId}' has more than one as-run artifact; the actual air of a slot is a single fact.`);
    }
    verifyAirEvidence(item, `Entry '${item.entryId}' as-run`);
    assertEvidenceChannel(schedule, item, `Entry '${item.entryId}' as-run`);
    assertEvidenceOnBroadcastDay(schedule, item, `Entry '${item.entryId}' as-run`);
    seen.set(item.entryId, item);
  }
  const missing = schedule.entries.filter((entry) => !seen.has(entry.entryId)).map((entry) => entry.entryId);
  if (missing.length > 0) {
    throw new Error(
      `[SCHED-REC-01] Schedule '${schedule.scheduleId}' is not reconciled — ${missing.length} of ${schedule.entries.length} aired entries have ` +
        `no operational evidence: ${missing.join(", ")}`
    );
  }
  const at = params.at || new Date();
  schedule.asRunReconciled = {
    reconciledBy,
    at,
    entriesReconciled: seen.size,
    evidence: [...seen.values()].map((item) => ({
      entryId: item.entryId,
      source: item.source,
      evidenceId: item.evidenceId,
      observedAt: new Date(item.observedAt.getTime()),
      note: item.note,
    })),
  };
  schedule.state = "AS_RUN_RECONCILED";
  return recordStage(schedule, "AS_RUN_RECONCILED", reconciledBy, at, `Reconciled ${seen.size}/${schedule.entries.length} entries from operational evidence`);
}

/**
 * AS_RUN_RECONCILED → ARCHIVED. A day that has not been reconciled cannot be
 * archived away: the as-run record is what the archive preserves.
 */
export function archiveSchedule(params: { scheduleId: string; archivedBy: string; at?: Date }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "AS_RUN_RECONCILED") {
    throw new Error(`[SCHED-STATE-11] Only an AS_RUN_RECONCILED schedule can be archived (current: ${schedule.state}).`);
  }
  const archivedBy = requireActor(params.archivedBy, "SCHED-ARC-01", "archivedBy");
  const at = params.at || new Date();
  schedule.archivedAt = at;
  schedule.state = "ARCHIVED";
  return recordStage(schedule, "ARCHIVED", archivedBy, at, `Archived ${schedule.revisionId} with as-run reconciliation`);
}

/**
 * An approved schedule's revision identity is addressable forever (PRD §15: a
 * later change "does not overwrite earlier approval or what actually aired").
 * Exports and disputes cite `SCHEDULE#Rn`; R1 stays readable after an amendment.
 */
export function getScheduleRevision(scheduleId: string, revisionId: string): ScheduleRevision | undefined {
  const schedule = schedules.get(scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${scheduleId}' not found.`);
  return schedule.revisions.find((revision) => revision.revisionId === revisionId);
}

/** The revision currently approved for air, or undefined while the day is in planning. */
export function getApprovedRevision(schedule: BroadcastScheduleRecord): ScheduleRevision | undefined {
  if (!isApprovedForAir(schedule.state)) return undefined;
  return schedule.revisions.find((revision) => revision.revisionId === schedule.revisionId);
}

export function getSchedule(scheduleId: string): BroadcastScheduleRecord | undefined {
  return schedules.get(scheduleId);
}
export function listSchedules(channelId?: string): BroadcastScheduleRecord[] {
  const all = [...schedules.values()];
  return channelId ? all.filter((s) => s.channelId === channelId) : all;
}

export function _resetSchedulesForTesting(): void {
  schedules.clear();
}
