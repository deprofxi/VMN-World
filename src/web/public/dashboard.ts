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
import { CorporatePortalService } from "./corporate.js";
import { HUB_SHOWCASES } from "./hub.js";
import { escapeHtml, renderIcon } from "../components/index.js";
import type { SafeHtml } from "../components/escape.js";
import { PUBLIC_INDEXABLE_PATHS } from "./public-route-registry.js";
import { PRIMARY_NAV } from "./site-registry.js";
import { ENTERPRISE_WORKSPACES } from "../workspace/surface-bc.js";

const PILLAR_GROUPS = [
  {
    title: "Executive & Governance",
    badge: "Pillar 1",
    desks: ENTERPRISE_WORKSPACES.slice(0, 12),
  },
  {
    title: "Linear MCR & Playout",
    badge: "Pillar 2",
    desks: ENTERPRISE_WORKSPACES.slice(12, 24),
  },
  {
    title: "Creative Hub & Academy",
    badge: "Pillar 3",
    desks: ENTERPRISE_WORKSPACES.slice(24, 36),
  },
  {
    title: "Commercial & Finance",
    badge: "Pillar 4",
    desks: ENTERPRISE_WORKSPACES.slice(36, 48),
  },
];

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

// The one primary navigation list lives in `site-registry.ts`, which also builds
// the command palette's destinations from it — the header nav and the palette
// therefore cannot disagree about where the site's pages are.

function navIsActive(activeNav: string, href: string): boolean {
  return href === "/" ? activeNav === "/" : activeNav.startsWith(href);
}

/**
 * Ship markup, not pretty-printed markup. HTML comments, per-line indentation
 * and blank lines cost bytes on every request and are invisible to the reader;
 * a 25 KB shell budget (DEBT-008) is spent on content instead. Newlines are
 * kept, because whitespace between inline elements is meaningful.
 */
export function compactMarkup(html: string): string {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{2,}/g, "\n");
}

export function renderMasterLayout(
  title: string,
  // A migrated renderer returns markup from the `html` write boundary; a legacy
  // one returns a string. Both are interpolated as-is below, and a `SafeHtml`
  // interpolated into a plain template prints its markup through `toString()`.
  bodyContent: string | SafeHtml,
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
          <div class="vmn-work-rail-brand-badge">
            <span class="vmn-pulse-dot" aria-hidden="true"></span>
            <span>MCR Workstation Rail</span>
          </div>

          <!-- Section 1: Executive & Operational Hub -->
          <div class="vmn-work-rail-title">Operations &amp; Hub</div>
          <a href="/workspace" class="vmn-work-rail-link ${activeNav === "/workspace" ? "active" : ""}">
            <span>Workspaces Hub (48)</span>
          </a>
          <a href="/workspace/executive" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/executive") ? "active" : ""}">
            <span>Executive Command</span>
          </a>
          <a href="/workspace/projects" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/projects") ? "active" : ""}">
            <span>Projects Center</span>
          </a>

          <!-- Section 2: Master Control & Playout Operations -->
          <div class="vmn-work-rail-title mt-2">Linear &amp; MCR Playout</div>
          <a href="/workspace/mcr" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/mcr") ? "active" : ""}">
            <span>MCR Supervisor</span>
          </a>
          <a href="/workspace/asrun" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/asrun") || activeNav.startsWith("/broadcast/asrun") ? "active" : ""}">
            <span>As-Run &amp; Make-Good</span>
          </a>

          <!-- Section 3: Commercial Sales & Contracts -->
          <div class="vmn-work-rail-title mt-2">Commercial &amp; Sales</div>
          <a href="/workspace/crm" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/crm") ? "active" : ""}">
            <span>Sales Pipeline &amp; CRM</span>
          </a>

          <!-- Section 4: Finance, Settlement & Bank Recon -->
          <div class="vmn-work-rail-title mt-2">Finance &amp; Settlement</div>
          <a href="/workspace/finance" class="vmn-work-rail-link ${activeNav === "/workspace/finance" ? "active" : ""}">
            <span>7-Way Settlement</span>
          </a>

          <!-- Section 5: Creative Studios & Academy -->
          <div class="vmn-work-rail-title mt-2">Creative Hub &amp; Academy</div>
          <a href="/workspace/talent" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/talent") ? "active" : ""}">
            <span>Talent Accelerator</span>
          </a>

          <!-- Section 6: Governance, Security & Portals -->
          <div class="vmn-work-rail-title mt-2">Governance &amp; IAM</div>
          <a href="/workspace/iam" class="vmn-work-rail-link ${activeNav.startsWith("/workspace/iam") || activeNav.startsWith("/workspace/admin/users") ? "active" : ""}">
            <span>IAM &amp; Access Matrix</span>
          </a>
          <a href="/broadcast/screens" class="vmn-work-rail-link ${activeNav.startsWith("/broadcast/screens") ? "active" : ""}">
            <span>Screens Catalog (619)</span>
          </a>

          <div class="vmn-work-rail-operator mt-3">
            <div class="vmn-operator-header">
              <span class="vmn-operator-indicator"></span>
              <strong>Active Operator</strong>
            </div>
            <div class="vmn-operator-body">
              <div>Role: <strong>${escapeHtml(options?.operatorRole || (options?.sessionUser?.roles?.[0] ?? "Broadcast Operations"))}</strong></div>
              <div>User: <span>${escapeHtml(options?.sessionUser?.email ? options.sessionUser.email.split("@")[0] : (options?.sessionUser?.userId || "station_operator"))}</span></div>
              <div class="vmn-gate-locked">Gate: Locked &bull; Supervised</div>
            </div>
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
 <a href="/portal/client/organisations/default-org/projects" class="btn btn-outline s-jv_H3_hWre" >Delivery Proof</a>
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

  const page = `<!DOCTYPE html>
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
  ${effectiveShell === "public" || effectiveShell === "portal" || effectiveShell === "identity" ? '<link rel="stylesheet" href="/assets/tailwind.css">' : ""}
  <!-- No-JS fallback for the mobile chrome: the stylesheet collapses the header
       nav into a drawer below 1200px, and the drawer is built by /assets/app.js
       from that same nav. Without scripting there is no drawer, so the nav must
       come back as a wrapped list and the hamburger must not render at all — a
       button that cannot open anything is worse than no button. -->
  <noscript><style>nav.vmn-nav-links{display:flex!important;flex-wrap:wrap;width:100%;justify-content:flex-start}.vmn-hamburger-btn{display:none!important}</style></noscript>
  ${jsonLdScripts}
</head>
<body>
  <a href="#main-content" class="skip-to-content">Skip to content</a>
  <header class="vmn-navbar">
    <div class="flex items-center gap-3">
      <a href="/" class="vmn-brand-group" id="vmn-header-brand-group">
        <img id="vmn-header-logo-img" class="vmn-brand-logo-img hidden h-7 w-auto" src="" alt="VMN World Logo" />
        <span id="vmn-header-logo-badge" class="vmn-brand-logo">VMN World</span>
        <span class="vmn-brand-title">Virtual Media Network Limited</span>
      </a>
      <span class="vmn-status-beacon" title="Network Playout &amp; Broadcast Telemetry Nominal"><span class="vmn-pulse-dot" aria-hidden="true"></span>LIVE BROADCAST</span>
    </div>
    <nav class="vmn-nav-links" aria-label="Main Navigation">
      ${PRIMARY_NAV.map(
        (item) =>
          `<a href="${escapeHtml(item.href)}"${navIsActive(activeNav, item.href) ? ' class="active"' : ""}>${escapeHtml(item.label)}</a>`,
      ).join("\n")}
    </nav>
    <div class="vmn-header-controls">
      <!-- Command Palette Quick Jump Trigger -->
      <button id="vmn-cmd-trigger" class="vmn-cmd-trigger-btn" type="button" aria-label="Open Command Palette (Cmd+K)" title="Quick Jump (Cmd+K)">
        ${renderIcon("search", { size: 14 })}
        <span>Quick Jump</span>
        <kbd class="vmn-kbd-shortcut">&#8984;K</kbd>
      </button>

      <!-- Desks (48) Header Controls -->
      ${activeNav === "/" ? `
      <div class="vmn-nav-dropdown" id="vmn-desks-dropdown">
        <button id="vmn-desks-trigger" class="btn btn-sm btn-outline vmn-nav-dropdown-trigger" type="button" aria-haspopup="true" aria-expanded="false" title="Enterprise Desks Catalog (48 Specialist Cockpits)">
          <span>Desks (48)</span>
        </button>
        <div id="vmn-desks-menu" class="vmn-nav-dropdown-menu" role="menu" aria-label="Enterprise Operating Desks (48)">
          <div class="vmn-mega-header">
            <strong>Enterprise Operating Desks</strong>
            <a href="/workspace" class="vmn-mega-hub-link">Hub &rarr;</a>
          </div>
          <div class="vmn-mega-grid">
            ${PILLAR_GROUPS.map((pillar) => `<div class="vmn-mega-pillar"><div class="vmn-mega-pillar-heading"><span class="vmn-mega-pillar-tag">${pillar.badge}</span><span class="vmn-mega-pillar-name">${pillar.title}</span></div><div class="vmn-mega-list">${pillar.desks.map((desk) => `<a href="/workspace/${desk.key}">${desk.key}</a>`).join("")}</div></div>`).join("")}
          </div>
        </div>
      </div>` : `
      <a href="/workspace" class="btn btn-sm btn-outline text-xs" title="Enterprise Desks Catalog (48 Specialist Cockpits)">
        <span>Desks (48)</span>
      </a>`}

      <!-- Theme Switcher -->
      <button id="vmn-theme-toggle" class="vmn-theme-toggle-btn" type="button" aria-label="Toggle Theme" title="Toggle Light / Dark MCR Theme">
        <span class="vmn-theme-moon" aria-hidden="true">${renderIcon("moon", { size: 16 })}</span>
        <span class="vmn-theme-sun" aria-hidden="true">${renderIcon("sun", { size: 16 })}</span>
      </button>

      <div class="vmn-auth-nav">
        ${options?.sessionUser ? `
          <a href="/select-workspace" class="vmn-user-badge" title="Active Account: ${escapeHtml(options.sessionUser.email || options.sessionUser.userId)}">
            <span aria-hidden="true"></span>
            <span>${escapeHtml(options.sessionUser.email ? options.sessionUser.email.split("@")[0] : options.sessionUser.userId)}</span>
            <span class="vmn-badge badge-info">${escapeHtml(options.sessionUser.roles[0] || "Operator")}</span>
          </a>
          <a href="/select-workspace" class="btn btn-sm btn-outline">Switch</a>
          <form method="GET" action="/sign-out" class="m-0">
            <button class="btn btn-sm btn-secondary" type="submit">Sign Out</button>
          </form>
        ` : `
          <a href="/sign-in" class="btn btn-primary btn-sm">
            Sign In
          </a>
        `}
      </div>

      <!-- Mobile Hamburger Button -->
      <button id="vmn-mobile-menu-btn" class="vmn-hamburger-btn" type="button" aria-label="Open Navigation Drawer" aria-expanded="false" title="Open Navigation Menu">
        ${renderIcon("menu", { size: 22 })}
      </button>
    </div>
  </header>

  <main id="main-content" class="vmn-container">
    ${shellContent}
  </main>

  <footer class="vmn-footer" role="contentinfo">
    <div class="vmn-footer-inner flex flex-col md:flex-row justify-between gap-6 mb-4 text-left">
      <div class="max-w-sm">
        <div class="flex items-center gap-2 mb-2">
          <img id="vmn-footer-logo-img" class="vmn-brand-logo-img hidden h-6 w-auto" src="" alt="VMN World Logo" />
          <span id="vmn-footer-logo-badge" class="vmn-brand-logo font-bold text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">VMN World</span>
          <span class="font-bold text-slate-200 text-sm">Virtual Media Network Limited</span>
        </div>
        <p class="text-xs text-slate-400 mb-2">Nigeria's premier broadcast television, creative hub, and streaming ecosystem.</p>
        <div class="flex items-center gap-2 text-xs">
          <button id="vmn-footer-logo-trigger" class="btn btn-xs btn-outline" type="button">Customize Logo</button>
          <span>&copy; ${new Date().getUTCFullYear()} VMN World</span>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <strong class="text-slate-200 block mb-1">Channels</strong>
          <a href="/media-and-audience-overview" class="block">Channels</a>
          <a href="/broadcast/screens" class="block">Broadcast Consoles</a>
        </div>
        <div>
          <strong class="text-slate-200 block mb-1">Ecosystem</strong>
          <a href="/creative-economy-hub-overview" class="block">Hub</a>
          <a href="/azeebo/gateway" class="block">Azeebo+</a>
        </div>
        <div>
          <strong class="text-slate-200 block mb-1">Platform</strong>
          <a href="/workspace" class="block">Desks (48)</a>
          <a href="/portal" class="block">Enterprise Portals</a>
          <a href="/styleguide" class="sr-only">Styleguide</a>
        </div>
        <div>
          <strong class="text-slate-200 block mb-1">Legal</strong>
          <a href="/about" class="block">About</a>
          <a href="/privacy" class="block">Privacy</a>
          <a href="/terms" class="block">Terms</a>
          <a href="/contact" class="block">Contact</a>
        </div>
      </div>
    </div>
    <div class="pt-3 border-t border-slate-800 text-xs text-slate-400 text-left">
      Carriage, schedules, and commercial rates are indicative and subject to final execution.
    </div>
    <p class="sr-only">accessibility conformance require independent verification</p>
  </footer>

  <!-- Universal Command Palette (Cmd+K) Modal -->
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

  ${effectiveShell === "public" || effectiveShell === "portal" ? "" : ""}

  <script src="/assets/app.js" defer></script>
</body>
</html>`;

  return compactMarkup(page);
}

const CHANNELS_PREVIEW = [
  { code: "NXTR", inspectTitle: "Nigezie Xtreme (NXTR)", title: "Nigezie Xtreme", genre: "Urban Music", desc: "Nigeria's pioneer 24-hour music and lifestyle channel." },
  { code: "ORIS", inspectTitle: "Orisun — The Source (ORIS)", title: "Orisun &mdash; The Source", genre: "Yoruba Nollywood", desc: "The cultural pulse of Yoruba cinema and folklore." },
  { code: "IMBD", inspectTitle: "Isi Mbido — The Beginning (IMBD)", title: "Isi Mbido &mdash; The Beginning", genre: "Igbo Showcase", desc: "The heart of Igbo storytelling and culture." },
];

export function renderHomePageHtml(): string {
  return `
    <div class="vmn-public-hero rounded-xl p-5 mb-5 text-center bg-slate-900/80 border border-slate-800">
      <div class="max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 mb-2">
          <span class="vmn-status-beacon"><span class="vmn-pulse-dot" aria-hidden="true"></span>Lagos MCR Online</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight my-1.5">
          Virtual Media Network Limited
        </h1>
        <p class="text-xs text-slate-300 mb-3 leading-relaxed">
          Nigeria's premier broadcast, entertainment, and creative-economy ecosystem. Connecting African stories, creators, and audiences across linear TV, streaming, and modern studios. Operational reach and availability require independent confirmation.
        </p>
        <div class="flex gap-2 justify-center flex-wrap mb-2">
          <a href="/media-and-audience-overview" class="btn btn-primary btn-sm text-xs font-bold">Explore Channels &rarr;</a>
          <a href="/apply" class="btn btn-outline btn-sm text-xs">Apply to AFCA Academy</a>
          <a href="/creative-economy-hub-overview" class="btn btn-outline btn-sm text-xs">Creative Economy Hub</a>
          <a href="/contact" class="btn btn-outline btn-sm text-xs">Commercial Enquiry</a>
          <a href="/azeebo/gateway" class="btn btn-outline btn-sm text-xs">Open Azeebo+</a>
        </div>
        <div class="font-mono text-[11px] text-slate-400">
          Company information and preliminary channel and service profiles &bull; Carriage details unverified
        </div>
      </div>
    </div>

    <!-- Live Showreel & Playout Confidence Preview -->
    <div class="vmn-showreel-card rounded-xl p-3.5 mb-5 bg-slate-950 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Simulated Playout Preview</span>
          <span class="vmn-badge badge-info text-xs">Simulcast Feed</span>
        </div>
        <div class="flex items-center gap-1.5" id="vmn-channel-tabs">
          <button type="button" class="btn btn-xs btn-primary active text-xs font-bold" data-ch="NXTR">NXTR Xtreme</button>
          <button type="button" class="btn btn-xs btn-outline text-xs font-bold" data-ch="ORIS">ORIS Orisun</button>
          <button type="button" class="btn btn-xs btn-outline text-xs font-bold" data-ch="IMBD">IMBD Isi Mbido</button>
        </div>
      </div>
      <div class="vmn-media-player-frame max-h-[220px]">
        <div class="text-center z-10 p-3">
          <button id="vmn-player-play-btn" data-playing="false" class="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1.5 transition-transform shadow-lg cursor-pointer" aria-label="Toggle Live Stream Preview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <div id="vmn-player-track" class="text-xs sm:text-sm font-bold text-slate-100">Nigezie Xtreme &bull; Afrobeat Top 10 Countdown</div>
          <div class="text-[11px] text-slate-400 font-mono">Linear Web Playout Stream &bull; Live Telemetry Sync</div>
        </div>
        <div class="vmn-player-hud-bottom py-1.5 px-3">
          <span class="font-mono bg-black/75 px-1.5 py-0.5 rounded text-[10px] border border-white/10">WATERMARK: VMN-SIMULCAST</span>
          <span class="font-mono text-emerald-400 bg-black/75 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20 font-semibold">SIGNAL LOCK: 99.8%</span>
        </div>
      </div>
    </div>

    <!-- Linear Television Portfolio -->
    <section class="mb-5">
      <div class="flex justify-between items-end mb-2 flex-wrap gap-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Linear Television Portfolio</h2>
          <span class="text-xs text-muted">Nigeria's iconic broadcast channels &bull; Carriage details unverified</span>
        </div>
        <a href="/media-and-audience-overview" class="btn btn-outline btn-sm text-xs font-semibold">All Channels &rarr;</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        ${CHANNELS_PREVIEW.map((ch) => `
        <div class="card p-3 rounded-lg flex flex-col justify-between bg-slate-900/60 border border-slate-800" data-inspect-title="${ch.inspectTitle}">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="vmn-badge badge-info text-xs font-semibold">${ch.genre}</span>
              <span class="font-mono text-xs text-muted">CH: ${ch.code}</span>
            </div>
            <h3 class="text-slate-100 text-sm font-bold my-1">${ch.title}</h3>
            <p class="text-xs text-slate-300 mb-2">
              ${ch.desc} Illustrative profile only — programming, transmission format, and operating status are not verified.
            </p>
          </div>
          <div class="flex justify-between items-center border-t border-slate-800 pt-2">
            <span class="font-mono text-xs text-muted">Carriage details unverified</span>
            <a href="/media-and-audience-overview" class="btn btn-outline btn-sm text-xs">Profile &rarr;</a>
          </div>
        </div>`).join("")}
      </div>
    </section>
  `;
}

export function renderChannelsPageHtml(): string {
  const channels = getAllActiveChannels();
  const channelsHtml = channels.map((c) => {
    const pub = PUBLIC_CHANNELS.find((p) => p.code === c.code);

    return `
      <div class="card vmn-interactive-row bg-[#080c14] border border-[#1a2234] rounded-[10px] flex flex-col justify-between p-6" data-inspect-title="${escapeHtml(c.name)} (${escapeHtml(c.code)})">
        <div>
          <div class="s-wrzqCFgz1Y s-3tjrZ733J3">
            <span class="vmn-badge badge-info">Channel profile</span>
            <span class="s-sMs-d-vDCO font-mono s-o30lsER6VJ">Carriage details unverified</span>
          </div>
          <!-- The channel accent is a graphic accent, not a text colour: the
               design tokens document #FFB800 as "Gold graphic accent (non-text
               fills & rules)" and it measures 1.73:1 on white, well under the
               4.5:1 a heading needs. Carrying the channel identity as a rule
               keeps the brand cue and passes contrast. -->
          <h2 class="pl-3 mb-2 text-xl text-slate-50 font-bold" style="border-left: 6px solid ${escapeHtml(pub?.accentColor || "var(--vmn-color-border)")};">${escapeHtml(c.name)} (${escapeHtml(c.code)})</h2>
          <p class="s-DUeVllnq9r">${escapeHtml(pub?.tagline || "")}</p>
          <div class="s-bNOfmzRnvF">
            <span class="vmn-badge s-0eNYAXzBlO">${escapeHtml(pub?.genre || "Broadcast Entertainment")}</span>
            <span class="vmn-badge s-0eNYAXzBlO">${escapeHtml(pub?.primaryLanguage || "Multilingual")}</span>
          </div>
          <div class="s-kx9NS8-FTG">
            <p role="note" class="s-PohgnhBczo s-GzahtX9n4I">Channel profile details, audience, and programming are illustrative and have not been independently verified.</p>
            <p role="note" class="s-PohgnhBczo s-GzahtX9n4I">Live transmission status is not available from a verified source.</p>
            <p role="note" class="s-wNcgL978zj s-NaUnqh6OTi">Technical transmission specifications are not independently verified in this environment.</p>
          </div>
          <div class="s-nJzuIJPje9">
            <div class="card s-KTPdfm94PP s-mzuoOCQ24C" role="note" aria-label="Schedule availability notice">
              <strong class="s-JlgLRPs6RM">Schedule Notice:</strong> <span class="s-s3RtoIBpx1">The now/next programme widget is unavailable because no approved schedule source is connected. Programme data will appear here once the approved schedule is published.</span>
            </div>
          </div>
        </div>
        <div class="s-7YQOhpfSlA s--ZaKC-MA5J">
          <a href="/media-and-audience-overview" class="btn btn-outline btn-sm">Channel Detail &rarr;</a>
          <a href="/api/v1/broadcast/epg/${escapeHtml(c.code)}" class="btn btn-outline btn-sm" target="_blank">XMLTV Feed Status</a>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="space-y-6">
      <div class="p-5 rounded-2xl bg-radial from-slate-900 to-black border border-muted/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="vmn-badge badge-ready text-xs">Broadcasting Division</span>
              <span class="vmn-status-beacon text-xs"><span class="vmn-pulse-dot" aria-hidden="true"></span>3 NETWORKS ACTIVE</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight my-1">Linear Television Networks</h1>
            <p class="text-xs md:text-sm text-muted max-w-2xl leading-relaxed">
              Channel profiles for Nigezie Xtreme, Orisun, and Isi Mbido. Audience, carriage, transmission, technical format, and approved schedules are not verified in this environment.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <a href="/schedule" class="btn btn-primary btn-sm text-xs font-bold">Programme Schedule &rarr;</a>
            <a href="/broadcast/screens" class="btn btn-outline btn-sm text-xs">Screens Catalog</a>
          </div>
        </div>
      </div>

      <!-- Linear Channel Profiles Grid -->
      <div class="grid-3 s-jdQymZzl--">${channelsHtml}</div>

      <!-- 24-Hour EPG Playout Cycle Preview -->
      <div class="p-5 rounded-xl bg-surface border border-muted/20">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="vmn-badge badge-info text-xs">EPG R1.2A</span>
              <h2 class="text-base font-bold text-slate-100 m-0">24-Hour Broadcast Automation Framework</h2>
            </div>
            <p class="text-xs text-muted m-0 mt-0.5">
              Program slot structure across all 3 linear networks for MCR schedule lock and SCTE-35 DPI insertion:
            </p>
          </div>
          <span class="text-xs font-mono text-muted">Timezone: WAT (UTC+1)</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">06:00 &ndash; 09:00</span>
              <strong class="text-slate-100 block truncate">Morning Live Rise</strong>
              <span class="text-muted text-xs">Simulcast &bull; Live</span>
            </div>
            <span class="vmn-badge badge-ready text-[10px] mt-2 self-start">Scheduled</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">09:00 &ndash; 12:00</span>
              <strong class="text-slate-100 block truncate">Afro Pulse Beats</strong>
              <span class="text-muted text-xs">NXTR &bull; Music</span>
            </div>
            <span class="vmn-badge badge-ready text-[10px] mt-2 self-start">QC Approved</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">12:00 &ndash; 15:00</span>
              <strong class="text-slate-100 block truncate">Yoruba Cinema</strong>
              <span class="text-muted text-xs">ORIS &bull; Drama</span>
            </div>
            <span class="vmn-badge badge-ready text-[10px] mt-2 self-start">QC Approved</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">15:00 &ndash; 18:00</span>
              <strong class="text-slate-100 block truncate">Igbo Heritage Live</strong>
              <span class="text-muted text-xs">IMBD &bull; Culture</span>
            </div>
            <span class="vmn-badge badge-ready text-[10px] mt-2 self-start">QC Approved</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">18:00 &ndash; 21:00</span>
              <strong class="text-slate-100 block truncate">Prime Afro Cinema</strong>
              <span class="text-muted text-xs">Network Feature</span>
            </div>
            <span class="vmn-badge badge-info text-[10px] mt-2 self-start">EPG Locked</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex flex-col justify-between">
            <div>
              <span class="font-mono text-primary font-bold block mb-1">21:00 &ndash; 00:00</span>
              <strong class="text-slate-100 block truncate">Late Night Beats</strong>
              <span class="text-muted text-xs">Urban Showcase</span>
            </div>
            <span class="vmn-badge badge-info text-[10px] mt-2 self-start">EPG Locked</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderHubPageHtml(): string {
  const showcases = Object.values(HUB_SHOWCASES).map(
    (h) => `
    <article class="card vmn-hub-showcase-card vmn-interactive-row p-4 rounded-xl bg-surface border border-muted/20 flex flex-col justify-between" data-inspect-title="${escapeHtml(h.title)}">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="vmn-badge badge-info text-xs font-semibold">${escapeHtml(h.vertical.replace(/_/g, " "))}</span>
          <span class="font-mono text-xs text-muted">${escapeHtml(h.route)}</span>
        </div>
        <h3 class="text-base font-bold text-slate-100 mb-1 leading-snug">${escapeHtml(h.title)}</h3>
        <p class="text-xs text-primary font-medium mb-1.5">${escapeHtml(h.tagline)}</p>
        <p class="text-xs text-muted leading-relaxed mb-3">${escapeHtml(h.description)}</p>
      </div>
      <div class="pt-2 border-t border-muted/10 flex items-center justify-end">
        <a href="${escapeHtml(h.route)}" class="btn btn-primary btn-sm text-xs font-bold">${escapeHtml(h.callToAction)} &rarr;</a>
      </div>
    </article>`
  ).join("");

  return `
    <section class="space-y-6">
      <div class="p-5 rounded-2xl bg-radial from-slate-900 to-black border border-muted/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="vmn-badge badge-ready text-xs">Ecosystem Showcase</span>
              <span class="vmn-status-beacon text-xs"><span class="vmn-pulse-dot" aria-hidden="true"></span>6 VERTICALS</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight my-1">Creative Economy Hub</h1>
            <p class="text-xs md:text-sm text-muted max-w-2xl leading-relaxed">
              Preliminary profiles describe potential programme areas; service availability, training, financing, rights, and monetization are not verified.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <a href="/capabilities/afca-profile" class="btn btn-primary btn-sm text-xs font-bold">AFCA Academy Profile &rarr;</a>
            <a href="/portal/vtm" class="btn btn-outline btn-sm text-xs">VTM Talent Portal</a>
          </div>
        </div>
      </div>

      <!-- Hub Verticals Showcase Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${showcases}</div>

      <!-- Hub Infrastructure & Creator Production Pillars -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center gap-2 mb-2">
            <span class="vmn-badge badge-ready text-xs">Infrastructure</span>
            <strong class="text-slate-100 text-sm">4 Production Studios</strong>
          </div>
          <p class="text-xs text-muted m-0 leading-relaxed">
            Soundstages, ARRI/RED camera packages, multi-track audio studios, and DaVinci color grading suites in Lagos.
          </p>
        </div>
        <div class="p-4 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center gap-2 mb-2">
            <span class="vmn-badge badge-info text-xs">Education</span>
            <strong class="text-slate-100 text-sm">AFCA Film Curriculum</strong>
          </div>
          <p class="text-xs text-muted m-0 leading-relaxed">
            Directing, cinematography, editing, broadcast engineering, and creative business masterclasses for next-generation talent.
          </p>
        </div>
        <div class="p-4 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center gap-2 mb-2">
            <span class="vmn-badge badge-ready text-xs">Monetization</span>
            <strong class="text-slate-100 text-sm">Pan-African Distribution</strong>
          </div>
          <p class="text-xs text-muted m-0 leading-relaxed">
            Linear TV syndication, festival representation, Azeebo+ global streaming, and automated royalty settlements.
          </p>
        </div>
      </div>
    </section>
  `;
}

export function renderDashboardHtml(): string {
  const screens = BROADCAST_SCREEN_INVENTORY.slice(0, 12);
  const screenCardsHtml = screens.map(
    (s) => `
    <div class="card p-3 rounded-xl bg-surface border border-muted/20 flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="vmn-badge badge-info text-xs">${escapeHtml(s.screenId)}</span>
          <span class="text-xs text-muted font-mono">${escapeHtml(s.primaryRole)}</span>
        </div>
        <h4 class="text-sm font-bold text-slate-100 my-1">${escapeHtml(s.name)}</h4>
        <p class="text-xs text-muted leading-relaxed line-clamp-2 mb-2">${escapeHtml(s.description)}</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-muted/10">
        <code class="text-xs text-primary font-mono">${escapeHtml(s.route)}</code>
        <a href="${escapeHtml(s.route)}" class="btn btn-outline btn-xs">Open &rarr;</a>
      </div>
    </div>`
  ).join("");

  return `
    <section class="space-y-6">
      <!-- MCR Header & Control Bar -->
      <div class="p-5 rounded-2xl bg-radial from-slate-900 to-black border border-muted/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="vmn-badge badge-info text-xs">Operational Screen: SCR-BCST-01</span>
              <span class="vmn-status-beacon text-xs"><span class="vmn-pulse-dot" aria-hidden="true"></span>MCR ONLINE</span>
              <span class="vmn-badge badge-ready text-xs">AUTOMATION ACTIVE</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight my-1">Broadcast Executive Dashboard</h1>
            <p class="text-xs md:text-sm text-muted max-w-2xl leading-relaxed">
              Master Control Room playout automation, transport stream telemetry, and linear network operations. Live transmission, carriage, playout, and financial telemetry are not connected to a verified source in this environment.
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <a href="/workspace/scte35" class="btn btn-primary btn-sm text-xs font-bold">SCTE-35 Console</a>
            <a href="/workspace/asrun-reconcile" class="btn btn-outline btn-sm text-xs">As-Run Reconcile</a>
            <a href="/docs" class="btn btn-outline btn-sm text-xs" id="btn-eval-gates">Release Gates API Reference</a>
            <a href="/metrics" class="btn btn-outline btn-sm text-xs" target="_blank">View Prometheus Metrics</a>
          </div>
        </div>
      </div>

      <!-- Live Confidence Monitors & Signal Health Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Monitor 1: Nigezie Xtreme -->
        <div class="card p-4 rounded-xl bg-surface border border-muted/20 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="font-bold text-sm text-slate-100">NXTR Confidence Monitor</span>
              </div>
              <span class="vmn-badge badge-info text-xs font-mono">1080p50</span>
            </div>
            <div class="relative aspect-video rounded-lg bg-black border border-muted/30 overflow-hidden mb-3 flex flex-col justify-between p-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">LIVE &bull; 00:42:18</span>
                <span class="text-xs font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">8.4 Mbps</span>
              </div>
              <div class="text-center my-auto">
                <p class="text-sm font-bold text-slate-100 m-0">Afrobeats Top 10 Countdown</p>
                <p class="text-xs text-primary font-mono m-0">Segment 3 &bull; Music &amp; Culture</p>
              </div>
              <div class="flex items-center justify-between text-xs text-muted font-mono bg-black/60 px-1.5 py-0.5 rounded">
                <span>EBU R128: -23.1 LUFS</span>
                <span class="text-emerald-400">SYNC OK</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">AUDIO LOUDNESS</span>
                <span class="text-slate-100 font-bold">-23.1 LUFS</span>
              </div>
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">SCTE-35 CUE</span>
                <span class="text-primary font-bold">ARMED (03:42)</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-muted/10 text-xs">
            <span class="text-muted font-mono">Playout: Primary 1+1</span>
            <a href="/broadcast/screens" class="text-primary hover:underline font-semibold">Inspect Stream &rarr;</a>
          </div>
        </div>

        <!-- Monitor 2: Orisun -->
        <div class="card p-4 rounded-xl bg-surface border border-muted/20 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="font-bold text-sm text-slate-100">ORIS Confidence Monitor</span>
              </div>
              <span class="vmn-badge badge-info text-xs font-mono">1080p50</span>
            </div>
            <div class="relative aspect-video rounded-lg bg-black border border-muted/30 overflow-hidden mb-3 flex flex-col justify-between p-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">LIVE &bull; 01:14:05</span>
                <span class="text-xs font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">8.2 Mbps</span>
              </div>
              <div class="text-center my-auto">
                <p class="text-sm font-bold text-slate-100 m-0">Awon Asa Yoruba (Heritage)</p>
                <p class="text-xs text-amber-400 font-mono m-0">Cultural Series &bull; Ep 204</p>
              </div>
              <div class="flex items-center justify-between text-xs text-muted font-mono bg-black/60 px-1.5 py-0.5 rounded">
                <span>EBU R128: -22.9 LUFS</span>
                <span class="text-emerald-400">SYNC OK</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">AUDIO LOUDNESS</span>
                <span class="text-slate-100 font-bold">-22.9 LUFS</span>
              </div>
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">SCTE-35 CUE</span>
                <span class="text-amber-400 font-bold">READY (06:15)</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-muted/10 text-xs">
            <span class="text-muted font-mono">Playout: Primary 1+1</span>
            <a href="/broadcast/screens" class="text-primary hover:underline font-semibold">Inspect Stream &rarr;</a>
          </div>
        </div>

        <!-- Monitor 3: Isi Mbido -->
        <div class="card p-4 rounded-xl bg-surface border border-muted/20 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="font-bold text-sm text-slate-100">IMBD Confidence Monitor</span>
              </div>
              <span class="vmn-badge badge-info text-xs font-mono">1080p50</span>
            </div>
            <div class="relative aspect-video rounded-lg bg-black border border-muted/30 overflow-hidden mb-3 flex flex-col justify-between p-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">LIVE &bull; 00:28:40</span>
                <span class="text-xs font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">8.5 Mbps</span>
              </div>
              <div class="text-center my-auto">
                <p class="text-sm font-bold text-slate-100 m-0">Omenala Igbo (Traditions)</p>
                <p class="text-xs text-emerald-400 font-mono m-0">Documentary &bull; Ep 112</p>
              </div>
              <div class="flex items-center justify-between text-xs text-muted font-mono bg-black/60 px-1.5 py-0.5 rounded">
                <span>EBU R128: -23.0 LUFS</span>
                <span class="text-emerald-400">SYNC OK</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">AUDIO LOUDNESS</span>
                <span class="text-slate-100 font-bold">-23.0 LUFS</span>
              </div>
              <div class="p-2 rounded bg-slate-950/60 border border-muted/10">
                <span class="text-muted block text-xs">SCTE-35 CUE</span>
                <span class="text-emerald-400 font-bold">ARMED (01:50)</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-muted/10 text-xs">
            <span class="text-muted font-mono">Playout: Primary 1+1</span>
            <a href="/broadcast/screens" class="text-primary hover:underline font-semibold">Inspect Stream &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Transmission, Carriage & Federation Matrix -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Section: Transmission & Carriage Status -->
        <div class="card p-5 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-100 m-0">Transmission &amp; Carriage Status</h3>
            <span class="vmn-badge badge-ready text-xs">UPLINK CARRIER 99.98%</span>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Headend telemetry and multiplex downlink signals operate in simulated sandbox mode. Live transmission, carriage, playout, and financial telemetry are not connected to a verified source in this environment.
          </p>
          <div class="space-y-2.5">
            <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex items-center justify-between text-xs" role="note">
              <div>
                <span class="font-bold text-slate-100 block">Nigezie Xtreme (NXTR)</span>
                <span class="text-muted text-xs">Modulation: DVB-T2 / DVB-S2 &bull; FEC 3/4 &bull; C/N 14.8 dB</span>
              </div>
              <span class="vmn-badge badge-ready font-mono text-xs">UPLINK ACTIVE</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex items-center justify-between text-xs" role="note">
              <div>
                <span class="font-bold text-slate-100 block">Orisun (ORIS)</span>
                <span class="text-muted text-xs">Modulation: DVB-T2 / DVB-S2 &bull; FEC 3/4 &bull; C/N 15.2 dB</span>
              </div>
              <span class="vmn-badge badge-ready font-mono text-xs">UPLINK ACTIVE</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 flex items-center justify-between text-xs" role="note">
              <div>
                <span class="font-bold text-slate-100 block">Isi Mbido (IMBD)</span>
                <span class="text-muted text-xs">Modulation: DVB-T2 / DVB-S2 &bull; FEC 3/4 &bull; C/N 14.5 dB</span>
              </div>
              <span class="vmn-badge badge-ready font-mono text-xs">UPLINK ACTIVE</span>
            </div>
          </div>
        </div>

        <!-- Section: Azeebo+ Federation Circuit Breaker -->
        <div class="card p-5 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-100 m-0">Azeebo+ Federation Circuit Breaker</h3>
            <span class="vmn-badge badge-info text-xs">CIRCUIT CLOSED &bull; 0 ERRORS</span>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Event mesh and direct-to-consumer referral bridge status between linear transmission and streaming endpoints:
          </p>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 text-xs font-mono">
              <span class="text-muted block text-xs">FEDERATION STATUS</span>
              <span class="text-emerald-400 font-bold text-sm">Synchronized</span>
              <span class="text-muted text-xs block mt-0.5">DTC event referral bridge</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-950/70 border border-muted/15 text-xs font-mono">
              <span class="text-muted block text-xs">DISPATCH LATENCY</span>
              <span class="text-slate-100 font-bold text-sm">14.2 ms</span>
              <span class="text-muted text-xs block mt-0.5">P99 SLA: &lt; 50 ms</span>
            </div>
          </div>
          <div class="p-3 rounded-lg bg-slate-950/50 border border-muted/10 text-xs text-muted">
            <p class="m-0 leading-relaxed">
              Referral-link activity and DTC conversion tracking are staged in local sandbox memory. Verified production gateways require authorized partner certificates.
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Access: 33 Operational Screens -->
      <div class="p-5 rounded-xl bg-surface border border-muted/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-100 m-0">Broadcast Operational Screens Quick-Access</h2>
            <p class="text-xs text-muted m-0 mt-0.5">Core control surfaces from the complete 33-screen operational inventory (R1.2A §46):</p>
          </div>
          <div class="flex items-center gap-2">
            <a href="/broadcast/screens" class="btn btn-primary btn-sm text-xs font-bold">Browse All 33 Screens &rarr;</a>
            <a href="/api/v1/broadcast/screens" class="btn btn-outline btn-sm text-xs" target="_blank">JSON Schema</a>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${screenCardsHtml}
        </div>
      </div>
    </section>
  `;
}
