/**
 * Surface B & C — Creative Hub, Talent & Production Cockpits (Desks 25–36)
 * Authority: VMNL-AZP-VMN-CCPP-001 (§20–§23) / PRD §17
 */


// ----------------------------------------------------------------------------
// 25. TALENT PARTNER NETWORK COCKPIT
// ----------------------------------------------------------------------------
export function renderTalentCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">TALENT NETWORK</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Talent Accelerator Partner Network Desk</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/portal/vtm" class="btn btn-outline btn-sm text-xs font-bold">Open Talent Portal &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ONBOARDED TALENT</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">324 Artists</span>
          <span class="text-xs text-muted block mt-0.5">Actors, Writers, Voice</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">VERIFIED BIO CARDS</span>
          <span class="text-lg font-bold block mt-1 text-success">98.4% Verified</span>
          <span class="text-xs text-muted block mt-0.5">Showreels / KYC Bank</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE CASTINGS</span>
          <span class="text-lg font-bold block mt-1 text-primary">12 Roles Open</span>
          <span class="text-xs text-muted block mt-0.5">₦45M Total Budget</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ESCROW PROTECTION</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Guaranteed</span>
          <span class="text-xs text-muted block mt-0.5">85/15 Net Payouts</span>
        </div>
      </div>

      <!-- Verified Talent Roster Register -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Verified Talent Bio-Cards &amp; Active Castings</span>
          <span class="vmn-badge badge-ready text-xs">85/15 Statutory Escrow Guarded</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Talent ID</th>
                <th class="py-2">Artist / Creator</th>
                <th class="py-2">Discipline &amp; Guild</th>
                <th class="py-2">KYC &amp; Showreel</th>
                <th class="py-2">Assigned Production</th>
                <th class="py-2">Escrow Split</th>
                <th class="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TLN-2026-081</td>
                <td class="font-bold text-slate-100">Chioma Adeyemi</td>
                <td>Lead Dramatic Actress &bull; AGN Mapped</td>
                <td><span class="vmn-badge badge-success text-xs">KYC VERIFIED (Tier-2)</span></td>
                <td class="text-slate-200">Project "Oloibiri Rising"</td>
                <td class="font-mono text-slate-300">85% Disbursable</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Active on Set</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TLN-2026-082</td>
                <td class="font-bold text-slate-100">Tunde Bakare</td>
                <td>Head Screenwriter &bull; WGN Fellow</td>
                <td><span class="vmn-badge badge-success text-xs">KYC VERIFIED (Tier-2)</span></td>
                <td class="text-slate-200">Series "Lagos Noir" (Ep 1–6)</td>
                <td class="font-mono text-slate-300">85% Disbursable</td>
                <td class="text-right"><span class="vmn-badge badge-info text-xs">SCRIPT REVIEW</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TLN-2026-083</td>
                <td class="font-bold text-slate-100">Amina Yusuf</td>
                <td>Voiceover &amp; ADR &bull; Pan-African Guild</td>
                <td><span class="vmn-badge badge-success text-xs">KYC VERIFIED (Tier-2)</span></td>
                <td class="text-slate-200">IMBD Station ID &amp; Promos</td>
                <td class="font-mono text-slate-300">85% Disbursable</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">BOOKED</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TLN-2026-084</td>
                <td class="font-bold text-slate-100">Emeka Obi</td>
                <td>Director of Photography &bull; NSC</td>
                <td><span class="vmn-badge badge-success text-xs">KYC VERIFIED (Tier-2)</span></td>
                <td class="text-slate-200">Soundstage A Lighting Unit</td>
                <td class="font-mono text-slate-300">85% Disbursable</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">ASSIGNED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 26. AFCA LEARNING & ASSESSMENT COCKPIT
// ----------------------------------------------------------------------------
export function renderAfcaCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">ACADEMY LMS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">AFCA Learning, Competency &amp; Assessment Hub</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/afca" class="btn btn-primary btn-sm text-xs font-bold">Open Learning Plan &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ENROLLED STUDENTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">186 Fellows</span>
          <span class="text-xs text-muted block mt-0.5">Film &amp; Broadcast Tracks</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COURSE COMPLETION</span>
          <span class="text-lg font-bold block mt-1 text-success">91.4% Rate</span>
          <span class="text-xs text-muted block mt-0.5">Curriculum Adherence</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COURSEWORK PENDING</span>
          <span class="text-lg font-bold block mt-1 text-primary">14 Submissions</span>
          <span class="text-xs text-muted block mt-0.5">Faculty Grading Queue</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CERTIFICATES ISSUED</span>
          <span class="text-lg font-bold block mt-1 text-success">142 Competencies</span>
          <span class="text-xs text-muted block mt-0.5">Accredited by VMN</span>
        </div>
      </div>

      <!-- AFCA Fellow Cohorts & Competency Assessment Registry -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">AFCA Fellow Cohorts &amp; Competency Assessment Registry</span>
          <span class="vmn-badge badge-ready text-xs">Accredited Professional Certification</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Fellow Ref</th>
                <th class="py-2">Student Fellow</th>
                <th class="py-2">Specialization Track</th>
                <th class="py-2">Module / Capstone</th>
                <th class="py-2">Score</th>
                <th class="py-2">Competency Rating</th>
                <th class="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-2026-F01</td>
                <td class="font-bold text-slate-100">Kemi Alabi</td>
                <td>Directing &amp; Cinematography</td>
                <td>35mm Anamorphic Lighting &amp; Rigging</td>
                <td class="font-mono text-success font-bold">96 / 100</td>
                <td><span class="vmn-badge badge-success text-xs">DISTINCTION</span></td>
                <td class="text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Competency certificate dispatched to Kemi Alabi" data-toast-type="success">Dispatched</button>
                </td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-2026-F02</td>
                <td class="font-bold text-slate-100">Segun Adebayo</td>
                <td>Acoustic &amp; Sound Engineering</td>
                <td>Dolby Atmos 7.1.4 Theatrical Mix</td>
                <td class="font-mono text-slate-200">91 / 100</td>
                <td><span class="vmn-badge badge-ready text-xs">PASSED</span></td>
                <td class="text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Competency certificate dispatched to Segun Adebayo" data-toast-type="success">Dispatched</button>
                </td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-2026-F03</td>
                <td class="font-bold text-slate-100">Ngozi Eze</td>
                <td>Screenwriting &amp; Dramaturgy</td>
                <td>Narrative Arc &amp; 10-Ep Series Bible</td>
                <td class="font-mono text-slate-200">88 / 100</td>
                <td><span class="vmn-badge badge-ready text-xs">PASSED</span></td>
                <td class="text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Competency certificate dispatched to Ngozi Eze" data-toast-type="success">Dispatched</button>
                </td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-2026-F04</td>
                <td class="font-bold text-slate-100">Babatunde Ojo</td>
                <td>Linear MCR Playout Operations</td>
                <td>SCTE-35 Splice Cues &amp; As-Run Logging</td>
                <td class="font-mono text-success font-bold">94 / 100</td>
                <td><span class="vmn-badge badge-success text-xs">DISTINCTION</span></td>
                <td class="text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Competency certificate dispatched to Babatunde Ojo" data-toast-type="success">Dispatched</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 27. COMMUNITY GUILDS & MENTORSHIP COCKPIT
// ----------------------------------------------------------------------------
export function renderCommunityCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">COMMUNITY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Afro-Fusion Guilds &amp; Mentorship Workspace</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">GUILD MEMBERS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">540 Creators</span>
          <span class="text-xs text-muted block mt-0.5">Writers, Directors, Cinematographers</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE MENTORS</span>
          <span class="text-lg font-bold block mt-1 text-primary">28 Industry Leads</span>
          <span class="text-xs text-muted block mt-0.5">Nollywood Veterans</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PAIRED SESSIONS</span>
          <span class="text-lg font-bold block mt-1 text-success">86 Completed</span>
          <span class="text-xs text-muted block mt-0.5">Script &amp; Look Development</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MASTERCLASSES</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">4 Monthly</span>
          <span class="text-xs text-muted block mt-0.5">Live Studio Broadcast</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 28. VTM TALENT DEAL DESK COCKPIT
// ----------------------------------------------------------------------------
export function renderVtmCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">VTM DEALS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Virtual Talent Management Deal Desk &amp; Escrow</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/portal/vtm/release-wizard" class="btn btn-primary btn-sm text-xs font-bold">Release Escrow Milestone &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ESCROW HELD</span>
          <span class="text-lg font-bold block mt-1 text-success">₦64,500,000</span>
          <span class="text-xs text-muted block mt-0.5">Protected Funds</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE CONTRACTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">22 Engagements</span>
          <span class="text-xs text-muted block mt-0.5">85/15 Standard Split</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DISBURSED YTD</span>
          <span class="text-lg font-bold block mt-1 text-primary">₦184,200,000</span>
          <span class="text-xs text-muted block mt-0.5">Net Payout to Creators</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">BUYOUT TIERS</span>
          <span class="text-lg font-bold block mt-1 text-success">4 Standardized</span>
          <span class="text-xs text-muted block mt-0.5">Local, DTT, Africa, Global</span>
        </div>
      </div>

      <!-- VTM Commercial Engagements & Escrow Milestones Ledger -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">VTM Commercial Engagements &amp; Escrow Milestones Ledger</span>
          <span class="vmn-badge badge-ready text-xs">85/15 Guaranteed Split Protection</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Contract Ref</th>
                <th class="py-2">Creator / Talent</th>
                <th class="py-2">Campaign / Client</th>
                <th class="py-2">Escrow Total</th>
                <th class="py-2">Creator Net (85%)</th>
                <th class="py-2">Milestone Stage</th>
                <th class="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">VTM-ENG-091</td>
                <td class="font-bold text-slate-100">Funke Daniels</td>
                <td>Coca-Cola Festive "Real Magic"</td>
                <td class="font-mono text-slate-200">₦24,000,000</td>
                <td class="font-mono text-success font-bold">₦20,400,000</td>
                <td><span class="vmn-badge badge-warning text-xs">MILESTONE 2: SHOOT WRAP</span></td>
                <td class="text-right">
                  <a href="/portal/vtm/release-wizard" class="btn btn-primary btn-xs" data-toast="Escrow milestone release initiated" data-toast-type="info">Release Tranche</a>
                </td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">VTM-ENG-092</td>
                <td class="font-bold text-slate-100">David Adeleke</td>
                <td>Guinness VIP Heritage Brand</td>
                <td class="font-mono text-slate-200">₦35,000,000</td>
                <td class="font-mono text-success font-bold">₦29,750,000</td>
                <td><span class="vmn-badge badge-info text-xs">MILESTONE 1: LAUNCH AIR</span></td>
                <td class="text-right">
                  <a href="/portal/vtm/release-wizard" class="btn btn-outline btn-xs">Inspect Proof</a>
                </td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">VTM-ENG-093</td>
                <td class="font-bold text-slate-100">Simi Olatunji</td>
                <td>MTN Pulse Campus Tour Brand</td>
                <td class="font-mono text-slate-200">₦18,500,000</td>
                <td class="font-mono text-success font-bold">₦15,725,000</td>
                <td><span class="vmn-badge badge-success text-xs">MILESTONE 3: COMPLETED</span></td>
                <td class="text-right">
                  <button type="button" class="btn btn-outline btn-xs" disabled>Settled via NIP</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 32. TEND B2B RIGHTS CATALOGUE COCKPIT
// ----------------------------------------------------------------------------
export function renderTendCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">B2B SYNDICATION</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">TEND B2B Rights Catalogue &amp; Licence Manager</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="B2B Syndication license agreement drafted" data-toast-type="success">
            + Grant B2B License
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TITLES LICENSED</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">148 Feature / Series</span>
          <span class="text-xs text-muted block mt-0.5">African Cinema Catalog</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SYNDICATION BUYERS</span>
          <span class="text-lg font-bold block mt-1 text-primary">16 Broadcasters</span>
          <span class="text-xs text-muted block mt-0.5">Europe, US, Diaspora</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE ROYALTIES</span>
          <span class="text-lg font-bold block mt-1 text-success">₦48.6M Quarter</span>
          <span class="text-xs text-muted block mt-0.5">Producer Passthrough</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">HOLDBACK TIMERS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">Enforced</span>
          <span class="text-xs text-muted block mt-0.5">Linear First Window Safe</span>
        </div>
      </div>

      <!-- TEND Syndication Rights Catalogue Registry -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">TEND Syndication Rights &amp; B2B Distribution Catalogue</span>
          <span class="vmn-badge badge-ready text-xs">Chain-of-Title Certified <span class="sr-only">CA-32</span></span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Catalog ID</th>
                <th class="py-2">Production Title</th>
                <th class="py-2">Format &amp; Runtime</th>
                <th class="py-2">Territorial Scope</th>
                <th class="py-2">Broadcaster Partner</th>
                <th class="py-2">Holdback State</th>
                <th class="py-2 text-right">Royalty Yield</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TEND-CAT-014</td>
                <td class="font-bold text-slate-100">The Lost Okoroshi</td>
                <td>4K UHD Feature &bull; 108 Min</td>
                <td>Sub-Saharan Africa &amp; EU</td>
                <td class="text-slate-200">Canal+ Afrique</td>
                <td><span class="vmn-badge badge-success text-xs">90D LINEAR EXCLUSIVE</span></td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦14,200,000/yr</td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TEND-CAT-015</td>
                <td class="font-bold text-slate-100">Lagos Rhythm &amp; Soul</td>
                <td>Docuseries &bull; 6x50 Min</td>
                <td>North America &amp; UK Diaspora</td>
                <td class="text-slate-200">AfroStream Global</td>
                <td><span class="vmn-badge badge-info text-xs">Streaming Window Active</span></td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦18,600,000/yr</td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">TEND-CAT-016</td>
                <td class="font-bold text-slate-100">Ancestral Voices</td>
                <td>HD Animation &bull; 12x22 Min</td>
                <td>West Africa Free-To-Air</td>
                <td class="text-slate-200">NTA Network</td>
                <td><span class="vmn-badge badge-ready text-xs">Terrestrial First Window</span></td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦8,400,000/yr</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 33. SOUNDSTAGE OPERATIONS COCKPIT
// ----------------------------------------------------------------------------
export function renderSoundstageCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">STUDIO FACILITIES</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Studio Soundstage, Acoustical &amp; Set Operations</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="Soundstage reservation request submitted" data-toast-type="success">
            + Reserve Soundstage
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SOUNDSTAGE A (8,000 SQFT)</span>
          <span class="text-lg font-bold block mt-1 text-primary">In Session</span>
          <span class="text-xs text-muted block mt-0.5">Drama Series Production</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SOUNDSTAGE B (5,000 SQFT)</span>
          <span class="text-lg font-bold block mt-1 text-success">Available</span>
          <span class="text-xs text-muted block mt-0.5">Lighting Grid Armed</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACOUSTICAL ISOLATION</span>
          <span class="text-lg font-bold block mt-1 text-success">NC-25 (Verified)</span>
          <span class="text-xs text-muted block mt-0.5">Silent HVAC Running</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">GRID POWER LOAD</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">120 kW / 300 kW</span>
          <span class="text-xs text-muted block mt-0.5">Solar Hybrid Supply</span>
        </div>
      </div>

      <!-- Soundstage Production & Grid Schedule Registry -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Studio Soundstage &amp; Acoustical Grid Schedule</span>
          <span class="vmn-badge badge-ready text-xs">Acoustical NC-25 Certified</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Soundstage Bay</th>
                <th class="py-2">Production Title</th>
                <th class="py-2">Production Lead</th>
                <th class="py-2">Call Schedule</th>
                <th class="py-2">Acoustic Isolation</th>
                <th class="py-2">Power Load</th>
                <th class="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">Soundstage A (8,000 sqft)</td>
                <td class="font-bold text-primary">Project "Oloibiri Rising"</td>
                <td class="text-slate-300">VMN Original Productions</td>
                <td class="font-mono text-muted">06:30 – 18:30 WAT</td>
                <td><span class="vmn-badge badge-success text-xs">NC-25 VERIFIED</span></td>
                <td class="font-mono text-slate-200">85 kW (Solar Hybrid)</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">IN SESSION</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">Soundstage B (5,000 sqft)</td>
                <td class="font-bold text-slate-200">Coca-Cola Festive Commercial</td>
                <td class="text-slate-300">MediaReach / 1Studios</td>
                <td class="font-mono text-muted">14:00 – 22:00 WAT</td>
                <td><span class="vmn-badge badge-success text-xs">NC-25 VERIFIED</span></td>
                <td class="font-mono text-slate-200">35 kW (Grid / Inverter)</td>
                <td class="text-right"><span class="vmn-badge badge-info text-xs">ARMED &bull; STANDBY</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">LED Volume Bay (Virtual Prod)</td>
                <td class="font-bold text-slate-200">Flutterwave Tech Hour</td>
                <td class="text-slate-300">Cr8Tech Virtual Production</td>
                <td class="font-mono text-muted">09:00 – 17:00 WAT</td>
                <td><span class="vmn-badge badge-success text-xs">NC-25 VERIFIED</span></td>
                <td class="font-mono text-slate-200">45 kW (Solar Clean)</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">CALIBRATED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 34. CAMERA & GEAR LOCKER COCKPIT
// ----------------------------------------------------------------------------
export function renderGearCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">CAMERA &amp; GRIP</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Film Camera &amp; Grip Equipment Gear Locker</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="Equipment checkout signoff verified" data-toast-type="success">
            + Equipment Check-Out
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CINEMA PACKAGES</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">8 Kits Active</span>
          <span class="text-xs text-muted block mt-0.5">ARRI Alexa Mini LF / RED</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ANAMORPHIC GLASS</span>
          <span class="text-lg font-bold block mt-1 text-primary">3 Full Sets</span>
          <span class="text-xs text-muted block mt-0.5">Cooke / Atlas Anamorphic</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHECKOUT INSPECTIONS</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Passed</span>
          <span class="text-xs text-muted block mt-0.5">Sensor &amp; Flange Calibrated</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">INSURANCE VALUE</span>
          <span class="text-lg font-bold block mt-1 text-success">₦450M Covered</span>
          <span class="text-xs text-muted block mt-0.5">Lloyds Marine Policy</span>
        </div>
      </div>

      <!-- Film Camera, Grip & Lighting Master Gear Locker Registry -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Film Camera, Grip &amp; Lighting Master Equipment Register</span>
          <span class="vmn-badge badge-ready text-xs">Marine Policy Insured</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Asset Tag</th>
                <th class="py-2">Equipment Package</th>
                <th class="py-2">Serial / Batch</th>
                <th class="py-2">Assigned Unit / DP</th>
                <th class="py-2">Calibration Spec</th>
                <th class="py-2">Insured Value</th>
                <th class="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">GEAR-CAM-001</td>
                <td class="font-bold text-slate-100">ARRI Alexa Mini LF Cinema Package</td>
                <td class="font-mono text-muted">SN: 6428-LF</td>
                <td class="text-slate-200">Emeka Obi (Soundstage A)</td>
                <td><span class="vmn-badge badge-success text-xs">FLANGE COLLIMATED</span></td>
                <td class="font-mono text-slate-300">₦85,000,000</td>
                <td class="text-right"><span class="vmn-badge badge-warning text-xs">CHECKED OUT</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">GEAR-LENS-004</td>
                <td class="font-bold text-slate-100">Cooke Anamorphic /i Prime Set (5-Lens)</td>
                <td class="font-mono text-muted">SN: CK-AN-992</td>
                <td class="text-slate-200">Camera Unit "Oloibiri Rising"</td>
                <td><span class="vmn-badge badge-success text-xs">OPTICS CENTERED</span></td>
                <td class="font-mono text-slate-300">₦45,000,000</td>
                <td class="text-right"><span class="vmn-badge badge-warning text-xs">CHECKED OUT</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">GEAR-LGT-009</td>
                <td class="font-bold text-slate-100">Aputure 1200d Pro Daylight Kit (2-Head)</td>
                <td class="font-mono text-muted">SN: AP-1200-11</td>
                <td class="text-slate-200">Grip &amp; Lighting Bay 2</td>
                <td><span class="vmn-badge badge-success text-xs">BALLAST CERTIFIED</span></td>
                <td class="font-mono text-slate-300">₦18,000,000</td>
                <td class="text-right"><span class="vmn-badge badge-success text-xs">AVAILABLE</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">GEAR-AUD-002</td>
                <td class="font-bold text-slate-100">Sound Devices 888 16-Ch Audio Recorder</td>
                <td class="font-mono text-muted">SN: SD-888-04</td>
                <td class="text-slate-200">Field Sound Unit 1</td>
                <td><span class="vmn-badge badge-success text-xs">TIMECODE SYNCHRONIZED</span></td>
                <td class="font-mono text-slate-300">₦12,000,000</td>
                <td class="text-right"><span class="vmn-badge badge-warning text-xs">CHECKED OUT</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 35. POST-PRODUCTION & COLOR PIPELINE COCKPIT
// ----------------------------------------------------------------------------
export function renderPostproductionCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">POST-PRODUCTION</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Post-Production &amp; Color Grading Pipeline Desk</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="Master render job submitted to GPU farm" data-toast-type="success">
            + Queue Master Render
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COLOR SUITES</span>
          <span class="text-lg font-bold block mt-1 text-primary">2 Active Grade</span>
          <span class="text-xs text-muted block mt-0.5">DaVinci Resolve Studio 19</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DOLBY ATMOS SUITE</span>
          <span class="text-lg font-bold block mt-1 text-success">7.1.4 Certified</span>
          <span class="text-xs text-muted block mt-0.5">Theatrical Mix Station</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RENDER FARM</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">12 GPU Nodes</span>
          <span class="text-xs text-muted block mt-0.5">ProRes 4444XQ Exports</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DCI-P3 CALIBRATION</span>
          <span class="text-lg font-bold block mt-1 text-success">Calibrated (DeltaE &lt; 1)</span>
          <span class="text-xs text-muted block mt-0.5">Sony BVM-HX310 Master</span>
        </div>
      </div>

      <!-- Post-Production Master Grading & Theatrical Mix Queue -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Post-Production Master Grading &amp; Theatrical Mix Queue</span>
          <span class="vmn-badge badge-ready text-xs">DeltaE &lt; 1 Reference Master</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Suite / Bay</th>
                <th class="py-2">Project &amp; Reel</th>
                <th class="py-2">Lead Colorist / Engineer</th>
                <th class="py-2">Target Format &amp; Color Space</th>
                <th class="py-2">Render Progress</th>
                <th class="py-2 text-right">QC State</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">Color Suite 1 (DaVinci 19)</td>
                <td class="font-bold text-primary">Project "Oloibiri Rising" (Reel 3)</td>
                <td class="text-slate-300">Biodun Adeleke</td>
                <td class="font-mono text-muted">ProRes 4444XQ &bull; DCI-P3</td>
                <td class="font-mono text-primary font-bold">84% (GPU Farm)</td>
                <td class="text-right"><span class="vmn-badge badge-info text-xs">IN GRADING</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">Dolby Atmos Suite (7.1.4)</td>
                <td class="font-bold text-slate-200">Series "Lagos Noir" (Ep 4)</td>
                <td class="text-slate-300">Chuka Okoro</td>
                <td class="font-mono text-muted">ADM BWF &bull; EBU R128 (-23 LUFS)</td>
                <td class="font-mono text-success font-bold">100% Complete</td>
                <td class="text-right"><span class="vmn-badge badge-success text-xs">PASSED QC</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-bold text-slate-100">Finishing Bay (DCP)</td>
                <td class="font-bold text-slate-200">The Lost Okoroshi</td>
                <td class="text-slate-300">Fatima Bello</td>
                <td class="font-mono text-muted">DCI SMPTE DCP &bull; 4K Encrypted</td>
                <td class="font-mono text-primary font-bold">60% Encoding</td>
                <td class="text-right"><span class="vmn-badge badge-warning text-xs">ENCODING</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 36. ALUMNI GUILD REGISTRY COCKPIT
// ----------------------------------------------------------------------------
export function renderAlumniCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">ALUMNI CAREERS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">AFCA Alumni Career Placement &amp; Guild Registry</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">GRADUATES PLACED</span>
          <span class="text-lg font-bold block mt-1 text-success">94.2% Rate</span>
          <span class="text-xs text-muted block mt-0.5">Broadcasters &amp; Studios</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ALUMNI IN INDUSTRY</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">320 Professionals</span>
          <span class="text-xs text-muted block mt-0.5">Across 8 African Countries</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">NOLLYWOOD CREDITS</span>
          <span class="text-lg font-bold block mt-1 text-primary">48 Feature Films</span>
          <span class="text-xs text-muted block mt-0.5">Cinema Box Office</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COMMUNITY DIRECTORY</span>
          <span class="text-lg font-bold block mt-1 text-success">Active Guild</span>
          <span class="text-xs text-muted block mt-0.5">Job Board &amp; Network</span>
        </div>
      </div>

      <!-- AFCA Alumni Career Placement & Production Credits Register -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">AFCA Alumni Career Placement &amp; Production Credits Register</span>
          <span class="vmn-badge badge-ready text-xs">Accredited Alumni Network</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Alumni Ref</th>
                <th class="py-2">Fellow Graduate</th>
                <th class="py-2">Class Cohort</th>
                <th class="py-2">Industry Placement / Studio</th>
                <th class="py-2">Notable Production Credit</th>
                <th class="py-2 text-right">Guild Association</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-ALM-034</td>
                <td class="font-bold text-slate-100">Tobi Amusan</td>
                <td class="font-mono text-muted">Class of 2024</td>
                <td class="text-slate-200">Lead Colorist &bull; EbonyLife Studios</td>
                <td class="font-bold text-slate-200">"King of Boys: The Return"</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">NIGERIAN COLORISTS</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-ALM-035</td>
                <td class="font-bold text-slate-100">Maryam Sani</td>
                <td class="font-mono text-muted">Class of 2025</td>
                <td class="text-slate-200">Assistant Director &bull; StarTimes Network</td>
                <td class="font-bold text-slate-200">"Afro-Fusion Showcase"</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">DGN DIRECTORS GUILD</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary font-bold">AFCA-ALM-036</td>
                <td class="font-bold text-slate-100">Ibrahim Bello</td>
                <td class="font-mono text-muted">Class of 2025</td>
                <td class="text-slate-200">Supervising Sound Editor &bull; VMN MCR</td>
                <td class="font-bold text-slate-200">"Oloibiri Rising"</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">AUDIO ENG SOCIETY</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
