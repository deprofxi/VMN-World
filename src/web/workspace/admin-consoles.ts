/**
 * Access & Membership Administration Console — TODO-SCR-13
 * plus the Approved Routing & Source Mappings console — TODO-SCR-15 (UX-ADM-003)
 *
 * UX-ADM-001: read-only administration over the canonical RBAC matrix — the
 * console renders roles/grants from `ROLE_PERMISSIONS` and the active session
 * registry; it NEVER mutates access (grant/revoke remains an audited
 * invitation + sign-in lifecycle, per UX-SYS-004) and a technical admin does
 * NOT thereby gain access to private business records (UIUX-001 §5.7):
 * /workspace/admin surfaces sit behind SuperAdmin in WORKSPACE_HTML_GUARDS.
 *
 * UX-ADM-003: the approved routing & source-mappings registry backs the
 * HX-01…HX-14 source-provenance fields (src/core/config/source-mappings.ts).
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { SessionUser } from "../../core/auth/index.js";
import { ROLE_PERMISSIONS, EnterpriseRole, PermissionRule } from "../../core/rbac/index.js";
import { listSourceMappings, computeSourceMappingCounts, SourceMapping } from "../../core/config/source-mappings.js";
import { SessionRecord } from "../../core/auth/sessions.js";

// ---------------------------------------------------------------------------
// UX-ADM-001: canonical access & membership projection
// ---------------------------------------------------------------------------

export interface AccessMatrixProjection {
  roles: Array<{
    role: string;
    resources: Array<{ resource: string; actions: string[] }>;
    totalRules: number;
  }>;
  activeSessions: Array<{ userId: string; email: string; deviceLabel: string; createdAt: string; lastSeenAt: string; revoked: boolean }>;
  summary: { roles: number; rules: number; activeSessions: number; sessionsTotal: number };
}

export function projectAccessMatrix(allSessions: SessionRecord[]): AccessMatrixProjection {
  const roles = (Object.keys(ROLE_PERMISSIONS) as EnterpriseRole[]).map((role) => {
    const rules: PermissionRule[] = ROLE_PERMISSIONS[role];
    const byResource = new Map<string, string[]>();
    for (const rule of rules) {
      const list = byResource.get(rule.resource) || [];
      list.push(rule.action);
      byResource.set(rule.resource, list);
    }
    return {
      role,
      totalRules: rules.length,
      resources: [...byResource.entries()]
        .map(([resource, actions]) => ({ resource, actions: [...new Set(actions)] }))
        .sort((a, b) => a.resource.localeCompare(b.resource)),
    };
  });

  const activeSessions = allSessions.map((s) => ({
    userId: s.userId,
    email: s.email,
    deviceLabel: s.deviceLabel,
    createdAt: s.createdAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
    revoked: Boolean(s.revokedAt),
  }));

  return {
    roles,
    activeSessions,
    summary: {
      roles: roles.length,
      rules: roles.reduce((sum, r) => sum + r.totalRules, 0),
      activeSessions: activeSessions.filter((s) => !s.revoked).length,
      sessionsTotal: activeSessions.length,
    },
  };
}

export function renderAccessAdminConsoleHtml(projection: AccessMatrixProjection, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_HUB_DIRECTORY")) {
    return renderFeatureDisabledNotice("FF_SHARED_HUB_DIRECTORY", "Access & Membership Administration (UX-ADM-001)", "/workspace");
  }

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">ADMINISTRATION &bull; UX-ADM-001</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 8px 0 6px 0;">Access &amp; Membership Administration</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
          Read-only projection of the canonical RBAC matrix and active session registry. Grant/revoke flows run exclusively through the audited invitation &amp; sign-in lifecycle (UX-SYS-004) — this console has no mutation path. Viewing this console does NOT confer access to private business records (UIUX-001 §5.7).
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Defined Roles</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${projection.summary.roles}</div>
        </div>
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Permission Rules</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${projection.summary.rules}</div>
        </div>
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Active Sessions</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${projection.summary.activeSessions} / ${projection.summary.sessionsTotal}</div>
        </div>
      </div>

      <div class="vmn-card" style="padding: 24px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); margin-bottom: 24px;">
        <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 16px 0;">Role → Resource Grant Matrix (canonical)</h2>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 8px 10px;">Role</th>
                <th style="padding: 8px 10px;">Grants (resource: actions)</th>
              </tr>
            </thead>
            <tbody>
              ${projection.roles
                .map(
                  (r) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-weight: 700; white-space: nowrap;">${escapeHtml(r.role)}</td>
                  <td style="padding: 8px 10px;">
                    ${r.resources.map((res) => `<span class="vmn-badge badge-neutral" style="font-size: 0.7rem; margin: 1px;">${escapeHtml(res.resource)}: ${res.actions.map((a) => escapeHtml(a)).join("/")}</span>`).join(" ")}
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="vmn-card" style="padding: 24px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg);">
        <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 12px 0;">Active Session Registry</h2>
        ${
          projection.activeSessions.length === 0
            ? `<p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0;">No sessions registered yet.</p>`
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 8px 10px;">Operator</th>
                <th style="padding: 8px 10px;">Device</th>
                <th style="padding: 8px 10px;">Issued (UTC)</th>
                <th style="padding: 8px 10px;">Last Seen</th>
                <th style="padding: 8px 10px;">State</th>
              </tr>
            </thead>
            <tbody>
              ${projection.activeSessions
                .slice(0, 25)
                .map(
                  (s) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(s.email)}</td>
                  <td style="padding: 8px 10px;">${escapeHtml(s.deviceLabel)}</td>
                  <td style="padding: 8px 10px; font-family: monospace;">${escapeHtml(s.createdAt.substring(0, 19).replace("T", " "))}</td>
                  <td style="padding: 8px 10px; font-family: monospace;">${escapeHtml(s.lastSeenAt.substring(0, 19).replace("T", " "))}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge ${s.revoked ? "badge-danger" : "badge-ready"}">${s.revoked ? "REVOKED" : "ACTIVE"}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// UX-ADM-003: Approved Routing & Source Mappings console
// ---------------------------------------------------------------------------

export function renderSourceMappingsConsoleHtml(mappings?: SourceMapping[], user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_HUB_DIRECTORY")) {
    return renderFeatureDisabledNotice("FF_SHARED_HUB_DIRECTORY", "Approved Routing & Source Mappings (UX-ADM-003)", "/workspace");
  }

  const all = mappings || listSourceMappings();
  const counts = computeSourceMappingCounts();

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">ADMINISTRATION &bull; UX-ADM-003</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 8px 0 6px 0;">Approved Routing &amp; Source Mappings</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
          The authoritative registry backing the HX-01…HX-14 source-provenance fields. A provenance field may only render from its approved source; PENDING mappings cannot back any surface (no silent substitution, CCPP §1.5).
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Registered Mappings</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${counts.total}</div>
        </div>
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Approved</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${counts.approved}</div>
        </div>
        <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Pending / N-A</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${counts.pending} / ${counts.notApplicable}</div>
        </div>
      </div>

      <div class="vmn-card" style="padding: 24px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg);">
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 8px 10px;">HX ID</th>
                <th style="padding: 8px 10px;">Field</th>
                <th style="padding: 8px 10px;">Approved Source</th>
                <th style="padding: 8px 10px;">Status</th>
                <th style="padding: 8px 10px;">Authority</th>
              </tr>
            </thead>
            <tbody>
              ${all
                .map(
                  (m) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(m.hxId)}</td>
                  <td style="padding: 8px 10px;">
                    <div style="font-weight: 600;">${escapeHtml(m.field)}</div>
                    <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${escapeHtml(m.description)}</div>
                  </td>
                  <td style="padding: 8px 10px; font-family: monospace; font-size: 0.75rem;">${escapeHtml(m.approvedSource)}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge ${m.status === "APPROVED" ? "badge-ready" : m.status === "PENDING" ? "badge-warning" : "badge-neutral"}">${escapeHtml(m.status)}</span></td>
                  <td style="padding: 8px 10px; font-size: 0.8rem;">${escapeHtml(m.approvedBy || "—")}${m.approvedAt ? `<div style="font-size: 0.7rem; color: var(--vmn-color-secondary-text);">${escapeHtml(m.approvedAt)}</div>` : ""}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
