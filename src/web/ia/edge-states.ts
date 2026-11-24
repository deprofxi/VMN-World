/**
 * VMN World IA R1.1 — J23 edge states (global handlers).
 *
 * The 44 EDGE rows own no URL by definition: they are the states the platform's
 * existing handlers produce. This module renders their contracts so the
 * handlers can carry the truthful state instead of a blank error, and so the
 * 11 public states are reachable in tests. No parallel handler is invented:
 * the 404 below is the existing final fallback, extended to speak to browsers.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";

/** The 11 public (W0) edge states, in inventory order. */
export const PUBLIC_EDGE_STATE_IDS: readonly string[] = [
  "EDGE-001", // 404 route not found
  "EDGE-002", // 410 content permanently withdrawn
  "EDGE-003", // 503 scheduled maintenance
  "EDGE-004", // unplanned global service outage
  "EDGE-005", // network offline / low bandwidth
  "EDGE-022", // versioned asset or title expired
  "EDGE-023", // file upload disallowed or quarantined
  "EDGE-028", // unverified Azeebo+ destination
  "EDGE-029", // age-restricted access denied
  "EDGE-031", // company brand not launched
  "EDGE-038", // accessibility barrier blocks essential task
];

/**
 * Render one edge state's contract. Any EDGE record renders; the caller is
 * responsible for only surfacing public states on public surfaces.
 */
export function renderIAEdgeState(edgeId: string): string {
  const state = getIAScreen(edgeId);
  if (!state || state.journeyCode !== "EDGE") {
    return `<div class="provenance-notice" role="note">Edge state ${escapeHtml(edgeId)} is not defined by the inventory.</div>`;
  }

  const adverseStates = state.adverseStates
    .split(/;/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => `<span class="status-chip badge-neutral">${escapeHtml(item)}</span>`)
    .join(" ");

  return `
  <article class="container py-4">
    <header class="mb-4">
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="vmn-badge badge-warning">System Notice</span>
        <span class="sr-only">${escapeHtml(state.gate)} edge state &bull; ${escapeHtml(state.id)}</span>
      </div>
      <h1 class="text-2xl font-bold mb-2">${escapeHtml(state.screenName)}</h1>
      <p class="text-sm text-slate-300 mb-2">${escapeHtml(state.primaryAction)}</p>
    </header>
    <section class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <h2 class="text-base font-semibold mb-2">Status &amp; Next Steps</h2>
      <p class="text-sm text-slate-300 mb-3">${escapeHtml(state.entryTrigger)}</p>
      <div class="pt-3 border-t border-muted/10">
        <p class="text-sm"><strong>Recovery:</strong> <a href="${escapeHtml(state.recoveryRoute || "/")}" class="btn btn-outline btn-sm ml-2">${escapeHtml(state.recoveryRoute || "Return to Home")} &rarr;</a></p>
      </div>
    </section>
    <details class="card mb-4 p-3 rounded-xl bg-slate-950/60 border border-muted/10 text-xs text-muted">
      <summary class="cursor-pointer font-mono font-semibold">Technical Reference &amp; State Codes (${escapeHtml(state.id)})</summary>
      <div class="mt-3 pt-2 border-t border-muted/10 space-y-2">
        <div><strong>State Identifier:</strong> <code>${escapeHtml(state.id)}</code> (${escapeHtml(state.gate)})</div>
        <div><strong>Recorded State Codes:</strong> ${adverseStates}</div>
        <div><strong>Verification Criterion:</strong> <code>${escapeHtml(state.acceptanceId)}</code> &mdash; ${escapeHtml(state.acceptanceCriterion)}</div>
      </div>
    </details>
  </article>`.trim();
}

/** A compact version for embedding in an existing handler's page. */
export function renderIAEdgeStateSummary(edgeId: string): string {
  const state = getIAScreen(edgeId);
  if (!state || state.journeyCode !== "EDGE") return "";
  return `
  <section class="card mb-4" aria-labelledby="edge-${escapeHtml(state.id)}">
    <div class="flex flex-wrap gap-2 items-center mb-2">
      <span class="status-chip badge-neutral">${escapeHtml(state.id)}</span>
      <span class="status-chip badge-provisional">${escapeHtml(state.acceptanceId)}</span>
    </div>
    <h2 id="edge-${escapeHtml(state.id)}">${escapeHtml(state.screenName)}</h2>
    <p>${escapeHtml(state.primaryAction)}</p>
    <p class="text-muted">${escapeHtml(state.recoveryRoute)}</p>
  </section>`.trim();
}
