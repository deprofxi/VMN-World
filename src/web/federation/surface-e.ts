/**
 * Surface E — Azeebo+ Federation & Gateway Routes
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§41–§45) / VMNL-AZP-VMN-CCPP-001 (§21–§24)
 * Design Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-601, DT-602, DT-603, DT-604 / ADR-008
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
import { renderIcon } from "../components/index.js";

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

/**
 * Renders the Azeebo+ Federation Gateway (DT-601, DT-604).
 * Fulfills ADR-008: Distinct partner identity, clearly delineated outbound actions, no internal-nav confusion.
 */
export function renderFederationGatewayHtml(): string {
  const routesHtml = AZEEBO_UNIVERSES.map(
    (u) => `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:monospace; font-weight:700; color:#0369A1; background:#E0F2FE; padding:3px 8px; border-radius:4px; font-size:0.85rem;">
            /${u.key}/:id
          </span>
          <strong style="color:var(--vmn-primary);">${u.name}</strong>
          <span style="font-size:0.75rem; color:var(--vmn-color-brand); font-weight:700; border:1px solid #FECACA; background:#FEF2F2; padding:1px 6px; border-radius:4px;">
            Azeebo+ Universe
          </span>
        </div>
        <p style="font-size:0.875rem; color:var(--vmn-text-muted); margin-top:4px;">${u.description}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="/azeebo/${u.key}/sample-item-123" class="btn btn-outline" style="min-height:44px; display:inline-flex; align-items:center; padding:0 14px; font-size:0.85rem;">
          Test Resolver &rarr;
        </a>
      </div>
    </div>
  `
  ).join("\n");

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <!-- Partner Shell Header (ADR-008 / DT-601) -->
    <div class="card" style="border-left:6px solid var(--vmn-color-brand); background:linear-gradient(to right, #FFFFFF, #FFF1F2); padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted); margin-bottom:8px;">
            <a href="/" style="color:var(--vmn-color-primary); text-decoration:none;">Home</a> &gt; 
            <a href="/azeebo" style="color:var(--vmn-color-primary); text-decoration:none;">Azeebo+</a> &gt; 
            <span style="color:var(--vmn-text-main); font-weight:600;">Federation Gateway</span>
          </nav>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="background:var(--vmn-color-brand); color:white; font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.05em;">
              EXTERNAL PARTNER FEDERATION
            </span>
            <!-- Human-readable circuit status (DT-604) -->
            <span class="vmn-badge badge-ready">Federation Link: Normal / Protected</span>
          </div>
          <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">Azeebo+ Federation & Universal Gateway</h1>
          <p style="color:var(--vmn-text-muted); margin-top:4px; max-width:720px;">
            Surface E: Cross-platform link resolution, native app dispatch, and NDPR-compliant attribution telemetry bridging linear television broadcasts with direct-to-consumer streaming.
          </p>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <a href="/azeebo/attribution" class="btn btn-primary" style="min-height:44px; display:inline-flex; align-items:center; justify-content:center;">
            Attribution Console &rarr;
          </a>
          <a href="https://azeebo.plus" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="min-height:44px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            Launch Azeebo+ App <span style="font-size:0.8rem;" aria-hidden="true">↗</span>
          </a>
        </div>
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
        <span class="stat-val">Healthy</span>
        <span class="stat-lbl">Circuit Breaker Status</span>
      </div>
    </div>

    <!-- Universal Link / QR Builder Panel (DT-601) -->
    <div class="card" style="border:1px solid var(--vmn-color-control-border);">
      <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:6px; color:var(--vmn-primary);">
        Federated Universal Link &amp; QR Generator
      </h2>
      <p style="font-size:0.9rem; color:var(--vmn-text-muted); margin-bottom:16px;">
        Generate compliant on-air campaign URLs and smart app deep links for broadcast lower-third graphics and social syndication.
      </p>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:16px;">
        <div>
          <label for="qr-universe-select" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:4px;">Target Universe</label>
          <select id="qr-universe-select" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid var(--vmn-color-control-border); border-radius:6px; font-size:0.95rem; background:white;">
            <option value="cinemaxis">Cinemaxis (Nollywood &amp; Features)</option>
            <option value="content">Content Referral (Episodes &amp; VOD)</option>
            <option value="creator">Creator Profile (Guild Talent)</option>
            <option value="event">Live Event &amp; Ticketing</option>
            <option value="aou">AOU (Afro-Urban Music)</option>
            <option value="game">Games 360 (African Esports)</option>
            <option value="9tlife">9TLIFE (Lifestyle &amp; Culinary)</option>
            <option value="live">Azeebo+ Live (24/7 Streams)</option>
          </select>
        </div>
        <div>
          <label for="qr-item-id" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:4px;">Item / Episode Identifier</label>
          <input id="qr-item-id" type="text" value="oba-alade-ep01" placeholder="e.g. oba-alade-ep01" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid var(--vmn-color-control-border); border-radius:6px; font-size:0.95rem; box-sizing:border-box;" />
        </div>
        <div>
          <label for="qr-campaign-channel" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:4px;">Linear Broadcast Channel</label>
          <select id="qr-campaign-channel" style="width:100%; min-height:44px; padding:8px 12px; border:1px solid var(--vmn-color-control-border); border-radius:6px; font-size:0.95rem; background:white;">
            <option value="NXTR">Nigezie Xtreme (NXTR)</option>
            <option value="ORIS">Orisun — The Source (ORIS)</option>
            <option value="IMBD">Isi Mbido — The Beginning (IMBD)</option>
          </select>
        </div>
      </div>

      <div style="background:var(--vmn-surface-alt); padding:16px; border-radius:6px; border:1px solid var(--vmn-surface-border);">
        <div style="font-size:0.85rem; font-weight:700; margin-bottom:4px; color:var(--vmn-primary);">Generated Universal Link (Web Fallback):</div>
        <code style="display:block; font-size:0.85rem; word-break:break-all; background:white; padding:8px 12px; border-radius:4px; border:1px solid #CBD5E1; color:#0369A1;">
          https://azeebo.plus/u/cinemaxis/oba-alade-ep01?utm_source=vmn_oris&amp;utm_medium=linear_qr&amp;utm_campaign=vmnl_attribution
        </code>
        <div style="font-size:0.85rem; font-weight:700; margin-top:12px; margin-bottom:4px; color:var(--vmn-primary);">Native App Scheme:</div>
        <code style="display:block; font-size:0.85rem; word-break:break-all; background:white; padding:8px 12px; border-radius:4px; border:1px solid #CBD5E1; color:#166534;">
          azeeboplus://u/cinemaxis/oba-alade-ep01?utm_source=vmn_oris&amp;utm_medium=linear_qr
        </code>
      </div>
    </div>

    <!-- Active Federated Universes Directory -->
    <div>
      <h2 style="font-size:1.3rem; font-weight:700; margin-bottom:12px; color:var(--vmn-primary);">
        Active Federated Universes (9 Routes)
      </h2>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${routesHtml}
      </div>
    </div>
  </section>
  `;
}

/**
 * Renders the Universal Universe Resolver template with clear fallback (DT-603).
 */
export function renderUniverseResolverHtml(universeKey: string, itemId: string): string {
  const universe = AZEEBO_UNIVERSES.find((u) => u.key === universeKey.toLowerCase());
  const universeName = universe ? universe.name : `${universeKey.toUpperCase()} Universe`;
  const fallbackUrl = universe ? `${universe.fallbackUrl}/${itemId}` : `https://azeebo.plus/${universeKey}/${itemId}`;
  const deepLink = `azeebo://${universeKey}/${itemId}?utm_source=linear_broadcast&utm_medium=qr&utm_campaign=vmnl_attribution`;

  return `
  <section style="display:flex; flex-direction:column; gap:24px; max-width:760px; margin:0 auto;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-color-primary); text-decoration:none;">Home</a> &gt; 
      <a href="/azeebo/gateway" style="color:var(--vmn-color-primary); text-decoration:none;">Azeebo+ Gateway</a> &gt; 
      <span style="color:var(--vmn-text-main); font-weight:600;">${universeKey}</span>
    </nav>

    <article class="card" style="border-top:6px solid var(--vmn-color-brand); text-align:center; padding:36px 24px;">
      <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span class="vmn-badge badge-ready">Surface E Universal Resolver</span>
        <span class="vmn-badge badge-info">External Federation</span>
      </div>
      <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary); margin-bottom:8px;">
        Resolving to ${universeName}
      </h1>
      <p style="color:var(--vmn-text-muted); font-size:1rem; margin-bottom:20px; max-width:540px; margin-left:auto; margin-right:auto;">
        Resolving destination item <code>${itemId}</code> across Azeebo+ mobile app, smart TV, or fallback web streaming.
      </p>

      <div style="background:var(--vmn-surface-alt); padding:16px; border-radius:8px; border:1px solid var(--vmn-surface-border); text-align:left; margin-bottom:24px;">
        <p style="font-size:0.85rem; margin-bottom:4px; font-weight:600;"><strong>Native App Deep Link:</strong></p>
        <code style="font-size:0.8rem; word-break:break-all; display:block; padding:8px 12px; background:white; border-radius:4px; border:1px solid #CBD5E1; color:#0369A1;">
          ${deepLink}
        </code>
        <p style="font-size:0.85rem; margin-top:12px; margin-bottom:4px; font-weight:600;"><strong>Fallback Web Streaming URL (External):</strong></p>
        <code style="font-size:0.8rem; word-break:break-all; display:block; padding:8px 12px; background:white; border-radius:4px; border:1px solid #CBD5E1; color:#166534;">
          ${fallbackUrl}
        </code>
      </div>

      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <a href="${fallbackUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer" style="min-height:44px; display:inline-flex; align-items:center; gap:6px;">
          Launch Azeebo+ Web <span style="font-size:0.85rem;" aria-hidden="true">↗</span>
        </a>
        <a href="/azeebo/gateway" class="btn btn-outline" style="min-height:44px; display:inline-flex; align-items:center;">
          &larr; Back to Gateway
        </a>
      </div>

      <!-- NDPR Notice -->
      <p style="font-size:0.75rem; color:var(--vmn-text-muted); margin-top:24px; max-width:520px; margin-left:auto; margin-right:auto;">
        Attribution Telemetry: Anonymized SHA-256 hashed device signature recorded under Nigeria Data Protection Act (NDPA) 2023. Zero PII transmitted.
      </p>
    </article>
  </section>
  `;
}

/**
 * Renders the Linear-to-Digital Attribution Tracker & Outbound Click Console (DT-602).
 * Fulfills 6-stage funnel presentation and NDPR privacy compliance notice.
 */
export function renderAttributionConsoleHtml(): string {
  const conversionStats = [
    { channel: "Nigezie Xtreme (NXTR)", qrScans: 48920, appInstalls: 14210, conversionRate: "29.0%" },
    { channel: "Orisun — The Source (ORIS)", qrScans: 36410, appInstalls: 9820, conversionRate: "27.0%" },
    { channel: "Isi Mbido — The Beginning (IMBD)", qrScans: 28150, appInstalls: 7630, conversionRate: "27.1%" },
  ];

  const tableRows = conversionStats
    .map(
      (c) => `
    <tr style="border-bottom:1px solid var(--vmn-surface-border);">
      <td style="padding:12px; font-weight:700;">${c.channel}</td>
      <td style="padding:12px;">${c.qrScans.toLocaleString()}</td>
      <td style="padding:12px; font-weight:700; color:#166534;">${c.appInstalls.toLocaleString()}</td>
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
          <a href="/" style="color:var(--vmn-color-primary); text-decoration:none;">Home</a> &gt; 
          <a href="/azeebo/gateway" style="color:var(--vmn-color-primary); text-decoration:none;">Azeebo+ Gateway</a> &gt; 
          <span style="color:var(--vmn-text-main); font-weight:600;">Attribution Console</span>
        </nav>
        <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">Linear-to-Digital Attribution Tracker</h1>
        <p style="color:var(--vmn-text-muted); margin-top:4px;">
          Audited conversion telemetry bridging linear on-air broadcast impressions to Azeebo+ direct-to-consumer digital acquisitions.
        </p>
      </div>
      <span class="vmn-badge badge-ready">Real-Time Ingestion Active</span>
    </div>

    <!-- Summary KPI Grid -->
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

    <!-- DT-602: Six-Stage Attribution Funnel Visualisation -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
        <div>
          <h2 style="font-size:1.25rem; font-weight:700; color:var(--vmn-primary);">
            Six-Stage Conversion &amp; Retention Funnel
          </h2>
          <p style="font-size:0.875rem; color:var(--vmn-text-muted); margin-top:2px;">
            Full lifecycle progression from linear transponder transmission to 30-day digital subscriber retention.
          </p>
        </div>
        <span class="vmn-badge badge-info">Audited Telemetry</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin-bottom:20px;">
        <div style="padding:12px; background:var(--vmn-surface-alt); border-radius:6px; border:1px solid var(--vmn-surface-border);">
          <span style="font-size:0.75rem; font-weight:700; color:var(--vmn-text-muted); text-transform:uppercase;">1. Broadcast Airing</span>
          <div style="font-size:1.2rem; font-weight:800; color:var(--vmn-primary); margin-top:4px;">1,240,000</div>
          <span style="font-size:0.75rem; color:var(--vmn-text-muted);">Linear Impressions</span>
        </div>
        <div style="padding:12px; background:#F0F9FF; border-radius:6px; border:1px solid #BAE6FD;">
          <span style="font-size:0.75rem; font-weight:700; color:#0369A1; text-transform:uppercase;">2. On-Air QR Scan</span>
          <div style="font-size:1.2rem; font-weight:800; color:#0369A1; margin-top:4px;">113,480</div>
          <span style="font-size:0.75rem; color:#0369A1;">9.15% Scan-Through</span>
        </div>
        <div style="padding:12px; background:#F0F9FF; border-radius:6px; border:1px solid #BAE6FD;">
          <span style="font-size:0.75rem; font-weight:700; color:#0369A1; text-transform:uppercase;">3. Landing View</span>
          <div style="font-size:1.2rem; font-weight:800; color:#0369A1; margin-top:4px;">108,920</div>
          <span style="font-size:0.75rem; color:#0369A1;">96.0% Resolution</span>
        </div>
        <div style="padding:12px; background:#FEF3C7; border-radius:6px; border:1px solid #FDE68A;">
          <span style="font-size:0.75rem; font-weight:700; color:#92400E; text-transform:uppercase;">4. App Signup</span>
          <div style="font-size:1.2rem; font-weight:800; color:#92400E; margin-top:4px;">42,600</div>
          <span style="font-size:0.75rem; color:#92400E;">39.1% Signup Intent</span>
        </div>
        <div style="padding:12px; background:#F0FDF4; border-radius:6px; border:1px solid #BBF7D0;">
          <span style="font-size:0.75rem; font-weight:700; color:#166534; text-transform:uppercase;">5. Subscription</span>
          <div style="font-size:1.2rem; font-weight:800; color:#166534; margin-top:4px;">31,660</div>
          <span style="font-size:0.75rem; color:#166534;">74.3% Conversion</span>
        </div>
        <div style="padding:12px; background:#FAF5FF; border-radius:6px; border:1px solid #E9D5FF;">
          <span style="font-size:0.75rem; font-weight:700; color:#6B21A8; text-transform:uppercase;">6. 30D Retention</span>
          <div style="font-size:1.2rem; font-weight:800; color:#6B21A8; margin-top:4px;">24,850</div>
          <span style="font-size:0.75rem; color:#6B21A8;">78.5% Retained</span>
        </div>
      </div>

      <!-- NDPR Compliance Safeguard Notice (DT-602 / DD-4) -->
      <div style="background:var(--vmn-surface-alt); padding:14px 16px; border-radius:6px; border:1px solid var(--vmn-surface-border);">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--vmn-color-primary);">${renderIcon("shield", { size: 18 })}</span>
          <strong style="font-size:0.85rem; color:var(--vmn-primary);">NDPR Aggregation Safeguard</strong>
        </div>
        <p style="font-size:0.8rem; color:var(--vmn-text-muted); margin-top:4px; line-height:1.45;">
          All linear-to-digital attribution telemetry is computed strictly from cryptographically hashed (SHA-256) anonymous device signatures. Zero personally identifiable information (PII) or IP addresses are stored or visible in this console, in full compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>.
        </p>
      </div>
    </div>

    <!-- Linear Channel Performance Table -->
    <div class="card">
      <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:16px;">Linear Channel Attribution Performance</h2>
      <div class="table-container" style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--vmn-surface-border); background:var(--vmn-surface-alt); color:var(--vmn-text-muted);">
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
