/**
 * Release Availability Configuration Console (UX-ADM-004)
 * Authority: VMNL-AZP-VMN-UIUX-001 §5.7 / tasks.md §2, §3.21
 *
 * Implements the administrative control center for:
 * - Dynamic runtime feature flag inspection and toggling
 * - Un-deferred operational capabilities monitoring
 * - Safe kill-switch invocation (<500ms latency)
 * - WCAG 2.2 Level AA accessibility conformance
 */

import { getAllFeatureFlags, FeatureFlagKey, FeatureFlagState } from "../../core/feature-flags/index.js";
import { renderIcon } from "../components/index.js";

export function renderAdminFeatureFlagsHtml(filterDomain?: string): string {
  const allFlags = Object.values(getAllFeatureFlags());
  const domains = Array.from(new Set(allFlags.map((f) => f.domain))).sort();

  const filtered = filterDomain
    ? allFlags.filter((f) => f.domain.toLowerCase() === filterDomain.toLowerCase())
    : allFlags;

  const totalCount = allFlags.length;
  const activeCount = allFlags.filter((f) => f.enabled).length;
  const undeferredCount = allFlags.filter((f) => f.isUndeferred).length;

  const domainFilterButtons = [
    `<a href="/admin/feature-flags" class="btn ${!filterDomain ? "btn-primary" : "btn-outline"}" style="min-height:44px; padding:8px 16px; font-size:0.875rem; display:inline-flex; align-items:center;">All (${totalCount})</a>`,
    ...domains.map((dom) => {
      const count = allFlags.filter((f) => f.domain === dom).length;
      const isSelected = filterDomain?.toLowerCase() === dom.toLowerCase();
      return `<a href="/admin/feature-flags?domain=${encodeURIComponent(dom)}" class="btn ${isSelected ? "btn-primary" : "btn-outline"}" style="min-height:44px; padding:8px 16px; font-size:0.875rem; display:inline-flex; align-items:center;">${dom} (${count})</a>`;
    }),
  ].join("\n");

  const cardsHtml = filtered
    .map((f) => {
      const isEnabled = f.enabled;
      const statusBadge = isEnabled
        ? `<span style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; padding:4px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700;">ACTIVE (ENABLED)</span>`
        : `<span style="background:#FFF1F2; color:#BE123C; border:1px solid #FECDD3; padding:4px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700;">INACTIVE (DISABLED)</span>`;

      const undeferredBadge = f.isUndeferred
        ? `<span style="background:#FEF3C7; color:#92400E; border:1px solid #FCD34D; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:700; margin-left:8px;">UN-DEFERRED</span>`
        : "";

      const sourceBadge = `<span style="background:#F1F5F9; color:#475569; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">SOURCE: ${f.source}</span>`;

      return `
      <article class="card flag-card" style="display:flex; flex-direction:column; justify-content:space-between; border-left: 4px solid ${isEnabled ? "#10B981" : "#EF4444"}; padding: var(--vmn-space-6); background: var(--vmn-surface-card); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-family:monospace; font-weight:700; font-size:0.9rem; color:#0284C7; background:#E0F2FE; padding:3px 8px; border-radius:4px;">${f.key}</span>
              ${undeferredBadge}
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
          <h3 style="font-size:1.1rem; font-weight:700; color:var(--vmn-text-primary); margin-bottom:6px;">
            ${f.domain} &mdash; <span style="font-size:0.875rem; color:var(--vmn-text-secondary); font-weight:400;">${f.targetScreens}</span>
          </h3>
          <p style="font-size:0.9rem; color:var(--vmn-text-secondary); margin-bottom:12px; line-height:1.5;">
            ${f.description}
          </p>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:10px; margin-bottom:16px;">
            <div style="font-size:0.75rem; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:4px;">Kill-Switch & Fallback Policy</div>
            <div style="font-size:0.85rem; color:#334155;">${f.killSwitchPolicy}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E2E8F0; padding-top:12px; flex-wrap:wrap; gap:8px;">
          <div>${sourceBadge}</div>
          <form method="POST" action="/api/v1/feature-flags/${f.key}/toggle" style="margin:0;">
            <input type="hidden" name="enabled" value="${isEnabled ? "false" : "true"}" />
            <input type="hidden" name="redirect" value="/admin/feature-flags${filterDomain ? `?domain=${encodeURIComponent(filterDomain)}` : ""}" />
            <button type="submit" class="btn ${isEnabled ? "btn-secondary button button--secondary" : "btn-primary button button--primary"}" style="min-height:44px; padding:0 16px; font-weight:600;">
              ${isEnabled ? "Disable (Kill Switch)" : "Enable Feature"}
            </button>
          </form>
        </div>
      </article>
      `;
    })
    .join("\n");

  return `
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="font-family:monospace; background:#0284C7; color:white; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.85rem;">UX-ADM-004</span>
          <span style="color:var(--vmn-text-secondary); font-size:0.9rem;">Enterprise Governance & Administration</span>
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 800; color: var(--vmn-text-primary); margin-bottom: 12px;">
          Release Availability & Feature Flag Console
        </h1>
        <p style="font-size: 1.1rem; color: var(--vmn-text-secondary); max-width: 800px; line-height: 1.6;">
          Zero-Deferral Execution Control Hub. All 225 screens and 10 domain operational workflows are active in code and gated via runtime evaluation.
        </p>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-top:24px;">
          <div class="card" style="padding:16px; border-left:4px solid #0284C7;">
            <div style="font-size:0.85rem; color:var(--vmn-text-secondary); font-weight:600;">Total Registered Flags</div>
            <div style="font-size:2rem; font-weight:800; color:var(--vmn-text-primary);">${totalCount}</div>
          </div>
          <div class="card" style="padding:16px; border-left:4px solid #10B981;">
            <div style="font-size:0.85rem; color:var(--vmn-text-secondary); font-weight:600;">Currently Active (Enabled)</div>
            <div style="font-size:2rem; font-weight:800; color:#10B981;">${activeCount}</div>
          </div>
          <div class="card" style="padding:16px; border-left:4px solid #F59E0B;">
            <div style="font-size:0.85rem; color:var(--vmn-text-secondary); font-weight:600;">Un-Deferred Capabilities</div>
            <div style="font-size:2rem; font-weight:800; color:#F59E0B;">${undeferredCount}</div>
          </div>
        </div>
      </header>

      <section style="margin-bottom: var(--vmn-space-6);">
        <h2 style="font-size:1.15rem; font-weight:700; margin-bottom:12px; color:var(--vmn-text-primary);">Filter by Operational Domain</h2>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${domainFilterButtons}
        </div>
      </section>

      <section style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap:20px;">
        ${cardsHtml}
      </section>
    </div>
  `;
}
