/**
 * VMNL Canonical Design System Stylesheet
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) WS-1 / AGENTS.md UI/UX Rules
 *
 * Provides:
 * 1. Unified high-contrast color tokens and 4px spacing scale (automated contrast check >= 4.5:1 / 3:1)
 * 2. Mobile-first responsive grids and reflow rules
 * 3. Component state classes and operational console styling
 * 4. Linear channel widget classes (.vmn-on-air-widget, .vmn-live-badge, etc. - closes DS-04)
 * 5. Utility classes (.grid, .flex, .text-*, .p-*, .mb-*, etc. - closes DS-02)
 */

import { GENERATED_UTILITY_CSS } from "./generated-utilities.js";

export const CANONICAL_STYLESHEET = `
  /* -------------------------------------------------------------------------- */
  /* 1. Design Tokens (:root)                                                   */
  /* -------------------------------------------------------------------------- */
  :root {
    /* Color Palette - VMN APP UI UX.docx §7.1 & CCPP §3.4 Reconciled Baseline */
    --vmn-color-primary: #174C3C;         /* Deep Forest Green: 9.83:1 contrast on white (AAA pass) */
    --vmn-color-primary-hover: #0E2B20;   /* 15.69:1 contrast on white */
    --vmn-color-primary-text: #FFFFFF;    /* 9.83:1 on primary action */
    --vmn-color-secondary: #172434;       /* Dark Slate: 15.69:1 contrast on white */
    --vmn-color-brand: #E50914;           /* VMN Red (4.79:1 on white, brand accents / large text) */
    --vmn-color-accent: #FFB800;          /* Gold graphic accent */

    --vmn-color-success-bg: #DCFCE7;
    --vmn-color-success-text: #166534;     /* 6.19:1 on bg */
    --vmn-color-success-border: #86EFAC;

    --vmn-color-live-bg: #FFF0F0;
    --vmn-color-live-text: #991B1B;        /* 7.51:1 on bg */
    --vmn-color-live-border: #FCA5A5;

    --vmn-color-info-bg: #E0F2FE;
    --vmn-color-info-text: #075985;        /* 6.58:1 on bg */
    --vmn-color-info-border: #BAE6FD;

    --vmn-color-warning-bg: #FFF4E6;
    --vmn-color-warning-text: #8A3410;     /* 7.50:1 on bg */
    --vmn-color-warning-border: #FDE68A;

    --vmn-color-neutral-bg: #F1F5F9;
    --vmn-color-neutral-text: #334155;     /* 9.61:1 on bg */
    --vmn-color-neutral-border: #CBD5E1;

    --vmn-color-border: #222222;          /* Decorative separator on Vanta Black */
    --vmn-color-control-border: #718096;  /* Interactive control boundary (4.02:1 on white, 5.22:1 on black >= 3:1) */

    --vmn-color-canvas: #000000;          /* Vanta Black (#000000) default and only base canvas */
    --vmn-color-text-main: #F8FAFC;       /* Primary text (20.0:1 on Vanta Black) */
    --vmn-color-text-muted: #94A3B8;      /* Secondary / Muted text (8.2:1 on Vanta Black) */
    --vmn-color-text-subtle: #94A3B8;     /* Subtle metadata (8.2:1 on Vanta Black) */
    --vmn-color-focus: #38BDF8;           /* High-contrast focus indicator (9.5:1 on Vanta Black) */

    --vmn-surface: #0a0a0a;               /* Vanta Black card surface */
    --vmn-surface-alt: #000000;           /* Vanta Black canvas background */
    --vmn-surface-accent: #111e19;        /* Supporting accent surface / soft emphasis */
    --vmn-surface-dark: #000000;          /* Content surface in dark mode */

    /* Legacy Token Aliases for Zero-Regression Backwards Compatibility */
    --vmn-primary: var(--vmn-color-secondary);
    --vmn-secondary: var(--vmn-color-primary);
    --vmn-accent: var(--vmn-color-brand);
    --vmn-success: var(--vmn-color-success-text);
    --vmn-warning: var(--vmn-color-warning-text);
    --vmn-error: var(--vmn-color-live-text);
    --vmn-surface-border: var(--vmn-color-border);
    --vmn-text-main: var(--vmn-color-text-main);
    --vmn-text-muted: var(--vmn-color-text-muted);
    --vmn-text-inverse: #FFFFFF;
    --vmn-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06);
    --vmn-focus-ring: 0 0 0 3px rgba(22, 85, 188, 0.4);

    /* 4px Spacing Grid & Layout Geometry (Docx §7.2) */
    --vmn-space-1: 4px;
    --vmn-space-2: 8px;
    --vmn-space-3: 12px;
    --vmn-space-4: 16px;
    --vmn-space-5: 20px;
    --vmn-space-6: 24px;
    --vmn-space-7: 32px;
    --vmn-space-8: 48px;
    --vmn-space-9: 64px;

    --vmn-panel-padding: 22px;
    --vmn-panel-padding-compact: 18px;
    --vmn-content-padding: 28px;
    --vmn-content-padding-compact: 20px 16px;
    --vmn-sidebar-width: 188px;

    /* Linear Channel Brand Colors */
    --vmn-color-channel-nxtr: #E50914;    /* Nigezie Xtreme Red */
    --vmn-color-channel-oris: #FFB800;    /* Orisun Gold */
    --vmn-color-channel-imbd: #0369A1;    /* Isi Mbido Ocean Blue */

    /* Semantic Surface Hierarchy (Vanta Black Foundation) */
    --vmn-surface-ground: var(--vmn-color-canvas);
    --vmn-surface-raised: var(--vmn-surface);
    --vmn-surface-overlay: #181818;
    --vmn-surface-sunken: #050505;

    /* Typography Scales (Docx §7.2 with modern fluid scaling) */
    --vmn-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --vmn-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    --vmn-font-size-metadata: 13px;
    --vmn-font-size-body: clamp(0.9375rem, 0.875rem + 0.3vw, 1rem);
    --vmn-font-size-heading: clamp(1.15rem, 1rem + 0.5vw, 1.3125rem);
    --vmn-font-size-page-title: clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem);
    --vmn-font-size-page-title-compact: clamp(1.3rem, 1.1rem + 1vw, 1.625rem);
    --vmn-font-size-hero: clamp(2rem, 1.5rem + 2.5vw, 2.875rem);
    --vmn-font-size-hero-compact: clamp(1.6rem, 1.2rem + 1.8vw, 2rem);

    /* Radius & Elevation (Docx §7.2: 8px control, 10px panel) */
    --vmn-radius-sm: 4px;
    --vmn-radius-md: 8px;        /* Control radius: 8px */
    --vmn-radius-panel: 10px;    /* Content panel radius: 10px */
    --vmn-radius-lg: 10px;
    --vmn-radius-full: 9999px;
    --vmn-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08);
    --vmn-shadow-2: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    --vmn-shadow-3: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --vmn-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
    --vmn-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --vmn-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --vmn-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --vmn-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

    /* Transition & Motion Tokens */
    --vmn-duration-instant: 100ms;
    --vmn-duration-fast: 150ms;
    --vmn-duration-normal: 250ms;
    --vmn-duration-slow: 350ms;
    --vmn-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --vmn-ease-in: cubic-bezier(0.7, 0, 0.84, 0);
    --vmn-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Dark Mode Appearance (Docx §7.1 - System & Manual Toggle - Vanta Black Base) */
  :root[data-theme="dark"] {
    --vmn-color-canvas: #000000;
    --vmn-surface: #0a0a0a;
    --vmn-surface-alt: #000000;
    --vmn-surface-accent: #111e19;
    --vmn-surface-ground: #000000;
    --vmn-surface-raised: #111111;
    --vmn-surface-overlay: #181818;
    --vmn-surface-sunken: #050505;
    --vmn-color-text-main: #F1F5F9;
    --vmn-color-text-muted: #C2CBD6;
    --vmn-color-text-subtle: #A1B0C1;
    --vmn-color-primary: #A5E8CD;
    --vmn-color-primary-hover: #7DD3B1;
    --vmn-color-primary-text: #0E2B20;
    --vmn-color-secondary: #0F172A;
    --vmn-color-border: #222222;
    --vmn-color-control-border: #A1B0C1;
    --vmn-color-success-bg: #132A1E;
    --vmn-color-success-text: #86EFAC;
    --vmn-color-success-border: #22C55E;
    --vmn-color-info-bg: #132438;
    --vmn-color-info-text: #93C5FD;
    --vmn-color-info-border: #38BDF8;
    --vmn-color-warning-text: #FFCC9B;
    --vmn-color-warning-bg: #38241E;
    --vmn-color-warning-border: #F59E0B;
    --vmn-color-live-text: #FFC2C2;
    --vmn-color-live-bg: #3B2025;
    --vmn-color-live-border: #EF4444;
    --vmn-color-neutral-bg: #1E293B;
    --vmn-color-neutral-text: #CBD5E1;
    --vmn-color-neutral-border: #475569;
    --vmn-color-focus: #9AC3FF;
    --vmn-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.3);
    --vmn-shadow-2: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    --vmn-shadow-3: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --vmn-color-canvas: #000000;
      --vmn-surface: #0a0a0a;
      --vmn-surface-alt: #000000;
      --vmn-surface-accent: #111e19;
      --vmn-surface-ground: #000000;
      --vmn-surface-raised: #111111;
      --vmn-surface-overlay: #181818;
      --vmn-surface-sunken: #050505;
      --vmn-color-text-main: #F1F5F9;
      --vmn-color-text-muted: #C2CBD6;
      --vmn-color-text-subtle: #A1B0C1;
      --vmn-color-primary: #A5E8CD;
      --vmn-color-primary-hover: #7DD3B1;
      --vmn-color-primary-text: #0E2B20;
      --vmn-color-secondary: #0F172A;
      --vmn-color-border: #222222;
      --vmn-color-control-border: #A1B0C1;
      --vmn-color-success-bg: #132A1E;
      --vmn-color-success-text: #86EFAC;
      --vmn-color-success-border: #22C55E;
      --vmn-color-info-bg: #132438;
      --vmn-color-info-text: #93C5FD;
      --vmn-color-info-border: #38BDF8;
      --vmn-color-warning-text: #FFCC9B;
      --vmn-color-warning-bg: #38241E;
      --vmn-color-warning-border: #F59E0B;
      --vmn-color-live-text: #FFC2C2;
      --vmn-color-live-bg: #3B2025;
      --vmn-color-live-border: #EF4444;
      --vmn-color-neutral-bg: #1E293B;
      --vmn-color-neutral-text: #CBD5E1;
      --vmn-color-neutral-border: #475569;
      --vmn-color-focus: #9AC3FF;
      --vmn-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.3);
      --vmn-shadow-2: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
      --vmn-shadow-3: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 2. Global Resets & Document Shell                                         */
  /* -------------------------------------------------------------------------- */
  *, *::before, *::after {
    box-sizing: border-box;
    max-width: 100%;
  }

  html, body {
    margin: 0;
    padding: 0;
    font-family: var(--vmn-font-sans);
    background-color: var(--vmn-surface-alt);
    color: var(--vmn-color-text-main);
    line-height: 1.6;
    font-size: 16px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .card, table, p, h1, h2, h3, h4, code, pre, .prose {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Base typography and interactive link standards (WCAG 2.2 AA Contrast >= 4.5:1) */
  a:not([class*="btn"]):not([class*="button"]):not(.vmn-btn):not(.vmn-brand):not(.vmn-work-rail-link):not(.vmn-mega-item):not(.vmn-nav-links a) {
    color: var(--vmn-color-focus);
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
  a:not([class*="btn"]):not([class*="button"]):not(.vmn-btn):not(.vmn-brand):not(.vmn-work-rail-link):not(.vmn-mega-item):not(.vmn-nav-links a):hover {
    color: #BAE6FD;
  }

  /* Accessible Skip Link */
  .skip-link, .skip-to-content {
    position: absolute;
    top: -40px;
    left: 16px;
    background: var(--vmn-color-secondary);
    color: #FFFFFF;
    padding: 8px 16px;
    z-index: 9999;
    border-radius: var(--vmn-radius-sm);
    text-decoration: none;
    font-weight: 700;
    transition: top 0.15s ease-out;
  }
  .skip-link:focus, .skip-to-content:focus {
    top: 16px;
    outline: 3px solid var(--vmn-color-accent);
  }

  /* Master Navbar */
  header.vmn-navbar {
    background: rgba(23, 36, 52, 0.94);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    color: #FFFFFF;
    border-bottom: 2px solid var(--vmn-color-primary);
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: var(--vmn-shadow-sm);
    flex-wrap: wrap;
    gap: 12px;
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  :root[data-theme="dark"] header.vmn-navbar {
    background: rgba(16, 25, 34, 0.94);
  }

  .vmn-brand, .vmn-brand-group {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: #FFFFFF;
    font-weight: 800;
    font-size: 1.15rem;
    min-height: 44px;
  }
  .vmn-brand-logo {
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #38BDF8;
  }
  .vmn-brand-title {
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.9;
    color: #E2E8F0;
  }

  nav.vmn-nav-links {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  nav.vmn-nav-links a {
    text-decoration: none;
    color: #E2E8F0;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: var(--vmn-radius-sm);
    transition: color 0.15s ease, background 0.15s ease;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  nav.vmn-nav-links a:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
  }
  nav.vmn-nav-links a.active {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 -2px var(--vmn-color-accent);
  }
  nav.vmn-nav-links a:focus-visible {
    outline: 2px solid #FFFFFF;
    outline-offset: 2px;
  }

  /* Navigation Mega-Menu Dropdown (Desks 48) */
  .vmn-nav-dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .vmn-nav-dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    min-height: 38px;
    border-radius: var(--vmn-radius-sm);
    color: #F8FAFC;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--vmn-color-control-border);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .vmn-nav-dropdown-trigger:hover,
  .vmn-nav-dropdown-trigger:focus-visible {
    background: rgba(255, 255, 255, 0.12);
    border-color: #38BDF8;
    color: #FFFFFF;
    outline: 2px solid #38BDF8;
    outline-offset: 1px;
  }
  .vmn-nav-dropdown-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 960px;
    max-width: 94vw;
    max-height: 85vh;
    overflow-y: auto;
    background: #090d14;
    border: 1px solid #1E293B;
    border-radius: 12px;
    box-shadow: 0 24px 64px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.2);
    padding: 20px;
    z-index: 2000;
    display: none;
  }
  .vmn-nav-dropdown-menu.open {
    display: block;
    animation: vmnFadeSlideDown 0.18s ease-out;
  }
  @keyframes vmnFadeSlideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .vmn-mega-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    margin-bottom: 16px;
    border-bottom: 1px solid #1E293B;
  }
  .vmn-mega-title strong {
    display: block;
    font-size: 1.05rem;
    color: #F8FAFC;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .vmn-mega-title span {
    font-size: 0.75rem;
    color: #94A3B8;
  }
  .vmn-mega-hub-link {
    font-size: 0.82rem;
    font-weight: 700;
    color: #38BDF8;
    text-decoration: none;
    padding: 6px 12px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 6px;
    transition: background 0.15s ease;
  }
  .vmn-mega-hub-link:hover {
    background: rgba(56, 189, 248, 0.2);
    color: #FFFFFF;
  }
  .vmn-mega-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px) {
    .vmn-mega-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .vmn-nav-dropdown-menu {
      width: 620px;
    }
  }
  @media (max-width: 600px) {
    .vmn-mega-grid {
      grid-template-columns: 1fr;
    }
    .vmn-nav-dropdown-menu {
      width: 94vw;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .vmn-mega-pillar {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 12px;
  }
  .vmn-mega-pillar-heading {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #1E293B;
  }
  .vmn-mega-pillar-tag {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38BDF8;
  }
  .vmn-mega-pillar-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #E2E8F0;
  }
  .vmn-mega-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .vmn-mega-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.78rem;
    color: #CBD5E1;
    transition: all 0.12s ease;
    min-height: 32px;
  }
  .vmn-mega-item:hover,
  .vmn-mega-item:focus-visible {
    background: rgba(56, 189, 248, 0.12);
    color: #FFFFFF;
    outline: none;
  }
  .vmn-mega-item-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vmn-mega-key {
    font-family: var(--vmn-font-mono);
    font-size: 0.65rem;
    color: #64748B;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 2px 5px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .vmn-mega-item:hover .vmn-mega-key {
    color: #38BDF8;
    border-color: rgba(56, 189, 248, 0.3);
  }
  .vmn-mega-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #1E293B;
    font-size: 0.72rem;
    color: #64748B;
  }
  .vmn-mega-footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .vmn-mega-footer-actions a {
    color: #94A3B8;
    text-decoration: none;
  }
  .vmn-mega-footer-actions a:hover {
    color: #38BDF8;
    text-decoration: underline;
  }
  .vmn-divider {
    color: #334155;
  }

  main.vmn-container {
    flex: 1;
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 24px;
    min-height: 75vh;
  }

  footer.vmn-footer {
    background: var(--vmn-color-secondary);
    color: #CBD5E1;
    border-top: 1px solid #1E293B;
    padding: 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    margin-top: auto;
    font-size: 0.875rem;
    text-align: center;
  }
  footer.vmn-footer span, footer.vmn-footer p {
    color: #CBD5E1;
  }
  footer.vmn-footer a {
    color: #E2E8F0 !important;
    text-underline-offset: 3px;
  }
  footer.vmn-footer a:hover { color: #FFFFFF !important; }

  /* -------------------------------------------------------------------------- */
  /* 3. Utility Classes (closes DS-02)                                         */
  /* -------------------------------------------------------------------------- */
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .gap-2 { gap: var(--vmn-space-2); }
  .gap-4 { gap: var(--vmn-space-4); }
  .gap-6 { gap: var(--vmn-space-6); }

  .flex { display: flex; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .flex-wrap { flex-wrap: wrap; }
  .flex-col { flex-direction: column; }

  .p-2 { padding: var(--vmn-space-2); }
  .p-3 { padding: var(--vmn-space-3); }
  .p-4 { padding: var(--vmn-space-4); }
  .p-5 { padding: var(--vmn-space-5); }
  .p-6 { padding: var(--vmn-space-6); }
  .p-8 { padding: var(--vmn-space-8); }

  .mb-1 { margin-bottom: var(--vmn-space-1); }
  .mb-2 { margin-bottom: var(--vmn-space-2); }
  .mb-3 { margin-bottom: var(--vmn-space-3); }
  .mb-4 { margin-bottom: var(--vmn-space-4); }
  .mb-6 { margin-bottom: var(--vmn-space-6); }
  .mt-1 { margin-top: var(--vmn-space-1); }
  .mt-2 { margin-top: var(--vmn-space-2); }
  .mt-4 { margin-top: var(--vmn-space-4); }
  .pb-4 { padding-bottom: var(--vmn-space-4); }

  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .text-base { font-size: 1rem; line-height: 1.5rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .text-xs { font-size: 0.75rem; line-height: 1rem; }

  .font-extrabold { font-weight: 800; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-mono { font-family: var(--vmn-font-mono); }

  .text-slate-900 { color: #0F172A; }
  .text-slate-800 { color: #1E293B; }
  .text-slate-700 { color: #334155; }
  .text-slate-600 { color: #475569; }
  .text-slate-500 { color: #64748B; }
  .text-slate-400 { color: #94A3B8; }
  .text-red-800 { color: #991B1B; }
  .text-red-700 { color: #B91C1C; }
  .text-red-600 { color: #DC2626; }
  .text-emerald-400 { color: #34D399; }
  .text-sky-600 { color: var(--vmn-color-primary); }
  .text-sky-800 { color: #075985; }

  .bg-slate-900 { background-color: #0F172A; }
  .bg-slate-50 { background-color: #F8FAFC; }
  .bg-white { background-color: #FFFFFF; }
  .bg-red-50 { background-color: #FEF2F2; }
  .bg-sky-100 { background-color: #E0F2FE; }

  .border { border: 1px solid var(--vmn-color-border); }
  .border-b { border-bottom: 1px solid var(--vmn-color-border); }
  .border-slate-200 { border-color: var(--vmn-color-border); }
  .border-red-200 { border-color: #FECACA; }
  .rounded { border-radius: var(--vmn-radius-sm); }
  .rounded-lg { border-radius: var(--vmn-radius-md); }
  .shadow-sm { box-shadow: var(--vmn-shadow-1); }

  .w-full { width: 100%; }
  .max-w-2xl { max-width: 42rem; }
  .max-w-4xl { max-width: 56rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .overflow-x-auto { overflow-x: auto; }
  .bg-surface { background-color: var(--vmn-surface); }
  .text-muted { color: var(--vmn-color-text-muted); }
  .text-success { color: var(--vmn-color-success-text); }
  .btn-sm { padding: 6px 12px; font-size: 0.85rem; min-height: 38px; }
  .btn-success { background: var(--vmn-color-success-text); color: #FFFFFF; border-color: var(--vmn-color-success-text); }
  .btn-success:hover { background: #14532D; border-color: #14532D; }
  .badge-outline { background: transparent; border: 1px solid var(--vmn-color-control-border); color: var(--vmn-color-text-main); }
  .shadow { box-shadow: var(--vmn-shadow-2); }

  /* -------------------------------------------------------------------------- */
  /* 4. Interactive Components & States (WCAG AA & 44px Minimum Targets)       */
  /* -------------------------------------------------------------------------- */
  .card, .vmn-card {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: var(--vmn-space-6);
    box-shadow: var(--vmn-shadow-1);
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    container-type: inline-size;
  }
  .card:hover, .vmn-card:hover {
    box-shadow: var(--vmn-shadow-md);
  }

  .btn, .vmn-btn, .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--vmn-space-2);
    font-weight: 600;
    font-size: 0.95rem;
    padding: 10px 20px;
    border-radius: var(--vmn-radius-sm);
    text-decoration: none;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    border: 1px solid transparent;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  }
  .btn:focus-visible, .vmn-btn:focus-visible, .button:focus-visible, .vmn-btn-state-focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  .btn:disabled, .vmn-btn:disabled, .vmn-btn[aria-disabled="true"], .button:disabled, .vmn-btn-state-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn:active, .vmn-btn:active, .button:active, .vmn-btn-state-pressed {
    transform: scale(0.98);
  }
  .vmn-btn-state-hover {
    filter: brightness(0.95);
  }
  .vmn-btn-state-loading {
    cursor: wait;
    opacity: 0.85;
  }
  .vmn-btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #FFFFFF;
    animation: vmn-spin 0.6s linear infinite;
    margin-right: 6px;
    vertical-align: middle;
  }
  @keyframes vmn-spin {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .btn:active, .vmn-btn:active, .button:active, .vmn-btn-state-pressed {
      transform: none !important;
    }
    .vmn-btn-spinner {
      animation: none !important;
      opacity: 0.7;
    }
  }

  .btn-primary, .vmn-btn-primary, .button--primary {
    background: var(--vmn-color-primary);
    color: var(--vmn-color-primary-text);
    border-color: var(--vmn-color-primary);
  }
  .btn-primary:hover:not(:disabled), .vmn-btn-primary:hover:not(:disabled), .button--primary:hover:not(:disabled) {
    background: var(--vmn-color-primary-hover);
    border-color: var(--vmn-color-primary-hover);
  }

  .btn-secondary, .vmn-btn-secondary, .button--secondary {
    background: var(--vmn-color-secondary);
    color: #FFFFFF;
    border-color: var(--vmn-color-secondary);
  }
  .btn-secondary:hover:not(:disabled), .vmn-btn-secondary:hover:not(:disabled), .button--secondary:hover:not(:disabled) {
    background: #1E293B;
  }

  .btn-outline, .vmn-btn-outline {
    background: transparent;
    color: var(--vmn-color-text-main);
    border: 1px solid var(--vmn-color-control-border);
  }
  .btn-outline:hover:not(:disabled), .vmn-btn-outline:hover:not(:disabled) {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-text-main);
    border-color: var(--vmn-color-focus);
  }

  .btn-ghost, .vmn-btn-ghost {
    background: transparent;
    color: var(--vmn-color-text-main);
    border-color: transparent;
  }
  .btn-ghost:hover:not(:disabled), .vmn-btn-ghost:hover:not(:disabled) {
    background: var(--vmn-color-neutral-bg);
    color: var(--vmn-color-primary);
  }

  .btn-danger, .vmn-btn-danger {
    background: #DC2626;
    color: #FFFFFF;
    border-color: #DC2626;
  }

  /* Empty & Error State Component Classes */
  .vmn-empty-state {
    text-align: center;
    padding: 48px 24px;
    border: 1px dashed var(--vmn-color-control-border);
    border-radius: var(--vmn-radius-md);
    background: var(--vmn-surface);
  }
  .vmn-empty-icon {
    margin-bottom: 16px;
    color: var(--vmn-color-text-muted);
  }
  .vmn-empty-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--vmn-color-text-main);
  }
  .vmn-empty-description {
    color: var(--vmn-color-text-muted);
    max-width: 480px;
    margin: 0 auto;
    font-size: 0.95rem;
  }
  .vmn-empty-action {
    margin-top: 20px;
  }

  .vmn-error-state {
    padding: 24px;
    border: 1px solid var(--vmn-color-live-border);
    background: var(--vmn-color-live-bg);
    border-radius: var(--vmn-radius-md);
    color: var(--vmn-color-live-text);
  }

  .vmn-loading-skeleton {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .vmn-skeleton-line {
    background: linear-gradient(90deg, var(--vmn-color-border) 25%, var(--vmn-surface-alt) 50%, var(--vmn-color-border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
    border-radius: var(--vmn-radius-sm);
  }

  /* Form Fields */
  .vmn-form-field {
    margin-bottom: var(--vmn-space-4);
  }
  .vmn-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vmn-color-text-main);
    margin-bottom: var(--vmn-space-2);
  }
  .vmn-required {
    color: #DC2626;
  }
  .vmn-input {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--vmn-color-control-border);
    border-radius: var(--vmn-radius-sm);
    font-size: 1rem;
    background: var(--vmn-surface);
    color: var(--vmn-color-text-main);
  }
  .vmn-input:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    border-color: var(--vmn-color-focus);
  }
  .vmn-input[aria-invalid="true"] {
    border-color: #DC2626;
  }
  .vmn-input-error-msg {
    color: #991B1B;
    font-size: 0.8125rem;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Status Badges & Chips (closes DS-08) */
  .badge, .vmn-badge, .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--vmn-radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .badge-live, .status-chip-live {
    background: var(--vmn-color-live-bg);
    color: var(--vmn-color-live-text);
    border: 1px solid var(--vmn-color-live-border);
  }
  .badge-success, .badge-ready, .status-chip-success {
    background: var(--vmn-color-success-bg);
    color: var(--vmn-color-success-text);
    border: 1px solid var(--vmn-color-success-border);
  }
  .badge-info, .status-chip-info {
    background: var(--vmn-color-info-bg);
    color: var(--vmn-color-info-text);
    border: 1px solid var(--vmn-color-info-border);
  }
  .badge-warning, .status-chip-warning {
    background: var(--vmn-color-warning-bg);
    color: var(--vmn-color-warning-text);
    border: 1px solid var(--vmn-color-warning-border);
  }
  .badge-neutral, .status-chip-neutral {
    background: var(--vmn-color-neutral-bg);
    color: var(--vmn-color-neutral-text);
    border: 1px solid var(--vmn-color-neutral-border);
  }
  .badge-provisional, .status-chip-provisional {
    background: var(--vmn-color-warning-bg);
    color: var(--vmn-color-warning-text);
    border: 1px solid var(--vmn-color-warning-border);
  }

  /* Provenance Notice (closes DT-203) */
  .provenance-notice {
    background: var(--vmn-color-warning-bg);
    border: 1px solid var(--vmn-color-warning-border);
    color: var(--vmn-color-warning-text);
    padding: 8px 12px;
    border-radius: var(--vmn-radius-sm);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }

  /* Stat Box Grid Utilities */
  .stat-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: var(--vmn-surface-alt);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
  }
  .stat-val {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--vmn-color-primary);
  }
  .stat-lbl {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--vmn-color-text-muted);
  }
  .vmn-role-badge {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* Keyframe Animations */
  .vmn-spinner-icon {
    animation: vmn-spin 1s linear infinite;
  }
  @keyframes vmn-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes vmn-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 6px #DC2626;
    }
    50% {
      transform: scale(1.2);
      box-shadow: 0 0 14px #EF4444, 0 0 20px rgba(239, 68, 68, 0.4);
    }
  }

  /* Table Standards (closes DT-407) */
  .table-container {
    overflow-x: auto;
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-sm);
    background: var(--vmn-surface);
    scrollbar-color: var(--vmn-color-control-border) var(--vmn-surface-alt);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    text-align: left;
  }
  th {
    background: var(--vmn-surface-alt);
    color: var(--vmn-color-text-main);
    font-weight: 700;
    padding: 12px;
    border-bottom: 2px solid var(--vmn-color-border);
  }
  td {
    padding: 12px;
    border-bottom: 1px solid var(--vmn-color-border);
    color: var(--vmn-color-text-main);
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: var(--vmn-surface-accent);
  }

  /* -------------------------------------------------------------------------- */
  /* 5. Linear Channel Now & Next Widget (closes DS-04)                        */
  /* -------------------------------------------------------------------------- */
  .vmn-on-air-widget {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: var(--vmn-space-5);
    box-shadow: var(--vmn-shadow-1);
    margin: var(--vmn-space-4) 0;
  }
  .vmn-widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: var(--vmn-space-3);
    margin-bottom: var(--vmn-space-4);
  }
  .vmn-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--vmn-color-live-bg);
    color: var(--vmn-color-live-text);
    border: 1px solid var(--vmn-color-live-border);
    font-size: 0.75rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: var(--vmn-radius-full);
  }
  .vmn-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #DC2626;
    box-shadow: 0 0 6px #DC2626;
    display: inline-block;
    animation: vmn-pulse 2s infinite ease-in-out;
  }
  .vmn-channel-tag, .vmn-channel-badge {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--vmn-color-text-muted);
  }
  .vmn-now-playing {
    margin-bottom: var(--vmn-space-4);
  }
  .vmn-program-title, .vmn-show-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0 0 4px 0;
    color: var(--vmn-color-text-main);
  }
  .vmn-program-meta {
    display: flex;
    gap: 12px;
    font-size: 0.85rem;
    color: var(--vmn-color-text-muted);
    margin-bottom: var(--vmn-space-2);
  }
  .vmn-timecode, .vmn-time-range {
    font-family: var(--vmn-font-mono);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--vmn-color-text-muted);
  }
  .vmn-rating, .vmn-age-rating {
    background: var(--vmn-surface-alt);
    padding: 0 4px;
    border: 1px solid var(--vmn-color-border);
    border-radius: 2px;
    font-weight: 700;
    font-size: 0.75rem;
  }
  .vmn-synopsis, .vmn-show-synopsis, .vmn-next-synopsis {
    font-size: 0.875rem;
    color: var(--vmn-color-text-muted);
    margin: 4px 0;
  }
  .vmn-up-next {
    border-top: 1px solid var(--vmn-color-border);
    padding-top: var(--vmn-space-3);
    margin-top: var(--vmn-space-3);
  }
  .vmn-next-label, .vmn-up-next-label {
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--vmn-color-text-muted);
    display: block;
    margin-bottom: 2px;
  }
  .vmn-next-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--vmn-color-text-main);
    margin: 0;
  }

  /* -------------------------------------------------------------------------- */
  /* 6. Responsive Breakpoints & Reflow (closes DS-06, DT-108, DT-701)         */
  /* -------------------------------------------------------------------------- */
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 24px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 24px;
  }

  @media (min-width: 640px) {
    .grid-3 {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    }
  }
  @media (min-width: 768px) {
    .grid-2 {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    }
  }
  @media (min-width: 1024px) {
    .lg\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .lg\\:col-span-2 {
      grid-column: span 2 / span 2;
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 840px) {
    header.vmn-navbar {
      padding: 12px 16px;
    }
    nav.vmn-nav-links {
      width: 100%;
      justify-content: flex-start;
      gap: 6px;
    }
    nav.vmn-nav-links a {
      padding: 8px 12px;
      font-size: 0.85rem;
    }
    main.vmn-container {
      padding: 20px 16px;
    }
  }

  @media (max-width: 480px) {
    .vmn-brand-title {
      display: none;
    }
    nav.vmn-nav-links a {
      padding: 6px 10px;
      font-size: 0.8rem;
      flex: 1 1 calc(50% - 6px);
      text-align: center;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 7. Reduced Motion                                                         */
  /* -------------------------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .vmn-pulse-dot {
      animation: none !important;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 8. Brand Typography & Self-Hosted Fallbacks (closes DT-105)               */
  /* -------------------------------------------------------------------------- */
  @font-face {
    font-family: 'VMN Sans';
    font-style: normal;
    font-weight: 400 800;
    font-display: swap;
    src: local('Inter'), local('Segoe UI'), local('Helvetica Neue'), local('Arial');
  }

  @font-face {
    font-family: 'VMN Display';
    font-style: normal;
    font-weight: 700 900;
    font-display: swap;
    src: local('Cabinet Grotesk'), local('Inter Display'), local('Segoe UI'), local('Arial');
  }

  @font-face {
    font-family: 'VMN Mono';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: local('JetBrains Mono'), local('SFMono-Regular'), local('Menlo'), local('Consolas');
  }

  /* -------------------------------------------------------------------------- */
  /* 9. Operator Console & Duty Stations Shell (closes DT-401, DT-405, DT-406) */
  /* -------------------------------------------------------------------------- */
  .operator-shell {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 120px);
    background: var(--vmn-surface-alt);
  }

  .operator-context-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 10px 16px;
    background: var(--vmn-surface-dark);
    color: #F8FAFC;
    border-radius: var(--vmn-radius-md);
    margin-bottom: var(--vmn-space-4);
    box-shadow: var(--vmn-shadow-2);
  }

  .operator-context-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .operator-context-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94A3B8;
  }

  .operator-context-select {
    background: #1E293B;
    color: #F8FAFC;
    border: 1px solid var(--vmn-color-control-border);
    border-radius: var(--vmn-radius-sm);
    padding: 8px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    min-height: 44px;
    cursor: pointer;
  }
  .operator-context-select:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }

  .operator-layout-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  @media (min-width: 1024px) {
    .operator-layout-body {
      display: grid;
      grid-template-columns: 260px 1fr;
      align-items: start;
      gap: 24px;
    }
  }

  .operator-rail {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: 12px;
    box-shadow: var(--vmn-shadow-1);
  }

  .operator-rail-header {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--vmn-color-text-muted);
    padding: 8px 12px 12px;
    border-bottom: 1px solid var(--vmn-color-border);
    margin-bottom: 8px;
  }

  .operator-rail-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: var(--vmn-radius-sm);
    color: var(--vmn-color-text-main);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    min-height: 44px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .operator-rail-item:hover {
    background: var(--vmn-surface-alt);
    color: var(--vmn-color-primary);
  }
  .operator-rail-item:focus-visible {
    background: var(--vmn-surface-alt);
    color: var(--vmn-color-primary);
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }

  .operator-rail-item.active {
    background: var(--vmn-color-info-bg);
    color: var(--vmn-color-info-text);
    font-weight: 700;
    border-left: 4px solid var(--vmn-color-primary);
  }

  /* Dark Room Console Theme */
  .vmn-dark-room {
    background-color: #0B1120;
    color: #F1F5F9;
  }
  .vmn-dark-room .card,
  .vmn-dark-room .operator-rail,
  .vmn-dark-room .table-container {
    background: #111827;
    border-color: #374151;
    color: #F1F5F9;
  }
  .vmn-dark-room th {
    background: #1F2937;
    color: #F9FAFB;
    border-color: #374151;
  }
  .vmn-dark-room td {
    color: #E5E7EB;
    border-color: #374151;
  }
  .vmn-dark-room tr:hover td {
    background: #1F2937;
  }

  /* 24/7 Schedule Grid Timeline (DT-405) */
  .timeline-container {
    overflow-x: auto;
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: 16px;
    box-shadow: var(--vmn-shadow-1);
  }
  .timeline-dayparts-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--vmn-color-border);
  }
  .timeline-daypart-slot {
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid var(--vmn-color-border);
    text-align: center;
  }
  .timeline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .timeline-slot-card {
    border: 1px solid var(--vmn-color-border);
    border-radius: 6px;
    padding: 12px;
    background: var(--vmn-surface-alt);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 110px;
    position: relative;
  }
  .timeline-slot-card.locked {
    border-left: 4px solid var(--vmn-color-primary);
  }
  .timeline-slot-card.rights-blocked {
    border-left: 4px solid var(--vmn-color-live-text);
    background: var(--vmn-color-live-bg);
  }

  /* As-Run Reconciliation Diff (DT-406) */
  .asrun-diff-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .asrun-diff-matched {
    background: var(--vmn-color-success-bg);
    color: var(--vmn-color-success-text);
    border: 1px solid var(--vmn-color-success-border);
  }
  .asrun-diff-discrepancy {
    background: var(--vmn-color-warning-bg);
    color: var(--vmn-color-warning-text);
    border: 1px solid var(--vmn-color-warning-border);
  }
  .asrun-diff-missed {
    background: var(--vmn-color-live-bg);
    color: var(--vmn-color-live-text);
    border: 1px solid var(--vmn-color-live-border);
  }

  /* EPG / XMLTV Inspector (DT-905) */
  .xmltv-diff-view {
    font-family: var(--vmn-font-mono);
    font-size: 0.85rem;
    background: #0F172A;
    color: #F8FAFC;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .xmltv-diff-add {
    background: rgba(34, 197, 94, 0.2);
    color: #4ADE80;
    display: block;
    padding: 2px 6px;
  }
  .xmltv-diff-rem {
    background: rgba(239, 68, 68, 0.2);
    color: #F87171;
    display: block;
    padding: 2px 6px;
  }
  .xmltv-diff-same {
    color: #94A3B8;
    display: block;
    padding: 2px 6px;
  }

  /* -------------------------------------------------------------------------- */
  /* 9. Presentation Shells (Docx §2, §5, §6)                                   */
  /* -------------------------------------------------------------------------- */
  
  /* 9.1 Public Shell (S-PUBLIC) */
  .vmn-shell-public .vmn-public-hero {
    background: linear-gradient(135deg, var(--vmn-color-secondary) 0%, #0E2B20 100%);
    color: #FFFFFF;
    padding: 48px 24px;
    border-radius: var(--vmn-radius-panel);
    margin-bottom: 32px;
    box-shadow: var(--vmn-shadow-2);
  }
  .vmn-shell-public .vmn-public-hero h1 {
    font-size: var(--vmn-font-size-hero);
    line-height: 1.15;
    margin: 0 0 16px 0;
    font-weight: 800;
    color: #FFFFFF;
  }
  .vmn-shell-public .vmn-channels-strip {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin: 20px 0;
  }
  .vmn-shell-public .vmn-channel-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: 10px 16px;
    text-decoration: none;
    color: var(--vmn-color-text-main);
    font-weight: 700;
    min-height: 44px;
    transition: transform 0.15s ease, border-color 0.15s ease;
  }
  .vmn-shell-public .vmn-channel-pill:hover {
    border-color: var(--vmn-color-primary);
    transform: translateY(-2px);
  }
  .vmn-shell-public  .vmn-azeebo-gateway-banner {
    background: var(--vmn-surface-accent);
    border: 1px solid var(--vmn-color-success-border);
    border-radius: var(--vmn-radius-panel);
    padding: 24px;
    margin: 32px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  /* 9.2 Work Shell (S-WORK / S-HUB) */
  .vmn-shell-work-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 80vh;
  }
  @media (min-width: 760px) {
    .vmn-shell-work-layout {
      display: grid;
      grid-template-columns: var(--vmn-sidebar-width) 1fr;
      align-items: start;
      gap: 24px;
    }
  }
  .vmn-work-rail {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-panel);
    padding: 12px 8px;
    box-shadow: var(--vmn-shadow-1);
    position: sticky;
    top: 80px;
  }
  .vmn-work-rail-title {
    font-size: var(--vmn-font-size-metadata);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--vmn-color-text-muted);
    padding: 8px 12px;
    border-bottom: 1px solid var(--vmn-color-border);
    margin-bottom: 8px;
  }
  .vmn-work-rail-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--vmn-radius-md);
    color: var(--vmn-color-text-main);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    min-height: 44px;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .vmn-work-rail-link:hover, .vmn-work-rail-link:focus-visible {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-primary);
  }
  .vmn-work-rail-link.active {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-primary);
    font-weight: 700;
    border-left: 4px solid var(--vmn-color-primary);
  }
  .vmn-work-rail-brand-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #38BDF8;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--vmn-radius-sm);
    margin-bottom: 12px;
  }
  .vmn-work-rail-operator {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-md);
    padding: 12px;
    font-size: 0.8rem;
    color: var(--vmn-color-text-muted);
  }
  .vmn-operator-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--vmn-color-text-main);
    margin-bottom: 6px;
    font-size: 0.85rem;
  }
  .vmn-operator-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22C55E;
    box-shadow: 0 0 8px #22C55E;
    display: inline-block;
  }
  .vmn-operator-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .vmn-gate-locked {
    font-size: 0.72rem;
    color: #34D399;
    font-weight: 600;
    margin-top: 4px;
    letter-spacing: 0.02em;
  }

  /* Blocker Tray (Docx §8.5 - Priority 1 on Workbench) */
  .vmn-blocker-tray {
    background: var(--vmn-color-warning-bg);
    border: 1px solid var(--vmn-color-warning-border);
    border-left: 5px solid var(--vmn-color-warning-text);
    border-radius: var(--vmn-radius-md);
    padding: 16px 20px;
    margin-bottom: 24px;
  }
  .vmn-blocker-tray-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    color: var(--vmn-color-warning-text);
    font-size: 1rem;
    margin-bottom: 8px;
  }
  .vmn-blocker-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed var(--vmn-color-warning-border);
    font-size: 0.9rem;
    color: var(--vmn-color-text-main);
  }
  .vmn-blocker-item:last-child {
    border-bottom: none;
  }

  /* 1.6:1 Two-Column Ratio Layout (Docx §3.4, §8) */
  .vmn-split-16-1 {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  @media (min-width: 760px) {
    .vmn-split-16-1 {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      align-items: start;
    }
  }

  /* 9.3 Portal Shell (S-PORTAL) */
  .vmn-portal-banner {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-top: 4px solid var(--vmn-color-primary);
    border-radius: var(--vmn-radius-panel);
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: var(--vmn-shadow-1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .vmn-portal-counterparty {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--vmn-color-secondary);
  }
  .vmn-report-draft-badge {
    background: var(--vmn-color-warning-bg);
    color: var(--vmn-color-warning-text);
    border: 1px solid var(--vmn-color-warning-border);
    padding: 4px 10px;
    border-radius: var(--vmn-radius-sm);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .vmn-report-released-badge {
    background: var(--vmn-color-success-bg);
    color: var(--vmn-color-success-text);
    border: 1px solid var(--vmn-color-success-border);
    padding: 4px 10px;
    border-radius: var(--vmn-radius-sm);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .vmn-watermark-draft {
    position: relative;
    border: 2px dashed var(--vmn-color-neutral-border);
    background: var(--vmn-color-warning-bg);
    border-radius: var(--vmn-radius-panel);
    padding: 24px;
  }

  /* Terms Economics Precedence Panel (Docx §8.8 / §14.1) */
  .vmn-terms-decision-panel {
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-panel);
    padding: 24px;
    box-shadow: var(--vmn-shadow-1);
    margin-top: 24px;
  }
  .vmn-economics-breakdown {
    background: var(--vmn-surface-accent);
    border: 1px solid var(--vmn-color-success-border);
    border-radius: var(--vmn-radius-md);
    padding: 16px 20px;
    margin-bottom: 20px;
  }
  .vmn-economics-breakdown,
  .vmn-azeebo-gateway-banner { color: var(--vmn-color-text-main); }

  /* -------------------------------------------------------------------------- */
  /* 10. Prototype Showcase & Scenario Switcher Controls (Docx §1, §14)         */
  /* -------------------------------------------------------------------------- */
  .vmn-prototype-toolbar {
    background: var(--vmn-color-secondary);
    color: #FFFFFF;
    border-radius: var(--vmn-radius-panel);
    padding: 14px 20px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    box-shadow: var(--vmn-shadow-2);
  }
  .vmn-scenario-group, .vmn-viewport-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vmn-scenario-label {
    font-size: var(--vmn-font-size-metadata);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94A3B8;
  }
  .vmn-scenario-btn, .vmn-device-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--vmn-radius-md);
    padding: 6px 14px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s ease, border-color 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .vmn-scenario-btn:hover, .vmn-device-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .vmn-scenario-btn.active, .vmn-device-btn.active {
    background: var(--vmn-color-primary);
    border-color: #86EFAC;
    color: #FFFFFF;
    font-weight: 700;
  }

  /* Viewport Preview Wrapper */
  .vmn-preview-stage {
    margin: 0 auto;
    transition: max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .vmn-stage-desktop { max-width: 100%; }
  .vmn-stage-tablet { max-width: 768px; }
  .vmn-stage-mobile { max-width: 390px; }
  .vmn-stage-compact { max-width: 320px; }

  /* -------------------------------------------------------------------------- */
  /* 11. Modern UI/UX Interactive Upgrades                                      */
  /* -------------------------------------------------------------------------- */

  /* 11.1 Live Playout Status Ticker & Health Bar */
  .vmn-playout-ticker {
    background: #0E1726;
    color: #F8FAFC;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 6px 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .vmn-ticker-channels {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .vmn-ticker-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .vmn-ticker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22C55E;
    box-shadow: 0 0 6px #22C55E;
    display: inline-block;
  }
  .vmn-ticker-tech {
    font-family: var(--vmn-font-mono);
    font-size: 0.75rem;
    color: #94A3B8;
  }

  /* 11.2 Header Controls (Command Button, Persona Switcher, Theme Toggle) */
  .vmn-header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .vmn-cmd-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #E2E8F0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--vmn-radius-md);
    padding: 8px 14px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .vmn-cmd-trigger-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #FFFFFF;
  }
  .vmn-cmd-trigger-btn:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  .vmn-kbd-shortcut {
    font-size: 0.7rem;
    font-family: var(--vmn-font-mono);
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 4px;
    padding: 2px 6px;
    color: #F8FAFC;
  }
  .vmn-theme-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--vmn-radius-md);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .vmn-theme-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(15deg);
  }
  .vmn-theme-toggle-btn:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  .vmn-theme-sun { display: none; }
  .vmn-theme-moon { display: inline-flex; }
  :root[data-theme="dark"] .vmn-theme-sun { display: inline-flex; }
  :root[data-theme="dark"] .vmn-theme-moon { display: none; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .vmn-theme-sun { display: inline-flex; }
    :root:not([data-theme="light"]) .vmn-theme-moon { display: none; }
  }
  .vmn-persona-select {
    background: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: var(--vmn-radius-md);
    padding: 8px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    min-height: 44px;
    min-width: 44px;
    cursor: pointer;
    outline: none;
  }
  .vmn-persona-select:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  .vmn-persona-select option {
    background: #0F172A;
    color: #FFFFFF;
  }

  /* 11.3 Mobile Hamburger & Drawer Navigation */
  .vmn-hamburger-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--vmn-radius-md);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #FFFFFF;
    cursor: pointer;
  }
  .vmn-hamburger-btn:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  @media (max-width: 1200px) {
    nav.vmn-nav-links { display: none; }
    .vmn-hamburger-btn { display: inline-flex; }
  }

  .vmn-drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9998;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  }
  .vmn-drawer-backdrop.open {
    opacity: 1;
    visibility: visible;
  }
  .vmn-mobile-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    max-width: 85vw;
    height: 100vh;
    background: var(--vmn-surface);
    color: var(--vmn-color-text-main);
    z-index: 9999;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .vmn-mobile-drawer.open {
    transform: translateX(0);
  }
  .vmn-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid var(--vmn-color-border);
  }
  .vmn-drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .vmn-drawer-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: var(--vmn-radius-md);
    text-decoration: none;
    color: var(--vmn-color-text-main);
    font-size: 1rem;
    font-weight: 600;
    min-height: 48px;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .vmn-drawer-link:hover, .vmn-drawer-link.active {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-primary);
  }

  /* 11.4 Universal Command Palette (Cmd+K) Modal */
  .vmn-cmd-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(5px);
    z-index: 10000;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    animation: vmnFadeIn 0.15s ease-out;
  }
  .vmn-cmd-backdrop.open {
    display: flex;
  }
  .vmn-cmd-dialog {
    background: var(--vmn-surface);
    color: var(--vmn-color-text-main);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-panel);
    width: 640px;
    max-width: 92vw;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }
  .vmn-cmd-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--vmn-color-border);
  }
  .vmn-cmd-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--vmn-color-text-main);
    font-size: 1.1rem;
    outline: none;
    font-family: inherit;
  }
  .vmn-cmd-list {
    max-height: 380px;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .vmn-cmd-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--vmn-radius-md);
    text-decoration: none;
    color: var(--vmn-color-text-main);
    font-size: 0.9rem;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.1s ease;
  }
  .vmn-cmd-item:hover, .vmn-cmd-item.selected {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-primary);
  }
  .vmn-cmd-category {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--vmn-color-text-muted);
    padding: 8px 14px 4px;
  }
  .vmn-cmd-footer {
    padding: 10px 18px;
    border-top: 1px solid var(--vmn-color-border);
    background: var(--vmn-surface-alt);
    font-size: 0.75rem;
    color: var(--vmn-color-text-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* 11.5 Sticky Mobile Action Bar */
  .vmn-mobile-action-bar {
    display: none;
  }
  @media (max-width: 760px) {
    .vmn-mobile-action-bar {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--vmn-surface);
      border-top: 1px solid var(--vmn-color-border);
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
      z-index: 100;
      justify-content: space-between;
      gap: 10px;
    }
  }

  @keyframes vmnFadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  /* -------------------------------------------------------------------------- */
  /* 12. Refined Design-System Defaults (fluid type, surfaces, interaction)     */
  /* -------------------------------------------------------------------------- */
  :root {
    color-scheme: light;
    --vmn-font-display: "VMN Display", var(--vmn-font-sans);
    --vmn-content-max: 1440px;
    --vmn-content-measure: 72ch;
    --vmn-elevation-panel: 0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -16px rgb(15 23 42 / 0.18);
    --vmn-elevation-panel-hover: 0 2px 4px rgb(15 23 42 / 0.06), 0 14px 30px -18px rgb(15 23 42 / 0.28);
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --vmn-elevation-panel: 0 1px 2px rgb(0 0 0 / 0.18), 0 8px 24px -16px rgb(0 0 0 / 0.55);
    --vmn-elevation-panel-hover: 0 2px 4px rgb(0 0 0 / 0.24), 0 14px 30px -18px rgb(0 0 0 / 0.7);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --vmn-elevation-panel: 0 1px 2px rgb(0 0 0 / 0.18), 0 8px 24px -16px rgb(0 0 0 / 0.55);
      --vmn-elevation-panel-hover: 0 2px 4px rgb(0 0 0 / 0.24), 0 14px 30px -18px rgb(0 0 0 / 0.7);
    }
  }

  body {
    font-size: var(--vmn-font-size-body);
    line-height: 1.55;
    text-rendering: optimizeLegibility;
  }
  h1, h2, h3, h4 {
    font-family: var(--vmn-font-display);
    line-height: 1.25;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }
  p { text-wrap: pretty; }
  main.vmn-container {
    max-width: var(--vmn-content-max);
    padding: clamp(20px, 3vw, 40px) clamp(16px, 3vw, 32px);
  }
  .vmn-shell-work-layout > *,
  .vmn-work-main,
  .vmn-shell-public,
  .vmn-shell-portal { min-width: 0; }
  .grid-2 > *, .grid-3 > * { min-width: 0; }

  .card, .vmn-card {
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
    transition: border-color var(--vmn-duration-fast) var(--vmn-ease-standard),
      box-shadow var(--vmn-duration-fast) var(--vmn-ease-standard),
      transform var(--vmn-duration-fast) var(--vmn-ease-standard);
  }
  .card:hover, .vmn-card:hover {
    box-shadow: var(--vmn-elevation-panel-hover);
  }
  .vmn-foundation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: var(--vmn-space-4);
  }
  .vmn-foundation-card {
    min-width: 0;
    padding: var(--vmn-space-5);
    background: var(--vmn-surface);
    border: 1px solid var(--vmn-color-border);
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
  }
  .vmn-foundation-card-label {
    display: block;
    margin-bottom: var(--vmn-space-2);
    color: var(--vmn-color-text-muted);
    font-size: var(--vmn-font-size-metadata);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .vmn-foundation-card-value {
    margin: 0;
    color: var(--vmn-color-text-main);
    font-size: var(--vmn-font-size-xl);
    font-weight: 700;
  }
  .vmn-foundation-card-note {
    margin: var(--vmn-space-2) 0 0;
    color: var(--vmn-color-text-muted);
    font-size: var(--vmn-font-size-sm);
  }
  .vmn-shell-public section > h1,
  .vmn-shell-public section > h2,
  .vmn-work-main > section > h1,
  .vmn-work-main > section > h2 {
    font-size: var(--vmn-font-size-page-title);
  }
  .vmn-shell-public section > p,
  .vmn-work-main > section > p {
    max-width: var(--vmn-content-measure);
  }
  .stat-box {
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
    transition: border-color var(--vmn-duration-fast) var(--vmn-ease-standard),
      box-shadow var(--vmn-duration-fast) var(--vmn-ease-standard);
  }
  .stat-val {
    font-size: clamp(1.4rem, 1.1rem + 1.1vw, 1.8rem);
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .table-container {
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
  }
  table caption {
    padding: var(--vmn-space-4);
    color: var(--vmn-color-text-muted);
    font-weight: 600;
    text-align: left;
  }
  th { white-space: nowrap; }
  :where(a, button) { text-underline-offset: 0.18em; }
  :where(a, button):active { -webkit-tap-highlight-color: transparent; }
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 3px solid var(--vmn-color-focus);
    outline-offset: 3px;
  }
  :where(button, input, select, textarea) { font: inherit; }
  ::selection {
    color: var(--vmn-color-text-main);
    background: var(--vmn-surface-accent);
  }
  @media (max-width: 760px) {
    /* The sticky action bar is built by the client bundle, so the space it
       covers is reserved only when that bundle has run. Without scripting the
       page keeps its normal bottom padding instead of ending in dead space. */
    html[data-mobile-chrome] main.vmn-container {
      padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    }
    html[data-mobile-chrome] footer.vmn-footer {
      padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    }
    .vmn-mobile-action-bar {
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      background: color-mix(in srgb, var(--vmn-surface) 92%, transparent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card, .vmn-card, .stat-box,
    .vmn-mobile-drawer, .vmn-drawer-backdrop,
    .vmn-cmd-backdrop, .vmn-preview-stage { transition: none; animation: none; }
  }

  /* 12.1 Shared shell polish */
  header.vmn-navbar {
    gap: clamp(8px, 1.2vw, 18px);
    padding-inline: clamp(16px, 2.4vw, 36px);
  }
  nav.vmn-nav-links {
    justify-content: center;
    gap: 4px;
  }
  nav.vmn-nav-links a {
    padding-inline: clamp(8px, 0.85vw, 14px);
    border-radius: var(--vmn-radius-md);
    white-space: nowrap;
  }
  .vmn-brand-logo {
    position: relative;
    letter-spacing: 0.08em;
  }
  .vmn-brand-logo::after {
    content: "";
    display: block;
    width: 20px;
    height: 3px;
    margin-top: 2px;
    border-radius: var(--vmn-radius-full);
    background: var(--vmn-color-accent);
  }
  .vmn-playout-ticker {
    padding: 8px clamp(16px, 2.4vw, 36px);
    border-bottom-color: rgb(255 255 255 / 0.16);
  }
  .vmn-ticker-pill { min-height: 32px; }
  .vmn-ticker-dot {
    flex: 0 0 8px;
    box-shadow: 0 0 0 3px rgb(34 197 94 / 0.16);
  }
  .vmn-cmd-backdrop {
    padding: max(10vh, 32px) 16px 24px;
    overflow-y: auto;
  }
  .vmn-cmd-dialog {
    width: min(680px, 100%);
    border-radius: 16px;
  }
  .vmn-cmd-item { gap: 16px; }
  .vmn-cmd-item > span:last-child {
    flex: 0 1 auto;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .vmn-public-hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background-image:
      radial-gradient(ellipse at 88% 8%, rgb(165 232 205 / 0.18), transparent 27rem),
      linear-gradient(135deg, var(--vmn-color-secondary) 0%, #0E2B20 100%);
    padding: clamp(32px, 5.5vw, 76px) clamp(24px, 5vw, 64px);
    box-shadow: var(--vmn-elevation-panel-hover);
  }
  .vmn-shell-public .vmn-public-hero > p {
    max-width: 68ch;
    font-size: clamp(1rem, 0.92rem + 0.5vw, 1.2rem);
  }
  .vmn-shell-public .vmn-public-hero h1 {
    max-width: 18ch;
    font-size: clamp(2.25rem, 1.55rem + 3vw, 3.75rem);
    text-wrap: balance;
  }
  .vmn-work-rail {
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
  }
  .vmn-work-rail-link,
  .operator-rail-item,
  .operator-context-select { min-height: 48px; }
  .vmn-work-rail-link.active {
    box-shadow: inset 3px 0 var(--vmn-color-primary);
    border-left: 0;
  }
  .operator-rail-item.active {
    border-left: 0;
    box-shadow: inset 3px 0 var(--vmn-color-primary);
  }
  .vmn-portal-counterparty { color: var(--vmn-color-text-main); }
  .vmn-portal-banner > :first-child { min-width: min(100%, 16rem); }
  .vmn-portal-banner > :last-child { flex-wrap: wrap; }
  .vmn-shell-identity {
    width: min(100%, 56rem);
    margin-inline: auto;
  }
  .vmn-shell-identity :is(.card, .vmn-card) {
    box-shadow: var(--vmn-elevation-panel-hover);
  }
  .operator-context-bar,
  .vmn-prototype-toolbar {
    border-radius: var(--vmn-radius-panel);
  }
  .timeline-container { border-radius: var(--vmn-radius-panel); }
  .timeline-slot-card { min-width: 0; border-radius: var(--vmn-radius-md); }
  .timeline-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }
  .vmn-portal-banner {
    border-radius: var(--vmn-radius-panel);
    box-shadow: var(--vmn-elevation-panel);
  }
  :is(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 3px solid var(--vmn-color-focus);
    outline-offset: 3px;
  }
  @media (max-width: 760px) {
    header.vmn-navbar { gap: 8px; }
    .vmn-header-controls { gap: 6px; }
    .vmn-persona-select { display: none; }
    .vmn-cmd-trigger-btn { width: 44px; padding-inline: 0; justify-content: center; }
    .vmn-cmd-trigger-btn > span, .vmn-cmd-trigger-btn > kbd { display: none; }
    .vmn-playout-ticker { align-items: flex-start; }
    .vmn-ticker-channels { gap: 4px 16px; }
    .vmn-ticker-tech { font-size: 0.6875rem; }
    .vmn-mobile-action-bar {
      gap: 8px;
      padding-inline: max(12px, env(safe-area-inset-left, 0px));
    }
    .vmn-mobile-action-bar .btn {
      padding-inline: 8px;
      font-size: 0.75rem;
    }
    .vmn-cmd-footer { gap: 8px; flex-wrap: wrap; }
    .vmn-public-hero { border-radius: var(--vmn-radius-panel); }
    .vmn-shell-public section > h1,
    .vmn-work-main > section > h1 { font-size: var(--vmn-font-size-page-title-compact); }
    .card, .vmn-card { padding: var(--vmn-panel-padding-compact); }
    .table-container { margin-inline: calc(-1 * var(--vmn-space-2)); }
    .vmn-portal-banner { align-items: flex-start; padding: 16px; }
    .operator-context-bar { align-items: flex-start; }
    .operator-context-group { width: 100%; }
    .vmn-scenario-btn, .vmn-device-btn { padding-inline: 10px; }
  }
  @media (max-width: 480px) {
    .vmn-playout-ticker > div:last-child {
      width: 100%;
      justify-content: space-between;
    }
    .vmn-cmd-backdrop { padding-top: 24px; }
    .vmn-cmd-header { gap: 8px; padding: 12px; }
    .vmn-cmd-footer { font-size: 0.6875rem; }
  }

  /* 13. Workflow controls & data-surface finishing */
  :where(input, select, textarea) { accent-color: var(--vmn-color-primary); }
  .vmn-form-field {
    display: flex;
    flex-direction: column;
    gap: var(--vmn-space-2);
  }
  .vmn-form-field .vmn-label { margin-bottom: 0; }
  .vmn-input {
    min-width: 0;
    border-radius: var(--vmn-radius-md);
    background: var(--vmn-surface-raised);
    transition: border-color var(--vmn-duration-fast) var(--vmn-ease-standard),
      box-shadow var(--vmn-duration-fast) var(--vmn-ease-standard),
      background-color var(--vmn-duration-fast) var(--vmn-ease-standard);
  }
  .vmn-input:hover:not(:disabled):not([aria-invalid="true"]) {
    border-color: var(--vmn-color-text-muted);
  }
  .vmn-input::placeholder { color: var(--vmn-color-text-subtle); opacity: 1; }
  .vmn-input:disabled {
    background: var(--vmn-surface-sunken);
    color: var(--vmn-color-text-muted);
    cursor: not-allowed;
  }
  .vmn-input[aria-invalid="true"] {
    border-color: var(--vmn-color-live-text);
    box-shadow: inset 3px 0 var(--vmn-color-live-text);
  }
  .vmn-input-error-msg {
    padding: var(--vmn-space-2) var(--vmn-space-3);
    border-radius: var(--vmn-radius-md);
    background: var(--vmn-color-live-bg);
    color: var(--vmn-color-live-text);
    line-height: 1.45;
  }
  .vmn-required { color: var(--vmn-color-live-text); }
  .badge, .vmn-badge, .status-chip {
    max-width: 100%;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .status-chip { white-space: normal; }
  .provenance-notice {
    align-items: flex-start;
    padding: var(--vmn-space-3) var(--vmn-space-4);
    border-radius: var(--vmn-radius-md);
    line-height: 1.5;
  }
  .provenance-notice > svg { flex: 0 0 auto; margin-top: 2px; }
  .provenance-notice > div { min-width: 0; }
  .table-container { overscroll-behavior-x: contain; }
  .table-container table { margin: 0; }
  th, td { vertical-align: middle; }
  .table-container tbody tr:focus-within td {
    background: var(--vmn-surface-accent);
  }
  .table-container:focus-within {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: 2px;
  }
  .vmn-mobile-drawer {
    height: 100vh;
    height: 100dvh;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .vmn-drawer-body, .vmn-cmd-list {
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
  .vmn-cmd-dialog {
    display: flex;
    flex-direction: column;
    max-height: min(80vh, 720px);
    max-height: min(80dvh, 720px);
  }
  .vmn-cmd-list { min-height: 0; flex: 1 1 auto; }
  @media (max-width: 760px) {
    .vmn-cmd-dialog { max-height: calc(100dvh - 48px); }
    .vmn-input { font-size: 16px; }
    .provenance-notice { align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .vmn-input { transition: none; }
  }

  /* 14. VMNL unified visual language — editorial public + precision operations */
  :root {
    --vmn-elevation-raised: 0 10px 28px -22px rgb(23 36 52 / 0.34),
      0 2px 6px rgb(23 36 52 / 0.04);
    --vmn-elevation-floating: 0 24px 64px -28px rgb(8 22 17 / 0.48),
      0 8px 24px -16px rgb(8 22 17 / 0.24);
    --vmn-surface-tint: color-mix(in srgb, var(--vmn-surface) 88%, var(--vmn-surface-accent));
  }
  :root[data-theme="dark"] {
    --vmn-elevation-raised: 0 10px 28px -18px rgb(0 0 0 / 0.65),
      0 2px 6px rgb(0 0 0 / 0.28);
    --vmn-elevation-floating: 0 24px 64px -24px rgb(0 0 0 / 0.8),
      0 8px 24px -16px rgb(0 0 0 / 0.5);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --vmn-elevation-raised: 0 10px 28px -18px rgb(0 0 0 / 0.65),
        0 2px 6px rgb(0 0 0 / 0.28);
      --vmn-elevation-floating: 0 24px 64px -24px rgb(0 0 0 / 0.8),
        0 8px 24px -16px rgb(0 0 0 / 0.5);
    }
  }

  html { scroll-padding-top: 7rem; }
  body {
    background-color: var(--vmn-color-canvas);
    background-image: radial-gradient(ellipse at 50% 0%, var(--vmn-surface-accent), transparent 42rem);
    background-repeat: no-repeat;
  }
  main.vmn-container {
    width: min(100%, var(--vmn-content-max));
    padding-block: clamp(24px, 4vw, 52px);
  }
  header.vmn-navbar {
    background: color-mix(in srgb, var(--vmn-color-primary) 88%, #0E2B20);
    border-bottom: 1px solid rgb(255 184 0 / 0.55);
    box-shadow: 0 8px 24px -18px rgb(8 22 17 / 0.8);
  }
  :root[data-theme="dark"] header.vmn-navbar {
    background: color-mix(in srgb, var(--vmn-surface-dark) 92%, #0E2B20);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) header.vmn-navbar {
      background: color-mix(in srgb, var(--vmn-surface-dark) 92%, #0E2B20);
    }
  }
  .vmn-brand-logo { color: var(--vmn-color-accent); }
  .vmn-brand-logo::after { width: 100%; height: 2px; }
  nav.vmn-nav-links a { color: #F1F5F9; }
  nav.vmn-nav-links a.active {
    color: #FFFFFF !important;
    background: rgb(255 255 255 / 0.1);
    box-shadow: inset 0 -2px var(--vmn-color-accent);
  }
  nav.vmn-nav-links a:hover {
    color: #FFFFFF;
    background: rgb(255 255 255 / 0.14);
  }
  .vmn-playout-ticker {
    background: color-mix(in srgb, var(--vmn-color-secondary) 94%, #0E2B20);
    border-bottom: 1px solid var(--vmn-color-border);
  }
  .vmn-mobile-action-bar {
    box-shadow: 0 -10px 28px -20px rgb(23 36 52 / 0.55);
  }

  h1, h2, h3, h4 { color: var(--vmn-color-text-main); }
  .vmn-public-hero h1, .vmn-public-hero h2,
  .vmn-prototype-toolbar h1, .vmn-prototype-toolbar h2,
  .operator-context-bar h1, .operator-context-bar h2 { color: #FFFFFF; }
  .vmn-public-hero {
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 18px;
    background-image:
      radial-gradient(ellipse at 90% 8%, rgb(255 184 0 / 0.12), transparent 24rem),
      radial-gradient(ellipse at 5% 100%, rgb(165 232 205 / 0.13), transparent 30rem),
      linear-gradient(135deg, #172434 0%, #174C3C 100%);
  }
  .vmn-public-hero .btn-outline {
    color: #FFFFFF;
    border-color: rgb(255 255 255 / 0.5);
  }
  .vmn-public-hero .btn-outline:hover {
    color: #FFFFFF;
    background: rgb(255 255 255 / 0.12);
    border-color: #FFFFFF;
  }

  .card, .vmn-card, .stat-box, .vmn-foundation-card,
  .table-container, .timeline-container, .vmn-on-air-widget {
    border-color: color-mix(in srgb, var(--vmn-color-border) 76%, transparent);
    box-shadow: var(--vmn-elevation-raised);
  }
  .card, .vmn-card { border-radius: 14px; }
  .card:hover, .vmn-card:hover { box-shadow: var(--vmn-elevation-raised); }
  a.card, button.card, .screen-card, [role="button"].card {
    transition: transform var(--vmn-duration-fast) var(--vmn-ease-out),
      box-shadow var(--vmn-duration-fast) var(--vmn-ease-standard),
      border-color var(--vmn-duration-fast) var(--vmn-ease-standard);
  }
  a.card:hover, button.card:hover, .screen-card:hover, [role="button"].card:hover {
    transform: translateY(-2px);
    border-color: var(--vmn-color-control-border);
    box-shadow: var(--vmn-elevation-floating);
  }
  .stat-box {
    background: linear-gradient(145deg, var(--vmn-surface), var(--vmn-surface-tint));
    border-radius: 14px;
  }
  .stat-lbl {
    letter-spacing: 0.055em;
    font-size: 0.72rem;
  }
  .stat-val { color: var(--vmn-color-text-main); }

  .vmn-work-rail {
    background: linear-gradient(165deg, #172434 0%, #174C3C 100%);
    border-color: rgb(255 255 255 / 0.12);
    box-shadow: var(--vmn-elevation-floating);
  }
  .vmn-work-rail-title { color: #CBD5E1; border-color: rgb(255 255 255 / 0.16); }
  .vmn-work-rail-link { color: #F1F5F9; }
  .vmn-work-rail-link:hover, .vmn-work-rail-link:focus-visible {
    color: #FFFFFF;
    background: rgb(255 255 255 / 0.1);
  }
  .vmn-work-rail-link.active {
    color: #FFFFFF;
    background: rgb(255 255 255 / 0.12);
    box-shadow: inset 3px 0 var(--vmn-color-accent);
  }
  .operator-rail {
    border-radius: 14px;
    box-shadow: var(--vmn-elevation-raised);
  }
  .operator-rail-header { letter-spacing: 0.07em; }
  .vmn-portal-banner {
    border-top-width: 3px;
    background: linear-gradient(120deg, var(--vmn-surface), var(--vmn-surface-tint));
  }
  .vmn-shell-identity :is(.card, .vmn-card) {
    border-radius: 18px;
    padding: clamp(24px, 5vw, 44px);
  }

  .btn, .vmn-btn, .button {
    border-radius: var(--vmn-radius-md);
    font-weight: 650;
    transition: transform var(--vmn-duration-instant) var(--vmn-ease-out),
      background-color var(--vmn-duration-fast) var(--vmn-ease-standard),
      color var(--vmn-duration-fast) var(--vmn-ease-standard),
      box-shadow var(--vmn-duration-fast) var(--vmn-ease-standard),
      border-color var(--vmn-duration-fast) var(--vmn-ease-standard);
  }
  .btn-primary:hover:not(:disabled), .vmn-btn-primary:hover:not(:disabled),
  .button--primary:hover:not(:disabled) {
    box-shadow: 0 6px 16px -8px var(--vmn-color-primary);
    transform: translateY(-1px);
  }
  .btn:active:not(:disabled), .vmn-btn:active:not(:disabled), .button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }
  .btn-outline {
    background: var(--vmn-surface);
    color: var(--vmn-color-text-main);
    border-color: var(--vmn-color-control-border);
  }
  .btn-outline:hover:not(:disabled) {
    background: var(--vmn-surface-accent);
    color: var(--vmn-color-text-main);
    border-color: var(--vmn-color-focus);
  }
  .vmn-input, .vmn-persona-select, .operator-context-select {
    border-radius: var(--vmn-radius-md);
  }
  .vmn-label { font-weight: 700; }
  .vmn-form-field { gap: var(--vmn-space-2); }

  .table-container {
    border-radius: 14px;
    overflow: auto;
  }
  table { font-variant-numeric: tabular-nums; }
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--vmn-surface-sunken);
    font-size: 0.75rem;
    letter-spacing: 0.055em;
    text-transform: uppercase;
  }
  tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--vmn-surface-alt) 42%, transparent); }
  tbody tr:hover td { background: var(--vmn-surface-accent); }
  .vmn-table-pagination, .vmn-table-pagination span {
    color: var(--vmn-color-text-muted);
  }

  .status-chip, .vmn-badge, .badge {
    border-radius: 6px;
    font-size: 0.72rem;
    letter-spacing: 0.045em;
    font-weight: 750;
  }
  .provenance-notice {
    box-shadow: inset 3px 0 var(--vmn-color-warning-text);
  }
  .vmn-error-state { box-shadow: inset 3px 0 var(--vmn-color-live-text); }
  .vmn-empty-state {
    border-style: solid;
    border-color: var(--vmn-color-border);
    border-radius: 14px;
    background: linear-gradient(145deg, var(--vmn-surface), var(--vmn-surface-tint));
  }

  .vmn-cmd-dialog {
    border-color: color-mix(in srgb, var(--vmn-color-border) 72%, transparent);
    border-radius: 18px;
    box-shadow: var(--vmn-elevation-floating);
  }
  .vmn-cmd-header { min-height: 64px; }
  .vmn-cmd-item.selected {
    color: var(--vmn-color-text-main);
    background: var(--vmn-surface-accent);
    box-shadow: inset 3px 0 var(--vmn-color-primary);
  }
  .vmn-mobile-drawer { box-shadow: var(--vmn-elevation-floating); }
  .vmn-drawer-link.active {
    color: var(--vmn-color-primary);
    background: var(--vmn-surface-accent);
    box-shadow: inset 3px 0 var(--vmn-color-primary);
  }
  footer.vmn-footer { border-top-color: rgb(255 255 255 / 0.14); }

  @media (max-width: 760px) {
    .vmn-public-hero { border-radius: 14px; }
    .vmn-work-rail { position: static; }
    .vmn-playout-ticker { gap: 8px; }
    .vmn-ticker-pill { flex-wrap: wrap; }
    .operator-layout-body { gap: 14px; }
    .operator-rail { padding: 8px; }
    .table-container { border-radius: 10px; }
  }
  @media (hover: none) {
    a.card:hover, button.card:hover, .screen-card:hover, [role="button"].card:hover {
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    a.card, button.card, .screen-card, [role="button"].card,
    .btn, .vmn-btn, .button { transition: none; }
    .vmn-pulse-dot, .vmn-vu-bar { animation: none; }
  }

  /* ==========================================================================
     Enterprise UI/UX Modernization & Standardization (R3.0)
     ========================================================================== */

  /* Live Network Status Beacon */
  .vmn-status-beacon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #4ade80;
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.28);
    border-radius: 9999px;
    padding: 3px 10px;
    letter-spacing: 0.04em;
    font-family: var(--vmn-font-mono);
  }
  .vmn-pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: vmn-pulse 2s infinite;
  }
  @keyframes vmn-pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }

  /* Segmented Control Tabs (Action-First Operational Cockpit) */
  .vmn-tabs-container {
    margin-bottom: 1.5rem;
  }
  .vmn-tabs-nav {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid #222222;
    padding-bottom: 0;
    margin-bottom: 1.25rem;
    overflow-x: auto;
  }
  .vmn-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #94a3b8;
    padding: 10px 16px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 6px 6px 0 0;
    min-height: 44px;
    white-space: nowrap;
  }
  .vmn-tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.04);
  }
  .vmn-tab-btn.active {
    color: #ffffff;
    border-bottom-color: var(--vmn-color-focus);
    background: rgba(56, 189, 248, 0.08);
  }
  .vmn-tab-btn:focus-visible {
    outline: 2px solid var(--vmn-color-focus);
    outline-offset: -2px;
  }
  .vmn-tab-pane {
    display: none;
  }
  .vmn-tab-pane.active {
    display: block;
    animation: vmn-fade-in 0.2s ease-out;
  }
  @keyframes vmn-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 4-Card KPI Metric Ribbon */
  .vmn-kpi-ribbon {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 1.5rem;
  }
  .vmn-kpi-card {
    background: #080808;
    border: 1px solid #1c1c1c;
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    transition: border-color 0.15s ease;
  }
  .vmn-kpi-card:hover {
    border-color: #333333;
  }
  .vmn-kpi-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .vmn-kpi-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #ffffff;
    font-family: var(--vmn-font-mono);
    line-height: 1.2;
    margin-bottom: 4px;
    font-variant-numeric: tabular-nums;
  }
  .vmn-kpi-meta {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vmn-kpi-trend-up {
    color: #22c55e;
    font-weight: 600;
  }
  .vmn-kpi-trend-neutral {
    color: #94a3b8;
  }
  .vmn-kpi-trend-warn {
    color: #f59e0b;
    font-weight: 600;
  }

  /* Audio VU Visualizer Bars */
  .vmn-vu-meter {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 18px;
    padding: 2px;
    background: #000000;
    border-radius: 3px;
  }
  .vmn-vu-bar {
    width: 3px;
    background: #22c55e;
    border-radius: 1px;
    animation: vmn-vu-bounce 1.2s infinite ease-in-out alternate;
  }
  .vmn-vu-bar:nth-child(2) { animation-delay: 0.2s; height: 60%; }
  .vmn-vu-bar:nth-child(3) { animation-delay: 0.4s; height: 85%; }
  .vmn-vu-bar:nth-child(4) { animation-delay: 0.1s; height: 40%; }
  .vmn-vu-bar:nth-child(5) { animation-delay: 0.5s; height: 75%; background: #eab308; }
  .vmn-vu-bar:nth-child(6) { animation-delay: 0.3s; height: 95%; background: #ef4444; }
  @keyframes vmn-vu-bounce {
    0% { height: 20%; }
    100% { height: 90%; }
  }

  /* Contextual Inspector Drawer (Slide-out pro panel) */
  .vmn-inspector-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 9000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .vmn-inspector-backdrop.active {
    opacity: 1;
    pointer-events: auto;
  }
  .vmn-inspector-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(480px, 92vw);
    background: #0a0c10;
    border-left: 1px solid #1f2737;
    z-index: 9001;
    transform: translateX(100%);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.8);
  }
  .vmn-inspector-drawer.active {
    transform: translateX(0);
  }
  .vmn-inspector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #182030;
    background: #06080c;
  }
  .vmn-inspector-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .vmn-inspector-close {
    background: transparent;
    border: 1px solid #263044;
    color: #94a3b8;
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }
  .vmn-inspector-close:hover {
    color: #ffffff;
    border-color: #3b82f6;
    background: #141c2c;
  }
  .vmn-inspector-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .vmn-inspector-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .vmn-inspector-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
  }
  .vmn-inspector-val {
    font-size: 0.95rem;
    color: #f1f5f9;
    word-break: break-word;
  }
  .vmn-inspector-val-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    color: #38bdf8;
    background: #040608;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    border: 1px solid #182030;
  }
  .vmn-inspector-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #182030;
    background: #06080c;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  /* Toast Notification Stack */
  .vmn-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
    width: calc(100vw - 48px);
    pointer-events: none;
  }
  .vmn-toast {
    pointer-events: auto;
    background: rgba(13, 16, 23, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid #232d40;
    border-radius: 8px;
    padding: 0.85rem 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
    color: #f8fafc;
    font-size: 0.9rem;
    animation: vmn-toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transition: opacity 0.2s, transform 0.2s;
  }
  .vmn-toast-success { border-left: 4px solid #10b981; }
  .vmn-toast-warning { border-left: 4px solid #f59e0b; }
  .vmn-toast-error { border-left: 4px solid #ef4444; }
  .vmn-toast-info { border-left: 4px solid #3b82f6; }
  @keyframes vmn-toast-in {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Interactive Table Rows */
  .vmn-interactive-row {
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .vmn-interactive-row:hover td {
    background-color: rgba(59, 130, 246, 0.08) !important;
  }
  .vmn-interactive-row:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  /* Cinematic Media Video Player Container */
  .vmn-media-player-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 480px;
    background: radial-gradient(circle at center, #0e1118 0%, #000000 100%);
    border: 1px solid #1a2230;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.9);
  }
  .vmn-player-hud-top {
    position: absolute;
    top: 1rem;
    left: 1.25rem;
    right: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }
  .vmn-player-hud-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0) 100%);
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }

  /* Compliance & Governance Slide-Down / Tab Panel */
  .vmn-compliance-panel {
    background: #060606;
    border: 1px solid #1a1a1a;
    border-radius: 8px;
    padding: 1.25rem;
    margin-top: 1rem;
  }
  .vmn-compliance-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #181818;
    padding-bottom: 0.5rem;
  }

  /* Multi-Step Application Wizard (SaaS Stepper Component) */
  .vmn-stepper-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    margin-bottom: 2rem;
    padding: 0 1rem;
  }
  .vmn-stepper-track {
    position: absolute;
    top: 20px;
    left: 2rem;
    right: 2rem;
    height: 2px;
    background: #1e293b;
    z-index: 1;
  }
  .vmn-stepper-progress {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }
  .vmn-step-item {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
  }
  .vmn-step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #090d16;
    border: 2px solid #1e293b;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
  }
  .vmn-step-item.active .vmn-step-circle {
    border-color: #3b82f6;
    color: #ffffff;
    background: #1d4ed8;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
  }
  .vmn-step-item.completed .vmn-step-circle {
    border-color: #10b981;
    color: #ffffff;
    background: #059669;
  }
  .vmn-step-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    text-align: center;
    white-space: nowrap;
  }
  .vmn-step-item.active .vmn-step-title {
    color: #f8fafc;
  }
  .vmn-step-pane {
    display: none;
    animation: vmn-fade-in 0.2s ease-in-out;
  }
  .vmn-step-pane.active {
    display: block;
  }
  @keyframes vmn-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Accessible FAQ & Content Accordions */
  .vmn-accordion {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .vmn-accordion-item {
    background: #080b11;
    border: 1px solid #1e293b;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .vmn-accordion-item:hover {
    border-color: #334155;
  }
  .vmn-accordion-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.4rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    font-size: 0.95rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    min-height: 48px;
  }
  .vmn-accordion-trigger:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
  .vmn-accordion-chevron {
    color: #94a3b8;
    transition: transform 0.25s ease;
  }
  .vmn-accordion-item.open .vmn-accordion-chevron {
    transform: rotate(180deg);
  }
  .vmn-accordion-content {
    display: none;
    padding: 0 1.4rem 1.25rem 1.4rem;
    color: #94a3b8;
    font-size: 0.88rem;
    line-height: 1.6;
    border-top: 1px solid #141c2c;
  }
  .vmn-accordion-item.open .vmn-accordion-content {
    display: block;
  }

  /* Commercial Rate Cards & Media Kit */
  .vmn-rate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .vmn-rate-card {
    background: #080b11;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .vmn-rate-card:hover {
    transform: translateY(-2px);
    border-color: #3b82f6;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
  }
  .vmn-rate-card.featured {
    border-color: #3b82f6;
    background: linear-gradient(180deg, #0f172a 0%, #080b11 100%);
  }
  .vmn-rate-badge {
    position: absolute;
    top: -10px;
    right: 1.25rem;
    background: #3b82f6;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .vmn-rate-amount {
    font-size: 2rem;
    font-weight: 800;
    color: #f8fafc;
    font-family: ui-monospace, SFMono-Regular, monospace;
    margin: 0.75rem 0 0.25rem 0;
  }
  .vmn-rate-period {
    color: #94a3b8;
    font-size: 0.8rem;
    margin-bottom: 1.25rem;
  }
  .vmn-rate-features {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .vmn-rate-features li {
    font-size: 0.85rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .vmn-rate-features li::before {
    content: "\\2713";
    color: #10b981;
    font-weight: bold;
  }

  /* File Upload Dropzone */
  .vmn-dropzone {
    border: 2px dashed #1e293b;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    background: #05070a;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .vmn-dropzone:hover {
    border-color: #3b82f6;
    background: #080c14;
  }

  /* Interactive Filter Pills & Toolbars */
  .vmn-filter-bar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .vmn-filter-pill {
    background: #080b11;
    border: 1px solid #1e293b;
    color: #94a3b8;
    padding: 0.45rem 0.9rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
  }
  .vmn-filter-pill:hover {
    color: #ffffff;
    border-color: #334155;
  }
  .vmn-filter-pill.active {
    background: #1e293b;
    color: #ffffff;
    border-color: #3b82f6;
  }

  /* -------------------------------------------------------------------------- */
  /* Enterprise Operational Cockpit & Module Architecture                       */
  /* -------------------------------------------------------------------------- */
  .vmn-cockpit-article {
    max-width: 1200px;
    margin: 0 auto;
  }
  .vmn-breadcrumb-bar {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 1.25rem;
    font-weight: 500;
  }
  .vmn-breadcrumb-bar a {
    color: #38bdf8;
    text-decoration: none;
    transition: color 0.15s;
  }
  .vmn-breadcrumb-bar a:hover {
    color: #7dd3fc;
    text-decoration: underline;
  }
  .vmn-crumb-sep {
    color: #475569;
    user-select: none;
  }
  .vmn-cockpit-hero {
    background: radial-gradient(circle at 50% 0%, #0d1527 0%, #030712 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  }
  .vmn-cockpit-title {
    font-size: clamp(1.75rem, 1.4rem + 1.5vw, 2.35rem);
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.02em;
    margin: 0.5rem 0;
  }
  .vmn-cockpit-lead {
    font-size: 1.05rem;
    color: #94a3b8;
    max-width: 800px;
    line-height: 1.5;
    margin-bottom: 1.25rem;
  }
  .vmn-cockpit-section {
    margin-bottom: 2.25rem;
  }
  .vmn-section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding-bottom: 0.75rem;
  }
  .vmn-section-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }
  .vmn-section-meta {
    font-size: 0.8rem;
    color: #94a3b8;
    font-family: var(--vmn-font-mono);
  }
  .vmn-capability-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 1.25rem;
  }
  .vmn-capability-card {
    background: #080c14;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  .vmn-capability-card:hover {
    transform: translateY(-2px);
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .vmn-capability-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .vmn-capability-badge {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .vmn-capability-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
  }
  .vmn-capability-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.45;
    margin-bottom: 1rem;
  }
  .vmn-capability-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 0.75rem;
    display: flex;
    justify-content: flex-end;
  }
  .vmn-cockpit-split {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  .vmn-cockpit-card {
    background: #080c14;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .vmn-card-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.75rem 0;
  }
  .vmn-cockpit-action-text {
    font-size: 0.95rem;
    color: #e2e8f0;
    line-height: 1.5;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .vmn-contract-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    font-style: italic;
  }
  .vmn-metadata-stack {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .vmn-meta-row {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
    color: #94a3b8;
    gap: 2px;
  }
  .vmn-meta-row strong {
    color: #e2e8f0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .vmn-mono-badge {
    font-family: var(--vmn-font-mono);
    background: #030712;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #1f2937;
    color: #38bdf8;
    display: inline-block;
    width: fit-content;
  }
  .vmn-governance-accordion {
    background: #080c14;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .vmn-governance-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 0.95rem;
    color: #f8fafc;
    list-style: none;
    user-select: none;
  }
  .vmn-governance-summary::-webkit-details-marker {
    display: none;
  }
  .vmn-accordion-chevron {
    font-size: 0.9rem;
    color: #94a3b8;
    transition: transform 0.2s;
  }
  .vmn-governance-accordion[open] .vmn-accordion-chevron {
    transform: rotate(180deg);
  }
  .vmn-governance-drawer-content {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .vmn-spec-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 1.5rem;
  }
  .vmn-spec-block {
    background: #030712;
    border: 1px solid #1f2937;
    border-radius: 8px;
    padding: 1rem;
  }
  .vmn-spec-block h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #38bdf8;
    margin: 0 0 0.5rem 0;
  }
  .vmn-spec-block h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0.75rem 0 0.25rem 0;
  }
  .vmn-spec-block p {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.45;
    margin: 0;
  }

  /* Creative Economy Hub Showcase Cards */
  .vmn-hub-section {
    margin-bottom: 3rem;
  }
  .vmn-hub-header {
    margin-bottom: 2rem;
  }
  .vmn-hub-title {
    font-size: clamp(1.75rem, 1.4rem + 1.5vw, 2.35rem);
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.02em;
    margin: 0 0 0.5rem 0;
  }
  .vmn-hub-lead {
    color: #94a3b8;
    font-size: 1rem;
    line-height: 1.5;
    max-width: 780px;
    margin: 0;
  }
  .vmn-hub-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    gap: 1.5rem;
  }
  .vmn-hub-showcase-card {
    background: #080c14;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .vmn-hub-showcase-card:hover {
    transform: translateY(-2px);
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  }
  .vmn-hub-card-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.4rem 0;
  }
  .vmn-hub-card-tagline {
    color: #38bdf8;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
  }
  .vmn-hub-card-desc {
    color: #94a3b8;
    font-size: 0.85rem;
    line-height: 1.45;
    margin-bottom: 1.25rem;
  }
  .vmn-hub-card-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }

  /* Portal Homepage & Entity Cards */
  .vmn-avatar-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #38bdf8;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .vmn-channel-card {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, border-color 0.2s;
  }
  .vmn-channel-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .vmn-pillar-card, .vmn-leadership-card {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, border-color 0.2s;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .vmn-pillar-card:hover, .vmn-leadership-card:hover {
    transform: translateY(-2px);
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  /* AUD-20: utility classes migrated from static inline style attributes
     (scripts/migrate-inline-styles.mjs); enables CSP style-src without
     'unsafe-inline'. */
  ${GENERATED_UTILITY_CSS}
`;

/**
 * Partitioned CSS bundles (AUD-32 / Frontend Architecture)
 * Enables shell-targeted CSS delivery to reduce stylesheet parse overhead on public landing pages.
 */
export const CORE_DESIGN_TOKENS_CSS = `
  /* Core design tokens & typography scale */
  :root {
    --vmn-color-primary: #174C3C;
    --vmn-color-primary-hover: #0E2B20;
    --vmn-color-primary-text: #FFFFFF;
    --vmn-color-secondary: #172434;
    --vmn-color-brand: #E50914;
    --vmn-color-accent: #FFB800;
    --vmn-font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  body {
    margin: 0;
    font-family: var(--vmn-font-sans);
    color: var(--vmn-color-text-main);
    background-color: #000000;
  }
`;

export const PUBLIC_SHELL_CSS = `
  /* Public Landing & Marketing Shell Styles (Vanta Black Foundation) */
  .vmn-navbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; }
  .vmn-public-hero { padding: 48px 24px; text-align: center; }
  .vmn-footer { padding: 32px 24px; border-top: 1px solid #222222; }
`;

export const WORKSPACE_SHELL_CSS = `
  /* Operator Workspace & Console Styles (Vanta Black Foundation) */
  .vmn-shell-work-layout { display: flex; min-height: 100vh; }
  .vmn-work-rail { width: 260px; flex-shrink: 0; background: #0a0a0a; border-right: 1px solid #222222; }
  .vmn-work-content { flex: 1; padding: 24px; }
`;

export const IDENTITY_SHELL_CSS = `
  /* Authentication & Identity Shell Styles (Vanta Black Foundation) */
  .vmn-shell-identity { max-width: 480px; margin: 40px auto; padding: 32px; background: #0a0a0a; border: 1px solid #222222; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
`;


