/**
 * Super Admin System Configuration Console
 * Authority: VMNL-AZP-VMN-CCPP-001 §9 / PRD §12
 *
 * Strictly restricted to SuperAdmin operators. Governs network identity,
 * security & audit policies, broadcast safeguards, and platform operating mode.
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import type { SessionUser } from "../../core/auth/index.js";
import type { EnvironmentPosture, SystemConfig } from "../../core/config/system-config.js";

export interface SystemConfigPageContext {
  config: SystemConfig;
  posture: EnvironmentPosture;
  csrfToken: string;
  user: SessionUser;
  notice?: { tone: "success" | "info" | "error"; message: string };
}

function renderToggleRow(params: {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
}): string {
  return `
    <label class="vmn-sysconfig-toggle" for="${escapeHtml(params.id)}">
      <div class="vmn-sysconfig-toggle-copy">
        <span class="vmn-sysconfig-toggle-title">${escapeHtml(params.label)}</span>
        <span class="vmn-sysconfig-toggle-desc">${escapeHtml(params.description)}</span>
      </div>
      <input
        id="${escapeHtml(params.id)}"
        name="${escapeHtml(params.name)}"
        type="checkbox"
        value="true"
        class="vmn-sysconfig-checkbox"
        ${params.checked ? "checked" : ""}
      />
    </label>
  `;
}

export function renderSystemConfigHtml(ctx: SystemConfigPageContext): string {
  const { config, posture, csrfToken, user, notice } = ctx;

  const alertHtml = notice
    ? `<div class="vmn-sysconfig-alert vmn-sysconfig-alert-${escapeHtml(notice.tone)}" role="${notice.tone === "error" ? "alert" : "status"}">
        ${renderIcon(notice.tone === "error" ? "alert" : notice.tone === "success" ? "check" : "info", { size: 18 })}
        <span>${escapeHtml(notice.message)}</span>
      </div>`
    : "";

  return `
    <article class="vmn-sysconfig-page" aria-labelledby="sys-cfg-heading">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5 mb-3">
        <a href="/" class="text-muted no-underline">Home</a>
        <span>/</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a>
        <span>/</span>
        <a href="/workspace/admin/access" class="text-muted no-underline">Administration</a>
        <span>/</span>
        <span aria-current="page" class="text-primary font-semibold">System Configuration</span>
      </nav>

      <!-- Super Admin Suite Switcher -->
      <nav aria-label="Super Admin Administration Suite" class="vmn-admin-suite-nav mb-4">
        <a href="/admin/system-config" class="vmn-admin-suite-link active" aria-current="page">
          ${renderIcon("settings", { size: 15 })}
          <span>System Configuration</span>
        </a>
        <a href="/admin/feature-flags" class="vmn-admin-suite-link">
          ${renderIcon("bolt", { size: 15 })}
          <span>Feature Flags</span>
        </a>
        <a href="/workspace/admin/users" class="vmn-admin-suite-link">
          ${renderIcon("users", { size: 15 })}
          <span>Users &amp; Roles</span>
        </a>
        <a href="/workspace/admin/access" class="vmn-admin-suite-link">
          ${renderIcon("shield", { size: 15 })}
          <span>Access Matrix</span>
        </a>
        <a href="/workspace/admin/audit" class="vmn-admin-suite-link">
          ${renderIcon("document", { size: 15 })}
          <span>Audit Trail</span>
        </a>
      </nav>

      <!-- Header Card -->
      <header class="vmn-sysconfig-hero mb-4">
        <div class="vmn-sysconfig-hero-top">
          <div class="vmn-sysconfig-badges">
            <span class="vmn-badge badge-warning">
              ${renderIcon("lock", { size: 13 })}
              <span>SUPER ADMIN ACCESS ONLY</span>
            </span>
            <span class="vmn-badge badge-info">Revision #${escapeHtml(config.revision)}</span>
          </div>
          <div class="vmn-sysconfig-meta">
            <span>Operator: <strong>${escapeHtml(user.email || user.userId)}</strong></span>
            <span>Last saved: <time datetime="${escapeHtml(config.updatedAt)}">${escapeHtml(config.updatedAt === new Date(0).toISOString() ? "Factory defaults" : config.updatedAt.replace("T", " ").slice(0, 19) + " UTC")}</time></span>
          </div>
        </div>
        <h1 id="sys-cfg-heading" class="vmn-sysconfig-title">Enterprise System Configuration</h1>
        <p class="vmn-sysconfig-subtitle">
          Central control plane for corporate identity, security and audit governance, broadcast playout safeguards, and global operating banners. Every modification is cryptographically signed in the audit ledger.
        </p>
      </header>

      ${alertHtml}

      <form method="POST" action="/api/v1/admin/system-config" class="vmn-sysconfig-form" id="vmn-system-config-form">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}" />
        <input type="hidden" name="redirect" value="/admin/system-config" />

        <div class="vmn-sysconfig-grid">
          <!-- Section 1: Brand & Corporate Identity -->
          <fieldset class="vmn-card vmn-sysconfig-card">
            <legend class="vmn-sysconfig-card-header">
              <span class="vmn-sysconfig-card-icon">${renderIcon("tv", { size: 18 })}</span>
              <span>
                <strong>Brand &amp; Corporate Identity</strong>
                <small>Server-rendered identity for headers, footers, and public portals</small>
              </span>
            </legend>

            <div class="vmn-sysconfig-fields">
              <div class="vmn-form-field">
                <label class="vmn-label" for="sys-cfg-brand-name">Organisation Display Name</label>
                <input id="sys-cfg-brand-name" name="brandName" type="text" class="vmn-input" required minlength="2" maxlength="120" value="${escapeHtml(config.brandName)}" />
              </div>

              <div class="vmn-sysconfig-row-2">
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-brand-short">Header Brand Mark</label>
                  <input id="sys-cfg-brand-short" name="brandShort" type="text" class="vmn-input" required minlength="2" maxlength="32" value="${escapeHtml(config.brandShort)}" />
                </div>
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-rc">Corporate RC Number</label>
                  <input id="sys-cfg-rc" name="companyRcNumber" type="text" class="vmn-input" maxlength="40" placeholder="Optional e.g. RC-1234567" value="${escapeHtml(config.companyRcNumber)}" />
                </div>
              </div>

              <div class="vmn-form-field">
                <label class="vmn-label" for="sys-cfg-tagline">Footer Network Tagline</label>
                <input id="sys-cfg-tagline" name="tagline" type="text" class="vmn-input" required minlength="4" maxlength="240" value="${escapeHtml(config.tagline)}" />
              </div>

              <div class="vmn-form-field">
                <label class="vmn-label" for="sys-cfg-support-email">Support Contact Email</label>
                <input id="sys-cfg-support-email" name="supportEmail" type="email" class="vmn-input" required maxlength="120" value="${escapeHtml(config.supportEmail)}" />
              </div>

              <div class="vmn-form-field">
                <label class="vmn-label" for="sys-cfg-logo-url">Brand Logo URL or Data URI (Optional)</label>
                <input id="sys-cfg-logo-url" name="logoUrl" type="text" class="vmn-input font-mono text-xs" placeholder="Leave blank for built-in vector brand mark" value="${escapeHtml(config.logoUrl || "")}" />
                <div class="vmn-sysconfig-logo-tools">
                  <label class="btn btn-outline btn-sm vmn-sysconfig-upload-label" for="sys-cfg-logo-file">
                    ${renderIcon("upload", { size: 14 })}
                    <span>Upload Image File</span>
                  </label>
                  <input id="sys-cfg-logo-file" type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" class="sr-only" />
                  <button type="button" id="sys-cfg-logo-clear" class="btn btn-outline btn-sm">Use Default Emblem</button>
                </div>
                <div class="vmn-sysconfig-logo-preview" id="sys-cfg-logo-preview">
                  ${
                    config.logoUrl
                      ? `<img src="${escapeHtml(config.logoUrl)}" alt="Configured Brand Logo Preview" class="vmn-sysconfig-preview-img" />`
                      : `<span class="vmn-badge badge-neutral">Built-in vector emblem active</span>`
                  }
                </div>
              </div>
            </div>
          </fieldset>

          <!-- Section 2: Security, Identity & Audit Policy -->
          <fieldset class="vmn-card vmn-sysconfig-card">
            <legend class="vmn-sysconfig-card-header">
              <span class="vmn-sysconfig-card-icon">${renderIcon("shield", { size: 18 })}</span>
              <span>
                <strong>Security, Identity &amp; Audit Policy</strong>
                <small>Session lifetimes, multi-factor thresholds, and statutory log retention</small>
              </span>
            </legend>

            <div class="vmn-sysconfig-fields">
              <div class="vmn-sysconfig-row-2">
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-session-ttl">Session Lifetime (Hours)</label>
                  <input id="sys-cfg-session-ttl" name="sessionTtlHours" type="number" min="1" max="168" class="vmn-input" required value="${escapeHtml(config.sessionTtlHours)}" />
                </div>
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-audit-retention">Audit Log Retention (Days)</label>
                  <input id="sys-cfg-audit-retention" name="auditRetentionDays" type="number" min="90" max="3650" class="vmn-input" required value="${escapeHtml(config.auditRetentionDays)}" />
                </div>
              </div>

              ${renderToggleRow({
                id: "sys-cfg-admin-mfa",
                name: "requireMfaForAdmins",
                label: "Enforce MFA for Administrative Roles",
                description: "Require multi-factor verification challenges for privileged operational desks.",
                checked: config.requireMfaForAdmins,
              })}

              ${renderToggleRow({
                id: "sys-cfg-public-signup",
                name: "allowPublicSignUp",
                label: "Allow Self-Service Account Registration",
                description: "When disabled, operator onboarding runs exclusively through signed invitations.",
                checked: config.allowPublicSignUp,
              })}
            </div>
          </fieldset>

          <!-- Section 3: Broadcast & Playout Safeguards -->
          <fieldset class="vmn-card vmn-sysconfig-card">
            <legend class="vmn-sysconfig-card-header">
              <span class="vmn-sysconfig-card-icon">${renderIcon("broadcast", { size: 18 })}</span>
              <span>
                <strong>Broadcast &amp; Playout Safeguards</strong>
                <small>Transmission schedule locks, brand separation, and rights protection</small>
              </span>
            </legend>

            <div class="vmn-sysconfig-fields">
              <div class="vmn-sysconfig-row-2">
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-lock-hours">Schedule Lock Horizon (Hours)</label>
                  <input id="sys-cfg-lock-hours" name="scheduleLockWindowHours" type="number" min="1" max="168" class="vmn-input" required value="${escapeHtml(config.scheduleLockWindowHours)}" />
                </div>
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-separation">Competitor Ad Separation (Min)</label>
                  <input id="sys-cfg-separation" name="competitorSeparationMinutes" type="number" min="5" max="60" class="vmn-input" required value="${escapeHtml(config.competitorSeparationMinutes)}" />
                </div>
              </div>

              ${renderToggleRow({
                id: "sys-cfg-rights-guard",
                name: "failClosedRightsEnforcement",
                label: "Protected Rights Clearance Enforcement",
                description: "Block linear transmission slots automatically unless verified rights cover territory and window.",
                checked: config.failClosedRightsEnforcement,
              })}

              ${renderToggleRow({
                id: "sys-cfg-filler",
                name: "emergencyFillerFallbackEnabled",
                label: "Emergency Filler Failover Automation",
                description: "Permit MCR supervisors to engage pre-cleared house reels during upstream feed faults.",
                checked: config.emergencyFillerFallbackEnabled,
              })}
            </div>
          </fieldset>

          <!-- Section 4: Platform Operating Mode & Notices -->
          <fieldset class="vmn-card vmn-sysconfig-card">
            <legend class="vmn-sysconfig-card-header">
              <span class="vmn-sysconfig-card-icon">${renderIcon("activity", { size: 18 })}</span>
              <span>
                <strong>Platform Operating Mode &amp; Notices</strong>
                <small>Header network beacon label, federation cadence, and site announcement bar</small>
              </span>
            </legend>

            <div class="vmn-sysconfig-fields">
              <div class="vmn-sysconfig-row-2">
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-status-label">Network Status Beacon Label</label>
                  <select id="sys-cfg-status-label" name="broadcastStatusLabel" class="vmn-input">
                    <option value="LIVE BROADCAST" ${config.broadcastStatusLabel === "LIVE BROADCAST" ? "selected" : ""}>LIVE BROADCAST</option>
                    <option value="MAINTENANCE WINDOW" ${config.broadcastStatusLabel === "MAINTENANCE WINDOW" ? "selected" : ""}>MAINTENANCE WINDOW</option>
                    <option value="SANDBOX MODE" ${config.broadcastStatusLabel === "SANDBOX MODE" ? "selected" : ""}>SANDBOX MODE</option>
                  </select>
                </div>
                <div class="vmn-form-field">
                  <label class="vmn-label" for="sys-cfg-heartbeat">Federation Heartbeat (Sec)</label>
                  <input id="sys-cfg-heartbeat" name="federationHeartbeatIntervalSec" type="number" min="10" max="300" class="vmn-input" required value="${escapeHtml(config.federationHeartbeatIntervalSec)}" />
                </div>
              </div>

              ${renderToggleRow({
                id: "sys-cfg-banner-enabled",
                name: "maintenanceBannerEnabled",
                label: "Display Global Operations Notice Banner",
                description: "Publishes an informational announcement ribbon directly beneath the site header.",
                checked: config.maintenanceBannerEnabled,
              })}

              <div class="vmn-form-field">
                <label class="vmn-label" for="sys-cfg-banner-msg">Global Operations Notice Message</label>
                <input id="sys-cfg-banner-msg" name="maintenanceBannerMessage" type="text" class="vmn-input" maxlength="280" placeholder="e.g. Scheduled broadcast schedule sync window at 02:00 WAT" value="${escapeHtml(config.maintenanceBannerMessage)}" />
              </div>
            </div>
          </fieldset>
        </div>

        <div class="vmn-sysconfig-actions">
          <button type="submit" class="btn btn-primary">
            ${renderIcon("check", { size: 16 })}
            <span>Save System Configuration</span>
          </button>
        </div>
      </form>

      <div class="vmn-sysconfig-bottom-grid mt-4">
        <!-- Read-only Runtime Environment Posture (Zero Secrets Exposed) -->
        <section class="vmn-card vmn-sysconfig-card" aria-labelledby="sys-cfg-posture-heading">
          <div class="vmn-sysconfig-card-header">
            <span class="vmn-sysconfig-card-icon">${renderIcon("monitor", { size: 18 })}</span>
            <span>
              <strong id="sys-cfg-posture-heading">Runtime Environment Posture (Read-Only)</strong>
              <small>Verified deployment readiness signals — cryptographic keys and credentials are never rendered</small>
            </span>
          </div>
          <div class="vmn-sysconfig-posture-grid">
            <div class="vmn-sysconfig-posture-item">
              <span>Environment</span>
              <strong>${escapeHtml(posture.nodeEnv)}</strong>
            </div>
            <div class="vmn-sysconfig-posture-item">
              <span>HTTP Port</span>
              <strong>${escapeHtml(posture.port)}</strong>
            </div>
            <div class="vmn-sysconfig-posture-item">
              <span>Storage Driver</span>
              <strong>${escapeHtml(posture.storageDriver)}</strong>
            </div>
            <div class="vmn-sysconfig-posture-item">
              <span>Primary Database</span>
              <strong>${posture.databaseConfigured ? "Configured" : "Not configured"}</strong>
            </div>
            <div class="vmn-sysconfig-posture-item">
              <span>Distributed Cache</span>
              <strong>${posture.redisConfigured ? "Redis Active" : "In-Memory Fallback"}</strong>
            </div>
            <div class="vmn-sysconfig-posture-item">
              <span>Carriage Evidence</span>
              <strong>${posture.carriageVerified ? "Verified" : "Unverified"}</strong>
            </div>
          </div>
        </section>

        <!-- Factory Reset Control -->
        <section class="vmn-card vmn-sysconfig-card vmn-sysconfig-danger-card" aria-labelledby="sys-cfg-reset-heading">
          <div class="vmn-sysconfig-card-header">
            <span class="vmn-sysconfig-card-icon">${renderIcon("refresh", { size: 18 })}</span>
            <span>
              <strong id="sys-cfg-reset-heading">Restore Factory Defaults</strong>
              <small>Resets all brand, security, and safeguard settings back to platform baseline</small>
            </span>
          </div>
          <p class="text-xs text-muted m-0 mb-3">
            Use this action if a configuration change causes unexpected behaviour. Current values will be replaced with defaults and the reset event will be recorded in the audit log.
          </p>
          <form method="POST" action="/api/v1/admin/system-config/reset">
            <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}" />
            <input type="hidden" name="redirect" value="/admin/system-config" />
            <button type="submit" class="btn btn-outline">
              ${renderIcon("refresh", { size: 15 })}
              <span>Reset to Factory Defaults</span>
            </button>
          </form>
        </section>
      </div>
    </article>
  `;
}
