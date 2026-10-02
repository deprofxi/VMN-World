/**
 * VMN UI/UX R1.1 Representative Desktop & Mobile Prototypes Viewer
 * Authority: VMN APP UI UX.docx §1, §3, §7, §8, §14 / VMN UI UX CLAUDE CODE PROMPTS .docx §3
 *
 * Implements the 8 First-Release Critical Screens with interactive scenario controls:
 * 1. UX-PUB-001: Public Discovery & Home
 * 2. UX-PUB-004: Linear Channel Page (Nigezie Xtreme)
 * 3. UX-HUB-001: My Work Queue (Operator Workbench)
 * 4. UX-PRJ-002 / UX-POR-001: Client Project & Delivery Proof
 * 5. UX-APP-002-004: Learner Application (AFCA Creative Academy)
 * 6. UX-VTM-008-010: Talent Engagement Terms & Acceptance
 * 7. UX-BR-012: Broadcast Schedule Review
 * 8. UX-BR-030 / UX-GOV-006: Delivery Evidence & Proof-of-Air
 *
 * Scenarios:
 * - normal: standard verified production state
 * - stale: source data timestamp aged, operations blocked
 * - blocked: rights/compliance blocker requiring intervention
 * - recovery: recovery of interrupted or unknown outcome
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";

export type PrototypeScreenId =
  | "home"
  | "channel"
  | "work"
  | "client"
  | "application"
  | "terms"
  | "schedule"
  | "proof";

export type PrototypeScenario = "normal" | "stale" | "blocked" | "recovery";
export type PrototypeDevice = "desktop" | "tablet" | "mobile" | "compact";

export interface PrototypeViewOptions {
  screen?: PrototypeScreenId;
  scenario?: PrototypeScenario;
  device?: PrototypeDevice;
}

export function renderPrototypesViewerHtml(options: PrototypeViewOptions = {}): string {
  const currentScreen = options.screen || "home";
  const currentScenario = options.scenario || "normal";
  const currentDevice = options.device || "desktop";

  const screens: Array<{ id: PrototypeScreenId; name: string; code: string }> = [
    { id: "home", name: "Public Discovery", code: "UX-PUB-001" },
    { id: "channel", name: "Linear Channel", code: "UX-PUB-004" },
    { id: "work", name: "My Work Queue", code: "UX-HUB-001" },
    { id: "client", name: "Client Delivery Proof", code: "UX-PRJ-002" },
    { id: "application", name: "Learner Application", code: "UX-APP-002" },
    { id: "terms", name: "Engagement Terms", code: "UX-VTM-008" },
    { id: "schedule", name: "Schedule Review", code: "UX-BR-012" },
    { id: "proof", name: "Delivery Evidence", code: "UX-BR-030" },
  ];

  const scenarios: Array<{ id: PrototypeScenario; label: string; desc: string }> = [
    { id: "normal", label: "Normal", desc: "Authoritative verified baseline" },
    { id: "stale", label: "Stale Data", desc: "Aged source data (>1 hr) with disabled mutations" },
    { id: "blocked", label: "Blocked State", desc: "Active rights / compliance blocker" },
    { id: "recovery", label: "Recovery Drill", desc: "Recover unknown submission without duplicate" },
  ];

  const devices: Array<{ id: PrototypeDevice; label: string; width: string }> = [
    { id: "desktop", label: "Desktop (100%)", width: "100%" },
    { id: "tablet", label: "Tablet (768px)", width: "768px" },
    { id: "mobile", label: "Mobile (390px)", width: "390px" },
    { id: "compact", label: "Compact (320px)", width: "320px" },
  ];

  // Screen selection tabs
  const screenNavHtml = screens
    .map((s) => {
      const active = s.id === currentScreen ? "active" : "";
      return `<a href="/prototypes?screen=${s.id}&scenario=${currentScenario}&device=${currentDevice}" class="vmn-btn vmn-btn-outline ${active}" style="min-height: 40px; padding: 6px 12px; font-size: 0.85rem;">
        <span>${escapeHtml(s.name)}</span>
        <span style="font-size: 0.7rem; opacity: 0.75; font-family: var(--vmn-font-mono);">${s.code}</span>
      </a>`;
    })
    .join(" ");

  // Scenario toggle buttons
  const scenarioNavHtml = scenarios
    .map((sc) => {
      const active = sc.id === currentScenario ? "active" : "";
      return `<a href="/prototypes?screen=${currentScreen}&scenario=${sc.id}&device=${currentDevice}" class="vmn-scenario-btn ${active}" title="${escapeHtml(sc.desc)}">
        ${renderIcon(sc.id === "normal" ? "check" : sc.id === "stale" ? "clock" : sc.id === "blocked" ? "alert" : "refresh", { size: 14 })}
        <span>${escapeHtml(sc.label)}</span>
      </a>`;
    })
    .join(" ");

  // Device switcher
  const deviceNavHtml = devices
    .map((d) => {
      const active = d.id === currentDevice ? "active" : "";
      return `<a href="/prototypes?screen=${currentScreen}&scenario=${currentScenario}&device=${d.id}" class="vmn-device-btn ${active}">
        <span>${escapeHtml(d.label)}</span>
      </a>`;
    })
    .join(" ");

  // Render individual screen body
  const screenContentHtml = renderScreenContent(currentScreen, currentScenario);

  const stageClass = `vmn-preview-stage vmn-stage-${currentDevice}`;

  return `
    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px;">VMN-UX-RL1 Resolution Prototype</span>
          <h1 style="font-size: var(--vmn-font-size-page-title); margin: 4px 0 8px 0; font-weight: 800;">
            Representative UI/UX Prototypes
          </h1>
          <p style="color: var(--vmn-color-text-muted); font-size: 0.95rem; margin: 0; max-width: 800px;">
            Inspecting the 8 First-Release resolution screens under desktop, tablet, and mobile viewports with simulated operational scenarios (Authority: <code>VMN APP UI UX.docx</code> §1, §7, §8, §14).
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/styleguide" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem;">Living Styleguide</a>
          <a href="/" class="btn btn-primary" style="min-height: 40px; font-size: 0.85rem;">Live App Overview</a>
        </div>
      </div>

      <!-- Screen Selector Bar -->
      <nav class="card" aria-label="Prototype Screen Selector" style="padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: var(--vmn-surface);">
        <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--vmn-color-text-muted); margin-right: 4px;">Screen:</span>
        ${screenNavHtml}
      </nav>

      <!-- Scenario & Viewport Control Toolbar -->
      <div class="vmn-prototype-toolbar">
        <div class="vmn-scenario-group">
          <span class="vmn-scenario-label">Scenario:</span>
          ${scenarioNavHtml}
        </div>
        <div class="vmn-viewport-group">
          <span class="vmn-scenario-label">Viewport:</span>
          ${deviceNavHtml}
        </div>
      </div>
    </div>

    <!-- Interactive Preview Stage -->
    <div style="background: #E2E8F0; padding: 24px 16px; border-radius: var(--vmn-radius-panel); box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
      <div class="${stageClass}">
        ${screenContentHtml}
      </div>
    </div>
  `;
}

function renderScreenContent(screen: PrototypeScreenId, scenario: PrototypeScenario): string {
  switch (screen) {
    case "home":
      return renderScreenHome(scenario);
    case "channel":
      return renderScreenChannel(scenario);
    case "work":
      return renderScreenWork(scenario);
    case "client":
      return renderScreenClient(scenario);
    case "application":
      return renderScreenApplication(scenario);
    case "terms":
      return renderScreenTerms(scenario);
    case "schedule":
      return renderScreenSchedule(scenario);
    case "proof":
      return renderScreenProof(scenario);
    default:
      return renderScreenHome(scenario);
  }
}

/**
 * 1. UX-PUB-001: Public Discovery & Home
 */
function renderScreenHome(scenario: PrototypeScenario): string {
  const isStale = scenario === "stale";
  return `
    <div class="card vmn-shell-public" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      ${isStale ? renderStaleNotice("Broadcast schedule last synced 2 hours ago. Live TV playout continues uninterrupted.") : ""}
      
      <!-- 1. Hero Proposition -->
      <div class="vmn-public-hero" style="border-radius: var(--vmn-radius-panel); padding: 36px 28px;">
        <span class="vmn-badge badge-ready" style="margin-bottom: 12px; background: rgba(255,255,255,0.15); color: #FFFFFF; border-color: rgba(255,255,255,0.3);">
          Broadcasting &amp; Creative Economy Ecosystem
        </span>
        <h1 style="font-size: var(--vmn-font-size-hero-compact); font-weight: 800; margin-bottom: 12px;">
          Powering the African Creative Economy
        </h1>
        <p style="font-size: 1.1rem; line-height: 1.5; color: #E2E8F0; max-width: 680px; margin-bottom: 24px;">
          Virtual Media Network Limited operates 24/7 linear television channels on StarTimes, turnkey production infrastructure for African creators, and the direct-to-consumer Azeebo+ digital universe.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="/channels" class="btn" style="background: #A5E8CD; color: #0E2B20; font-weight: 700;">Explore Channels</a>
          <a href="/apply" class="btn btn-outline" style="color: #FFFFFF; border-color: rgba(255,255,255,0.4);">Apply to AFCA Academy</a>
          <a href="/contact" class="btn btn-outline" style="color: #FFFFFF; border-color: rgba(255,255,255,0.4);">Commercial Enquiry</a>
        </div>
      </div>

      <!-- 2. Television Portfolio -->
      <section style="margin-top: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
          <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin: 0;">Linear Television Channels</h2>
          <span style="font-size: 0.85rem; color: var(--vmn-color-text-muted);">Broadcast via StarTimes DTT / DTH</span>
        </div>
        <div class="grid grid-cols-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div class="card" style="border-top: 4px solid #E50914;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="vmn-badge badge-live">Live</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 428 DTT / 256 DTH</span>
            </div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem;">Nigezie Xtreme</h3>
            <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin-bottom: 12px;">Nigeria's premier 24/7 urban music, youth lifestyle and culture channel.</p>
            <a href="/prototypes?screen=channel" class="btn btn-outline" style="width: 100%; font-size: 0.85rem;">Channel Details &rarr;</a>
          </div>

          <div class="card" style="border-top: 4px solid #FFB800;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="vmn-badge badge-live">Live</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 430 DTT / 477 DTH</span>
            </div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem;">Orisun — The Source</h3>
            <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin-bottom: 12px;">Rich Yoruba culture, cinema, music, folklore, and heritage programming.</p>
            <a href="/channels/oris" class="btn btn-outline" style="width: 100%; font-size: 0.85rem;">Channel Details &rarr;</a>
          </div>

          <div class="card" style="border-top: 4px solid #0369A1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="vmn-badge badge-live">Live</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 432 DTT / 480 DTH</span>
            </div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem;">Isi Mbido — The Beginning</h3>
            <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin-bottom: 12px;">Igbo language, customs, traditional drama, and authentic storytelling.</p>
            <a href="/channels/imbd" class="btn btn-outline" style="width: 100%; font-size: 0.85rem;">Channel Details &rarr;</a>
          </div>
        </div>
      </section>

      <!-- 3. Azeebo+ Gateway Banner -->
      <section class="vmn-azeebo-gateway-banner">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px;">Federated Consumer Gateway</span>
          <h3 style="margin: 0 0 6px 0; font-size: 1.25rem;">Azeebo+ Streaming &amp; Digital Experience</h3>
          <p style="font-size: 0.9rem; color: var(--vmn-color-text-muted); margin: 0; max-width: 600px;">
            Stream full episodes, backstage masterclasses, and music specials direct to consumer.
          </p>
        </div>
        <a href="/azeebo/gateway" class="btn btn-primary" style="min-height: 44px; white-space: nowrap;">
          Launch Azeebo+ Universe &rarr;
        </a>
      </section>
    </div>
  `;
}

/**
 * 2. UX-PUB-004: Linear Channel Page (Nigezie Xtreme)
 */
function renderScreenChannel(scenario: PrototypeScenario): string {
  const isStale = scenario === "stale";
  return `
    <div class="card" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      ${isStale ? renderStaleNotice("Transmission guide sync delayed. Live StarTimes playout operational.") : ""}

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--vmn-color-border);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="vmn-badge badge-live">Live On Air</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--vmn-color-text-muted);">StarTimes Ch 428 DTT / 256 DTH</span>
          </div>
          <h1 style="font-size: var(--vmn-font-size-page-title); margin: 0; font-weight: 800; color: #E50914;">
            Nigezie Xtreme (NXTR)
          </h1>
          <p style="font-size: 0.95rem; color: var(--vmn-color-text-muted); margin: 4px 0 0 0;">
            The Definitive Pulse of Urban Music &amp; African Youth Culture
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/advertising" class="btn btn-primary">Book Commercial Airtime</a>
          <a href="/contact" class="btn btn-outline">Enquiry</a>
        </div>
      </div>

      <!-- Channel Technical Slate -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div class="stat-box"><span class="stat-lbl">Video Standard</span><strong>1080i50 HD</strong></div>
        <div class="stat-box"><span class="stat-lbl">Audio Target</span><strong>EBU R128 (-23 LUFS)</strong></div>
        <div class="stat-box"><span class="stat-lbl">Broadcast Reach</span><strong>3.2M+ Households</strong></div>
        <div class="stat-box"><span class="stat-lbl">Uplink Station</span><strong>Lagos Hub / Eutelsat 16A</strong></div>
      </div>

      <!-- Schedule Notice - No Fake Now/Next (Authority Rule §8.2) -->
      <div class="card" role="note" style="background: var(--vmn-surface-accent); border: 1px solid #86EFAC; padding: 16px 20px; border-radius: var(--vmn-radius-md);">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--vmn-color-primary); margin-bottom: 6px;">
          ${renderIcon("broadcast", { size: 16 })}
          <span>Public Broadcast Schedule Notice</span>
        </div>
        <p style="font-size: 0.9rem; margin: 0; color: var(--vmn-color-text-main);">
          Linear schedule data is synchronized directly from the Master Control Room automation playout engine. 
          View our verified 24-hour programme lineup in the operator schedule console.
        </p>
        <div style="margin-top: 12px;">
          <a href="/prototypes?screen=schedule" class="btn btn-outline" style="font-size: 0.85rem; padding: 6px 14px; min-height: 40px;">
            Inspect Live Schedule Console &rarr;
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. UX-HUB-001: My Work Queue (Operator Workbench)
 */
function renderScreenWork(scenario: PrototypeScenario): string {
  const isBlocked = scenario === "blocked";
  return `
    <div class="vmn-shell-work-layout">
      <!-- 188px Operator Rail -->
      <aside class="vmn-work-rail">
        <div class="vmn-work-rail-title">Workstation Rail</div>
        <a href="#inbox" class="vmn-work-rail-link active">
          ${renderIcon("check", { size: 14 })}
          <span>Assigned Tasks</span>
        </a>
        <a href="#blockers" class="vmn-work-rail-link">
          ${renderIcon("alert", { size: 14 })}
          <span>Blocker Tray (2)</span>
        </a>
        <a href="#decisions" class="vmn-work-rail-link">
          ${renderIcon("clock", { size: 14 })}
          <span>Pending Sign-Off</span>
        </a>
        <a href="/broadcast/screens" class="vmn-work-rail-link">
          ${renderIcon("broadcast", { size: 14 })}
          <span>Consoles Catalog</span>
        </a>
        <div class="vmn-work-rail-title" style="margin-top: 16px;">Operator</div>
        <div style="padding: 6px 12px; font-size: 0.8rem; color: var(--vmn-color-text-muted);">
          <strong>D. Adeyemi</strong><br>
          <span style="font-size: 0.75rem;">MCR Traffic Director</span>
        </div>
      </aside>

      <!-- Main Workbench Work Area -->
      <div class="vmn-work-main">
        <!-- Priority 1 Blocker Tray (§8.5 Mandatory Order) -->
        <div class="vmn-blocker-tray" ${isBlocked ? 'style="border-color: #EF4444; background: #FEF2F2;"' : ""}>
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Priority Blocker Tray &mdash; ${isBlocked ? "CRITICAL BLOCKER ACTIVE" : "Immediate Action Required"}</span>
          </div>
          <div class="vmn-blocker-item">
            <div>
              <strong>NXTR-BLK-049: Missing Rights Clearance for Filler Segment #4102</strong><br>
              <span style="font-size: 0.8rem; color: var(--vmn-color-text-muted);">Scheduled 21:45 UTC &bull; Origin: External Syndication Partner</span>
            </div>
            <a href="/prototypes?screen=schedule&scenario=blocked" class="btn btn-outline" style="font-size: 0.8rem; padding: 4px 10px; min-height: 36px;">Review Rights</a>
          </div>
          <div class="vmn-blocker-item">
            <div>
              <strong>REC-GTCO-881: Unreconciled 30s Airtime Spot Discrepancy</strong><br>
              <span style="font-size: 0.8rem; color: var(--vmn-color-text-muted);">As-run timestamp mismatch +42s &bull; StarTimes Eutelsat feed</span>
            </div>
            <a href="/prototypes?screen=proof" class="btn btn-outline" style="font-size: 0.8rem; padding: 4px 10px; min-height: 36px;">Reconcile Spot</a>
          </div>
        </div>

        <!-- 1.6:1 Split Work Items & Detail Pane -->
        <div class="vmn-split-16-1">
          <!-- Primary Task Column -->
          <div class="card" style="background: var(--vmn-surface);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h2 style="font-size: var(--vmn-font-size-heading); margin: 0; font-weight: 800;">Assigned Work Queue</h2>
              <span class="vmn-badge badge-info">4 Active Tasks</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div class="card" style="padding: 14px; border-left: 4px solid var(--vmn-color-primary); background: var(--vmn-surface-alt);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-weight: 700;">AFCA-REV-2026-092 &bull; Cohort Application</span>
                  <span class="vmn-badge badge-warning">Awaiting Review</span>
                </div>
                <p style="font-size: 0.85rem; margin: 0 0 8px 0; color: var(--vmn-color-text-muted);">Applicant: T. Oladipo &bull; Directing &amp; Cinematography Track</p>
                <a href="/prototypes?screen=application" class="btn btn-outline" style="font-size: 0.8rem; padding: 4px 10px; min-height: 36px;">Open Candidate Dossier</a>
              </div>

              <div class="card" style="padding: 14px; border-left: 4px solid #1655BC; background: var(--vmn-surface-alt);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-weight: 700;">VTM-ENG-088 &bull; Talent Acceptance</span>
                  <span class="vmn-badge badge-ready">Terms Sent</span>
                </div>
                <p style="font-size: 0.85rem; margin: 0 0 8px 0; color: var(--vmn-color-text-muted);">Talent: K. Balogun &bull; Sound Design Contract for ONE Studios</p>
                <a href="/prototypes?screen=terms" class="btn btn-outline" style="font-size: 0.8rem; padding: 4px 10px; min-height: 36px;">Review Agreement</a>
              </div>
            </div>
          </div>

          <!-- Quick Context / Info Rail -->
          <div class="card" style="background: var(--vmn-surface-accent); border: 1px solid #86EFAC;">
            <h3 style="font-size: 1rem; margin: 0 0 10px 0; font-weight: 800; color: var(--vmn-color-primary);">Operator Context</h3>
            <p style="font-size: 0.85rem; color: var(--vmn-color-text-main); line-height: 1.5; margin-bottom: 12px;">
              Active Shift: 18:00 &ndash; 02:00 UTC<br>
              Playout Engine: Master Automation v3.2<br>
              Transmission Gate: ${isBlocked ? '<span style="color: #DC2626; font-weight: 700;">Blocked (Red)</span>' : '<span style="color: var(--vmn-color-primary); font-weight: 700;">Locked (Green)</span>'}
            </p>
            <div style="font-size: 0.8rem; color: var(--vmn-color-text-muted); border-top: 1px dashed #CBD5E1; padding-top: 8px;">
              All actions logged to immutable SHA-256 audit ledger.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 4. UX-PRJ-002 / UX-POR-001: Client Project & Delivery Proof
 */
function renderScreenClient(scenario: PrototypeScenario): string {
  const isStale = scenario === "stale";
  return `
    <div class="vmn-shell-portal">
      ${isStale ? renderStaleNotice("Client proof telemetry awaiting final StarTimes daily ingest reconciliation.") : ""}
      <!-- Counterparty Banner -->
      <div class="vmn-portal-banner">
        <div>
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-color-text-muted); font-weight: 700;">
            Counterparty Sponsor Portal
          </div>
          <div class="vmn-portal-counterparty">Guaranty Trust Bank (GTCO Plc)</div>
          <div style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin-top: 2px;">
            Campaign Contract Ref: <strong>GTCO-NXTR-2026-Q3-019</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="vmn-report-released-badge">Audited Release</span>
          <span class="vmn-badge badge-ready">Contract Active</span>
        </div>
      </div>

      <!-- Scope & Commitments Summary -->
      <div class="card" style="background: var(--vmn-surface); margin-bottom: 24px;">
        <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin-top: 0;">Approved Campaign Deliverables</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div class="stat-box"><span class="stat-lbl">Contracted Spots</span><strong>120 Total Airings</strong></div>
          <div class="stat-box"><span class="stat-lbl">Delivered &amp; Audited</span><strong style="color: var(--vmn-color-primary);">118 Verified Spots</strong></div>
          <div class="stat-box"><span class="stat-lbl">Make-Good Scheduled</span><strong>2 Rescheduled Spots</strong></div>
          <div class="stat-box"><span class="stat-lbl">Compliance Score</span><strong>98.33% Verified</strong></div>
        </div>
      </div>

      <!-- Controlled Proof Report: Released vs Draft Preview Distinction (§14.1) -->
      <div class="card" style="background: var(--vmn-surface); border: 1px solid var(--vmn-color-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <span class="vmn-report-released-badge">Official Released Proof of Air</span>
            <h3 style="margin: 6px 0 2px 0; font-size: 1.15rem;">Broadcast Transmission Log Certification</h3>
            <span style="font-size: 0.8rem; color: var(--vmn-color-text-muted);">Released by Head of Broadcast Operations on 2026-09-29 &bull; SHA-256 Verified</span>
          </div>
          <button type="button" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem;">Download Signed PDF</button>
        </div>

        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; font-size: 0.85rem;">
            <thead>
              <tr>
                <th>Spot ID</th>
                <th>Channel</th>
                <th>Scheduled UTC</th>
                <th>Actual Transmission</th>
                <th>Variance</th>
                <th>StarTimes Transponder</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GTCO-NX-001</code></td>
                <td>Nigezie Xtreme</td>
                <td>14:30:00</td>
                <td>14:30:02</td>
                <td>+2s</td>
                <td>11.014 GHz (DTT)</td>
                <td><span class="asrun-diff-badge asrun-diff-matched">Matched 100%</span></td>
              </tr>
              <tr>
                <td><code>GTCO-NX-002</code></td>
                <td>Nigezie Xtreme</td>
                <td>17:15:00</td>
                <td>17:15:00</td>
                <td>0s</td>
                <td>11.014 GHz (DTT)</td>
                <td><span class="asrun-diff-badge asrun-diff-matched">Matched 100%</span></td>
              </tr>
              <tr>
                <td><code>GTCO-OR-003</code></td>
                <td>Orisun TV</td>
                <td>20:00:00</td>
                <td>20:00:05</td>
                <td>+5s</td>
                <td>11.014 GHz (DTH)</td>
                <td><span class="asrun-diff-badge asrun-diff-matched">Matched 100%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * 5. UX-APP-002-004: Learner Application (AFCA Creative Academy)
 */
function renderScreenApplication(scenario: PrototypeScenario): string {
  const isRecovery = scenario === "recovery";
  return `
    <div class="card" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      ${isRecovery ? `
        <div class="card" role="status" style="background: #DCFCE7; border: 1px solid #86EFAC; margin-bottom: 20px; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #166534;">
            ${renderIcon("check", { size: 16 })}
            <span>Application Submission Recovered Successfully</span>
          </div>
          <p style="font-size: 0.85rem; margin: 4px 0 0 0; color: #14532D;">
            Durable acceptance confirmed. Canonical Application Ref: <strong>AFCA-2026-COHORT-4190</strong>. Duplicate creation was prevented.
          </p>
        </div>
      ` : ""}

      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px;">Admissions Portal &bull; Cohort 2026B</span>
        <h1 style="font-size: var(--vmn-font-size-page-title); margin: 0; font-weight: 800;">
          AFCA Creative Academy Application
        </h1>
        <p style="color: var(--vmn-color-text-muted); font-size: 0.95rem; margin: 4px 0 0 0;">
          Directing, Cinematography, Sound Design &amp; Broadcast Operations
        </p>
      </div>

      <!-- Application Stepper -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--vmn-color-border); padding-bottom: 12px; overflow-x: auto;">
        <span class="vmn-badge badge-ready">1. Track Selected</span>
        <span class="vmn-badge badge-ready">2. Personal Dossier</span>
        <span class="vmn-badge badge-live" style="background: var(--vmn-surface-accent); color: var(--vmn-color-primary); border-color: #86EFAC;">3. Creative Essay</span>
        <span class="vmn-badge badge-neutral">4. Review &amp; Submit</span>
      </div>

      <!-- Application Form Body -->
      <form action="/apply" method="POST">
        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Selected Cohort Track</label>
          <input type="text" class="vmn-input" value="Directing &amp; Cinematography Master Track" readonly style="min-height: 44px; background: var(--vmn-surface-alt);" />
        </div>

        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Personal Statement &amp; Creative Goal (Max 500 characters)</label>
          <textarea class="vmn-input" rows="4" style="width: 100%; min-height: 100px; padding: 10px;">My goal is to pioneer authentic African cinematic visual language for high-definition broadcast and international distribution through ONE Studios.</textarea>
          <span style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">152 / 500 characters used</span>
        </div>

        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Portfolio Showreel Link (Vimeo / YouTube / Azeebo Drive)</label>
          <input type="url" class="vmn-input" value="https://vimeo.com/showcase/afca-demo-2026" style="min-height: 44px;" />
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; border-top: 1px solid var(--vmn-color-border); padding-top: 16px;">
          <button type="button" class="btn btn-outline">Save In-Progress Draft</button>
          <button type="button" class="btn btn-primary">Review &amp; Submit Application &rarr;</button>
        </div>
      </form>
    </div>
  `;
}

/**
 * 6. UX-VTM-008-010: Talent Engagement Terms & Acceptance
 */
function renderScreenTerms(scenario: PrototypeScenario): string {
  const isBlocked = scenario === "blocked";
  return `
    <div class="card" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      ${isBlocked ? `
        <div class="vmn-blocker-tray" style="margin-bottom: 20px;">
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Engagement Acceptance Blocked: Rights Conflict</span>
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #451A03;">
            Contract execution paused pending legal review of prior talent exclusivity agreement.
          </p>
        </div>
      ` : ""}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid var(--vmn-color-border); padding-bottom: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 6px;">Verified Talent Marketplace (VTM)</span>
          <h1 style="font-size: var(--vmn-font-size-page-title); margin: 0; font-weight: 800;">
            Talent Engagement Agreement
          </h1>
          <span style="font-size: 0.85rem; color: var(--vmn-color-text-muted);">
            Contract Ref: <strong>VTM-2026-ENG-491</strong> &bull; Version 1.2
          </span>
        </div>
        <span class="vmn-badge ${isBlocked ? "badge-live" : "badge-warning"}">
          ${isBlocked ? "Acceptance Locked" : "Awaiting Counterparty Acceptance"}
        </span>
      </div>

      <!-- Crucial Order (§14.1 Review Finding): Work & Economics MUST precede Acceptance Controls -->
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin-bottom: 12px;">1. Scope of Work &amp; Deliverables</h2>
        <p style="font-size: 0.95rem; color: var(--vmn-color-text-main); line-height: 1.6;">
          Engagement of <strong>K. Balogun</strong> as Lead Sound Designer for ONE Studios episodic production <em>Project Echo</em>. Deliverables include final 5.1 surround sound master mix conforming to EBU R128 (-23 LUFS) broadcast standard.
        </p>
      </section>

      <!-- Financial Economics Breakdown (§8.8 / §14.1) -->
      <section class="vmn-economics-breakdown">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--vmn-color-primary); margin: 0 0 12px 0;">
          2. Financial Remuneration &amp; Deductions
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
          <div class="stat-box"><span class="stat-lbl">Gross Contract Value</span><strong style="font-size: 1.1rem;">NGN 1,800,000</strong></div>
          <div class="stat-box"><span class="stat-lbl">Statutory Withholding (5%)</span><strong style="color: #991B1B;">- NGN 90,000</strong></div>
          <div class="stat-box"><span class="stat-lbl">Net Payable to Talent</span><strong style="color: var(--vmn-color-primary); font-size: 1.1rem;">NGN 1,710,000</strong></div>
          <div class="stat-box"><span class="stat-lbl">Disbursement Cadence</span><strong>50% Advance / 50% Wrap</strong></div>
        </div>
        <p style="font-size: 0.8rem; color: var(--vmn-color-text-muted); margin: 0;">
          Payment released securely via escrow upon delivery sign-off by Executive Producer.
        </p>
      </section>

      <!-- Rights Scope -->
      <section style="margin-bottom: 24px;">
        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 8px;">3. Intellectual Property &amp; Rights Grant</h3>
        <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); line-height: 1.5;">
          Perpetual, worldwide broadcast exploitation rights for StarTimes linear channels and Azeebo+ digital distribution. Commercial soundtrack publishing rights retained by creator with standard revenue sharing.
        </p>
      </section>

      <!-- Acceptance Action (Ordered AFTER Economics & Rights) -->
      <div class="vmn-terms-decision-panel">
        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" style="width: 20px; height: 20px; margin-top: 2px;" required />
            <span>I have read and agree to all terms, deliverables, rights grants, and financial deductions stated in Agreement VTM-2026-ENG-491.</span>
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button type="button" class="btn btn-outline">Request Amendments</button>
          <button type="button" class="btn btn-primary" style="min-height: 44px; min-width: 200px;">
            Record Formal Acceptance
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 7. UX-BR-012: Broadcast Schedule Review
 */
function renderScreenSchedule(scenario: PrototypeScenario): string {
  const isBlocked = scenario === "blocked";
  return `
    <div class="card" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <span class="vmn-badge badge-live">Master Control Room &bull; Playout Agenda</span>
          <h1 style="font-size: var(--vmn-font-size-page-title); margin: 4px 0 0 0; font-weight: 800;">
            Broadcast Schedule Review
          </h1>
          <span style="font-size: 0.85rem; color: var(--vmn-color-text-muted);">
            Channel: <strong>Nigezie Xtreme (NXTR)</strong> &bull; Transmission Date: <strong>2026-09-30</strong>
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem;">Export XMLTV EPG</button>
        </div>
      </div>

      ${isBlocked ? `
        <div class="vmn-blocker-tray" style="margin-bottom: 20px;">
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Transmission Rights Blocker on Segment #4102</span>
          </div>
          <p style="font-size: 0.9rem; margin: 0; color: #451A03;">
            Playout automated lock activated. StarTimes transmission will hold last valid visual slate unless rights waiver is uploaded before 21:30 UTC.
          </p>
        </div>
      ` : ""}

      <!-- 24/7 Timeline Agenda Table -->
      <div style="overflow-x: auto;">
        <table class="table" style="width: 100%; font-size: 0.85rem;">
          <thead>
            <tr>
              <th>Start UTC</th>
              <th>End UTC</th>
              <th>Programme Title</th>
              <th>Format</th>
              <th>Audio EBU</th>
              <th>Rights Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>18:00:00</code></td>
              <td><code>19:00:00</code></td>
              <td><strong>Xtreme Street Hop Hits</strong></td>
              <td>1080i50</td>
              <td>-23 LUFS OK</td>
              <td><span class="vmn-badge badge-ready">Cleared StarTimes</span></td>
              <td><span style="color: var(--vmn-color-text-muted);">Passed</span></td>
            </tr>
            <tr style="background: var(--vmn-surface-accent);">
              <td><code>19:00:00</code></td>
              <td><code>20:30:00</code></td>
              <td><strong>Afrobeat Titans Live Concert</strong></td>
              <td>1080i50</td>
              <td>-23 LUFS OK</td>
              <td><span class="vmn-badge badge-ready">Cleared StarTimes</span></td>
              <td><span class="vmn-badge badge-live">On Air Now</span></td>
            </tr>
            <tr ${isBlocked ? 'style="background: #FEE2E2;"' : ""}>
              <td><code>20:30:00</code></td>
              <td><code>21:45:00</code></td>
              <td><strong>Urban Sound Showcase #4102</strong></td>
              <td>1080i50</td>
              <td>-23 LUFS OK</td>
              <td>
                ${isBlocked ? '<span class="vmn-badge badge-live">RIGHTS BLOCKED</span>' : '<span class="vmn-badge badge-ready">Cleared StarTimes</span>'}
              </td>
              <td>
                ${isBlocked ? '<button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 2px 8px; min-height: 32px;">Resolve Blocker</button>' : '<span style="color: var(--vmn-color-text-muted);">Queued</span>'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 8. UX-BR-030 / UX-GOV-006: Delivery Evidence & Proof-of-Air
 */
function renderScreenProof(scenario: PrototypeScenario): string {
  const isStale = scenario === "stale";
  return `
    <div class="card" style="background: var(--vmn-surface); padding: var(--vmn-content-padding);">
      ${isStale ? renderStaleNotice("Proof-of-air reconciliation sync delayed. As-run log ingest running on 60-minute batch window.") : ""}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--vmn-color-border); padding-bottom: 16px;">
        <div>
          <span class="vmn-badge badge-ready">Transmission Audit &amp; Governance</span>
          <h1 style="font-size: var(--vmn-font-size-page-title); margin: 4px 0 0 0; font-weight: 800;">
            Proof-of-Air Delivery Reconciliation
          </h1>
          <span style="font-size: 0.85rem; color: var(--vmn-color-text-muted);">
            Campaign: <strong>GTCO-NXTR-2026-Q3</strong> &bull; Reconciled by Automated Engine v2.4
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem;">Export As-Run CSV</button>
          <button type="button" class="btn btn-primary" style="min-height: 40px; font-size: 0.85rem;">Publish Client Report</button>
        </div>
      </div>

      <!-- Reconciliation Scorecards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div class="stat-box"><span class="stat-lbl">Planned Airings</span><strong>120 Spots</strong></div>
        <div class="stat-box"><span class="stat-lbl">Matched &amp; Verified</span><strong style="color: var(--vmn-color-primary);">118 Spots</strong></div>
        <div class="stat-box"><span class="stat-lbl">Pre-empted Spots</span><strong style="color: var(--vmn-color-warning-text);">2 Exceptions</strong></div>
        <div class="stat-box"><span class="stat-lbl">Audit Integrity</span><strong>SHA-256 Valid</strong></div>
      </div>

      <!-- Exception Detail List -->
      <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 12px;">Pre-emption &amp; Exception Decisions</h3>
      <div class="card" style="background: var(--vmn-surface-alt); border-left: 4px solid var(--vmn-color-warning-text); padding: 14px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>Spot GTCO-NX-089 &bull; Pre-empted by Live Breaking Presidential Address</strong>
          <span class="vmn-badge badge-warning">Make-Good Approved</span>
        </div>
        <p style="font-size: 0.85rem; margin: 4px 0 8px 0; color: var(--vmn-color-text-muted);">
          Occurred 2026-09-28 19:15 UTC. Rescheduled to Primetime slot on 2026-10-01 20:30 UTC.
        </p>
        <span style="font-size: 0.8rem; color: var(--vmn-color-primary); font-weight: 600;">
          Operator Authorization: D. Adeyemi (MCR Lead)
        </span>
      </div>
    </div>
  `;
}

function renderStaleNotice(message: string): string {
  return `
    <div class="card" role="alert" style="background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #D97706; padding: 12px 16px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #92400E; font-size: 0.9rem;">
        ${renderIcon("clock", { size: 16 })}
        <span>STALE DATA NOTICE &mdash; Authoritative Sync Delayed</span>
      </div>
      <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #78350F;">
        ${escapeHtml(message)}
      </p>
    </div>
  `;
}
