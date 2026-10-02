/**
 * External Counterparty Portals & Enterprise Governance Registers (UX-POR, UX-HUB, UX-REC)
 * Authority: VMN APP UI UX.docx §4.14–4.16 / BRD-PRD-001 §38–41
 *
 * TODO-SCR-19: every portal is a projection over canonical records with
 * tenant/counterparty scoping applied by the router (getClientOrgRelationship)
 * BEFORE records reach these renderers. The MOCK_* constants are deleted — an
 * empty result renders an honest empty state and never another organisation's
 * records:
 * - Partner portal   → QuoteToCashSalesEngine deals scoped to the partner org.
 * - Creator portal   → TalentPayoutEngine batches scoped to the beneficiary.
 * - Vendor portal    → canonical purchase orders (none until a PO domain
 *   exists — honest NOT_AVAILABLE state; no invented POs).
 * - Risk register    → core/work RiskRecord (createRisk/listRisks).
 * - Issue tracker    → core/work IssueRecord (createIssue/listIssues/transition).
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
// 1. PARTNER PORTAL (UX-POR-003) — over canonical sales deals scoped to org
// =============================================================================

export interface PartnerPortalSnapshot {
  partnerOrgId: string;
  partnerName: string;
  deals: Array<{
    id: string;
    dealName: string;
    stage: string;
    totalContractValueNgn: number;
    invoicedAmountNgn: number;
    cashCollectedAmountNgn: number;
    createdAt: string;
  }>;
}

export function renderPartnerPortalHtml(snapshot: PartnerPortalSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_PORTAL_PARTNER_AUDITOR")) {
    return renderFeatureDisabledNotice(
      "FF_PORTAL_PARTNER_AUDITOR",
      "Strategic Partner Portal (UX-POR-003)",
      "/portal/partner"
    );
  }

  const orgId = snapshot?.partnerOrgId || "unknown-org";
  const deals = snapshot?.deals || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">PARTNER PORTAL &bull; UX-POR-003</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Strategic Partner &amp; Broadcaster Counterparty Desk
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Organisation: <strong>${escapeHtml(snapshot?.partnerName || orgId)}</strong> &bull; Portal ID: <code>${escapeHtml(orgId)}</code> &bull; Scope: canonical deals for YOUR organisation only
          </p>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Active Co-Productions &amp; Commercial Ventures
        </h3>
        ${
          deals.length === 0
            ? renderEmptyRecords(`No commercial deals are recorded for organisation '${escapeHtml(orgId)}' in the canonical Quote-to-Cash engine. This portal renders only records scoped to your organisation and never displays another counterparty's data.`)
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Deal Ref</th>
                <th style="padding: 10px 12px;">Engagement</th>
                <th style="padding: 10px 12px;">Stage</th>
                <th style="padding: 10px 12px; text-align: right;">Contract Value</th>
                <th style="padding: 10px 12px; text-align: right;">Invoiced</th>
                <th style="padding: 10px 12px; text-align: right;">Cash Collected</th>
              </tr>
            </thead>
            <tbody>
              ${deals
                .map(
                  (d) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(d.id)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(d.dealName)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge badge-neutral">${escapeHtml(d.stage.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; text-align: right; font-family: monospace;">NGN ${d.totalContractValueNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace;">NGN ${d.invoicedAmountNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace;">NGN ${d.cashCollectedAmountNgn.toLocaleString("en-NG")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin: 12px 0 0;">
          Contract value, invoiced value and cash collected are distinct financial measures; they are never conflated as a single "revenue" figure (CLAUDE.md data_and_finance).
        </p>`
        }
      </div>
    </div>
  `;
}

// =============================================================================
// 2. CREATOR PORTAL (UX-POR-004) — over canonical payout batches scoped to beneficiary
// =============================================================================

export interface CreatorPortalSnapshot {
  creatorId: string;
  settlements: Array<{
    batchReference: string;
    batchStatus: string;
    grossAmountNgn: number;
    platformFeeNgn: number;
    whtDeductionNgn: number;
    netDisbursementNgn: number;
    createdAt: string;
  }>;
}

export function renderCreatorPortalHtml(snapshot: CreatorPortalSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_PORTAL_PARTNER_AUDITOR")) {
    return renderFeatureDisabledNotice(
      "FF_PORTAL_PARTNER_AUDITOR",
      "Creator Portal (UX-POR-004)",
      "/portal/creator"
    );
  }

  const creatorId = snapshot?.creatorId || "unknown-creator";
  const settlements = snapshot?.settlements || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">CREATOR &bull; UX-POR-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Creator Earnings &amp; 7-Way Royalty Settlement Portal
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Beneficiary: <code>${escapeHtml(creatorId)}</code> &bull; Scope: payout batches where you are a line item
          </p>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Historical Settlements (7-Way Separated)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.85rem; margin-bottom: 16px;">
          Figures come from canonical TalentPayoutEngine batches: gross allocation, platform fee and statutory Nigerian WHT are shown as the distinct measures they are; the net disbursement is the only amount paid out.
        </p>
        ${
          settlements.length === 0
            ? renderEmptyRecords(`No payout batches include beneficiary '${escapeHtml(creatorId)}' yet. Settlement lines appear here only after a finance-approved batch containing your engagements is created; nothing is invented for display.`)
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Batch Ref</th>
                <th style="padding: 10px 12px;">Batch Status</th>
                <th style="padding: 10px 12px; text-align: right;">Gross Allocation</th>
                <th style="padding: 10px 12px; text-align: right;">Platform Fee</th>
                <th style="padding: 10px 12px; text-align: right;">WHT</th>
                <th style="padding: 10px 12px; text-align: right;">Net NIP Payout</th>
              </tr>
            </thead>
            <tbody>
              ${settlements
                .map(
                  (e) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-size: 0.8rem; color: var(--vmn-color-secondary-text);">${escapeHtml(e.batchReference)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${e.batchStatus === "PROCESSED" || e.batchStatus === "APPROVED_FOR_DISBURSEMENT" ? "badge-ready" : "badge-warning"}">${escapeHtml(e.batchStatus.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; text-align: right; font-family: monospace;">NGN ${e.grossAmountNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace; color: var(--vmn-color-secondary-text);">- NGN ${e.platformFeeNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace; color: var(--vmn-color-error, #DC2626);">- NGN ${e.whtDeductionNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700; color: var(--vmn-color-ready);">NGN ${e.netDisbursementNgn.toLocaleString("en-NG")}</td>
                </tr>
              `
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

// =============================================================================
// 3. VENDOR PORTAL (UX-POR-005) — canonical POs only; honest empty state
// =============================================================================

export interface VendorPortalSnapshot {
  vendorId: string;
  vendorName: string;
  purchaseOrders: Array<{
    poNumber: string;
    description: string;
    amountNgn: number;
    dateIssued: string;
    paymentTerms: string;
    status: string;
  }>;
}

export function renderVendorPortalHtml(snapshot: VendorPortalSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_PORTAL_PARTNER_AUDITOR")) {
    return renderFeatureDisabledNotice(
      "FF_PORTAL_PARTNER_AUDITOR",
      "Vendor Portal (UX-POR-005)",
      "/portal/vendor"
    );
  }

  const vendorId = snapshot?.vendorId || "unknown-vendor";
  const pos = snapshot?.purchaseOrders || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">VENDOR &bull; UX-POR-005</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Vendor Procurement &amp; Invoice Submission Portal
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Registered Vendor: <strong>${escapeHtml(snapshot?.vendorName || vendorId)}</strong> &bull; ID: <code>${escapeHtml(vendorId)}</code>
          </p>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Purchase Orders &amp; Invoices
        </h3>
        ${
          pos.length === 0
            ? renderEmptyRecords(`The canonical procurement record store does not yet hold purchase orders for vendor '${escapeHtml(vendorId)}' — the PO/invoice domain is a recorded deferral (DEC-RL1-SCOPE-001). This portal renders canonical records only and does not fabricate POs.`)
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">PO Number</th>
                <th style="padding: 10px 12px;">Scope of Services</th>
                <th style="padding: 10px 12px; text-align: right;">Amount</th>
                <th style="padding: 10px 12px;">Issue Date</th>
                <th style="padding: 10px 12px;">Terms</th>
                <th style="padding: 10px 12px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${pos
                .map(
                  (po) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(po.poNumber)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(po.description)}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700;">NGN ${po.amountNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px; font-family: monospace;">${escapeHtml(po.dateIssued)}</td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">${escapeHtml(po.paymentTerms)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge badge-ready">${escapeHtml(po.status.replace(/_/g, " "))}</span></td>
                </tr>
              `
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

// =============================================================================
// 4. MANAGEMENT OVERVIEW (UX-HUB-004) — computed from canonical engines
// =============================================================================

export interface ManagementOverviewSnapshot {
  broadcastChannels: number;
  openBroadcastIncidents: number;
  salesPipeline: { deals: number; contractValueNgn: number; cashCollectedNgn: number; recognizedRevenueNgn: number };
  verifiedTalent: number;
  totalTalent: number;
  academyCertificates: number;
}

export function renderManagementOverviewHtml(snapshot: ManagementOverviewSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_HUB_DIRECTORY")) {
    return renderFeatureDisabledNotice(
      "FF_SHARED_HUB_DIRECTORY",
      "Management Hub Overview (UX-HUB-004)",
      "/workspace"
    );
  }

  const pipeline = snapshot?.salesPipeline || { deals: 0, contractValueNgn: 0, cashCollectedNgn: 0, recognizedRevenueNgn: 0 };
  const totalTalent = snapshot?.totalTalent ?? 0;
  const verifiedTalent = snapshot?.verifiedTalent ?? 0;

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">EXECUTIVE COMMAND &bull; UX-HUB-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            VMN Consolidated Management Overview
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Computed live from canonical engines &bull; Every figure below is derived, never asserted
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/workspace/executive" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
            ${renderIcon("shield", { size: 16 })} Executive Room &rarr;
          </a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Linear Channels Under Management</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${snapshot?.broadcastChannels ?? 0}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Canonical channel registry</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Open Carriage Incidents</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">${snapshot?.openBroadcastIncidents ?? 0}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">From CarriageMonitoringEngine</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Commercial Pipeline (Deals)</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--vmn-color-brand-cyan); margin-top: 4px;">${pipeline.deals}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Contract value NGN ${pipeline.contractValueNgn.toLocaleString("en-NG")}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Recognised Revenue (Governed)</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">NGN ${pipeline.recognizedRevenueNgn.toLocaleString("en-NG")}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Cash collected NGN ${pipeline.cashCollectedNgn.toLocaleString("en-NG")} — kept distinct from recognition (FIN-01)</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Talent Registry</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">${totalTalent}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">${verifiedTalent} verified via accelerator gates</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">AFCA Certificates Issued</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">${snapshot?.academyCertificates ?? 0}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Issued via AfcaAcademyService</div>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 0.8rem; color: var(--vmn-color-secondary-text); margin: 0;">
          Note: financial figures are computed from the canonical Quote-to-Cash engine. Recognised revenue is delivery-gated and contract-capped; collected cash that exceeds verified delivery remains deferred, never counted as revenue (Canonical Law 7). Executive metric dictionary approval remains with Finance (DEC-RL1-SCOPE-001 D-10).
        </p>
      </div>
    </div>
  `;
}

// =============================================================================
// 5. RISK REGISTER (UX-REC-004) — over core/work RiskRecord
// =============================================================================

export type { RiskRecord } from "../../core/work/index.js";

export interface RiskRegisterSnapshot {
  risks: Array<{
    id: string;
    title: string;
    category: string;
    likelihood: number;
    impact: number;
    mitigation: string;
    owner: string;
    status: string;
    reviewDueAt: string;
  }>;
}

export function renderRiskRegisterHtml(snapshot: RiskRegisterSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_RISK_ISSUE_RECORDS")) {
    return renderFeatureDisabledNotice(
      "FF_SHARED_RISK_ISSUE_RECORDS",
      "Enterprise Risk Register (UX-REC-004)",
      "/workspace"
    );
  }

  const risks = snapshot?.risks || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">GOVERNANCE &bull; UX-REC-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Enterprise Risk Register &amp; Mitigation Control Ledger
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of the core work domain &bull; Governance mutation requires update:risk authority
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#log-risk" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("shield", { size: 16 })} Log Identified Risk &rarr;
          </a>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Assessed Enterprise Risks
        </h3>
        ${
          risks.length === 0
            ? renderEmptyRecords("No risks are recorded in the canonical register yet — log the first below. This register renders canonical records only.")
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Risk ID</th>
                <th style="padding: 10px 12px;">Title</th>
                <th style="padding: 10px 12px;">Category</th>
                <th style="padding: 10px 12px; text-align: center;">L×I</th>
                <th style="padding: 10px 12px;">Mitigation Control</th>
                <th style="padding: 10px 12px;">Owner</th>
                <th style="padding: 10px 12px;">Review Due</th>
                <th style="padding: 10px 12px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${risks
                .map((r) => {
                  const score = r.likelihood * r.impact;
                  return `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(r.id)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(r.title)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge badge-neutral">${escapeHtml(r.category.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; text-align: center;"><span class="vmn-badge ${score >= 15 ? "badge-danger" : score >= 8 ? "badge-warning" : "badge-info"}">${r.likelihood}×${r.impact}=${score}</span></td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">${escapeHtml(r.mitigation)}</td>
                  <td style="padding: 12px;">${escapeHtml(r.owner)}</td>
                  <td style="padding: 12px; font-family: monospace;">${escapeHtml(r.reviewDueAt)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${r.status === "CLOSED" ? "badge-ready" : "badge-warning"}">${escapeHtml(r.status)}</span></td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>

      <!-- Risk Logging Form -->
      <div id="log-risk" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Log Identified Risk (UX-REC-004)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Writes a canonical RiskRecord via the core work domain (guarded mutation, update:risk).
        </p>
        <form method="POST" action="/api/v1/workspace/governance/risks" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Risk ID</label>
            <input type="text" name="id" required placeholder="e.g. RSK-2026-004" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Title</label>
            <input type="text" name="title" required placeholder="Risk title" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Category</label>
            <input type="text" name="category" required placeholder="e.g. BROADCAST_TRANSMISSION" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Likelihood (1–5)</label>
            <input type="number" name="likelihood" required min="1" max="5" value="3" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Impact (1–5)</label>
            <input type="number" name="impact" required min="1" max="5" value="3" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Owner</label>
            <input type="text" name="owner" required placeholder="Accountable owner" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Review Due Date</label>
            <input type="date" name="reviewDueAt" required style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Mitigation Control</label>
            <textarea name="mitigation" rows="2" required placeholder="Preventative / detective control description..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);"></textarea>
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Log Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 6. ISSUE TRACKER (UX-REC-005) — over core/work IssueRecord
// =============================================================================

export interface IssueTrackerSnapshot {
  issues: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    raisedBy: string;
    assignedTo?: string;
    status: string;
    createdAt: string;
  }>;
}

export function renderIssueTrackerHtml(snapshot: IssueTrackerSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_RISK_ISSUE_RECORDS")) {
    return renderFeatureDisabledNotice(
      "FF_SHARED_RISK_ISSUE_RECORDS",
      "Operational Issue Tracker (UX-REC-005)",
      "/workspace"
    );
  }

  const issues = snapshot?.issues || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">OPERATIONS &bull; UX-REC-005</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Operational Issue Tracker &amp; Incident Escalation Desk
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of the core work domain &bull; Lifecycle enforced (OPEN → ACKNOWLEDGED → FIX_IN_PROGRESS → RESOLVED)
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#log-issue" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("bolt", { size: 16 })} Log Operational Incident &rarr;
          </a>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Active Incident Tickets
        </h3>
        ${
          issues.length === 0
            ? renderEmptyRecords("No issues are recorded in the canonical tracker yet — log the first below. This tracker renders canonical records only.")
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Issue ID</th>
                <th style="padding: 10px 12px;">Title</th>
                <th style="padding: 10px 12px;">Severity</th>
                <th style="padding: 10px 12px;">Raised By</th>
                <th style="padding: 10px 12px;">Assigned To</th>
                <th style="padding: 10px 12px;">State</th>
                <th style="padding: 10px 12px; text-align: right;">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody>
              ${issues
                .map((i) => {
                  const next: Record<string, string> = { OPEN: "ACKNOWLEDGED", ACKNOWLEDGED: "FIX_IN_PROGRESS", FIX_IN_PROGRESS: "RESOLVED" };
                  const action = next[i.status];
                  return `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(i.id)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(i.title)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${i.severity === "S1" ? "badge-danger" : i.severity === "S2" ? "badge-warning" : "badge-info"}">${escapeHtml(i.severity)}</span></td>
                  <td style="padding: 12px;">${escapeHtml(i.raisedBy)}</td>
                  <td style="padding: 12px;">${escapeHtml(i.assignedTo || "—")}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${i.status === "RESOLVED" ? "badge-ready" : "badge-info"}">${escapeHtml(i.status.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; text-align: right;">
                    ${
                      action
                        ? `<form method="POST" action="/api/v1/workspace/governance/issues/${escapeHtml(i.id)}/transition" style="display: inline;">
                      <input type="hidden" name="target" value="${action}" />
                      <button type="submit" class="btn btn-secondary" style="min-height: 40px; padding: 0 14px; font-size: 0.8rem; font-weight: 700;">→ ${action.replace(/_/g, " ")}</button>
                    </form>`
                        : `<span class="vmn-badge badge-ready">Closed</span>`
                    }
                  </td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>

      <!-- Issue Logging Form -->
      <div id="log-issue" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Log Operational Incident (UX-REC-005)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Creates a canonical IssueRecord via the core work domain (guarded mutation, update:risk).
        </p>
        <form method="POST" action="/api/v1/workspace/governance/issues" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Issue ID</label>
            <input type="text" name="id" required placeholder="e.g. ISSUE-884" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Title</label>
            <input type="text" name="title" required placeholder="Short incident summary" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Severity</label>
            <select name="severity" required style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);">
              <option value="S1">S1 — Urgent</option>
              <option value="S2">S2 — Elevated</option>
              <option value="S3">S3 — Standard</option>
              <option value="S4">S4 — Low</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Linked Risk ID (optional)</label>
            <input type="text" name="linkedRiskId" placeholder="RSK-2026-001" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Description</label>
            <textarea name="description" rows="2" required placeholder="Observed fault, affected service, initial assessment..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);"></textarea>
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Log Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
