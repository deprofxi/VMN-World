/**
 * Viewer Schedule Presentation — TODO-BCST-08 / TODO-BCST-09
 * (TASK-P7-02 viewer-timezone presentation, R1.2A §16 EPG freshness)
 *
 * Responsibilities:
 *  - Resolve the "on air now" / "up next" pair from a schedule that is approved
 *    for air (APPROVED or any later PRD §15 stage) — never from draft or
 *    pre-approval data.
 *  - Convert schedule times into the viewer's timezone while labelling
 *    Africa/Lagos (WAT) as the governing timezone of the broadcast day.
 *  - Report honest "unavailable" states (UIUX-001 §3.4) when no approved
 *    schedule exists for the channel/day — a static sample must never pose
 *    as live EPG data.
 */

import { BroadcastScheduleRecord, isApprovedForAir, ScheduleEntry } from "../../modules/broadcast/versions/index.js";
import { findEpisodeMaster, type EpisodeMasterState } from "../../modules/broadcast/episode-masters.js";
import { escapeHtml } from "../components/escape.js";

/** The single governing timezone of the VMNL broadcast day (R1.2A §16). */
export const GOVERNING_TIMEZONE = "Africa/Lagos";
const GOVERNING_TZ_OFFSET_MINUTES = 60; // WAT = UTC+1, no DST

/**
 * TODO-BCST-08: resolves the viewer timezone for server-side rendering from
 * the browser's `Time-Zone` header when it carries one of the supported
 * presentation zones; defaults to the governing zone otherwise. This is
 * presentation-only — the governing WAT schedule truth is never rewritten.
 */
export function defaultViewerTimezone(headerValue?: string): ViewerTimezone {
  if (headerValue && headerValue in VIEWER_TZ_OFFSET_MINUTES) {
    return headerValue as ViewerTimezone;
  }
  return "Africa/Lagos";
}

export type ViewerTimezone = "Africa/Lagos" | "UTC" | "Europe/London";

const VIEWER_TZ_OFFSET_MINUTES: Record<ViewerTimezone, number> = {
  "Africa/Lagos": 60,
  "UTC": 0,
  // Resolved for standard time; BST (+01:00) is annotated at render time.
  "Europe/London": 0,
};

export interface ViewerScheduleSlotView {
  entryId: string;
  title: string;
  /** Canonical episode reference when the entry carries one (optional — legacy entries have none). */
  episodeCode?: string;
  startTimeUtc: string; // ISO
  endTimeUtc: string; // ISO
  startViewerTime: string; // "HH:MM" in viewer timezone
  endViewerTime: string; // "HH:MM" in viewer timezone
  startGoverningTime: string; // "HH:MM" WAT — the governing-timezone label
  dayShiftViewer: number; // -1 | 0 | 1 — day offset vs governing day
}

export interface NowAndNextView {
  available: true;
  channelCode: string;
  viewerTimezone: ViewerTimezone;
  governingTimezone: string;
  current: ViewerScheduleSlotView;
  next: ViewerScheduleSlotView;
  /** EPG freshness marker used to key caches (R1.2A §16). */
  epgFreshnessKey: string;
}

export interface UnavailableNowNextView {
  available: false;
  channelCode: string;
  reason: "NO_APPROVED_SCHEDULE" | "EMPTY_SCHEDULE" | "OUTSIDE_COVERAGE";
  message: string;
}

export type NowNextView = NowAndNextView | UnavailableNowNextView;

function hhmm(date: Date, viewerTz: ViewerTimezone): { time: string; dayShift: number } {
  const utcMs = date.getTime() + VIEWER_TZ_OFFSET_MINUTES[viewerTz] * 60 * 1000;
  const shifted = new Date(utcMs);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  // Day shift relative to the governing WAT day of the schedule date.
  const govMs = date.getTime() + GOVERNING_TZ_OFFSET_MINUTES * 60 * 1000;
  const dayShift = Math.round((Math.floor(utcMs / 86400000) - Math.floor(govMs / 86400000)));
  return { time: `${hh}:${mm}`, dayShift };
}

function toSlotView(entry: ScheduleEntry, broadcastDate: string, viewerTz: ViewerTimezone): ViewerScheduleSlotView {
  const dayStartUtcMs = Date.parse(`${broadcastDate}T00:00:00Z`) - GOVERNING_TZ_OFFSET_MINUTES * 60 * 1000;
  const start = new Date(dayStartUtcMs + entry.startSecondsFromDayStart * 1000);
  const end = new Date(start.getTime() + entry.durationSeconds * 1000);
  const viewer = hhmm(start, viewerTz);
  const viewerEnd = hhmm(end, viewerTz);
  const governing = hhmm(start, "Africa/Lagos");
  return {
    entryId: entry.entryId,
    title: entry.programmeTitle,
    episodeCode: entry.episodeCode,
    startTimeUtc: start.toISOString(),
    endTimeUtc: end.toISOString(),
    startViewerTime: viewer.time,
    endViewerTime: viewerEnd.time,
    startGoverningTime: governing.time,
    dayShiftViewer: viewer.dayShift,
  };
}

/**
 * Resolves now/next from an approved schedule for the given instant. A schedule is
 * eligible only once it is approved for air (APPROVED, AMENDED, LOCKED, or any
 * later PRD §15 stage) — DRAFT and pre-approval states (PROGRAMMING_REVIEW /
 * RIGHTS_CHECK / TRAFFIC_READY) never reach the viewer (one authoritative
 * schedule truth; no preview leakage).
 */
export function resolveNowAndNext(params: {
  channelCode: string;
  schedules: BroadcastScheduleRecord[];
  now?: Date;
  viewerTimezone?: ViewerTimezone;
}): NowNextView {
  const now = params.now || new Date();
  const viewerTz = params.viewerTimezone || "Africa/Lagos";

  const eligible = params.schedules
    .filter((s) => s.channelId === params.channelCode)
    .filter((s) => isApprovedForAir(s.state))
    .sort((a, b) => b.broadcastDate.localeCompare(a.broadcastDate));

  const schedule = eligible.find((s) => {
    const dayStartUtcMs = Date.parse(`${s.broadcastDate}T00:00:00Z`) - GOVERNING_TZ_OFFSET_MINUTES * 60 * 1000;
    const dayEndUtcMs = dayStartUtcMs + 24 * 3600 * 1000;
    return now.getTime() >= dayStartUtcMs && now.getTime() < dayEndUtcMs;
  });

  if (!schedule) {
    return {
      available: false,
      channelCode: params.channelCode,
      reason: "NO_APPROVED_SCHEDULE",
      message: "Schedule guide is being updated. An approved broadcast schedule for today is not yet published (UIUX-001 §3.4).",
    };
  }
  if (schedule.entries.length === 0) {
    return {
      available: false,
      channelCode: params.channelCode,
      reason: "EMPTY_SCHEDULE",
      message: "Schedule guide is being updated. Today's approved schedule has no published entries yet.",
    };
  }

  const dayStartUtcMs = Date.parse(`${schedule.broadcastDate}T00:00:00Z`) - GOVERNING_TZ_OFFSET_MINUTES * 60 * 1000;
  const nowSecondsFromDayStart = Math.floor((now.getTime() - dayStartUtcMs) / 1000);

  const sorted = [...schedule.entries].sort((a, b) => a.startSecondsFromDayStart - b.startSecondsFromDayStart);
  const currentIndex = sorted.findIndex(
    (e) => nowSecondsFromDayStart >= e.startSecondsFromDayStart && nowSecondsFromDayStart < e.startSecondsFromDayStart + e.durationSeconds
  );

  // Outside all coverage for today: honest state, no extrapolation.
  if (currentIndex === -1) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const withinDay = nowSecondsFromDayStart >= first.startSecondsFromDayStart && nowSecondsFromDayStart < last.startSecondsFromDayStart + last.durationSeconds;
    if (!withinDay) {
      return {
        available: false,
        channelCode: params.channelCode,
        reason: "OUTSIDE_COVERAGE",
        message: "The channel is outside its published broadcast hours. Today's schedule guide remains available below.",
      };
    }
    // Inside the day but in an unpublished gap between entries.
    return {
      available: false,
      channelCode: params.channelCode,
      reason: "OUTSIDE_COVERAGE",
      message: "Off-air interval between published programmes. The next published programme appears in the schedule guide.",
    };
  }

  const current = sorted[currentIndex];
  const next = sorted[currentIndex + 1];
  if (!next) {
    // End of the approved day: report the current programme with no invented "next".
    return {
      available: false,
      channelCode: params.channelCode,
      reason: "OUTSIDE_COVERAGE",
      message: "You are watching today's final published programme. Tomorrow's approved schedule has not been published yet.",
    };
  }

  return {
    available: true,
    channelCode: params.channelCode,
    viewerTimezone: viewerTz,
    governingTimezone: GOVERNING_TIMEZONE,
    current: toSlotView(current, schedule.broadcastDate, viewerTz),
    next: toSlotView(next, schedule.broadcastDate, viewerTz),
    // Cache key changes whenever the approved schedule content changes.
    epgFreshnessKey: `${schedule.scheduleId}:${schedule.amendmentCount}:${sorted.length}`,
  };
}

const MASTER_STATE_COLORS: Record<EpisodeMasterState, string> = {
  AVAILABLE: "var(--vmn-color-success-600, #15803d)",
  QUARANTINED: "var(--vmn-color-danger-600, #b91c1c)",
  FAILED: "var(--vmn-color-danger-600, #b91c1c)",
  UNREGISTERED: "var(--vmn-color-warning-600, #b45309)",
  NO_REFERENCE: "var(--vmn-color-text-muted, #64748b)",
};

/**
 * SCR-03 follow-on: renders the episode's registered DAM master for a
 * now/next slot. Lookup is a read-time probe of the boot-refreshed
 * BroadcastEpisode → DAM index — never cached, never invented. Legacy
 * entries without an episodeCode render nothing; not-indexed, unregistered,
 * no-reference, quarantined and failed episodes each render their honest
 * state so a viewer never mistakes a blocked master for a clean one.
 */
function renderSlotMasterLineHtml(channelCode: string, slot: ViewerScheduleSlotView): string {
  if (!slot.episodeCode) return "";
  const mono = "font-family:monospace; font-size:0.78rem;";
  const baseStyle = "margin:4px 0 0; font-size:0.78rem;";
  const master = findEpisodeMaster(channelCode, slot.episodeCode);
  if (!master) {
    return `
 <p class="vmn-master-ref" style="${baseStyle} color:var(--vmn-color-warning-600,#b45309);">Master: <span style="${mono}">${escapeHtml(slot.episodeCode)}</span> — episode not indexed in this environment</p>`;
  }
  if (master.state === "NO_REFERENCE") {
    return `
 <p class="vmn-master-ref" style="${baseStyle} color:var(--vmn-color-text-muted,#64748b);">Master: <span style="${mono}">${escapeHtml(master.episodeCode)}</span> — no master reference registered</p>`;
  }
  const color = MASTER_STATE_COLORS[master.state];
  const tail =
    master.state === "AVAILABLE"
      ? master.assetTitle
        ? ` · ${escapeHtml(master.assetTitle)}`
        : ""
      : master.state === "UNREGISTERED"
        ? " — not registered in the DAM registry"
        : " — blocked from exploitation";
  return `
 <p class="vmn-master-ref" style="${baseStyle} color:${escapeHtml(color)};">Master: <span style="${mono}">${escapeHtml(master.mediaAssetId!)}</span> <strong>${escapeHtml(master.state)}</strong>${escapeHtml(tail)}</p>`;
}

/**
 * Renders the now/next widget HTML from the resolved view. The unavailable
 * state renders the honest notice — never a fabricated "on air" pair.
 */
export function renderNowNextWidgetHtml(view: NowNextView, viewerTz: ViewerTimezone = "Africa/Lagos"): string {
  if (!view.available) {
    return `
<section class="vmn-on-air-widget" aria-label="Broadcast status">
 <div class="vmn-widget-header s-qOwfMX8S_6" >
    <span class="vmn-channel-badge">Schedule guide</span>
  </div>
  <div class="vmn-now-playing">
    <p class="vmn-show-synopsis" role="status">${escapeHtml(view.message)}</p>
  </div>
</section>`;
  }
  // `viewerTz` reaches this widget from the browser's Time-Zone header, so it is
  // escaped wherever it enters markup (including this note, which is then safe
  // to interpolate on its own).
  const dayShiftNote =
    view.current.dayShiftViewer !== 0 || view.next.dayShiftViewer !== 0
      ? ` · crosses midnight in ${escapeHtml(viewerTz)}`
      : "";
  return `
<section class="vmn-on-air-widget" aria-label="Broadcast status">
 <div class="vmn-widget-header s-dmu8Bkv_3r" >
    <span class="vmn-live-badge" aria-label="Live broadcast"><span class="vmn-pulse-dot" aria-hidden="true"></span> ON AIR NOW</span>
    <span class="vmn-channel-badge">Times shown in ${escapeHtml(viewerTz)} · broadcast day governed by ${GOVERNING_TIMEZONE} (WAT)${escapeHtml(dayShiftNote)}</span>
  </div>
  <div class="vmn-now-playing">
    <div class="vmn-time-range">${escapeHtml(view.current.startViewerTime)} – ${escapeHtml(view.current.endViewerTime)} (${escapeHtml(viewerTz)})</div>
    <h3 class="vmn-show-title">${escapeHtml(view.current.title)}</h3>
    <p class="vmn-show-synopsis">On air now. Governing schedule time ${escapeHtml(view.current.startGoverningTime)} WAT.</p>
    ${renderSlotMasterLineHtml(view.channelCode, view.current)}
  </div>
  <div class="vmn-next-playing">
    <span class="vmn-time-range">Up next at ${escapeHtml(view.next.startViewerTime)} (${escapeHtml(viewerTz)})</span>
 <h3 class="vmn-show-title s-lrZwJ-ejsm" >${escapeHtml(view.next.title)}</h3>
    ${renderSlotMasterLineHtml(view.channelCode, view.next)}
  </div>
</section>`;
}
