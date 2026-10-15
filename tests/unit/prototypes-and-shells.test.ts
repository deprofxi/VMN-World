/**
 * R1.1 Representative Prototypes & Presentation Shells Unit Test Suite
 * Authority: VMN APP UI UX.docx §1, §2, §5, §7, §8, §14 / CCPP §3
 */

import { describe, it, expect } from "vitest";
import {
  renderPrototypesViewerHtml,
  renderMasterLayout,
  PrototypeScreenId,
  DESIGN_TOKENS,
} from "../../src/web/index.js";

describe("R1.1 Representative Prototypes & Presentation Shells Suite", () => {
  const allScreens: PrototypeScreenId[] = [
    "home",
    "channel",
    "work",
    "client",
    "application",
    "terms",
    "schedule",
    "proof",
  ];

  it("renders all 8 first-release critical screens without errors", () => {
    for (const screen of allScreens) {
      const html = renderPrototypesViewerHtml({ screen, scenario: "normal" });
      expect(html).toContain("Representative UI/UX Prototypes");
      expect(html).toContain("VMN-UX-RL1 Resolution Prototype");

      if (screen === "home") {
        expect(html).toContain("UX-PUB-001");
        expect(html).toContain("Linear Television Channels");
        expect(html).toContain("Nigezie Xtreme");
        expect(html).toContain("Carriage details unverified");
        expect(html).not.toMatch(/Ch 42[0-9] DTT/);
        expect(html).not.toContain("3.2M+ Households");
      }
      if (screen === "channel") {
        expect(html).toContain("UX-PUB-004");
        expect(html).toContain("Nigezie Xtreme (NXTR)");
        expect(html).toContain("Public Broadcast Schedule Notice");
      }
      if (screen === "work") {
        expect(html).toContain("UX-HUB-001");
        expect(html).toContain("Workstation Rail");
        expect(html).toContain("Priority Blocker Tray");
      }
      if (screen === "client") {
        expect(html).toContain("UX-PRJ-002");
        expect(html).toContain("Counterparty Sponsor Portal");
        expect(html).toContain("Illustrative prototype data only");
        expect(html).toContain("not a client commitment");
      }
      if (screen === "application") {
        expect(html).toContain("UX-APP-002");
        expect(html).toContain("AFCA Creative Academy Application");
        expect(html).toContain("Personal Statement &amp; Creative Goal");
      }
      if (screen === "terms") {
        expect(html).toContain("UX-VTM-008");
        expect(html).toContain("Talent Engagement Agreement");
        expect(html).toContain("Financial Remuneration &amp; Deductions");
        // Verify economics precedes acceptance (§14.1)
        const economicsIdx = html.indexOf("Financial Remuneration");
        const acceptanceIdx = html.indexOf("Prototype only — acceptance unavailable");
        expect(economicsIdx).toBeGreaterThan(-1);
        expect(acceptanceIdx).toBeGreaterThan(economicsIdx);
      }
      if (screen === "schedule") {
        expect(html).toContain("UX-BR-012");
        expect(html).toContain("Broadcast Schedule Review");
        expect(html).toContain("No operational export attached");
      }
      if (screen === "proof") {
        expect(html).toContain("UX-BR-030");
        expect(html).toContain("Proof-of-Air Delivery Reconciliation");
        expect(html).toContain("Illustrative Pre-emption Scenario");
      }
    }
  });

  it("verifies operational scenario modes (normal, stale, blocked, recovery)", () => {
    // Stale mode
    const staleHtml = renderPrototypesViewerHtml({ screen: "home", scenario: "stale" });
    expect(staleHtml).toContain("STALE DATA NOTICE");

    // Blocked mode
    const blockedHtml = renderPrototypesViewerHtml({ screen: "schedule", scenario: "blocked" });
    expect(blockedHtml).toContain("Illustrative rights block");
    expect(blockedHtml).toContain("This simulated scenario does not represent a production transmission or rights decision.");

    // Recovery mode
    const recoveryHtml = renderPrototypesViewerHtml({ screen: "application", scenario: "recovery" });
    expect(recoveryHtml).toContain("Illustrative recovery scenario");
    expect(recoveryHtml).toContain("no durable acceptance or canonical application record");
    expect(recoveryHtml).not.toContain("Application Submission Recovered Successfully");
  });

  it("verifies the Three Presentation Shells (S-PUBLIC, S-WORK, S-PORTAL)", () => {
    // 1. Public Shell
    const publicLayout = renderMasterLayout("Public Page", "<div>Public Body</div>", "/", { shell: "public" });
    expect(publicLayout).toContain("vmn-shell-public");
    expect(publicLayout).toContain("Public Body");

    // 2. Work Shell
    const workLayout = renderMasterLayout("Workspace", "<div>Operator Body</div>", "/workspace", {
      shell: "work",
      operatorRole: "MCR Director",
    });
    expect(workLayout).toContain("vmn-shell-work-layout");
    expect(workLayout).toContain("vmn-work-rail");
    expect(workLayout).toContain("MCR Director");
    expect(workLayout).toContain("Operator Body");

    // 3. Portal Shell
    const portalLayout = renderMasterLayout("Client Portal", "<div>Portal Body</div>", "/portal/client", {
      shell: "portal",
      counterpartyName: "Guaranty Trust Bank",
      projectName: "Q3 Campaign",
    });
    expect(portalLayout).toContain("vmn-shell-portal");
    expect(portalLayout).toContain("vmn-portal-banner");
    expect(portalLayout).toContain("Guaranty Trust Bank");
    expect(portalLayout).toContain("Q3 Campaign");
    expect(portalLayout).toContain("Portal Body");
  });

  it("verifies primary brand palette is the R1.1 resolved deep forest green (#174C3C)", () => {
    expect(DESIGN_TOKENS.colors.primary).toBe("#174C3C");
    expect(DESIGN_TOKENS.colors.secondary).toBe("#172434");
    expect(DESIGN_TOKENS.colors.canvas).toBe("#F3F5F7");
    expect(DESIGN_TOKENS.spacing.sidebarWidth).toBe("188px");
    expect(DESIGN_TOKENS.radii.control).toBe("8px");
    expect(DESIGN_TOKENS.radii.panel).toBe("10px");
  });
});
