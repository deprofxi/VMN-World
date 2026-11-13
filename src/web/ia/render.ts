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
import { getHostedChildren, iaGateLabel, IA_REGISTRY_SOURCE } from "./index.js";
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
 * Provenance block appended to a bespoke public page. It is a real disclosure,
 * not decoration: the reader can check the page against the inventory row that
 * authorised it, and reviewers can see the evidence contract that governs it.
 */
export function renderIAProvenance(screen: IAScreen): string {
  const hosted = getHostedChildren(screen);
  const hostedBlock =
    hosted.length === 0
      ? ""
      : `<p><strong>Hosted states on this screen.</strong></p><ul>${hosted
          .map(renderHostedContract)
          .join("")}</ul>`;

  // Kept deliberately compact: this footer ships on every public page, so it
  // carries the identifiers a reviewer needs first and puts the long contract
  // fields behind a disclosure.
  return `
  <footer class="card" aria-labelledby="ia-provenance-${escapeHtml(screen.id)}">
    <div class="flex flex-wrap gap-2 items-center">${renderIAStatusChips(screen)}</div>
    <h2 id="ia-provenance-${escapeHtml(screen.id)}">Screen provenance</h2>
    <p>
      ${escapeHtml(screen.id)} · ${escapeHtml(screen.screenName)} · journey ${escapeHtml(screen.journeyCode)} step ${screen.step} ·
      acceptance <strong>${escapeHtml(screen.acceptanceId)}</strong> · source ${escapeHtml(
        IA_REGISTRY_SOURCE.csvPath
      )} (sha256 ${escapeHtml(IA_REGISTRY_SOURCE.sha256.slice(0, 12))}…)
    </p>
    <details>
      <summary>Contract, evidence and adverse states</summary>
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

function renderComponentRow(component: string): string {
  return `
    <li>
      <strong>${escapeHtml(component)}</strong>
      <span class="status-chip badge-neutral">Source not connected</span>
    </li>
  `.trim();
}

/**
 * Document-grade rendering of a screen whose bespoke content does not exist
 * yet. It states the contract and shows every source as "not connected" — it
 * never renders a placeholder number, date or status that could be mistaken
 * for a record.
 */
export function renderIAContractScreen(screen: IAScreen): string {
  const components = iaList(screen.coreUi);
  const hosted = getHostedChildren(screen);

  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/sitemap">Sitemap</a> / <span>${escapeHtml(screen.journeyCode)}</span> /
      <span aria-current="page">${escapeHtml(screen.screenName)}</span>
    </nav>

    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">${renderIAStatusChips(screen)}</div>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>

    <div class="provenance-notice" role="note">
      <strong>Source not connected.</strong>
      This screen is defined by the inventory but its live data source has not been connected in this
      environment. No count, date, status or amount is shown, because showing one would be a claim.
    </div>

    <section class="card mb-4">
      <h2>What this screen is for</h2>
      <p>${escapeHtml(screen.primaryAction)}</p>
      <p class="text-muted">${escapeHtml(screen.renderContract)}</p>
    </section>

    <section class="card mb-4">
      <h2>What you can do here</h2>
      <ul>${components.map(renderComponentRow).join("")}</ul>
    </section>

    <section class="card mb-4">
      <h2>Domain objects and source office</h2>
      <p><strong>Source data:</strong> ${escapeHtml(screen.domainObjects)}</p>
      <p><strong>Responsible office:</strong> ${escapeHtml(screen.sourceOffice)}</p>
      <p><strong>Action class:</strong> ${escapeHtml(screen.actionClass)}</p>
      <p><strong>Permitted consequential effect:</strong> ${escapeHtml(screen.consequentialEffect)}</p>
      <p><strong>Permission contract:</strong> ${escapeHtml(screen.permissionContract)}</p>
    </section>

    <section class="card mb-4">
      <h2>Evidence and audit</h2>
      <p>${escapeHtml(screen.evidenceContract)}</p>
    </section>

    <section class="card mb-4">
      <h2>Adverse states and recovery</h2>
      <h3>Mandatory adverse states</h3>
      ${bullets(iaList(screen.adverseStates))}
      <h3>Human fallback</h3>
      <p>${escapeHtml(screen.recoveryRoute)}</p>
    </section>

    <section class="card mb-4">
      <h2>Acceptance</h2>
      <p><strong>${escapeHtml(screen.acceptanceId)}</strong></p>
      <p>${escapeHtml(screen.acceptanceCriterion)}</p>
      <p class="text-muted">${escapeHtml(screen.authority)}</p>
    </section>

    ${
      hosted.length === 0
        ? ""
        : `<section class="card mb-4">
      <h2>Hosted states on this screen</h2>
      <ul>${hosted.map(renderHostedContract).join("")}</ul>
    </section>`
    }

    ${renderIAProvenance(screen)}
  </article>
  `.trim();
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
