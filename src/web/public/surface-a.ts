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
import { renderVerticalLandingPageHtml } from "./hub.js";
import { listEpisodeMasters } from "../../modules/broadcast/episode-masters.js";
import { renderEpisodeMastersTableHtml } from "../components/episode-masters.js";
import { getConfiguredFederationOrigin } from "../../core/federation/destinations.js";
import { escapeHtml } from "../components/escape.js";

// 3. Nigezie Xtreme Channel Page (/channels/nxtr)
// 4. Orisun Channel Page (/channels/orisun)
// 5. Isi Mbido Channel Page (/channels/isimbido)
export function renderChannelDetailPageHtml(
  channelCode: "NXTR" | "ORIS" | "IMBD",
  _viewerTimezoneHeader?: string,
  _options: { now?: Date } = {}
): string {
  const channel = PUBLIC_CHANNELS.find((c) => c.code === channelCode);
  if (!channel) {
 return `<div class="card s-qcqWA_7LQw" ><h1>Channel Not Found</h1><p>The requested linear channel is not in the active registry.</p><a href="/media-and-audience-overview" class="btn btn-primary s-ijWaduvsnA" >&larr; Back to Channels</a></div>`;
  }


  return `
 <section class="s-hJqXKfH1_e">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
 <a href="/media-and-audience-overview" class="s-v8cyEOQoqd">Channels</a> &gt; 
      <span>${escapeHtml(channel.name)}</span>
    </nav>

    <!-- Channel Header Banner -->
    <div class="card s-JIHwESLacR bg-gradient-to-r from-[#0a0a0a] to-black" style="border-left:6px solid ${escapeHtml(channel.accentColor)};">
 <div class="s-eNztNGULjh">
        <div>
 <div class="s-Lho1bT9qTO">
 <h1 class="s-lZDniGbktQ">${escapeHtml(channel.name)}</h1>
            <span class="vmn-badge badge-info">Channel profile — live status unavailable</span>
          </div>
 <p class="s-tOIMThQAOC">${escapeHtml(channel.tagline)}</p>
 <div class="s-IQ2Z03BGAL">
            <span><strong>Carriage:</strong> Details unverified</span>
            <span><strong>Genre:</strong> ${escapeHtml(channel.genre)}</span>
            <span><strong>Language:</strong> ${escapeHtml(channel.primaryLanguage)}</span>
          </div>
        </div>
 <div class="s-numIUTWRO1">
          <a href="/azeebo" class="btn btn-outline s-lNuV4bA1-6">Azeebo+ service information &rarr;</a>
 <a href="/broadcast/screens/SCR-BCST-14" class="btn btn-outline" >EPG Syndication Spec</a>
        </div>
      </div>
    </div>

    <!-- Broadcast Video Player & Live Carrier Monitor -->
    <div class="card s-mt90J5TWTx">
      <div class="s-_jH-4CIolt">
        <div class="s-o-By174i2F">
          <span class="vmn-badge badge-ready font-mono text-xs s-JlPFyo8Oua">
            <span class="vmn-pulse-dot s-3RCx-JyPrv"></span> LIVE BROADCAST
          </span>
          <span class="s-feHkHpaXrp">1080p50 • H.264 • 48kHz Stereo</span>
        </div>
        <div class="s-0XuQs6nFBd">
          <div class="vmn-vu-meter" title="Linear Audio Levels">
            <div class="vmn-vu-bar"></div>
            <div class="vmn-vu-bar"></div>
            <div class="vmn-vu-bar"></div>
            <div class="vmn-vu-bar"></div>
          </div>
          <span class="vmn-badge badge-info font-mono text-xs">CH ${escapeHtml(channel.code)}</span>
        </div>
        
        <!-- Video Canvas Center Controls -->
        <div class="s-aI4E09X5Lw">
          <div class="w-[72px] h-[72px] rounded-full bg-slate-900/90 inline-flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(56,189,248,0.3)] cursor-pointer transition-transform duration-200 border-2 border-primary">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="${escapeHtml(channel.accentColor)}" stroke="${escapeHtml(channel.accentColor)}" stroke-width="1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
          <p class="s-FozboNIkAf">${escapeHtml(channel.name)} Linear Broadcast</p>
          <p class="s-xD_DqfETT0">${escapeHtml(channel.tagline)}</p>
          <p class="s-qneVAPKkha">Stream feed connected to StarTimes broadcast uplink. Watch seamlessly on mobile and desktop.</p>
        </div>

        <!-- Video Player Controls Overlay -->
        <div class="s-_6gopTcf4W">
          <div class="s-cqo0xtktXb">
            <button type="button" class="btn btn-outline btn-sm px-3 py-1.5 text-xs" aria-label="Play or pause live carrier stream" data-toast="Buffering ${escapeHtml(channel.name)} live carrier stream..." data-toast-type="info">
              ▶ Stream Live
            </button>
            <div class="s-ZFAFhrDNlV">
              <span class="s-o30lsER6VJ">Vol</span>
              <input class="s-J0G-Ixp4eY" type="range" min="0" max="100" value="80" aria-label="Stream volume">
            </div>
            <span class="s-o6GR8JHVcJ">00:42:15 / LIVE</span>
          </div>
          <div class="s-u56MDPMPka">
            <a href="/azeebo" class="btn btn-primary btn-sm s-k3cOygyow9">Watch on Azeebo+ &rarr;</a>
            <button type="button" class="btn btn-outline btn-sm s-xhwH-PdtZp" aria-label="Toggle Fullscreen" data-toast="Fullscreen stream mode toggled." data-toast-type="info">
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EPG Dayparting Navigation Timeline -->
    <div class="card s-S4wtbqPR59">
      <div class="s-eVjH67FLxK">
        <div>
          <h3 class="s-W8JY5PFnwr">Broadcast Daypart Timeline (WAT)</h3>
          <p class="s-hTxhcKFIoy">Browse 24-hour linear schedule segments across daypart blocks</p>
        </div>
        <div class="s-s3hiIigIif">
          <button type="button" class="btn btn-outline s-09tfzLJ-_G" aria-label="Previous day schedule">&larr; Yesterday</button>
          <button type="button" class="btn btn-outline s-cNacoMSr2Q" aria-label="Today schedule">Today (Schedule)</button>
          <button type="button" class="btn btn-outline s-09tfzLJ-_G" aria-label="Next day schedule">Tomorrow &rarr;</button>
        </div>
      </div>

      <!-- Horizontal Daypart Blocks -->
      <div class="s-EFEAbwEK6Y">
        <div class="s-kDUqO4xFjD">
          <div class="s-wvfywL4dFR">EARLY MORNING</div>
          <div class="s-mV38g3yG3K">06:00 – 09:00</div>
          <div class="s-UhgWFmz_lo">Devotional / News</div>
        </div>
        <div class="s-kDUqO4xFjD">
          <div class="s-kYDWaX0bOW">DAYTIME</div>
          <div class="s-mV38g3yG3K">09:00 – 16:00</div>
          <div class="s-UhgWFmz_lo">Lifestyle &amp; Music</div>
        </div>
        <div class="s-cgIhj-fCY5">
          <div class="s-M7LNZOzHSB">EARLY FRINGE</div>
          <div class="s-mV38g3yG3K">16:00 – 19:00</div>
          <div class="s-UhgWFmz_lo">Youth &amp; Series</div>
        </div>
        <div class="s-jF5AvJ1_nj">
          <div class="s-GiYbznnTAB">★ PRIMETIME</div>
          <div class="s-mV38g3yG3K">19:00 – 22:00</div>
          <div class="s-PN4m75XViU">Flagship Nollywood / Hits</div>
        </div>
        <div class="s-kDUqO4xFjD">
          <div class="s-hBpQMxmqv_">LATE FRINGE</div>
          <div class="s-mV38g3yG3K">22:00 – 01:00</div>
          <div class="s-UhgWFmz_lo">Urban Culture / DJ Sets</div>
        </div>
        <div class="s-kDUqO4xFjD">
          <div class="s-BS0jKCfBRL">OVERNIGHT</div>
          <div class="s-mV38g3yG3K">01:00 – 06:00</div>
          <div class="s-UhgWFmz_lo">Non-stop Video Jukebox</div>
        </div>
      </div>
    </div>


    <!-- Interactive Weekly Electronic Programme Guide (EPG) Explorer -->
    <div class="card p-4 mb-4 s-xFR2i68ig0">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <span class="vmn-badge badge-ready text-xs mb-1">Electronic Programme Guide (EPG)</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Weekly Broadcast Programme Guide</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted font-mono">Timezone: Africa/Lagos (WAT, UTC+1)</span>
        </div>
      </div>

      <!-- Day Selector Tabs -->
      <div class="vmn-filter-bar flex gap-2 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Broadcast Days">
        <button class="btn btn-sm btn-primary vmn-epg-day active" data-day="TODAY" role="tab" aria-selected="true">Today (Live)</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="MON" role="tab" aria-selected="false">Mon</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="TUE" role="tab" aria-selected="false">Tue</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="WED" role="tab" aria-selected="false">Wed</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="THU" role="tab" aria-selected="false">Thu</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="FRI" role="tab" aria-selected="false">Fri</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="SAT" role="tab" aria-selected="false">Sat</button>
        <button class="btn btn-sm btn-outline vmn-epg-day" data-day="SUN" role="tab" aria-selected="false">Sun</button>
      </div>

      <!-- Interactive EPG Daypart Schedule Grid -->
      <div class="space-y-2 mb-4" id="vmn-epg-slots">
        <div class="p-3 rounded bg-surface border border-muted/20 flex items-center justify-between flex-wrap gap-2 vmn-interactive-row">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-300">06:00 – 09:00</span>
            <div>
              <div class="font-bold text-sm text-slate-100">Morning Praise &amp; African Awakening</div>
              <span class="text-xs text-muted">Devotional &amp; Cultural Mornings • PG</span>
            </div>
          </div>
          <span class="vmn-badge badge-outline text-xs">Early Morning</span>
        </div>

        <div class="p-3 rounded bg-surface border border-muted/20 flex items-center justify-between flex-wrap gap-2 vmn-interactive-row">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-300">09:00 – 16:00</span>
            <div>
              <div class="font-bold text-sm text-slate-100">Afrobeats Chart Countdown &amp; Soundstage Live</div>
              <span class="text-xs text-muted">Lifestyle &amp; Contemporary Music • PG-13</span>
            </div>
          </div>
          <span class="vmn-badge badge-outline text-xs">Daytime</span>
        </div>

        <div class="p-3 rounded bg-surface border border-muted/20 flex items-center justify-between flex-wrap gap-2 vmn-interactive-row">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-300">16:00 – 19:00</span>
            <div>
              <div class="font-bold text-sm text-slate-100">Street Beats &amp; Campus Pulse Showcase</div>
              <span class="text-xs text-muted">Youth Culture &amp; Emerging Creators • 16+</span>
            </div>
          </div>
          <span class="vmn-badge badge-outline text-xs">Early Fringe</span>
        </div>

        <div class="p-3 rounded bg-surface border border-amber-500/40 flex items-center justify-between flex-wrap gap-2 vmn-interactive-row s-o4JjLv_3Hx">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-amber-400">19:00 – 22:00</span>
            <div>
              <div class="font-bold text-sm text-amber-300">★ Primetime Nollywood Flagship Series</div>
              <span class="text-xs text-muted">Premium Original Drama • 16+</span>
            </div>
          </div>
          <span class="vmn-badge badge-warning text-xs">★ Primetime</span>
        </div>

        <div class="p-3 rounded bg-surface border border-muted/20 flex items-center justify-between flex-wrap gap-2 vmn-interactive-row">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-300">22:00 – 01:00</span>
            <div>
              <div class="font-bold text-sm text-slate-100">Club Xtreme Live DJ Session</div>
              <span class="text-xs text-muted">Urban Culture &amp; High-Energy Beats • 18+</span>
            </div>
          </div>
          <span class="vmn-badge badge-outline text-xs">Late Fringe</span>
        </div>
      </div>
    </div>

    <!-- Operational schedule is published only from an approved connected source. -->
    <div class="card s-KRt7uwFSzR" role="note">
      No approved, source-backed schedule is connected. Live status and programme listings are unavailable.
    </div>
    <!-- On Air Now & Up Next unavailable states -->
    <div class="grid-2">
      <div class="card" role="note">
        <span class="s-G_oxiDiwJg">Live status unavailable</span>
        <p class="s-OS-VhuHLk0">A verified transmission source is not connected.</p>
      </div>

      <div class="card s-dMYR6S1-6a" role="note">
        <span class="s-G_oxiDiwJg">Next programme unavailable</span>
        <p class="s-OS-VhuHLk0">Programme data appears when an approved schedule is published.</p>
      </div>
    </div>

    <!-- Empty until an approved schedule source is connected -->
    <div class="card">
      <div class="s-wUW2k9hp6I">
        <h2 class="s-5BWXDPE52B">Broadcast Programme Schedule</h2>
        <span class="s-37h9gF_4Xa">No approved schedule source connected</span>
      </div>
      <div class="s-0GmMSMP86s">
        <table class="s-b-Ai5vuAKC">
          <thead>
            <tr class="s-y6vAX1Tc3O">
              <th class="s-drsUO0gkUT">Air Time (WAT)</th>
              <th class="s-drsUO0gkUT">Programme Title</th>
              <th class="s-drsUO0gkUT">Type / Genre</th>
              <th class="s-drsUO0gkUT">Classification</th>
              <th class="s-drsUO0gkUT">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="5" role="status" class="s-zzcDR1Eaak">No approved programme listings are available.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SCR-03 follow-on: canonical BroadcastEpisode → DAM master linkage for this channel -->
    ${renderEpisodeMastersTableHtml(
      listEpisodeMasters(channelCode),
      { note: "Access states are read live from the DAM registry; unregistered or missing references are flagged rather than hidden." }
    )}
  </section>
  `;
}

// 6. Public Programme Detail Page (/programmes/:id)
// DEBT-009: the id arrives from the request path, so it is escaped where it is
// echoed (breadcrumb and heading) rather than trusted for being a path segment.
export function renderPublicProgrammeDetailHtml(programmeId: string): string {
  return `
 <section class="s-Ap7e8x-cvm">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
 <a href="/media-and-audience-overview" class="s-v8cyEOQoqd">Programmes</a> &gt; 
      <span>${escapeHtml(programmeId)}</span>
    </nav>

 <article class="card s-ZOFAYSaIa1" >
      <div class="card s-eNztNGULjh" role="note">Programme synopsis only — schedule, rights, carriage, and availability are not verified here.</div>
 <div class="s-eNztNGULjh">
        <div>
 <span class="s-iuSTGt3tzW">${escapeHtml(programmeId)}</span>
 <h1 class="s-xtS-D5mYmb">Programme profile</h1>
 <p class="s-akf9yrBcu-">Programme details are unavailable until an approved catalogue record is connected.</p>
        </div>
 <div class="s-numIUTWRO1">
          <span class="vmn-badge badge-info">Programme profile — QC status unavailable</span>
 <span class="s-37h9gF_4Xa">Channel association is not available from a verified programme record.</span>
        </div>
      </div>

 <hr class="s-Uv7OVY7naE" />

 <div class="grid-2 s-KRt7uwFSzR" >
        <div>
 <h2 class="s-q5kWKTcjWP">Synopsis & Production Arc</h2>
 <p class="s-gPnYWUVJUT">
            Synopsis, production credits, audience reach, and technical specifications are not available from an approved programme record.
          </p>
        </div>

        <div>
 <h2 class="s-q5kWKTcjWP">Broadcast Transmission Slots</h2>
 <div class="s-geHjG3K8-9">
            <p>Transmission windows, carriage, and catch-up availability are not asserted without an approved, source-backed schedule and rights record.</p>
          </div>
        </div>
      </div>

 <div class="s-nTHtyYhUOE">
        <a href="/media-and-audience-overview" class="btn btn-outline">&larr; Back to Channels</a>
        <a href="/azeebo" class="btn btn-outline">Azeebo+ service information &rarr;</a>
      </div>
    </article>
  </section>
  `;
}

// 8. Talent Accelerator Network (/hub/talent)
export function renderTalentAcceleratorPageHtml(): string {
  return renderVerticalLandingPageHtml("TALENT_ACCELERATOR");
}

// 9. Learn (AFCA Academy) (/hub/afca & /learn)
export function renderAfcaAcademyPageHtml(): string {
  return renderVerticalLandingPageHtml("AFCA_ACADEMY");
}

// 10. Creators & Talent Gateway (/hub/creators)
export function renderCreatorsGatewayPageHtml(): string {
  return renderVerticalLandingPageHtml("TALENT_ACCELERATOR");
}

// 11. Afro-Fusion Creatives Community Presence (/hub/community)
export function renderCommunityPresencePageHtml(): string {
  return renderVerticalLandingPageHtml("AFRO_FUSION_COMMUNITY");
}

// 12. VTM (Verified Talent Marketplace) (/hub/vtm)
export function renderVtmMarketplacePageHtml(): string {
  return renderVerticalLandingPageHtml("VTM_MANAGEMENT");
}

// 13. Production (ONE Studios & VCF) (/hub/production)
export function renderProductionPageHtml(): string {
  return renderVerticalLandingPageHtml("ONE_STUDIOS");
}

export function renderVcfPageHtml(): string {
  return renderVerticalLandingPageHtml("VCF_CONTENT_FUND");
}

export function renderOneStudiosPageHtml(): string {
  return renderVerticalLandingPageHtml("ONE_STUDIOS");
}

// 14. Events (Fusion Events) (/hub/events)
export function renderEventsPageHtml(): string {
  return renderVerticalLandingPageHtml("FUSION_EVENTS");
}

// 15. Technology (Cr8TechNG) (/hub/technology)
export function renderTechnologyPageHtml(): string {
  return renderVerticalLandingPageHtml("CR8TECH_NG");
}

// 16. Distribution & Syndication (TEND) (/hub/distribution)
export function renderDistributionPageHtml(): string {
  return renderVerticalLandingPageHtml("TEND_DISTRIBUTION");
}

// 17. Commercial Partners & Sponsors (/partners)
export function renderPartnersPageHtml(): string {
  return `
 <section class="s-hJqXKfH1_e">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
      <span>Partners & Sponsors</span>
    </nav>
 <div class="card s-eCGXI5DO0E" >
 <h1 class="s-lZDniGbktQ">Commercial Partnerships & Brand Sponsorships</h1>
 <p class="s-_9q80AS-VX">
        Collaborate with VMNL across linear TV advertising, headline show sponsorships, experiential activations, and creator collaborations.
      </p>
    </div>
  </section>
  `;
}

// 18. Insights & Research (HeadspaceNG) (/insights)
export function renderInsightsPageHtml(): string {
  return renderVerticalLandingPageHtml("HEADSPACE_NG");
}

// 19. Careers Directory (/careers)
export function renderCareersPageHtml(): string {
  return `
 <section class="s-hJqXKfH1_e">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
      <span>Careers</span>
    </nav>
 <div class="card s-nDK2HY3OoY" >
 <h1 class="s-lZDniGbktQ">Careers at VMNL</h1>
 <p class="s-_9q80AS-VX">
        Join Africa's premier media network shaping broadcast television, digital streaming, and the creative creator economy.
      </p>
    </div>
  </section>
  `;
}

// 20. Azeebo+ Information & App Gateway (Open Azeebo+) (/azeebo)
export function renderAzeeboGatewayPageHtml(): string {
  // TSK-35 / CLAUDE.md `<azeebo>`: the partner origin is an external fact that a
  // deployment states in configuration. A public page may not print one on its
  // own, so the outbound link appears only once an origin is actually configured.
  const origin = getConfiguredFederationOrigin();
  const outbound = origin
    ? `<a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Visit Azeebo+ &rarr;</a>`
    : `<span class="vmn-badge badge-info">Outbound federation disabled — no Azeebo+ origin is configured for this deployment</span>`;

  return `
 <section class="s-hJqXKfH1_e">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
      <span>Open Azeebo+</span>
    </nav>
 <div class="card s-PAk1PwTj_e" >
 <div class="s-eNztNGULjh">
        <div>
 <h1 class="s-lZDniGbktQ">Azeebo+ Streaming & Creator App</h1>
 <p class="s-_9q80AS-VX">
            Azeebo+ is a separately operated federated service; availability and catalogue details are not verified here.
          </p>
        </div>
        <span class="vmn-badge badge-info">Federated gateway — status unavailable</span>
      </div>
 <div class="s-eQzbN1bYIf">
        ${outbound}
        <a href="/azeebo/gateway" class="btn btn-outline">Universal Link Resolver</a>
      </div>
    </div>
  </section>
  `;
}
