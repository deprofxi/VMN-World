/**
 * VMN UI/UX Iconography Component (Accessible SVGs)
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-106 / DS-12 / AGENTS.md UI/UX Rules
 *
 * Replaces unreliable and inaccessible OS emojis with unified 24px SVG icons.
 * Features:
 * - currentColor fill/stroke support
 * - aria-hidden="true" by default for decorative icons
 * - role="img" and accessible label support for informative icons
 * - Scalable size options (default 24x24)
 */

import { escapeHtml } from "./escape.js";

export type IconName =
  | "broadcast"
  | "antenna"
  | "lock"
  | "folder"
  | "document"
  | "bolt"
  | "alert"
  | "warning"
  | "inbox"
  | "empty"
  | "hourglass"
  | "spinner"
  | "check"
  | "download"
  | "info"
  | "search"
  | "chevronRight"
  | "send"
  | "calendar"
  | "film"
  | "shield"
  | "play"
  | "refresh"
  | "clock"
  | "chart"
  | "xCircle"
  | "tv"
  | "sun"
  | "moon"
  | "menu"
  | "x"
  | "command"
  | "user";

export interface IconOptions {
  size?: number;
  className?: string;
  accessibleLabel?: string;
}

const SVG_PATHS: Record<IconName, string> = {
  play: `
    <polygon points="5 3 19 12 5 21 5 3"/>
  `,
  refresh: `
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  `,
  clock: `
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  `,
  chart: `
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  `,
  xCircle: `
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  `,
  tv: `
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  `,
  broadcast: `
    <path d="M4.93 19.07A10 10 0 0 1 12 2a10 10 0 0 1 7.07 17.07"/>
    <path d="M7.76 16.24A6 6 0 0 1 12 6a6 6 0 0 1 4.24 10.24"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 14v8"/>
  `,
  antenna: `
    <path d="M4.93 19.07A10 10 0 0 1 12 2a10 10 0 0 1 7.07 17.07"/>
    <path d="M7.76 16.24A6 6 0 0 1 12 6a6 6 0 0 1 4.24 10.24"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 14v8"/>
  `,
  lock: `
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  `,
  folder: `
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  `,
  document: `
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  `,
  bolt: `
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  `,
  alert: `
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  `,
  warning: `
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  `,
  inbox: `
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  `,
  empty: `
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  `,
  hourglass: `
    <path d="M5 22h14"/>
    <path d="M5 2h14"/>
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
  `,
  spinner: `
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  `,
  check: `
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  `,
  download: `
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  `,
  info: `
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  `,
  search: `
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  `,
  chevronRight: `
    <polyline points="9 18 15 12 9 6"/>
  `,
  send: `
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  `,
  calendar: `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  `,
  film: `
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/>
    <line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  `,
  shield: `
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  `,
  sun: `
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  `,
  moon: `
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  `,
  menu: `
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  `,
  x: `
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  `,
  command: `
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  `,
  user: `
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  `,
};

/**
 * Renders an accessible inline SVG icon.
 */
export function renderIcon(name: IconName, options: IconOptions = {}): string {
  const validName = Object.prototype.hasOwnProperty.call(SVG_PATHS, name) ? name : "info";
  const requestedSize = options.size;
  const size = Number.isFinite(requestedSize) && requestedSize! >= 1 && requestedSize! <= 512 ? requestedSize! : 24;
  const path = SVG_PATHS[validName];
  const extraClasses = (options.className || "").split(/\s+/).filter((token) => /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(token));
  const classes = ["vmn-icon", `vmn-icon-${validName}`, ...extraClasses].join(" ");
  const escapedLabel = options.accessibleLabel ? escapeHtml(options.accessibleLabel.slice(0, 200)) : "";

  if (escapedLabel) {
    return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${escapedLabel}">${path.trim()}</svg>`;
  }

  return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path.trim()}</svg>`;
}
