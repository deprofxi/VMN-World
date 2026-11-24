/**
 * Complete Public Surface Web Screens (UX-PUB-001 to UX-PUB-028)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.1 / tasks.md §3.1
 *
 * Implements public surfaces with accessibility-minded markup; conformance requires
 * verification against the rendered experience and is not claimed by this module.
 */

import { PUBLIC_CHANNELS } from "./channels.js";
import { renderIcon, renderEpisodeMasterSummaryHtml } from "../components/index.js";
import { listEpisodeMasters } from "../../modules/broadcast/episode-masters.js";
import { escapeHtml } from "../components/escape.js";
import { VMN_LEADERSHIP } from "./corporate.js";

/**
 * UX-PUB-002: About VMN
 */
export function renderAboutPageHtml(): string {
  return `
    <article class="container s-2nHGlX-U0t s--ngrzb3d5w">
      <header class="s-2udxTC4LQH s-d0pMqi1kxm">
        <span class="vmn-badge badge-ready s-tPnc4j8Rfj s-x7OYcwftt2">Corporate Governance</span>
        <h1 class="s-7wOXUA0Lid s-0TijWy9XkZ">
          About Virtual Media Network Limited (VMNL)
        </h1>
        <p class="s-K0k-rvOz9S s-8ra-NMsYhk">
          A media company with public profiles for linear channels and proposed creative-economy programme areas. Operational reach and service availability require verification.
        </p>
      </header>

      <section class="card s-Kk_TX9a-yW s-TEQ4LSidvQ">
        <div class="s-eVjH67FLxK">
          <h2 class="s-y7lMjPUysy s-UsQh2pGfXW">
            Enterprise Mission & Mandate
          </h2>
          <span class="vmn-badge badge-info font-mono s-orRLFYu8o-">RC: 198428 • LAGOS / ABUJA</span>
        </div>
        <p class="s-gLpm1d0BEF s-LFyKX56jcU">
          Virtual Media Network Limited develops linear channel profiles, creative infrastructure, and media services. Carriage, audience reach, and live transmission claims require independent verification.
        </p>
        <p class="s-RStw7YfZ3A s-db8lyrUOYd">
          The Creative Economy Hub describes potential areas including learning, talent, production, funding, events, and distribution enquiries. Accreditation, talent verification, funding, facilities, rights, and service availability are not established by this page.
        </p>
        <div class="s-QYcwKXuS9X">
          <div>
            <div class="s-uW7qP1pMQH">Broadcast Brands</div>
            <div class="s-m9WPanhF40">3 Linear Networks</div>
          </div>
          <div>
            <div class="s-uW7qP1pMQH">Creative Verticals</div>
            <div class="s-wuKq3N2TJQ">6 Hub Initiatives</div>
          </div>
          <div>
            <div class="s-uW7qP1pMQH">Governance Model</div>
            <div class="s-JYafc2GRON">Verified Data Sources</div>
          </div>
        </div>
      </section>

      <div class="s-bjVu6Z7Rt5 s-hkYxD6y31q">
        <div class="card s-PCC97mWQBM s-58UyCUEzjg">
          <h3 class="s-wIa9aAsAdX s-CRyx0TR_Og">Three Flagship Channels</h3>
          <p class="s-3R0tLWTHcB s--Mvlb9IG8V">
            Nigezie Xtreme, Orisun, and Isi Mbido. Carriage numbers and transmission status are not asserted here.
          </p>
          <a href="/media-and-audience-overview" class="btn btn-outline btn-sm">Explore Channels &rarr;</a>
        </div>
        <div class="card s-PCC97mWQBM s-Bhf8oZesTA">
          <h3 class="s-wIa9aAsAdX s-CRyx0TR_Og">Creative Economy Hub</h3>
          <p class="s-3R0tLWTHcB s--Mvlb9IG8V">
            Creative-economy programmes and opportunities are described in this prototype; participation, grants, placements, and reach are not verified here.
          </p>
          <a href="/creative-economy-hub-overview" class="btn btn-outline btn-sm">Hub Overview &rarr;</a>
        </div>
        <div class="card s-PCC97mWQBM s-5PSGmAsPqm">
          <h3 class="s-wIa9aAsAdX s-CRyx0TR_Og">Azeebo+ Streaming</h3>
          <p class="s-3R0tLWTHcB s--Mvlb9IG8V">
            Azeebo+ is a federated service. Availability, catalogues, and audience attribution depend on its separately operated systems.
          </p>
          <a href="/azeebo/gateway" class="btn btn-outline btn-sm">Azeebo+ Info &rarr;</a>
        </div>
      </div>

      <!-- Executive Leadership & Corporate Governance Directory -->
      <section class="card bg-[#080c14] border border-[#1a2234] rounded-xl p-6 mt-6">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#1a2234]">
          <div>
            <h2 class="text-base font-semibold text-white tracking-tight">Executive Leadership &amp; Governance</h2>
            <p class="text-xs text-slate-400 mt-0.5">Corporate leadership role profiles. Appointments and biographical disclosures require verified corporate filings.</p>
          </div>
          <span class="vmn-badge badge-neutral text-xs">Unverified Directory</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${VMN_LEADERSHIP.map(
            (m) => `
            <div class="bg-[#0b101b] border border-[#1a233a] p-4 rounded-lg flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 font-semibold text-xs">
                    ${escapeHtml(m.name.slice(0, 2).toUpperCase())}
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-white leading-tight">${escapeHtml(m.name)}</h3>
                    <div class="text-[11px] text-sky-400 font-medium">${escapeHtml(m.title)}</div>
                  </div>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed mt-2">${escapeHtml(m.bio)}</p>
              </div>
              <div class="mt-3 pt-3 border-t border-[#1a233a]/60 flex items-center justify-between text-[11px] text-slate-400">
                <span class="font-mono text-slate-400">VMNL-DIR</span>
                <span class="text-amber-400/80">Pending verification</span>
              </div>
            </div>
          `
          ).join("")}
        </div>
      </section>
    </article>
  `;
}

/**
 * UX-PUB-008: Public Schedule
 */
export function renderPublicScheduleHtml(): string {
  const channels = PUBLIC_CHANNELS;
  const channelBlocks = channels
    .map(
      (c) => `
    <div class="card s-aOQEhVcQ_B bg-[#080c14] border border-[#1a2234] border-l-4 border-l-sky-400 rounded-[10px] p-6 mb-6">
      <div class="s-Kgr3QucRG7 s-eVjH67FLxK">
        <div>
          <span class="s-qNsmp8l7l6 s-NKEagYvk9w">${escapeHtml(c.name)}</span>
          <span class="s-hVWSD2LpPP font-mono s-tgUwTbyzaC">${c.isProvisional ? "Carriage details unverified" : `DTT Ch. ${c.dttChannel ?? "—"} · DTH Ch. ${c.dthChannel ?? "—"}`}</span>
        </div>
        <span class="vmn-badge badge-info">Schedule not verified</span>
      </div>
      <div class="card s-Hm1QUBuHok" role="note">
        <div class="s-FiG-Yl2rDF">
          No approved, source-backed schedule is connected. Programme entries are not published as operational listings.
        </div>
      </div>
      ${renderEpisodeMasterSummaryHtml(listEpisodeMasters(c.code))}
    </div>
  `
    )
    .join("\n");

  return `
    <article class="container s-2nHGlX-U0t s--ngrzb3d5w">
      <header class="s-8KqcJvoCxL s-CY4XSC3BLE">
        <span class="vmn-badge badge-ready s-x7OYcwftt2">Broadcast Programming</span>
        <h1 class="s-yrxYod1Dke s-0TijWy9XkZ">
          Linear Broadcast Schedule & EPG
        </h1>
        <p class="s-_Ozz6dYSwY s-MVJw1pf85B">
          Schedule data is shown only when an approved, source-backed programme schedule is available.
        </p>

        <!-- 24-Hour EPG Daypart Strip Navigation -->
        <div class="s-udylVlh2pJ">
          <div class="s-52G8kLJKjV">
            <span class="font-mono s-2oV_jH85F3">WEST AFRICA TIME (WAT) • 24-HOUR DAYPART BLOCKS</span>
            <div class="s-zbWvLG2WVX">
              <span class="vmn-badge s--UvLCenE26">Early Morning (06:00)</span>
              <span class="vmn-badge s--UvLCenE26">Daytime (09:00)</span>
              <span class="vmn-badge s--UvLCenE26">Early Fringe (16:00)</span>
              <span class="vmn-badge s-Lzrn0YMH9e">Primetime (19:00)</span>
              <span class="vmn-badge s--UvLCenE26">Late Fringe (22:00)</span>
            </div>
          </div>
        </div>
      </header>
      ${channelBlocks}
    </article>
  `;
}

/**
 * UX-PUB-009: Advertising & Sponsorship
 */
export function renderAdvertisingSponsorshipHtml(): string {
  return `
    <article class="container s-2nHGlX-U0t s-xwARkBzsQC">
      <header class="s-LGES5Rz7dF s-d0pMqi1kxm">
        <span class="vmn-badge badge-live s-x7OYcwftt2">Commercial Media Solutions</span>
        <h1 class="s-gjfPYbnwwq s-0TijWy9XkZ">
          Advertising, Sponsorship & Brand Integration
        </h1>
        <p class="s-tV7d4vigIM s-E8NDHNLEdk">
          Contact the commercial team to discuss potential placements and request current, source-backed reach and terms for your brief.
        </p>
      </header>

      <!-- SaaS Rate Cards Grid -->
      <div class="vmn-rate-grid s-tx9063Td-_">
        <!-- Card 1: Linear TV Spots -->
        <div class="vmn-rate-card vmn-interactive-row" data-inspect-title="Linear TV Spots">
          <div class="s-wsDQotMyev">
            ${renderIcon("tv", { size: 32 })}
          </div>
          <span class="vmn-rate-badge">Broadcast Commercials</span>
          <h2 class="s-F_XTn6m8wX s-V3rv-Qh6Jn">Linear TV Spots</h2>
          <div class="vmn-rate-amount">Rate on Request</div>
          <div class="vmn-rate-period">15s / 30s / 60s rotation units</div>
          <p class="s-iLZxUGepNI s-9MmzZ9WGXZ">
            Ask the commercial team about availability. Any placement, schedule, carriage, pricing, and proof-of-air terms require confirmation against current records.
          </p>
          <ul class="vmn-rate-features">
            <li>Daypart rotation (ROS / Primetime / Early Fringe)</li>
            <li>Cryptographic Proof-of-Air certificate support</li>
            <li>StarTimes DTT &amp; DTH multi-channel insertion</li>
          </ul>
        </div>

        <!-- Card 2: Programme Sponsorship -->
        <div class="vmn-rate-card vmn-rate-card-popular vmn-interactive-row" data-inspect-title="Programme Sponsorship">
          <div class="s-wsDQotMyev">
            ${renderIcon("broadcast", { size: 32 })}
          </div>
          <span class="vmn-rate-badge s-Wk2dWjGj_q">Most Requested</span>
          <h2 class="s-F_XTn6m8wX s-V3rv-Qh6Jn">Programme Sponsorship</h2>
          <div class="vmn-rate-amount">Custom Flight</div>
          <div class="vmn-rate-period">Quarterly &amp; Seasonal Packages</div>
          <p class="s-iLZxUGepNI s-9MmzZ9WGXZ">
            These are illustrative placement categories only. Inventory, schedule, talent participation, rights clearance, and commercial terms require current confirmation.
          </p>
          <ul class="vmn-rate-features">
            <li>Opening &amp; closing billboard audio-visual tags</li>
            <li>Lower-third product placement &amp; co-branding</li>
            <li>Digital replay &amp; social cross-promotion integration</li>
          </ul>
        </div>

        <!-- Card 3: Fusion Events Activation -->
        <div class="vmn-rate-card vmn-interactive-row" data-inspect-title="Fusion Events Activation">
          <div class="s-wsDQotMyev">
            ${renderIcon("film", { size: 32 })}
          </div>
          <span class="vmn-rate-badge">Experiential &amp; Live</span>
          <h2 class="s-F_XTn6m8wX s-V3rv-Qh6Jn">Fusion Events Activation</h2>
          <div class="vmn-rate-amount">Tailored Brief</div>
          <div class="vmn-rate-period">Per event or multi-city tour</div>
          <p class="s-iLZxUGepNI s-9MmzZ9WGXZ">
            These are illustrative activation categories only. Events, venues, naming rights, permissions, and broadcast integration are not confirmed.
          </p>
          <ul class="vmn-rate-features">
            <li>Live experiential festival branding &amp; staging</li>
            <li>VIP hospitality &amp; trade activations</li>
            <li>Broadcast recap specials &amp; highlight reels</li>
          </ul>
        </div>
      </div>

      <!-- Interactive Commercial Media Rate & Reach Calculator -->
      <div class="card mb-8 p-6 s-fezTg_2O3-">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span class="vmn-badge badge-ready text-xs mb-1">Interactive Planning Tool</span>
            <h2 class="text-xl font-bold m-0 text-slate-100">Advertising Campaign Rate &amp; Reach Calculator</h2>
          </div>
          <span class="text-xs text-muted font-mono">StarTimes DTT / DTH Simulcast</span>
        </div>
        <p class="text-xs text-muted mb-6 s--r46g6hah8">
          Simulate campaign reach and investment across our 3 linear channels. Figures are illustrative planning models; confirm current source-backed inventory and rate cards before booking.
        </p>

        <div class="grid grid-3 gap-4 mb-6">
          <!-- Selection 1: Channel -->
          <div>
            <label for="ad-channel-select" class="text-xs font-semibold text-slate-300 block mb-1">Target Network Channel</label>
            <select id="ad-channel-select" class="w-full text-xs p-2.5 rounded bg-surface border border-muted/20 text-slate-200">
              <option value="NXTR" data-mult="1.0">Nigezie Xtreme (NXTR - Youth &amp; Music)</option>
              <option value="ORIS" data-mult="0.9">Orisun TV (ORIS - Yoruba Culture)</option>
              <option value="IMBD" data-mult="0.85">Imbode TV (IMBD - Igbo Heritage)</option>
              <option value="TRIO" data-mult="2.4">All 3 Channels (Cross-Network Network Flight)</option>
            </select>
          </div>

          <!-- Selection 2: Daypart -->
          <div>
            <label for="ad-daypart-select" class="text-xs font-semibold text-slate-300 block mb-1">Air Daypart Flight</label>
            <select id="ad-daypart-select" class="w-full text-xs p-2.5 rounded bg-surface border border-muted/20 text-slate-200">
              <option value="PRIME" data-rate="180000" data-reach="450000">★ Primetime (19:00 – 22:00 WAT)</option>
              <option value="EARLY" data-rate="120000" data-reach="280000">Early Fringe (16:00 – 19:00 WAT)</option>
              <option value="DAY" data-rate="90000" data-reach="210000">Daytime (09:00 – 16:00 WAT)</option>
              <option value="LATE" data-rate="80000" data-reach="160000">Late Fringe (22:00 – 01:00 WAT)</option>
              <option value="ROS" data-rate="100000" data-reach="240000">Run of Schedule (ROS 24H Rotation)</option>
            </select>
          </div>

          <!-- Selection 3: Spot Duration -->
          <div>
            <label for="ad-duration-select" class="text-xs font-semibold text-slate-300 block mb-1">Commercial Spot Unit</label>
            <select id="ad-duration-select" class="w-full text-xs p-2.5 rounded bg-surface border border-muted/20 text-slate-200">
              <option value="30" data-dur-mult="1.0">30-Second Standard Commercial Spot</option>
              <option value="15" data-dur-mult="0.65">15-Second High-Frequency Stinger</option>
              <option value="60" data-dur-mult="1.8">60-Second Extended Brand Story</option>
            </select>
          </div>
        </div>

        <!-- Spot Volume Slider -->
        <div class="mb-6">
          <div class="flex justify-between items-center text-xs text-muted mb-2">
            <span>Flight Spot Count: <strong id="ad-spots-label" class="font-mono text-slate-200 text-sm">10 Spots</strong></span>
            <span>Recommended flight: 10–20 spots for reach saturation</span>
          </div>
          <input type="range" id="ad-spots-slider" min="3" max="50" step="1" value="10" class="w-full cursor-pointer" aria-label="Spot Quantity Slider" />
        </div>

        <!-- Calculated Metrics Summary Bar -->
        <div class="grid grid-3 gap-4 p-4 rounded bg-surface/50 border border-muted/20 items-center">
          <div>
            <div class="text-xs text-muted">Est. Gross Impressions</div>
            <div id="ad-calc-impressions" class="text-lg font-bold font-mono text-slate-200">2,800,000 HH</div>
            <div class="text-xs text-muted">Combined StarTimes viewers</div>
          </div>
          <div>
            <div class="text-xs text-muted">Proof-of-Air Assurance</div>
            <div class="text-sm font-bold text-success">ANSI/SCTE-35 Logged</div>
            <div class="text-xs text-muted">Cryptographic As-Run Verification</div>
          </div>
          <div>
            <div class="text-xs text-muted">Estimated Campaign Investment</div>
            <div id="ad-calc-total" class="text-xl font-bold font-mono text-success">₦1,800,000 NGN</div>
            <a id="ad-calc-cta" href="/contact?vertical=COMMERCIAL_ADVERTISING" class="btn btn-sm btn-primary mt-1 w-full text-center">
              Submit Campaign Brief &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Customized Media Rate Card Box -->
      <div class="card s-wpOGH5ukU_ s-g3VT44g0i8">
        <div class="s-X6bXY0dd3x">
          <h2 class="s-DITO9sm-WL s-ef6RBDBEw_">
            Request a Customized Media Rate Card
          </h2>
          <p class="s-z7WHKvYK0h s-v4nLDuXij2">
            Speak with our commercial sales team for primetime package discounts, campaign schedules, and cross-platform opportunities.
          </p>
        </div>
        <a href="/contact?vertical=COMMERCIAL_ADVERTISING" class="btn btn-primary button button--primary s-1OZuJEopSQ s-k8bh1Lt-AT">
          Submit Commercial Enquiry &rarr;
        </a>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-025: Contact & Commercial Enquiry Form
 */
export function renderEnquiryContactHtml(preselectedVertical: string = "COMMERCIAL_ADVERTISING"): string {
  return `
    <article class="container s-0VRn54WLCl s-j9LTzaMK7h">
      <header class="s-2udxTC4LQH s-CY4XSC3BLE">
        <span class="vmn-badge badge-ready s-x7OYcwftt2">Intake Desk</span>
        <h1 class="s-yrxYod1Dke s-0TijWy9XkZ">
          Commercial Enquiry & Partnership Request
        </h1>
        <p class="s-F2VYtMRxsW s-_PeHSOZsc3">
          Submit an enquiry. Response timing and durable tracking are not guaranteed in this environment; please do not include sensitive personal information.
        </p>
      </header>

      <!-- Multi-Step Application Wizard Stepper Container -->
      <div class="vmn-stepper-container s-e-P44oULsV">
        <!-- Stepper Navigation Header -->
        <nav class="vmn-stepper-nav" aria-label="Commercial Enquiry Steps">
          <div class="vmn-stepper-track">
            <div class="vmn-stepper-progress s-5rvMdGQhSr"></div>
          </div>
          <div class="vmn-step-item active" data-step="1">
            <div class="vmn-step-circle">1</div>
            <div class="vmn-step-label">Contact Details</div>
          </div>
          <div class="vmn-step-item" data-step="2">
            <div class="vmn-step-circle">2</div>
            <div class="vmn-step-label">Campaign &amp; Brief</div>
          </div>
          <div class="vmn-step-item" data-step="3">
            <div class="vmn-step-circle">3</div>
            <div class="vmn-step-label">Consent &amp; Review</div>
          </div>
        </nav>

        <form method="POST" action="/api/v1/enquiries" class="card s-sqzC72lluV s-jZCORxML1q">
          <!-- Step 1: Contact Details -->
          <div class="vmn-step-pane active" data-step="1">
            <h3 class="s-fP8XlUPNeA">
              Step 1: Stakeholder &amp; Organization Information
            </h3>

            <div class="s-wzvsZWh_8m">
              <label for="fullName" class="s-oMHwiwajnC s-TFvOhjaMln">
                Full Name <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
              </label>
              <input type="text" id="fullName" name="fullName" required placeholder="e.g. Dr. Ngozi Adeyemi" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
            </div>

            <div class="s-ZINITLBrbS s-3z8GFau31E">
              <div>
                <label for="email" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Email Address <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
                </label>
                <input type="email" id="email" name="email" required placeholder="ngozi@company.ng" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
              </div>
              <div>
                <label for="phone" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Phone Number
                </label>
                <input type="tel" id="phone" name="phone" placeholder="+234 803 123 4567" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
              </div>
            </div>

            <div class="s-ksslct4GBR">
              <label for="organisationName" class="s-oMHwiwajnC s-TFvOhjaMln">
                Organisation / Company
              </label>
              <input type="text" id="organisationName" name="organisationName" placeholder="e.g. Sterling Brand Communications" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
            </div>

            <div class="s-HzyKqjqBq_">
              <button type="button" class="btn btn-primary" data-wizard-next>
                Continue to Campaign Brief &rarr;
              </button>
            </div>
          </div>

          <!-- Step 2: Campaign & Brief -->
          <div class="vmn-step-pane" data-step="2">
            <h3 class="s-fP8XlUPNeA">
              Step 2: Objective &amp; Partnership Scope
            </h3>

            <div class="s-wzvsZWh_8m">
              <label for="vertical" class="s-oMHwiwajnC s-TFvOhjaMln">
                Enquiry Type <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
              </label>
              <select id="vertical" name="vertical" class="input s-UPrN9pHjcM s-1qG5mzS73L">
                <option value="COMMERCIAL_ADVERTISING" ${preselectedVertical === "COMMERCIAL_ADVERTISING" ? "selected" : ""}>Television Advertising &amp; Spots</option>
                <option value="SPONSORSHIP" ${preselectedVertical === "SPONSORSHIP" ? "selected" : ""}>Programme &amp; Channel Sponsorship</option>
                <option value="PARTNERSHIP" ${preselectedVertical === "PARTNERSHIP" ? "selected" : ""}>Institutional &amp; Brand Partnership</option>
                <option value="AFCA_LEARNING" ${preselectedVertical === "AFCA_LEARNING" ? "selected" : ""}>AFCA Academy &amp; Corporate Training</option>
                <option value="TALENT_ACCELERATOR" ${preselectedVertical === "TALENT_ACCELERATOR" ? "selected" : ""}>Talent Accelerator Partner Network</option>
                <option value="ONE_STUDIOS" ${preselectedVertical === "ONE_STUDIOS" ? "selected" : ""}>Studio Facility Booking &amp; Production</option>
                <option value="GENERAL_ENQUIRY" ${preselectedVertical === "GENERAL_ENQUIRY" ? "selected" : ""}>General Inquiry</option>
              </select>
            </div>

            <div class="s-ksslct4GBR">
              <label for="message" class="s-oMHwiwajnC s-TFvOhjaMln">
                Project Details &amp; Requirements <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
              </label>
              <textarea id="message" name="message" required rows="5" placeholder="Please outline your campaign flight dates, target demographics, and budget guidelines..." class="input s-zCt9vSwGkS s-Eh9lTVkcu3"></textarea>
            </div>

            <div class="s-ipvhDaxPWK">
              <button type="button" class="btn btn-outline" data-wizard-prev>
                &larr; Back
              </button>
              <button type="button" class="btn btn-primary" data-wizard-next>
                Review &amp; Acknowledge &rarr;
              </button>
            </div>
          </div>

          <!-- Step 3: Consent & Review -->
          <div class="vmn-step-pane" data-step="3">
            <h3 class="s-fP8XlUPNeA">
              Step 3: Review &amp; Statutory Acknowledgement
            </h3>

            <div class="s-g2--ZVzXgB">
              <div class="s-_vhCzsFO1y">Transmission Notice</div>
              <p class="s-41dPoKfx8N">
                Submitting this enquiry records your request for commercial review and does not bind airtime availability or commercial rates until confirmed by a signed formal contract.
              </p>
            </div>

            <div class="s-uaYMBvJysP s-RLfdRzYL44">
              <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required class="s-9Isrvn5gw2 s-4ntcb2HZ-l" />
              <label for="ndprConsent" class="s-EIgsbg6jRv s-ZSPrh-feXC">
                <strong>Enquiry acknowledgement:</strong> I understand that the information I submit is provided to VMNL for this enquiry. The privacy notice and handling details require review before they can be represented here as complete.
              </label>
            </div>

            <div class="s-ipvhDaxPWK">
              <button type="button" class="btn btn-outline" data-wizard-prev>
                &larr; Back
              </button>
              <button type="submit" class="btn btn-primary button button--primary s-jZKe1VmC9A">
                Submit Formal Enquiry
              </button>
            </div>
          </div>
        </form>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-026: Help & Knowledge Center
 */
export function renderHelpPageHtml(): string {
  return `
    <article class="container s-Gq1CYI3m9m s-rbAAUenm5h">
      <header class="s-2udxTC4LQH s-d0pMqi1kxm">
        <span class="vmn-badge badge-info s-x7OYcwftt2">Support Center</span>
        <h1 class="s-yrxYod1Dke s-0TijWy9XkZ">
          VMN Help & Resource Directory
        </h1>
        <p class="s-AuP1EyxEBf s-_PeHSOZsc3">
          Frequently asked questions, broadcast reception guides, admissions help, and technical support.
        </p>
      </header>

      <!-- Category Filter Pills -->
      <div class="vmn-filter-bar s-5wWIR7hyFx">
        <button type="button" class="vmn-filter-pill active" data-filter="all">All Topics</button>
        <button type="button" class="vmn-filter-pill" data-filter="broadcast">Broadcast &amp; Tuning</button>
        <button type="button" class="vmn-filter-pill" data-filter="academy">AFCA Academy</button>
        <button type="button" class="vmn-filter-pill" data-filter="verification">Verification &amp; Records</button>
      </div>

      <!-- Accessible Accordions List -->
      <div class="vmn-accordion s-6mqdXZ0QST s-Am6VpYxe0_">
        <!-- Item 1: Carriage -->
        <div class="vmn-accordion-item open card s-njnyYzrM3s s-C-vYdLnHws" data-category="broadcast">
          <button type="button" class="vmn-accordion-trigger s-nCsaVwVLOM s-55eBhiVpC2" aria-expanded="true">
            <span>How can I find verified reception and carriage information for VMNL channels?</span>
            <span class="vmn-accordion-chevron s-yfQOyq2J91">&darr;</span>
          </button>
          <div class="vmn-accordion-content s-quDx9pSmFp">
            <p class="s-WUIZpJO7QW s-vmjIwCOhxD">
              Carriage numbers are not verified in this environment. Please check current information with StarTimes or the broadcaster before tuning.
            </p>
          </div>
        </div>

        <!-- Item 2: Academy -->
        <div class="vmn-accordion-item card s-njnyYzrM3s s-C-vYdLnHws" data-category="academy">
          <button type="button" class="vmn-accordion-trigger s-nCsaVwVLOM s-55eBhiVpC2" aria-expanded="false">
            <span>How do I apply for the AFCA Film & Creative Arts Academy?</span>
            <span class="vmn-accordion-chevron s-yfQOyq2J91">&darr;</span>
          </button>
          <div class="vmn-accordion-content s-quDx9pSmFp">
            <p class="s-WUIZpJO7QW s-vmjIwCOhxD">
              The <a href="/apply" class="s-cHOzN4N0WC s-gHG6J8VgpN">admissions page</a> provides an enquiry route. Course offerings, cohort availability, application windows, and admission decisions require current confirmation; submitting an enquiry does not guarantee admission.
            </p>
          </div>
        </div>

        <!-- Item 3: Artists -->
        <div class="vmn-accordion-item card s-njnyYzrM3s s-C-vYdLnHws" data-category="broadcast">
          <button type="button" class="vmn-accordion-trigger s-nCsaVwVLOM s-55eBhiVpC2" aria-expanded="false">
            <span>How can artists submit music videos for broadcast review?</span>
            <span class="vmn-accordion-chevron s-yfQOyq2J91">&darr;</span>
          </button>
          <div class="vmn-accordion-content s-quDx9pSmFp">
            <p class="s-WUIZpJO7QW s-vmjIwCOhxD">
              A connected creator upload and review workflow is not available from this public site. Ask through the enquiry page about current submission routes; review, rights clearance, regulatory review, and scheduling must not be assumed.
            </p>
          </div>
        </div>

        <!-- Item 4: Verification -->
        <div class="vmn-accordion-item card s-njnyYzrM3s s-C-vYdLnHws" data-category="verification">
          <button type="button" class="vmn-accordion-trigger s-nCsaVwVLOM s-55eBhiVpC2" aria-expanded="false">
            <span>Where can I verify an AFCA Certificate or Proof-of-Air Report?</span>
            <span class="vmn-accordion-chevron s-yfQOyq2J91">&darr;</span>
          </button>
          <div class="vmn-accordion-content s-quDx9pSmFp">
            <p class="s-WUIZpJO7QW s-vmjIwCOhxD">
              The verification pages report records available in this environment. A hash alone does not establish that a source record, credential, transmission, or underlying evidence is authentic or current. <a href="/verify/afca" class="s-cHOzN4N0WC s-gHG6J8VgpN">/verify/afca</a> and <a href="/verify/poa" class="s-cHOzN4N0WC s-gHG6J8VgpN">/verify/poa</a> are record lookup paths.
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Resource Action Tiles -->
      <div class="s-QWNYiCEA7H">
        <a href="/verify/afca" class="card s-16JqXqkOQI">
          <div class="s-qBZWiU_8no">Credentials</div>
          <div class="s-kBmBW0Sax6">AFCA Certificate Lookup &rarr;</div>
          <p class="s-PbKxN1t6PQ">Verify graduate credentials and certificates.</p>
        </a>
        <a href="/verify/poa" class="card s-16JqXqkOQI">
          <div class="s-W6NHBmqlOm">Compliance</div>
          <div class="s-kBmBW0Sax6">Proof-of-Air Reports &rarr;</div>
          <p class="s-PbKxN1t6PQ">Inspect broadcast log hashes and airings.</p>
        </a>
        <a href="/contact" class="card s-16JqXqkOQI">
          <div class="s-zZZf1zf5Xs">Support</div>
          <div class="s-kBmBW0Sax6">Submit Support Desk Query &rarr;</div>
          <p class="s-PbKxN1t6PQ">Reach out for assistance or enquiries.</p>
        </a>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-027: Privacy Information
 */
export function renderPrivacyPageHtml(): string {
  return `
    <article class="container s-Gq1CYI3m9m s-B53IFVudWu">
      <header class="s-MCZWkljUQG s-d0pMqi1kxm">
        <span class="vmn-badge badge-ready s-x7OYcwftt2">Legal &amp; Privacy Governance</span>
        <h1 class="s-yrxYod1Dke s-0TijWy9XkZ">
          Privacy Policy & Data Protection Notice
        </h1>
        <p class="s-58Gu8QFAOn s-_PeHSOZsc3">
          This page is a preliminary information surface, not a reviewed privacy notice or a representation of legal compliance. Retention, lawful basis, data-subject processes, and contact details require approval by VMNL's accountable privacy and legal reviewers.
        </p>
      </header>

      <div class="card s-twPUsMLc3n s-e-P44oULsV">
        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">1. Information We Collect</h2>
        <p class="s-BFqsiZ1_zP s-IlaKCYYtO0">
          The forms on this site may request contact and enquiry information. The purposes, retention periods, recipients, and data-subject process for each workflow have not been confirmed in this page; avoid submitting sensitive personal information until an approved notice is published.
        </p>

        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">2. Lawful Basis for Processing</h2>
        <p class="s-BFqsiZ1_zP s-IlaKCYYtO0">
          This page does not determine or represent a lawful basis for any processing. That basis and the associated notice require review and approval by VMNL's accountable privacy and legal reviewers.
        </p>

        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">3. Data Security &amp; Storage</h2>
        <p class="s-BFqsiZ1_zP s-IlaKCYYtO0">
          This page does not make claims about encryption, access controls, data sharing, or security certification. Those controls and any no-sale representation require verification against deployed systems and an approved privacy notice.
        </p>

        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">4. Data Protection Officer</h2>
        <p class="s-BzO-bkuWLq">
          A verified privacy contact and complete data-subject request process have not been confirmed for publication. Do not rely on this preliminary page as instructions for exercising privacy rights.
        </p>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-028: Accessibility Information
 */
export function renderAccessibilityPageHtml(): string {
  return `
    <article class="container s-Gq1CYI3m9m s-B53IFVudWu">
      <header class="s-MCZWkljUQG s-d0pMqi1kxm">
        <span class="vmn-badge badge-ready s-x7OYcwftt2">Digital Inclusion</span>
        <h1 class="s-yrxYod1Dke s-0TijWy9XkZ">
          Accessibility Statement — Conformance Not Yet Assessed
        </h1>
        <p class="s-58Gu8QFAOn s-_PeHSOZsc3">
          Accessibility is an engineering target. Manual keyboard, screen-reader, mobile, and WCAG 2.2 AA conformance reviews remain outstanding; this page does not claim conformance.
        </p>
      </header>

      <div class="card s-twPUsMLc3n s-e-P44oULsV">
        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">Conformance Standard</h2>
        <p class="s-BFqsiZ1_zP s-IlaKCYYtO0">
          WCAG 2.2 Level AA is a target, not a verified conformance claim. Coverage across public and authenticated workflows has not been established by a complete manual and assistive-technology assessment.
        </p>

        <h2 class="s-aMXDq93VWh s-TVhtuC-n9q">Key Accessibility Implementations</h2>
        <ul class="s-bG9yzdLYMU s-njmTx_bVvS">
          <li class="s-TRQR2hUn7G">Accessibility checks and design tokens exist in parts of the application; they are not evidence that every rendered page or workflow meets a conformance criterion.</li>
          <li>Keyboard-only, screen-reader, contrast, zoom/reflow, and mobile reviews are outstanding and must be completed before a conformance claim is made.</li>
        </ul>

        <h2 class="s-aMXDq93VWh s-iFf1hHkJI3">Feedback &amp; Assistance</h2>
        <p class="s-BzO-bkuWLq">
          If you encounter any accessibility barriers on our digital platforms, please reach out to our team at <code class="s-FgPBD5MSYz s-i7e4MMq5Hu">accessibility@vmnl.ng</code>.
        </p>
      </div>
    </article>
  `;
}
