/**
 * Broadcast Operational Screens Implementation (SCR-BCST-01 to 33)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46, §48, §67)
 * Design Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-401, DT-402, DT-404, DT-405, DT-406, DT-901, DT-903, DT-905
 *
 * Implements:
 * - DT-401: Complete Operator Shell with left rail of 10 Duty Stations (§4.2), global context bar (Channel · Date · Mode · Theme), role menu.
 * - DT-402: 33 screens designed as real views with information models, decisions, primary actions, KPIs, and domain tables.
 * - DT-404: Real empty, loading, error, and unauthorized states reachable via query parameters.
 * - DT-405: 24/7 visual schedule grid with dayparts, timeline slots, drag affordances, lock chips, and rights-blocked flags.
 * - DT-406: Live playout monitor, automation playlist lock with SHA-256 hash, and 3-way as-run reconciliation diff.
 * - DT-901/DT-903: Broadcast analytics & yield dashboard with color-blind safe charts and ₦ kobo-correct formatting.
 * - DT-905: EPG / XMLTV inspector with schedule-vs-published diff and StarTimes syndication push.
 */

import {
  BROADCAST_SCREEN_INVENTORY,
  BroadcastScreenDescriptor,
} from "../../modules/broadcast/screens/index.js";
import { renderIcon, IconName, renderEpisodeMastersTableHtml } from "../components/index.js";
import {
  renderMockDataBanner,
  renderScreenKpis,
  getScreenData,
  type ScreenDataContext,
} from "../../modules/broadcast/screens/data.js";
import { listEpisodeMasters } from "../../modules/broadcast/episode-masters.js";
import { getAllActiveChannels } from "../../modules/broadcast/channels/index.js";
import { getApprovedRevision, listSchedules } from "../../modules/broadcast/versions/index.js";
import { createHash } from "node:crypto";

/** HTML escaping for the shared template (TSK-49: no duplicate-attribute renders). */
function esc(value: string): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Seconds from day start → `HH:MM`. */
function clockOf(secondsFromDayStart: number): string {
  const h = Math.floor(secondsFromDayStart / 3600);
  const m = Math.floor((secondsFromDayStart % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * TSK-11: a screen's KPI strip is built from the honest data layer, never from a
 * per-screen literal. `engines` is supplied by the caller when it holds live
 * services; anything it does not supply degrades to an explicit NOT_CONNECTED
 * badge rather than a fabricated value (`screens/data.ts` header, UIUX-001 §4.3).
 */
function buildScreenDataContext(engines?: ScreenDataContext["engines"]): ScreenDataContext {
  const channels = getAllActiveChannels().map((c) => ({
    code: c.code,
    name: c.name,
    isProvisional: c.starTimesCarriage.isProvisional,
  }));
  const approvedScheduleConnected = listSchedules().some(
    (s) => getApprovedRevision(s) !== undefined && s.state !== "DRAFT"
  );
  return {
    channels,
    // Carriage is a verified external fact (CLAUDE.md <broadcast> law); nothing in
    // this layer can assert it, so screens render it as provisional.
    carriageVerified: false,
    approvedScheduleConnected,
    engines,
  };
}

/** An honest "no source connected" panel for bespoke branches with no live feed. */
function notConnectedPanel(heading: string, reason: string): string {
  return `
    <div class="card s-4h8zhEfDP0">
      <h4 class="s-IjylZHBtZ8">${esc(heading)}</h4>
      <div role="status" class="s-1g0qfXP0ld">
        <span class="vmn-badge badge-neutral">NOT CONNECTED</span>
        <p class="s-Vgd1b_7V2z">${esc(reason)}</p>
      </div>
    </div>
  `;
}

/**
 * The approved broadcast day, read from the schedule store: one row per entry of
 * each channel's currently-approved revision. Empty is a real answer — the desks
 * render an explicit no-records state rather than a stand-in row (TSK-11).
 */
function approvedScheduleEntries(): Array<{
  scheduleId: string;
  channelId: string;
  broadcastDate: string;
  state: string;
  programmeTitle: string;
  window: string;
  episodeCode?: string;
  rightsRecordId?: string;
  screenIdForLink: string;
}> {
  const rows: ReturnType<typeof approvedScheduleEntries> = [];
  for (const schedule of listSchedules()) {
    const revision = getApprovedRevision(schedule);
    if (!revision) continue;
    for (const entry of revision.entries) {
      rows.push({
        scheduleId: `${schedule.scheduleId}${schedule.revisionId ? ` · ${schedule.revisionId}` : ""}`,
        channelId: schedule.channelId,
        broadcastDate: schedule.broadcastDate,
        state: schedule.state,
        programmeTitle: entry.programmeTitle,
        window: `${clockOf(entry.startSecondsFromDayStart)}-${clockOf(
          entry.startSecondsFromDayStart + entry.durationSeconds
        )}`,
        episodeCode: entry.episodeCode,
        rightsRecordId: entry.rightsRecordId,
        screenIdForLink: "SCR-BCST-12",
      });
    }
  }
  return rows.sort(
    (a, b) => a.broadcastDate.localeCompare(b.broadcastDate) || a.channelId.localeCompare(b.channelId)
  );
}


export interface MatchedScreenRoute {
  screen: BroadcastScreenDescriptor;
  params: Record<string, string>;
}

export interface DutyStation {
  id: string;
  name: string;
  gate: string;
  screens: string[];
  icon: IconName;
  description: string;
}

/**
 * 10 Operational Duty Stations mandated by docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) §4.2 and R1.2A §67 Release Gates.
 */
export const DUTY_STATIONS: DutyStation[] = [
  {
    id: "commissioning",
    name: "Commissioning",
    gate: "Gate BG0–BG1",
    screens: ["SCR-BCST-10", "SCR-BCST-11"],
    icon: "document",
    description: "Inbound content acquisition deals, format labs, and original production commissioning milestones.",
  },
  {
    id: "catalogue",
    name: "Catalogue & Rights",
    gate: "Gate BG2",
    screens: [
      "SCR-BCST-04",
      "SCR-BCST-05",
      "SCR-BCST-06",
      "SCR-BCST-07",
      "SCR-BCST-08",
      "SCR-BCST-09",
    ],
    icon: "film",
    description: "Master titles, series arc, segment breakdown, QC flags, and territorial rights clearance.",
  },
  {
    id: "scheduling",
    name: "Scheduling",
    gate: "Gate BG3–BG4",
    screens: [
      "SCR-BCST-02",
      "SCR-BCST-03",
      "SCR-BCST-12",
      "SCR-BCST-13",
      "SCR-BCST-14",
    ],
    icon: "calendar",
    description: "24/7 visual schedule grid, dayparts, rate definitions, and XMLTV EPG syndication feeds.",
  },
  {
    id: "traffic",
    name: "Traffic & Inventory",
    gate: "Gate BG5",
    screens: [
      "SCR-BCST-15",
      "SCR-BCST-16",
      "SCR-BCST-17",
      "SCR-BCST-18",
      "SCR-BCST-19",
      "SCR-BCST-20",
      "SCR-BCST-21",
    ],
    icon: "bolt",
    description: "Commercial break structure, spot avails, campaign flighting, and daily transmission traffic logs.",
  },
  {
    id: "playout",
    name: "Playout",
    gate: "Gate BG6–BG7",
    screens: ["SCR-BCST-22", "SCR-BCST-23"],
    icon: "play",
    description: "Automation playlist frame-accurate lock, live on-air monitor, and emergency filler overrides.",
  },
  {
    id: "transmission",
    name: "Transmission & Carriage",
    gate: "Gate BG8",
    screens: [
      "SCR-BCST-25",
      "SCR-BCST-26",
      "SCR-BCST-27",
      "SCR-BCST-28",
      "SCR-BCST-29",
    ],
    icon: "broadcast",
    description: "Carrier RF monitoring, StarTimes DTT/DTH satellite transponders, and distribution bouquets.",
  },
  {
    id: "reconciliation",
    name: "Proof & Reconciliation",
    gate: "Gate BG9",
    screens: ["SCR-BCST-24", "SCR-BCST-30"],
    icon: "check",
    description: "3-way match as-run reconciliation (plan vs log vs RF telemetry) and cryptographically signed Proof-of-Air.",
  },
  {
    id: "revenue",
    name: "Revenue",
    gate: "Gate BG9",
    screens: ["SCR-BCST-31"],
    icon: "shield",
    description: "Daypart yield analytics, average spot rates, and unbooked inventory cost recovery.",
  },
  {
    id: "analytics",
    name: "Analytics",
    gate: "Gate BG9",
    screens: ["SCR-BCST-32", "SCR-BCST-33"],
    icon: "chart",
    description: "Audience reach, viewing share, and cross-platform Azeebo+ on-air QR conversion tracking.",
  },
  {
    id: "executive",
    name: "Continuity & Command",
    gate: "Gate BG0–BG9",
    screens: ["SCR-BCST-01"],
    icon: "tv",
    description: "Enterprise executive command, portfolio health, daily broadcast yield, and SLA outage monitoring.",
  },
];

/**
 * Gate mappings per screen (R1.2A §67 Release Gates).
 */
const SCREEN_GATES: Record<string, string> = {
  "SCR-BCST-01": "Gate BG0–BG9 (Executive Command)",
  "SCR-BCST-02": "Gate BG3 (Bouquet Portfolio)",
  "SCR-BCST-03": "Gate BG3 (Channel Technical Parameters)",
  "SCR-BCST-04": "Gate BG2 (Programme Catalogue)",
  "SCR-BCST-05": "Gate BG2 (Programme Master Record)",
  "SCR-BCST-06": "Gate BG2 (Series Arc & Slates)",
  "SCR-BCST-07": "Gate BG2 (Episode Segmentation & Cues)",
  "SCR-BCST-08": "Gate BG2 (QC Flags & Censorship Slates)",
  "SCR-BCST-09": "Gate BG2 (Territory Rights Readiness)",
  "SCR-BCST-10": "Gate BG1 (Acquisition Rights Window)",
  "SCR-BCST-11": "Gate BG0 (Commissioning Production Milestones)",
  "SCR-BCST-12": "Gate BG4 (24/7 Visual Schedule Grid)",
  "SCR-BCST-13": "Gate BG3 (Daypart Rate Definitions)",
  "SCR-BCST-14": "Gate BG4 (EPG XMLTV Syndication)",
  "SCR-BCST-15": "Gate BG5 (Promo & Filler Optimization)",
  "SCR-BCST-16": "Gate BG5 (Commercial Inventory Avails)",
  "SCR-BCST-17": "Gate BG5 (Break Structure & Spot Order)",
  "SCR-BCST-18": "Gate BG5 (Campaign Flighting & Commitments)",
  "SCR-BCST-19": "Gate BG5 (Spot Copy QC & Loudness Approval)",
  "SCR-BCST-20": "Gate BG5 (Sponsorship Bug & Naming Entitlements)",
  "SCR-BCST-21": "Gate BG5 (Daily Traffic Log Finalization)",
  "SCR-BCST-22": "Gate BG6 (Automation Playlist Lock & Hash)",
  "SCR-BCST-23": "Gate BG7 (Live Playout Monitor & Overrides)",
  "SCR-BCST-24": "Gate BG9 (3-Way As-Run Reconciliation)",
  "SCR-BCST-25": "Gate BG8 (Real-Time Transmission RF Monitor)",
  "SCR-BCST-26": "Gate BG8 (Carrier Incidents & SLA Downtime)",
  "SCR-BCST-27": "Gate BG8 (Distribution Carriage Platforms)",
  "SCR-BCST-28": "Gate BG8 (StarTimes Satellite Uplink Telemetry)",
  "SCR-BCST-29": "Gate BG8 (Carriage Agreements & Fees)",
  "SCR-BCST-30": "Gate BG9 (Cryptographic Proof-of-Air Dispatcher)",
  "SCR-BCST-31": "Gate BG9 (Broadcast Revenue Yield Dashboard)",
  "SCR-BCST-32": "Gate BG9 (Channel Audience Ratings & Share)",
  "SCR-BCST-33": "Gate BG9 (Azeebo+ Cross-Platform Conversion)",
};

/**
 * Primary Operational Decisions per screen (what the operator must decide).
 */
/**
 * TSK-11: per-screen decision label and primary action only. The fabricated
 * `kpis` literals this table used to carry (“Carriage Uptime 99.98%”, “Daily Yield
 * ₦18.4M”, “Eutelsat 16A @ 16°E”, “11,554 MHz” …) are deleted: every KPI a screen
 * renders now comes from `getScreenData`, which yields a sourced value or an
 * explicit NOT_CONNECTED state (UIUX-001 §4.3 — no invented audience, revenue or
 * uptime figures).
 */
const SCREEN_DECISION_TEXT: Record<string, { decision: string; actionLabel: string }> = {
  "SCR-BCST-01": {
    decision: "Assess tri-channel transmission continuity, StarTimes transponder lock, and daily revenue yield.",
    actionLabel: "Export Executive Briefing",
  },
  "SCR-BCST-02": {
    decision: "Verify channel bouquet alignments, carriage assignments, and regional distribution tiers.",
    actionLabel: "Update Bouquet Configuration",
  },
  "SCR-BCST-03": {
    decision: "Audit transmission bitrates, audio loudness profiles (-23 LUFS), and StarTimes PID mappings.",
    actionLabel: "Save Channel Profile",
  },
  "SCR-BCST-04": {
    decision: "Audit master catalogue metadata, license expiry windows, and ready-to-air episode availability.",
    actionLabel: "Register Master Title",
  },
  "SCR-BCST-05": {
    decision: "Review synopsis, cast credits, music cue sheet clearance, and broadcast transmission history.",
    actionLabel: "Approve Programme Master",
  },
  "SCR-BCST-06": {
    decision: "Manage episode run sequence, season arcs, deliverable delivery dates, and syndication windows.",
    actionLabel: "Reorder Episode Slate",
  },
  "SCR-BCST-07": {
    decision: "Define frame-accurate segment boundaries, commercial break insertion cue points, and end-credits timing.",
    actionLabel: "Save Segment Breakdown",
  },
  "SCR-BCST-08": {
    decision: "Review automated QC flags, audio peak violations, and NBC compliance censorship cuts.",
    actionLabel: "Authorize QC Slates",
  },
  "SCR-BCST-09": {
    decision: "Determine broadcast rights availability by territory, window, and exclusivity category before scheduling.",
    actionLabel: "Clear Linear Rights",
  },
  "SCR-BCST-10": {
    decision: "Approve acquisition license terms, royalty splits, and inbound material delivery deadlines.",
    actionLabel: "Execute Acquisition License",
  },
  "SCR-BCST-11": {
    decision: "Authorize milestone disbursements for original format productions and creator format labs.",
    actionLabel: "Authorize Milestone Release",
  },
  "SCR-BCST-12": {
    decision: "Balance 24/7 daypart schedule, resolve timing overlaps, and eliminate unprogrammed gaps.",
    actionLabel: "Lock 24/7 Schedule Grid",
  },
  "SCR-BCST-13": {
    decision: "Configure daypart rate cards, peak prime-time multipliers, and seasonal yield adjustments.",
    actionLabel: "Update Daypart Multipliers",
  },
  "SCR-BCST-14": {
    decision: "Inspect XMLTV syndication feed, verify differences against linear schedule, and push updates to StarTimes.",
    actionLabel: "Push Syndication to StarTimes",
  },
  "SCR-BCST-15": {
    decision: "Schedule station promos, lineup interstitials, and filler assets to guarantee zero dead air.",
    actionLabel: "Optimize Interstitial Slots",
  },
  "SCR-BCST-16": {
    decision: "Allocate commercial avails, track sell-out capacity per daypart, and prevent category clashes.",
    actionLabel: "Book Commercial Spot",
  },
  "SCR-BCST-17": {
    decision: "Structure commercial break sequence, station idents, and sponsor stings with frame-accurate timing.",
    actionLabel: "Save Break Structure",
  },
  "SCR-BCST-18": {
    decision: "Manage multi-week brand flighting schedules, GRP delivery guarantees, and client category quotas.",
    actionLabel: "Flight Campaign",
  },
  "SCR-BCST-19": {
    decision: "Inspect commercial copy files, verify EBU R128 loudness compliance, and confirm NBC clearance certificate.",
    actionLabel: "Authorize Commercial Copy",
  },
  "SCR-BCST-20": {
    decision: "Track broadcast sponsorship bugs, lower-third graphic deliveries, and programme naming rights counters.",
    actionLabel: "Bind Sponsor Entitlement",
  },
  "SCR-BCST-21": {
    decision: "Reconcile commercial bookings with schedule slots and freeze the daily traffic log for playout handover.",
    actionLabel: "Freeze Daily Traffic Log",
  },
  "SCR-BCST-22": {
    decision: "Sign and freeze the 24-hour automation playlist with cryptographic hash before pushing to edge playout servers.",
    actionLabel: "Freeze & Push Playlist",
  },
  "SCR-BCST-23": {
    decision: "Monitor real-time master control playout, next event countdown, and execute manual filler switch if required.",
    actionLabel: "Manual Emergency Override",
  },
  "SCR-BCST-24": {
    decision: "Execute 3-way reconciliation match between commercial bookings, playout as-run logs, and StarTimes RF evidence.",
    actionLabel: "Reconcile As-Run Log",
  },
  "SCR-BCST-25": {
    decision: "Inspect primary optical transport link, ASI stream integrity, and transmitter carrier telemetry in real time.",
    actionLabel: "Run Carrier Diagnostic",
  },
  "SCR-BCST-26": {
    decision: "Track carrier outages, log downtime incident minutes, and calculate StarTimes SLA penalty offsets.",
    actionLabel: "Log Incident Report",
  },
  "SCR-BCST-27": {
    decision: "Manage multi-platform distribution endpoints across StarTimes DTT, DTH satellite, and OTT feeds.",
    actionLabel: "Register Carriage Endpoint",
  },
  "SCR-BCST-28": {
    decision: "Audit StarTimes satellite transponder frequencies, uplink telemetry, and regional PID multiplexing.",
    actionLabel: "Test Uplink Telemetry",
  },
  "SCR-BCST-29": {
    decision: "Review StarTimes bouquet carriage agreements, revenue sharing formulas, and renewal terms.",
    actionLabel: "Review Carriage Contract",
  },
  "SCR-BCST-30": {
    decision: "Generate and dispatch cryptographically sealed Proof-of-Air Certificates to corporate advertisers.",
    actionLabel: "Generate Proof-of-Air Seal",
  },
  "SCR-BCST-31": {
    decision: "Analyze daily broadcast commercial yield, average spot pricing, and daypart revenue distribution.",
    actionLabel: "Export Financial Model",
  },
  "SCR-BCST-32": {
    decision: "Evaluate audience ratings, demographic market reach, and competitive share of viewing.",
    actionLabel: "Filter Audience Cohorts",
  },
  "SCR-BCST-33": {
    decision: "Track conversion attribution from on-air QR codes to Azeebo+ app installs, subscriptions, and stream retention.",
    actionLabel: "Export Conversion Funnel",
  },
};

/**
 * Normalizes parameterized route templates into RegExp for exact path matching.
 */
function routeToRegex(route: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const pattern = route.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return {
    regex: new RegExp(`^${pattern}$`),
    paramNames,
  };
}

const COMPILED_SCREEN_ROUTES = BROADCAST_SCREEN_INVENTORY.map((screen) => {
  const { regex, paramNames } = routeToRegex(screen.route);
  return { screen, regex, paramNames };
});

/**
 * Matches an incoming URL pathname to one of the 33 broadcast screens.
 */
export function matchBroadcastScreen(pathname: string): MatchedScreenRoute | null {
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "");

  for (const entry of COMPILED_SCREEN_ROUTES) {
    const match = cleanPath.match(entry.regex);
    if (match) {
      const params: Record<string, string> = {};
      entry.paramNames.forEach((name, idx) => {
        params[name] = decodeURIComponent(match[idx + 1]);
      });
      return { screen: entry.screen, params };
    }
  }

  return null;
}

/**
 * Evaluates whether a role is authorized to access a given broadcast screen.
 */
export function isRoleAuthorizedForScreen(userRole: string | undefined, screen: BroadcastScreenDescriptor): boolean {
  if (!userRole) return false;

  // Executive roles and system administrators have full visibility
  if (
    userRole === "ExecutiveSuperAdmin" ||
    userRole === "ExecutiveLeader" ||
    userRole === "BroadcastDirector"
  ) {
    return true;
  }

  // Exact primary role match
  if (userRole.toLowerCase() === screen.primaryRole.toLowerCase()) {
    return true;
  }

  // Operator desks have specific operating screen permissions
  if (
    (userRole === "MCRSupervisor" || userRole === "Operator") &&
    (screen.primaryRole === "PlayoutOperator" || screen.primaryRole === "BroadcastDirector")
  ) {
    return true;
  }

  if (
    userRole === "TrafficManager" &&
    (screen.primaryRole === "TrafficManager" || screen.primaryRole === "RightsManager")
  ) {
    return true;
  }

  if (
    userRole === "FinanceController" &&
    (screen.primaryRole === "FinanceController" || screen.primaryRole === "ExecutiveLeader")
  ) {
    return true;
  }

  return false;
}

/**
 * Renders the 24/7 visual schedule timeline grid (DT-405, SCR-BCST-12).
 */
function renderScheduleGridTimelineHtml(entries: ReturnType<typeof approvedScheduleEntries>): string {
  if (entries.length === 0) {
    return notConnectedPanel(
      "24-Hour Broadcast Master Timeline",
      "No approved schedule revision exists in the store for any channel, so there is no day to grid. Draft and unapproved schedules are never rendered as an on-air plan."
    );
  }

  const rows = entries
    .map((e) => {
      const blocked = e.rightsRecordId === undefined;
      return `
      <div class="timeline-slot-card ${blocked ? "rights-blocked" : "locked"}" tabindex="0" role="region" aria-label="${esc(e.window)} ${esc(e.programmeTitle)}">
        <div class="s-M5Xi2zsCVc">
          <span class="s-SW8QgET2Mg">${esc(e.window.split("-")[0])}</span>
          <span class="s-Gkf9MD02Cz">${esc(e.channelId)}</span>
        </div>
        <div class="s-jMD-KhmxeR">
          <strong class="s-L3sIR4KbdK">${esc(e.programmeTitle)}</strong>
          <span class="s-Vgd1b_7V2z">${esc(e.broadcastDate)} · ${esc(e.scheduleId)}</span>
        </div>
        <div class="s-6pzW9Sex-u">
          ${
            blocked
              ? `<span class="s-7hmSPvRM-Z">${renderIcon("alert", { size: 14 })} No registered rights record</span>`
              : `<span class="s-G15m0nYt3u">${renderIcon("lock", { size: 14 })} ${esc(e.state)}</span>`
          }
          <a class="btn btn-outline s-obqHLUP3Qm" href="/broadcast/screens/SCR-BCST-22">Playlist</a>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="timeline-container">
      <div class="s-DzaXJk6FQb">
        <h4 class="s-nw6M5YHQ6Q">
          Approved Schedule Entries (${entries.length} slots across ${new Set(entries.map((e) => e.channelId)).size} channel days)
        </h4>
        <div class="s-yFCr8u7ohF">
          <span class="s-5_U1hQP3mB">Source: <strong>broadcast schedule store, approved revisions only</strong></span>
        </div>
      </div>
      <div class="timeline-grid">
        ${rows}
      </div>
    </div>
  `;
}

/**
 * Renders the live playout status monitor & emergency filler controls (DT-406, SCR-BCST-23).
 */
function renderLivePlayoutMonitorHtml(
  screenData: ReturnType<typeof getScreenData>,
  engines?: ScreenDataContext["engines"]
): string {
  // The monitor used to print "TRANSMITTING ON AIR" with invented timecodes, a
  // cued event and an armed failover mode. Nothing in this layer polls a playout
  // adapter, so an unsupplied snapshot is rendered as exactly that.
  if (!engines?.playoutStatus) {
    return notConnectedPanel(
      "Live Playout Monitor",
      "No playout automation adapter is connected to this process, so on-air state, countdown and cued event cannot be reported. Failover controls are omitted rather than presented as actionable."
    );
  }
  return `
    <div class="s-vg2tyxs4Hu">
      <div class="card s-xO5emzrtCM">
        <div class="s-ESoTKYUleb">
          <div class="s-rFp4u97mz1">
            <div class="s-sj5T5qvyn0 vmn-pulse-dot"></div>
            <span class="s-a9oxqUu3Qi">${engines.playoutStatus.onAir ? "ON AIR (PLAYOUT ENGINE)" : "OFF AIR (PLAYOUT ENGINE)"}</span>
          </div>
          <div class="s-zKN_ITu9Sa">
            <span class="s-GdXMmorJ4B">Playlist lock:</span>
            <span class="s-xgiXcf2orB">${engines.playoutStatus.lockedPlaylist ? "LOCKED" : "NOT LOCKED"}</span>
          </div>
        </div>
        ${renderScreenKpis(screenData, esc)}
      </div>
    </div>
  `;
}

/**
 * Renders the final automation playlist lock view (DT-406, SCR-BCST-22).
 */
function renderPlaylistLockViewHtml(): string {
  // TSK-11 box 2: this view printed the SHA-256 of the *empty string*
  // (e3b0c442…) as a "cryptographic playlist hash" above four invented rows. A
  // digest is now computed over the frozen approved revision, or there is none.
  const approved = listSchedules()
    .map((schedule) => ({ schedule, revision: getApprovedRevision(schedule) }))
    .filter((x) => x.revision !== undefined);

  if (approved.length === 0) {
    return notConnectedPanel(
      "Automation Playlist Lock",
      "No approved schedule revision exists, so there is no playlist to lock and no digest to publish."
    );
  }

  const rows = approved
    .map(({ schedule, revision }) => {
      const entries = revision!.entries;
      const digest = createHash("sha256")
        .update(
          JSON.stringify(
            entries.map((e) => [e.entryId, e.startSecondsFromDayStart, e.durationSeconds, e.versionId, e.episodeCode ?? null])
          )
        )
        .digest("hex");
      return `
      <tr>
        <td class="s-aaCSFZsIgI">${esc(schedule.revisionId ?? schedule.scheduleId)}</td>
        <td class="s-j_mWEmdNC2">${esc(schedule.channelId)} · ${esc(schedule.broadcastDate)}</td>
        <td class="s-j_mWEmdNC2">${entries.length} slots</td>
        <td class="s-6ijxZ0CuDg">${esc(schedule.playlist?.playlistId ?? "not generated")}</td>
        <td class="s-dDYIG8pocu">${esc(digest)}</td>
        <td><span class="vmn-badge ${schedule.playlist ? "badge-ready" : "badge-warning"}">${
          schedule.playlist ? "GENERATED" : "NO PLAYLIST GENERATED"
        }</span></td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="s-vg2tyxs4Hu">
      <div class="card s-bk5Yubq5TG">
        <div class="s-ESoTKYUleb">
          <div>
            <h4 class="s-D5Kb1DR0aL">
              Approved Revision Digest (SHA-256 over the frozen entry set)
            </h4>
            <p class="s-1g0qfXP0ld">
              Source: broadcast schedule store · one row per approved channel-day revision
            </p>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Revision</th>
                <th>Channel · Date</th>
                <th>Slots</th>
                <th>Playlist</th>
                <th>Digest</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the 3-way as-run reconciliation diff table (DT-406, SCR-BCST-24).
 */
function renderAsRunReconciliationDiffHtml(engines?: ScreenDataContext["engines"]): string {
  // TSK-11: no invented advertisers, spot ids or RF carriers. The table renders
  // from a supplied as-run summary or states that no log reached this render.
  if (!engines?.asRunSummary) {
    return notConnectedPanel(
      "3-Way Reconciliation Differential",
      "No as-run log is attached to this render, so Leg 2 (playout) and Leg 3 (carrier) cannot be compared against the contracted plan. Advertiser names, spot ids and carrier readings are never invented for this table."
    );
  }
  const s = engines.asRunSummary;
  return `
    <div class="s-4h8zhEfDP0">
      <h4 class="s-IjylZHBtZ8">As-Run Reconciliation Summary (Leg 1 Traffic vs Leg 2 Playout Log)</h4>
      <div class="s-toooqsHHlc">
        <div class="s-CgNfDhuegV"><span class="s-WeE1qSZNFg">Planned spots</span><strong class="s-tiKlUUWToo">${s.totalPlannedSpots}</strong></div>
        <div class="s-CgNfDhuegV"><span class="s-WeE1qSZNFg">Aired spots</span><strong class="s-tiKlUUWToo">${s.totalAiredSpots}</strong></div>
        <div class="s-CgNfDhuegV"><span class="s-WeE1qSZNFg">Matched</span><strong class="s-tiKlUUWToo">${s.matchedSpots}</strong></div>
        <div class="s-CgNfDhuegV"><span class="s-WeE1qSZNFg">Discrepancies</span><strong class="s-tiKlUUWToo">${s.discrepancyCount}</strong></div>
      </div>
      <p class="s-Vgd1b_7V2z">Leg 3 (carrier telemetry) is NOT CONNECTED: no verified carrier feed is configured, so the match is two-leg and labelled as such.</p>
    </div>
  `;
}

/**
 * Renders the EPG / XMLTV inspector with schedule-vs-published diff view (DT-905, SCR-BCST-14).
 */
function renderEpgInspectorDiffHtml(screenData: ReturnType<typeof getScreenData>): string {
  // The syndication endpoint was hard-coded here as api.startimes.com/v2/epg/vmn
  // — an invented production URL (never invent endpoints), and the diff below it
  // was a sample XMLTV fragment no feed produced. The push route refuses with
  // CARRIAGE_INTERFACE_NOT_CONNECTED until a target is configured, and so does
  // this panel; the episode-master linkage is the real, verifiable part.
  const feed = screenData.kpis.find((k) => k.label === "EPG Feed State");
  return `
    <div class="s-4h8zhEfDP0">
      <div class="s-7siY-5mpRK">
        <div>
          <h4 class="s-IjylZHBtZ8">XMLTV EPG Feed State</h4>
          <p class="s-1g0qfXP0ld">
            Feed: <strong>${esc(feed ? (feed.value ?? feed.provenance) : "NOT CONNECTED")}</strong> · no syndication endpoint is configured, so none is displayed. Push is refused (CARRIAGE_INTERFACE_NOT_CONNECTED) pending the BG6 carriage interface.
          </p>
        </div>
        <div class="s-UK2dEq5_xu">
          <a href="/broadcast/export/epg/xmltv" class="btn btn-outline s-oVibJ_Zzvz">
            ${renderIcon("download", { size: 16 })} Download XMLTV
          </a>
        </div>
      </div>
      <p class="s-Vgd1b_7V2z">The published-versus-master diff is not rendered without a published feed to compare against.</p>

      <!-- SCR-03 follow-on: canonical episode → DAM master linkage -->
      ${renderEpisodeMastersTableHtml(listEpisodeMasters(), {
        heading: "Episode Master Linkage (DAM)",
        note: 'Every indexed episode with its registered DAM master id; the XMLTV export carries each id as <episode-num system="vmnl-media-asset">.',
      })}
    </div>
  `;
}

/**
 * Renders the broadcast revenue yield & analytics visualizations (DT-901, DT-903, SCR-BCST-31).
 */
function renderBroadcastYieldAnalyticsHtml(engines?: ScreenDataContext["engines"]): string {
  // TSK-11 box 4: this panel printed ₦19,240,000 of "gross daily linear yield",
  // a 94.2% fill rate and four daypart bars that no engine produced. Revenue
  // figures come only from a billing snapshot the caller supplies.
  const totals = engines?.billingTotals;
  if (!totals || totals.length === 0) {
    return notConnectedPanel(
      "Commercial Yield & Fill Rate",
      "No commercial billing schedules are attached to this render, so no revenue, fill rate or spot rate can be reported. Inventing them on a revenue surface is the defect this panel used to be."
    );
  }
  const total = totals.reduce((sum, t) => sum + t.totalValueNgn, 0);
  const rows = totals
    .map(
      (t) => `
      <tr>
        <td class="s-aaCSFZsIgI">${esc(t.campaignCode)}</td>
        <td class="s-tiKlUUWToo">${t.totalValueNgn.toLocaleString("en-NG")}</td>
      </tr>`
    )
    .join("");
  return `
    <div class="s-vg2tyxs4Hu">
      <div class="grid-3 s-KRt7uwFSzR">
        <div class="card stat-box">
          <span class="stat-val s-_ZPfN4CX-f">₦${total.toLocaleString("en-NG")}</span>
          <span class="stat-lbl">Contracted billing schedule total (engine sums, ${totals.length} campaigns)</span>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Campaign</th><th>Contracted value (₦)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="s-Vgd1b_7V2z">Fill rate and average spot rate are NOT CONNECTED: no audience or as-run telemetry feeds them.</p>
    </div>
  `;
}

/**
 * Renders the operational UI for any of the 33 broadcast screens.
 *
 * `engines` is the optional live snapshot the caller holds (billing totals,
 * as-run summary, playout state, sponsorship audit). Everything it does not
 * supply is rendered as NOT_CONNECTED — a screen never invents a value to fill
 * the space (TSK-11, UIUX-001 §4.3).
 */
export function renderBroadcastScreenHtml(
  screen: BroadcastScreenDescriptor,
  params: Record<string, string> = {},
  userRole?: string,
  engines?: ScreenDataContext["engines"]
): string {
  const isAuthorized = isRoleAuthorizedForScreen(userRole, screen);

  if (!isAuthorized) {
    return `
      <div class="broadcast-screen-container p-6 max-w-4xl mx-auto s-E5LIDKthmN">
        <div class="card p-6 bg-red-50 border border-red-200 rounded-lg text-center s-OlWl1HuGdH">
          <div class="s-vCnRA-YpNt">${renderIcon("lock", { size: 48 })}</div>
          <h1 class="text-2xl font-bold text-red-800 mb-2">403 Access Denied</h1>
          <p class="text-red-700 mb-4">
            Role <strong>${userRole || "Anonymous"}</strong> is not authorized to access operational screen
            <strong>${screen.screenId} (${screen.name})</strong>.
          </p>
          <p class="text-sm text-red-600 mb-6">
            Required Operating Authority: <strong>${screen.primaryRole}</strong> or Broadcast Executive clearance.
          </p>
          <div class="actions">
            <a href="/broadcast/screens" class="btn btn-primary s-MYOewE5A8M">
              Return to Broadcast Screens Catalog
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Section 67 Gate & Information Model Decision
  const gateClearance = SCREEN_GATES[screen.screenId] || "Gate BG0–BG9 (Operational Desk)";
  const decisionData = SCREEN_DECISION_TEXT[screen.screenId] || {
    decision: `Execute operational control and review domain telemetry for ${screen.name}.`,
    actionLabel: "Execute Operational Action",
  };

  // TSK-11: the KPI strip every screen shows. Sourced, or explicitly not.
  const screenData = getScreenData(screen.screenId, buildScreenDataContext(engines));
  const kpiStripHtml = renderScreenKpis(screenData, esc);
  // DEC-RL1-SCOPE-001 C-4: the demonstration banner belongs to unsourced content.
  // Once every figure on a surface reads from a domain engine the label would be
  // false, so it is conditional on the same census `renderScreenKpis` prints.
  const provenanceHtml = screenData.fullySourced
    ? `<div class="s-zwyz9nYWRU">All figures on this surface are read from a domain engine source at render time.</div>`
    : renderMockDataBanner(esc, screen.name);

  const actionsBadges = screen.permittedActions
    .map(
      (a) =>
        `<span class="s-Zpc7iXTDlF">${renderIcon("bolt", { size: 14 })} ${a}</span>`
    )
    .join(" ");

  const paramTags = Object.entries(params)
    .filter(([k]) => k !== "state")
    .map(
      ([k, v]) =>
        `<span class="s-l81ES_HgRX">${k}: <strong>${v}</strong></span>`
    )
    .join(" ");

  const activeState = params.state || "default";

  // Per-Screen Domain Specific Panel Content
  let panelContent: string;

  if (activeState === "empty") {
    panelContent = `
      <div class="empty-state p-8 text-center" role="region" aria-label="Empty State">
        <div class="s-KXO0iJl0wz">${renderIcon("inbox", { size: 40 })}</div>
        <h4 class="font-bold text-slate-800 text-base mb-1">No Active Records Found</h4>
        <p class="text-xs text-slate-500 mb-4">There are currently no operational records, pending transmissions, or queued items in this view.</p>
        <a href="?state=default" class="btn btn-outline s-zTjcEp-kWU">Return to Live View</a>
      </div>
    `;
  } else if (activeState === "error") {
    panelContent = `
      <div class="error-state p-8 text-center bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div class="s-nOHmGLN_bA">${renderIcon("alert", { size: 40 })}</div>
        <h4 class="font-bold text-red-800 text-base mb-1">Operational Telemetry Alert</h4>
        <p class="text-xs text-red-600 mb-4">Subsystem communication error encountered. Playout automation heartbeat degraded.</p>
        <a href="?state=default" class="btn btn-outline s-zTjcEp-kWU">Retry Operation</a>
      </div>
    `;
  } else if (activeState === "loading") {
    panelContent = `
      <div class="loading-state p-8 text-center" role="status" aria-busy="true">
        <div class="spinner s-gWArkuD1FK">${renderIcon("hourglass", { size: 36, className: "vmn-spinner-icon" })}</div>
        <h4 class="font-bold text-slate-800 text-base mb-1">Loading Operational Grid...</h4>
        <p class="text-xs text-slate-500 mb-4">Synchronizing real-time telemetry from channel playout automation.</p>
        <div class="s-qhujIQMk0l"></div>
        <div class="s-_kNoI6diI1"></div>
      </div>
    `;
  } else {
    // Specific rich domain implementations — each reads a real store, and renders
    // an explicit NOT CONNECTED state when that store has nothing to show (TSK-11).
    if (screen.screenId === "SCR-BCST-12") {
      panelContent = renderScheduleGridTimelineHtml(approvedScheduleEntries());
    } else if (screen.screenId === "SCR-BCST-23") {
      panelContent = renderLivePlayoutMonitorHtml(screenData, engines);
    } else if (screen.screenId === "SCR-BCST-22") {
      panelContent = renderPlaylistLockViewHtml();
    } else if (screen.screenId === "SCR-BCST-24") {
      panelContent = renderAsRunReconciliationDiffHtml(engines);
    } else if (screen.screenId === "SCR-BCST-14") {
      panelContent = renderEpgInspectorDiffHtml(screenData);
    } else if (screen.screenId === "SCR-BCST-31") {
      panelContent = renderBroadcastYieldAnalyticsHtml(engines);
    } else {
      // TSK-11: the standard desk lists real approved-schedule entries. With no
      // approved revision in the store the desk says so — three invented record
      // rows used to stand in for the missing source on every one of these screens.
      const records = approvedScheduleEntries();
      const rowsHtml = records.length
        ? records
            .slice(0, 12)
            .map(
              (r) => `
          <tr>
            <td class="s-aaCSFZsIgI">${esc(r.scheduleId)}</td>
            <td><strong>${esc(r.programmeTitle)}</strong><br><span class="s-Vgd1b_7V2z">${esc(r.channelId)}${
              r.episodeCode ? ` · master ${esc(r.episodeCode)}` : ""
            }</span></td>
            <td class="s-wuVMT-Zuo9">${esc(r.window)} · ${esc(r.state)}</td>
            <td>${
              r.rightsRecordId
                ? `<span class="vmn-badge badge-ready">RIGHTS RECORD ${esc(r.rightsRecordId)}</span>`
                : `<span class="vmn-badge badge-warning">NO REGISTERED RIGHTS RECORD</span>`
            }</td>
            <td><a class="btn btn-outline s-NAJhCsZbKc" href="/broadcast/screens/${esc(r.screenIdForLink)}">Inspect</a></td>
          </tr>
        `
            )
            .join("")
        : `
          <tr>
            <td colspan="5" class="s-ZmQJhOQnpI">No approved schedule revision exists in the store, so this desk
has no operational records to list. Records are never invented here (UIUX-001 §4.3).</td>
          </tr>
        `;

      panelContent = `
        <div class="s-4h8zhEfDP0">
          <!-- Domain Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Programme / Master</th>
                  <th>Operating Window / State</th>
                  <th>Rights Authority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  // Left rail duty stations markup (§4.2)
  const dutyStationsHtml = DUTY_STATIONS.map((station) => {
    const isCurrentStation = station.screens.includes(screen.screenId);
    const activeClass = isCurrentStation ? "operator-rail-item active" : "operator-rail-item";
    const primaryScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === station.screens[0])!;
    const href = primaryScreen.route.includes(":") ? `/broadcast/screens/${primaryScreen.screenId}` : primaryScreen.route;

    return `
      <a href="${href}" class="${activeClass}" title="${station.description}">
        <span class="s-JyMdrv2Xyh">
          ${renderIcon(station.icon, { size: 16 })}
          <span>${station.name}</span>
        </span>
        <span class="s-aY4iL2xKuF">${station.screens.length}</span>
      </a>
    `;
  }).join("\n");

  return `
    <div class="operator-shell">
      <!-- Global Context Bar (DT-401) -->
      <header class="operator-context-bar" role="banner" aria-label="Global Operator Context">
        <div class="operator-context-group">
          <span class="operator-context-label">Channel Feed:</span>
          <select class="operator-context-select" aria-label="Active Channel Selector" onchange="window.location.search = '?channel=' + this.value">
            <option value="NXTR" ${params.channel !== "ORIS" && params.channel !== "IMBD" ? "selected" : ""}>NXTR — Nigezie Xtreme</option>
            <option value="ORIS" ${params.channel === "ORIS" ? "selected" : ""}>ORIS — Orisun (The Source)</option>
            <option value="IMBD" ${params.channel === "IMBD" ? "selected" : ""}>IMBD — Isi Mbido (The Beginning)</option>
          </select>

          <span class="operator-context-label s-YXDZTIE0Fw">Broadcast Date:</span>
          <span class="s-uiQObaTqJW">
            ${params.date || "2026-03-30"}
          </span>

          <span class="operator-context-label s-YXDZTIE0Fw">Mode:</span>
          <span class="s-XN9Er4fUAu">
            LIVE OPERATING
          </span>
        </div>

        <div class="operator-context-group">
          <span class="operator-context-label">Role Context:</span>
          <span class="s-aHFes1ZWzl">
            ${userRole || screen.primaryRole}
          </span>
          <a href="/broadcast/screens" class="btn btn-outline s-Sg6QgtPAw0">
            Catalog
          </a>
        </div>
      </header>

      <!-- Main Layout Body: Left Rail + Active Screen Console -->
      <div class="operator-layout-body">
        <!-- Left Rail: Duty Stations (§4.2) -->
        <nav class="operator-rail" aria-label="Duty Stations Navigation">
          <div class="operator-rail-header">Duty Stations (§4.2)</div>
          <div class="s-DzTxfClySI">
            ${dutyStationsHtml}
          </div>

          <div class="s-6OEmWbNdpS">
            <div class="operator-rail-header s-to20TYnU6c">Release Gate</div>
            <div class="s-Cw0yw_ElOy">
              ${gateClearance}
            </div>
          </div>
        </nav>

        <!-- Right Main: Operational Screen Surface -->
        <main class="broadcast-screen-surface" data-screen-id="${screen.screenId}">
          <!-- Screen Header -->
          <header class="screen-header mb-6 pb-4 border-b border-slate-200 s-eNztNGULjh">
            <div>
              <div class="s-97MdRRIcrk">
                <span class="s-O-gFliO8Lg">
                  ${screen.screenId}
                </span>
                <span class="s-xVz95s6ljh">Screen #${screen.screenNumber} of 33</span>
                <span class="s-bzxkW0tcv_">
                  ${screen.primaryRole}
                </span>
                <span class="s-iwQeQ5cgZi">
                  ${gateClearance}
                </span>
                ${paramTags ? `<div class="s-xfcqi_PFHp">${paramTags}</div>` : ""}
              </div>
              <h1 class="text-3xl font-extrabold text-slate-900">${screen.name}</h1>
              <p class="text-slate-600 mt-1 max-w-2xl">${screen.description}</p>
            </div>

            <div class="s-GyydKV-rBn">
              <button class="btn btn-primary btn-execute-control" data-screen-id="${screen.screenId}" style="min-height:44px; display:inline-flex; align-items:center; padding:0 16px;">
                ${decisionData.actionLabel} &rarr;
              </button>
            </div>
          </header>

          <!-- Channel & carriage state from the registry (TSK-11): no carrier
               frequency, PID or satellite is stated here, because carriage is a
               verified external fact and the registry keeps those fields unset
               until StarTimes/NBC confirm them (CLAUDE.md <broadcast> law). -->
          <div class="mb-4 p-3 bg-slate-900 text-white rounded-lg s-7siY-5mpRK">
            <div class="s-JyMdrv2Xyh">
              <span class="s-rGfNKAz_6T">${renderIcon("broadcast", { size: 18 })}</span>
              <strong class="s-jcV7iHsMX_">Registered Channels &amp; Carriage State</strong>
            </div>
            <div class="s-TIdIC9kSTn">
              ${getAllActiveChannels()
                .map(
                  (c) =>
                    `<span>${esc(c.code)} · ${esc(c.name)} · <span class="s-XUp22MedBY">${
                      c.starTimesCarriage.isProvisional ? "CARRIAGE UNVERIFIED" : "CARRIAGE VERIFIED"
                    }</span></span>`
                )
                .join("")}
              <span class="s-zwyz9nYWRU">No carrier telemetry adapter is connected</span>
            </div>
          </div>

          <!-- Provenance label (DEC-RL1-SCOPE-001 C-4): rendered only while the
               surface still shows content that is not read from a domain engine. -->
          ${provenanceHtml}

          <!-- Screen KPIs (TSK-11): sourced values with provenance badges, or an
               explicit NOT_CONNECTED state. Never a per-screen literal. -->
          ${kpiStripHtml}

          <!-- Operational Decision Box (DT-402 Information Model) -->
          <div class="card mb-6 s-s_KExyVeS7">
            <div class="s-7siY-5mpRK">
              <div class="s-4PKrtOMadV">
                <div class="s-88FWu7v97-">${renderIcon("info", { size: 24 })}</div>
                <div>
                  <strong class="s-rDdPWpOF9L">
                    Primary Operational Decision (R1.2A §48 / §67)
                  </strong>
                  <p class="s-BtMqImfqOU">
                    ${decisionData.decision}
                  </p>
                </div>
              </div>
              <div>
                ${actionsBadges}
              </div>
            </div>
          </div>

          <!-- Main Operational Console Panel -->
          <div class="card p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 class="font-bold text-slate-800 text-lg">Active Operational Records</h3>
              <span class="text-xs font-semibold px-2 py-1 bg-sky-100 text-sky-800 rounded">
                State: ${activeState.toUpperCase()}
              </span>
            </div>

            ${panelContent}

            <div class="state-controls flex gap-2 text-xs flex-wrap s-fU_Fd2iv9z">
              <span class="text-slate-400 font-semibold">Operational State Testing Matrix:</span>
              <a href="?state=default" class="text-sky-600 hover:underline">Live Feed</a> ·
              <a href="?state=empty" class="text-sky-600 hover:underline">Empty State</a> ·
              <a href="?state=error" class="text-sky-600 hover:underline">Error State</a> ·
              <a href="?state=loading" class="text-sky-600 hover:underline">Loading Skeleton</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;
}
