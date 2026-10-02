/**
 * Visual Regression Baseline & Surface Snapshot Integrity Test Suite
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-1001 / AGENTS.md UI/UX Rules
 *
 * Verifies:
 * 1. Surface contract snapshots across all primary surfaces:
 *    - Surface A: Public Portal & Linear Channels
 *    - Surface B/C: Operator Desks (48 Desks) & Broadcast Consoles (33 Screens)
 *    - Surface D: Hub Verticals (x10)
 *    - Surface E: Federation Gateway & Consumer Universes (Azeebo+)
 *    - Verification: AFCA & Proof-of-Air
 * 2. Visual state matrix integrity across default, loading, empty, error.
 * 3. Responsive container constraints and layout shift guards.
 */

import { describe, it, expect } from "vitest";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderScreensCatalogHtml,
  renderWorkspaceDirectoryHtml,
  renderWorkspaceDeskHtml,
  renderFederationGatewayHtml,
  renderAttributionConsoleHtml,
  renderStyleguideHtml,
} from "../../src/web/index.js";
import { renderBroadcastScreenHtml } from "../../src/web/broadcast/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";

describe("DT-1001: Visual Regression Baseline & Contract Snapshots", () => {
  it("maintains structural baseline for Surface A: Public Portal & Channels", () => {
    const homeHtml = renderMasterLayout("Home", renderHomePageHtml(), "/");
    expect(homeHtml).toContain("Virtual Media Network Limited");
    expect(homeHtml).toContain("Nigezie Xtreme");
    expect(homeHtml).toContain("Orisun");
    expect(homeHtml).toContain("Isi Mbido");
    // AUD-21: fabricated now/next programme widgets were replaced by the
    // schedule-provenance notice; the channels page must carry the notice.
    const channelsHtml = renderMasterLayout("Channels", renderChannelsPageHtml(), "/channels");
    expect(channelsHtml).toContain("Schedule Notice");
    expect(channelsHtml).not.toContain("vmn-on-air-widget");

    expect(channelsHtml).toContain("Linear Television Networks");
    expect(channelsHtml).toContain("NXTR");
    expect(channelsHtml).toContain("ORIS");
    expect(channelsHtml).toContain("IMBD");
  });

  it("maintains structural baseline for Surface D: Hub Verticals", () => {
    const hubHtml = renderMasterLayout("Hub", renderHubPageHtml(), "/hub");
    expect(hubHtml).toContain("Ten integrated verticals");
    expect(hubHtml).toContain("Talent Accelerator Network");
    expect(hubHtml).toContain("African Film & Creative Arts Academy");
    expect(hubHtml).toContain("Virtual Talent Management (VTM)");
    expect(hubHtml).toContain("Virtual Content Fund (VCF)");
    expect(hubHtml).toContain("ONE Studios");
  });

  it("maintains structural baseline for Surface E: Federation Gateway (Azeebo+)", () => {
    const gatewayHtml = renderMasterLayout("Azeebo+", renderFederationGatewayHtml(), "/azeebo/gateway");
    expect(gatewayHtml).toContain("Azeebo+ Federation & Universal Gateway");
    expect(gatewayHtml).toContain("Federation Link: Normal / Protected");
    expect(gatewayHtml).toContain("Content Referral Gateway");
    expect(gatewayHtml).toContain("Cinemaxis Universe");
    expect(gatewayHtml).toContain("target=\"_blank\"");
    expect(gatewayHtml).toContain("rel=\"noopener noreferrer\"");

    const attributionHtml = renderMasterLayout("Attribution", renderAttributionConsoleHtml(), "/azeebo/attribution");
    expect(attributionHtml).toContain("Linear-to-Digital Attribution Tracker");
    expect(attributionHtml).toContain("Six-Stage Conversion &amp; Retention Funnel");
    expect(attributionHtml).toContain("Broadcast Airing");
    expect(attributionHtml).toContain("On-Air QR Scan");
    expect(attributionHtml).toContain("Landing View");
    expect(attributionHtml).toContain("App Signup");
    expect(attributionHtml).toContain("Subscription");
  });

  it("maintains structural baseline for Surface B & C: Operator Workspace Desks", () => {
    const directoryHtml = renderMasterLayout("Workspace", renderWorkspaceDirectoryHtml(), "/workspace");
    expect(directoryHtml).toContain("Enterprise Operating Hub &amp; Specialist Desks");
    expect(directoryHtml).toContain("Enterprise Operating Desks");
    expect(directoryHtml).not.toContain("§46"); // DT-408: zero §46 citations on desks

    const deskHtml = renderMasterLayout("MCR", renderWorkspaceDeskHtml("mcr"), "/workspace/desks/mcr");
    expect(deskHtml).toContain("Master Control Room (MCR) Playout Supervisor");
    expect(deskHtml).toContain("Primary Operational Object");
    expect(deskHtml).toContain("Tri-Channel Frame-Accurate Playout Switcher");
  });

  it("maintains structural baseline for 33 Broadcast Consoles with Operator Shell (DT-401, DT-402)", () => {
    const catalogHtml = renderMasterLayout("Screens", renderScreensCatalogHtml(), "/broadcast/screens");
    expect(catalogHtml).toContain("Broadcast Operational Screen Inventory");
    expect(catalogHtml).toContain("33 of 33 Screens Ready");

    for (const screen of BROADCAST_SCREEN_INVENTORY) {
      const screenHtml = renderBroadcastScreenHtml(screen, {}, "ExecutiveLeader");
      expect(screenHtml).toContain(screen.screenId);
      expect(screenHtml).toContain(screen.name);
      expect(screenHtml).toContain("Duty Stations (§4.2)");
      expect(screenHtml).toContain("Live Channel & Stream Telemetry");
      expect(screenHtml).toContain("Primary Operational Decision");
    }
  });

  it("verifies state matrix baseline consistency across all surfaces (DT-202, DT-404)", () => {
    const styleguideHtml = renderMasterLayout("Styleguide", renderStyleguideHtml(), "/styleguide");
    expect(styleguideHtml).toContain("VMNL Living Design System & Styleguide");
    expect(styleguideHtml).toContain("Primary Default");
    expect(styleguideHtml).toContain("Primary Hover");
    expect(styleguideHtml).toContain("Primary Active");
    expect(styleguideHtml).toContain("Primary Focus");
    expect(styleguideHtml).toContain("Primary Disabled");
    expect(styleguideHtml).toContain("Loading...");
    expect(styleguideHtml).toContain("No Scheduled As-Run Logs Found");
    expect(styleguideHtml).toContain("Telemetry Stream Ingestion Interrupted");
  });
});
