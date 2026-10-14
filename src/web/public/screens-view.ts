/**
 * Broadcast Operational Screens Catalog & Detail Views (SCR-BCST-01 to 33)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46)
 *
 * Implements:
 * - Visual grid catalog of all 33 screen surfaces
 * - Operational role filtering (ExecutiveLeader, BroadcastDirector, RightsManager, TrafficManager, PlayoutOperator, FinanceController)
 * - Individual screen surface detail view with route mapping, permitted actions, and simulated test actions
 * - Contrast-checked tokens, touch targets >= 44x44px, semantic HTML (automated checks; manual §7.5 coverage NOT_RUN)
 */

import { BROADCAST_SCREEN_INVENTORY, getScreenDescriptorById } from "../../modules/broadcast/screens/index.js";
import { renderIcon } from "../components/index.js";

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ExecutiveLeader: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  BroadcastDirector: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  RightsManager: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  TrafficManager: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  PlayoutOperator: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  FinanceController: { bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
};

function getRoleBadge(role: string): string {
  const style = ROLE_COLORS[role] || { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" };
  return `<span class="vmn-role-badge" style="background:${style.bg}; color:${style.text}; border:1px solid ${style.border}; padding:4px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700;">${role}</span>`;
}

export function renderScreensCatalogHtml(selectedRole?: string): string {
  const allRoles = Array.from(new Set(BROADCAST_SCREEN_INVENTORY.map((s) => s.primaryRole)));
  const filtered = selectedRole
    ? BROADCAST_SCREEN_INVENTORY.filter((s) => s.primaryRole.toLowerCase() === selectedRole.toLowerCase())
    : BROADCAST_SCREEN_INVENTORY;

  const roleFilterButtons = [
    `<a href="/broadcast/screens" class="btn ${!selectedRole ? "btn-primary" : "btn-outline"}" style="min-height:44px; padding:8px 16px; font-size:0.85rem; display:inline-flex; align-items:center;">All (${BROADCAST_SCREEN_INVENTORY.length})</a>`,
    ...allRoles.map((role) => {
      const count = BROADCAST_SCREEN_INVENTORY.filter((s) => s.primaryRole === role).length;
      const isSelected = selectedRole?.toLowerCase() === role.toLowerCase();
      return `<a href="/broadcast/screens?role=${encodeURIComponent(role)}" class="btn ${isSelected ? "btn-primary" : "btn-outline"}" style="min-height:44px; padding:8px 16px; font-size:0.85rem; display:inline-flex; align-items:center;">${role} (${count})</a>`;
    }),
  ].join("\n");

  const cardsHtml = filtered
    .map((s) => {
      const actions = s.permittedActions
        .map((a) => `<span class="s-X260Zgjd7H">${a}</span>`)
        .join(" ");

      return `
      <article class="card screen-card s-spUOT7_p0i">
        <div>
          <div class="s-NUy8-yU6ON">
            <span class="s-t92pYwkrKO">${s.screenId}</span>
            <span class="s-54HfO3lJ9A">#${s.screenNumber}</span>
          </div>
          <h3 class="s-XSOc80whyS">
            <a href="/broadcast/screens/${s.screenId}" style="text-decoration:none; color:var(--vmn-text-main); font-weight:700;">${s.name}</a>
          </h3>
          <p class="s-q7pcEDpDO4">${s.description}</p>
        </div>
        
        <div>
          <div class="s-PvH6GqES8f">
            <code class="s-X2rkPCg1Qw">${s.route}</code>
          </div>
          <div class="s-wUW2k9hp6I">
            ${getRoleBadge(s.primaryRole)}
          </div>
          <div class="s-H3bqxJt2a0">
            ${actions}
          </div>
          <div class="s-UK2dEq5_xu">
            <a href="/broadcast/screens/${s.screenId}" class="btn btn-outline" style="flex:1; min-height:44px; text-align:center; font-size:0.875rem;">View Spec</a>
            <a href="${s.route.includes(":") ? `/broadcast/screens/${s.screenId}` : s.route}" class="btn btn-primary" style="flex:1; min-height:44px; text-align:center; font-size:0.875rem;">Launch &rarr;</a>
          </div>
        </div>
      </article>
      `;
    })
    .join("\n");

  return `
  <section class="s-hJqXKfH1_e">
    <div class="s-eNztNGULjh">
      <div>
        <nav class="s-SFIks6VJ6b" aria-label="Breadcrumb">
          <a class="s-v8cyEOQoqd" href="/">Home</a> &gt; 
          <a class="s-v8cyEOQoqd" href="/broadcast/dashboard">Broadcast</a> &gt; 
          <span>Screens</span>
        </nav>
        <h1 class="s-6qUvL7-0sm">Broadcast Operational Screen Inventory</h1>
        <p class="s-NLOlqgzjPV">
          Complete 33-screen operational surface registry mandated by <strong>VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46)</strong>.
        </p>
      </div>
      <div class="s-iJRgfp58Su">
        <span class="vmn-badge badge-warning" title="Measured 2026-10-11 by tests/unit/broadcast-provenance-coverage.test.ts: all 33 registered surfaces serve the demonstration-data banner and the provenance-badged KPI strip; 1 (SCR-BCST-02, channel registry) emits a live SOURCE: badge; 0 are fully engine-sourced, because no engine snapshot reaches the renderer.">33 registered &middot; 0 fully engine-sourced &middot; 1 live-source badge &middot; demonstration data</span>
        <a href="/broadcast/dashboard" class="btn btn-primary">&larr; Operator Dashboard</a>
      </div>
    </div>

    <!-- Summary Statistics Grid -->
    <div class="grid-3 s-KRt7uwFSzR">
      <div class="card stat-box">
        <span class="stat-val">33</span>
        <span class="stat-lbl">Mandated Screen Surfaces (R1.2A §46)</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">17</span>
        <span class="stat-lbl">Broadcast Capability Roles (R1.2A §48)</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">Sandbox</span>
        <span class="stat-lbl">Operating Environment &mdash; S2 tier claim withdrawn pending TSK-06</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card s-zzcDR1Eaak">
      <div class="s--DZbB8jCDJ">
        <span class="s-ORCo37wOlQ">Filter by Operational Role:</span>
        <div class="s-g441DDTE9g">
          ${roleFilterButtons}
        </div>
      </div>
    </div>

    <!-- Screen Cards Grid -->
    <div class="s--l6eWBnke5">
      ${cardsHtml}
    </div>
  </section>
  `;
}

export function renderScreenDetailHtml(screenId: string): string {
  const descriptor = getScreenDescriptorById(screenId);

  if (!descriptor) {
    return `
    <section class="card s-eZw0sOrsT9">
      <div class="s-2zt_VCDZro">${renderIcon("alert", { size: 48 })}</div>
      <h1 class="s-ZUjcf9NYmn">Screen Surface Not Found</h1>
      <p class="s-PID--WkAe7">
        No operational screen was found matching identifier "<strong>${screenId}</strong>" in the VMNL R1.2A (§46) inventory.
      </p>
      <a href="/broadcast/screens" class="btn btn-primary s-YWPkqV3VsB">Return to Screen Inventory</a>
    </section>
    `;
  }

  const roleStyle = ROLE_COLORS[descriptor.primaryRole] || { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" };
  const actionsList = descriptor.permittedActions
    .map(
      (a) => `
      <li class="s-5Pe8l22-rN">
        <span class="s-Vj9aNyBJeO">&bull;</span>
        <code class="s-MO_TsUeSK7">${a}</code>
      </li>
    `
    )
    .join("");

  const prevScreenNum = descriptor.screenNumber > 1 ? descriptor.screenNumber - 1 : null;
  const nextScreenNum = descriptor.screenNumber < 33 ? descriptor.screenNumber + 1 : null;

  const prevLink = prevScreenNum
    ? `<a href="/broadcast/screens/SCR-BCST-${String(prevScreenNum).padStart(2, "0")}" class="btn btn-outline" style="font-size:0.875rem;">&larr; Prev (#${prevScreenNum})</a>`
    : `<span class="btn btn-outline s-fUoqNgXNkS">&larr; Prev</span>`;

  const nextLink = nextScreenNum
    ? `<a href="/broadcast/screens/SCR-BCST-${String(nextScreenNum).padStart(2, "0")}" class="btn btn-outline" style="font-size:0.875rem;">Next (#${nextScreenNum}) &rarr;</a>`
    : `<span class="btn btn-outline s-fUoqNgXNkS">Next &rarr;</span>`;

  return `
  <section class="s-Ap7e8x-cvm">
    <!-- Top Breadcrumbs & Nav -->
    <div class="s-7siY-5mpRK">
      <nav class="s-37h9gF_4Xa" aria-label="Breadcrumb">
        <a class="s-v8cyEOQoqd" href="/">Home</a> &gt; 
        <a class="s-v8cyEOQoqd" href="/broadcast/dashboard">Broadcast</a> &gt; 
        <a class="s-v8cyEOQoqd" href="/broadcast/screens">Screens</a> &gt; 
        <span>${descriptor.screenId}</span>
      </nav>
      <div class="s-UK2dEq5_xu">
        ${prevLink}
        <a href="/broadcast/screens" class="btn btn-outline s-5ZYJkVWULV">All Screens</a>
        ${nextLink}
      </div>
    </div>

    <!-- Main Screen Header Card -->
    <article class="card s-ZOFAYSaIa1">
      <div class="s-oQe8fPOoPX">
        <div>
          <div class="s-8BhWLFy0Sw">
            <span class="s-kgjsJK4ewZ">
              ${descriptor.screenId}
            </span>
            <span class="s-vRbL09if9G">
              Screen #${descriptor.screenNumber} of 33
            </span>
          </div>
          <h1 class="s-AB_wCtDT5L">
            ${descriptor.name}
          </h1>
          <p class="s-EdjnyvpuOU">
            ${descriptor.description}
          </p>
        </div>
        <div class="s-numIUTWRO1">
          ${getRoleBadge(descriptor.primaryRole)}
          <span class="vmn-badge badge-neutral">PRD R1.2A §46 registered &mdash; data-source wiring NOT_VERIFIED</span>
        </div>
      </div>

      <hr class="s-NjQUWrb1vc" />

      <!-- Specifications Grid -->
      <div class="s-tjxm4VdntH">
        <div>
          <h2 class="s-htKo0vsOr5">
            Operational Route / URI
          </h2>
          <code class="s-M4HT1j7Y4a">
            ${descriptor.route}
          </code>
        </div>
        <div>
          <h2 class="s-htKo0vsOr5">
            Primary Responsible Role
          </h2>
          <div style="padding:10px 14px; background:${roleStyle.bg}; border:1px solid ${roleStyle.border}; border-radius:6px; color:${roleStyle.text}; font-weight:700; font-size:0.95rem;">
            ${descriptor.primaryRole}
          </div>
        </div>
      </div>

      <div class="s-nrEl9S9lpH">
        <h2 class="s-htKo0vsOr5">
          Permitted RBAC Actions
        </h2>
        <ul class="s-0toYtkukcP">
          ${actionsList}
        </ul>
      </div>

      <!-- Action Footer -->
      <div class="s-woxFD2qJM8">
        <div>
          <span class="s-37h9gF_4Xa">
            Governing Specification: <strong>VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§46)</strong>
          </span>
        </div>
        <div class="s-cSCcrniXzw">
          <a href="/broadcast/screens" class="btn btn-outline s-Ts1j-uJVgn">&larr; Back to Inventory</a>
          <a href="${descriptor.route.includes(":") ? `/broadcast/dashboard` : descriptor.route}" class="btn btn-primary" style="min-height:44px;">
            Launch Operational Surface &rarr;
          </a>
        </div>
      </div>
    </article>

    <!-- Operational Context & Registration Status -->
    <div class="card s-fuXrHI51DM">
      <h3 class="s-XlAQYZBF-N">
        Registration &amp; gate status
      </h3>
      <p class="s-YgZVN-kWD2">
        This surface is <strong>registered</strong> in the broadcast screen inventory. Registration is not clearance: design gate <strong>DG-RL1-06</strong> (broadcast operational screens) is <strong>OPEN</strong> &mdash; owner Broadcast Director, review expiry 2026-10-31 &mdash; and no tri-party sign-off has been recorded for it. Record: <code>docs/audit/design-gate-closure-records.md</code>.
      </p>
      <div class="s-g441DDTE9g">
        <span class="vmn-badge badge-warning">DG-RL1-06 OPEN</span>
        <span class="vmn-badge badge-neutral">Gate 0&ndash;3 clearance NOT_RECORDED</span>
      </div>
    </div>
  </section>
  `;
}
