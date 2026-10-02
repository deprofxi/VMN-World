/**
 * EPG Export & Syndication Push — TODO-BCST-02
 * Provides the XMLTV download pipeline and the (gated) StarTimes push action
 * behind an honesty gate: sample scheduler data is never published as an
 * operational feed (tasks.md TASK-P2-05, UAT Drill 07).
 */

import { generateXmltvFeed } from "../epg/index.js";
import { getChannelByCode } from "../channels/index.js";
import { ScheduleSlot } from "../scheduling/index.js";

export interface ApprovedScheduleSource {
  /** Returns the approved, locked slots for a channel+date, or null when no approved source is connected. */
  getApprovedSlots(channelCode: string, dateIso: string): ScheduleSlot[] | null;
}

/**
 * Sandbox stand-in: no approved schedule source is connected in the sandbox,
 * so exports are gated exactly like the API honesty gate.
 */
export const sandboxScheduleSource: ApprovedScheduleSource = {
  getApprovedSlots: () => null,
};

export interface EpgExportResult {
  status: "EXPORTED" | "APPROVED_SCHEDULE_UNAVAILABLE";
  channelCode?: string;
  date?: string;
  xmltv?: string;
  code?: string;
  message?: string;
}

export function exportXmltv(
  channelCode: string,
  dateIso: string,
  source: ApprovedScheduleSource = sandboxScheduleSource
): EpgExportResult {
  const channel = getChannelByCode(channelCode);
  if (!channel) {
    return { status: "APPROVED_SCHEDULE_UNAVAILABLE", code: "CHANNEL_NOT_FOUND", message: `Unknown channel '${channelCode}'.` };
  }
  const slots = source.getApprovedSlots(channelCode, dateIso);
  if (!slots || slots.length === 0) {
    return {
      status: "APPROVED_SCHEDULE_UNAVAILABLE",
      code: "APPROVED_SCHEDULE_UNAVAILABLE",
      message: "No approved schedule source is connected; sample scheduler data is not published as an operational feed.",
    };
  }
  return {
    status: "EXPORTED",
    channelCode,
    date: dateIso,
    xmltv: generateXmltvFeed(channel, slots),
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
 * than simulated as successful.
 */
export function pushToStarTimes(channelCode: string, dateIso: string, source: ApprovedScheduleSource = sandboxScheduleSource): PushResult {
  const exportResult = exportXmltv(channelCode, dateIso, source);
  if (exportResult.status !== "EXPORTED") {
    return { status: "NOT_CONNECTED", code: "APPROVED_SCHEDULE_UNAVAILABLE", message: exportResult.message || "No approved schedule." };
  }
  return {
    status: "NOT_CONNECTED",
    code: "CARRIAGE_INTERFACE_NOT_CONNECTED",
    message:
      "StarTimes EPG push requires the BG6 carriage machine interface, which is NOT_TESTED pending live uplink verification. The XMLTV payload is prepared and available for manual dispatch.",
  };
}
