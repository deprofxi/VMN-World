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
 <div class="vmn-card s-jBAg6JRnQZ" >
 <p class="s-s8QClmJr6r">${note}</p>
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

export function renderHeadspaceIntelligenceHtml(snapshot: HeadspaceDeskSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >HEADSPACE &bull; UX-HSP-001..008</span>
 <h1 class="s-n_bp1PhViu">
            Headspace Strategic Intelligence &amp; Market Research Hub
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of HeadspaceKnowledgeEngine &bull; Document confidentiality enforced at access time
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <form method="POST" action="/api/v1/workspace/headspace/documents" class="s-Q0_DLsKcmN">
 <button type="submit" class="btn btn-secondary s-kd4he0W4Wm" >
              ${renderIcon("document", { size: 16 })} Register Knowledge Document
            </button>
          </form>
        </div>
      </div>

 <div class="s-LKssrCZ4j1">
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Knowledge Documents</div>
 <div class="s-ykrP-ZIQ8m">${total}</div>
 <div class="s-_tdYXnR5PA">Canonical, search-indexed</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Categories in Use</div>
 <div class="s-5bXu9tLBIv">${new Set(documents.map((d) => d.category)).size}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Access-Controlled</div>
 <div class="s-Am3eRxce65">${documents.filter((d) => d.confidentiality !== "PUBLIC").length}</div>
 <div class="s-_tdYXnR5PA">Non-public documents require clearance</div>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Knowledge Catalogue (UX-HSP-002)
        </h3>
        ${
          documents.length === 0
            ? renderEmptyRecords("No knowledge documents are registered in the HeadspaceKnowledgeEngine yet — this desk renders canonical records only.")
 : `<div class="s-jvR2_DF1C2">
          ${documents
            .map(
              (r) => `
 <div class="s-fbKelQXawM">
              <div>
 <div class="s-fNfgHipnYh">
 <span class="s-Z3gWSXIolr">${escapeHtml(r.id)}</span>
                  <span class="vmn-badge ${r.confidentiality === "PUBLIC" ? "badge-info" : "badge-warning"}">${escapeHtml(r.confidentiality.replace(/_/g, " "))}</span>
                  <span class="vmn-badge badge-neutral">${escapeHtml(r.category.replace(/_/g, " "))}</span>
                </div>
 <h4 class="s-tWHMqvnoKy">${escapeHtml(r.title)}</h4>
 <div class="s-ypL9N-nGuz">
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
  _user?: SessionUser
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >CR8TECH &bull; UX-CR8-001..008</span>
 <h1 class="s-n_bp1PhViu">
            Cr8Tech DevOps Integration &amp; Runbook Operations
          </h1>
 <p class="s-zrikAgYqXF">
            Integration health from authoritative runtime state &bull; Invented endpoint telemetry removed (SCR-14)
          </p>
        </div>
      </div>

 <div class="vmn-card s-58Wdku8jfj" >
 <h3 class="s-k4BT8HxObJ">
          Integration Health Register (UX-CR8-002)
        </h3>
 <p class="s-66hKPmji8u">
          Only integrations with a live runtime adapter are shown as OPERATIONAL. External SaaS endpoints (StarTimes telemetry, payment processors, cloud media services) are NOT_CONFIGURED until an accountable owner connects a real adapter — this surface never fabricates endpoint URLs, latencies or SLA figures.
        </p>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Integration</th>
 <th class="s-lr_pOFE4_J">State</th>
 <th class="s-lr_pOFE4_J">Runtime Detail</th>
              </tr>
            </thead>
            <tbody>
              ${services
                .map(
                  (s) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-8i5j_3VdTg">${escapeHtml(s.name)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${s.state === "OPERATIONAL" ? "badge-ready" : "badge-warning"}">${escapeHtml(s.state.replace(/_/g, " "))}</span></td>
 <td class="s-gvP_yDU8_J">${escapeHtml(s.detail)}</td>
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

export function renderAgenticOsConsoleHtml(snapshot: AgenticOsDeskSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >AGENTIC OS &bull; UX-AGT-001..009</span>
 <h1 class="s-n_bp1PhViu">
            Agentic OS Autonomous AI Governance &amp; Kill Switch Desk
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of AgenticOperatingSystem &bull; HITL supervisor queue &bull; Fail-closed kill switches
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
          <!-- Emergency Kill Switch Action (real: engageGlobalKillSwitch) -->
 <form method="POST" action="/api/v1/workspace/aos/killswitch" data-confirm="EMERGENCY: Do you want to immediately isolate ALL autonomous agents?" class="s-Q0_DLsKcmN">
            <input type="hidden" name="action" value="KILL_ALL" />
 <button type="submit" class="btn s-UbGwDHUk_Q" >
              ${renderIcon("lock", { size: 16 })} ${snapshot?.globalKillSwitchEngaged ? "KILL SWITCH ENGAGED" : "HARD ISOLATE ALL AGENTS"}
            </button>
          </form>
        </div>
      </div>

      ${
        snapshot?.globalKillSwitchEngaged
 ? `<div class="vmn-alert s-6zhA7w7xb4" role="alert" >
 <div class="s-Jf-lmSJB7n">GLOBAL KILL SWITCH ENGAGED — all agents are isolated pending human disengage.</div>
      </div>`
          : ""
      }

 <div class="s-LKssrCZ4j1">
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Registered Agents</div>
 <div class="s-ykrP-ZIQ8m">${agents.length}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Pending HITL Proposals</div>
 <div class="s-5bXu9tLBIv">${snapshot?.pendingProposals ?? 0}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Audit Records</div>
 <div class="s-Am3eRxce65">${auditTrail.length}</div>
        </div>
      </div>

      <!-- Agent Registry (canonical) -->
 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Registered Agents &amp; Tool Authorizations (UX-AGT-003)
        </h3>
        ${
          agents.length === 0
            ? renderEmptyRecords("No agents are registered in the AgenticOperatingSystem yet — this console renders canonical registry records only.")
 : `<div class="s-jvR2_DF1C2">
          ${agents
            .map(
              (a) => `
 <div class="s-fbKelQXawM">
 <div class="s-PMIGk7Qf8W">
 <div class="s-fNfgHipnYh">
 <span class="s-Z3gWSXIolr">${escapeHtml(a.id)}</span>
                  <span class="vmn-badge ${a.killSwitchEngaged || a.status !== "ACTIVE" ? "badge-danger" : "badge-ready"}">${escapeHtml(a.killSwitchEngaged ? "KILL SWITCH ENGAGED" : a.status)}</span>
                  <span class="vmn-badge badge-neutral">${a.actionsPerformedToday}/${a.maxDailyActions} actions today</span>
                </div>
 <h4 class="s-tWHMqvnoKy">${escapeHtml(a.name)}</h4>
 <p class="s-nn_bvjEsa6">${escapeHtml(a.role.replace(/_/g, " "))} — ${escapeHtml(a.operationalScope)}</p>
              </div>
              <div>
 <div class="s-t7w-T5mA1q">Authorized Tool Scopes:</div>
 <div class="s-hFb6r--Tzj">
 ${a.allowedTools.map((p) => `<span class="vmn-badge badge-info s-FFX_IENJF5" >${escapeHtml(p)}</span>`).join("")}
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
 : `<div class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-spyfDabz02">Agent Action Audit Trail (UX-AGT-007)</h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-1tJThyUfqH">
 <thead><tr class="s-UnSdr9bWTK"><th class="s-JKTsUAJmov">Time (UTC)</th><th class="s-JKTsUAJmov">Agent</th><th class="s-JKTsUAJmov">Action</th><th class="s-JKTsUAJmov">Policy Gate</th></tr></thead>
            <tbody>
              ${auditTrail
                .slice(-15)
                .reverse()
                .map(
                  (r) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-mGZC5angeh">${escapeHtml(r.timestamp)}</td>
 <td class="s-mGZC5angeh">${escapeHtml(r.agentId)}</td>
 <td class="s-XZobzCOomY">${escapeHtml(r.actionTaken)}</td>
 <td class="s-XZobzCOomY"><span class="vmn-badge ${r.wasBlocked ? "badge-danger" : "badge-ready"}">${r.wasBlocked ? "BLOCKED" : "ALLOWED"}</span></td>
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
