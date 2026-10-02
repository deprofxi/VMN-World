/**
 * Governance & Shared Records Read-Only Projections — TODO-SCR-07 / TODO-SCR-16
 * Authority: UIUX-001 §5.4 (shared record projections), CCPP §7.2 (field-scope
 * classification per displayed field).
 *
 * These are READ-ONLY projections over canonical domain objects:
 *   UX-GOV-003 Rights Source Record   → RightsRecordEntity (core/domain/types)
 *   UX-GOV-005 Financial Reference    → SettlementEntity (7-way separated)
 *   UX-GOV-007 Evidence Viewer        → EvidenceEntity
 *   UX-GOV-008 Audit View             → AuditLogEntry (read:audit guarded)
 *   UX-REC-001 Person Summary         → operator directory projection
 *   UX-REC-002 Asset Reference        → DAM asset key projection
 *   UX-REC-003 Integration Job        → queue job projection
 *   UX-REC-006 Incident Reference     → TransmissionIncident (carriage engine)
 *
 * No mutation paths exist here by design. Field scopes: every rendered field
 * carries a classification so the UI layer cannot accidentally surface
 * Restricted data (CLAUDE.md security law).
 */

import { RightsRecordEntity, SettlementEntity, EvidenceEntity } from "../../core/domain/types.js";
import { TransmissionIncident } from "../../modules/broadcast/carriage/index.js";
import { AuditLogEntry } from "../../core/audit/index.js";

export type FieldScope = "PUBLIC" | "INTERNAL" | "RESTRICTED";

export interface ScopedField {
  label: string;
  value: string;
  scope: FieldScope;
}

// ---------------------------------------------------------------------------
// UX-GOV-003: Rights Source Record (read-only view of the canonical truth)
// ---------------------------------------------------------------------------

export function projectRightsSourceRecord(record: RightsRecordEntity): ScopedField[] {
  return [
    { label: "Rights Record ID", value: record.id, scope: "INTERNAL" },
    { label: "Title", value: record.title, scope: "INTERNAL" },
    { label: "Asset", value: record.assetId, scope: "INTERNAL" },
    { label: "Rights Type", value: record.rightsType, scope: "INTERNAL" },
    { label: "Territory", value: record.territory, scope: "INTERNAL" },
    { label: "Media", value: record.mediaType, scope: "INTERNAL" },
    { label: "Channel", value: record.channelCode || "—", scope: "INTERNAL" },
    { label: "Exclusivity", value: record.exclusivity ? "EXCLUSIVE" : "NON-EXCLUSIVE", scope: "INTERNAL" },
    { label: "Window", value: `${record.startDate.toISOString().substring(0, 10)} → ${record.expiryDate.toISOString().substring(0, 10)}`, scope: "INTERNAL" },
    { label: "Sub-licensable", value: record.subLicensable ? "YES" : "NO", scope: "INTERNAL" },
    { label: "Granter Organisation", value: record.granterOrgId || "—", scope: "RESTRICTED" },
    { label: "Grantee Organisation", value: record.granteeOrgId || "—", scope: "RESTRICTED" },
  ];
}

// ---------------------------------------------------------------------------
// UX-GOV-005: Financial Reference (7-way separation preserved, never conflated)
// ---------------------------------------------------------------------------

export function projectFinancialReference(settlement: SettlementEntity): ScopedField[] {
  return [
    { label: "Settlement", value: settlement.settlementNumber, scope: "INTERNAL" },
    { label: "Contract Value", value: formatNgn(settlement.contractValue), scope: "INTERNAL" },
    { label: "GMV / Gross Transaction Value", value: formatNgn(settlement.gmvAmount), scope: "INTERNAL" },
    { label: "Invoiced Value", value: formatNgn(settlement.invoicedAmount), scope: "INTERNAL" },
    { label: "Recognised Revenue", value: formatNgn(settlement.recognizedAmount), scope: "INTERNAL" },
    { label: "Cash Collected", value: formatNgn(settlement.cashCollectedAmount), scope: "INTERNAL" },
    { label: "Talent Payable", value: formatNgn(settlement.talentPayableAmount), scope: "RESTRICTED" },
    { label: "Partner / Rightsholder Share", value: formatNgn(settlement.partnerShareAmount), scope: "RESTRICTED" },
    { label: "Reconciled", value: settlement.reconciledAt ? settlement.reconciledAt.toISOString().substring(0, 10) : "NOT RECONCILED", scope: "INTERNAL" },
  ];
}

// ---------------------------------------------------------------------------
// UX-GOV-007: Evidence Viewer
// ---------------------------------------------------------------------------

export function projectEvidence(evidence: EvidenceEntity): ScopedField[] {
  return [
    { label: "Evidence ID", value: evidence.id, scope: "INTERNAL" },
    { label: "Title", value: evidence.title, scope: "INTERNAL" },
    { label: "Type", value: evidence.type, scope: "INTERNAL" },
    { label: "Document", value: evidence.documentUrl, scope: "INTERNAL" },
    { label: "SHA-256 Checksum", value: evidence.checksumSha256, scope: "INTERNAL" },
    { label: "Verified", value: evidence.verified ? `YES (by ${evidence.verifiedBy || "authority"})` : "PENDING VERIFICATION", scope: "INTERNAL" },
  ];
}

// ---------------------------------------------------------------------------
// UX-GOV-008: Audit View (caller must hold read:audit; entries redacted)
// ---------------------------------------------------------------------------

export function projectAuditEntry(entry: AuditLogEntry): ScopedField[] {
  return [
    { label: "Action", value: entry.action, scope: "INTERNAL" },
    { label: "Resource", value: `${entry.resource}${entry.resourceId ? `/${entry.resourceId}` : ""}`, scope: "INTERNAL" },
    { label: "Actor", value: entry.userId || "SYSTEM", scope: "INTERNAL" },
    { label: "Time (UTC)", value: (entry.timestamp || new Date()).toISOString(), scope: "INTERNAL" },
    { label: "IP Address", value: entry.ipAddress || "—", scope: "RESTRICTED" },
  ];
}

// ---------------------------------------------------------------------------
// UX-REC-001: Authorised Person Summary (no personal data beyond work identity)
// ---------------------------------------------------------------------------

export interface PersonDirectoryEntry {
  userId: string;
  displayName: string;
  roles: string[];
  tenantId?: string;
  activeSince?: Date;
}

export function projectPersonSummary(person: PersonDirectoryEntry): ScopedField[] {
  return [
    { label: "Person", value: person.displayName, scope: "INTERNAL" },
    { label: "User Reference", value: person.userId, scope: "INTERNAL" },
    { label: "Roles", value: person.roles.join(", "), scope: "INTERNAL" },
    { label: "Tenant", value: person.tenantId || "vmnl-hq", scope: "INTERNAL" },
    { label: "Active Since", value: person.activeSince ? person.activeSince.toISOString().substring(0, 10) : "—", scope: "INTERNAL" },
  ];
}

// ---------------------------------------------------------------------------
// UX-REC-002: Asset Reference (DAM)
// ---------------------------------------------------------------------------

export function projectAssetReference(asset: { assetId: string; title: string; mediaType: string; verified: boolean }): ScopedField[] {
  return [
    { label: "Asset", value: asset.assetId, scope: "INTERNAL" },
    { label: "Title", value: asset.title, scope: "INTERNAL" },
    { label: "Media Type", value: asset.mediaType, scope: "INTERNAL" },
    { label: "Verification", value: asset.verified ? "SCANNED / VERIFIED" : "UNVERIFIED", scope: "INTERNAL" },
  ];
}

// ---------------------------------------------------------------------------
// UX-REC-003: Integration Job Reference
// ---------------------------------------------------------------------------

export function projectIntegrationJob(job: {
  id: string;
  kind: string;
  state: string;
  attempts: number;
  lastError?: string | null;
}): ScopedField[] {
  return [
    { label: "Job", value: job.id, scope: "INTERNAL" },
    { label: "Kind", value: job.kind, scope: "INTERNAL" },
    { label: "State", value: job.state, scope: "INTERNAL" },
    { label: "Attempts", value: String(job.attempts), scope: "INTERNAL" },
    { label: "Last Error", value: job.lastError || "—", scope: "RESTRICTED" },
  ];
}

// ---------------------------------------------------------------------------
// UX-REC-006: Incident Reference (carriage)
// ---------------------------------------------------------------------------

export function projectIncident(incident: TransmissionIncident): ScopedField[] {
  return [
    { label: "Incident", value: incident.id, scope: "INTERNAL" },
    { label: "Channel", value: incident.channelCode, scope: "INTERNAL" },
    { label: "Platform", value: incident.platform, scope: "INTERNAL" },
    { label: "Severity", value: incident.severity, scope: "INTERNAL" },
    { label: "Outage", value: `${Math.round(incident.outageDurationSeconds / 60)} min`, scope: "INTERNAL" },
    { label: "Root Cause", value: incident.rootCause, scope: "INTERNAL" },
    { label: "Affected Spots", value: String(incident.affectedSpotsCount), scope: "INTERNAL" },
    { label: "SLA Penalty", value: incident.slaPenaltyApplicable ? "APPLICABLE" : "NOT APPLICABLE", scope: "RESTRICTED" },
  ];
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// HTML rendering (shared, accessible, read-only)
// ---------------------------------------------------------------------------

const SCOPE_BADGE: Record<FieldScope, string> = {
  PUBLIC: `<span class="vmn-badge badge-ready">PUBLIC</span>`,
  INTERNAL: `<span class="vmn-badge badge-info">INTERNAL</span>`,
  RESTRICTED: `<span class="vmn-badge badge-warning" title="Restricted field — visible only to authorised roles">RESTRICTED</span>`,
};

export interface GovernanceRecordsPageData {
  rights: RightsRecordEntity[];
  settlements: SettlementEntity[];
  evidence: EvidenceEntity[];
  incidents: TransmissionIncident[];
}

/**
 * UX-GOV-003/005/007/008 + UX-REC-001/002/003/006 shared records console.
 * Renders read-only projections over whatever canonical records exist — when
 * a collection is empty it says so honestly rather than inventing rows.
 */
export function renderGovernanceRecordsHtml(
  auditEntries: AuditLogEntry[],
  data: GovernanceRecordsPageData,
  viewerRoles: string[]
): string {
  const canSeeAudit = viewerRoles.some((r) => ["SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController"].includes(r));
  const canSeeRestricted = viewerRoles.some((r) => ["SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController", "RightsManager"].includes(r));

  const filterRestricted = (fields: ScopedField[]) =>
    fields.filter((f) => canSeeRestricted || f.scope !== "RESTRICTED");

  const empty = (label: string) =>
    `<p style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin: 6px 0 0;">No ${label} records exist in the domain store yet — this surface renders canonical records only and never invents rows.</p>`;

  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">RECORDS &bull; UX-GOV-003/005/007/008 + UX-REC</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">Governance &amp; Shared Records</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Read-only projections over canonical rights, financial, evidence, incident and audit records. Field scopes enforced server-side for your roles.
        </p>
      </div>

      ${
        data.rights.length === 0
          ? renderProjectionTable("Rights Source Record", "UX-GOV-003", [])
          : data.rights.map((r) => renderProjectionTable(`Rights Source Record — ${r.title}`, "UX-GOV-003", filterRestricted(projectRightsSourceRecord(r)))).join("")
      }
      ${data.rights.length === 0 ? empty("rights source") : ""}

      ${
        data.settlements.length === 0
          ? renderProjectionTable("Financial Reference", "UX-GOV-005", [])
          : data.settlements.map((s) => renderProjectionTable(`Financial Reference — ${s.settlementNumber}`, "UX-GOV-005", filterRestricted(projectFinancialReference(s)))).join("")
      }
      ${data.settlements.length === 0 ? empty("settlement") : ""}

      ${
        data.evidence.length === 0
          ? renderProjectionTable("Evidence Viewer", "UX-GOV-007", [])
          : data.evidence.map((e) => renderProjectionTable(`Evidence — ${e.title}`, "UX-GOV-007", filterRestricted(projectEvidence(e)))).join("")
      }
      ${data.evidence.length === 0 ? empty("evidence") : ""}

      ${
        data.incidents.length === 0
          ? renderProjectionTable("Incident Reference", "UX-REC-006", [])
          : data.incidents.map((i) => renderProjectionTable(`Incident — ${i.id}`, "UX-REC-006", filterRestricted(projectIncident(i)))).join("")
      }
      ${data.incidents.length === 0 ? empty("incident") : ""}

      <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
          <h2 style="font-size: 1.05rem; font-weight: 800; margin: 0;">Authorised Activity / Audit View</h2>
          <span class="vmn-badge badge-neutral">UX-GOV-008</span>
        </div>
        ${
          canSeeAudit
            ? auditEntries.length === 0
              ? empty("audit")
              : `<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                  <thead><tr style="text-align: left; border-bottom: 2px solid var(--vmn-color-border);"><th style="padding: 8px 10px 8px 0;">Time (UTC)</th><th style="padding: 8px 10px 8px 0;">Action</th><th style="padding: 8px 10px 8px 0;">Resource</th><th style="padding: 8px 10px 8px 0;">Actor</th></tr></thead>
                  <tbody>
                    ${auditEntries
                      .slice(0, 25)
                      .map(
                        (e) => `
                    <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                      <td style="padding: 6px 10px 6px 0; font-family: monospace;">${(e.timestamp || new Date()).toISOString().substring(0, 19).replace("T", " ")}</td>
                      <td style="padding: 6px 10px 6px 0; font-weight: 600;">${e.action}</td>
                      <td style="padding: 6px 10px 6px 0;">${e.resource}${e.resourceId ? `/${e.resourceId}` : ""}</td>
                      <td style="padding: 6px 10px 6px 0;">${e.userId || "SYSTEM"}</td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
            : `<p style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Audit trail requires Auditor / Finance / Executive authorisation (read:audit). Your roles do not include it.</p>`
        }
      </div>
    </div>
  `;
}

export function renderProjectionTable(title: string, uxId: string, fields: ScopedField[]): string {
  return `
    <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 20px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <h2 style="font-size: 1.05rem; font-weight: 800; margin: 0;">${title}</h2>
        <span class="vmn-badge badge-neutral">${uxId}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <tbody>
          ${fields
            .map(
              (f) => `
          <tr style="border-bottom: 1px solid var(--vmn-color-border);">
            <th scope="row" style="text-align: left; padding: 8px 10px 8px 0; color: var(--vmn-color-secondary-text); font-weight: 600; width: 40%;">${f.label}</th>
            <td style="padding: 8px 0; font-weight: 600;">${f.value}</td>
            <td style="padding: 8px 0; text-align: right;">${SCOPE_BADGE[f.scope]}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <p style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin: 10px 0 0;">
        Read-only projection over canonical records. Field scopes are enforced server-side; no mutation path exists on this surface.
      </p>
    </div>
  `;
}
