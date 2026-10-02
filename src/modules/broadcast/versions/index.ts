/**
 * Broadcast Version & Ready-For-Air Workflow — TASK-P2-02 completion
 * (todo.md TODO-BCST-04, TODO-BCST-05)
 * Authority: R1.2A §14 / tasks.md TASK-P2-02 — hierarchical Title → Season →
 * Episode → Broadcast Version (Master/Clean/Subtitled/Censored) with technical
 * QC gate; non-compliant masters cannot be marked RFA without explicit
 * technical override.
 */

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
// TODO-BCST-03: Schedule authoring, approval & lock-out (TASK-P2-04)
//
// Lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → (past lock-out) LOCKED,
// with pre-lock-out amendments returning the schedule to AMENDED (still
// air-approved) after full revalidation. Invariants:
//  - Only RFA versions may be scheduled (TODO-BCST-04 gate reused).
//  - Every entry carries a rights-cleared-by signature — schedule writes are
//    exploitations, and there is no clearance without evidence (canonical
//    laws 4 & 8). Rights truth stays in the rights register; the schedule
//    only records who attested to it.
//  - No overlaps; non-positive durations rejected.
//  - Amendments revalidate the whole downstream day before the write lands
//    (UAT Drill 08); a failing revalidation rejects the amendment atomically.
//  - LOCKED schedules are immutable — mid-air changes require a new schedule
//    with a fresh approval trail.
// ---------------------------------------------------------------------------

export type ScheduleState = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "AMENDED" | "LOCKED";

export interface ScheduleEntry {
  entryId: string;
  versionId: string;
  programmeTitle: string;
  startSecondsFromDayStart: number;
  durationSeconds: number;
  rightsClearedBy: string;
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
}

const schedules = new Map<string, BroadcastScheduleRecord>();
export const SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR = 30;

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
    if (!isVersionAirable(entry.versionId)) {
      errors.push(`[SCHED-VAL-02] Entry '${entry.entryId}' references version '${entry.versionId}' which is not Ready-For-Air.`);
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
    ? { ...existing, channelId: params.channelId, broadcastDate: params.broadcastDate, entries: [...params.entries], state: "DRAFT", amendmentCount: existing.amendmentCount }
    : {
        scheduleId: params.scheduleId,
        channelId: params.channelId,
        broadcastDate: params.broadcastDate,
        state: "DRAFT",
        entries: [...params.entries],
        amendmentCount: 0,
      };
  schedules.set(params.scheduleId, record);
  return record;
}

export function submitScheduleForApproval(scheduleId: string): BroadcastScheduleRecord {
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
  schedule.state = "PENDING_APPROVAL";
  return schedule;
}

/**
 * Approves a PENDING_APPROVAL schedule and computes the lock-out instant:
 * 30 minutes before air (broadcastDate 00:00 Africa/Lagos ≈ 23:00 UTC the
 * prior day). Lock-out protects the playout cache changeover window.
 */
export function approveSchedule(params: { scheduleId: string; approvedBy: string }): BroadcastScheduleRecord {
  const schedule = schedules.get(params.scheduleId);
  if (!schedule) throw new Error(`[SCHED-01] Schedule '${params.scheduleId}' not found.`);
  if (schedule.state !== "PENDING_APPROVAL") {
    throw new Error(`[SCHED-STATE-03] Only PENDING_APPROVAL schedules can be approved (current: ${schedule.state}).`);
  }
  if (!params.approvedBy || params.approvedBy.trim().length === 0) {
    throw new Error("[SCHED-APR-01] approvedBy is mandatory (auditable approval authority).");
  }
  const airStartUtcMs = Date.parse(`${schedule.broadcastDate}T00:00:00Z`) + 60 * 60 * 1000; // WAT = UTC+1
  schedule.approvedBy = params.approvedBy.trim();
  schedule.approvedAt = new Date();
  schedule.lockoutAt = new Date(airStartUtcMs - SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR * 60 * 1000);
  schedule.state = "APPROVED";
  return schedule;
}

/** Locks an APPROVED schedule once the lock-out instant has passed. */
export function lockScheduleIfPastLockout(scheduleId: string, now: Date = new Date()): BroadcastScheduleRecord | null {
  const schedule = schedules.get(scheduleId);
  if (!schedule) return null;
  if ((schedule.state === "APPROVED" || schedule.state === "AMENDED") && schedule.lockoutAt && now.getTime() >= schedule.lockoutAt.getTime()) {
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
  if (!params.amendedBy || params.amendedBy.trim().length === 0) {
    throw new Error("[SCHED-AMD-01] amendedBy is mandatory (auditable amendment authority).");
  }
  const now = params.now || new Date();
  if (schedule.lockoutAt && now.getTime() >= schedule.lockoutAt.getTime()) {
    schedule.state = "LOCKED";
    throw new Error(`[SCHED-LOCK-02] Lock-out has passed (${schedule.lockoutAt.toISOString()}); schedule is now LOCKED and the amendment was rejected.`);
  }
  const errors = validateScheduleEntries(params.entries);
  if (errors.length > 0) {
    throw new Error(`[SCHED-AMD-02] Amendment revalidation failed — write rejected atomically: ${errors.join(" | ")}`);
  }
  schedule.entries = [...params.entries];
  schedule.state = "AMENDED";
  schedule.amendmentCount += 1;
  return schedule;
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
