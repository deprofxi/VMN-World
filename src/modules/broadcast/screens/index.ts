/**
 * 33 Broadcast Operational Screen Surface Descriptors
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46)
 */

export interface BroadcastScreenDescriptor {
  screenNumber: number;
  screenId: string;
  name: string;
  route: string;
  primaryRole: string;
  description: string;
  permittedActions: string[];
}

export const BROADCAST_SCREEN_INVENTORY: BroadcastScreenDescriptor[] = [
  { screenNumber: 1, screenId: "SCR-BCST-01", name: "Broadcast Executive Dashboard", route: "/broadcast/dashboard", primaryRole: "ExecutiveLeader", description: "Channel health, air status, daily yield and outage alerts", permittedActions: ["view", "export"] },
  { screenNumber: 2, screenId: "SCR-BCST-02", name: "Channel Portfolio Overview", route: "/broadcast/channels", primaryRole: "BroadcastDirector", description: "Portfolio summary of Nigezie Xtreme, Orisun, and Isi Mbido", permittedActions: ["view", "configure"] },
  { screenNumber: 3, screenId: "SCR-BCST-03", name: "Channel Profile & Settings", route: "/broadcast/channels/:id", primaryRole: "BroadcastDirector", description: "Technical parameters, audio standards, StarTimes channel IDs", permittedActions: ["view", "edit"] },
  { screenNumber: 4, screenId: "SCR-BCST-04", name: "Programme Catalogue", route: "/broadcast/programmes", primaryRole: "BroadcastDirector", description: "Catalogue search, genre filters, and episode counts", permittedActions: ["view", "search", "create"] },
  { screenNumber: 5, screenId: "SCR-BCST-05", name: "Programme Detail", route: "/broadcast/programmes/:id", primaryRole: "BroadcastDirector", description: "Synopsis, cast, seasons, broadcast history", permittedActions: ["view", "edit"] },
  { screenNumber: 6, screenId: "SCR-BCST-06", name: "Series Management", route: "/broadcast/series/:id", primaryRole: "BroadcastDirector", description: "Season ordering, episode slates, and series arc", permittedActions: ["view", "edit", "reorder"] },
  { screenNumber: 7, screenId: "SCR-BCST-07", name: "Episode Workspace", route: "/broadcast/episodes/:id", primaryRole: "BroadcastDirector", description: "Segment breakdown, duration, timecode, and audio tracks", permittedActions: ["view", "edit"] },
  { screenNumber: 8, screenId: "SCR-BCST-08", name: "Broadcast Versions & QC Flags", route: "/broadcast/episodes/:id/versions", primaryRole: "BroadcastDirector", description: "Master, Clean, Subtitled, Censored versions with QC status", permittedActions: ["view", "upload", "qc_override"] },
  { screenNumber: 9, screenId: "SCR-BCST-09", name: "Rights Readiness Matrix", route: "/broadcast/rights/readiness", primaryRole: "RightsManager", description: "Channel/territory rights availability and expiry warnings", permittedActions: ["view", "clear_rights", "block"] },
  { screenNumber: 10, screenId: "SCR-BCST-10", name: "Programme Acquisition Pipeline", route: "/broadcast/acquisitions", primaryRole: "RightsManager", description: "Inbound content acquisition deals, license windows, costs", permittedActions: ["view", "create", "approve"] },
  { screenNumber: 11, screenId: "SCR-BCST-11", name: "Commissioning Tracking", route: "/broadcast/commissioning", primaryRole: "ExecutiveLeader", description: "Original production commissions, milestones, and deliverable status", permittedActions: ["view", "approve_milestone"] },
  { screenNumber: 12, screenId: "SCR-BCST-12", name: "24/7 Visual Schedule Grid", route: "/broadcast/schedule/grid", primaryRole: "TrafficManager", description: "Interactive timeline grid, frame-accurate daypart planning", permittedActions: ["view", "schedule", "lock"] },
  { screenNumber: 13, screenId: "SCR-BCST-13", name: "Daypart Configuration", route: "/broadcast/schedule/dayparts", primaryRole: "BroadcastDirector", description: "Early Morning, Daytime, Prime Time, Late Night rate definitions", permittedActions: ["view", "edit"] },
  { screenNumber: 14, screenId: "SCR-BCST-14", name: "EPG Inspector & Syndication", route: "/broadcast/epg/syndication", primaryRole: "TrafficManager", description: "XMLTV feed inspection, diff verification, export trigger", permittedActions: ["view", "export_xmltv", "push_startimes"] },
  { screenNumber: 15, screenId: "SCR-BCST-15", name: "Promo & Interstitial Planner", route: "/broadcast/promos", primaryRole: "TrafficManager", description: "Station promos, lineup interstitials, filler rotation", permittedActions: ["view", "schedule_promo"] },
  { screenNumber: 16, screenId: "SCR-BCST-16", name: "Commercial Inventory Availability Grid", route: "/broadcast/traffic/inventory", primaryRole: "TrafficManager", description: "Available avails, sell-out rates, capacity per break", permittedActions: ["view", "book_spot"] },
  { screenNumber: 17, screenId: "SCR-BCST-17", name: "Commercial Break Structure Editor", route: "/broadcast/traffic/breaks/:id", primaryRole: "TrafficManager", description: "Break duration, spot sequence, ident & sting positions", permittedActions: ["view", "reorder_spots", "clash_check"] },
  { screenNumber: 18, screenId: "SCR-BCST-18", name: "Ad Campaign Management", route: "/broadcast/campaigns", primaryRole: "TrafficManager", description: "Flighting dates, GRP/spot commitments, brand category", permittedActions: ["view", "create", "flight"] },
  { screenNumber: 19, screenId: "SCR-BCST-19", name: "Spot Materials & QC Review", route: "/broadcast/traffic/materials", primaryRole: "TrafficManager", description: "Commercial copy video files, loudness check, censorship approval", permittedActions: ["view", "approve_copy"] },
  { screenNumber: 20, screenId: "SCR-BCST-20", name: "Sponsorship Inventory & Entitlements", route: "/broadcast/sponsorship", primaryRole: "TrafficManager", description: "Programme naming rights, bugs, lower-third delivery counts", permittedActions: ["view", "bind_sponsor"] },
  { screenNumber: 21, screenId: "SCR-BCST-21", name: "Daily Traffic Log", route: "/broadcast/traffic/log/:date", primaryRole: "TrafficManager", description: "Consolidated commercial booking log for transmission", permittedActions: ["view", "lock_traffic", "export"] },
  { screenNumber: 22, screenId: "SCR-BCST-22", name: "Final Automation Playlist Lock", route: "/broadcast/playout/playlist/:date", primaryRole: "PlayoutOperator", description: "Frame-accurate playlist lock for playout server sync", permittedActions: ["view", "lock", "push_automation"] },
  { screenNumber: 23, screenId: "SCR-BCST-23", name: "Live Playout Status Monitor", route: "/broadcast/playout/live", primaryRole: "PlayoutOperator", description: "On-air status, next event, countdown, emergency filler switch", permittedActions: ["view", "trigger_filler", "manual_override"] },
  { screenNumber: 24, screenId: "SCR-BCST-24", name: "As-Run Log Ingestion & Reconciliation", route: "/broadcast/asrun/reconciliation", primaryRole: "TrafficManager", description: "3-way match: plan vs. as-run vs. air evidence", permittedActions: ["view", "ingest_log", "reconcile"] },
  { screenNumber: 25, screenId: "SCR-BCST-25", name: "Transmission Real-Time Monitor", route: "/broadcast/transmission/live", primaryRole: "BroadcastDirector", description: "Carrier health, bitrate graphs, transmission link state", permittedActions: ["view", "diagnose"] },
  { screenNumber: 26, screenId: "SCR-BCST-26", name: "Transmission Incidents & SLA Tracking", route: "/broadcast/transmission/incidents", primaryRole: "BroadcastDirector", description: "Incident logging, downtime calculation, SLA penalty tracking", permittedActions: ["view", "create_incident", "resolve"] },
  { screenNumber: 27, screenId: "SCR-BCST-27", name: "Carriage Platforms Registry", route: "/broadcast/carriage/platforms", primaryRole: "BroadcastDirector", description: "DTT, DTH, cable, and streaming distribution endpoints", permittedActions: ["view", "edit"] },
  { screenNumber: 28, screenId: "SCR-BCST-28", name: "StarTimes Carriage Monitor", route: "/broadcast/carriage/startimes", primaryRole: "BroadcastDirector", description: "StarTimes satellite transponder parameters, PIDs, uptime", permittedActions: ["view", "test_feed"] },
  { screenNumber: 29, screenId: "SCR-BCST-29", name: "Carriage Agreements & Contracts", route: "/broadcast/carriage/agreements", primaryRole: "ExecutiveLeader", description: "Carriage contract terms, renewal dates, channel bouquet fees", permittedActions: ["view", "upload_agreement"] },
  { screenNumber: 30, screenId: "SCR-BCST-30", name: "Proof-of-Air Dispatcher", route: "/broadcast/proof-of-air", primaryRole: "TrafficManager", description: "Cryptographically verified Certificate of Airing generator", permittedActions: ["view", "generate_certificate", "dispatch_client"] },
  { screenNumber: 31, screenId: "SCR-BCST-31", name: "Broadcast Revenue Yield Dashboard", route: "/broadcast/finance/yield", primaryRole: "FinanceController", description: "Yield per daypart, average spot rate, unbooked inventory cost", permittedActions: ["view", "export_financials"] },
  { screenNumber: 32, screenId: "SCR-BCST-32", name: "Channel Performance Analytics", route: "/broadcast/analytics/performance", primaryRole: "ExecutiveLeader", description: "Audience ratings, demographic reach, share of viewing", permittedActions: ["view", "filter"] },
  { screenNumber: 33, screenId: "SCR-BCST-33", name: "Cross-Platform Azeebo+ Conversion", route: "/broadcast/analytics/azeebo-conversion", primaryRole: "ExecutiveLeader", description: "On-air QR scans, UTM campaign conversions, Azeebo+ installs", permittedActions: ["view", "export"] },
];

export function getScreenDescriptor(screenNumber: number): BroadcastScreenDescriptor | undefined {
  return BROADCAST_SCREEN_INVENTORY.find((s) => s.screenNumber === screenNumber);
}

export function getScreenDescriptorById(screenId: string): BroadcastScreenDescriptor | undefined {
  const normalized = screenId.trim().toUpperCase();
  return BROADCAST_SCREEN_INVENTORY.find(
    (s) => s.screenId.toUpperCase() === normalized || s.screenNumber.toString() === normalized
  );
}
