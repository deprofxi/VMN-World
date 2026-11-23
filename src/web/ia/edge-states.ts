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
  <article class="container">
    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-warning">${escapeHtml(state.gate)} edge state</span>
        <span class="status-chip badge-provisional">${escapeHtml(state.id)}</span>
      </div>
      <h1>${escapeHtml(state.screenName)}</h1>
      <p>${escapeHtml(state.primaryAction)}</p>
    </header>
    <section class="card mb-4">
      <h2>What happened, as far as this page may state it</h2>
      <p>${escapeHtml(state.entryTrigger)}</p>
      <p><strong>Recovery:</strong> ${escapeHtml(state.recoveryRoute)}</p>
    </section>
    <section class="card mb-4">
      <h2>Recorded state codes</h2>
      <p>${adverseStates}</p>
    </section>
    <section class="card mb-4">
      <h2>Acceptance</h2>
      <p><strong>${escapeHtml(state.acceptanceId)}</strong></p>
      <p>${escapeHtml(state.acceptanceCriterion)}</p>
    </section>
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
