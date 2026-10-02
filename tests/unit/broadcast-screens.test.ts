/**
 * Broadcast Operational Screens (SCR-BCST-01 to 33) Unit Tests
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46) / T-19 (B-15)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import {
  matchBroadcastScreen,
  isRoleAuthorizedForScreen,
  renderBroadcastScreenHtml,
} from "../../src/web/broadcast/index.js";

describe("T-19 (B-15): 33 Operational Broadcast Screen Surfaces", () => {
  it("matches all 33 broadcast screens to real routes with parameter resolution", () => {
    expect(BROADCAST_SCREEN_INVENTORY.length).toBe(33);

    for (const screen of BROADCAST_SCREEN_INVENTORY) {
      // Form a realistic path for parameterized routes
      const testPath = screen.route
        .replace(":id", "test-item-123")
        .replace(":date", "2026-03-30");

      const match = matchBroadcastScreen(testPath);
      expect(match).not.toBeNull();
      expect(match?.screen.screenId).toBe(screen.screenId);
      expect(match?.screen.screenNumber).toBe(screen.screenNumber);

      if (screen.route.includes(":id")) {
        expect(match?.params.id).toBe("test-item-123");
      }
      if (screen.route.includes(":date")) {
        expect(match?.params.date).toBe("2026-03-30");
      }
    }
  });

  it("authorizes primary roles and broadcast executive roles for operational screens", () => {
    const playoutScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-23")!;
    expect(playoutScreen.primaryRole).toBe("PlayoutOperator");

    // Primary role authorized
    expect(isRoleAuthorizedForScreen("PlayoutOperator", playoutScreen)).toBe(true);
    // MCRSupervisor authorized for playout
    expect(isRoleAuthorizedForScreen("MCRSupervisor", playoutScreen)).toBe(true);
    // Executive authorized
    expect(isRoleAuthorizedForScreen("ExecutiveLeader", playoutScreen)).toBe(true);
    expect(isRoleAuthorizedForScreen("BroadcastDirector", playoutScreen)).toBe(true);

    // Unauthorized non-broadcast roles rejected
    expect(isRoleAuthorizedForScreen("AcademyLearner", playoutScreen)).toBe(false);
    expect(isRoleAuthorizedForScreen("PartnerSponsor", playoutScreen)).toBe(false);
    expect(isRoleAuthorizedForScreen(undefined, playoutScreen)).toBe(false);
  });

  it("renders 403 access denied view when an unauthorized role accesses a screen", () => {
    const gridScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-12")!;
    const html = renderBroadcastScreenHtml(gridScreen, {}, "AcademyLearner");

    expect(html).toContain("403 Access Denied");
    expect(html).toContain("AcademyLearner");
    expect(html).toContain("TrafficManager");
    expect(html).toContain("SCR-BCST-12");
  });

  it("renders full operational console HTML with permitted actions when authorized", () => {
    const asRunScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-24")!;
    const html = renderBroadcastScreenHtml(asRunScreen, {}, "TrafficManager");

    expect(html).toContain("As-Run Log Ingestion & Reconciliation");
    expect(html).toContain("SCR-BCST-24");
    expect(html).toContain("TrafficManager");
    expect(html).toContain("ingest_log");
    expect(html).toContain("reconcile");
    expect(html).toContain("Live Channel & Stream Telemetry");
    expect(html).toContain("Active Operational Records");
  });

  it("renders operator shell with 10 duty stations rail and global context bar (DT-401)", () => {
    const screen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-01")!;
    const html = renderBroadcastScreenHtml(screen, { channel: "NXTR", date: "2026-03-30" }, "ExecutiveLeader");

    // Context bar checks
    expect(html).toContain("Channel Feed:");
    expect(html).toContain("NXTR — Nigezie Xtreme");
    expect(html).toContain("Broadcast Date:");
    expect(html).toContain("2026-03-30");
    expect(html).toContain("LIVE OPERATING");

    // Duty stations rail checks (§4.2)
    expect(html).toContain("Duty Stations (§4.2)");
    expect(html).toContain("Commissioning");
    expect(html).toContain("Catalogue & Rights");
    expect(html).toContain("Scheduling");
    expect(html).toContain("Traffic & Inventory");
    expect(html).toContain("Playout");
    expect(html).toContain("Transmission & Carriage");
    expect(html).toContain("Proof & Reconciliation");
    expect(html).toContain("Revenue");
    expect(html).toContain("Analytics");
    expect(html).toContain("Continuity & Command");
  });

  it("renders distinct, accessible empty, error, and loading states per screen (DT-404)", () => {
    const screen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-04")!;

    // Empty state
    const emptyHtml = renderBroadcastScreenHtml(screen, { state: "empty" }, "BroadcastDirector");
    expect(emptyHtml).toContain("No Active Records Found");
    expect(emptyHtml).toContain('aria-label="Empty State"');
    expect(emptyHtml).toContain("Return to Live View");

    // Error state
    const errorHtml = renderBroadcastScreenHtml(screen, { state: "error" }, "BroadcastDirector");
    expect(errorHtml).toContain("Operational Telemetry Alert");
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("Retry Operation");

    // Loading state
    const loadingHtml = renderBroadcastScreenHtml(screen, { state: "loading" }, "BroadcastDirector");
    expect(loadingHtml).toContain("Loading Operational Grid...");
    expect(loadingHtml).toContain('role="status"');
    expect(loadingHtml).toContain('aria-busy="true"');
  });

  it("renders 24/7 visual schedule timeline grid with dayparts and lock status (DT-405)", () => {
    const scheduleScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-12")!;
    const html = renderBroadcastScreenHtml(scheduleScreen, {}, "TrafficManager");

    expect(html).toContain("24-Hour Broadcast Master Timeline");
    expect(html).toContain("Early Morning");
    expect(html).toContain("Daytime");
    expect(html).toContain("Prime Time");
    expect(html).toContain("Late Night");
    expect(html).toContain("Sunrise Afro-Beats Top 20");
    expect(html).toContain("Rights Blocked");
    expect(html).toContain("Playout Locked");
  });

  it("renders live playout monitor, playlist lock hash, and 3-way as-run reconciliation diff (DT-406)", () => {
    // SCR-BCST-23: Live Playout Monitor
    const playoutScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-23")!;
    const playoutHtml = renderBroadcastScreenHtml(playoutScreen, {}, "PlayoutOperator");
    expect(playoutHtml).toContain("TRANSMITTING ON AIR");
    expect(playoutHtml).toContain("Next Event Countdown:");
    expect(playoutHtml).toContain("Force Emergency Filler");

    // SCR-BCST-22: Playlist Lock View
    const lockScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-22")!;
    const lockHtml = renderBroadcastScreenHtml(lockScreen, {}, "PlayoutOperator");
    expect(lockHtml).toContain("Cryptographic Playlist Hash (SHA-256):");
    expect(lockHtml).toContain("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    // SCR-BCST-24: 3-Way As-Run Diff
    const asRunScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-24")!;
    const asRunHtml = renderBroadcastScreenHtml(asRunScreen, {}, "TrafficManager");
    expect(asRunHtml).toContain("3-Way Reconciliation Differential");
    expect(asRunHtml).toContain("3-WAY MATCHED");
    expect(asRunHtml).toContain("TIMING DISCREPANCY");
    expect(asRunHtml).toContain("PREEMPTED / MISSED");
  });

  it("renders broadcast revenue yield with color-blind safe comparison and ₦ formatting (DT-901, DT-903)", () => {
    const yieldScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-31")!;
    const html = renderBroadcastScreenHtml(yieldScreen, {}, "FinanceController");

    expect(html).toContain("₦19,240,000.00");
    expect(html).toContain("Gross Daily Linear Yield (₦ kobo-correct)");
    expect(html).toContain("94.2%");
    expect(html).toContain("Daypart Commercial Yield & Fill Rate Comparison (Color-Blind Safe Palette)");
  });

  it("renders EPG / XMLTV inspector with schedule-vs-published diff and syndication push (DT-905)", () => {
    const epgScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-14")!;
    const html = renderBroadcastScreenHtml(epgScreen, {}, "TrafficManager");

    expect(html).toContain("XMLTV EPG Feed vs Master Schedule Reconciliation Diff");
    expect(html).toContain("Push EPG to StarTimes");
    expect(html).toContain("Download XMLTV");
    expect(html).toContain("xmltv-diff-view");
    expect(html).toContain("xmltv-diff-add");
    expect(html).toContain("xmltv-diff-rem");
  });

  describe("T9-01 (F-9-01): Screen Route Authentication & Bypass Prevention", () => {
    let server: any;
    let baseUrl: string;

    beforeAll(async () => {
      const { createApiServer } = await import("../../src/api/server.js");
      server = createApiServer(0);
      await server.start();
      const port = (server.server.address() as { port: number }).port;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
      await server.stop();
    });

    it("rejects unauthenticated requests to broadcast screens with 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/broadcast/playout/live`);
      expect(res.status).toBe(401);
      const text = await res.text();
      expect(text).toContain("401 Unauthorized");
      expect(text).toContain("AUTHENTICATION REQUIRED");
    });

    it("rejects unauthorized roles with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/broadcast/playout/live`, {
        headers: { "x-test-role": "AcademyLearner" },
      });
      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain("403 Forbidden");
    });

    it("permits authorized roles with 200 OK", async () => {
      const res = await fetch(`${baseUrl}/broadcast/playout/live`, {
        headers: { "x-test-role": "PlayoutOperator" },
      });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("Live Playout Status");
    });

    it("prohibits x-test-role spoofing when NODE_ENV is production", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        const res = await fetch(`${baseUrl}/broadcast/playout/live`, {
          headers: { "x-test-role": "PlayoutOperator" },
        });
        // In production, x-test-role is inert, so resolveSessionUser returns null -> 401
        expect(res.status).toBe(401);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
