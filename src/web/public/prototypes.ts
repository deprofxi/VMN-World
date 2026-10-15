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
 * - normal: illustrative prototype baseline (not production data)
 * - stale: simulated stale-state presentation (no live source)
 * - blocked: illustrative rights/compliance scenario (not a decision)
 * - recovery: illustrative recovery workflow (not durable evidence)
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
    { id: "normal", label: "Normal", desc: "Prototype baseline — not production data" },
    { id: "stale", label: "Stale Data", desc: "Simulated stale state; no live source connected" },
    { id: "blocked", label: "Blocked State", desc: "Illustrative rights/compliance scenario, not an actual decision" },
    { id: "recovery", label: "Recovery Drill", desc: "Illustrative recovery workflow, not durable evidence" },
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
 return `<a href="/prototypes?screen=${s.id}&scenario=${currentScenario}&device=${currentDevice}" class="vmn-btn vmn-btn-outline ${active} s-ss1kWoUBIJ" >
        <span>${escapeHtml(s.name)}</span>
 <span class="s-rizvLiSQHH">${s.code}</span>
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
 <div class="s-jXAzROAz5F">
 <div class="s-WF37VTogiT">
        <div>
 <span class="vmn-badge badge-info s-fzy69kMBd1" >VMN-UX-RL1 Resolution Prototype</span>
 <h1 class="s-7HxObHWiTP">
            Representative UI/UX Prototypes
          </h1>
 <p class="s-H18PT94LvI">
            Inspecting the 8 First-Release resolution screens under desktop, tablet, and mobile viewports with simulated operational scenarios (Authority: <code>VMN APP UI UX.docx</code> §1, §7, §8, §14).
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="/styleguide" class="btn btn-outline s-jv_H3_hWre" >Living Styleguide</a>
 <a href="/" class="btn btn-primary s-jv_H3_hWre" >Live App Overview</a>
        </div>
      </div>

      <!-- Screen Selector Bar -->
 <nav class="card s-Hc-yUsL-Fj" aria-label="Prototype Screen Selector" >
 <span class="s-EdW7dJ1nvV">Screen:</span>
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
 <div class="s-RFGXZvLtig">
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
 <div class="card vmn-shell-public s-2AtUk0CtKQ" >
      ${isStale ? renderStaleNotice("Schedule freshness is unknown because no approved source is connected.") : ""}
      
      <!-- 1. Hero Proposition -->
 <div class="vmn-public-hero s-RLWEwot0Lx" >
 <span class="vmn-badge badge-ready s-SviNzP8T_-" >
          Broadcasting &amp; Creative Economy Ecosystem
        </span>
 <h1 class="s-X-AgAzL6D0">
          Virtual Media Network Limited
        </h1>
 <p class="s-oUPkLo-8YW">
          Virtual Media Network Limited brings together linear channel profiles, production infrastructure for African creators, and the federated Azeebo+ ecosystem.
        </p>
 <div class="s-GNTtGikGkV">
 <a href="/channels" class="btn s-Yrm0zmaVBy" >Explore Channels</a>
 <a href="/apply" class="btn btn-outline s-T_Ux9z4CH6" >Apply to AFCA Academy</a>
 <a href="/contact" class="btn btn-outline s-T_Ux9z4CH6" >Commercial Enquiry</a>
        </div>
      </div>

      <!-- 2. Television Portfolio -->
 <section class="s-jdErRdP7Vw">
 <div class="s-X1u32Y8E_Y">
 <h2 class="s-kiY9qPT64l">Linear Television Channels</h2>
 <span class="s-WGpZZ_z1O2">Carriage details unverified</span>
        </div>
 <div class="grid grid-cols-1 s-4qBYC5pvY8" >
 <div class="card s-cR03ntYskl" >
 <div class="s-jXl2S6cRQl">
              <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
            </div>
 <h3 class="s--8YyDPFw84">Nigezie Xtreme</h3>
 <p class="s-ATxcpEYg9n">Urban music, youth lifestyle, and contemporary culture channel profile.</p>
 <a href="/prototypes?screen=channel" class="btn btn-outline s-TsQkvSw5DC" >Channel Details &rarr;</a>
          </div>

 <div class="card s-8YvkPKKI0f" >
 <div class="s-jXl2S6cRQl">
              <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
            </div>
 <h3 class="s--8YyDPFw84">Orisun — The Source</h3>
 <p class="s-ATxcpEYg9n">Rich Yoruba culture, cinema, music, folklore, and heritage programming.</p>
 <a href="/channels/oris" class="btn btn-outline s-TsQkvSw5DC" >Channel Details &rarr;</a>
          </div>

 <div class="card s-7ndtghkGqf" >
 <div class="s-jXl2S6cRQl">
              <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
            </div>
 <h3 class="s--8YyDPFw84">Isi Mbido — The Beginning</h3>
 <p class="s-ATxcpEYg9n">Igbo language, customs, traditional drama, and authentic storytelling.</p>
 <a href="/channels/imbd" class="btn btn-outline s-TsQkvSw5DC" >Channel Details &rarr;</a>
          </div>
        </div>
      </section>

      <!-- 3. Azeebo+ Gateway Banner -->
      <section class="vmn-azeebo-gateway-banner">
        <div>
 <span class="vmn-badge badge-info s-fzy69kMBd1" >Federated Consumer Gateway</span>
 <h3 class="s-My14PRdW73">Azeebo+ Streaming &amp; Digital Experience</h3>
 <p class="s-AMzHB6Cv2W">
            Stream full episodes, backstage masterclasses, and music specials direct to consumer.
          </p>
        </div>
 <a href="/azeebo/gateway" class="btn btn-primary s-Kwt_c99fyG" >
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
 <div class="card s-2AtUk0CtKQ" >
 ${isStale ? renderStaleNotice("Transmission guide freshness is unknown; no approved source is connected.") : ""} <div class="s-pMxv3vJkjW">
          <div>
 <div class="s-4ad8h0QMBD s-pMxv3vJkjW">
              <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-Q3ACHsUPFF">Carriage details unverified</span>
          </div>
 <h1 class="s-a-LB7wOVJO">
            Nigezie Xtreme (NXTR)
          </h1>
 <p class="s-78l2hYjzXA">
            The Definitive Pulse of Urban Music &amp; African Youth Culture
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
          <a href="/advertising" class="btn btn-primary">Book Commercial Airtime</a>
          <a href="/contact" class="btn btn-outline">Enquiry</a>
        </div>
      </div>

 <div class="card" role="note" >
        Technical standards, coverage, and uplink details are omitted until validated against approved operational evidence.
      </div>

      <!-- Schedule Notice - No Fake Now/Next (Authority Rule §8.2) -->
 <div class="card s-vV2ZFaH4hZ" role="note" >
 <div class="s-O51iQssC0f">
          ${renderIcon("broadcast", { size: 16 })}
          <span>Public Broadcast Schedule Notice</span>
        </div>
 <p class="s-TH4vWjx1Gd">
          No approved live schedule source is connected to this environment. Operational programme lineups are not published here.
        </p>
 <div class="s-nJzuIJPje9">
 <a href="/prototypes?screen=schedule" class="btn btn-outline s-3FRzAOu08N" >
            Inspect Schedule Console &rarr;
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
 <div class="vmn-work-rail-title s-0mWmubkRs3" >Operator</div>
 <div class="s-yaQ1Wd-ncP">
          <strong>D. Adeyemi</strong><br>
 <span class="s-orRLFYu8o-">MCR Traffic Director</span>
        </div>
      </aside>

      <!-- Main Workbench Work Area -->
      <div class="vmn-work-main">
        <!-- Priority 1 Blocker Tray (§8.5 Mandatory Order) -->
 <div class="vmn-blocker-tray" ${isBlocked ? '' : ""}>
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Priority Blocker Tray &mdash; ${isBlocked ? "CRITICAL BLOCKER ACTIVE" : "Immediate Action Required"}</span>
          </div>
          <div class="vmn-blocker-item">
            <div>
              <strong>Sample rights-block scenario — illustrative only</strong><br>
 <span class="s-Zda0APXQzv">No real rights case or scheduled slot is represented.</span>
            </div>
 <a href="/prototypes?screen=schedule&scenario=blocked" class="btn btn-outline s-HDQeaD48M5" >Review Rights</a>
          </div>
          <div class="vmn-blocker-item">
            <div>
              <strong>Sample reconciliation scenario — illustrative only</strong><br>
 <span class="s-Zda0APXQzv">No as-run or carriage telemetry is connected.</span>
            </div>
 <a href="/prototypes?screen=proof" class="btn btn-outline s-HDQeaD48M5" >Reconcile Spot</a>
          </div>
        </div>

        <!-- 1.6:1 Split Work Items & Detail Pane -->
        <div class="vmn-split-16-1">
          <!-- Primary Task Column -->
 <div class="card s-M1XN5DD7rQ" >
 <div class="s-KUQGzdrAEa">
 <h2 class="s-srhFO5P93o">Sample Work Queue</h2>
              <span class="vmn-badge badge-info">Illustrative only</span>
            </div>
            
 <div class="s-RksozYn_b3">
 <div class="card s-2cKuqB4iS0" >
 <div class="s-WBoMmQ5iPU">
 <span class="s-Qqy2DuK6Be">AFCA-REV-2026-092 &bull; Cohort Application</span>
                  <span class="vmn-badge badge-warning">Awaiting Review</span>
                </div>
 <p class="s-sp-Q9959-M">Applicant: T. Oladipo &bull; Directing &amp; Cinematography Track</p>
 <a href="/prototypes?screen=application" class="btn btn-outline s-HDQeaD48M5" >Open Candidate Dossier</a>
              </div>

 <div class="card s-St-_Xhbhqi" >
 <div class="s-WBoMmQ5iPU">
 <span class="s-Qqy2DuK6Be">Sample talent acceptance — illustrative</span>
                  <span class="vmn-badge badge-info">Prototype only</span>
                </div>
 <p class="s-sp-Q9959-M">No real talent engagement or contract status is represented.</p>
 <a href="/prototypes?screen=terms" class="btn btn-outline s-HDQeaD48M5" >Review Agreement</a>
              </div>
            </div>
          </div>

          <!-- Quick Context / Info Rail -->
 <div class="card s-HxNG84yhf2" >
 <h3 class="s-zw2apZGjlq">Operator Context</h3>
 <p class="s-5yNS0RpWH2">
              Prototype only — live shift, playout engine, and transmission-gate status are unavailable.
            </p>
 <div class="s-tgMgDSt2ur">
              Prototype interactions are not recorded in an operational audit ledger.
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
      ${isStale ? renderStaleNotice("Prototype proof data is illustrative; no StarTimes reconciliation source is connected.") : ""}
      <!-- Counterparty Banner -->
      <div class="vmn-portal-banner">
        <div>
 <div class="s-RXQtu1lQIZ">
            Counterparty Sponsor Portal
          </div>
          <div class="vmn-portal-counterparty">Sample Counterparty (Illustrative)</div>
 <div class="s-fClvy0XunL">
            Campaign Contract Ref: <strong>PROTOTYPE-ONLY</strong>
          </div>
        </div>
 <div class="s-66kjxA-b-z">
          <span class="vmn-badge badge-info">Illustrative prototype</span>
        </div>
      </div>

      <div class="card" role="note">Illustrative prototype data only — not a client commitment, released proof report, or verified transmission record.</div>
      <!-- Scope & Commitments Summary -->
 <div class="card s-Rl_MTfinnP" >
 <h2 class="s-OsqitOkOMz">Illustrative Campaign Deliverables</h2>
 <div class="s-ELadvnv3j3">
          <div class="stat-box"><span class="stat-lbl">Contracted Spots</span><strong>Sample only</strong></div>
          <div class="stat-box"><span class="stat-lbl">Delivered &amp; Audited</span><strong>Not verified</strong></div>
          <div class="stat-box"><span class="stat-lbl">Make-Good Scheduled</span><strong>Not verified</strong></div>            <div class="stat-box"><span class="stat-lbl">Compliance assessment</span><strong>Not available</strong></div>

        </div>
      </div>

      <!-- Illustrative proof data — not an operational report -->
 <div class="card s-QJ5gns6ZS6" >
 <div class="s-KUQGzdrAEa">
          <div>
            <span class="vmn-badge badge-info">Sample proof — not released</span>
 <h3 class="s-6QHpM2lglN">Broadcast Transmission Log Certification</h3>
 <span class="s-Zda0APXQzv">No signed proof artifact is attached to this prototype.</span>
          </div>
          <span class="vmn-badge badge-info">No downloadable signed artifact</span>
        </div>

 <div class="s-QtRFDAL0Yl">
 <table class="table s-TsQkvSw5DC" >
            <thead>
              <tr>
                <th>Spot ID</th>
                <th>Channel</th>
                <th>Scheduled UTC</th>
                <th>Actual Transmission</th>
                <th>Variance</th>
                <th>Carrier Source</th>
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
                <td>Not specified</td>
                <td><span class="vmn-badge badge-info">Illustrative only</span></td>
              </tr>
              <tr>
                <td><code>GTCO-NX-002</code></td>
                <td>Nigezie Xtreme</td>
                <td>17:15:00</td>
                <td>17:15:00</td>
                <td>0s</td>
                <td>Not specified</td>
                <td><span class="vmn-badge badge-info">Illustrative only</span></td>
              </tr>
              <tr>
                <td><code>GTCO-OR-003</code></td>
                <td>Orisun TV</td>
                <td>20:00:00</td>
                <td>20:00:05</td>
                <td>+5s</td>
                <td>Not specified</td>
                <td><span class="vmn-badge badge-info">Illustrative only</span></td>
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
 <div class="card s-2AtUk0CtKQ" >
      ${isRecovery ? `
 <div class="card s-Z3JOzMQ3SJ" role="status" >
 <div class="s-chgo6rh1fB">
            ${renderIcon("check", { size: 16 })}
            <span>Illustrative recovery scenario</span>
          </div>
 <p class="s-7lr0Wrtj6U">
            Example only — no durable acceptance or canonical application record is represented by this prototype.
          </p>
        </div>
      ` : ""}

 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-info s-fzy69kMBd1" >Prototype admissions portal</span>
 <h1 class="s-EI38VpLbTK">
          AFCA Creative Academy Application
        </h1>
 <p class="s-aKEjvNNlks">
          Directing, Cinematography, Sound Design &amp; Broadcast Operations
        </p>
      </div>

      <!-- Application Stepper -->
 <div class="s-0ClOM-vjZ0">
        <span class="vmn-badge badge-info">1. Sample track</span>
        <span class="vmn-badge badge-info">2. Sample dossier</span>
 <span class="vmn-badge badge-info s-d6qTfsS8pY" >3. Sample essay</span>
        <span class="vmn-badge badge-neutral">4. Review &amp; Submit</span>
      </div>

      <!-- Application Form Body -->
      <form action="/apply" method="POST">
        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Illustrative Track Selection</label>
 <input type="text" class="vmn-input s-WBSS2Q3mEj" value="Sample track — not an available cohort listing" readonly />
        </div>

        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Personal Statement &amp; Creative Goal (Max 500 characters)</label>
 <textarea class="vmn-input s-LAVdksEjAP" rows="4" >Sample text only — no application, cohort, facility, or distribution service is represented.</textarea>
 <span class="s-OdlmY1tzrc">152 / 500 characters used</span>
        </div>

        <div class="vmn-form-field mb-4">
          <label class="vmn-label">Portfolio Showreel Link (Vimeo / YouTube / Azeebo Drive)</label>
 <input type="url" class="vmn-input s-GP5FDgmEZf" value="https://example.invalid/sample-portfolio" />
        </div>

 <div class="s-GdWT93zeKK">
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
 return ` <div class="card" >
      <div class="card s-2AtUk0CtKQ" role="note">Illustrative agreement scenario only — no actual rights grant, commercial terms, tax treatment, escrow, or acceptance is represented.</div>
      ${isBlocked ? `
 <div class="vmn-blocker-tray s-t1-tAAl8Ne" >
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Illustrative engagement blocker</span>
          </div>
 <p class="s-zUKfTc_tob">
            Simulated scenario only — this does not represent an actual legal review or rights decision.
          </p>
        </div>
      ` : ""}
 <div class="s-vpAM5c5aV_">
        <div>
 <span class="vmn-badge badge-info s-T-7fjmEHMj" >VTM interface prototype</span>
 <h1 class="s-EI38VpLbTK">
            Talent Engagement Agreement
          </h1>
 <span class="s-WGpZZ_z1O2">
            Sample reference: <strong>PROTOTYPE-ONLY</strong> &bull; Illustrative terms
          </span>
        </div>
        <span class="vmn-badge ${isBlocked ? "badge-live" : "badge-warning"}">
          ${isBlocked ? "Illustrative blocked state" : "Sample state — not submitted"}
        </span>
      </div>

      <!-- Crucial Order (§14.1 Review Finding): Work & Economics MUST precede Acceptance Controls -->
 <section class="s-jXAzROAz5F">
 <h2 class="s-FdQqJDd8Gs">1. Scope of Work &amp; Deliverables</h2>
 <p class="s-UTQ6hG-ywH">
          Sample engagement for a sound-design role on a fictional episodic production. Scope and technical deliverables must be supplied and approved for each actual engagement.
        </p>
      </section>

      <!-- Financial Economics Breakdown (§8.8 / §14.1) -->
      <section class="vmn-economics-breakdown">
 <h3 class="s-ABjA_A0pct">
          2. Financial Remuneration &amp; Deductions
        </h3>
 <div class="s-x-A4zUfey5">
 <div class="stat-box"><span class="stat-lbl">Contract value</span><strong class="s-GQLoTwWBik">Set by approved agreement</strong></div>
 <div class="stat-box"><span class="stat-lbl">Tax treatment</span><strong class="s-bmiGIgC5Pn">Confirm with Finance</strong></div>
 <div class="stat-box"><span class="stat-lbl">Talent payable</span><strong class="s-R59aKDce90">Set by approved agreement</strong></div>
          <div class="stat-box"><span class="stat-lbl">Payment terms</span><strong>Confirm with Finance</strong></div>
        </div>
 <p class="s-qlkLtWtWrk">
          Payment protection and release conditions must be confirmed for the actual engagement; this prototype does not evidence escrow.
        </p>
      </section>

      <!-- Rights Scope -->
 <section class="s-jXAzROAz5F">
 <h3 class="s-xAkgWbo3dl">3. Intellectual Property &amp; Rights Grant</h3>
 <p class="s-soSAyR4oE5">
          Rights are not granted by this prototype. Any actual channel, platform, territory, term, exclusivity, promotional or derivative permissions require an approved rights record and agreement.
        </p>
      </section>

      <!-- Acceptance Action (Ordered AFTER Economics & Rights) -->
      <div class="vmn-terms-decision-panel">
 <div class="s-BFqsiZ1_zP">
 <label class="s-Q4sBYV2P9B">
 <input type="checkbox" class="s-9Isrvn5gw2" required />
            <span>Prototype preview only. No actual agreement or terms are presented for acceptance.</span>
          </label>
        </div>
 <div class="s-tPjVcAQ6CH">
 <button type="button" class="btn btn-outline">Request Amendments</button> <button type="button" class="btn btn-primary" disabled aria-disabled="true">
            Prototype only — acceptance unavailable
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
 <div class="card s-2AtUk0CtKQ" >
      <div class="card s-RUKR5xP7ah" role="note">Illustrative schedule scenario only — not an approved playout schedule.</div>
 <div class="s-RUKR5xP7ah">
        <div>
          <span class="vmn-badge badge-info">Prototype — Schedule Review</span>
 <h1 class="s-j3Us9MuEtN">
            Broadcast Schedule Review
          </h1>
 <span class="s-WGpZZ_z1O2">
            Channel: <strong>Nigezie Xtreme (NXTR)</strong> &bull; Transmission Date: <strong>2026-09-30</strong>
          </span>
        </div>
 <div class="s-aTQ0x94bOS">
          <span class="vmn-badge badge-info">No operational export attached</span>
        </div>
      </div>

      ${isBlocked ? `
 <div class="vmn-blocker-tray s-t1-tAAl8Ne" >
          <div class="vmn-blocker-tray-title">
            ${renderIcon("alert", { size: 18 })}
            <span>Illustrative rights-block scenario</span>
          </div>
 <p class="s-xAbKeD-Csp">
            This simulated scenario does not represent a production transmission or rights decision.
          </p>
        </div>
      ` : ""}

      <!-- 24/7 Timeline Agenda Table -->
 <div class="s-QtRFDAL0Yl">
 <table class="table s-TsQkvSw5DC" >
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
              <td><strong>Sample Programme A</strong></td>
              <td>Sample format</td>
              <td>Not assessed</td>
              <td><span class="vmn-badge badge-info">Sample state — not verified</span></td>
 <td><span class="s-5XUOxDHBPO">Illustrative only</span></td>
            </tr>
 <tr class="s-5cF2LCAjt6">
              <td><code>19:00:00</code></td>
              <td><code>20:30:00</code></td>
              <td><strong>Sample Programme B</strong></td>
              <td>Sample format</td>
              <td>Not assessed</td>
              <td><span class="vmn-badge badge-info">Sample state — not verified</span></td>
              <td><span class="vmn-badge badge-info">Illustrative only</span></td>
            </tr>
 <tr ${isBlocked ? 'class="s-tX57pgKHnh"' : ""}>
              <td><code>20:30:00</code></td>
              <td><code>21:45:00</code></td>
              <td><strong>Sample Programme C</strong></td>
              <td>Sample format</td>
              <td>Not assessed</td>
              <td>
                <span class="vmn-badge badge-info">${isBlocked ? "Illustrative rights block" : "Sample state — not verified"}</span>
              </td>
              <td>
 ${isBlocked ? '<span class="vmn-badge badge-info">Simulated state</span>' : '<span class="s-5XUOxDHBPO">Illustrative only</span>'}
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
 <div class="card s-2AtUk0CtKQ" >
      ${isStale ? renderStaleNotice("This prototype does not connect to a proof-of-air reconciliation source.") : ""}
 <div class="s-MdHT-qNCVk">
        <div>
          <span class="vmn-badge badge-info">Illustrative Proof Scenario</span>
 <h1 class="s-j3Us9MuEtN">
            Proof-of-Air Delivery Reconciliation
          </h1>
 <span class="s-WGpZZ_z1O2">
            Campaign: <strong>PROTOTYPE-ONLY</strong> &bull; No reconciliation source connected
          </span>
        </div>
 <div class="s-aTQ0x94bOS">
 <button type="button" class="btn btn-outline s-jv_H3_hWre" >Export As-Run CSV</button>
 <button type="button" class="btn btn-primary s-jv_H3_hWre" >Publish Client Report</button>
        </div>
      </div>

      <!-- Reconciliation Scorecards -->
 <div class="s-8_1VIuXAbq">
        <div class="stat-box"><span class="stat-lbl">Planned Airings</span><strong>Sample only</strong></div>          <div class="stat-box"><span class="stat-lbl">Source match</span><strong>Not available</strong></div>

        <div class="stat-box"><span class="stat-lbl">Pre-empted Spots</span><strong>Not verified</strong></div>
        <div class="stat-box"><span class="stat-lbl">Audit Integrity</span><strong>No signed evidence attached</strong></div>
      </div>

      <!-- Exception Detail List -->
 <h3 class="s-nSxOOwYKh9">Illustrative Pre-emption Scenario</h3>
 <div class="card s-RElML3_dn8" >
 <div class="s-wrzqCFgz1Y">
          <strong>Sample Spot — simulated pre-emption scenario</strong>
          <span class="vmn-badge badge-info">Illustrative only — no approval recorded</span>
        </div>
 <p class="s-P5dl9Oj6Ca">
          Timing and rescheduling details are illustrative, not operational evidence.
        </p>
 <span class="s-YkK10WR1a4">
          No operator authorization is represented by this prototype.
        </span>
      </div>
    </div>
  `;
}

function renderStaleNotice(message: string): string {
  return `
 <div class="card s-S217meAHMV" role="alert" >
 <div class="s-1IAuz5H4KX">
        ${renderIcon("clock", { size: 16 })}
        <span>STALE DATA NOTICE &mdash; Authoritative Sync Delayed</span>
      </div>
 <p class="s-8G2fzKwjg4">
        ${escapeHtml(message)}
      </p>
    </div>
  `;
}
