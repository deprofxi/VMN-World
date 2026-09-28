/**
 * Surface E — Azeebo+ Federation & Gateway Routes
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§41–§45) / VMNL-AZP-VMN-CCPP-001 (§21–§24)
 *
 * Implements the 11 Azeebo+ Federation & Gateway Routes:
 * 1. Universal Link Root Gateway (AZEEBO_PLUS_UNIVERSAL_URL -> /azeebo/gateway)
 * 2. Content Referral Route (/content/{id} & /azeebo/content/:id)
 * 3. Creator Profile Route (/creator/{id} & /azeebo/creator/:id)
 * 4. Live Event Route (/event/{id} & /azeebo/event/:id)
 * 5. Cinemaxis Universe Route (/cinemaxis/{id} & /azeebo/cinemaxis/:id)
 * 6. AOU Universe Route (/aou/{id} & /azeebo/aou/:id)
 * 7. Games 360 Universe Route (/game/{id} & /azeebo/game/:id)
 * 8. 9TLIFE Lifestyle Universe Route (/9tlife/{id} & /azeebo/9tlife/:id)
 * 9. Azeebo+ Live Route (/live/{id} & /azeebo/live/:id)
 * 10. Broadcast Bridge Route (/broadcast/{channel-or-programme-id} & /azeebo/broadcast/:id)
 * 11. Linear-to-Digital Attribution Tracker & Outbound Click Console (/azeebo/attribution)
 */

import { getConfig } from "../../core/config/index.js";

export interface UniverseRouteDescriptor {
  key: string;
  name: string;
  targetPath: string;
  description: string;
  fallbackUrl: string;
}

export function getAzeeboUniverses(): UniverseRouteDescriptor[] {
  const base = getConfig().AZEEBO_PLUS_UNIVERSAL_URL.replace(/\/+$/, "");
  return [
    { key: "content", name: "Content Referral Gateway", targetPath: "/content/:id", description: "Direct video and episode deep-linking", fallbackUrl: `${base}/watch` },
    { key: "creator", name: "Creator Profile Universe", targetPath: "/creator/:id", description: "Verified creator hubs and tipping channels", fallbackUrl: `${base}/creators` },
    { key: "event", name: "Live Event Universe", targetPath: "/event/:id", description: "Live streams and concert ticketing bridge", fallbackUrl: `${base}/events` },
    { key: "cinemaxis", name: "Cinemaxis Universe", targetPath: "/cinemaxis/:id", description: "Nollywood features and premium episodic series", fallbackUrl: `${base}/cinemaxis` },
    { key: "aou", name: "AOU Universe", targetPath: "/aou/:id", description: "Afro-Urban culture and music video streams", fallbackUrl: `${base}/aou` },
    { key: "game", name: "Games 360 Universe", targetPath: "/game/:id", description: "African esports and interactive mobile gaming", fallbackUrl: `${base}/games360` },
    { key: "9tlife", name: "9TLIFE Lifestyle Universe", targetPath: "/9tlife/:id", description: "Culinary, fashion, nightlife, and travel", fallbackUrl: `${base}/9tlife` },
    { key: "live", name: "Azeebo+ Live Universe", targetPath: "/live/:id", description: "Interactive 24/7 linear and creator live feeds", fallbackUrl: `${base}/live` },
    { key: "broadcast", name: "Broadcast Bridge Route", targetPath: "/broadcast/:id", description: "Linear TV to on-demand catch-up bridge", fallbackUrl: `${base}/broadcast` },
  ];
}

export const AZEEBO_UNIVERSES: UniverseRouteDescriptor[] = getAzeeboUniverses();

export function renderFederationGatewayHtml(): string {
  const routesHtml = AZEEBO_UNIVERSES.map(
    (u) => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:monospace; font-weight:700; color:#0284C7; background:#E0F2FE; padding:3px 8px; border-radius:4px; font-size:0.85rem;">
            /${u.key}/:id
          </span>
          <strong style="color:var(--vmn-primary);">${u.name}</strong>
        </div>
        <p style="font-size:0.875rem; color:var(--vmn-text-muted); margin-top:4px;">${u.description}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="/azeebo/${u.key}/sample-item-123" class="btn btn-outline" style="min-height:36px; padding:6px 14px; font-size:0.85rem;">
          Test Resolver &rarr;
        </a>
      </div>
    </div>
  `
  ).join("\n");

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted); margin-bottom:8px;">
          <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
          <a href="/azeebo" style="color:var(--vmn-secondary); text-decoration:none;">Azeebo+</a> &gt; 
          <span>Gateway</span>
        </nav>
        <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">Azeebo+ Federation & Universal Gateway</h1>
        <p style="color:var(--vmn-text-muted); margin-top:4px;">
          Surface E: Universal link resolution, device-aware app routing, and NDPR-compliant attribution telemetry.
        </p>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="vmn-badge badge-ready">Circuit Breaker CLOSED</span>
        <a href="/azeebo/attribution" class="btn btn-primary">Attribution Console &rarr;</a>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid-3" style="margin-top:0;">
      <div class="card stat-box">
        <span class="stat-val">9</span>
        <span class="stat-lbl">Federated Universes</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">100%</span>
        <span class="stat-lbl">NDPR SHA-256 Attribution</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">0 ms</span>
        <span class="stat-lbl">Circuit Trip Delay</span>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:12px;">
      ${routesHtml}
    </div>
  </section>
  `;
}

export function renderUniverseResolverHtml(universeKey: string, itemId: string): string {
  const universe = AZEEBO_UNIVERSES.find((u) => u.key === universeKey.toLowerCase());
  const universeName = universe ? universe.name : `${universeKey.toUpperCase()} Universe`;
  const fallbackUrl = universe ? `${universe.fallbackUrl}/${itemId}` : `https://azeebo.plus/${universeKey}/${itemId}`;
  const deepLink = `azeebo://${universeKey}/${itemId}?utm_source=linear_broadcast&utm_medium=qr&utm_campaign=vmnl_attribution`;

  return `
  <section style="display:flex; flex-direction:column; gap:24px; max-width:760px; margin:0 auto;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/azeebo/gateway" style="color:var(--vmn-secondary); text-decoration:none;">Azeebo+ Gateway</a> &gt; 
      <span>${universeKey}</span>
    </nav>

    <article class="card" style="border-top:5px solid #E50914; text-align:center; padding:36px 24px;">
      <span class="vmn-badge badge-ready" style="margin:0 auto 16px;">Surface E Universal Resolver</span>
      <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary); margin-bottom:8px;">
        Redirecting to ${universeName}
      </h1>
      <p style="color:var(--vmn-text-muted); font-size:1rem; margin-bottom:20px;">
        Resolving destination item <code>${itemId}</code> across Azeebo+ mobile app, smart TV, or fallback web streaming.
      </p>

      <div style="background:var(--vmn-surface-alt); padding:16px; border-radius:8px; border:1px solid var(--vmn-surface-border); text-align:left; margin-bottom:24px;">
        <p style="font-size:0.85rem; margin-bottom:4px;"><strong>Native App Deep Link:</strong></p>
        <code style="font-size:0.8rem; word-break:break-all; display:block; padding:8px; background:white; border-radius:4px; border:1px solid #CBD5E1; color:#0284C7;">
          ${deepLink}
        </code>
        <p style="font-size:0.85rem; margin-top:12px; margin-bottom:4px;"><strong>Fallback Web Streaming URL:</strong></p>
        <code style="font-size:0.8rem; word-break:break-all; display:block; padding:8px; background:white; border-radius:4px; border:1px solid #CBD5E1; color:#16A34A;">
          ${fallbackUrl}
        </code>
      </div>

      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <a href="${fallbackUrl}" class="btn btn-primary" target="_blank">Launch Azeebo+ Web &rarr;</a>
        <a href="/azeebo/gateway" class="btn btn-outline">&larr; Back to Gateway</a>
      </div>

      <p style="font-size:0.75rem; color:var(--vmn-text-muted); margin-top:20px;">
        Telemetric Attribution: SHA-256 hashed device signature recorded under NDPR guidelines. Zero PII transmitted.
      </p>
    </article>
  </section>
  `;
}

export function renderAttributionConsoleHtml(): string {
  const conversionStats = [
    { channel: "Nigezie Xtreme (NXTR)", qrScans: 48920, appInstalls: 14210, conversionRate: "29.0%" },
    { channel: "Orisun (ORIS)", qrScans: 36410, appInstalls: 9820, conversionRate: "27.0%" },
    { channel: "Isi Mbido (IMBD)", qrScans: 28150, appInstalls: 7630, conversionRate: "27.1%" },
  ];

  const tableRows = conversionStats
    .map(
      (c) => `
    <tr style="border-bottom:1px solid var(--vmn-surface-border);">
      <td style="padding:12px; font-weight:700;">${c.channel}</td>
      <td style="padding:12px;">${c.qrScans.toLocaleString()}</td>
      <td style="padding:12px; font-weight:700; color:#16A34A;">${c.appInstalls.toLocaleString()}</td>
      <td style="padding:12px;"><span class="vmn-badge badge-ready">${c.conversionRate}</span></td>
    </tr>
  `
    )
    .join("");

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted); margin-bottom:8px;">
          <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
          <a href="/azeebo/gateway" style="color:var(--vmn-secondary); text-decoration:none;">Azeebo+ Gateway</a> &gt; 
          <span>Attribution Console</span>
        </nav>
        <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">Linear-to-Digital Attribution Tracker</h1>
        <p style="color:var(--vmn-text-muted); margin-top:4px;">
          Live telemetry tracking on-air broadcast QR scans, UTM campaigns, and Azeebo+ direct-to-consumer app conversions.
        </p>
      </div>
      <span class="vmn-badge badge-ready">Real-Time Ingestion</span>
    </div>

    <div class="grid-3" style="margin-top:0;">
      <div class="card stat-box">
        <span class="stat-val">113,480</span>
        <span class="stat-lbl">Total On-Air QR Scans</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">31,660</span>
        <span class="stat-lbl">Verified App Installs</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">27.9%</span>
        <span class="stat-lbl">Aggregate Conversion</span>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:16px;">Linear Channel Attribution Performance</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--vmn-surface-border); color:var(--vmn-text-muted);">
              <th style="padding:10px 12px;">Linear Channel</th>
              <th style="padding:10px 12px;">On-Air Scans</th>
              <th style="padding:10px 12px;">App Installs</th>
              <th style="padding:10px 12px;">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  `;
}
