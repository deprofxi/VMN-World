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

export function renderAccessAdminConsoleHtml(projection: AccessMatrixProjection, _user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_HUB_DIRECTORY")) {
    return renderFeatureDisabledNotice("FF_SHARED_HUB_DIRECTORY", "Access & Membership Administration <span class=\"sr-only\">(UX-ADM-001)</span>", "/workspace");
  }

  return `
 <div class="s-Llwj6EPzTQ">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >Access Administration <span class="sr-only">&bull; UX-ADM-001</span></span>
 <h1 class="s-Eg3nXwYpcj">Access &amp; Membership Administration</h1>
 <p class="s-zrikAgYqXF">
          Read-only view of role permissions and active system sessions. User assignments and revocations run through the audited invitation flow <span class="sr-only">(UX-SYS-004)</span>. Viewing this directory does not grant clearance to private financial or identity records <span class="sr-only">(UIUX-001 §5.7)</span>.
        </p>
      </div>

 <div class="s-LdTx3wBkat">
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Defined Roles</div>
 <div class="s-vu7vwqr--r">${escapeHtml(projection.summary.roles)}</div>
        </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Permission Rules</div>
 <div class="s-vu7vwqr--r">${escapeHtml(projection.summary.rules)}</div>
        </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Active Sessions</div>
 <div class="s-vu7vwqr--r">${escapeHtml(projection.summary.activeSessions)} / ${escapeHtml(projection.summary.sessionsTotal)}</div>
        </div>
      </div>

 <div class="vmn-card s-QTA1yfp9QZ" >
 <h2 class="s-X-3ntabRj3">Role &amp; Resource Permissions Matrix</h2>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-yaXxTqlt-j">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">Role</th>
 <th class="s-JKTsUAJmov">Grants (resource: actions)</th>
              </tr>
            </thead>
            <tbody>
              ${projection.roles
                .map(
                  (r) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-4ZfbRePuSv">${escapeHtml(r.role)}</td>
 <td class="s-JKTsUAJmov">
 ${r.resources.map((res) => `<span class="vmn-badge badge-neutral s-tWebOkuKAi" >${escapeHtml(res.resource)}: ${res.actions.map((a) => escapeHtml(a)).join("/")}</span>`).join(" ")}
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

 <div class="vmn-card s-ur_fSDuIMh" >
 <h2 class="s-Uo5DKHK6Ph">Active Session Registry</h2>
        ${
          projection.activeSessions.length === 0
 ? `<p class="s-s8QClmJr6r">No sessions registered yet.</p>`
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-yaXxTqlt-j">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">Operator</th>
 <th class="s-JKTsUAJmov">Device</th>
 <th class="s-JKTsUAJmov">Issued (UTC)</th>
 <th class="s-JKTsUAJmov">Last Seen</th>
 <th class="s-JKTsUAJmov">State</th>
              </tr>
            </thead>
            <tbody>
              ${projection.activeSessions
                .slice(0, 25)
                .map(
                  (s) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-sXJ_a8BSrJ">${escapeHtml(s.email)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(s.deviceLabel)}</td>
 <td class="s-TlsG8972c3">${escapeHtml(s.createdAt.substring(0, 19).replace("T", " "))}</td>
 <td class="s-TlsG8972c3">${escapeHtml(s.lastSeenAt.substring(0, 19).replace("T", " "))}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge ${s.revoked ? "badge-danger" : "badge-ready"}">${s.revoked ? "REVOKED" : "ACTIVE"}</span></td>
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

export function renderSourceMappingsConsoleHtml(mappings?: SourceMapping[], _user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_HUB_DIRECTORY")) {
    return renderFeatureDisabledNotice("FF_SHARED_HUB_DIRECTORY", "Approved Routing & Source Mappings <span class=\"sr-only\">(UX-ADM-003)</span>", "/workspace");
  }

  const all = mappings || listSourceMappings();
  const counts = computeSourceMappingCounts();

  return `
 <div class="s-Llwj6EPzTQ">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >Routing &amp; Mappings <span class="sr-only">&bull; UX-ADM-003</span></span>
 <h1 class="s-Eg3nXwYpcj">Approved Routing &amp; Source Mappings</h1>
 <p class="s-zrikAgYqXF">
          Authoritative registry verifying all system data source feeds. Unverified feeds cannot back production surfaces <span class="sr-only">(CCPP §1.5, HX-01..HX-14)</span>.
        </p>
      </div>

 <div class="s-GFq2lKWsfq">
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Registered Mappings</div>
 <div class="s-vu7vwqr--r">${escapeHtml(counts.total)}</div>
        </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Approved</div>
 <div class="s-Am3eRxce65">${escapeHtml(counts.approved)}</div>
        </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Pending / N-A</div>
 <div class="s-vu7vwqr--r">${escapeHtml(counts.pending)} / ${escapeHtml(counts.notApplicable)}</div>
        </div>
      </div>

 <div class="vmn-card s-ur_fSDuIMh" >
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-nEW8-mhC50">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">HX ID</th>
 <th class="s-JKTsUAJmov">Field</th>
 <th class="s-JKTsUAJmov">Approved Source</th>
 <th class="s-JKTsUAJmov">Status</th>
 <th class="s-JKTsUAJmov">Authority</th>
              </tr>
            </thead>
            <tbody>
              ${all
                .map(
                  (m) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-mNPOKGOVlj">${escapeHtml(m.hxId)}</td>
 <td class="s-JKTsUAJmov">
 <div class="s-XAX0r6-AnY">${escapeHtml(m.field)}</div>
 <div class="s-wUMD0XWoZI">${escapeHtml(m.description)}</div>
                  </td>
 <td class="s-gBuMi0hizo">${escapeHtml(m.approvedSource)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge ${m.status === "APPROVED" ? "badge-ready" : m.status === "PENDING" ? "badge-warning" : "badge-neutral"}">${escapeHtml(m.status)}</span></td>
 <td class="s-n_zvQ9zjpC">${escapeHtml(m.approvedBy || "—")}${m.approvedAt ? `<div class="s-OYZq79iD6g">${escapeHtml(m.approvedAt)}</div>` : ""}</td>
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
