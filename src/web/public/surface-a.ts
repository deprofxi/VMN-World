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
 return `<div class="card s-qcqWA_7LQw" ><h1>Channel Not Found</h1><p>The requested linear channel is not in the active registry.</p><a href="/channels" class="btn btn-primary s-ijWaduvsnA" >&larr; Back to Channels</a></div>`;
  }


  return `
 <section class="s-hJqXKfH1_e">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
 <a href="/channels" class="s-v8cyEOQoqd">Channels</a> &gt; 
      <span>${channel.name}</span>
    </nav>

    <!-- Channel Header Banner -->
 <div class="card s-JIHwESLacR" style="border-left:6px solid ${channel.accentColor}; background: linear-gradient(to right, #FFFFFF, var(--vmn-surface-alt));">
 <div class="s-eNztNGULjh">
        <div>
 <div class="s-Lho1bT9qTO">
 <h1 class="s-lZDniGbktQ">${channel.name}</h1>
            <span class="vmn-badge badge-info">Channel profile — live status unavailable</span>
          </div>
 <p class="s-tOIMThQAOC">${channel.tagline}</p>
 <div class="s-IQ2Z03BGAL">
            <span><strong>Carriage:</strong> Details unverified</span>
            <span><strong>Genre:</strong> ${channel.genre}</span>
            <span><strong>Language:</strong> ${channel.primaryLanguage}</span>
          </div>
        </div>
 <div class="s-numIUTWRO1">
          <a href="/azeebo" class="btn btn-outline s-lNuV4bA1-6">Azeebo+ service information &rarr;</a>
 <a href="/broadcast/screens/SCR-BCST-14" class="btn btn-outline" >EPG Syndication Spec</a>
        </div>
      </div>
    </div>


    <!-- Operational schedule is published only from an approved connected source. -->
    <div class="card s-KRt7uwFSzR" role="note">
      No approved, source-backed schedule is connected. Live status and programme listings are unavailable.
    </div>
    <!-- On Air Now & Up Next unavailable states -->
 <div class="grid-2" >
 <div class="card" role="note" >
 <span class="s-G_oxiDiwJg">Live status unavailable</span>
 <p class="s-OS-VhuHLk0">A verified transmission source is not connected.</p>
      </div>

 <div class="card s-dMYR6S1-6a" role="note" >
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
export function renderPublicProgrammeDetailHtml(programmeId: string): string {
  return `
 <section class="s-Ap7e8x-cvm">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-v8cyEOQoqd">Home</a> &gt; 
 <a href="/channels" class="s-v8cyEOQoqd">Programmes</a> &gt; 
      <span>${programmeId}</span>
    </nav>

 <article class="card s-ZOFAYSaIa1" >
      <div class="card s-eNztNGULjh" role="note">Programme synopsis only — schedule, rights, carriage, and availability are not verified here.</div>
 <div class="s-eNztNGULjh">
        <div>
 <span class="s-iuSTGt3tzW">${programmeId}</span>
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
        <a href="/channels" class="btn btn-outline">&larr; Back to Channels</a>
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
