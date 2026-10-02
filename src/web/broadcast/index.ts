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
import { renderIcon, IconName } from "../components/index.js";
import { renderMockDataBanner } from "../../modules/broadcast/screens/data.js";

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
const SCREEN_DECISIONS: Record<string, { decision: string; actionLabel: string; kpis: [string, string][] }> = {
  "SCR-BCST-01": {
    decision: "Assess tri-channel transmission continuity, StarTimes transponder lock, and daily revenue yield.",
    actionLabel: "Export Executive Briefing",
    kpis: [["Active Linear Feeds", "3 of 3 Online"], ["Carriage Uptime", "99.98%"], ["Daily Yield", "₦18.4M"], ["Open Incidents", "0 Critical"]],
  },
  "SCR-BCST-02": {
    decision: "Verify channel bouquet alignments, carriage assignments, and regional distribution tiers.",
    actionLabel: "Update Bouquet Configuration",
    kpis: [["Linear Channels", "3 (NXTR, ORIS, IMBD)"], ["Carriage Bouquets", "StarTimes DTT / DTH"], ["Total Reach", "14.2M HH"], ["Feed Health", "100%"]],
  },
  "SCR-BCST-03": {
    decision: "Audit transmission bitrates, audio loudness profiles (-23 LUFS), and StarTimes PID mappings.",
    actionLabel: "Save Channel Profile",
    kpis: [["Audio Loudness", "-23.0 LUFS Target"], ["Video Codec", "1080i50 H.264"], ["Primary PID", "0x1021"], ["Secondary PID", "0x1022"]],
  },
  "SCR-BCST-04": {
    decision: "Audit master catalogue metadata, license expiry windows, and ready-to-air episode availability.",
    actionLabel: "Register Master Title",
    kpis: [["Total Titles", "1,248 Titles"], ["Active Episodes", "4,820 Episodes"], ["Rights Cleared", "96.4%"], ["Expiring in 30d", "14 Titles"]],
  },
  "SCR-BCST-05": {
    decision: "Review synopsis, cast credits, music cue sheet clearance, and broadcast transmission history.",
    actionLabel: "Approve Programme Master",
    kpis: [["Broadcast Runs", "18 Airings"], ["Territories Cleared", "NG, GH, UK, US"], ["Language Tracks", "EN, YO, IG"], ["QC Rating", "Passed 100%"]],
  },
  "SCR-BCST-06": {
    decision: "Manage episode run sequence, season arcs, deliverable delivery dates, and syndication windows.",
    actionLabel: "Reorder Episode Slate",
    kpis: [["Season Count", "4 Seasons"], ["Delivered Episodes", "48 of 48"], ["Master Archive", "LTO-8 Synced"], ["Syndication Avails", "Cleared"]],
  },
  "SCR-BCST-07": {
    decision: "Define frame-accurate segment boundaries, commercial break insertion cue points, and end-credits timing.",
    actionLabel: "Save Segment Breakdown",
    kpis: [["Duration", "00:24:15:00"], ["Segment Count", "3 Segments"], ["Break Points", "2 Inset Cues"], ["Audio Loudness", "-23.2 LUFS"]],
  },
  "SCR-BCST-08": {
    decision: "Review automated QC flags, audio peak violations, and NBC compliance censorship cuts.",
    actionLabel: "Authorize QC Slates",
    kpis: [["QC Checkpoints", "14/14 Passed"], ["Audio True Peak", "-1.0 dBTP"], ["Censorship Slates", "NBC 7th Ed. Verified"], ["Subtitles", "WebVTT Synced"]],
  },
  "SCR-BCST-09": {
    decision: "Determine broadcast rights availability by territory, window, and exclusivity category before scheduling.",
    actionLabel: "Clear Linear Rights",
    kpis: [["Territory Clearance", "Nigeria (Exclusive)"], ["Carriage Window", "2026-01-01 to 2027-12-31"], ["SVOD Holdback", "30 Days"], ["Status", "Cleared"]],
  },
  "SCR-BCST-10": {
    decision: "Approve acquisition license terms, royalty splits, and inbound material delivery deadlines.",
    actionLabel: "Execute Acquisition License",
    kpis: [["Pipeline Deals", "8 Inbound"], ["Contract Value", "₦142.5M"], ["Approved Titles", "24 Titles"], ["Legal Clearance", "100%"]],
  },
  "SCR-BCST-11": {
    decision: "Authorize milestone disbursements for original format productions and creator format labs.",
    actionLabel: "Authorize Milestone Release",
    kpis: [["Active Commissions", "6 Formats"], ["Milestones Due", "2 Pending"], ["Disbursed to Date", "₦84.0M"], ["Delivery Track", "On Schedule"]],
  },
  "SCR-BCST-12": {
    decision: "Balance 24/7 daypart schedule, resolve timing overlaps, and eliminate unprogrammed gaps.",
    actionLabel: "Lock 24/7 Schedule Grid",
    kpis: [["Total Air Time", "24:00:00:00"], ["Daypart Fill", "100.0%"], ["Schedule Overlaps", "0 Errors"], ["Locked Slots", "44 of 48"]],
  },
  "SCR-BCST-13": {
    decision: "Configure daypart rate cards, peak prime-time multipliers, and seasonal yield adjustments.",
    actionLabel: "Update Daypart Multipliers",
    kpis: [["Early Morning", "1.0x (₦180k)"], ["Daytime", "1.2x (₦220k)"], ["Prime Time", "2.5x (₦450k)"], ["Late Night", "0.8x (₦140k)"]],
  },
  "SCR-BCST-14": {
    decision: "Inspect XMLTV syndication feed, verify differences against linear schedule, and push updates to StarTimes.",
    actionLabel: "Push Syndication to StarTimes",
    kpis: [["EPG Feed State", "Valid XMLTV"], ["Schedule Sync Diff", "0 Critical Gaps"], ["StarTimes Push", "Last: 12m ago"], ["Feed Schema", "DVB-SI Compliant"]],
  },
  "SCR-BCST-15": {
    decision: "Schedule station promos, lineup interstitials, and filler assets to guarantee zero dead air.",
    actionLabel: "Optimize Interstitial Slots",
    kpis: [["Promo Inventory", "84 Assets"], ["Scheduled Breaks", "48 Breaks"], ["Fill Buffer", "100% Covered"], ["Campaign Promos", "12 Active"]],
  },
  "SCR-BCST-16": {
    decision: "Allocate commercial avails, track sell-out capacity per daypart, and prevent category clashes.",
    actionLabel: "Book Commercial Spot",
    kpis: [["Total Avails", "288 Spots/Day"], ["Booked Spots", "264 Spots"], ["Sell-Out Rate", "91.7%"], ["Remaining Value", "₦2.8M"]],
  },
  "SCR-BCST-17": {
    decision: "Structure commercial break sequence, station idents, and sponsor stings with frame-accurate timing.",
    actionLabel: "Save Break Structure",
    kpis: [["Break Duration", "00:02:00:00"], ["Spot Allocation", "4 Spots @ 30s"], ["Ident Offset", "00:00:05:00"], ["Clash Rule", "Auto-Verified"]],
  },
  "SCR-BCST-18": {
    decision: "Manage multi-week brand flighting schedules, GRP delivery guarantees, and client category quotas.",
    actionLabel: "Flight Campaign",
    kpis: [["Active Campaigns", "34 Brands"], ["Committed Spots", "1,840 Spots"], ["Delivery Pace", "98.4%"], ["Category Exclusivity", "Protected"]],
  },
  "SCR-BCST-19": {
    decision: "Inspect commercial copy files, verify EBU R128 loudness compliance, and confirm NBC clearance certificate.",
    actionLabel: "Authorize Commercial Copy",
    kpis: [["Pending Review", "3 Spots"], ["Loudness Compliance", "Passed (-23 LUFS)"], ["NBC Clearance", "Certified"], ["Slated Duration", "30.00s"]],
  },
  "SCR-BCST-20": {
    decision: "Track broadcast sponsorship bugs, lower-third graphic deliveries, and programme naming rights counters.",
    actionLabel: "Bind Sponsor Entitlement",
    kpis: [["Active Sponsors", "12 Enterprise"], ["Bug Placements", "100% Delivered"], ["Naming Rights", "Active"], ["Proof Verification", "Live Tracked"]],
  },
  "SCR-BCST-21": {
    decision: "Reconcile commercial bookings with schedule slots and freeze the daily traffic log for playout handover.",
    actionLabel: "Freeze Daily Traffic Log",
    kpis: [["Log Status", "Final Pre-Lock"], ["Booked Revenue", "₦19.2M"], ["Unplaced Orders", "0 Spots"], ["Discrepancies", "None"]],
  },
  "SCR-BCST-22": {
    decision: "Sign and freeze the 24-hour automation playlist with cryptographic hash before pushing to edge playout servers.",
    actionLabel: "Freeze & Push Playlist",
    kpis: [["Playlist Lock", "LOCKED (SHA-256)"], ["Total Events", "384 Items"], ["Server Sync", "Synchronized"], ["Frame Accuracy", "100%"]],
  },
  "SCR-BCST-23": {
    decision: "Monitor real-time master control playout, next event countdown, and execute manual filler switch if required.",
    actionLabel: "Manual Emergency Override",
    kpis: [["On-Air Status", "TRANSMITTING LIVE"], ["Next Event In", "00:14:22"], ["Filler Standby", "Armed (Auto-Trigger)"], ["MCR Control", "Operator Armed"]],
  },
  "SCR-BCST-24": {
    decision: "Execute 3-way reconciliation match between commercial bookings, playout as-run logs, and StarTimes RF evidence.",
    actionLabel: "Reconcile As-Run Log",
    kpis: [["3-Way Match Rate", "99.4% Matched"], ["Aired Spots", "262 of 264"], ["Preempted Spots", "2 Spots (Re-slated)"], ["Billing Value", "₦18.9M Cleared"]],
  },
  "SCR-BCST-25": {
    decision: "Inspect primary optical transport link, ASI stream integrity, and transmitter carrier telemetry in real time.",
    actionLabel: "Run Carrier Diagnostic",
    kpis: [["Optical Link", "10.0 Gbps Normal"], ["Carrier SNR", "34.2 dB"], ["MER Level", "38.5 dB"], ["Bitrate Error Rate", "< 1e-9"]],
  },
  "SCR-BCST-26": {
    decision: "Track carrier outages, log downtime incident minutes, and calculate StarTimes SLA penalty offsets.",
    actionLabel: "Log Incident Report",
    kpis: [["Monthly Uptime", "99.98%"], ["Incident Minutes", "4.2 mins total"], ["SLA Target", "99.95%"], ["Penalty Exposure", "₦0.00"]],
  },
  "SCR-BCST-27": {
    decision: "Manage multi-platform distribution endpoints across StarTimes DTT, DTH satellite, and OTT feeds.",
    actionLabel: "Register Carriage Endpoint",
    kpis: [["Active Endpoints", "4 Endpoints"], ["Transponder Capacity", "Dedicated DVB-S2"], ["DTT Multiplex", "Channel 142"], ["Global OTT", "HLS Live"]],
  },
  "SCR-BCST-28": {
    decision: "Audit StarTimes satellite transponder frequencies, uplink telemetry, and regional PID multiplexing.",
    actionLabel: "Test Uplink Telemetry",
    kpis: [["Transponder", "Eutelsat 16A @ 16°E"], ["Frequency", "11,554 MHz"], ["Polarization", "Horizontal"], ["Carrier Status", "LOCKED"]],
  },
  "SCR-BCST-29": {
    decision: "Review StarTimes bouquet carriage agreements, revenue sharing formulas, and renewal terms.",
    actionLabel: "Review Carriage Contract",
    kpis: [["Bouquet Tier", "StarTimes Classic"], ["Contract Term", "3 Years (to 2028)"], ["Subscriber Reach", "6.2M Active"], ["Audit State", "Cleared"]],
  },
  "SCR-BCST-30": {
    decision: "Generate and dispatch cryptographically sealed Proof-of-Air Certificates to corporate advertisers.",
    actionLabel: "Generate Proof-of-Air Seal",
    kpis: [["Certificates Ready", "48 Clients"], ["Cryptographic Seal", "SHA-256 Validated"], ["Dispatch Mode", "Automated Email/PDF"], ["Audit Status", "CCPP-001 §19"]],
  },
  "SCR-BCST-31": {
    decision: "Analyze daily broadcast commercial yield, average spot pricing, and daypart revenue distribution.",
    actionLabel: "Export Financial Model",
    kpis: [["Total Daily Yield", "₦19.2M"], ["Average Spot Rate", "₦245,000"], ["Prime Fill Rate", "98.2%"], ["Fringe Recovery", "₦3.4M"]],
  },
  "SCR-BCST-32": {
    decision: "Evaluate audience ratings, demographic market reach, and competitive share of viewing.",
    actionLabel: "Filter Audience Cohorts",
    kpis: [["Peak Viewers", "4.8M Viewers"], ["Urban Reach", "68.4%"], ["Target Demo (18-35)", "74.1% Share"], ["Audience Rank", "#1 Afro-Urban"]],
  },
  "SCR-BCST-33": {
    decision: "Track conversion attribution from on-air QR codes to Azeebo+ app installs, subscriptions, and stream retention.",
    actionLabel: "Export Conversion Funnel",
    kpis: [["On-Air Scans", "84,200 Scans"], ["Azeebo+ Signups", "18,450 Users"], ["Conversion Rate", "21.9%"], ["Retained (30d)", "68.4%"]],
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
function renderScheduleGridTimelineHtml(): string {
  const dayparts = [
    { name: "Early Morning", hours: "06:00 - 09:00", multiplier: "1.0x", bg: "#EFF6FF", border: "#BFDBFE" },
    { name: "Daytime", hours: "09:00 - 16:00", multiplier: "1.2x", bg: "#F0FDF4", border: "#BBF7D0" },
    { name: "Prime Time", hours: "16:00 - 23:00", multiplier: "2.5x", bg: "#FEF3C7", border: "#FDE68A" },
    { name: "Late Night", hours: "23:00 - 06:00", multiplier: "0.8x", bg: "#F1F5F9", border: "#CBD5E1" },
  ];

  const slots = [
    { time: "06:00", title: "Sunrise Afro-Beats Top 20", duration: "60m", channel: "NXTR", status: "LOCKED", rights: "CLEARED" },
    { time: "07:00", title: "Lagos Urban Morning Rush", duration: "120m", channel: "NXTR", status: "LOCKED", rights: "CLEARED" },
    { time: "09:00", title: "Yoruba Heritage & Folk Tales", duration: "90m", channel: "ORIS", status: "LOCKED", rights: "CLEARED" },
    { time: "10:30", title: "Isi Mbido Traditional Theatre", duration: "90m", channel: "IMBD", status: "LOCKED", rights: "CLEARED" },
    { time: "12:00", title: "Afro-Fusion Gastronomy Live", duration: "60m", channel: "NXTR", status: "DRAFT", rights: "CLEARED" },
    { time: "13:00", title: "Nollywood Classic Cinema", duration: "120m", channel: "ORIS", status: "LOCKED", rights: "CLEARED" },
    { time: "15:00", title: "Pan-African Soundstage Showcase", duration: "60m", channel: "NXTR", status: "DRAFT", rights: "CLEARED" },
    { time: "16:00", title: "Prime Time News & Culture 360", duration: "60m", channel: "ORIS", status: "LOCKED", rights: "CLEARED" },
    { time: "17:00", title: "Super Xtreme Rap Battle S3", duration: "60m", channel: "NXTR", status: "LOCKED", rights: "CLEARED" },
    { time: "18:00", title: "Nigezie Prime Countdown", duration: "60m", channel: "NXTR", status: "LOCKED", rights: "CLEARED" },
    { time: "19:00", title: "Highlife Kings Historical Special", duration: "60m", channel: "IMBD", status: "BLOCKED", rights: "TERRITORY_BLOCKED" },
    { time: "20:00", title: "Star Spotlight: Burna Boy Live", duration: "120m", channel: "NXTR", status: "LOCKED", rights: "CLEARED" },
  ];

  const daypartsHtml = dayparts
    .map(
      (d) => `
      <div class="timeline-daypart-slot" style="background:${d.bg}; border-color:${d.border};">
        <strong style="font-size:0.85rem; color:#0F172A; display:block;">${d.name}</strong>
        <span style="font-size:0.75rem; color:#475569; font-family:monospace;">${d.hours}</span>
        <span style="font-size:0.75rem; font-weight:700; color:#0369A1; display:block; margin-top:2px;">Rate: ${d.multiplier}</span>
      </div>
    `
    )
    .join("");

  const slotsHtml = slots
    .map((s) => {
      const isLocked = s.status === "LOCKED";
      const isBlocked = s.rights === "TERRITORY_BLOCKED";
      const cardClass = isBlocked ? "timeline-slot-card rights-blocked" : isLocked ? "timeline-slot-card locked" : "timeline-slot-card";

      return `
      <div class="${cardClass}" tabindex="0" role="region" aria-label="${s.time} ${s.title}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span style="font-family:monospace; font-weight:800; font-size:0.9rem; color:#0369A1;">${s.time}</span>
          <span style="font-size:0.7rem; font-weight:700; background:#E2E8F0; color:#334155; padding:1px 6px; border-radius:4px;">${s.channel}</span>
        </div>
        <div style="margin:6px 0;">
          <strong style="font-size:0.85rem; color:#0F172A; display:block; line-height:1.3;">${s.title}</strong>
          <span style="font-size:0.75rem; color:#64748B;">Duration: ${s.duration}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          ${
            isBlocked
              ? `<span style="color:#DC2626; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:3px;">${renderIcon("alert", { size: 14 })} Rights Blocked</span>`
              : isLocked
              ? `<span style="color:#0369A1; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:3px;">${renderIcon("lock", { size: 14 })} Playout Locked</span>`
              : `<span style="color:#D97706; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:3px;">${renderIcon("clock", { size: 14 })} Draft Slot</span>`
          }
          <button class="btn btn-outline" style="min-height:28px; padding:2px 6px; font-size:0.7rem;" aria-label="Reorder or inspect ${s.title}">Edit</button>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="timeline-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h4 style="font-size:1.05rem; font-weight:800; color:var(--vmn-color-text-main); margin:0;">
          24-Hour Broadcast Master Timeline (NXTR / ORIS / IMBD)
        </h4>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-size:0.8rem; color:var(--vmn-color-text-muted);">Frame Rate: <strong>50 fps (1080i)</strong></span>
          <button class="btn btn-outline" style="min-height:36px; padding:4px 10px; font-size:0.8rem;">Auto-Balance 24h</button>
        </div>
      </div>
      <div class="timeline-dayparts-bar">
        ${daypartsHtml}
      </div>
      <div class="timeline-grid">
        ${slotsHtml}
      </div>
    </div>
  `;
}

/**
 * Renders the live playout status monitor & emergency filler controls (DT-406, SCR-BCST-23).
 */
function renderLivePlayoutMonitorHtml(): string {
  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <!-- Live On-Air Monitor Banner -->
      <div class="card" style="background:#0F172A; color:#FFFFFF; border:1px solid #334155; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:14px; height:14px; border-radius:50%; background:#EF4444; box-shadow:0 0 10px #EF4444;" class="vmn-pulse-dot"></div>
            <span style="font-weight:900; letter-spacing:0.1em; color:#F87171; font-size:0.9rem;">TRANSMITTING ON AIR</span>
            <span style="background:#1E293B; color:#38BDF8; font-family:monospace; padding:3px 8px; border-radius:4px; font-size:0.8rem;">NXTR-FEED-PRIMARY</span>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <span style="font-size:0.85rem; color:#94A3B8;">Next Event Countdown:</span>
            <span style="font-family:monospace; font-weight:800; font-size:1.2rem; color:#34D399; background:#1E293B; padding:4px 10px; border-radius:6px;">00:14:22</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:20px;">
          <div style="background:#1E293B; padding:16px; border-radius:6px; border-left:4px solid #38BDF8;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:#94A3B8; font-weight:700;">Currently Airing Event</span>
            <h4 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:4px 0;">Super Xtreme Rap Battle S3 - Ep 04</h4>
            <span style="font-family:monospace; font-size:0.85rem; color:#38BDF8;">TC: 17:45:38:12 / Duration: 00:60:00:00</span>
          </div>

          <div style="background:#1E293B; padding:16px; border-radius:6px; border-left:4px solid #F59E0B;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:#94A3B8; font-weight:700;">Cued Up Next Event</span>
            <h4 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:4px 0;">Commercial Break CB-1800-01 (4 Spots)</h4>
            <span style="font-family:monospace; font-size:0.85rem; color:#FBBF24;">Start: 18:00:00:00 / Duration: 00:02:00:00</span>
          </div>
        </div>

        <!-- Emergency Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:16px; border-top:1px solid #334155;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.8rem; color:#94A3B8;">Playout Failover Mode:</span>
            <span style="background:#065F46; color:#A7F3D0; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px;">AUTO-STANDBY ARMED</span>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" style="background:#1E293B; color:#F8FAFC; border-color:#475569; min-height:44px;" onclick="confirm('Switch to secondary backup playout server?')">
              ${renderIcon("refresh", { size: 16 })} Switch Secondary Mirror
            </button>
            <button class="btn btn-primary" style="background:#DC2626; border-color:#B91C1C; color:#FFFFFF; min-height:44px;" onclick="confirm('EMERGENCY: Trigger 1080i Emergency Station Loop Filler?')">
              ${renderIcon("alert", { size: 16 })} Force Emergency Filler
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the final automation playlist lock view (DT-406, SCR-BCST-22).
 */
function renderPlaylistLockViewHtml(): string {
  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="border-top:4px solid var(--vmn-color-primary);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <h4 style="font-size:1.15rem; font-weight:800; color:var(--vmn-color-text-main); margin:0;">
              24-Hour Frame-Accurate Automation Playlist Lock
            </h4>
            <p style="font-size:0.85rem; color:var(--vmn-color-text-muted); margin:4px 0 0;">
              Transmission Date: <strong>2026-03-30</strong> · Channel: <strong>NXTR (Nigezie Xtreme)</strong>
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <span class="vmn-badge badge-ready">Gate BG6 Cleared</span>
            <button class="btn btn-primary" style="min-height:44px;">Sign & Sync Automation</button>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 16px; border-radius:6px; margin-bottom:16px; font-family:monospace; font-size:0.85rem; color:#0F172A;">
          <strong>Cryptographic Playlist Hash (SHA-256):</strong>
          <div style="color:#0369A1; word-break:break-all; margin-top:2px;">
            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Timecode In</th>
                <th>Duration</th>
                <th>Asset Title / Segment</th>
                <th>Type</th>
                <th>Media File</th>
                <th>Lock Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-family:monospace;">001</td>
                <td style="font-family:monospace; font-weight:700; color:#0369A1;">06:00:00:00</td>
                <td style="font-family:monospace;">00:01:00:00</td>
                <td>NXTR Channel Station Ident 2026</td>
                <td><span class="vmn-badge badge-info">IDENT</span></td>
                <td style="font-family:monospace; font-size:0.8rem;">nxtr_ident_2026_1080i.mxf</td>
                <td><span class="vmn-badge badge-ready">${renderIcon("lock", { size: 12 })} LOCKED</span></td>
              </tr>
              <tr>
                <td style="font-family:monospace;">002</td>
                <td style="font-family:monospace; font-weight:700; color:#0369A1;">06:01:00:00</td>
                <td style="font-family:monospace;">00:28:30:00</td>
                <td>Sunrise Afro-Beats Morning Special (Part 1)</td>
                <td><span class="vmn-badge badge-ready">PROGRAMME</span></td>
                <td style="font-family:monospace; font-size:0.8rem;">pgm_sunrise_s01e04_part1.mxf</td>
                <td><span class="vmn-badge badge-ready">${renderIcon("lock", { size: 12 })} LOCKED</span></td>
              </tr>
              <tr>
                <td style="font-family:monospace;">003</td>
                <td style="font-family:monospace; font-weight:700; color:#0369A1;">06:29:30:00</td>
                <td style="font-family:monospace;">00:02:00:00</td>
                <td>Commercial Break CB-0630 (4 Spots)</td>
                <td><span class="vmn-badge badge-warning">COMMERCIAL</span></td>
                <td style="font-family:monospace; font-size:0.8rem;">cb_nxtr_20260330_0630.mxf</td>
                <td><span class="vmn-badge badge-ready">${renderIcon("lock", { size: 12 })} LOCKED</span></td>
              </tr>
              <tr>
                <td style="font-family:monospace;">004</td>
                <td style="font-family:monospace; font-weight:700; color:#0369A1;">06:31:30:00</td>
                <td style="font-family:monospace;">00:28:30:00</td>
                <td>Sunrise Afro-Beats Morning Special (Part 2)</td>
                <td><span class="vmn-badge badge-ready">PROGRAMME</span></td>
                <td style="font-family:monospace; font-size:0.8rem;">pgm_sunrise_s01e04_part2.mxf</td>
                <td><span class="vmn-badge badge-ready">${renderIcon("lock", { size: 12 })} LOCKED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the 3-way as-run reconciliation diff table (DT-406, SCR-BCST-24).
 */
function renderAsRunReconciliationDiffHtml(): string {
  const records = [
    { spotId: "SPT-2026-001", client: "Zenith Bank Plc", campaign: "Mobile Banking 2.0", planned: "06:29:30", aired: "06:29:30", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
    { spotId: "SPT-2026-002", client: "MTN Nigeria", campaign: "5G Ultra Data Push", planned: "06:30:00", aired: "06:30:00", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
    { spotId: "SPT-2026-003", client: "Guaranty Trust Bank", campaign: "Habari Pay", planned: "06:30:30", aired: "06:30:31 (+1s offset)", rfCarrier: "11,554 MHz StarTimes", status: "DISCREPANCY" },
    { spotId: "SPT-2026-004", client: "Airtel Nigeria", campaign: "SmartConnect Promo", planned: "06:31:00", aired: "06:31:00", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
    { spotId: "SPT-2026-005", client: "Nestle Milo", campaign: "Energy to Go", planned: "12:15:00", aired: "Preempted (Live Breaking)", rfCarrier: "No RF Carrier Match", status: "MISSED" },
    { spotId: "SPT-2026-006", client: "Unilever Omo", campaign: "Power Foam", planned: "12:15:30", aired: "12:15:30", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
    { spotId: "SPT-2026-007", client: "Coca-Cola Nigeria", campaign: "Real Magic Music", planned: "18:20:00", aired: "18:20:00", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
    { spotId: "SPT-2026-008", client: "Dangote Cement", campaign: "Build for Generations", planned: "18:20:30", aired: "18:20:30", rfCarrier: "11,554 MHz StarTimes", status: "MATCHED" },
  ];

  const rowsHtml = records
    .map((r) => {
      let badge: string;
      if (r.status === "MATCHED") {
        badge = `<span class="asrun-diff-badge asrun-diff-matched">${renderIcon("check", { size: 14 })} 3-WAY MATCHED</span>`;
      } else if (r.status === "DISCREPANCY") {
        badge = `<span class="asrun-diff-badge asrun-diff-discrepancy">${renderIcon("alert", { size: 14 })} TIMING DISCREPANCY</span>`;
      } else {
        badge = `<span class="asrun-diff-badge asrun-diff-missed">${renderIcon("xCircle", { size: 14 })} PREEMPTED / MISSED</span>`;
      }

      return `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${r.spotId}</td>
        <td><strong>${r.client}</strong><br><span style="font-size:0.75rem; color:#64748B;">${r.campaign}</span></td>
        <td style="font-family:monospace;">${r.planned}</td>
        <td style="font-family:monospace;">${r.aired}</td>
        <td style="font-size:0.8rem; color:#475569;">${r.rfCarrier}</td>
        <td>${badge}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h4 style="font-size:1.1rem; font-weight:800; color:var(--vmn-color-text-main); margin:0;">
            3-Way Reconciliation Differential (Leg 1 Traffic vs Leg 2 As-Run vs Leg 3 Carrier)
          </h4>
          <p style="font-size:0.85rem; color:var(--vmn-color-text-muted); margin:4px 0 0;">
            Governing Authority: CCPP-001 §13 / StarTimes Verified Carrier Logs · 264 Total Spots Ingested
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline" style="min-height:44px;">
            ${renderIcon("download", { size: 16 })} Export CSV Log
          </button>
          <button class="btn btn-primary" style="min-height:44px;">
            Authorize Verified Invoices &rarr;
          </button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Spot ID</th>
              <th>Advertiser / Campaign</th>
              <th>Leg 1 Contracted Air</th>
              <th>Leg 2 Playout Log</th>
              <th>Leg 3 StarTimes RF Carrier</th>
              <th>Reconciliation Status</th>
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

/**
 * Renders the EPG / XMLTV inspector with schedule-vs-published diff view (DT-905, SCR-BCST-14).
 */
function renderEpgInspectorDiffHtml(): string {
  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h4 style="font-size:1.1rem; font-weight:800; color:var(--vmn-color-text-main); margin:0;">
            XMLTV EPG Feed vs Master Schedule Reconciliation Diff
          </h4>
          <p style="font-size:0.85rem; color:var(--vmn-color-text-muted); margin:4px 0 0;">
            Format: XMLTV 0.6 DVB-SI Compliant · StarTimes Syndication Endpoint: <strong>api.startimes.com/v2/epg/vmn</strong>
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="/broadcast/export/epg/xmltv" class="btn btn-outline" style="min-height:44px; display:inline-flex; align-items:center; gap:6px;">
            ${renderIcon("download", { size: 16 })} Download XMLTV
          </a>
          <button class="btn btn-primary" style="min-height:44px; display:inline-flex; align-items:center; gap:6px;">
            ${renderIcon("send", { size: 16 })} Push EPG to StarTimes
          </button>
        </div>
      </div>

      <div class="xmltv-diff-view">
        <span class="xmltv-diff-same">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</span>
        <span class="xmltv-diff-same">&lt;!DOCTYPE tv SYSTEM "xmltv.dtd"&gt;</span>
        <span class="xmltv-diff-same">&lt;tv source-info-url="https://vmnl.ng" generator-info-name="VMNL-EPG-Engine"&gt;</span>
        <span class="xmltv-diff-same">  &lt;channel id="NXTR"&gt;</span>
        <span class="xmltv-diff-same">    &lt;display-name&gt;Nigezie Xtreme&lt;/display-name&gt;</span>
        <span class="xmltv-diff-same">  &lt;/channel&gt;</span>
        <span class="xmltv-diff-rem">- &lt;programme start="20260330060000 +0100" stop="20260330070000 +0100" channel="NXTR"&gt;</span>
        <span class="xmltv-diff-rem">-   &lt;title&gt;Sunrise Afro-Beats Morning Special (Draft)&lt;/title&gt;</span>
        <span class="xmltv-diff-rem">- &lt;/programme&gt;</span>
        <span class="xmltv-diff-add">+ &lt;programme start="20260330060000 +0100" stop="20260330070000 +0100" channel="NXTR"&gt;</span>
        <span class="xmltv-diff-add">+   &lt;title&gt;Sunrise Afro-Beats Top 20 - Season 3 Ep 12&lt;/title&gt;</span>
        <span class="xmltv-diff-add">+   &lt;desc&gt;Premier urban countdown featuring chart toppers across West Africa.&lt;/desc&gt;</span>
        <span class="xmltv-diff-add">+   &lt;category&gt;Music / Afro-Urban&lt;/category&gt;</span>
        <span class="xmltv-diff-add">+ &lt;/programme&gt;</span>
        <span class="xmltv-diff-same">  &lt;programme start="20260330070000 +0100" stop="20260330090000 +0100" channel="NXTR"&gt;</span>
        <span class="xmltv-diff-same">    &lt;title&gt;Lagos Urban Morning Rush&lt;/title&gt;</span>
        <span class="xmltv-diff-same">  &lt;/programme&gt;</span>
        <span class="xmltv-diff-same">&lt;/tv&gt;</span>
      </div>
    </div>
  `;
}

/**
 * Renders the broadcast revenue yield & analytics visualizations (DT-901, DT-903, SCR-BCST-31).
 */
function renderBroadcastYieldAnalyticsHtml(): string {
  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <!-- Yield KPI Grid -->
      <div class="grid-3" style="margin-top:0;">
        <div class="card stat-box">
          <span class="stat-val" style="color:var(--vmn-color-primary);">₦19,240,000.00</span>
          <span class="stat-lbl">Gross Daily Linear Yield (₦ kobo-correct)</span>
        </div>
        <div class="card stat-box">
          <span class="stat-val" style="color:#166534;">94.2%</span>
          <span class="stat-lbl">Overall Commercial Fill Rate</span>
        </div>
        <div class="card stat-box">
          <span class="stat-val" style="color:#0369A1;">₦245,000.00</span>
          <span class="stat-lbl">Average 30s Spot Rate (Blended)</span>
        </div>
      </div>

      <!-- Color-Blind Safe Bar Chart Visualization -->
      <div class="card" style="padding:20px;">
        <h4 style="font-size:1.05rem; font-weight:800; color:var(--vmn-color-text-main); margin:0 0 16px;">
          Daypart Commercial Yield & Fill Rate Comparison (Color-Blind Safe Palette)
        </h4>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:16px; border-radius:6px; border-top:4px solid #0369A1;">
            <strong style="display:block; font-size:0.9rem; color:#0F172A;">Early Morning (06:00 - 09:00)</strong>
            <span style="font-size:1.25rem; font-weight:800; color:#0369A1; display:block; margin:6px 0;">₦2,840,000.00</span>
            <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden; margin-bottom:6px;">
              <div style="width:82%; height:100%; background:#0369A1;"></div>
            </div>
            <span style="font-size:0.75rem; color:#64748B;">Fill Rate: <strong>82.0%</strong> (44 of 54 spots)</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:16px; border-radius:6px; border-top:4px solid #0F766E;">
            <strong style="display:block; font-size:0.9rem; color:#0F172A;">Daytime (09:00 - 16:00)</strong>
            <span style="font-size:1.25rem; font-weight:800; color:#0F766E; display:block; margin:6px 0;">₦5,260,000.00</span>
            <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden; margin-bottom:6px;">
              <div style="width:91%; height:100%; background:#0F766E;"></div>
            </div>
            <span style="font-size:0.75rem; color:#64748B;">Fill Rate: <strong>91.4%</strong> (96 of 105 spots)</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:16px; border-radius:6px; border-top:4px solid #E50914;">
            <strong style="display:block; font-size:0.9rem; color:#0F172A;">Prime Time (16:00 - 23:00)</strong>
            <span style="font-size:1.25rem; font-weight:800; color:#E50914; display:block; margin:6px 0;">₦9,840,000.00</span>
            <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden; margin-bottom:6px;">
              <div style="width:98%; height:100%; background:#E50914;"></div>
            </div>
            <span style="font-size:0.75rem; color:#64748B;">Fill Rate: <strong>98.2%</strong> (110 of 112 spots)</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:16px; border-radius:6px; border-top:4px solid #64748B;">
            <strong style="display:block; font-size:0.9rem; color:#0F172A;">Late Night (23:00 - 06:00)</strong>
            <span style="font-size:1.25rem; font-weight:800; color:#64748B; display:block; margin:6px 0;">₦1,300,000.00</span>
            <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden; margin-bottom:6px;">
              <div style="width:68%; height:100%; background:#64748B;"></div>
            </div>
            <span style="font-size:0.75rem; color:#64748B;">Fill Rate: <strong>68.0%</strong> (14 of 21 spots)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the operational UI for any of the 33 broadcast screens.
 */
export function renderBroadcastScreenHtml(
  screen: BroadcastScreenDescriptor,
  params: Record<string, string> = {},
  userRole?: string
): string {
  const isAuthorized = isRoleAuthorizedForScreen(userRole, screen);

  if (!isAuthorized) {
    return `
      <div class="broadcast-screen-container p-6 max-w-4xl mx-auto" style="min-height: 70vh;">
        <div class="card p-6 bg-red-50 border border-red-200 rounded-lg text-center" style="margin-top: 40px;">
          <div style="margin-bottom: 12px; color: #991B1B;">${renderIcon("lock", { size: 48 })}</div>
          <h1 class="text-2xl font-bold text-red-800 mb-2">403 Access Denied</h1>
          <p class="text-red-700 mb-4">
            Role <strong>${userRole || "Anonymous"}</strong> is not authorized to access operational screen
            <strong>${screen.screenId} (${screen.name})</strong>.
          </p>
          <p class="text-sm text-red-600 mb-6">
            Required Operating Authority: <strong>${screen.primaryRole}</strong> or Broadcast Executive clearance.
          </p>
          <div class="actions">
            <a href="/broadcast/screens" class="btn btn-primary" style="display:inline-block; min-height:44px; line-height:44px; padding:0 20px;">
              Return to Broadcast Screens Catalog
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Section 67 Gate & Information Model Decision
  const gateClearance = SCREEN_GATES[screen.screenId] || "Gate BG0–BG9 (Operational Desk)";
  const decisionData = SCREEN_DECISIONS[screen.screenId] || {
    decision: `Execute operational control and review domain telemetry for ${screen.name}.`,
    actionLabel: "Execute Operational Action",
    kpis: [["Operational Status", "Normal"], ["Gate State", "Cleared"], ["Telemetry", "Connected"], ["SLA Compliance", "100%"]],
  };

  const actionsBadges = screen.permittedActions
    .map(
      (a) =>
        `<span style="background:#0F172A; color:#38BDF8; font-family:monospace; padding:4px 10px; border-radius:4px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:4px;">${renderIcon("bolt", { size: 14 })} ${a}</span>`
    )
    .join(" ");

  const paramTags = Object.entries(params)
    .filter(([k]) => k !== "state")
    .map(
      ([k, v]) =>
        `<span style="background:#E2E8F0; color:#334155; padding:2px 8px; border-radius:4px; font-size:0.8rem;">${k}: <strong>${v}</strong></span>`
    )
    .join(" ");

  const activeState = params.state || "default";

  // Per-Screen Domain Specific Panel Content
  let panelContent: string;

  if (activeState === "empty") {
    panelContent = `
      <div class="empty-state p-8 text-center" role="region" aria-label="Empty State">
        <div style="margin-bottom: 8px; color: var(--vmn-color-text-muted);">${renderIcon("inbox", { size: 40 })}</div>
        <h4 class="font-bold text-slate-800 text-base mb-1">No Active Records Found</h4>
        <p class="text-xs text-slate-500 mb-4">There are currently no operational records, pending transmissions, or queued items in this view.</p>
        <a href="?state=default" class="btn btn-outline" style="min-height:44px; padding:8px 16px; font-size:0.85rem; display:inline-flex; align-items:center;">Return to Live View</a>
      </div>
    `;
  } else if (activeState === "error") {
    panelContent = `
      <div class="error-state p-8 text-center bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div style="margin-bottom: 8px; color: #DC2626;">${renderIcon("alert", { size: 40 })}</div>
        <h4 class="font-bold text-red-800 text-base mb-1">Operational Telemetry Alert</h4>
        <p class="text-xs text-red-600 mb-4">Subsystem communication error encountered. Playout automation heartbeat degraded.</p>
        <a href="?state=default" class="btn btn-outline" style="min-height:44px; padding:8px 16px; font-size:0.85rem; display:inline-flex; align-items:center;">Retry Operation</a>
      </div>
    `;
  } else if (activeState === "loading") {
    panelContent = `
      <div class="loading-state p-8 text-center" role="status" aria-busy="true">
        <div class="spinner" style="margin-bottom: 8px; color: var(--vmn-color-primary);">${renderIcon("hourglass", { size: 36, className: "vmn-spinner-icon" })}</div>
        <h4 class="font-bold text-slate-800 text-base mb-1">Loading Operational Grid...</h4>
        <p class="text-xs text-slate-500 mb-4">Synchronizing real-time telemetry from channel playout automation.</p>
        <div style="height: 12px; background: #E2E8F0; border-radius: 6px; width: 60%; margin: 8px auto;"></div>
        <div style="height: 12px; background: #E2E8F0; border-radius: 6px; width: 40%; margin: 8px auto;"></div>
      </div>
    `;
  } else {
    // Specific rich domain implementations
    if (screen.screenId === "SCR-BCST-12") {
      panelContent = renderScheduleGridTimelineHtml();
    } else if (screen.screenId === "SCR-BCST-23") {
      panelContent = renderLivePlayoutMonitorHtml();
    } else if (screen.screenId === "SCR-BCST-22") {
      panelContent = renderPlaylistLockViewHtml();
    } else if (screen.screenId === "SCR-BCST-24") {
      panelContent = renderAsRunReconciliationDiffHtml();
    } else if (screen.screenId === "SCR-BCST-14") {
      panelContent = renderEpgInspectorDiffHtml();
    } else if (screen.screenId === "SCR-BCST-31") {
      panelContent = renderBroadcastYieldAnalyticsHtml();
    } else {
      // Standard Domain Records Table
      const kpisHtml = decisionData.kpis
        .map(
          ([label, val]) => `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:10px 14px; border-radius:6px;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:#64748B; font-weight:700; display:block;">${label}</span>
            <strong style="font-size:1.05rem; color:#0F172A;">${val}</strong>
          </div>
        `
        )
        .join("");

      panelContent = `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- Screen KPIs Grid -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
            ${kpisHtml}
          </div>

          <!-- Domain Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Target ID</th>
                  <th>Primary Entity / Segment</th>
                  <th>Operating Window / State</th>
                  <th>Authority Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-family:monospace; font-weight:700; color:#0369A1;">REC-${screen.screenId}-01</td>
                  <td><strong>Afro-Urban Master Release 2026</strong><br><span style="font-size:0.75rem; color:#64748B;">Nigezie Xtreme Linear Transmission</span></td>
                  <td style="font-size:0.85rem; color:#475569;">06:00 - 12:00 WAT · Live Airing</td>
                  <td><span class="vmn-badge badge-ready">CLEARED (GATE BG)</span></td>
                  <td><button class="btn btn-outline" style="min-height:44px; padding:6px 12px; font-size:0.8rem; display:inline-flex; align-items:center;">Inspect</button></td>
                </tr>
                <tr>
                  <td style="font-family:monospace; font-weight:700; color:#0369A1;">REC-${screen.screenId}-02</td>
                  <td><strong>Orisun Cultural Forum & Folklore</strong><br><span style="font-size:0.75rem; color:#64748B;">Indigenous Yoruba Arts Feature</span></td>
                  <td style="font-size:0.85rem; color:#475569;">12:00 - 18:00 WAT · Queued</td>
                  <td><span class="vmn-badge badge-info">QUEUED</span></td>
                  <td><button class="btn btn-outline" style="min-height:44px; padding:6px 12px; font-size:0.8rem; display:inline-flex; align-items:center;">Inspect</button></td>
                </tr>
                <tr>
                  <td style="font-family:monospace; font-weight:700; color:#0369A1;">REC-${screen.screenId}-03</td>
                  <td><strong>Isi Mbido Prime Drama Feature</strong><br><span style="font-size:0.75rem; color:#64748B;">Igbo Cultural Narrative Arc</span></td>
                  <td style="font-size:0.85rem; color:#475569;">18:00 - 24:00 WAT · Pre-Air Lock</td>
                  <td><span class="vmn-badge badge-ready">VERIFIED</span></td>
                  <td><button class="btn btn-outline" style="min-height:44px; padding:6px 12px; font-size:0.8rem; display:inline-flex; align-items:center;">Inspect</button></td>
                </tr>
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
        <span style="display:flex; align-items:center; gap:8px;">
          ${renderIcon(station.icon, { size: 16 })}
          <span>${station.name}</span>
        </span>
        <span style="font-size:0.7rem; font-weight:700; opacity:0.75;">${station.screens.length}</span>
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

          <span class="operator-context-label" style="margin-left:8px;">Broadcast Date:</span>
          <span style="background:#1E293B; color:#F8FAFC; border:1px solid var(--vmn-color-control-border); padding:6px 12px; border-radius:4px; font-family:monospace; font-size:0.85rem; font-weight:600;">
            ${params.date || "2026-03-30"}
          </span>

          <span class="operator-context-label" style="margin-left:8px;">Mode:</span>
          <span style="background:#065F46; color:#A7F3D0; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; letter-spacing:0.05em;">
            LIVE OPERATING
          </span>
        </div>

        <div class="operator-context-group">
          <span class="operator-context-label">Role Context:</span>
          <span style="background:#1E293B; color:#38BDF8; padding:4px 10px; border-radius:4px; font-size:0.8rem; font-weight:700; border:1px solid #0369A1;">
            ${userRole || screen.primaryRole}
          </span>
          <a href="/broadcast/screens" class="btn btn-outline" style="min-height:44px; padding:6px 14px; font-size:0.85rem; color:#F8FAFC; border-color:#475569; display:inline-flex; align-items:center;">
            Catalog
          </a>
        </div>
      </header>

      <!-- Main Layout Body: Left Rail + Active Screen Console -->
      <div class="operator-layout-body">
        <!-- Left Rail: Duty Stations (§4.2) -->
        <nav class="operator-rail" aria-label="Duty Stations Navigation">
          <div class="operator-rail-header">Duty Stations (§4.2)</div>
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${dutyStationsHtml}
          </div>

          <div style="margin-top:20px; padding-top:12px; border-top:1px solid var(--vmn-color-border);">
            <div class="operator-rail-header" style="padding-bottom:6px;">Release Gate</div>
            <div style="padding:6px 12px; background:#F8FAFC; border-radius:4px; font-size:0.75rem; color:#475569; font-weight:600;">
              ${gateClearance}
            </div>
          </div>
        </nav>

        <!-- Right Main: Operational Screen Surface -->
        <main class="broadcast-screen-surface" data-screen-id="${screen.screenId}">
          <!-- Screen Header -->
          <header class="screen-header mb-6 pb-4 border-b border-slate-200" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
                <span style="background:#0284C7; color:#FFFFFF; font-family:monospace; font-weight:700; font-size:0.85rem; padding:3px 8px; border-radius:4px;">
                  ${screen.screenId}
                </span>
                <span style="font-weight:700; color:#64748B; font-size:0.85rem;">Screen #${screen.screenNumber} of 33</span>
                <span style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:9999px;">
                  ${screen.primaryRole}
                </span>
                <span style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:9999px;">
                  ${gateClearance}
                </span>
                ${paramTags ? `<div style="display:flex; gap:6px;">${paramTags}</div>` : ""}
              </div>
              <h1 class="text-3xl font-extrabold text-slate-900">${screen.name}</h1>
              <p class="text-slate-600 mt-1 max-w-2xl">${screen.description}</p>
            </div>

            <div style="display:flex; gap:10px; align-items:center;">
              <button class="btn btn-primary btn-execute-control" data-screen-id="${screen.screenId}" style="min-height:44px; display:inline-flex; align-items:center; padding:0 16px;">
                ${decisionData.actionLabel} &rarr;
              </button>
            </div>
          </header>

          <!-- Live Channel & Stream Telemetry Bar -->
          <div class="mb-4 p-3 bg-slate-900 text-white rounded-lg" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#38BDF8;">${renderIcon("broadcast", { size: 18 })}</span>
              <strong style="font-size:0.85rem; letter-spacing:0.05em; text-transform:uppercase;">Live Channel & Stream Telemetry</strong>
            </div>
            <div style="display:flex; align-items:center; gap:12px; font-size:0.8rem; font-family:monospace;">
              <span>CARRIER: <span style="color:#34D399;">11,554 MHz StarTimes</span></span>
              <span>PID: <span style="color:#38BDF8;">0x1021</span></span>
              <span style="background:#1E293B; color:#94A3B8; padding:2px 8px; border-radius:4px; font-size:0.75rem; border:1px solid #334155;">SAMPLE TELEMETRY</span>
            </div>
          </div>

          <!-- TODO-BCST-01 provenance banner (DEC-RL1-SCOPE-001 C-4): the
               sample decision/KPI set below is presentation-layer content
               pending each screen's accountable data-source integration;
               sample values never represent live operational capability. -->
          ${renderMockDataBanner((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), screen.name)}

          <!-- Operational Decision Box (DT-402 Information Model) -->
          <div class="card mb-6" style="background:#F0F9FF; border:1px solid #BAE6FD; padding:16px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <div style="color:#0369A1; margin-top:2px;">${renderIcon("info", { size: 24 })}</div>
                <div>
                  <strong style="font-size:0.85rem; text-transform:uppercase; color:#0369A1; letter-spacing:0.05em; display:block;">
                    Primary Operational Decision (R1.2A §48 / §67)
                  </strong>
                  <p style="font-size:0.95rem; color:#0F172A; margin:4px 0 0; font-weight:600;">
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

            <div class="state-controls flex gap-2 text-xs flex-wrap" style="margin-top: 16px; padding-top: 10px; border-top: 1px solid #E2E8F0;">
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
