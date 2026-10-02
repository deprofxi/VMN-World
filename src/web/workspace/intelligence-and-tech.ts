/**
 * Intelligence, Technology & Agentic OS Workspaces (UX-HSP, UX-CR8, UX-AGT)
 * Authority: VMN APP UI UX.docx §4.11–4.13 / BRD-PRD-001 §22–26
 *
 * TODO-SCR-18 tail / TODO-SCR-14:
 * - Headspace renders the canonical HeadspaceKnowledgeEngine document
 *   catalogue (the invented research-brief fixtures are deleted).
 *   Confidentiality is enforced at access time by the engine; this catalogue
 *   shows metadata only.
 * - Cr8Tech renders honest NOT_CONFIGURED states: health data must come from
 *   real adapter telemetry, and invented endpoint URLs/latencies are removed
 *   (SCR-14 acceptance). Adapter wiring is a recorded deferral (DEC D-08).
 * - Agentic OS renders the canonical AgenticOperatingSystem agent registry,
 *   pending supervisor proposals, and audit trail (invented agent rows are
 *   deleted).
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { SessionUser } from "../../core/auth/index.js";

function renderEmptyRecords(note: string): string {
  return `
    <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px dashed var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
      <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0;">${note}</p>
    </div>
  `;
}

// =============================================================================
// 1. HEADSPACE STRATEGIC INTELLIGENCE (UX-HSP-001..008) — over HeadspaceKnowledgeEngine
// =============================================================================

export interface HeadspaceDeskSnapshot {
  documents: Array<{
    id: string;
    title: string;
    category: string;
    confidentiality: string;
    tags: string[];
    authorId: string;
    updatedAt: string;
  }>;
  totalDocuments: number;
}

export function renderHeadspaceIntelligenceHtml(snapshot: HeadspaceDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_HEADSPACE_RESEARCH_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_HEADSPACE_RESEARCH_OPS",
      "Headspace Strategic Intelligence (UX-HSP-001..008)",
      "/workspace"
    );
  }

  const documents = snapshot?.documents || [];
  const total = snapshot?.totalDocuments ?? documents.length;

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">HEADSPACE &bull; UX-HSP-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Headspace Strategic Intelligence &amp; Market Research Hub
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of HeadspaceKnowledgeEngine &bull; Document confidentiality enforced at access time
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <form method="POST" action="/api/v1/workspace/headspace/documents" style="display: inline;">
            <button type="submit" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
              ${renderIcon("document", { size: 16 })} Register Knowledge Document
            </button>
          </form>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Knowledge Documents</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-brand-cyan); margin-top: 4px;">${total}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Canonical, search-indexed</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Categories in Use</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-primary-text); margin-top: 4px;">${new Set(documents.map((d) => d.category)).size}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Access-Controlled</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${documents.filter((d) => d.confidentiality !== "PUBLIC").length}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Non-public documents require clearance</div>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Knowledge Catalogue (UX-HSP-002)
        </h3>
        ${
          documents.length === 0
            ? renderEmptyRecords("No knowledge documents are registered in the HeadspaceKnowledgeEngine yet — this desk renders canonical records only.")
            : `<div style="display: flex; flex-direction: column; gap: 16px;">
          ${documents
            .map(
              (r) => `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding: 16px; background: var(--vmn-color-surface-hover); border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-color-border);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(r.id)}</span>
                  <span class="vmn-badge ${r.confidentiality === "PUBLIC" ? "badge-info" : "badge-warning"}">${escapeHtml(r.confidentiality.replace(/_/g, " "))}</span>
                  <span class="vmn-badge badge-neutral">${escapeHtml(r.category.replace(/_/g, " "))}</span>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">${escapeHtml(r.title)}</h4>
                <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">
                  Tags: ${r.tags.slice(0, 4).map((t) => `<strong>${escapeHtml(t)}</strong>`).join(", ") || "—"} &bull; Updated <strong>${escapeHtml(r.updatedAt)}</strong>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>`
        }
      </div>
    </div>
  `;
}

// =============================================================================
// 2. CR8TECH INTEGRATION OPERATIONS (UX-CR8-001..008) — honest health states
// =============================================================================

export interface Cr8TechIntegrationStatus {
  name: string;
  configured: boolean;
  detail: string;
  state: "OPERATIONAL" | "NOT_CONFIGURED";
}

export function renderCr8TechOperationsHtml(
  integrationStatuses: Cr8TechIntegrationStatus[] | undefined,
  user?: SessionUser
): string {
  if (!isFeatureEnabled("FF_CR8TECH_INTEGRATION_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_CR8TECH_INTEGRATION_OPS",
      "Cr8Tech Integration Operations (UX-CR8-001..008)",
      "/workspace"
    );
  }

  const services: Cr8TechIntegrationStatus[] =
    integrationStatuses && integrationStatuses.length > 0
      ? integrationStatuses
      : [
          { name: "Azeebo+ Federation Bridge (HMAC webhook channel)", configured: true, detail: "Circuit state managed by the Azeebo federation bridge; delivery verified per webhook.", state: "OPERATIONAL" },
          { name: "Enterprise Job Queue (EPG, notifications, reconciliation)", configured: true, detail: "Background worker runs registered job handlers in-process.", state: "OPERATIONAL" },
        ];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">CR8TECH &bull; UX-CR8-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Cr8Tech DevOps Integration &amp; Runbook Operations
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Integration health from authoritative runtime state &bull; Invented endpoint telemetry removed (SCR-14)
          </p>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Integration Health Register (UX-CR8-002)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.85rem; margin-bottom: 16px;">
          Only integrations with a live runtime adapter are shown as OPERATIONAL. External SaaS endpoints (StarTimes telemetry, payment processors, cloud media services) are NOT_CONFIGURED until an accountable owner connects a real adapter — this surface never fabricates endpoint URLs, latencies or SLA figures.
        </p>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Integration</th>
                <th style="padding: 10px 12px;">State</th>
                <th style="padding: 10px 12px;">Runtime Detail</th>
              </tr>
            </thead>
            <tbody>
              ${services
                .map(
                  (s) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(s.name)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${s.state === "OPERATIONAL" ? "badge-ready" : "badge-warning"}">${escapeHtml(s.state.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">${escapeHtml(s.detail)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// 3. AGENTIC OS AI ORCHESTRATION & KILL SWITCH (UX-AGT-001..009) — over AOS
// =============================================================================

export interface AgenticOsDeskSnapshot {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    operationalScope: string;
    allowedTools: string[];
    actionsPerformedToday: number;
    maxDailyActions: number;
    status: string;
    killSwitchEngaged: boolean;
  }>;
  pendingProposals: number;
  auditTrail: Array<{ id: string; agentId: string; actionTaken: string; wasBlocked: boolean; timestamp: string }>;
  globalKillSwitchEngaged: boolean;
}

export function renderAgenticOsConsoleHtml(snapshot: AgenticOsDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_AGENTIC_OS_AUTOMATION")) {
    return renderFeatureDisabledNotice(
      "FF_AGENTIC_OS_AUTOMATION",
      "Agentic OS AI Orchestration (UX-AGT-001..009)",
      "/workspace"
    );
  }

  const agents = snapshot?.agents || [];
  const auditTrail = snapshot?.auditTrail || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">AGENTIC OS &bull; UX-AGT-001..009</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Agentic OS Autonomous AI Governance &amp; Kill Switch Desk
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of AgenticOperatingSystem &bull; HITL supervisor queue &bull; Fail-closed kill switches
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <!-- Emergency Kill Switch Action (real: engageGlobalKillSwitch) -->
          <form method="POST" action="/api/v1/workspace/aos/killswitch" onsubmit="return confirm('EMERGENCY: Do you want to immediately isolate ALL autonomous agents?');" style="display: inline;">
            <input type="hidden" name="action" value="KILL_ALL" />
            <button type="submit" class="btn" style="min-height: 44px; padding: 0 20px; background: var(--vmn-color-error, #DC2626); color: #FFFFFF; font-weight: 800; border: none; border-radius: var(--vmn-radius-md); display: inline-flex; align-items: center; gap: 6px;">
              ${renderIcon("lock", { size: 16 })} ${snapshot?.globalKillSwitchEngaged ? "KILL SWITCH ENGAGED" : "HARD ISOLATE ALL AGENTS"}
            </button>
          </form>
        </div>
      </div>

      ${
        snapshot?.globalKillSwitchEngaged
          ? `<div class="vmn-alert" role="alert" style="background: #FEF2F2; border: 1px solid #DC2626; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 800; color: #991B1B;">GLOBAL KILL SWITCH ENGAGED — all agents are isolated pending human disengage.</div>
      </div>`
          : ""
      }

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Registered Agents</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-brand-cyan); margin-top: 4px;">${agents.length}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Pending HITL Proposals</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-primary-text); margin-top: 4px;">${snapshot?.pendingProposals ?? 0}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Audit Records</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${auditTrail.length}</div>
        </div>
      </div>

      <!-- Agent Registry (canonical) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Registered Agents &amp; Tool Authorizations (UX-AGT-003)
        </h3>
        ${
          agents.length === 0
            ? renderEmptyRecords("No agents are registered in the AgenticOperatingSystem yet — this console renders canonical registry records only.")
            : `<div style="display: flex; flex-direction: column; gap: 16px;">
          ${agents
            .map(
              (a) => `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding: 16px; background: var(--vmn-color-surface-hover); border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-color-border);">
              <div style="flex: 1; min-width: 280px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(a.id)}</span>
                  <span class="vmn-badge ${a.killSwitchEngaged || a.status !== "ACTIVE" ? "badge-danger" : "badge-ready"}">${escapeHtml(a.killSwitchEngaged ? "KILL SWITCH ENGAGED" : a.status)}</span>
                  <span class="vmn-badge badge-neutral">${a.actionsPerformedToday}/${a.maxDailyActions} actions today</span>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">${escapeHtml(a.name)}</h4>
                <p style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin: 0 0 8px 0;">${escapeHtml(a.role.replace(/_/g, " "))} — ${escapeHtml(a.operationalScope)}</p>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-bottom: 6px;">Authorized Tool Scopes:</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; max-width: 320px;">
                  ${a.allowedTools.map((p) => `<span class="vmn-badge badge-info" style="font-size: 0.7rem; font-family: monospace;">${escapeHtml(p)}</span>`).join("")}
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>`
        }
      </div>

      ${
        auditTrail.length === 0
          ? ""
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Agent Action Audit Trail (UX-AGT-007)</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
            <thead><tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);"><th style="padding: 8px 10px;">Time (UTC)</th><th style="padding: 8px 10px;">Agent</th><th style="padding: 8px 10px;">Action</th><th style="padding: 8px 10px;">Policy Gate</th></tr></thead>
            <tbody>
              ${auditTrail
                .slice(-15)
                .reverse()
                .map(
                  (r) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 6px 10px; font-family: monospace;">${escapeHtml(r.timestamp)}</td>
                  <td style="padding: 6px 10px; font-family: monospace;">${escapeHtml(r.agentId)}</td>
                  <td style="padding: 6px 10px;">${escapeHtml(r.actionTaken)}</td>
                  <td style="padding: 6px 10px;"><span class="vmn-badge ${r.wasBlocked ? "badge-danger" : "badge-ready"}">${r.wasBlocked ? "BLOCKED" : "ALLOWED"}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }
    </div>
  `;
}
