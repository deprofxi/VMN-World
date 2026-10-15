/**
 * EPG Export & Syndication Push — TODO-BCST-02, rights re-check added by TSK-10,
 * source revision identity by TSK-12
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45 (no clearance, no
 * exploitation), tasks.md TASK-P2-05, UAT Drill 07.
 *
 * Two independent refusals protect this path:
 * 1. **Source honesty** — sample/rolling scheduler data is never published as an
 *    operational feed; only an approved-for-air schedule from the real lifecycle,
 *    carrying a revision identity, reaches the generator
 *    (`APPROVED_SCHEDULE_UNAVAILABLE`).
 * 2. **Clearance honesty** — an approved timestamp is not a rights decision.
 *    Every slot is re-checked against its registered `RightsRecord` at export
 *    time, so a window that expired after approval blocks the feed
 *    (`RIGHTS_NOT_CLEARED_AT_EXPORT`) instead of syndicating an uncleared slot.
 */

import { generateXmltvFeed } from "../epg/index.js";
import { getChannelByCode } from "../channels/index.js";
import { ScheduleSlot } from "../scheduling/index.js";
import {
  checkScheduleEntriesClearance,
  formatClearanceFailures,
  scheduleDayStartUtc,
} from "../rights/schedule-clearance.js";

/** A slot the schedule lifecycle approved, carrying the record its clearance depends on. */
export interface ApprovedScheduleSlot extends ScheduleSlot {
  rightsRecordId?: string;
}

export interface ApprovedScheduleDay {
  /** The WAT calendar date the slots belong to. */
  broadcastDate: string;
  /**
   * `SCHEDULE#Rn` — the approved schedule revision this day was exported from
   * (PRD §15: "Every exportable playlist and EPG export identifies the source
   * schedule revision"). Empty means the source has no revision identity.
   */
  revisionId: string;
  slots: ApprovedScheduleSlot[];
}

export interface ApprovedScheduleSource {
  /** Returns the approved, locked slots for a channel+date, or null when no approved source is connected. */
  getApprovedSchedule(channelCode: string, dateIso: string): ApprovedScheduleDay | null;
}

/**
 * Sandbox stand-in: no approved schedule source is connected, so exports are
 * gated exactly like the API honesty gate. Injected by tests that must prove the
 * unavailable branch without touching schedule state.
 */
export const sandboxScheduleSource: ApprovedScheduleSource = {
  getApprovedSchedule: () => null,
};

export type EpgExportStatus = "EXPORTED" | "APPROVED_SCHEDULE_UNAVAILABLE" | "RIGHTS_NOT_CLEARED";

export interface EpgExportResult {
  status: EpgExportStatus;
  channelCode?: string;
  date?: string;
  /** The approved schedule revision the feed was generated from. */
  revisionId?: string;
  xmltv?: string;
  code?: string;
  message?: string;
}

/**
 * Re-runs the rights gate over the slots the source handed over. Slots carry an
 * absolute start time, so the entry offset is taken back from the same WAT day
 * start the schedule module used to author them — the export cannot widen a slot
 * or move it outside the cleared window.
 */
export function recheckClearanceAtExport(
  channelCode: string,
  day: ApprovedScheduleDay
): { allowed: true } | { allowed: false; code: string; message: string } {
  const dayStartMs = scheduleDayStartUtc(day.broadcastDate).getTime();
  const clearance = checkScheduleEntriesClearance({
    channelId: channelCode,
    broadcastDate: day.broadcastDate,
    entries: day.slots.map((slot) => ({
      entryId: slot.id,
      rightsRecordId: slot.rightsRecordId,
      startSecondsFromDayStart: Math.round((slot.startTime.getTime() - dayStartMs) / 1000),
      durationSeconds: slot.durationSeconds,
      episodeId: slot.episodeId,
    })),
  });
  if (clearance.allowed) return { allowed: true };
  return {
    allowed: false,
    code: "RIGHTS_NOT_CLEARED_AT_EXPORT",
    message: `Rights are no longer valid for ${clearance.failures.length} of ${clearance.entriesChecked} approved slots on ${channelCode}/${day.broadcastDate}: ${formatClearanceFailures(clearance.failures)}`,
  };
}

export function exportXmltv(
  channelCode: string,
  dateIso: string,
  source: ApprovedScheduleSource
): EpgExportResult {
  const channel = getChannelByCode(channelCode);
  if (!channel) {
    return { status: "APPROVED_SCHEDULE_UNAVAILABLE", code: "CHANNEL_NOT_FOUND", message: `Unknown channel '${channelCode}'.` };
  }
  const day = source.getApprovedSchedule(channelCode, dateIso);
  if (!day || day.slots.length === 0) {
    return {
      status: "APPROVED_SCHEDULE_UNAVAILABLE",
      code: "APPROVED_SCHEDULE_UNAVAILABLE",
      message: "No approved schedule source is connected; sample scheduler data is not published as an operational feed.",
    };
  }
  if (!day.revisionId) {
    return {
      status: "APPROVED_SCHEDULE_UNAVAILABLE",
      code: "SCHEDULE_REVISION_IDENTITY_MISSING",
      message:
        `Approved schedule day ${channelCode}/${dateIso} has no revision identity; PRD §15 requires every exportable EPG export to name the ` +
        "source schedule revision, so an unattributed feed is refused rather than published.",
    };
  }
  const clearance = recheckClearanceAtExport(channelCode, day);
  if (!clearance.allowed) {
    return { status: "RIGHTS_NOT_CLEARED", channelCode, date: dateIso, code: clearance.code, message: clearance.message };
  }
  return {
    status: "EXPORTED",
    channelCode,
    date: dateIso,
    revisionId: day.revisionId,
    xmltv: generateXmltvFeed(channel, day.slots, { sourceRevisionId: day.revisionId }),
  };
}

export interface PushResult {
  status: "PUSHED" | "NOT_CONNECTED";
  code?: string;
  message: string;
}

/**
 * StarTimes EPG push. There is no machine-to-machine carriage interface in
 * this environment (BG6 NOT_TESTED), so the push is honestly refused rather
 * than simulated as successful — and it refuses on the *re-checked* export, so
 * an uncleared slot can never be handed to a vendor dispatch list.
 */
export function pushToStarTimes(channelCode: string, dateIso: string, source: ApprovedScheduleSource): PushResult {
  const exportResult = exportXmltv(channelCode, dateIso, source);
  if (exportResult.status !== "EXPORTED") {
    return {
      status: "NOT_CONNECTED",
      code: exportResult.code ?? "APPROVED_SCHEDULE_UNAVAILABLE",
      message: exportResult.message || "No approved, rights-cleared schedule.",
    };
  }
  return {
    status: "NOT_CONNECTED",
    code: "CARRIAGE_INTERFACE_NOT_CONNECTED",
    message:
      "StarTimes EPG push requires the BG6 carriage machine interface, which is NOT_TESTED pending live uplink verification. The XMLTV payload is prepared and available for manual dispatch.",
  };
}
