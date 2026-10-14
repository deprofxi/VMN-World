/**
 * Broadcast Operational Screens (SCR-BCST-01 to 33) Unit Tests
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46) / T-19 (B-15) / docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import {
  matchBroadcastScreen,
  isRoleAuthorizedForScreen,
  renderBroadcastScreenHtml,
} from "../../src/web/broadcast/index.js";
import { afterEach } from "vitest";
import { createHash } from "node:crypto";
import {
  getApprovedRevision,
  getSchedule,
  markReadyForAir,
  registerVersion,
  upsertDraftSchedule,
  type VersionQcReport,
  _resetSchedulesForTesting,
  _resetVersionsForTesting,
} from "../../src/modules/broadcast/versions/index.js";
import { _resetRegisteredRightsIndexForTesting } from "../../src/modules/broadcast/rights/index.js";
import { buildScreenEngineSnapshot } from "../../src/api/router.js";
import { BroadcastBillingEngine } from "../../src/modules/broadcast/billing/index.js";
import { SponsorshipEngine, type SponsorBinding } from "../../src/modules/broadcast/sponsorship/index.js";
import { approvePreAirChain, deleteFixtureRights, fixtureRightsWrite, registerFixtureRights } from "../helpers/rights-fixtures.js";

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
    expect(html).toContain("Registered Channels &amp; Carriage State");
    expect(html).toContain("CARRIAGE UNVERIFIED");
    expect(html).not.toContain("11,554 MHz");
    expect(html).not.toContain("0x1021");
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

  /**
   * TSK-11 replaced the invented panel content with store reads, so these tests
   * seed a real approved day and assert the screen renders *that* — and that the
   * fabricated originals are gone from the render path, not merely hidden.
   */
  const CHANNEL = "NXTR";
  const DAY = "2026-10-05";
  const RIGHTS = "rr-tsk11-screens";
  const VERSION = "ver-tsk11-screens";
  const SCHEDULE = "SCHED-TSK11-SCREENS";
  const QC: VersionQcReport = {
    videoStandard: "1080i50",
    aspectRatio: "16:9",
    audioLoudnessLufs: -23,
    hasCountdownSlate: true,
    hasBlackGaps: false,
    hasClosedCaptionTrack: true,
  };

  async function seedApprovedDay(): Promise<void> {
    await registerFixtureRights(fixtureRightsWrite(RIGHTS, { title: "TSK-11 fixture window" }));
    registerVersion({ id: VERSION, episodeId: "EP-TSK11", versionType: "MASTER", durationSeconds: 4500, qc: QC });
    markReadyForAir({ versionId: VERSION, rfaBy: "qc-1" });
    upsertDraftSchedule({
      scheduleId: SCHEDULE,
      channelId: CHANNEL,
      broadcastDate: DAY,
      entries: [
        {
          entryId: "e-tsk11",
          versionId: VERSION,
          programmeTitle: "Prime Time News & Culture 360",
          startSecondsFromDayStart: 19 * 3600,
          durationSeconds: 4500,
          rightsClearedBy: "rights-1",
          rightsRecordId: RIGHTS,
          episodeCode: "EP-TSK11",
        },
      ],
    });
    approvePreAirChain(SCHEDULE);
  }

  async function clearStore(): Promise<void> {
    _resetSchedulesForTesting();
    _resetVersionsForTesting();
    _resetRegisteredRightsIndexForTesting();
    await deleteFixtureRights([RIGHTS]);
  }

  afterEach(async () => {
    await clearStore();
  });

  it("renders the schedule grid from the approved revision, and only that (DT-405)", async () => {
    const scheduleScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-12")!;

    // Without an approved day the grid refuses to invent one.
    const empty = renderBroadcastScreenHtml(scheduleScreen, {}, "TrafficManager");
    expect(empty).toContain("NOT CONNECTED");
    expect(empty).toContain("No approved schedule revision exists");
    expect(empty).not.toContain("Sunrise Afro-Beats Top 20");

    await seedApprovedDay();
    const html = renderBroadcastScreenHtml(scheduleScreen, {}, "TrafficManager");
    expect(html).toContain("Prime Time News &amp; Culture 360");
    expect(html).toContain("19:00");
    expect(html).toContain("Approved Schedule Entries (1 slots across 1 channel days)");
    expect(html).toContain("APPROVED");
    expect(html).not.toContain("No registered rights record");
    // The fabricated day template is gone, not overwritten.
    for (const invented of ["Early Morning", "Daytime", "Rate: 2.5x", "Super Xtreme Rap Battle S3", "TERRITORY_BLOCKED"]) {
      expect(html, `invented grid content returned: ${invented}`).not.toContain(invented);
    }
  });

  it("renders the playout monitor as NOT CONNECTED without an automation adapter (DT-406)", () => {
    const playoutScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-23")!;
    const html = renderBroadcastScreenHtml(playoutScreen, {}, "PlayoutOperator");
    expect(html).toContain("No playout automation adapter is connected");
    for (const invented of ["TRANSMITTING ON AIR", "Next Event Countdown", "Force Emergency Filler", "Super Xtreme Rap Battle S3 - Ep 04"]) {
      expect(html, `invented monitor content returned: ${invented}`).not.toContain(invented);
    }
  });

  it("publishes a real digest of the approved revision instead of the empty-string hash (DT-406)", async () => {
    const lockScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-22")!;
    const none = renderBroadcastScreenHtml(lockScreen, {}, "PlayoutOperator");
    expect(none).toContain("No approved schedule revision exists");
    expect(none).not.toContain("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    await seedApprovedDay();
    const html = renderBroadcastScreenHtml(lockScreen, {}, "PlayoutOperator");
    const schedule = getSchedule(SCHEDULE)!;
    const revision = getApprovedRevision(schedule)!;
    const digest = createHash("sha256")
      .update(
        JSON.stringify(
          revision.entries.map((e) => [e.entryId, e.startSecondsFromDayStart, e.durationSeconds, e.versionId, e.episodeCode ?? null])
        )
      )
      .digest("hex");
    expect(html).toContain(digest);
    expect(html).toContain(SCHEDULE);
    expect(html).toContain("1 slots");
    expect(html).not.toContain("nxtr_ident_2026_1080i.mxf");
    expect(html).not.toContain("Gate BG6 Cleared");
  });

  it("refuses to reconcile against an as-run log it does not have (DT-406)", () => {
    const asRunScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-24")!;
    const html = renderBroadcastScreenHtml(asRunScreen, {}, "TrafficManager");
    expect(html).toContain("No as-run log is attached to this render");
    for (const invented of ["Zenith Bank Plc", "Dangote Cement", "3-WAY MATCHED", "11,554 MHz", "264 Total Spots Ingested"]) {
      expect(html, `invented reconciliation row returned: ${invented}`).not.toContain(invented);
    }
  });

  it("reports revenue only from a supplied billing snapshot, never from a literal (DT-901/DT-903)", () => {
    const yieldScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-31")!;

    const bare = renderBroadcastScreenHtml(yieldScreen, {}, "FinanceController");
    expect(bare).toContain("No commercial billing schedules are attached to this render");
    for (const invented of ["19,240,000", "94.2%", "245,000", "Daypart Commercial Yield"]) {
      expect(bare, `invented revenue figure returned: ${invented}`).not.toContain(invented);
    }

    const withEngine = renderBroadcastScreenHtml(yieldScreen, {}, "FinanceController", {
      billingTotals: [
        { campaignCode: "CMP-REAL-1", totalValueNgn: 1250000 },
        { campaignCode: "CMP-REAL-2", totalValueNgn: 750000 },
      ],
    });
    expect(withEngine).toContain("Contracted billing schedule total (engine sums, 2 campaigns)");
    expect(withEngine).toContain("CMP-REAL-1");
    expect(withEngine).toContain("2,000,000");
    expect(withEngine).toContain("Fill rate and average spot rate are NOT CONNECTED");
  });

  it("shows the EPG inspector without inventing a syndication endpoint or a published feed (DT-905)", () => {
    const epgScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-14")!;
    const html = renderBroadcastScreenHtml(epgScreen, {}, "TrafficManager");
    expect(html).toContain("Download XMLTV");
    expect(html).toContain("no syndication endpoint is configured");
    expect(html).toContain("Episode Master Linkage (DAM)");
    for (const invented of ["api.startimes.com", "Push EPG to StarTimes", "Sunrise Afro-Beats Morning Special (Draft)", "Last: 12m ago"]) {
      expect(html, `invented EPG content returned: ${invented}`).not.toContain(invented);
    }
  });

  it("projects only the engines the process holds into the served screen snapshot (TSK-11 box 6)", () => {
    expect(buildScreenEngineSnapshot({}), "an instance with no billing or sponsorship engines supplies nothing").toEqual({});

    const billingEngine = new BroadcastBillingEngine();
    billingEngine.createBillingSchedule({
      campaignCode: "CMP-SNAP-1",
      clientName: "Snapshot Client",
      brand: "Snapshot Brand",
      channelCode: "NXTR",
      spots: [
        { daypart: "PRIME_TIME", durationSeconds: 30 },
        { daypart: "PRIME_TIME", durationSeconds: 30 },
      ],
      startDate: new Date("2026-03-30T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
    });

    // hydrate() adopts bindings without staging a write, so this projection test
    // leaves no rows in the developer database.
    const sponsorshipEngine = new SponsorshipEngine();
    const binding: SponsorBinding = {
      id: "BIND-SNAP-1",
      entitlementId: "ENT-SNAP-1",
      programmeCode: "PRG-SNAP",
      daypart: "PRIME_TIME",
      assetType: "BILLBOARD",
      assetId: "AST-SNAP",
      assetDurationSeconds: 10,
      requiredPlacementsPerEpisode: 2,
      fulfilledPlacements: 0,
    };
    sponsorshipEngine.hydrate([binding], []);

    const snapshot = buildScreenEngineSnapshot({ billingEngine, sponsorshipEngine });
    expect(snapshot.billingTotals).toEqual([
      {
        campaignCode: "CMP-SNAP-1",
        totalValueNgn: billingEngine.getBillingSchedule("CMP-SNAP-1")!.totalContractValueNgn,
      },
    ]);
    expect(snapshot.sponsorshipAudit).toEqual([{ entitlementId: "ENT-SNAP-1", fulfillmentPercent: 0 }]);

    // The two panels with no source in this process stay absent, so their screens
    // render NOT_CONNECTED rather than an invented on-air or as-run state.
    expect(snapshot).not.toHaveProperty("playoutStatus");
    expect(snapshot).not.toHaveProperty("asRunSummary");
  });

  it("renders a projected entitlement on the sponsorship desk and nothing invented on playout", () => {
    const sponsorshipScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-20")!;
    const withAudit = renderBroadcastScreenHtml(sponsorshipScreen, {}, "TrafficManager", {
      sponsorshipAudit: [{ entitlementId: "ENT-SNAP-1", fulfillmentPercent: 62 }],
    });
    expect(withAudit).toContain("Entitlement ENT-SNAP-1");
    expect(withAudit).toContain("62%");
    expect(withAudit).not.toContain("No entitlements registered in the sponsorship engine");

    const bareSponsorship = renderBroadcastScreenHtml(sponsorshipScreen, {}, "TrafficManager");
    expect(bareSponsorship).toContain("No entitlements registered in the sponsorship engine");

    const playoutScreen = BROADCAST_SCREEN_INVENTORY.find((s) => s.screenId === "SCR-BCST-23")!;
    const playoutHtml = renderBroadcastScreenHtml(playoutScreen, {}, "PlayoutOperator", {
      billingTotals: [{ campaignCode: "CMP-SNAP-1", totalValueNgn: 240000 }],
    });
    expect(playoutHtml).toContain("No playout automation adapter is connected to this process");
    expect(playoutHtml).not.toContain("TRANSMITTING ON AIR");
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

  /**
   * TSK-11 box 6: the render layer has always accepted an engine snapshot, but
   * the router called it with three arguments, so every served desk printed
   * NOT_CONNECTED no matter what the process held. These tests go over HTTP on
   * one instance: the write lands in the engine the routes close over, and the
   * next GET of the desk must show it — and must still show the honest empty
   * state for the two panels that have no source.
   */
  describe("TSK-11 box 6: served desks project the engines of their own process", () => {
    let server: any;
    let baseUrl: string;

    beforeAll(async () => {
      const { createApiServer } = await import("../../src/api/server.js");
      server = createApiServer(0);
      await server.start();
      baseUrl = `http://127.0.0.1:${(server.server.address() as { port: number }).port}`;
    });

    afterAll(async () => {
      await server.stop();
    });

    it("shows a booked billing schedule on the revenue yield desk instead of an empty panel", async () => {
      const before = await fetch(`${baseUrl}/broadcast/finance/yield`, {
        headers: { "x-test-role": "FinanceController" },
      });
      expect(before.status).toBe(200);
      const beforeText = await before.text();
      expect(beforeText).toContain("No commercial billing schedules are attached to this render");
      expect(beforeText).not.toContain("19,240,000");

      const booked = await fetch(`${baseUrl}/api/v1/broadcast/billing/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
        body: JSON.stringify({
          campaignCode: "CMP-SCREENPROBE",
          clientName: "Screen Probe Foods Ltd",
          brand: "Probe",
          channelCode: "NXTR",
          spots: [
            { daypart: "PRIME_TIME", durationSeconds: 30 },
            { daypart: "PRIME_TIME", durationSeconds: 30 },
          ],
          startDate: "2026-03-30T00:00:00.000Z",
          endDate: "2026-03-31T00:00:00.000Z",
        }),
      });
      expect(booked.status).toBe(200);
      const payload = (await booked.json()) as {
        schedule: { totalContractValueNgn: number; contractedSpots: number } | null;
      };
      expect(payload.schedule, "the served billing engine must hold the booked schedule").not.toBeNull();
      expect(payload.schedule!.contractedSpots).toBe(2);
      expect(payload.schedule!.totalContractValueNgn).toBeGreaterThan(0);

      const after = await fetch(`${baseUrl}/broadcast/finance/yield`, {
        headers: { "x-test-role": "FinanceController" },
      });
      const afterText = await after.text();
      expect(afterText).toContain("CMP-SCREENPROBE");
      expect(afterText).toContain(payload.schedule!.totalContractValueNgn.toLocaleString("en-NG"));
      expect(afterText).toContain("Contracted billing schedule total (engine sums, 1 campaigns)");
      // Sourcing revenue does not license a fill rate: that panel still has no feed.
      expect(afterText).toContain("Fill rate and average spot rate are NOT CONNECTED");
      expect(afterText).not.toContain("94.2%");
    });

    it("leaves the as-run and playout desks NOT_CONNECTED over HTTP, with nothing invented", async () => {
      const asRun = await fetch(`${baseUrl}/broadcast/asrun/reconciliation`, {
        headers: { "x-test-role": "TrafficManager" },
      });
      expect(asRun.status).toBe(200);
      const asRunText = await asRun.text();
      expect(asRunText).toContain("No as-run log is attached to this render");
      for (const invented of ["3-WAY MATCHED", "264 Total Spots Ingested", "Zenith Bank Plc"]) {
        expect(asRunText, `invented reconciliation content served: ${invented}`).not.toContain(invented);
      }

      const playout = await fetch(`${baseUrl}/broadcast/playout/live`, {
        headers: { "x-test-role": "PlayoutOperator" },
      });
      expect(playout.status).toBe(200);
      const playoutText = await playout.text();
      expect(playoutText).toContain("No playout automation adapter is connected to this process");
      expect(playoutText).not.toContain("TRANSMITTING ON AIR");
    });
  });
});
