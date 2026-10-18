/**
 * Broadcast Executive Dashboard (Screen 1: SCR-BCST-01) & Web Surface Layout
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §46 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Intended presentation standards (not a conformance certification):
 * - 4px / 8px spacing token scale
 * - Accessibility-minded presentation; full WCAG 2.2 AA conformance is not verified here
 * - Touch targets >= 44x44px
 * - Interactive states are implemented where applicable; completeness requires review
 * - Accessible semantic HTML structure
 */

import { getAllActiveChannels } from "../../modules/broadcast/channels/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../modules/broadcast/screens/index.js";
import { PUBLIC_CHANNELS } from "./channels.js";
import { VMN_ENTERPRISE_PILLARS, VMN_LEADERSHIP, CorporatePortalService } from "./corporate.js";
import { HUB_SHOWCASES } from "./hub.js";
import { escapeHtml, renderIcon } from "../components/index.js";
import { PUBLIC_INDEXABLE_PATHS } from "./public-route-registry.js";

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

import { SessionUser } from "../../core/auth/index.js";

export interface MasterLayoutOptions {
  shell?: "public" | "work" | "portal" | "identity";
  operatorRole?: string;
  counterpartyName?: string;
  projectName?: string;
  sessionUser?: SessionUser | null;
  description?: string;
}

export function renderMasterLayout(
  title: string,
  bodyContent: string,
  activeNav = "/",
  options?: MasterLayoutOptions
): string {
  // AUD-18: request-derived titles are escaped before interpolation. AUD-32:
  // canonical + OpenGraph/Twitter metadata is rendered from the corporate
  // SEO registry so public surfaces carry complete social/crawler metadata.
  const safeTitle = escapeHtml(title);
  const seo = CorporatePortalService.getSeoMetadata();
  const canonicalPath = activeNav.split("?")[0] || "/";
  const canonicalUrl = PUBLIC_INDEXABLE_PATHS.has(canonicalPath)
    ? `${seo.canonicalUrl.replace(/\/+$/, "")}${canonicalPath === "/" ? "" : canonicalPath}`
    : undefined;
  const ogTags = Object.entries(seo.openGraph)
    .map(([property, content]) => `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}">`)
    .join("\n  ");

  // Determine presentation shell (Docx §2, §5: S-PUBLIC, S-WORK, S-PORTAL, S-IDENTITY)
  const effectiveShell = options?.shell || (
    activeNav.startsWith("/sign-in") || activeNav.startsWith("/auth") || activeNav.startsWith("/access") || activeNav.startsWith("/account") || activeNav === "/login" || activeNav === "/select-workspace" ? "identity" :
    activeNav.startsWith("/workspace") || activeNav.startsWith("/broadcast") ? "work" :
    activeNav.startsWith("/portal") || activeNav.startsWith("/apply") ? "portal" :
    "public"
  );

  // Determine active persona role simulation
  const selectedPersona =
    activeNav.includes("screen=application") || activeNav.startsWith("/apply") ? "applicant" :
    activeNav.includes("screen=terms") ? "talent" :
    activeNav.includes("screen=client") || activeNav.startsWith("/portal") ? "client" :
    effectiveShell === "work" || activeNav.includes("screen=work") || activeNav.includes("screen=schedule") || activeNav.includes("screen=proof") ? "operator" :
    "visitor";

  let shellContent: string;

  if (effectiveShell === "identity") {
    shellContent = `
 <div class="vmn-shell-identity s-6zHWoHowdm" >
        ${bodyContent}
      </div>
    `;
  } else if (effectiveShell === "work") {
    shellContent = `
      <div class="vmn-shell-work-layout">
        <aside class="vmn-work-rail" aria-label="Operator Workstation Navigation">
          <div class="vmn-work-rail-title">Workstations</div>
          <a href="/workspace" class="vmn-work-rail-link ${activeNav === "/workspace" ? "active" : ""}">
            <span>Dashboard</span>
          </a>
          <a href="/broadcast/screens" class="vmn-work-rail-link ${activeNav.startsWith("/broadcast/screens") ? "active" : ""}">
            <span>Screens Catalog</span>
          </a>
          <a href="/broadcast/dashboard" class="vmn-work-rail-link ${activeNav.startsWith("/broadcast/dashboard") ? "active" : ""}">
            <span>Broadcast Exec</span>
          </a>
          <a href="/workspace/admissions" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/admissions") ? "active" : ""}">
            <span>Admissions Review</span>
          </a>
          <a href="/prototypes?screen=work" class="vmn-work-rail-link ${activeNav.startsWith("/prototypes") ? "active" : ""}">
            <span>R1.1 Prototypes</span>
          </a>
 <div class="vmn-work-rail-title s-smrs69HMBJ" >Operator Context</div>
 <div class="s-yaQ1Wd-ncP">
            <strong>Role:</strong> ${escapeHtml(options?.operatorRole || "Broadcast Operations")}<br>
 <span class="s-orRLFYu8o-">Gate: Locked (Green)</span>
          </div>
        </aside>
        <div class="vmn-work-main">
          ${bodyContent}
        </div>
      </div>
    `;
  } else if (effectiveShell === "portal") {
    shellContent = `
      <div class="vmn-shell-portal">
        <div class="vmn-portal-banner">
          <div>
 <div class="s-RXQtu1lQIZ">
              Counterparty Portal
            </div>
            <div class="vmn-portal-counterparty">${escapeHtml(options?.counterpartyName || "Authorized Counterparty")}</div>
 ${options?.projectName ? `<div class="s-fClvy0XunL">Project Ref: <strong>${escapeHtml(options.projectName)}</strong></div>` : ""}
          </div>
 <div class="s-66kjxA-b-z">
            <span class="vmn-badge badge-ready">Authenticated &amp; Verified</span>
 <a href="/prototypes?screen=client" class="btn btn-outline s-jv_H3_hWre" >Delivery Proof</a>
          </div>
        </div>
        ${bodyContent}
      </div>
    `;
  } else {
    shellContent = `
      <div class="vmn-shell-public">
        ${bodyContent}
      </div>
    `;
  }

  // Dynamic structured data (AUD-29 / BreadcrumbList & Course)
  const structuredDataList: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Virtual Media Network Limited",
      url: seo.canonicalUrl,
      logo: `${seo.canonicalUrl}/favicon.ico`,
      description: seo.description,
    },
  ];

  if (canonicalUrl && activeNav !== "/" && !activeNav.startsWith("/api")) {
    const segments = activeNav.split("/").filter(Boolean);
    const itemListElement = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: seo.canonicalUrl,
      },
    ];
    let currentPath = "";
    segments.forEach((seg, index) => {
      currentPath += `/${seg}`;
      itemListElement.push({
        "@type": "ListItem",
        position: index + 2,
        name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
        item: `${seo.canonicalUrl.replace(/\/+$/, "")}${currentPath}`,
      });
    });
    structuredDataList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    });
  }

  if (activeNav.includes("afca") || activeNav.includes("course") || activeNav.includes("academy")) {
    structuredDataList.push({
      "@context": "https://schema.org",
      "@type": "Course",
      name: safeTitle,
      description: options?.description || "AFCA Creative Academy Professional Broadcast & Film Curriculum",
      provider: {
        "@type": "Organization",
        name: "AFCA Creative Academy",
        sameAs: seo.canonicalUrl,
      },
    });
  }

  const jsonLdScripts = structuredDataList
    .map((item) => `<script type="application/ld+json">${serializeJsonLd(item)}</script>`)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Virtual Media Network Limited</title>
  <meta name="description" content="${options?.description ? escapeHtml(options.description) : `${safeTitle} — Virtual Media Network Limited (VMNL), linear channel profiles, creative economy hub, and federated media ecosystem.`}">
  ${canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">` : '<meta name="robots" content="noindex, nofollow">'}
  ${ogTags}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle} | VMNL">
  <meta name="twitter:image" content="${escapeHtml(seo.openGraph["og:image"] || "")}">
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="/assets/styles.css">
  ${jsonLdScripts}
</head>
<body>
  <a href="#main-content" class="skip-to-content">Skip to content</a>
  <header class="vmn-navbar">
    <a href="/" class="vmn-brand-group">
      <span class="vmn-brand-logo">VMNL</span>
      <span class="vmn-brand-title">Virtual Media Network Limited</span>
    </a>
    <nav class="vmn-nav-links" aria-label="Main Navigation">
      <a href="/" class="${activeNav === "/" ? "active" : ""}">Overview</a>
      <a href="/channels" class="${activeNav.startsWith("/channels") ? "active" : ""}">Channels</a>
      <a href="/hub" class="${activeNav.startsWith("/hub") ? "active" : ""}">Hub</a>
      <a href="/workspace" class="${activeNav.startsWith("/workspace") ? "active" : ""}">Workspaces</a>
      <a href="/broadcast/screens" class="${activeNav.startsWith("/broadcast") ? "active" : ""}">Broadcast Consoles</a>
      <a href="/azeebo/gateway" class="${activeNav.startsWith("/azeebo") ? "active" : ""}">Azeebo+</a>
      <a href="/prototypes" class="${activeNav.startsWith("/prototypes") ? "active" : ""}">Prototypes</a>
      <a href="/docs" class="${activeNav.startsWith("/docs") ? "active" : ""}">API Docs</a>
      <a href="/styleguide" class="${activeNav.startsWith("/styleguide") ? "active" : ""}">Styleguide</a>
    </nav>
 <div class="vmn-header-controls s-ptjc12saB7" >
      <!-- Upgrade 5: Interactive Persona Role Switcher -->
      <select id="vmn-persona-switcher" class="vmn-persona-select" aria-label="Simulate Persona Role" title="Simulate Persona Role">
        <option value="visitor" ${selectedPersona === "visitor" ? "selected" : ""}>Role: Visitor</option>
        <option value="applicant" ${selectedPersona === "applicant" ? "selected" : ""}>Role: Applicant (AFCA)</option>
        <option value="talent" ${selectedPersona === "talent" ? "selected" : ""}>Role: Talent (Agreement)</option>
        <option value="client" ${selectedPersona === "client" ? "selected" : ""}>Role: Client (Sponsor)</option>
        <option value="operator" ${selectedPersona === "operator" ? "selected" : ""}>Role: Operator (MCR)</option>
      </select>

      <!-- Upgrade 1: Command Palette Quick Jump Trigger -->
      <button id="vmn-cmd-trigger" class="vmn-cmd-trigger-btn" type="button" aria-label="Open Command Palette (Cmd+K)" title="Quick Jump (Cmd+K)">
        ${renderIcon("search", { size: 16 })}
        <span>Quick Jump</span>
        <kbd class="vmn-kbd-shortcut">${renderIcon("command", { size: 12 })}K</kbd>
      </button>

      <!-- Upgrade 2: Live Theme Switcher (Editorial Light / MCR Dark) -->
      <button id="vmn-theme-toggle" class="vmn-theme-toggle-btn" type="button" aria-label="Toggle Theme" title="Toggle Light / Dark MCR Theme">
        <span class="vmn-theme-moon" aria-hidden="true">${renderIcon("moon", { size: 18 })}</span>
        <span class="vmn-theme-sun" aria-hidden="true">${renderIcon("sun", { size: 18 })}</span>
      </button>

 <div class="vmn-auth-nav s-MIjaETFWG6" >
        ${options?.sessionUser ? `
 <a href="/select-workspace" class="vmn-user-badge s-l1BkvSuQ0r" title="Active Account: ${escapeHtml(options.sessionUser.email)}" >
 <span class="s-pwaogUn48s" aria-hidden="true"></span>
            <span>${escapeHtml(options.sessionUser.email.split("@")[0])}</span>
 <span class="vmn-badge badge-info s-JGXixDqttN" >${escapeHtml(options.sessionUser.roles[0] || "Operator")}</span>
          </a>
 <a href="/select-workspace" class="btn btn-outline s-7FzfRckINI" >Switch</a>
 <form method="GET" action="/sign-out" class="s-OZBX34IsZp">
 <button class="btn btn-secondary" type="submit" >Sign Out</button>
          </form>
        ` : `
 <a href="/sign-in" class="btn btn-primary s-oeOZ4DWkWB" >
            Sign In
          </a>
        `}
      </div>

      <!-- Upgrade 3: Mobile Hamburger Button -->
      <button id="vmn-mobile-menu-btn" class="vmn-hamburger-btn" type="button" aria-label="Open Navigation Drawer" aria-controls="vmn-mobile-drawer" aria-expanded="false" title="Open Navigation Menu">
        ${renderIcon("menu", { size: 22 })}
      </button>
    </div>
  </header>    <!-- Broadcast carriage and playout are unavailable without verified sources -->

  <div class="vmn-playout-ticker" role="region" aria-label="Broadcast Status Notice">
    <div class="vmn-ticker-channels">
      <span class="vmn-ticker-pill"><span>Nigezie Xtreme — profile</span></span>
      <span class="vmn-ticker-pill"><span>Orisun — The Source — profile</span></span>
      <span class="vmn-ticker-pill"><span>Isi Mbido — The Beginning — profile</span></span>
    </div>
 <div class="s-uZB0rvzbTa">
 <span class="s-SsndUGHwNV">Carriage and live playout status: not verified in this environment.</span>
 <a href="/broadcast/dashboard" class="s-RkrlTxtnr0">MCR Console</a>
    </div>
  </div>

  <main id="main-content" class="vmn-container">
    ${shellContent}
  </main>

  <footer class="vmn-footer">
    <p>&copy; ${new Date().getUTCFullYear()} Virtual Media Network Limited (VMNL). Company registration reference is not available in this environment.</p>
 <p class="s-HMPTnqxttI">
      Carriage, regulatory alignment, and accessibility conformance require independent verification |
 <a href="/prototypes" class="s-ow5mQx8PkA">R1.1 Prototypes</a> |
 <a href="/styleguide" class="s-X2rKp2NoRP s-ow5mQx8PkA">Design System Styleguide</a>
    </p>
  </footer>

  <!-- Upgrade 3: Mobile Touch Drawer -->
  <div id="vmn-drawer-backdrop" class="vmn-drawer-backdrop" aria-hidden="true" inert></div>
  <aside id="vmn-mobile-drawer" class="vmn-mobile-drawer" aria-label="Mobile Navigation" aria-hidden="true" inert>
    <div class="vmn-drawer-header">
 <div class="s-I2zXYM0lPc">VMN Navigation</div>
 <button id="vmn-drawer-close" class="btn btn-outline s-TYZl3AGPJs" aria-label="Close Navigation Drawer" type="button">
        ${renderIcon("x", { size: 20 })}
      </button>
    </div>
    <div class="vmn-drawer-body">
      <a href="/" class="vmn-drawer-link ${activeNav === "/" ? "active" : ""}">
        <span>Overview</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/channels" class="vmn-drawer-link ${activeNav.startsWith("/channels") ? "active" : ""}">
        <span>Channels</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/hub" class="vmn-drawer-link ${activeNav.startsWith("/hub") ? "active" : ""}">
        <span>Hub</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/workspace" class="vmn-drawer-link ${activeNav.startsWith("/workspace") ? "active" : ""}">
        <span>Workspaces</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/broadcast/screens" class="vmn-drawer-link ${activeNav.startsWith("/broadcast") ? "active" : ""}">
        <span>Broadcast Consoles</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/azeebo/gateway" class="vmn-drawer-link ${activeNav.startsWith("/azeebo") ? "active" : ""}">
        <span>Azeebo+</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/prototypes" class="vmn-drawer-link ${activeNav.startsWith("/prototypes") ? "active" : ""}">
        <span>Prototypes</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/docs" class="vmn-drawer-link ${activeNav.startsWith("/docs") ? "active" : ""}">
        <span>API Docs</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
      <a href="/styleguide" class="vmn-drawer-link ${activeNav.startsWith("/styleguide") ? "active" : ""}">
        <span>Styleguide</span>
        ${renderIcon("chevronRight", { size: 16 })}
      </a>
 <div class="s-6KhtRR-75u">
 <button id="vmn-mobile-cmd-trigger" class="btn btn-outline s-9jB4MKeVDu" type="button">
          ${renderIcon("search", { size: 16 })}
          <span>Command Palette (Cmd+K)</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- Upgrade 3: Sticky Mobile Action Bar -->
  <nav class="vmn-mobile-action-bar" aria-label="Quick Mobile Actions">
 <a href="/" class="btn btn-outline s-HesoKjT-3s" >
      Overview
    </a>
 <a href="/channels" class="btn btn-outline s-HesoKjT-3s" >
      Channels
    </a>
 <a href="/prototypes" class="btn btn-primary s-HesoKjT-3s" >
      Prototypes
    </a>
 <button id="vmn-mobile-quick-jump" class="btn btn-secondary s-CQl5S4Goep" aria-label="Open Quick Jump" type="button">
      ${renderIcon("command", { size: 18 })}
    </button>
  </nav>

  <!-- Upgrade 1: Universal Command Palette (Cmd+K) Modal -->
  <!-- The inert attribute makes the initial state identical to the closed state
       the client engine produces: the command backdrop is display:none while
       closed and the engine also sets inert on close. Without it the palette's
       text input and close button are tabbable in the window before the
       stylesheet applies, which a browser-run check reports as
       aria-hidden-focus (serious). -->
  <div id="vmn-cmd-backdrop" class="vmn-cmd-backdrop" aria-hidden="true" inert>
    <div class="vmn-cmd-dialog">
      <div class="vmn-cmd-header">
        ${renderIcon("search", { size: 20 })}
        <input type="text" id="vmn-cmd-input" class="vmn-cmd-input" placeholder="Type a screen, destination, or command..." autocomplete="off" spellcheck="false" aria-label="Search destinations and commands">
 <button id="vmn-cmd-close" class="btn btn-outline s-TYZl3AGPJs" aria-label="Close Command Palette" type="button">
          ${renderIcon("x", { size: 16 })}
        </button>
      </div>
      <div id="vmn-cmd-results" class="vmn-cmd-list">
        <!-- Dynamically populated via client engine -->
      </div>
      <div class="vmn-cmd-footer">
        <span>Use <kbd>Up/Down</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to dismiss</span>
        <span>VMN Command Engine</span>
      </div>
    </div>
  </div>

  <script src="/assets/app.js" defer></script>
</body>
</html>`;
}

export function renderHomePageHtml(): string {
  const pillarsHtml = VMN_ENTERPRISE_PILLARS.map(
    (p) => `
    <div class="card">
      <span class="vmn-badge badge-info">Core Pillar</span>
      <h3>${escapeHtml(p.name)}</h3>
      <p><strong>${escapeHtml(p.tagline)}</strong></p>
      <p>${escapeHtml(p.description)}</p>
      <div>
 <a href="${escapeHtml(p.route)}" class="btn btn-outline s-VJeXj8pErV" >Explore ${escapeHtml(p.name)} &rarr;</a>
      </div>
    </div>`
  ).join("");

  const leadershipHtml = VMN_LEADERSHIP.map(
    (l) => `
    <div class="card">
      <h3>${escapeHtml(l.name)}</h3>
 <p class="s-IKxj0RyDd9">${escapeHtml(l.title)}</p>
      <p>${escapeHtml(l.bio)}</p>
    </div>`
  ).join("");

  return `
    <!-- UX-PUB-001 Public Home (Docx §8.1 Strict Content Order) -->
    <!-- 1. Approved Identity & Enterprise Proposition -->
 <div class="vmn-public-hero"> <span class="vmn-badge badge-info" >
        Company &amp; Service Information

      </span>
 <h1 class="s-fXYCwQiExM">
        Virtual Media Network Limited
      </h1>
 <p class="s-XeMbtwZkHw">
        Company information and preliminary channel and service profiles. Operational reach and availability require independent confirmation.
      </p>

      <!-- 2. Primary Discovery Actions -->
 <div class="s-GNTtGikGkV">
 <a href="/channels" class="btn s--8JyK_kOM6" >Explore Channels</a>
 <a href="/apply" class="btn btn-outline s-ZGGQlq0DNk" >Apply to AFCA Academy</a>
 <a href="/contact" class="btn btn-outline s-ZGGQlq0DNk" >Commercial Enquiry</a>
 <a href="/azeebo/gateway" class="btn btn-outline s-ZGGQlq0DNk" >Open Azeebo+</a>
      </div>
    </div>

    <!-- 3. Television Portfolio -->
 <section class="s-v5Ur2NUF3i">
 <div class="s-X1u32Y8E_Y">
 <h2 class="s-kiY9qPT64l">Linear Television Portfolio</h2>
 <span class="s-WGpZZ_z1O2">Carriage details require independent verification</span>
      </div>
 <div class="grid grid-cols-1 s-U3mAiGQfXk" >
 <div class="card s-cR03ntYskl" >
 <div class="s-jXl2S6cRQl">
            <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
          </div>
 <h3 class="s-mPpGGeNTY-">Nigezie Xtreme</h3>
 <p class="s-wkp7gtaNQP">
            Illustrative channel profile only — programming, transmission format, and operating status are not verified.
          </p>
 <a href="/channels" class="btn btn-outline s-fOBIvQAQx9" >View Channel &rarr;</a>
        </div>

 <div class="card s-8YvkPKKI0f" >
 <div class="s-jXl2S6cRQl">
            <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
          </div>
 <h3 class="s-mPpGGeNTY-">Orisun &mdash; The Source</h3>
 <p class="s-wkp7gtaNQP">
            Illustrative channel profile only — programme catalogue and current language/genre offering are not verified.
          </p>
 <a href="/channels" class="btn btn-outline s-fOBIvQAQx9" >View Channel &rarr;</a>
        </div>

 <div class="card s-7ndtghkGqf" >
 <div class="s-jXl2S6cRQl">
            <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-QXJ2BWOxXS">Carriage details unverified</span>
          </div>
 <h3 class="s-mPpGGeNTY-">Isi Mbido &mdash; The Beginning</h3>
 <p class="s-wkp7gtaNQP">
            Illustrative channel profile only — programme catalogue, language offering, and production status are not verified.
          </p>
 <a href="/channels" class="btn btn-outline s-fOBIvQAQx9" >View Channel &rarr;</a>
        </div>
      </div>
    </section>

    <!-- 4. Three Enterprise Pillars -->
 <section class="s-v5Ur2NUF3i">
 <h2 class="s-s6pDqxPgfb">The Three Enterprise Pillars</h2>
      <div class="grid-3">${pillarsHtml}</div>
    </section>

    <!-- 5. Azeebo+ Federated Gateway Banner -->
    <section class="vmn-azeebo-gateway-banner">
      <div>
 <span class="vmn-badge badge-info s-fzy69kMBd1" >Federated Service Information</span>
 <h3 class="s-My14PRdW73">Azeebo+ Digital Federation</h3>
 <p class="s-pcv7bzKm7i">
          Azeebo+ operates separately. Service integration, catalogue, masterclasses, commerce, and availability are not verified by this site.
        </p>
      </div>
 <a href="/azeebo/gateway" class="btn btn-primary s-k8bh1Lt-AT" >
        Open Azeebo+ Gateway &rarr;
      </a>
    </section>

    <!-- 6. Executive Leadership -->
 <section class="s-OlWl1HuGdH">
 <h2 class="s-s6pDqxPgfb">Executive Leadership</h2>
      <div class="grid-3">${leadershipHtml}</div>
    </section>
  `;
}

export function renderChannelsPageHtml(): string {
  const channels = getAllActiveChannels();
  const channelsHtml = channels.map((c) => {
    const pub = PUBLIC_CHANNELS.find((p) => p.code === c.code);

    // AUD-21: no fabricated schedule data is published. The platform's own
    // honesty gate refuses placeholder EPG on the API; the public page must
    // carry the same provenance discipline via an explicit notice instead of
    // hardcoded now/next programmes.
    const widgetHtml = `
 <div class="card s-KTPdfm94PP" role="note" aria-label="Schedule availability notice" >
        <strong>Schedule Notice:</strong> The now/next programme widget is unavailable because no approved schedule source is connected. Programme data will appear here once the approved schedule is published.
      </div>
    `;

    return `
      <div class="card">
 <div class="s-wrzqCFgz1Y">
          <span class="vmn-badge badge-info">Channel profile</span>
 <span class="s-sMs-d-vDCO">Carriage details unverified</span>
        </div>
        <!-- The channel accent is a graphic accent, not a text colour: the
             design tokens document #FFB800 as "Gold graphic accent (non-text
             fills & rules)" and it measures 1.73:1 on white, well under the
             4.5:1 a heading needs. Carrying the channel identity as a rule
             keeps the brand cue and passes contrast. -->
 <h2 style="border-left: 6px solid ${pub?.accentColor || "var(--vmn-color-border)"}; padding-left: 12px;">${c.name} (${c.code})</h2>
 <p role="note" class="s-PohgnhBczo">Channel profile details, audience, and programming are illustrative and have not been independently verified.</p>
 <p role="note" class="s-PohgnhBczo">Live transmission status is not available from a verified source.</p>
 <p role="note" class="s-wNcgL978zj">Technical transmission specifications are not independently verified in this environment.</p>
 <div class="s-nJzuIJPje9">
          ${widgetHtml}
        </div>
 <div class="s-7YQOhpfSlA">
          <a href="/api/v1/broadcast/epg/${c.code}" class="btn btn-outline" target="_blank">XMLTV Feed Status</a>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section>
 <h1 class="s-EvOiLPkWFM">Linear Television Networks</h1> <p class="s-CiIddUhIXm">Channel profiles for Nigezie Xtreme, Orisun, and Isi Mbido. Audience, carriage, transmission, technical format, and approved schedules are not verified in this environment.</p>

      <div class="grid-3">${channelsHtml}</div>
    </section>
  `;
}

export function renderHubPageHtml(): string {
  const showcases = Object.values(HUB_SHOWCASES).map(
    (h) => `
 <div class="card s-b7eWsqp9Kb" >
      <div>
        <span class="vmn-badge badge-info">${escapeHtml(h.vertical.replace(/_/g, " "))}</span>
 <h3 class="s-IAGJCAkVYI">${escapeHtml(h.title)}</h3>
 <p class="s-UV4jR8FkaI">${escapeHtml(h.tagline)}</p>
 <p class="s-c2PfvaQ8Fc">${escapeHtml(h.description)}</p>
      </div>
 <div class="s-0mWmubkRs3">
 <a href="${escapeHtml(h.route)}" class="btn btn-primary s-G-ZfEXX507" >${escapeHtml(h.callToAction)} &rarr;</a>
      </div>
    </div>`
  ).join("");

  return `
    <section>
 <h1 class="s-EvOiLPkWFM">Creative Economy Hub</h1>
 <p class="s-CiIddUhIXm">
        Preliminary profiles describe potential programme areas; service availability, training, financing, rights, and monetization are not verified.
      </p>
      <div class="grid-3">${showcases}</div>
    </section>
  `;
}

export function renderDashboardHtml(): string {
  const screens = BROADCAST_SCREEN_INVENTORY.slice(0, 8);
  const screenCardsHtml = screens.map(
    (s) => `
 <div class="card s-hytmU7OdYa" >
 <div class="s-bZSnD2ctGg">
        <span class="vmn-badge badge-info">${s.screenId}</span>
 <span class="s-odCaPyPU5v">${s.primaryRole}</span>
      </div>
 <h4 class="s-yctsEeBqm4">${s.name}</h4>
 <p class="s-kzqO8p4Zcp">${s.description}</p>
 <code class="s-6B2xY_NIp2">${s.route}</code>
    </div>`
  ).join("");

  return `
    <section>
 <div class="s-2CkJPDLqd9">
        <div>
          <span class="vmn-badge badge-info">Operational Screen: SCR-BCST-01</span>
 <h1 class="s-fbLZVvKdwC">Broadcast Executive Dashboard</h1>
 <p class="s-PohgnhBczo">Live transmission, carriage, playout, and financial telemetry are not connected to a verified source in this environment.</p>
        </div>
 <div class="s-1jFqfgs1FA">
          <a href="/docs" class="btn btn-outline" id="btn-eval-gates">Release Gates API Reference</a>
          <a href="/metrics" class="btn btn-outline" target="_blank">View Prometheus Metrics</a>
        </div>
      </div>

 <div class="card" role="status" >
        <strong>Telemetry unavailable.</strong> This screen has no verified live data connection; illustrative metrics are intentionally withheld.
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>Transmission &amp; Carriage Status</h3>
          <p>Headend telemetry is not connected in this environment. No verified live status is available.</p>
 <div class="s-KZv4iqugu6">
            <div class="card" role="note">Nigezie Xtreme (NXTR) — carriage and transmission status unavailable.</div>
            <div class="card" role="note">Orisun (ORIS) — carriage and transmission status unavailable.</div>
            <div class="card" role="note">Isi Mbido (IMBD) — carriage and transmission status unavailable.</div>
          </div>
        </div>

        <div class="card">
          <h3>Azeebo+ Federation Circuit Breaker</h3>
          <p>Event mesh and direct-to-consumer referral bridge status:</p>
 <div class="stat-box s-NsoK_xD1ma" role="note">
            <span class="stat-lbl">Federation Status</span>
            <span class="stat-val">Not connected</span>
 <span class="s-odCaPyPU5v">No verified circuit-breaker or queue telemetry is available.</span>
          </div>
 <div class="s-nJzuIJPje9">
            <p>Referral-link activity is not reported without a connected, verified Azeebo+ source.</p>
          </div>
        </div>
      </div>

 <div class="s-OlWl1HuGdH">
 <h2 class="s-_TKh5cydie">Broadcast Operational Screens Quick-Access</h2>
 <p class="s-wksV0PHkk4">Core control surfaces from the complete 33-screen operational inventory (R1.2A §46):</p>
 <div class="s-U3mAiGQfXk">
          ${screenCardsHtml}
        </div>
 <div class="s-dW2umzynPj">
          <a href="/broadcast/screens" class="btn btn-primary">Browse All 33 Operational Screen Surfaces &rarr;</a>
          <a href="/api/v1/broadcast/screens" class="btn btn-outline" target="_blank">View JSON Schema</a>
        </div>
      </div>
    </section>

  `;
}
