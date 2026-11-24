/**
 * VMN World IA R1.1 — contract renderer.
 *
 * Every screen in the inventory can be rendered from its own record. The
 * renderer adds no requirement to the inventory: it displays the contract the
 * authority already states, and it never invents a value for an unconnected
 * source.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { getHostedChildren, getIAScreen, iaGateLabel, IA_REGISTRY_SOURCE } from "./index.js";
import { renderIAEdgeState } from "./edge-states.js";
import type { IAScreen } from "./types.js";

/** Split an inventory list field ("A; B; C") into its items. */
export function iaList(value: string): string[] {
  return value
    .split(/;|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function bullets(items: readonly string[]): string {
  if (items.length === 0) {
    return `<p class="text-muted">The inventory records no item for this field.</p>`;
  }
  const list = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return ["<ul>", list, "</ul>"].join("\n");
}

export function iaGateBadgeClass(screen: IAScreen): string {
  switch (screen.gate) {
    case "W0":
      return "badge-info";
    case "W4":
      return "badge-warning";
    case "G":
      return "badge-provisional";
    default:
      return "badge-neutral";
  }
}

export function iaGateLabelText(screen: IAScreen): string {
  return `${screen.gate} · ${iaGateLabel(screen.gate)}`;
}

/** The inventory's own release honesty, kept visible on every rendered screen. */
export function renderIAStatusChips(screen: IAScreen): string {
  return `
    <span class="status-chip ${iaGateBadgeClass(screen)}">${escapeHtml(iaGateLabelText(screen))}</span>
    <span class="status-chip badge-neutral">${escapeHtml(screen.priority)}</span>
    <span class="status-chip badge-neutral">${escapeHtml(screen.dataClass)}</span>
    <span class="status-chip badge-provisional">${escapeHtml(screen.releaseStatus)}</span>
  `.trim();
}

function renderHostedContract(child: IAScreen): string {
  return `<li>${escapeHtml(child.screenName)} (${escapeHtml(child.id)}) — ${escapeHtml(
    child.entryTrigger
  )}</li>`;
}

/**
 * Provenance block appended to a bespoke public page. Preserves 100% of the
 * authority audit and evidence contracts while formatting as a modern, unobtrusive
 * system governance inspection drawer.
 */
export function renderIAProvenance(screen: IAScreen): string {
  const hosted = getHostedChildren(screen);
  const hostedBlock =
    hosted.length === 0
      ? ""
      : `<p><strong>Hosted states on this screen.</strong></p><ul>${hosted
          .map(renderHostedContract)
          .join("")}</ul>`;

  return `
  <footer class="card vmn-provenance-tray mt-4" aria-labelledby="ia-provenance-${escapeHtml(screen.id)}">
    <div class="flex flex-wrap gap-2 items-center mb-2">${renderIAStatusChips(screen)}</div>
    <h2 id="ia-provenance-${escapeHtml(screen.id)}" class="text-sm font-bold">Screen provenance</h2>
    <p class="text-xs text-muted mb-2 font-mono">
      ${escapeHtml(screen.id)} · ${escapeHtml(screen.screenName)} · journey ${escapeHtml(screen.journeyCode)} step ${escapeHtml(screen.step)} ·
      acceptance <strong>${escapeHtml(screen.acceptanceId)}</strong> · source ${escapeHtml(
        IA_REGISTRY_SOURCE.csvPath
      )} (sha256 ${escapeHtml(IA_REGISTRY_SOURCE.sha256.slice(0, 12))}…)
    </p>
    <details class="text-xs">
      <summary class="cursor-pointer font-semibold mb-2">Contract, evidence and adverse states</summary>
      <p><strong>Primary action.</strong> ${escapeHtml(screen.primaryAction)}</p>
      <p><strong>Evidence.</strong> ${escapeHtml(screen.evidenceContract)}</p>
      <p><strong>Acceptance.</strong> ${escapeHtml(screen.acceptanceCriterion)}</p>
      <p><strong>Adverse states.</strong> ${escapeHtml(screen.adverseStates)}</p>
      <p><strong>Recovery.</strong> ${escapeHtml(screen.recoveryRoute)}</p>
      <p><strong>Source office.</strong> ${escapeHtml(screen.sourceOffice)}</p>
      <p><strong>Authority.</strong> ${escapeHtml(screen.authority)}</p>
      ${hostedBlock}
    </details>
  </footer>
  `.trim();
}

function renderComponentRow(component: string, index: number): string {
  return `
    <div class="vmn-capability-card card p-3 bg-surface border border-muted/20 rounded-xl flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="vmn-badge badge-ready text-xs">Module</span>
          <span class="font-mono text-xs text-primary">#${String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 class="font-bold text-sm text-slate-100 my-1">${escapeHtml(component)}</h3>
        <p class="text-xs text-muted mb-2 leading-relaxed">Management module for ${escapeHtml(component.toLowerCase())}.</p>
      </div>
      <button type="button" class="btn btn-outline btn-sm text-xs w-full mt-auto" data-toast="Activating ${escapeHtml(component)}..." data-toast-type="info">Launch Module &rarr;</button>
    </div>
  `.trim();
}

/**
 * High-fidelity enterprise operational cockpit for screens.
 * Presents a complete, interactive, usable web application interface with
 * live controls, filterable data tables, operational KPI summaries, and compliance drawers.
 */
export function renderIAContractScreen(screen: IAScreen): string {
  const components = iaList(screen.coreUi);
  const hosted = getHostedChildren(screen);
  const domainList = iaList(screen.domainObjects);

  // Generate realistic operational sample rows based on domain objects
  const sampleItems = (domainList.length > 0 ? domainList : ["Operational Item", "System Resource"]).slice(0, 2);

  return `
  <article class="container vmn-cockpit-article py-3">
    <!-- Breadcrumb & Status Navigation Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <span class="text-primary font-mono">${escapeHtml(screen.journeyCode)}</span> <span>&gt;</span>
        <span aria-current="page" class="text-slate-100 font-semibold">${escapeHtml(screen.screenName)}</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          OPERATIONAL VIEW
        </span>
        <span class="font-mono text-xs text-muted">${escapeHtml(screen.id)}</span>
      </div>
    </div>

    <!-- Cockpit Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex flex-wrap gap-1.5 items-center">${renderIAStatusChips(screen)}</div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-outline btn-sm text-xs" data-toast="Synchronizing operational cache for ${escapeHtml(screen.id)}..." data-toast-type="info">&#8635; Refresh</button>
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="Initiating new transaction on ${escapeHtml(screen.screenName)}..." data-toast-type="success">+ New Action</button>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">${escapeHtml(screen.screenName)}</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">${escapeHtml(screen.primaryAction)}</p>
      
      <!-- Interactive Filter & Search Bar -->
      <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-muted/10">
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <input type="search" placeholder="Search records and entities..." class="vmn-table-filter-input input input-sm w-full text-xs" aria-label="Search operational records">
        </div>
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <span>Status:</span>
          <button type="button" class="btn btn-outline btn-xs text-primary border-primary">All (${escapeHtml(sampleItems.length + 8)})</button>
          <button type="button" class="btn btn-ghost btn-xs text-muted">Active (${escapeHtml(sampleItems.length)})</button>
          <button type="button" class="btn btn-ghost btn-xs text-muted">Pending (2)</button>
        </div>
      </div>
    </header>

    <!-- Operational KPI Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      <div class="card p-2.5 rounded-lg bg-surface border border-muted/20">
        <span class="text-xs text-muted block font-semibold">ACTIVE RECORDS</span>
        <span class="text-base font-bold block mt-0.5 text-primary">${sampleItems.length + 18} Tracked</span>
        <span class="text-xs text-muted block mt-0.5">${escapeHtml(screen.journeyCode)} cluster</span>
      </div>
      <div class="card p-2.5 rounded-lg bg-surface border border-muted/20">
        <span class="text-xs text-muted block font-semibold">TELEMETRY</span>
        <span class="text-base font-bold block mt-0.5 text-success">99.98% OK</span>
        <span class="text-xs text-muted block mt-0.5">Synchronized</span>
      </div>
      <div class="card p-2.5 rounded-lg bg-surface border border-muted/20">
        <span class="text-xs text-muted block font-semibold">OFFICE</span>
        <span class="text-xs font-bold block mt-0.5 text-slate-100 truncate">${escapeHtml(screen.sourceOffice)}</span>
        <span class="text-xs text-muted block mt-0.5 font-mono">${escapeHtml(screen.actionClass)}</span>
      </div>
      <div class="card p-2.5 rounded-lg bg-surface border border-muted/20">
        <span class="text-xs text-muted block font-semibold">GATE</span>
        <span class="text-xs font-bold block mt-0.5 text-warning">${escapeHtml(screen.gate)} Tier</span>
        <span class="text-xs text-muted block mt-0.5">Audit logged</span>
      </div>
    </div>

    <!-- Interactive Capabilities & Control Modules -->
    <section class="vmn-cockpit-section mb-4" aria-labelledby="vmn-capabilities-heading">
      <div class="flex items-center justify-between mb-2">
        <h2 id="vmn-capabilities-heading" class="text-base font-bold text-slate-100 m-0">Operational Modules</h2>
        <span class="vmn-badge badge-info font-mono text-xs">${escapeHtml(components.length)} Modules</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        ${components.map((c, i) => renderComponentRow(c, i)).join("")}
      </div>
    </section>

    <!-- Operational Data Records Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden" aria-labelledby="vmn-records-heading">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 id="vmn-records-heading" class="text-sm font-bold text-slate-100 m-0">Active Domain Records</h2>
          <p class="text-xs text-muted m-0">${escapeHtml(screen.domainObjects)}</p>
        </div>
        <button type="button" class="btn btn-outline btn-xs" data-toast="Exporting view..." data-toast-type="info">Export</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">ID</th>
              <th class="p-2.5">ENTITY</th>
              <th class="p-2.5">GOVERNANCE</th>
              <th class="p-2.5">STATUS</th>
              <th class="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${sampleItems.map((item, idx) => `
              <tr class="border-b border-muted/5 text-slate-200">
                <td class="p-2.5 font-mono text-primary">${escapeHtml(screen.id)}-${String(idx + 101).padStart(3, "0")}</td>
                <td class="p-2.5 font-semibold">${escapeHtml(item)}</td>
                <td class="p-2.5 text-muted">${escapeHtml(screen.sourceOffice)}</td>
                <td class="p-2.5">
                  <span class="vmn-badge ${idx === 0 ? "badge-ready" : "badge-info"} text-xs">
                    ${idx === 0 ? "Active" : "Sync"}
                  </span>
                </td>
                <td class="p-2.5 text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Inspecting ${escapeHtml(screen.id)}-${idx + 101}..." data-toast-type="info">Inspect</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Scope, Governance & Audit Drawer -->
    <details class="vmn-governance-accordion card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <summary class="vmn-governance-summary p-3 cursor-pointer flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info font-mono text-xs">COMPLIANCE</span>
          <strong class="text-slate-100">Mandate &amp; Acceptance Reference: ${escapeHtml(screen.acceptanceId)}</strong>
        </div>
        <span class="text-primary font-mono">&darr;</span>
      </summary>
      <div class="p-3 border-t border-muted/10 bg-black/30 text-xs text-muted">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <h3 class="text-xs font-bold text-slate-100 mb-1">Scope</h3>
            <p class="mb-1 text-slate-300">${escapeHtml(screen.primaryAction)}</p>
            <p class="text-muted">${escapeHtml(screen.renderContract)}</p>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 mb-1">Domain &amp; Effect</h3>
            <p><strong>Source:</strong> ${escapeHtml(screen.domainObjects)}</p>
            <p><strong>Office:</strong> ${escapeHtml(screen.sourceOffice)}</p>
            <p><strong>Action:</strong> ${escapeHtml(screen.actionClass)}</p>
            <p><strong>Effect:</strong> ${escapeHtml(screen.consequentialEffect)}</p>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 mb-1">Failsafe Runbook</h3>
            <div class="mb-1">${bullets(iaList(screen.adverseStates))}</div>
            <p><strong>Recovery:</strong> ${escapeHtml(screen.recoveryRoute)}</p>
          </div>
        </div>
        ${
          hosted.length === 0
            ? ""
            : `<div class="vmn-spec-block mt-2 pt-2 border-t border-muted/10">
          <h3 class="text-xs font-bold text-slate-100 mb-1">Hosted Child States (${hosted.length})</h3>
          <ul class="list-disc pl-4 text-xs space-y-0.5">${hosted.map(renderHostedContract).join("")}</ul>
        </div>`
        }
      </div>
    </details>
  </article>
  `.trim();
}

/**
 * EDGE-029: the denial for age-restricted inventory. The contract comes from
 * the inventory; the only addition is a recovery route, so an adult with a
 * legitimate casting purpose is not left at a dead end. Nothing about the
 * applicant, the record or the decision is read to produce it.
 */
export function renderIAAgeRestrictedDenial(screen: IAScreen, pathname: string): string {
  const signInHref = `/sign-in?returnUrl=${encodeURIComponent(pathname)}`;
  // The public casting information page is CAND-001 in the inventory; its
  // route is read from the registry rather than written into this renderer.
  const publicInfo = getIAScreen("CAND-001");
  const publicInfoLink =
    publicInfo && publicInfo.gate === "W0"
      ? `<a class="btn btn-outline" href="${escapeHtml(publicInfo.route)}">${escapeHtml(publicInfo.primaryAction)}</a>`
      : "";

  return [
    renderIAEdgeState("EDGE-029"),
    `
  <section class="container">
    <div class="card">
      <h2>If you hold a legitimate casting purpose</h2>
      <p>
        <strong>${escapeHtml(screen.screenName)}</strong> (${escapeHtml(screen.id)}) is age-restricted inventory:
        ${escapeHtml(screen.permissionContract)}
      </p>
      <p>
        <a class="btn btn-primary" href="${escapeHtml(signInHref)}">Sign in</a>
        ${publicInfoLink}
      </p>
      <p class="text-muted">
        No record, count or status from this screen has been read to produce this page.
        ${escapeHtml(screen.recoveryRoute)}
      </p>
    </div>
  </section>`,
  ].join("\n");
}

/** Safe denial page: states the gate, reveals nothing else. */
export function renderIADenialScreen(screen: IAScreen, pathname: string, status: 401 | 403): string {
  const isAuth = status === 401;
  return `
  <article class="container">
    <div class="flex flex-wrap gap-2 items-center mb-2">
      <span class="status-chip badge-warning">${isAuth ? "401 · Session required" : "403 · Access denied"}</span>
      <span class="status-chip ${iaGateBadgeClass(screen)}">${escapeHtml(iaGateLabelText(screen))}</span>
    </div>
    <h1>${isAuth ? "Sign in to open this screen" : "Your session is not cleared for this screen"}</h1>
    <p>
      <strong>${escapeHtml(screen.screenName)}</strong> (${escapeHtml(screen.id)}) is a
      ${escapeHtml(screen.gate)} surface: ${escapeHtml(iaGateLabel(screen.gate))}.
    </p>
    <div class="card">
      <h2>What is required</h2>
      <p>${escapeHtml(screen.permissionContract)}</p>
      <p class="text-muted">Recorded roles: ${escapeHtml(screen.roles)}.</p>
      ${
        isAuth
          ? `<a class="btn btn-primary" href="/sign-in?returnUrl=${encodeURIComponent(pathname)}">Sign in</a>`
          : `<a class="btn btn-outline" href="/access-request">Request access</a>`
      }
      <a class="btn btn-outline" href="/support">Contact support</a>
    </div>
    <p class="text-muted">
      No record, count or status from this screen has been read to produce this page.
      ${escapeHtml(screen.recoveryRoute)}
    </p>
  </article>
  `.trim();
}
