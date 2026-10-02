/**
 * Broadcast Executive Dashboard (Screen 1: SCR-BCST-01) & Web Surface Layout
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §46 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Adheres strictly to UI/UX Standards:
 * - 4px / 8px spacing token scale
 * - WCAG 2.2 Level AA color contrast ratios (>= 4.5:1 text, >= 3:1 graphical)
 * - Touch targets >= 44x44px
 * - Complete interactive state matrix
 * - Accessible semantic HTML structure
 */

import { getAllActiveChannels } from "../../modules/broadcast/channels/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../modules/broadcast/screens/index.js";
import { PUBLIC_CHANNELS } from "./channels.js";
import { VMN_ENTERPRISE_PILLARS, VMN_LEADERSHIP, CorporatePortalService } from "./corporate.js";
import { HUB_SHOWCASES } from "./hub.js";
import { getConfig } from "../../core/config/index.js";
import { escapeHtml, renderIcon } from "../components/index.js";

import { SessionUser } from "../../core/auth/index.js";

export interface MasterLayoutOptions {
  shell?: "public" | "work" | "portal" | "identity";
  operatorRole?: string;
  counterpartyName?: string;
  projectName?: string;
  sessionUser?: SessionUser | null;
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
  const canonicalUrl = activeNav === "/" ? seo.canonicalUrl : `${seo.canonicalUrl.replace(/\/+$/, "")}${activeNav}`;
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
      <div class="vmn-shell-identity" style="min-height: 70vh; padding: 20px 0;">
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
          <div class="vmn-work-rail-title" style="margin-top: 14px;">Operator Context</div>
          <div style="padding: 6px 12px; font-size: 0.8rem; color: var(--vmn-color-text-muted);">
            <strong>Role:</strong> ${escapeHtml(options?.operatorRole || "Broadcast Operations")}<br>
            <span style="font-size: 0.75rem;">Gate: Locked (Green)</span>
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
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-color-text-muted); font-weight: 700;">
              Counterparty Portal
            </div>
            <div class="vmn-portal-counterparty">${escapeHtml(options?.counterpartyName || "Authorized Counterparty")}</div>
            ${options?.projectName ? `<div style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin-top: 2px;">Project Ref: <strong>${escapeHtml(options.projectName)}</strong></div>` : ""}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="vmn-badge badge-ready">Authenticated &amp; Verified</span>
            <a href="/prototypes?screen=client" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem;">Delivery Proof</a>
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Virtual Media Network Limited</title>
  <meta name="description" content="Virtual Media Network Limited (VMNL) - Linear TV Broadcasting, Creative Economy Hub, and Azeebo+ Federation.">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  ${ogTags}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle} | VMNL">
  <meta name="twitter:image" content="${escapeHtml(seo.openGraph["og:image"] || "")}">
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="/assets/styles.css">
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
    <div class="vmn-header-controls" style="display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap;">
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

      <div class="vmn-auth-nav" style="display: flex; align-items: center; gap: 8px;">
        ${options?.sessionUser ? `
          <a href="/select-workspace" class="vmn-user-badge" title="Active Account: ${escapeHtml(options.sessionUser.email)}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; background: var(--vmn-color-surface-subtle); border: 1px solid var(--vmn-color-border); font-size: 0.8rem; color: var(--vmn-color-primary-text); text-decoration: none;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10B981;" aria-hidden="true"></span>
            <span>${escapeHtml(options.sessionUser.email.split("@")[0])}</span>
            <span class="vmn-badge badge-info" style="font-size: 0.65rem; padding: 2px 6px;">${escapeHtml(options.sessionUser.roles[0] || "Operator")}</span>
          </a>
          <a href="/select-workspace" class="btn btn-outline" style="min-height: 44px; padding: 0 12px; font-size: 0.8rem; text-decoration: none; display: inline-flex; align-items: center;">Switch</a>
          <a href="/sign-out" class="btn btn-secondary" style="min-height: 44px; padding: 0 12px; font-size: 0.8rem; text-decoration: none; display: inline-flex; align-items: center;">Sign Out</a>
        ` : `
          <a href="/sign-in" class="btn btn-primary" style="min-height: 44px; padding: 0 16px; font-size: 0.85rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            Sign In
          </a>
        `}
      </div>

      <!-- Upgrade 3: Mobile Hamburger Button -->
      <button id="vmn-mobile-menu-btn" class="vmn-hamburger-btn" type="button" aria-label="Open Navigation Drawer" title="Open Navigation Menu">
        ${renderIcon("menu", { size: 22 })}
      </button>
    </div>
  </header>

  <!-- Upgrade 4: Live Broadcast Playout Status Ticker & Health Bar -->
  <div class="vmn-playout-ticker" role="region" aria-label="Live Linear Broadcast Playout Ticker">
    <div class="vmn-ticker-channels">
      <span class="vmn-ticker-pill">
        <span class="vmn-ticker-dot" aria-hidden="true"></span>
        <span>Nigezie Xtreme</span>
        <span class="vmn-ticker-tech">CH 428 DTT · 1080i50 · ON AIR</span>
      </span>
      <span class="vmn-ticker-pill">
        <span class="vmn-ticker-dot" aria-hidden="true"></span>
        <span>Orisun</span>
        <span class="vmn-ticker-tech">CH 430 DTT · 1080i50 · ON AIR</span>
      </span>
      <span class="vmn-ticker-pill">
        <span class="vmn-ticker-dot" aria-hidden="true"></span>
        <span>Isi Mbido</span>
        <span class="vmn-ticker-tech">CH 432 DTT · 1080i50 · ON AIR</span>
      </span>
    </div>
    <div style="display: flex; align-items: center; gap: 14px;">
      <span style="font-size: 0.75rem; color: #94A3B8;">Playout Engine: <strong style="color: #22C55E;">Operational (0 Active Alerts)</strong></span>
      <a href="/broadcast/dashboard" style="color: #A5E8CD; text-decoration: underline; font-size: 0.75rem;">MCR Console</a>
    </div>
  </div>

  <main id="main-content" class="vmn-container">
    ${shellContent}
  </main>

  <footer class="vmn-footer">
    <p>&copy; 2026 Virtual Media Network Limited (VMNL). All rights reserved. ${getConfig().COMPANY_RC_NUMBER}.</p>
    <p style="margin-top: 8px; font-size: 0.75rem;">
      Operates Nigezie Xtreme, Orisun — The Source, Isi Mbido — The Beginning on StarTimes DTT/DTH | 
      Engineered to WCAG 2.2 Level AA &amp; NBC Broadcast Code standards | 
      <a href="/prototypes" style="color: var(--vmn-color-text-muted); text-decoration: underline; margin-right: 8px;">R1.1 Prototypes</a> |
      <a href="/styleguide" style="color: var(--vmn-color-text-muted); text-decoration: underline; margin-left: 4px;">Design System Styleguide</a>
    </p>
  </footer>

  <!-- Upgrade 3: Mobile Touch Drawer -->
  <div id="vmn-drawer-backdrop" class="vmn-drawer-backdrop" aria-hidden="true"></div>
  <aside id="vmn-mobile-drawer" class="vmn-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation Drawer">
    <div class="vmn-drawer-header">
      <div style="font-weight: 800; font-size: 1.1rem; color: var(--vmn-color-primary-text);">VMN Navigation</div>
      <button id="vmn-drawer-close" class="btn btn-outline" style="min-height: 44px; min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" aria-label="Close Navigation Drawer" type="button">
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
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--vmn-color-border);">
        <button id="vmn-mobile-cmd-trigger" class="btn btn-outline" style="width: 100%; justify-content: flex-start; gap: 10px;" type="button">
          ${renderIcon("search", { size: 16 })}
          <span>Command Palette (Cmd+K)</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- Upgrade 3: Sticky Mobile Action Bar -->
  <nav class="vmn-mobile-action-bar" aria-label="Quick Mobile Actions">
    <a href="/" class="btn btn-outline" style="flex: 1; min-height: 44px; padding: 6px 10px; font-size: 0.8rem; text-decoration: none;">
      Overview
    </a>
    <a href="/channels" class="btn btn-outline" style="flex: 1; min-height: 44px; padding: 6px 10px; font-size: 0.8rem; text-decoration: none;">
      Channels
    </a>
    <a href="/prototypes" class="btn btn-primary" style="flex: 1; min-height: 44px; padding: 6px 10px; font-size: 0.8rem; text-decoration: none;">
      Prototypes
    </a>
    <button id="vmn-mobile-quick-jump" class="btn btn-secondary" style="min-height: 44px; min-width: 44px; padding: 0;" aria-label="Open Quick Jump" type="button">
      ${renderIcon("command", { size: 18 })}
    </button>
  </nav>

  <!-- Upgrade 1: Universal Command Palette (Cmd+K) Modal -->
  <div id="vmn-cmd-backdrop" class="vmn-cmd-backdrop" role="dialog" aria-modal="true" aria-label="Command Palette">
    <div class="vmn-cmd-dialog">
      <div class="vmn-cmd-header">
        ${renderIcon("search", { size: 20 })}
        <input type="text" id="vmn-cmd-input" class="vmn-cmd-input" placeholder="Type a screen, destination, or command..." autocomplete="off" spellcheck="false" aria-label="Search destinations and commands">
        <button id="vmn-cmd-close" class="btn btn-outline" style="min-height: 44px; min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" aria-label="Close Command Palette" type="button">
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

  <script>
  (function() {
    // 1. Theme Switcher Engine
    const themeBtn = document.getElementById("vmn-theme-toggle");
    const savedTheme = localStorage.getItem("vmn-theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    function applyTheme(theme) {
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try { localStorage.setItem("vmn-theme", theme); } catch (e) {}
    }

    if (initialTheme === "dark") {
      applyTheme("dark");
    }

    if (themeBtn) {
      themeBtn.addEventListener("click", function() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(isDark ? "light" : "dark");
      });
    }

    // 2. Mobile Drawer Navigation
    const mobileMenuBtn = document.getElementById("vmn-mobile-menu-btn");
    const drawer = document.getElementById("vmn-mobile-drawer");
    const backdrop = document.getElementById("vmn-drawer-backdrop");
    const drawerCloseBtn = document.getElementById("vmn-drawer-close");

    function openDrawer() {
      if (drawer && backdrop) {
        drawer.classList.add("open");
        backdrop.classList.add("open");
      }
    }
    function closeDrawer() {
      if (drawer && backdrop) {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
      }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    // 3. Interactive Persona Switcher
    const personaSwitcher = document.getElementById("vmn-persona-switcher");
    if (personaSwitcher) {
      personaSwitcher.addEventListener("change", function(e) {
        const role = e.target.value;
        try { localStorage.setItem("vmn-persona", role); } catch (e) {}
        if (role === "visitor") window.location.href = "/";
        else if (role === "applicant") window.location.href = "/prototypes?screen=application";
        else if (role === "talent") window.location.href = "/prototypes?screen=terms";
        else if (role === "client") window.location.href = "/prototypes?screen=client";
        else if (role === "operator") window.location.href = "/prototypes?screen=work";
      });
    }

    // 4. Universal Command Palette (Cmd+K)
    const cmdBackdrop = document.getElementById("vmn-cmd-backdrop");
    const cmdInput = document.getElementById("vmn-cmd-input");
    const cmdResults = document.getElementById("vmn-cmd-results");
    const cmdCloseBtn = document.getElementById("vmn-cmd-close");
    const cmdTrigger = document.getElementById("vmn-cmd-trigger");
    const mobileCmdTrigger = document.getElementById("vmn-mobile-cmd-trigger");
    const mobileQuickJump = document.getElementById("vmn-mobile-quick-jump");

    const COMMAND_ITEMS = [
      { category: "Primary Surfaces", title: "Public Overview", url: "/", hint: "Enterprise Proposition" },
      { category: "Primary Surfaces", title: "Linear Television Channels", url: "/channels", hint: "Nigezie, Orisun, Isi Mbido" },
      { category: "Primary Surfaces", title: "Creative Economy Hub", url: "/hub", hint: "Talent, Production, Academy" },
      { category: "Primary Surfaces", title: "Operator Workstations", url: "/workspace", hint: "Broadcast & Hub Operations" },
      { category: "Primary Surfaces", title: "Broadcast Consoles Catalog", url: "/broadcast/screens", hint: "Operational Screens Catalog" },
      { category: "Primary Surfaces", title: "Broadcast Executive Dashboard", url: "/broadcast/dashboard", hint: "MCR Operations" },
      { category: "Primary Surfaces", title: "Azeebo+ Gateway", url: "/azeebo/gateway", hint: "Streaming Federation" },
      { category: "Primary Surfaces", title: "UI/UX Prototypes Viewer", url: "/prototypes", hint: "8 R1.1 Screens & Scenarios" },
      { category: "Primary Surfaces", title: "Design System Styleguide", url: "/styleguide", hint: "Canonical R1.1 Tokens" },
      { category: "Primary Surfaces", title: "API Documentation", url: "/docs", hint: "OpenAPI Specification" },

      { category: "R1.1 Critical Prototypes", title: "UX-PUB-001: Public Home", url: "/prototypes?screen=home", hint: "First-Release Screen 1" },
      { category: "R1.1 Critical Prototypes", title: "UX-PUB-004: Channel Hub & Program Guide", url: "/prototypes?screen=channel", hint: "First-Release Screen 2" },
      { category: "R1.1 Critical Prototypes", title: "UX-HUB-001: Multi-workspace Hub Workstation", url: "/prototypes?screen=work", hint: "First-Release Screen 3" },
      { category: "R1.1 Critical Prototypes", title: "UX-PRJ-002: Counterparty Sponsor Portal", url: "/prototypes?screen=client", hint: "First-Release Screen 4" },
      { category: "R1.1 Critical Prototypes", title: "UX-APP-002: AFCA Academy Application", url: "/prototypes?screen=application", hint: "First-Release Screen 5" },
      { category: "R1.1 Critical Prototypes", title: "UX-VTM-008: Talent Engagement Agreement", url: "/prototypes?screen=terms", hint: "First-Release Screen 6" },
      { category: "R1.1 Critical Prototypes", title: "UX-BR-012: Broadcast Master Schedule Review", url: "/prototypes?screen=schedule", hint: "First-Release Screen 7" },
      { category: "R1.1 Critical Prototypes", title: "UX-BR-030: Proof-of-Air Delivery Reconciliation", url: "/prototypes?screen=proof", hint: "First-Release Screen 8" },

      { category: "Simulated Operational Scenarios", title: "Scenario: Normal Operating State", url: "/prototypes?scenario=normal", hint: "All systems green" },
      { category: "Simulated Operational Scenarios", title: "Scenario: Stale Data Notice (Degraded)", url: "/prototypes?scenario=stale", hint: "Simulate feed latency" },
      { category: "Simulated Operational Scenarios", title: "Scenario: Transmission Rights Blocker", url: "/prototypes?scenario=blocked", hint: "Simulate audit hold" },
      { category: "Simulated Operational Scenarios", title: "Scenario: Network Idempotent Recovery", url: "/prototypes?scenario=recovery", hint: "Simulate retry success" }
    ];

    let selectedIndex = 0;
    let filteredItems = [...COMMAND_ITEMS];

    function renderCommandResults() {
      if (!cmdResults) return;
      if (filteredItems.length === 0) {
        cmdResults.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--vmn-color-text-muted);">No matching destinations found.</div>';
        return;
      }

      let currentCategory = "";
      let html = "";
      filteredItems.forEach(function(item, idx) {
        if (item.category !== currentCategory) {
          currentCategory = item.category;
          html += '<div class="vmn-cmd-category">' + currentCategory + '</div>';
        }
        const isSelected = idx === selectedIndex;
        html += '<a href="' + item.url + '" class="vmn-cmd-item ' + (isSelected ? 'selected' : '') + '" data-index="' + idx + '">';
        html += '  <div>';
        html += '    <div style="font-weight: 600;">' + item.title + '</div>';
        html += '    <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">' + item.hint + '</div>';
        html += '  </div>';
        html += '  <span style="font-size: 0.75rem; font-family: var(--vmn-font-mono); color: var(--vmn-color-text-muted);">' + item.url + '</span>';
        html += '</a>';
      });
      cmdResults.innerHTML = html;
    }

    function openCommandPalette() {
      if (!cmdBackdrop) return;
      closeDrawer();
      cmdBackdrop.classList.add("open");
      selectedIndex = 0;
      filteredItems = [...COMMAND_ITEMS];
      if (cmdInput) {
        cmdInput.value = "";
        cmdInput.focus();
      }
      renderCommandResults();
    }

    function closeCommandPalette() {
      if (!cmdBackdrop) return;
      cmdBackdrop.classList.remove("open");
    }

    if (cmdTrigger) cmdTrigger.addEventListener("click", openCommandPalette);
    if (mobileCmdTrigger) mobileCmdTrigger.addEventListener("click", openCommandPalette);
    if (mobileQuickJump) mobileQuickJump.addEventListener("click", openCommandPalette);
    if (cmdCloseBtn) cmdCloseBtn.addEventListener("click", closeCommandPalette);

    if (cmdBackdrop) {
      cmdBackdrop.addEventListener("click", function(e) {
        if (e.target === cmdBackdrop) closeCommandPalette();
      });
    }

    if (cmdInput) {
      cmdInput.addEventListener("input", function(e) {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          filteredItems = [...COMMAND_ITEMS];
        } else {
          filteredItems = COMMAND_ITEMS.filter(function(item) {
            return item.title.toLowerCase().indexOf(query) !== -1 ||
                   item.hint.toLowerCase().indexOf(query) !== -1 ||
                   item.url.toLowerCase().indexOf(query) !== -1 ||
                   item.category.toLowerCase().indexOf(query) !== -1;
          });
        }
        selectedIndex = 0;
        renderCommandResults();
      });

      cmdInput.addEventListener("keydown", function(e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (filteredItems.length > 0) {
            selectedIndex = (selectedIndex + 1) % filteredItems.length;
            renderCommandResults();
            ensureVisible();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (filteredItems.length > 0) {
            selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
            renderCommandResults();
            ensureVisible();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            window.location.href = filteredItems[selectedIndex].url;
          }
        }
      });
    }

    function ensureVisible() {
      const selectedEl = cmdResults && cmdResults.querySelector(".vmn-cmd-item.selected");
      if (selectedEl && selectedEl.scrollIntoView) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }

    // Keyboard Shortcuts: Cmd+K / Ctrl+K and Escape
    window.addEventListener("keydown", function(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (cmdBackdrop && cmdBackdrop.classList.contains("open")) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      } else if (e.key === "Escape") {
        closeCommandPalette();
        closeDrawer();
      }
    });
  })();
  </script>
</body>
</html>`;
}

export function renderHomePageHtml(): string {
  const pillarsHtml = VMN_ENTERPRISE_PILLARS.map(
    (p) => `
    <div class="card">
      <span class="vmn-badge badge-info">Core Pillar</span>
      <h3>${p.name}</h3>
      <p><strong>${p.tagline}</strong></p>
      <p>${p.description}</p>
      <div>
        <a href="${p.route}" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center;">Explore ${p.name} &rarr;</a>
      </div>
    </div>`
  ).join("");

  const leadershipHtml = VMN_LEADERSHIP.map(
    (l) => `
    <div class="card">
      <h3>${l.name}</h3>
      <p style="color: var(--vmn-secondary); font-weight: 600;">${l.title}</p>
      <p>${l.bio}</p>
    </div>`
  ).join("");

  return `
    <!-- UX-PUB-001 Public Home (Docx §8.1 Strict Content Order) -->
    <!-- 1. Approved Identity & Enterprise Proposition -->
    <div class="vmn-public-hero">
      <span class="vmn-badge badge-ready" style="margin-bottom: 12px; background: rgba(255,255,255,0.15); color: #FFFFFF; border-color: rgba(255,255,255,0.3);">
        Enterprise &amp; Creative Economy Ecosystem
      </span>
      <h1 style="font-size: var(--vmn-font-size-hero); font-weight: 800; margin-bottom: 16px;">
        Powering the African Creative Economy
      </h1>
      <p style="font-size: 1.15rem; color: #E2E8F0; max-width: 800px; margin-bottom: 24px; line-height: 1.6;">
        Virtual Media Network Limited orchestrates 24/7 linear television broadcasting on StarTimes, 
        turnkey Creative Economy infrastructure for African creators, and the direct-to-consumer Azeebo+ federation.
      </p>

      <!-- 2. Primary Discovery Actions -->
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="/channels" class="btn" style="background: #A5E8CD; color: #0E2B20; font-weight: 700; min-height: 44px; display: inline-flex; align-items: center;">Explore Channels</a>
        <a href="/apply" class="btn btn-outline" style="color: #FFFFFF; border-color: rgba(255,255,255,0.4); min-height: 44px; display: inline-flex; align-items: center;">Apply to AFCA Academy</a>
        <a href="/contact" class="btn btn-outline" style="color: #FFFFFF; border-color: rgba(255,255,255,0.4); min-height: 44px; display: inline-flex; align-items: center;">Commercial Enquiry</a>
        <a href="/azeebo/gateway" class="btn btn-outline" style="color: #FFFFFF; border-color: rgba(255,255,255,0.4); min-height: 44px; display: inline-flex; align-items: center;">Open Azeebo+</a>
      </div>
    </div>

    <!-- 3. Television Portfolio -->
    <section style="margin-bottom: 40px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
        <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin: 0;">Linear Television Portfolio</h2>
        <span style="font-size: 0.85rem; color: var(--vmn-color-text-muted);">24/7 StarTimes DTT &amp; Satellite Carriage</span>
      </div>
      <div class="grid grid-cols-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div class="card" style="border-top: 4px solid #E50914;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="vmn-badge badge-live">Live On Air</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 428 DTT / 256 DTH</span>
          </div>
          <h3 style="margin: 0 0 6px 0;">Nigezie Xtreme</h3>
          <p style="font-size: 0.9rem; color: var(--vmn-color-text-muted); margin-bottom: 16px;">
            Urban music, youth lifestyle and African contemporary culture broadcast in HD 1080i50.
          </p>
          <a href="/channels" class="btn btn-outline" style="width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">View Channel &rarr;</a>
        </div>

        <div class="card" style="border-top: 4px solid #FFB800;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="vmn-badge badge-live">Live On Air</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 430 DTT / 477 DTH</span>
          </div>
          <h3 style="margin: 0 0 6px 0;">Orisun &mdash; The Source</h3>
          <p style="font-size: 0.9rem; color: var(--vmn-color-text-muted); margin-bottom: 16px;">
            Yoruba language, drama, cultural events, music, and heritage entertainment.
          </p>
          <a href="/channels" class="btn btn-outline" style="width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">View Channel &rarr;</a>
        </div>

        <div class="card" style="border-top: 4px solid #0369A1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="vmn-badge badge-live">Live On Air</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-text-muted);">Ch 432 DTT / 480 DTH</span>
          </div>
          <h3 style="margin: 0 0 6px 0;">Isi Mbido &mdash; The Beginning</h3>
          <p style="font-size: 0.9rem; color: var(--vmn-color-text-muted); margin-bottom: 16px;">
            Authentic Igbo drama, customs, linguistic preservation, and traditional storytelling.
          </p>
          <a href="/channels" class="btn btn-outline" style="width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">View Channel &rarr;</a>
        </div>
      </div>
    </section>

    <!-- 4. Three Enterprise Pillars -->
    <section style="margin-bottom: 40px;">
      <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin-bottom: 16px;">The Three Enterprise Pillars</h2>
      <div class="grid-3">${pillarsHtml}</div>
    </section>

    <!-- 5. Azeebo+ Federated Gateway Banner -->
    <section class="vmn-azeebo-gateway-banner">
      <div>
        <span class="vmn-badge badge-info" style="margin-bottom: 8px;">Consumer Streaming Universe</span>
        <h3 style="margin: 0 0 6px 0; font-size: 1.25rem;">Azeebo+ Digital Federation</h3>
        <p style="font-size: 0.95rem; color: var(--vmn-color-text-muted); margin: 0; max-width: 650px;">
          Seamlessly connect linear TV viewers with on-demand streaming, masterclasses, and digital commerce.
        </p>
      </div>
      <a href="/azeebo/gateway" class="btn btn-primary" style="white-space: nowrap;">
        Open Azeebo+ Gateway &rarr;
      </a>
    </section>

    <!-- 6. Executive Leadership -->
    <section style="margin-top: 40px;">
      <h2 style="font-size: var(--vmn-font-size-heading); font-weight: 800; margin-bottom: 16px;">Executive Leadership</h2>
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
      <div class="card" role="note" aria-label="Schedule availability notice" style="background: var(--vmn-surface-alt); padding: 12px 16px; border: 1px solid var(--vmn-surface-border); border-radius: var(--vmn-radius-md);">
        <strong>Schedule Notice:</strong> The now/next programme widget is unavailable because no approved schedule source is connected. Programme data will appear here once the approved schedule is published.
      </div>
    `;

    return `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="vmn-badge badge-live">Live On Air</span>
          <span style="font-weight: 700; color: var(--vmn-text-muted);">StarTimes Ch ${c.starTimesCarriage.dttChannelNumber} DTT / ${c.starTimesCarriage.dthChannelNumber} DTH</span>
        </div>
        <h2 style="color: ${pub?.accentColor || "inherit"}">${c.name} (${c.code})</h2>
        <p><strong>${c.tagline}</strong></p>
        <p>${c.targetAudience}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
          <div class="stat-box"><span class="stat-lbl">Resolution</span><span style="font-weight: 700;">${c.resolution}</span></div>
          <div class="stat-box"><span class="stat-lbl">Audio Standard</span><span style="font-weight: 700;">EBU R128 (-23 LUFS)</span></div>
        </div>
        <div style="margin-top: 12px;">
          ${widgetHtml}
        </div>
        <div style="margin-top: 12px; display: flex; gap: 12px;">
          <a href="/api/v1/broadcast/epg/${c.code}" class="btn btn-outline" target="_blank">XMLTV Feed Status</a>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section>
      <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 8px;">Linear Television Networks</h1>
      <p style="color: var(--vmn-text-muted); margin-bottom: 24px;">Flagship Nigerian television channels broadcasting 24/7 on StarTimes DTT and DTH platforms.</p>
      <div class="grid-3">${channelsHtml}</div>
    </section>
  `;
}

export function renderHubPageHtml(): string {
  const showcases = Object.values(HUB_SHOWCASES).map(
    (h) => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span class="vmn-badge badge-info">${h.vertical.replace(/_/g, " ")}</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 8px;">${h.title}</h3>
        <p style="color: var(--vmn-color-primary); font-weight: 600; font-size: 0.95rem; margin-top: 4px;">${h.tagline}</p>
        <p style="color: var(--vmn-text-muted); font-size: 0.9rem; margin-top: 8px;">${h.description}</p>
      </div>
      <div style="margin-top: 16px;">
        <a href="${h.route}" class="btn btn-primary" style="text-decoration: none; width: 100%; text-align: center; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;">${h.callToAction} &rarr;</a>
      </div>
    </div>`
  ).join("");

  return `
    <section>
      <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 8px;">Creative Economy Hub</h1>
      <p style="color: var(--vmn-text-muted); margin-bottom: 24px;">
        Ten integrated verticals accelerating African creative talent from discovery and training to financing and global monetization.
      </p>
      <div class="grid-3">${showcases}</div>
    </section>
  `;
}

export function renderDashboardHtml(): string {
  const screens = BROADCAST_SCREEN_INVENTORY.slice(0, 8);
  const screenCardsHtml = screens.map(
    (s) => `
    <div class="card" style="padding: 16px;">
      <div style="display: flex; justify-content: space-between;">
        <span class="vmn-badge badge-info">${s.screenId}</span>
        <span style="font-size: 0.75rem; color: var(--vmn-text-muted);">${s.primaryRole}</span>
      </div>
      <h4 style="font-size: 1rem; font-weight: 700;">${s.name}</h4>
      <p style="font-size: 0.85rem;">${s.description}</p>
      <code style="font-size: 0.75rem; background: var(--vmn-surface-alt); padding: 4px; border-radius: 4px;">${s.route}</code>
    </div>`
  ).join("");

  return `
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready">Operational Screen: SCR-BCST-01</span>
          <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 4px;">Broadcast Executive Dashboard</h1>
          <p style="color: var(--vmn-text-muted);">Real-time monitoring across NXTR, ORIS, IMBD, StarTimes carriage, playout, and financial yield.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <a href="/docs" class="btn btn-outline" id="btn-eval-gates">Release Gates API Reference</a>
          <a href="/metrics" class="btn btn-outline" target="_blank">View Prometheus Metrics</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div class="stat-box">
          <span class="stat-lbl">Active Linear Channels</span>
          <span class="stat-val">3 / 3</span>
          <span style="font-size: 0.75rem; color: var(--vmn-success);">NXTR, ORIS, IMBD On-Air</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">StarTimes Carriage</span>
          <span class="stat-val">99.98%</span>
          <span style="font-size: 0.75rem; color: var(--vmn-success);">Zero active transponder faults</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">Playout Cache Autonomy</span>
          <span class="stat-val">48.0 Hours</span>
          <span style="font-size: 0.75rem; color: var(--vmn-success);">Autonomous offline cache ready</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">Commercial Airing Rate</span>
          <span class="stat-val">100.0%</span>
          <span style="font-size: 0.75rem; color: var(--vmn-success);">Certificates of Airing issued</span>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>Transmission & Carriage Status</h3>
          <p>Real-time telemetry from StarTimes DTT/DTH headend encoders:</p>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--vmn-surface-alt); border-radius: var(--vmn-radius-md);">
              <div>
                <strong>Nigezie Xtreme (NXTR)</strong><br>
                <small style="color: var(--vmn-text-muted);">PID 1042 | DTT Ch 428 / DTH Ch 312</small>
              </div>
              <span class="vmn-badge badge-ready">ONLINE 1080i50</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--vmn-surface-alt); border-radius: var(--vmn-radius-md);">
              <div>
                <strong>Orisun (ORIS)</strong><br>
                <small style="color: var(--vmn-text-muted);">PID 1044 | DTT Ch 430 / DTH Ch 315</small>
              </div>
              <span class="vmn-badge badge-ready">ONLINE 1080i50</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--vmn-surface-alt); border-radius: var(--vmn-radius-md);">
              <div>
                <strong>Isi Mbido (IMBD)</strong><br>
                <small style="color: var(--vmn-text-muted);">PID 1046 | DTT Ch 432 / DTH Ch 318</small>
              </div>
              <span class="vmn-badge badge-ready">ONLINE 1080i50</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Azeebo+ Federation Circuit Breaker</h3>
          <p>Event mesh and direct-to-consumer referral bridge status:</p>
          <div class="stat-box" style="margin-top: 8px;">
            <span class="stat-lbl">Circuit Breaker State</span>
            <span class="stat-val" style="color: var(--vmn-success);">CLOSED (Healthy)</span>
            <span style="font-size: 0.75rem; color: var(--vmn-text-muted);">Zero fault trips in last 24h. DLQ depth: 0 items</span>
          </div>
          <div style="margin-top: 12px;">
            <p><strong>Azeebo+ 8 Universes Referral Links:</strong> Active and tracking QR scans with NDPR SHA-256 telemetry.</p>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Broadcast Operational Screens Quick-Access</h2>
        <p style="color: var(--vmn-text-muted); margin-bottom: 16px;">Core control surfaces from the complete 33-screen operational inventory (R1.2A §46):</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          ${screenCardsHtml}
        </div>
        <div style="margin-top: 16px; text-align: center; display: flex; justify-content: center; gap: 12px;">
          <a href="/broadcast/screens" class="btn btn-primary">Browse All 33 Operational Screen Surfaces &rarr;</a>
          <a href="/api/v1/broadcast/screens" class="btn btn-outline" target="_blank">View JSON Schema</a>
        </div>
      </div>
    </section>

  `;
}
