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
 <div class="vmn-card s-jBAg6JRnQZ" >
 <p class="s-s8QClmJr6r">${note}</p>
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

export function renderPartnerPortalHtml(snapshot: PartnerPortalSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >PARTNER PORTAL &bull; UX-POR-003</span>
 <h1 class="s-n_bp1PhViu">
            Strategic Partner &amp; Broadcaster Counterparty Desk
          </h1>
 <p class="s-zrikAgYqXF">
            Organisation: <strong>${escapeHtml(snapshot?.partnerName || orgId)}</strong> &bull; Portal ID: <code>${escapeHtml(orgId)}</code> &bull; Scope: canonical deals for YOUR organisation only
          </p>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Active Co-Productions &amp; Commercial Ventures
        </h3>
        ${
          deals.length === 0
            ? renderEmptyRecords(`No commercial deals are recorded for organisation '${escapeHtml(orgId)}' in the canonical Quote-to-Cash engine. This portal renders only records scoped to your organisation and never displays another counterparty's data.`)
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Deal Ref</th>
 <th class="s-lr_pOFE4_J">Engagement</th>
 <th class="s-lr_pOFE4_J">Stage</th>
 <th class="s-gY5FUZdHNU">Contract Value</th>
 <th class="s-gY5FUZdHNU">Invoiced</th>
 <th class="s-gY5FUZdHNU">Cash Collected</th>
              </tr>
            </thead>
            <tbody>
              ${deals
                .map(
                  (d) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(d.id)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(d.dealName)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-neutral">${escapeHtml(d.stage.replace(/_/g, " "))}</span></td>
 <td class="s-ldn0EUQsLQ">NGN ${d.totalContractValueNgn.toLocaleString("en-NG")}</td>
 <td class="s-ldn0EUQsLQ">NGN ${d.invoicedAmountNgn.toLocaleString("en-NG")}</td>
 <td class="s-ldn0EUQsLQ">NGN ${d.cashCollectedAmountNgn.toLocaleString("en-NG")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
 <p class="s-UimKdry8Xx">
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

export function renderCreatorPortalHtml(snapshot: CreatorPortalSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >CREATOR &bull; UX-POR-004</span>
 <h1 class="s-n_bp1PhViu">
            Creator Earnings &amp; 7-Way Royalty Settlement Portal
          </h1>
 <p class="s-zrikAgYqXF">
            Beneficiary: <code>${escapeHtml(creatorId)}</code> &bull; Scope: payout batches where you are a line item
          </p>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-k4BT8HxObJ">
          Historical Settlements (7-Way Separated)
        </h3>
 <p class="s-66hKPmji8u">
          Figures come from canonical TalentPayoutEngine batches: gross allocation, platform fee and statutory Nigerian WHT are shown as the distinct measures they are; the net disbursement is the only amount paid out.
        </p>
        ${
          settlements.length === 0
            ? renderEmptyRecords(`No payout batches include beneficiary '${escapeHtml(creatorId)}' yet. Settlement lines appear here only after a finance-approved batch containing your engagements is created; nothing is invented for display.`)
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Batch Ref</th>
 <th class="s-lr_pOFE4_J">Batch Status</th>
 <th class="s-gY5FUZdHNU">Gross Allocation</th>
 <th class="s-gY5FUZdHNU">Platform Fee</th>
 <th class="s-gY5FUZdHNU">WHT</th>
 <th class="s-gY5FUZdHNU">Net NIP Payout</th>
              </tr>
            </thead>
            <tbody>
              ${settlements
                .map(
                  (e) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-qHjAKnxiKb">${escapeHtml(e.batchReference)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${e.batchStatus === "PROCESSED" || e.batchStatus === "APPROVED_FOR_DISBURSEMENT" ? "badge-ready" : "badge-warning"}">${escapeHtml(e.batchStatus.replace(/_/g, " "))}</span></td>
 <td class="s-ldn0EUQsLQ">NGN ${e.grossAmountNgn.toLocaleString("en-NG")}</td>
 <td class="s-UVhY1upnts">- NGN ${e.platformFeeNgn.toLocaleString("en-NG")}</td>
 <td class="s-3zA7Zyy1pB">- NGN ${e.whtDeductionNgn.toLocaleString("en-NG")}</td>
 <td class="s-wV9zGSXb6D">NGN ${e.netDisbursementNgn.toLocaleString("en-NG")}</td>
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

export function renderVendorPortalHtml(snapshot: VendorPortalSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >VENDOR &bull; UX-POR-005</span>
 <h1 class="s-n_bp1PhViu">
            Vendor Procurement &amp; Invoice Submission Portal
          </h1>
 <p class="s-zrikAgYqXF">
            Registered Vendor: <strong>${escapeHtml(snapshot?.vendorName || vendorId)}</strong> &bull; ID: <code>${escapeHtml(vendorId)}</code>
          </p>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Purchase Orders &amp; Invoices
        </h3>
        ${
          pos.length === 0
            ? renderEmptyRecords(`The canonical procurement record store does not yet hold purchase orders for vendor '${escapeHtml(vendorId)}' — the PO/invoice domain is a recorded deferral (DEC-RL1-SCOPE-001). This portal renders canonical records only and does not fabricate POs.`)
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">PO Number</th>
 <th class="s-lr_pOFE4_J">Scope of Services</th>
 <th class="s-gY5FUZdHNU">Amount</th>
 <th class="s-lr_pOFE4_J">Issue Date</th>
 <th class="s-lr_pOFE4_J">Terms</th>
 <th class="s-lr_pOFE4_J">Status</th>
              </tr>
            </thead>
            <tbody>
              ${pos
                .map(
                  (po) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(po.poNumber)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(po.description)}</td>
 <td class="s-I8HUUerhjm">NGN ${po.amountNgn.toLocaleString("en-NG")}</td>
 <td class="s-jlCyZLbEPQ">${escapeHtml(po.dateIssued)}</td>
 <td class="s-gvP_yDU8_J">${escapeHtml(po.paymentTerms)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-ready">${escapeHtml(po.status.replace(/_/g, " "))}</span></td>
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

export function renderManagementOverviewHtml(snapshot: ManagementOverviewSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >EXECUTIVE COMMAND &bull; UX-HUB-004</span>
 <h1 class="s-n_bp1PhViu">
            VMN Consolidated Management Overview
          </h1>
 <p class="s-zrikAgYqXF">
            Computed live from canonical engines &bull; Every figure below is derived, never asserted
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="/workspace/executive" class="btn btn-secondary s-kd4he0W4Wm" >
            ${renderIcon("shield", { size: 16 })} Executive Room &rarr;
          </a>
        </div>
      </div>

 <div class="s-3ifFJEBbTo">
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Linear Channels Under Management</div>
 <div class="s-6AmaNpUFld">${snapshot?.broadcastChannels ?? 0}</div>
 <div class="s-_tdYXnR5PA">Canonical channel registry</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Open Carriage Incidents</div>
 <div class="s-iJYiVmvrV7">${snapshot?.openBroadcastIncidents ?? 0}</div>
 <div class="s-_tdYXnR5PA">From CarriageMonitoringEngine</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Commercial Pipeline (Deals)</div>
 <div class="s-sT-g5nwPta">${pipeline.deals}</div>
 <div class="s-_tdYXnR5PA">Contract value NGN ${pipeline.contractValueNgn.toLocaleString("en-NG")}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Recognised Revenue (Governed)</div>
 <div class="s-iJYiVmvrV7">NGN ${pipeline.recognizedRevenueNgn.toLocaleString("en-NG")}</div>
 <div class="s-_tdYXnR5PA">Cash collected NGN ${pipeline.cashCollectedNgn.toLocaleString("en-NG")} — kept distinct from recognition (FIN-01)</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Talent Registry</div>
 <div class="s-iJYiVmvrV7">${totalTalent}</div>
 <div class="s-_tdYXnR5PA">${verifiedTalent} verified via accelerator gates</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">AFCA Certificates Issued</div>
 <div class="s-iJYiVmvrV7">${snapshot?.academyCertificates ?? 0}</div>
 <div class="s-_tdYXnR5PA">Issued via AfcaAcademyService</div>
        </div>
      </div>

 <div class="vmn-card s-synEokD4Lr" >
 <p class="s-tD6DNc5hQ0">
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

export function renderRiskRegisterHtml(snapshot: RiskRegisterSnapshot | undefined, _user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_RISK_ISSUE_RECORDS")) {
    return renderFeatureDisabledNotice(
      "FF_SHARED_RISK_ISSUE_RECORDS",
      "Enterprise Risk Register (UX-REC-004)",
      "/workspace"
    );
  }

  const risks = snapshot?.risks || [];

  return `
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >GOVERNANCE &bull; UX-REC-004</span>
 <h1 class="s-n_bp1PhViu">
            Enterprise Risk Register &amp; Mitigation Control Ledger
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of the core work domain &bull; Governance mutation requires update:risk authority
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#log-risk" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("shield", { size: 16 })} Log Identified Risk &rarr;
          </a>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Assessed Enterprise Risks
        </h3>
        ${
          risks.length === 0
            ? renderEmptyRecords("No risks are recorded in the canonical register yet — log the first below. This register renders canonical records only.")
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Risk ID</th>
 <th class="s-lr_pOFE4_J">Title</th>
 <th class="s-lr_pOFE4_J">Category</th>
 <th class="s-WWQfr0I4fx">L×I</th>
 <th class="s-lr_pOFE4_J">Mitigation Control</th>
 <th class="s-lr_pOFE4_J">Owner</th>
 <th class="s-lr_pOFE4_J">Review Due</th>
 <th class="s-lr_pOFE4_J">Status</th>
              </tr>
            </thead>
            <tbody>
              ${risks
                .map((r) => {
                  const score = r.likelihood * r.impact;
                  return `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(r.id)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(r.title)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-neutral">${escapeHtml(r.category.replace(/_/g, " "))}</span></td>
 <td class="s-5fSyfN0kQ1"><span class="vmn-badge ${score >= 15 ? "badge-danger" : score >= 8 ? "badge-warning" : "badge-info"}">${r.likelihood}×${r.impact}=${score}</span></td>
 <td class="s-gvP_yDU8_J">${escapeHtml(r.mitigation)}</td>
 <td class="s-6FCnPHXEyo">${escapeHtml(r.owner)}</td>
 <td class="s-jlCyZLbEPQ">${escapeHtml(r.reviewDueAt)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${r.status === "CLOSED" ? "badge-ready" : "badge-warning"}">${escapeHtml(r.status)}</span></td>
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
 <div id="log-risk" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Log Identified Risk (UX-REC-004)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Writes a canonical RiskRecord via the core work domain (guarded mutation, update:risk).
        </p>
 <form method="POST" action="/api/v1/workspace/governance/risks" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Risk ID</label>
 <input type="text" name="id" required placeholder="e.g. RSK-2026-004" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Title</label>
 <input type="text" name="title" required placeholder="Risk title" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Category</label>
 <input type="text" name="category" required placeholder="e.g. BROADCAST_TRANSMISSION" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Likelihood (1–5)</label>
 <input type="number" name="likelihood" required min="1" max="5" value="3" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Impact (1–5)</label>
 <input type="number" name="impact" required min="1" max="5" value="3" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Owner</label>
 <input type="text" name="owner" required placeholder="Accountable owner" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Review Due Date</label>
 <input type="date" name="reviewDueAt" required class="s-eRsuZyv9DA" />
          </div>
 <div class="s-1bQzQqLk7S">
 <label class="s-glAYpXXGqp">Mitigation Control</label>
 <textarea name="mitigation" rows="2" required placeholder="Preventative / detective control description..." class="s-fpsb2azaU2"></textarea>
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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

export function renderIssueTrackerHtml(snapshot: IssueTrackerSnapshot | undefined, _user?: SessionUser): string {
  if (!isFeatureEnabled("FF_SHARED_RISK_ISSUE_RECORDS")) {
    return renderFeatureDisabledNotice(
      "FF_SHARED_RISK_ISSUE_RECORDS",
      "Operational Issue Tracker (UX-REC-005)",
      "/workspace"
    );
  }

  const issues = snapshot?.issues || [];

  return `
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >OPERATIONS &bull; UX-REC-005</span>
 <h1 class="s-n_bp1PhViu">
            Operational Issue Tracker &amp; Incident Escalation Desk
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of the core work domain &bull; Lifecycle enforced (OPEN → ACKNOWLEDGED → FIX_IN_PROGRESS → RESOLVED)
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#log-issue" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("bolt", { size: 16 })} Log Operational Incident &rarr;
          </a>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Active Incident Tickets
        </h3>
        ${
          issues.length === 0
            ? renderEmptyRecords("No issues are recorded in the canonical tracker yet — log the first below. This tracker renders canonical records only.")
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Issue ID</th>
 <th class="s-lr_pOFE4_J">Title</th>
 <th class="s-lr_pOFE4_J">Severity</th>
 <th class="s-lr_pOFE4_J">Raised By</th>
 <th class="s-lr_pOFE4_J">Assigned To</th>
 <th class="s-lr_pOFE4_J">State</th>
 <th class="s-gY5FUZdHNU">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody>
              ${issues
                .map((i) => {
                  const next: Record<string, string> = { OPEN: "ACKNOWLEDGED", ACKNOWLEDGED: "FIX_IN_PROGRESS", FIX_IN_PROGRESS: "RESOLVED" };
                  const action = next[i.status];
                  return `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(i.id)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(i.title)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${i.severity === "S1" ? "badge-danger" : i.severity === "S2" ? "badge-warning" : "badge-info"}">${escapeHtml(i.severity)}</span></td>
 <td class="s-6FCnPHXEyo">${escapeHtml(i.raisedBy)}</td>
 <td class="s-6FCnPHXEyo">${escapeHtml(i.assignedTo || "—")}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${i.status === "RESOLVED" ? "badge-ready" : "badge-info"}">${escapeHtml(i.status.replace(/_/g, " "))}</span></td>
 <td class="s-Uw0RpPbWMz">
                    ${
                      action
 ? `<form method="POST" action="/api/v1/workspace/governance/issues/${escapeHtml(i.id)}/transition" class="s-Q0_DLsKcmN">
                      <input type="hidden" name="target" value="${action}" />
 <button type="submit" class="btn btn-secondary s-Y-2hYlGyI-" >→ ${action.replace(/_/g, " ")}</button>
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
 <div id="log-issue" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Log Operational Incident (UX-REC-005)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Creates a canonical IssueRecord via the core work domain (guarded mutation, update:risk).
        </p>
 <form method="POST" action="/api/v1/workspace/governance/issues" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Issue ID</label>
 <input type="text" name="id" required placeholder="e.g. ISSUE-884" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Title</label>
 <input type="text" name="title" required placeholder="Short incident summary" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Severity</label>
 <select name="severity" required class="s-eRsuZyv9DA">
              <option value="S1">S1 — Urgent</option>
              <option value="S2">S2 — Elevated</option>
              <option value="S3">S3 — Standard</option>
              <option value="S4">S4 — Low</option>
            </select>
          </div>
          <div>
 <label class="s-glAYpXXGqp">Linked Risk ID (optional)</label>
 <input type="text" name="linkedRiskId" placeholder="RSK-2026-001" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-1bQzQqLk7S">
 <label class="s-glAYpXXGqp">Description</label>
 <textarea name="description" rows="2" required placeholder="Observed fault, affected service, initial assessment..." class="s-fpsb2azaU2"></textarea>
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
              ${renderIcon("check", { size: 16 })} Log Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
