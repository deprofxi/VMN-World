/**
 * Verification for Enterprise Operating Desks (48 Desks) & Navigation Menus
 * Authority: VMNL-AZP-VMN-CCPP-001 (§8–§25)
 */

import { describe, expect, it } from "vitest";
import { ENTERPRISE_WORKSPACES, renderWorkspaceDeskHtml } from "../../src/web/workspace/surface-bc.js";
import { renderDeskCockpitHtml } from "../../src/web/workspace/cockpits.js";
import { renderMasterLayout } from "../../src/web/public/dashboard.js";

describe("Enterprise Workspaces: All 48 Desks Verification", () => {
  it("registers exactly 48 enterprise workspaces across the 4 pillars", () => {
    expect(ENTERPRISE_WORKSPACES).toHaveLength(48);
  });

  it("every desk produces a populated, high-contrast operational cockpit", () => {
    for (const desk of ENTERPRISE_WORKSPACES) {
      const html = renderDeskCockpitHtml(desk.key);
      expect(html, `Desk cockpit for '${desk.key}' is empty`).toBeTruthy();
      expect(html.length, `Desk cockpit for '${desk.key}' is too short`).toBeGreaterThan(150);
      expect(html).toContain("card");
      expect(html).not.toContain(">Ready<");
      expect(html).not.toContain("LIVE OPERATING");
    }
  });

  it("every desk shell integrates its dedicated cockpit inside Tab 1", () => {
    for (const desk of ENTERPRISE_WORKSPACES) {
      const shellHtml = renderWorkspaceDeskHtml(desk.key);
      expect(shellHtml).toContain("Desk Operating State");
      expect(shellHtml).toContain("tab-cockpit");
      expect(shellHtml).toContain("tab-workflows");
      expect(shellHtml).toContain("tab-governance");
      expect(shellHtml).toContain("Declared Core Workflows");
    }
  });
});

describe("Navigation Overhaul: Workstation Rail & Header Menus", () => {
  it("renders the 6-cluster workstation rail when shell is work", () => {
    const layout = renderMasterLayout("Test Workstation", "<div>Content</div>", "/workspace", {
      shell: "work",
      operatorRole: "MCR Supervisor",
      sessionUser: {
        userId: "usr-op-1",
        personId: "per-op-1",
        email: "operator@vmnl.ng",
        roles: ["MCRSupervisor"],
      },
    });

    expect(layout).toContain('class="vmn-work-rail"');
    expect(layout).toContain("Operations &amp; Hub");
    expect(layout).toContain("Linear &amp; MCR Playout");
    expect(layout).toContain("Commercial &amp; Sales");
    expect(layout).toContain("Finance &amp; Settlement");
    expect(layout).toContain("Creative Hub &amp; Academy");
    expect(layout).toContain("Governance &amp; IAM");
    expect(layout).toContain("MCR Workstation Rail");
    expect(layout).toContain("Active Operator");
    expect(layout).toContain("MCR Supervisor");
    expect(layout).toContain("Gate: Locked &bull; Supervised");
  });

  it("renders the Desks (48) mega-menu dropdown in header controls", () => {
    const layout = renderMasterLayout("Test Page", "<div>Content</div>", "/");
    expect(layout).toContain('id="vmn-desks-dropdown"');
    expect(layout).toContain('id="vmn-desks-trigger"');
    expect(layout).toContain("Desks (48)");
    expect(layout).toContain('id="vmn-desks-menu"');
    expect(layout).toContain("Enterprise Operating Desks");
    expect(layout).toContain("Pillar 1");
    expect(layout).toContain("Pillar 2");
    expect(layout).toContain("Pillar 3");
    expect(layout).toContain("Pillar 4");

    for (const desk of ENTERPRISE_WORKSPACES) {
      expect(layout).toContain(`href="/workspace/${desk.key}"`);
    }
  });
});
