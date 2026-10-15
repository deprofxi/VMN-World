/**
 * Schedule Clearance — TSK-10 (report.md CA-07 defect 2 & 4)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45 (no clearance, no
 * exploitation), UIUX-CCPP-001 §2.2 UI-RL1-R07.
 *
 * `validateScheduleRights` was always correct; it was simply never on the
 * authoritative path. Schedule approval looked at a non-empty `rightsClearedBy`
 * string and the EPG export looked at an approval timestamp, so the free-text
 * attestation *was* the gate. This module is the missing link: for every entry
 * it loads the registered `RightsRecord` (registry, i.e. the durable store) and
 * asks the gate whether that record permits the entry's own air window on that
 * channel.
 *
 * Fail-closed by construction: an entry with no `rightsRecordId`, or one naming
 * a record the store does not hold, is a clearance failure — never a pass, and
 * never a decision taken from data the caller handed over.
 */

import { RightsBlockingReason, validateScheduleRights } from "./clearance.js";
import { findExclusiveWindowsForAsset, getRegisteredRightsRecord } from "./registry.js";

/**
 * The schedule day is a WAT calendar date (`broadcastDate`), so the day start is
 * 00:00 Africa/Lagos expressed as a UTC instant. Same convention the schedule
 * lock-out uses (versions/index.ts), so an entry's air window and its lock-out
 * instant cannot disagree.
 */
export const WAT_OFFSET_MS = 60 * 60 * 1000;

export function scheduleDayStartUtc(broadcastDate: string): Date {
  return new Date(Date.parse(`${broadcastDate}T00:00:00Z`) + WAT_OFFSET_MS);
}

/** The gate's own reasons, plus the two ways an entry can arrive with nothing to clear against. */
export type ScheduleClearanceCode =
  | RightsBlockingReason
  | "RIGHTS_RECORD_ID_MISSING"
  | "RIGHTS_RECORD_NOT_REGISTERED";

export interface ClearableScheduleEntry {
  entryId: string;
  rightsRecordId?: string;
  startSecondsFromDayStart: number;
  durationSeconds: number;
  episodeId?: string;
}

export interface ScheduleEntryClearanceFailure {
  entryId: string;
  code: ScheduleClearanceCode;
  reason: string;
}

export interface ScheduleClearanceResult {
  allowed: boolean;
  entriesChecked: number;
  failures: ScheduleEntryClearanceFailure[];
}

export function checkEntryClearance(
  entry: ClearableScheduleEntry,
  context: { channelId: string; broadcastDate: string; targetTerritory?: string; targetMediaType?: string }
): ScheduleEntryClearanceFailure | null {
  const rightsRecordId = entry.rightsRecordId?.trim() ?? "";
  if (!rightsRecordId) {
    return {
      entryId: entry.entryId,
      code: "RIGHTS_RECORD_ID_MISSING",
      reason: `Entry '${entry.entryId}' names no RightsRecord, so there is nothing to clear it against.`,
    };
  }

  const record = getRegisteredRightsRecord(rightsRecordId);
  if (!record) {
    return {
      entryId: entry.entryId,
      code: "RIGHTS_RECORD_NOT_REGISTERED",
      reason: `RightsRecord '${rightsRecordId}' for entry '${entry.entryId}' is not registered in the durable store.`,
    };
  }

  const airStart = new Date(scheduleDayStartUtc(context.broadcastDate).getTime() + entry.startSecondsFromDayStart * 1000);
  const result = validateScheduleRights({
    episodeId: entry.episodeId ?? entry.entryId,
    channelCode: context.channelId,
    scheduledAirTime: airStart,
    scheduledDurationSeconds: entry.durationSeconds,
    rightsRecord: record,
    targetTerritory: context.targetTerritory,
    targetMediaType: context.targetMediaType,
    existingExclusiveWindows: findExclusiveWindowsForAsset(record.assetId, record.id),
  });

  if (result.allowed || !result.code) return null;
  return { entryId: entry.entryId, code: result.code, reason: result.reason ?? `RightsRecord '${record.id}' does not permit this slot.` };
}

export function checkScheduleEntriesClearance(params: {
  channelId: string;
  broadcastDate: string;
  entries: readonly ClearableScheduleEntry[];
  targetTerritory?: string;
  targetMediaType?: string;
}): ScheduleClearanceResult {
  const failures: ScheduleEntryClearanceFailure[] = [];
  for (const entry of params.entries) {
    const failure = checkEntryClearance(entry, {
      channelId: params.channelId,
      broadcastDate: params.broadcastDate,
      targetTerritory: params.targetTerritory,
      targetMediaType: params.targetMediaType,
    });
    if (failure) failures.push(failure);
  }
  return { allowed: failures.length === 0, entriesChecked: params.entries.length, failures };
}

export function formatClearanceFailures(failures: ScheduleEntryClearanceFailure[]): string {
  return failures.map((f) => `${f.entryId}: ${f.code} — ${f.reason}`).join(" | ");
}
