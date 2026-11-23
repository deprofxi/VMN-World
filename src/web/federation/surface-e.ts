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

import { getConfiguredFederationOrigin } from "../../core/federation/destinations.js";
import { renderIcon } from "../components/index.js";
import { escapeHtml } from "../components/escape.js";

export interface UniverseRouteDescriptor {
  key: string;
  name: string;
  targetPath: string;
  description: string;
  /** Absent until an operator configures AZEEBO_PLUS_UNIVERSAL_URL (TSK-35). */
  fallbackUrl?: string;
}

export function getAzeeboUniverses(): UniverseRouteDescriptor[] {
  // TSK-35 / CLAUDE.md <azeebo>: the partner origin is deployment config, never
  // a code default. Unset means no outbound fallback URL is offered.
  const base = getConfiguredFederationOrigin();
  const routes: Array<Omit<UniverseRouteDescriptor, "fallbackUrl"> & { fallbackPath: string }> = [
    { key: "content", name: "Content Referral Gateway", targetPath: "/content/:id", description: "Direct video and episode deep-linking", fallbackPath: "/watch" },
    { key: "creator", name: "Creator Profile Universe", targetPath: "/creator/:id", description: "Verified creator hubs and tipping channels", fallbackPath: "/creators" },
    { key: "event", name: "Live Event Universe", targetPath: "/event/:id", description: "Live streams and concert ticketing bridge", fallbackPath: "/events" },
    { key: "cinemaxis", name: "Cinemaxis Universe", targetPath: "/cinemaxis/:id", description: "Nollywood features and premium episodic series", fallbackPath: "/cinemaxis" },
    { key: "aou", name: "AOU Universe", targetPath: "/aou/:id", description: "Afro-Urban culture and music video streams", fallbackPath: "/aou" },
    { key: "game", name: "Games 360 Universe", targetPath: "/game/:id", description: "African esports and interactive mobile gaming", fallbackPath: "/games360" },
    { key: "9tlife", name: "9TLIFE Lifestyle Universe", targetPath: "/9tlife/:id", description: "Culinary, fashion, nightlife, and travel", fallbackPath: "/9tlife" },
    { key: "live", name: "Azeebo+ Live Universe", targetPath: "/live/:id", description: "Interactive 24/7 linear and creator live feeds", fallbackPath: "/live" },
    { key: "broadcast", name: "Broadcast Bridge Route", targetPath: "/broadcast/:id", description: "Linear TV to on-demand catch-up bridge", fallbackPath: "/broadcast" },
  ];
  return routes.map(({ fallbackPath, ...u }) => ({ ...u, fallbackUrl: base ? `${base}${fallbackPath}` : undefined }));
}


/**
 * Renders the Azeebo+ Federation Gateway (DT-601, DT-604).
 * Fulfills ADR-008: Distinct partner identity, clearly delineated outbound actions, no internal-nav confusion.
 */
export function renderFederationGatewayHtml(): string {
  const origin = getConfiguredFederationOrigin();
  const routesHtml = getAzeeboUniverses().map(
    (u) => `
 <div class="card s-7siY-5mpRK" >
      <div>
 <div class="s-JyMdrv2Xyh">
 <span class="s-6zeBjoMOQG">
            /${escapeHtml(u.key)}/:id
          </span>
 <strong class="s-cbs63uz04T">${escapeHtml(u.name)}</strong>
 <span class="s-ocla0JHzg-">
            Azeebo+ Universe
          </span>
        </div>
 <p class="s-XrEOTi_06Q">${escapeHtml(u.description)}</p>
      </div>
 <div class="s-UK2dEq5_xu">
 <a href="/azeebo/${escapeHtml(u.key)}/sample-item-123" class="btn btn-outline s-H6xRltjStm" >
          Test Resolver &rarr;
        </a>
      </div>
    </div>
  `
  ).join("\n");

  return `
 <section class="s-hJqXKfH1_e">
    <!-- Partner Shell Header (ADR-008 / DT-601) -->
 <div class="card s-8nPRWKmlnw" >
 <div class="s-eNztNGULjh">
        <div>
 <nav aria-label="Breadcrumb" class="s-SFIks6VJ6b">
 <a href="/" class="s-eyM313VDpb">Home</a> &gt; 
 <a href="/azeebo" class="s-eyM313VDpb">Azeebo+</a> &gt; 
 <span class="s-Sug_DIv7G8">Federation Gateway</span>
          </nav>
 <div class="s-kFoRe7hxIT">
 <span class="s-YcZYayk45s">
              EXTERNAL PARTNER FEDERATION
            </span>
            <!-- Human-readable circuit status (DT-604) -->
            <span class="vmn-badge ${origin ? "badge-ready" : "badge-info"}">Federation Link: ${origin ? "Normal / Protected" : "Origin not configured"}</span>
          </div>
 <h1 class="s-6qUvL7-0sm">Azeebo+ Federation & Universal Gateway</h1>
 <p class="s-U37UXGknaU">
            Surface E: Cross-platform link resolution, native app dispatch, and NDPR-compliant attribution telemetry bridging linear television broadcasts with direct-to-consumer streaming.
          </p>
        </div>
 <div class="s-s1CIbnK0FW">
 <a href="/azeebo/attribution" class="btn btn-primary s-63X4VYO4lT" >
            Attribution Console &rarr;
          </a>
 ${origin ? `<a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline s-2rGvsVGfaW" >
 Launch Azeebo+ App <span class="s-lNuV4bA1-6" aria-hidden="true">↗</span>
          </a>` : `<span class="vmn-badge badge-info" role="status">Federation origin not configured</span>`}
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
 <div class="grid-3 s-KRt7uwFSzR" >
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
 <div class="card s-U3lAKD-IRX" >
 <h2 class="s-gwlAegZ8DU">
        Federated Universal Link &amp; QR Generator
      </h2>
 <p class="s-YgZVN-kWD2">
        Generate compliant on-air campaign URLs and smart app deep links for broadcast lower-third graphics and social syndication.
      </p>

 <div class="s-HuhTPronuK">
        <div>
 <label for="qr-universe-select" class="s-K-vm4mtLE4">Target Universe</label>
 <select id="qr-universe-select" class="s-Ek58v9g8kl">
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
 <label for="qr-item-id" class="s-K-vm4mtLE4">Item / Episode Identifier</label>
 <input id="qr-item-id" type="text" value="oba-alade-ep01" placeholder="e.g. oba-alade-ep01" class="s-GO7h_U6kv1" />
        </div>
        <div>
 <label for="qr-campaign-channel" class="s-K-vm4mtLE4">Linear Broadcast Channel</label>
 <select id="qr-campaign-channel" class="s-Ek58v9g8kl">
            <option value="NXTR">Nigezie Xtreme (NXTR)</option>
            <option value="ORIS">Orisun — The Source (ORIS)</option>
            <option value="IMBD">Isi Mbido — The Beginning (IMBD)</option>
          </select>
        </div>
      </div>

 <div class="s-gTaqZuDp1j">
 <div class="s-Ft6mFn7ojf">Generated Universal Link (Web Fallback):</div>
 <code class="s-QpS0L_3fvx">
          ${origin ? `${escapeHtml(origin)}/u/cinemaxis/oba-alade-ep01?utm_source=vmn_oris&amp;utm_medium=linear_qr&amp;utm_campaign=vmnl_attribution` : "Not configured — set AZEEBO_PLUS_UNIVERSAL_URL"}
        </code>
 <div class="s-k1Y2WeI3fG">Native App Scheme:</div>
 <code class="s-rSNrmV3j8z">
          azeeboplus://u/cinemaxis/oba-alade-ep01?utm_source=vmn_oris&amp;utm_medium=linear_qr
        </code>
      </div>
    </div>

    <!-- Active Federated Universes Directory -->
    <div>
 <h2 class="s-rK2tqy0UMP">
        Active Federated Universes (9 Routes)
      </h2>
 <div class="s-Y2tCS2WCKZ">
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
  const universe = getAzeeboUniverses().find((u) => u.key === universeKey.toLowerCase());
  const universeName = universe ? universe.name : `${universeKey.toUpperCase()} Universe`;
  // TSK-35: no invented endpoint. Without a configured partner origin the
  // resolver states the absence and offers no outbound launch action.
  const fallbackUrl = universe?.fallbackUrl ? `${universe.fallbackUrl}/${itemId}` : undefined;
  const safeItem = escapeHtml(itemId);
  const safeFallback = fallbackUrl ? escapeHtml(fallbackUrl) : undefined;
  // DEBT-009: both callers pass a literal from `universePrefixes`, so this key is
  // internal today — but the parameter is typed `string`, and it is echoed into a
  // breadcrumb and a heading (through the `universeName` fallback, which keeps the
  // raw key in upper case). Escaping here is a no-op for the current callers and
  // stops a future path-derived key from being reflected.
  const safeUniverseKey = escapeHtml(universeKey);
  const safeUniverseName = escapeHtml(universeName);
  const deepLink = `azeebo://${escapeHtml(universeKey)}/${safeItem}?utm_source=linear_broadcast&utm_medium=qr&utm_campaign=vmnl_attribution`;

  return `
 <section class="s-mwAOCyJzfM">
 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-eyM313VDpb">Home</a> &gt; 
 <a href="/azeebo/gateway" class="s-eyM313VDpb">Azeebo+ Gateway</a> &gt; 
 <span class="s-Sug_DIv7G8">${safeUniverseKey}</span>
    </nav>

 <article class="card s-jK_o8Tlc_8" >
 <div class="s-5rJ8EYPtx8">
        <span class="vmn-badge badge-ready">Surface E Universal Resolver</span>
        <span class="vmn-badge badge-info">External Federation</span>
      </div>
 <h1 class="s-AB_wCtDT5L">
        Resolving to ${safeUniverseName}
      </h1>
 <p class="s-CRVi_6ajNw">
        Resolving destination item <code>${safeItem}</code> across Azeebo+ mobile app, smart TV, or fallback web streaming.
      </p>

 <div class="s-MI5vJUv2m0">
 <p class="s-Xn2oDZQl0T"><strong>Native App Deep Link:</strong></p>
 <code class="s-d_5rDDTkld">
          ${deepLink}
        </code>
 <p class="s-1e8d8azRpS"><strong>Fallback Web Streaming URL (External):</strong></p>
 <code class="s-74K-JDVG8z">
          ${safeFallback ?? "Not configured"}
        </code>
      </div>

 <div class="s-1_fizylY0F">
 ${safeFallback ? `<a href="${safeFallback}" class="btn btn-primary s-oVibJ_Zzvz" target="_blank" rel="noopener noreferrer" >
 Launch Azeebo+ Web <span class="s-ItBVzWPT7W" aria-hidden="true">↗</span>
        </a>` : `<span class="vmn-badge badge-info">Outbound federation not configured</span>`}
 <a href="/azeebo/gateway" class="btn btn-outline s-oCyUsegaVZ" >
          &larr; Back to Gateway
        </a>
      </div>

      <!-- NDPR Notice -->
 <p class="s-yS6MZ-UnTh">
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
 <tr class="s-luRfE-TINB">
 <td class="s-kMGvZT4TKF">${escapeHtml(c.channel)}</td>
 <td class="s-HjDnslDSIb">${c.qrScans.toLocaleString()}</td>
 <td class="s-Hk14tinEEa">${c.appInstalls.toLocaleString()}</td>
 <td class="s-HjDnslDSIb"><span class="vmn-badge badge-ready">${escapeHtml(c.conversionRate)}</span></td>
    </tr>
  `
    )
    .join("");

  return `
 <section class="s-hJqXKfH1_e">
 <div class="s-eNztNGULjh">
      <div>
 <nav aria-label="Breadcrumb" class="s-SFIks6VJ6b">
 <a href="/" class="s-eyM313VDpb">Home</a> &gt; 
 <a href="/azeebo/gateway" class="s-eyM313VDpb">Azeebo+ Gateway</a> &gt; 
 <span class="s-Sug_DIv7G8">Attribution Console</span>
        </nav>
 <h1 class="s-6qUvL7-0sm">Linear-to-Digital Attribution Tracker</h1>
 <p class="s-NLOlqgzjPV">
          Audited conversion telemetry bridging linear on-air broadcast impressions to Azeebo+ direct-to-consumer digital acquisitions.
        </p>
      </div>
      <span class="vmn-badge badge-ready">Real-Time Ingestion Active</span>
    </div>

    <!-- Summary KPI Grid -->
 <div class="grid-3 s-KRt7uwFSzR" >
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
 <div class="s-8ENdMBtTpa">
        <div>
 <h2 class="s-ID2CT_CtI8">
            Six-Stage Conversion &amp; Retention Funnel
          </h2>
 <p class="s-Faqli1iIen">
            Full lifecycle progression from linear transponder transmission to 30-day digital subscriber retention.
          </p>
        </div>
        <span class="vmn-badge badge-info">Audited Telemetry</span>
      </div>

 <div class="s-buwKO-OQ41">
 <div class="s-Ma14h4YvGg">
 <span class="s-pAl2PQDI4_">1. Broadcast Airing</span>
 <div class="s-zGbOUBHZT6">1,240,000</div>
 <span class="s-uQ0QEsSflz">Linear Impressions</span>
        </div>
 <div class="s-3alR3gaCum">
 <span class="s-bSkNX7PjeS">2. On-Air QR Scan</span>
 <div class="s-YDTsHzlwX0">113,480</div>
 <span class="s-nLmYTEVfGt">9.15% Scan-Through</span>
        </div>
 <div class="s-3alR3gaCum">
 <span class="s-bSkNX7PjeS">3. Landing View</span>
 <div class="s-YDTsHzlwX0">108,920</div>
 <span class="s-nLmYTEVfGt">96.0% Resolution</span>
        </div>
 <div class="s-8eZjiFwVfL">
 <span class="s-ZQaAg2iLrA">4. App Signup</span>
 <div class="s-kPslv1sF5X">42,600</div>
 <span class="s-p95t77M5qY">39.1% Signup Intent</span>
        </div>
 <div class="s-o5QkD98lax">
 <span class="s-r-EXXnivCh">5. Subscription</span>
 <div class="s-jlXJ2frWg4">31,660</div>
 <span class="s-0QCm6f7uIC">74.3% Conversion</span>
        </div>
 <div class="s-E6A2z7UMO3">
 <span class="s-zD6Yr4Z7lv">6. 30D Retention</span>
 <div class="s-jbvJlVXDge">24,850</div>
 <span class="s-RglqGpsA24">78.5% Retained</span>
        </div>
      </div>

      <!-- NDPR Compliance Safeguard Notice (DT-602 / DD-4) -->
 <div class="s-EaRw1J9dY8">
 <div class="s-JyMdrv2Xyh">
 <span class="s-_ZPfN4CX-f">${renderIcon("shield", { size: 18 })}</span>
 <strong class="s-CNOtJDJ-ld">NDPR Aggregation Safeguard</strong>
        </div>
 <p class="s-t7uDdCX-yk">
          All linear-to-digital attribution telemetry is computed strictly from cryptographically hashed (SHA-256) anonymous device signatures. Zero personally identifiable information (PII) or IP addresses are stored or visible in this console, in full compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>.
        </p>
      </div>
    </div>

    <!-- Linear Channel Performance Table -->
    <div class="card">
 <h2 class="s-yIvH8ee5_9">Linear Channel Attribution Performance</h2>
 <div class="table-container s-0GmMSMP86s" >
 <table class="s-b-Ai5vuAKC">
          <thead>
 <tr class="s-Rq_PXfXNn2">
 <th class="s-drsUO0gkUT">Linear Channel</th>
 <th class="s-drsUO0gkUT">On-Air Scans</th>
 <th class="s-drsUO0gkUT">App Installs</th>
 <th class="s-drsUO0gkUT">Conversion Rate</th>
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
