/**
 * Surface A — VMN Public Web Experience Pages
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§8, §9, §10)
 *
 * Implements all 20 Surface A Public Web Experience pages:
 * 1. Home / Corporate Front Door (/)
 * 2. TV & Broadcast Overview Hub (/channels)
 * 3. Nigezie Xtreme Channel Page (/channels/nxtr)
 * 4. Orisun — The Source Channel Page (/channels/orisun)
 * 5. Isi Mbido — The Beginning Channel Page (/channels/isimbido)
 * 6. Public Programme Detail Page (/programmes/:id)
 * 7. Creative Economy Hub (/hub)
 * 8. Talent Accelerator Network (/hub/talent)
 * 9. Learn (AFCA Academy) (/hub/afca)
 * 10. Creators & Talent Gateway (/hub/creators)
 * 11. Afro-Fusion Creatives Community Presence (/hub/community)
 * 12. VTM (Verified Talent Marketplace) (/hub/vtm)
 * 13. Production (ONE Studios & VCF) (/hub/production)
 * 14. Events (Fusion Events) (/hub/events)
 * 15. Technology (Cr8TechNG) (/hub/technology)
 * 16. Distribution & Syndication (TEND) (/hub/distribution)
 * 17. Commercial Partners & Sponsors (/partners)
 * 18. Insights & Research (HeadspaceNG) (/insights)
 * 19. Careers Directory (/careers)
 * 20. Azeebo+ Information & App Gateway (Open Azeebo+) (/azeebo)
 */

import { PUBLIC_CHANNELS } from "./channels.js";

// Helper for UI badges
function renderBadge(text: string, type: "live" | "ready" | "info" = "info"): string {
  return `<span class="vmn-badge badge-${type}">${text}</span>`;
}

// 3. Nigezie Xtreme Channel Page (/channels/nxtr)
// 4. Orisun Channel Page (/channels/orisun)
// 5. Isi Mbido Channel Page (/channels/isimbido)
export function renderChannelDetailPageHtml(channelCode: "NXTR" | "ORIS" | "IMBD"): string {
  const channel = PUBLIC_CHANNELS.find((c) => c.code === channelCode);
  if (!channel) {
    return `<div class="card" style="text-align:center; padding:48px 24px;"><h1>Channel Not Found</h1><p>The requested linear channel is not in the active registry.</p><a href="/channels" class="btn btn-primary" style="margin-top:16px;">&larr; Back to Channels</a></div>`;
  }

  const scheduleItems = [
    { time: "06:00 - 08:30", title: "Early Riser Afro-Beats", type: "Music / Video Playlist", rating: "PG" },
    { time: "08:30 - 10:00", title: "Street Pulse Morning Digest", type: "Youth Live Chat", rating: "PG-13" },
    { time: "10:00 - 12:00", title: "Afro-Fusion Top 20 Countdown", type: "Chart Show", rating: "PG" },
    { time: "12:00 - 14:00", title: "VTM Spotlight: Emerging Stars", type: "Talent Showcase", rating: "PG-13" },
    { time: "14:00 - 17:00", title: "Non-Stop Afro-Club Hits", type: "Music Videos", rating: "PG" },
    { time: "17:00 - 18:30", title: "ONE Studios Original: Street Beats", type: "Episodic Drama", rating: "15+" },
    { time: "18:30 - 21:00", title: "Prime Time LIVE Showcase", type: "Flagship Broadcast", rating: "PG-13" },
    { time: "21:00 - 23:00", title: "Nollywood Midnight Cinema", type: "Feature Film", rating: "18+" },
  ];

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/channels" style="color:var(--vmn-secondary); text-decoration:none;">Channels</a> &gt; 
      <span>${channel.name}</span>
    </nav>

    <!-- Channel Header Banner -->
    <div class="card" style="border-left:6px solid ${channel.accentColor}; background: linear-gradient(to right, #FFFFFF, var(--vmn-surface-alt));">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
            <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">${channel.name}</h1>
            <span class="vmn-badge badge-live">ON AIR LIVE</span>
          </div>
          <p style="font-size:1.15rem; font-weight:600; color:var(--vmn-text-muted); margin-bottom:12px;">${channel.tagline}</p>
          <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.9rem;">
            <span><strong>StarTimes DTT:</strong> Channel ${channel.dttChannel}</span>
            <span><strong>StarTimes DTH:</strong> Channel ${channel.dthChannel}</span>
            <span><strong>Genre:</strong> ${channel.genre}</span>
            <span><strong>Language:</strong> ${channel.primaryLanguage}</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <a href="/azeebo" class="btn btn-primary">Watch on Azeebo+ &rarr;</a>
          <a href="/broadcast/screens/SCR-BCST-14" class="btn btn-outline" style="font-size:0.8rem;">EPG Syndication Spec</a>
        </div>
      </div>
    </div>

    <!-- On Air Now & Up Next Component -->
    <div class="grid-2" style="margin-top:0;">
      <div class="card" style="background:#FEF2F2; border-color:#FECACA;">
        <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#DC2626; letter-spacing:0.05em;">Currently Airing</span>
        <h3 style="font-size:1.4rem; font-weight:800; color:#991B1B; margin-top:4px;">Urban Beats Live Prime</h3>
        <p style="font-size:0.9rem; color:#7F1D1D; margin-top:4px;">Broadcasting frame-accurate live studio mix with interactive on-screen QR codes.</p>
        <div style="display:flex; gap:8px; margin-top:12px;">
          ${renderBadge("1080i50 HD", "ready")}
          ${renderBadge("StarTimes Verified", "info")}
        </div>
      </div>

      <div class="card" style="background:#F0F9FF; border-color:#BAE6FD;">
        <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#0284C7; letter-spacing:0.05em;">Up Next at 21:00 WAT</span>
        <h3 style="font-size:1.4rem; font-weight:800; color:#075985; margin-top:4px;">Lagos Street Stories: Episode 4</h3>
        <p style="font-size:0.9rem; color:#0369A1; margin-top:4px;">ONE Studios original documentary exploring Afrobeats dance subcultures.</p>
        <div style="display:flex; gap:8px; margin-top:12px;">
          ${renderBadge("Premiere", "ready")}
          ${renderBadge("Age 15+", "info")}
        </div>
      </div>
    </div>

    <!-- 24-Hour Broadcast Schedule Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:1.25rem; font-weight:700;">24-Hour Broadcast Programme Schedule</h2>
        <span style="font-size:0.85rem; color:var(--vmn-text-muted);">Timezone: West Africa Time (WAT / UTC+1)</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--vmn-surface-border); color:var(--vmn-text-muted);">
              <th style="padding:10px 12px;">Air Time (WAT)</th>
              <th style="padding:10px 12px;">Programme Title</th>
              <th style="padding:10px 12px;">Type / Genre</th>
              <th style="padding:10px 12px;">Classification</th>
              <th style="padding:10px 12px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${scheduleItems
              .map(
                (item) => `
              <tr style="border-bottom:1px solid var(--vmn-surface-border);">
                <td style="padding:12px; font-weight:700; color:var(--vmn-primary);">${item.time}</td>
                <td style="padding:12px; font-weight:600;">${item.title}</td>
                <td style="padding:12px; color:var(--vmn-text-muted);">${item.type}</td>
                <td style="padding:12px;"><span style="background:#F1F5F9; color:#475569; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">${item.rating}</span></td>
                <td style="padding:12px;"><a href="/programmes/PRG-001" style="color:var(--vmn-secondary); text-decoration:none; font-weight:600;">View Detail &rarr;</a></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  `;
}

// 6. Public Programme Detail Page (/programmes/:id)
export function renderPublicProgrammeDetailHtml(programmeId: string): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px; max-width:960px; margin:0 auto;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/channels" style="color:var(--vmn-secondary); text-decoration:none;">Programmes</a> &gt; 
      <span>${programmeId}</span>
    </nav>

    <article class="card" style="border-top:5px solid var(--vmn-secondary);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <span style="font-family:monospace; font-weight:700; color:#0284C7; background:#E0F2FE; padding:3px 8px; border-radius:4px; font-size:0.85rem;">${programmeId}</span>
          <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary); margin-top:8px;">Urban Beats Live Prime</h1>
          <p style="font-size:1.1rem; color:var(--vmn-text-muted); margin-top:4px;">Nigeria's highest-energy daily youth music, culture, and street entertainment flagship.</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <span class="vmn-badge badge-ready">Broadcast Master QC Passed</span>
          <span style="font-size:0.85rem; color:var(--vmn-text-muted);">Broadcast on <strong>Nigezie Xtreme</strong></span>
        </div>
      </div>

      <hr style="border:none; border-top:1px solid var(--vmn-surface-border); margin:20px 0;" />

      <div class="grid-2" style="margin-top:0;">
        <div>
          <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:8px;">Synopsis & Production Arc</h2>
          <p style="font-size:0.95rem; color:var(--vmn-text-muted); line-height:1.6;">
            Recorded in the state-of-the-art ONE Studios Soundstage in Ikeja, Urban Beats Live bridges emerging Nigerian Afrobeats musicians, fashion designers, and digital creators with linear broadcast audiences across Sub-Saharan Africa.
          </p>
          <div style="margin-top:16px; display:flex; flex-wrap:wrap; gap:8px;">
            ${renderBadge("Soundstage A", "info")}
            ${renderBadge("5.1 Surround & Stereo", "info")}
            ${renderBadge("EBU R128 (-23 LUFS)", "ready")}
          </div>
        </div>

        <div>
          <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:8px;">Broadcast Transmission Slots</h2>
          <div style="background:var(--vmn-surface-alt); padding:16px; border-radius:8px; border:1px solid var(--vmn-surface-border);">
            <p><strong>Primary Run:</strong> Weekdays 18:30 – 21:00 WAT</p>
            <p><strong>Encore Repeat:</strong> Saturdays 14:00 – 16:30 WAT</p>
            <p><strong>Carriage:</strong> StarTimes DTT Ch 428 / DTH Ch 312</p>
            <p><strong>Azeebo+ Catch-Up:</strong> Available immediately post-broadcast</p>
          </div>
        </div>
      </div>

      <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--vmn-surface-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <a href="/channels/nxtr" class="btn btn-outline">&larr; Back to Channel</a>
        <a href="/azeebo" class="btn btn-primary">Stream Episodes on Azeebo+ &rarr;</a>
      </div>
    </article>
  </section>
  `;
}

// 8. Talent Accelerator Network (/hub/talent)
export function renderTalentAcceleratorPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Talent Accelerator</span>
    </nav>

    <div class="card" style="border-left:6px solid #0284C7;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Talent Accelerator Network</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        VMNL's nationwide talent discovery and career acceleration engine, linking creative practitioners across Nigeria with production slates, broadcast syndication, and brand sponsorships.
      </p>
    </div>

    <div class="grid-3" style="margin-top:0;">
      <div class="card">
        <h3>1. Multitier Evaluation</h3>
        <p>Rigorous 5-point assessment evaluating technical competence, industry readiness, and creative originality.</p>
        <span class="vmn-badge badge-ready">Tier 1 - Tier 4 Badges</span>
      </div>
      <div class="card">
        <h3>2. Partner Hub Desks</h3>
        <p>Physical partner co-working, rehearsal, and podcast recording spaces across Lagos, Abuja, Enugu, Ibadan, and Port Harcourt.</p>
        <span class="vmn-badge badge-info">12 Nationwide Hubs</span>
      </div>
      <div class="card">
        <h3>3. Commercial Representation</h3>
        <p>VTM talent deal desk, standardized day rates, and 15% platform escrow-protected fee contracts.</p>
        <span class="vmn-badge badge-ready">NDPR Compliant</span>
      </div>
    </div>

    <!-- Application Form Card -->
    <div class="card" style="max-width:720px; margin:0 auto; width:100%;">
      <h2 style="font-size:1.3rem; font-weight:700; margin-bottom:12px;">Submit Accelerator Application</h2>
      <form action="/api/v1/hub/talent/onboard" method="POST" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label style="display:block; font-weight:600; margin-bottom:4px; font-size:0.9rem;">Full Legal Name</label>
          <input type="text" name="fullName" required placeholder="e.g. Chioma Adebayo" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:1rem;" />
        </div>
        <div>
          <label style="display:block; font-weight:600; margin-bottom:4px; font-size:0.9rem;">Email Address</label>
          <input type="email" name="email" required placeholder="chioma@example.com" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:1rem;" />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="display:block; font-weight:600; margin-bottom:4px; font-size:0.9rem;">Primary Discipline</label>
            <select name="category" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:1rem; background:white;">
              <option value="ACTOR">Actor / Performer</option>
              <option value="DIRECTOR">Director</option>
              <option value="WRITER">Screenwriter</option>
              <option value="CINEMATOGRAPHER">Cinematographer</option>
              <option value="SOUND_ENGINEER">Sound Engineer</option>
              <option value="EDITOR">Film & Video Editor</option>
              <option value="MUSICIAN">Musician / Composer</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-weight:600; margin-bottom:4px; font-size:0.9rem;">Preferred Hub Location</label>
            <select name="hubLocation" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-size:1rem; background:white;">
              <option value="Lagos - Ikeja Hub">Lagos - Ikeja Central</option>
              <option value="Lagos - Lekki Hub">Lagos - Lekki Phase 1</option>
              <option value="Abuja - Wuse II Hub">Abuja - Wuse II</option>
              <option value="Enugu - Independence Layout">Enugu - Independence</option>
              <option value="Ibadan - Bodija Hub">Ibadan - Bodija</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:8px;">Submit Application to National Registrar &rarr;</button>
      </form>
    </div>
  </section>
  `;
}

// 9. Learn (AFCA Academy) (/hub/afca)
export function renderAfcaAcademyPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>AFCA Academy</span>
    </nav>

    <div class="card" style="border-left:6px solid #16A34A;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">African Film & Creative Arts Academy (AFCA)</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Accredited modular education in film production, broadcast operations, scriptwriting, and creative business management.
      </p>
    </div>

    <div class="grid-3" style="margin-top:0;">
      <div class="card">
        <h3>Broadcast Television Engineering</h3>
        <p>12-week comprehensive program covering playout automation, master control operations, audio loudness, and StarTimes transponder transmission.</p>
        <div style="margin-top:12px;"><span class="vmn-badge badge-ready">Accredited Certificate</span></div>
      </div>
      <div class="card">
        <h3>Cinematography & Lighting</h3>
        <p>Hands-on studio masterclasses at ONE Studios with ARRI, RED, and Sony FX cinema packages under veteran Nigerian DPs.</p>
        <div style="margin-top:12px;"><span class="vmn-badge badge-ready">Practical Studio Hours</span></div>
      </div>
      <div class="card">
        <h3>Creative Commercial Management</h3>
        <p>Entertainment law, rights licensing (TEND), IP valuation (HeadspaceNG), and slate finance structuring (VCF).</p>
        <div style="margin-top:12px;"><span class="vmn-badge badge-info">Executive Masterclass</span></div>
      </div>
    </div>
  </section>
  `;
}

// 10. Creators & Talent Gateway (/hub/creators)
export function renderCreatorsGatewayPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Creators & Talent</span>
    </nav>
    <div class="card" style="border-left:6px solid #D97706;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Creators & Talent Gateway</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Connecting social video creators, podcasters, and independent filmmakers to broadcast distribution and brand deals.
      </p>
      <div style="display:flex; gap:12px; margin-top:16px;">
        <a href="/hub/talent" class="btn btn-primary">Join Talent Network</a>
        <a href="/hub/vtm" class="btn btn-outline">Explore VTM Deals</a>
      </div>
    </div>
  </section>
  `;
}

// 11. Afro-Fusion Creatives Community Presence (/hub/community)
export function renderCommunityPresencePageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Afro-Fusion Creatives</span>
    </nav>
    <div class="card" style="border-left:6px solid #7C3AED;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Afro-Fusion Creatives Community</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        The national guild, mentorship, and co-working workspace uniting over 10,000 African digital creatives.
      </p>
    </div>
  </section>
  `;
}

// 12. VTM (Verified Talent Marketplace) (/hub/vtm)
export function renderVtmMarketplacePageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>VTM</span>
    </nav>
    <div class="card" style="border-left:6px solid #DC2626;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Verified Talent Marketplace (VTM)</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Protected engagements, automated rate cards, verified credentials, and escrow-backed milestone payouts.
      </p>
    </div>
  </section>
  `;
}

// 13. Production (ONE Studios & VCF) (/hub/production)
export function renderProductionPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Production (ONE Studios & VCF)</span>
    </nav>
    <div class="card" style="border-left:6px solid #0D9488;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Production: ONE Studios & VCF</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Soundstage infrastructure, camera gear rental, and 4-tier waterfall slate co-financing for premium African productions.
      </p>
    </div>
  </section>
  `;
}

// 14. Events (Fusion Events) (/hub/events)
export function renderEventsPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Fusion Events</span>
    </nav>
    <div class="card" style="border-left:6px solid #EC4899;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Fusion Events</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Experiential youth festivals, music concerts, and conferences with single-use HMAC-SHA256 turnstile verification.
      </p>
    </div>
  </section>
  `;
}

// 15. Technology (Cr8TechNG) (/hub/technology)
export function renderTechnologyPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>Cr8TechNG</span>
    </nav>
    <div class="card" style="border-left:6px solid #0284C7;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Cr8TechNG Creative Technology</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Automated multilingual subtitling (English, Yoruba, Igbo, Hausa, Pidgin), AI social clipping, and broadcast watermarking.
      </p>
    </div>
  </section>
  `;
}

// 16. Distribution & Syndication (TEND) (/hub/distribution)
export function renderDistributionPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/hub" style="color:var(--vmn-secondary); text-decoration:none;">Creative Hub</a> &gt; 
      <span>TEND Distribution</span>
    </nav>
    <div class="card" style="border-left:6px solid #2563EB;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">TEND B2B Rights & Syndication</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        B2B international licensing, territorial rights windows, and catalog exploitation management across Africa and global diaspora.
      </p>
    </div>
  </section>
  `;
}

// 17. Commercial Partners & Sponsors (/partners)
export function renderPartnersPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <span>Partners & Sponsors</span>
    </nav>
    <div class="card" style="border-left:6px solid var(--vmn-secondary);">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Commercial Partnerships & Brand Sponsorships</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Collaborate with VMNL across linear TV advertising, headline show sponsorships, experiential activations, and creator collaborations.
      </p>
    </div>
  </section>
  `;
}

// 18. Insights & Research (HeadspaceNG) (/insights)
export function renderInsightsPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <span>Insights & Research</span>
    </nav>
    <div class="card" style="border-left:6px solid #4F46E5;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">HeadspaceNG Strategic Intelligence</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Cultural analytics, Nollywood benchmark rate cards, NBC regulatory guidelines, and African entertainment industry reports.
      </p>
    </div>
  </section>
  `;
}

// 19. Careers Directory (/careers)
export function renderCareersPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <span>Careers</span>
    </nav>
    <div class="card" style="border-left:6px solid #059669;">
      <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Careers at VMNL</h1>
      <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
        Join Africa's premier media network shaping broadcast television, digital streaming, and the creative creator economy.
      </p>
    </div>
  </section>
  `;
}

// 20. Azeebo+ Information & App Gateway (Open Azeebo+) (/azeebo)
export function renderAzeeboGatewayPageHtml(): string {
  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <span>Open Azeebo+</span>
    </nav>
    <div class="card" style="border-left:6px solid #E50914;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <h1 style="font-size:2.2rem; font-weight:800; color:var(--vmn-primary);">Azeebo+ Streaming & Creator App</h1>
          <p style="font-size:1.15rem; color:var(--vmn-text-muted); margin-top:8px;">
            The direct consumer streaming destination connecting 8 distinct entertainment universes.
          </p>
        </div>
        <span class="vmn-badge badge-ready">Federated Gateway Active</span>
      </div>
      <div style="display:flex; gap:12px; margin-top:20px;">
        <a href="https://azeebo.plus" target="_blank" class="btn btn-primary">Open Web Streaming &rarr;</a>
        <a href="/azeebo/gateway" class="btn btn-outline">Universal Link Resolver</a>
      </div>
    </div>
  </section>
  `;
}
