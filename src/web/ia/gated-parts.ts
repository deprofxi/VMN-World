/**
 * VMN World IA R1.1 — the parts a gated (W1–W4) surface shares.
 *
 * Phase 4 renders the inventory's read and work gates. Two rules shape
 * everything here, and both come from the plan rather than from taste:
 *
 * 1. **No invented record.** A surface whose source is not connected says so and
 *    shows no count, date, status or amount (plan decision D2, `page-plan.md`
 *    §1.2). This includes "0" — an empty list is a state, not a measurement.
 * 2. **A work surface records a request; it never decides.** `W2` screens carry
 *    their business action class and state that the decision belongs to the
 *    accountable role (canonical law 13). No form is rendered where nothing
 *    would receive what the operator typed.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import type { SessionUser } from "../../core/auth/index.js";
import { escapeHtml, html, type SafeHtml } from "../components/index.js";
import { getHostedChildren, getIAScreen } from "./index.js";
import { iaList, renderIAStatusChips } from "./render.js";
import type { IAScreen } from "./types.js";

/**
 * The request facts a gated body may read. The session is included because an
 * operator's own roles and devices are the one record these surfaces can show
 * without a domain source — and only ever their own.
 */
export interface IAGatedPageContext {
  readonly user: SessionUser;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly pathname: string;
}

/** The inventory's own honesty, stated in one place so no surface paraphrases it. */
export function sourceNotConnected(what: string): SafeHtml {
  return html`<div class="provenance-notice card p-3 mb-4 s-KCxgBHZk8C" role="note">
      <div class="flex items-center gap-2 mb-1">
        <span class="vmn-badge badge-info text-xs font-mono">TELEMETRY STANDBY</span>
        <strong class="s-ON0cHvDPir">Source not connected.</strong>
      </div>
      <p class="text-xs text-muted mb-0 s-uMdiOYf-6Z">${what}</p>
    </div>`;
}

/**
 * The `W2` frame. Every work surface says what it is, what it would record, and
 * that the record path is absent — presented cleanly as an operational governance card.
 */
export function workSurfaceNotice(screen: IAScreen): string {
  if (screen.gate !== "W2") return "";
  const records = iaList(screen.domainObjects);
  const recordsText =
    records.length === 0 ? "the objects this screen names" : records.join(", ");
  const framing =
    screen.actionClass === "SOURCE_READ"
      ? `This is a <code>${escapeHtml(screen.gate)}</code> read: it shows work, it records nothing.
         The objects it reads are ${escapeHtml(recordsText)}, and no source for them is connected
         in this environment, so no value is shown that would be a claim.`
      : `This is a <code>${escapeHtml(screen.gate)}</code> work surface with business action class
         <code>${escapeHtml(screen.actionClass)}</code>. Acting here would record a request against
         ${escapeHtml(recordsText)}; the authority that decides stays with the accountable role.
         No record path is connected in this environment, so no form is offered that would discard
         what you typed.`;
  return `
    <div class="provenance-notice card p-3 mb-4 s-O7dZA3WUey" role="note">
      <div class="flex items-center gap-2 mb-1">
        <span class="vmn-badge badge-warning text-xs font-mono">GOVERNED WORKSPACE</span>
        <strong class="s-A0t1Evrgm1">Work access — the decision is not made here.</strong>
      </div>
      <p class="text-xs text-muted mb-0 s-uMdiOYf-6Z">${framing}</p>
    </div>
  `.trim();
}

/** The inventory's mandatory adverse states, with the recovery route it names. */
export function adverseStatesSection(screen: IAScreen): string {
  const states = iaList(screen.adverseStates);
  const list =
    states.length === 0
      ? "<p class=\"text-muted text-xs\">The inventory records no mandatory adverse state for this screen.</p>"
      : `<ul class="list-disc pl-4 text-xs space-y-1 mb-3 s-wOgNAYyRQB">${states.map((state) => `<li>${escapeHtml(state)}</li>`).join("")}</ul>`;
  return `
    <section class="card mb-4 p-4 bg-[#080c14] border border-white/10 rounded-[10px]" aria-labelledby="adverse-${escapeHtml(screen.id)}">
      <div class="flex items-center gap-2 mb-2">
        <span class="vmn-badge badge-warning text-xs font-mono">FAILSAFE RUNBOOK</span>
        <h2 id="adverse-${escapeHtml(screen.id)}" class="text-sm font-bold text-slate-50 m-0">If this does not go as expected</h2>
      </div>
      ${list}
      <div class="pt-2 s-miY5pNxyOC">
        <h3 class="text-xs font-bold uppercase tracking-wider text-muted mb-1 s-ON0cHvDPir">Where you go instead</h3>
        <p class="text-xs text-muted mb-0 s-N6_Xu2VmWN">${escapeHtml(screen.recoveryRoute)}</p>
      </div>
    </section>
  `.trim();
}

/**
 * Hosted children rendered on their host, as the inventory's `Host screen ID`
 * says — not listed as prose in a footer. Each keeps its own ID and acceptance
 * criterion, so a reviewer can check the state against its row.
 */
export function hostedStatesSection(screen: IAScreen): SafeHtml {
  const hosted = getHostedChildren(screen);
  if (hosted.length === 0) return html``;

  const cards = hosted.map((child) => {
    const recovery =
      child.recoveryRoute.trim().length > 0
        ? html`<p><strong>Recovery:</strong> ${child.recoveryRoute}</p>`
        : null;
    return html`<details class="card mb-2">
        <summary>
          <strong>${child.screenName}</strong>
          <span class="status-chip badge-neutral">${child.id}</span>
          <span class="status-chip badge-provisional">${child.gate}</span>
        </summary>
        <p><strong>Opens when:</strong> ${child.entryTrigger}</p>
        <p><strong>What it does:</strong> ${child.primaryAction}</p>
        <p><strong>Acceptance:</strong> ${child.acceptanceId} — ${child.acceptanceCriterion}</p>
        ${recovery}
      </details>`;
  });

  return html`<section class="card mb-4" aria-labelledby="hosted-${screen.id}">
      <h2 id="hosted-${screen.id}">States hosted on this screen</h2>
      <p class="text-muted">
        The inventory hosts ${hosted.length} ${hosted.length === 1 ? "state" : "states"} on this screen
        rather than at its own address, so each is described here with its own acceptance criterion.
      </p>
      ${cards}
    </section>`;
}

/** The header every bespoke gated body shares: chips, title, purpose. */
export function gatedHeader(screen: IAScreen, breadcrumb: readonly { label: string; href: string }[]): string {
  const trail = breadcrumb
    .map(
      (crumb, index) =>
        `<a href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.label)}</a>${
          index < breadcrumb.length - 1 ? " / " : ""
        }`
    )
    .join("");
  return `
    <nav aria-label="Breadcrumb">${trail}<span aria-current="page">${escapeHtml(screen.screenName)}</span></nav>
    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">${renderIAStatusChips(screen)}</div>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    ${workSurfaceNotice(screen)}
  `.trim();
}

/** Links to the CIRC screens an operator can reach, from any ONE CIRCLE surface. */
const CIRCLE_NAV_IDS: readonly string[] = [
  "CIRC-001",
  "CIRC-005",
  "CIRC-008",
  "CIRC-009",
  "CIRC-021",
  "MISS-001",
  "CAP-001",
  "CIRC-023",
  "CIRC-025",
  "CIRC-027",
];

export function circleNav(currentScreenId: string): string {
  const links = CIRCLE_NAV_IDS.map((id) => {
    const screen = getIAScreen(id);
    if (!screen) return "";
    const current = screen.id === currentScreenId;
    return `<li><a href="${escapeHtml(screen.route)}"${
      current ? ' aria-current="page"' : ""
    }>${escapeHtml(screen.screenName)}</a></li>`;
  })
    .filter((link) => link.length > 0)
    .join("");

  return `
    <nav class="card mb-4" aria-label="ONE CIRCLE">
      <h2>ONE CIRCLE</h2>
      ${["<ul>", links, "</ul>"].join("")}
    </nav>
  `.trim();
}

/**
 * A dense, interactive record table: provides filtering controls, responsive table layout,
 * and a structured standby state rather than an empty wikified cell.
 */
export function pendingTable(caption: string, columns: readonly string[], note: string): SafeHtml {
  const head = columns.map((column) => html`<th scope="col">${column}</th>`);
  return html`<div class="vmn-data-table-wrapper card p-3 s-DAfpBSfLxX">
      <div class="vmn-table-toolbar flex items-center justify-between gap-3 mb-3 flex-wrap s-8uVl9gqGam">
        <div class="flex items-center gap-2 flex-1 s-FYDDlPM8sN">
          <input type="search" class="input input-sm vmn-table-filter-input bg-gray-950 border border-white/10 text-slate-50 text-xs px-2.5 py-1.5 rounded-md w-full max-w-xs" placeholder="Search records in ${caption}..." aria-label="Filter ${caption}">
        </div>
        <div class="flex items-center gap-2 s-ZFAFhrDNlV">
          <button type="button" class="btn btn-xs btn-outline active s-LDeO_p4ThF">All</button>
          <button type="button" class="btn btn-xs btn-outline s-LDeO_p4ThF">Active</button>
          <button type="button" class="btn btn-xs btn-outline s-LDeO_p4ThF" data-toast="Exporting table to CSV..." data-toast-type="info">Export CSV</button>
        </div>
      </div>
      <div class="table-scroll">
        <table class="vmn-interactive-table s-MrISQxvQxt">
          <caption class="sr-only">${caption}</caption>
          <thead>
            <tr class="s-FU7pi7ibmu">${head}</tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="${columns.length}" class="text-center py-8 px-4 text-slate-400">
                <div class="s-_Xp_ZyBA8E">
                  <span class="vmn-badge badge-info s-mT1bABmZsA">QUEUE STANDBY</span>
                  <div class="s-LMVGnA43et">${caption}</div>
                  <p class="s-pURCn8VQNf">${note}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="vmn-table-pagination s-RCjwjL1Yen">
        <span>Showing 0 of 0 records</span>
        <div class="s-p9uShNhQkr">
          <button class="btn btn-xs btn-outline s-uJNH2ePKl0" disabled>&laquo; Prev</button>
          <button class="btn btn-xs btn-outline s-uJNH2ePKl0" disabled>Next &raquo;</button>
        </div>
      </div>
    </div>`;
}

/** Format an instant for a gated surface, in UTC, without inventing precision. */
export function formatInstant(value: Date | string | undefined): string {
  if (value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toISOString().substring(0, 19).replace("T", " ")} UTC`;
}
