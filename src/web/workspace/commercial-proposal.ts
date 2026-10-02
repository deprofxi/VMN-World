/**
 * Commercial Proposal Builder & Interactive Quote Engine (UX-COM-006 & UX-COM-007)
 * Authority: VMN APP UI UX.docx §4.2 / BRD-PRD-001 §43, §70
 *
 * TODO-SCR-17: Proposals are canonical domain records stored in
 * CommercialProposalStore and every acceptance mutates the canonical deal on
 * QuoteToCashSalesEngine (stage PROPOSAL → NEGOTIATION → CONTRACT_SIGNED via
 * dual-authorisation signContract). The former hardcoded proposal fixture is
 * deleted; an empty store renders an honest empty state, never invented rows.
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { SessionUser } from "../../core/auth/index.js";
import { QuoteToCashSalesEngine, SalesDeal } from "../../modules/finance/sales/index.js";

export interface ProposalItem {
  id: string;
  name: string;
  channel: string;
  daypart: string;
  units: number;
  ratePerUnitNgn: number;
  discountPercent: number;
}

export type ProposalStatus = "DRAFT" | "PENDING_APPROVAL" | "CLIENT_REVIEW" | "ACCEPTED" | "REJECTED";

export interface CommercialProposal {
  id: string;
  clientName: string;
  clientOrgId: string;
  campaignTitle: string;
  flightStart: string;
  flightEnd: string;
  accountExec: string;
  items: ProposalItem[];
  status: ProposalStatus;
  /** Canonical Quote-to-Cash deal bound at creation time (SCR-17). */
  dealId: string;
  acceptedAt?: Date;
  acceptedBy?: string;
}

export function computeProposalTotals(items: ProposalItem[]): { grossTotal: number; netTotal: number; totalSavings: number } {
  const grossTotal = items.reduce((acc, it) => acc + it.units * it.ratePerUnitNgn, 0);
  const netTotal = items.reduce((acc, it) => {
    const discountedRate = it.ratePerUnitNgn * (1 - it.discountPercent / 100);
    return acc + it.units * discountedRate;
  }, 0);
  return { grossTotal, netTotal: Math.round(netTotal), totalSavings: Math.round(grossTotal - netTotal) };
}

/**
 * Canonical proposal store (SCR-17). Create links each proposal to a
 * QuoteToCashSalesEngine deal (stage PROPOSAL); acceptance advances the
 * canonical deal through the governed quote→contract handoff.
 */
export class CommercialProposalStore {
  private proposals = new Map<string, CommercialProposal>();

  constructor(private readonly salesEngine: QuoteToCashSalesEngine) {}

  /**
   * Creates a proposal AND its canonical deal in one governed step. The deal
   * starts at LEAD and is advanced to PROPOSAL; its value is the discounted
   * net contract value of the proposal items.
   */
  public createProposal(params: {
    id: string;
    clientName: string;
    clientOrgId: string;
    campaignTitle: string;
    flightStart: string;
    flightEnd: string;
    accountExec: string;
    items: ProposalItem[];
    salesLeadId: string;
  }): CommercialProposal {
    if (this.proposals.has(params.id)) {
      throw new Error(`[PROP-01] Proposal '${params.id}' already exists.`);
    }
    if (params.items.length === 0) {
      throw new Error("[PROP-02] Proposal must contain at least one inventory item.");
    }

    const { netTotal } = computeProposalTotals(params.items);
    if (netTotal <= 0) {
      throw new Error("[PROP-03] Proposal net contract value must be greater than zero.");
    }

    // Canonical quote→cash linkage: one deal per proposal, value = net total.
    const deal = this.salesEngine.createDeal({
      id: params.id,
      clientOrgId: params.clientOrgId,
      dealName: params.campaignTitle,
      totalContractValueNgn: netTotal,
      salesLeadId: params.salesLeadId,
    });
    this.salesEngine.advanceStage(deal.id, "PROPOSAL");

    const proposal: CommercialProposal = {
      id: params.id,
      clientName: params.clientName,
      clientOrgId: params.clientOrgId,
      campaignTitle: params.campaignTitle,
      flightStart: params.flightStart,
      flightEnd: params.flightEnd,
      accountExec: params.accountExec,
      items: params.items,
      status: "CLIENT_REVIEW",
      dealId: deal.id,
    };
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  public getProposal(id: string): CommercialProposal | undefined {
    return this.proposals.get(id);
  }

  public listProposals(): CommercialProposal[] {
    return Array.from(this.proposals.values());
  }

  /**
   * Quote acceptance (UX-COM-007). Mutates the CANONICAL deal: advances to
   * NEGOTIATION then executes the dual-authorisation contract sign-off, and
   * only then flips the proposal record to ACCEPTED. A proposal can be
   * accepted exactly once.
   */
  public acceptProposal(params: {
    proposalId: string;
    salesLeadId: string;
    financeApproverId: string;
    acceptedBy: string;
  }): { proposal: CommercialProposal; deal: SalesDeal } {
    const proposal = this.proposals.get(params.proposalId);
    if (!proposal) {
      throw new Error(`[PROP-404] Proposal '${params.proposalId}' not found.`);
    }
    if (proposal.status === "ACCEPTED") {
      throw new Error(`[PROP-04] Proposal '${params.proposalId}' has already been accepted.`);
    }

    const deal = this.salesEngine.getDeal(proposal.dealId);
    if (!deal) {
      throw new Error(`[PROP-05] Canonical deal '${proposal.dealId}' missing for proposal '${params.proposalId}'.`);
    }

    this.salesEngine.advanceStage(proposal.dealId, "NEGOTIATION");
    const signed = this.salesEngine.signContract({
      dealId: proposal.dealId,
      salesLeadId: params.salesLeadId,
      financeApproverId: params.financeApproverId,
    });

    proposal.status = "ACCEPTED";
    proposal.acceptedAt = new Date();
    proposal.acceptedBy = params.acceptedBy;
    return { proposal, deal: signed };
  }
}

/**
 * UX-COM-006: Interactive Commercial Proposal Builder.
 * Renders the requested canonical proposal, or the most recent one when no id
 * is given, or an honest empty state when the store holds none.
 */
export function renderProposalBuilderHtml(
  proposalOrStore: CommercialProposalStore | CommercialProposal | undefined,
  user?: SessionUser
): string {
  if (!isFeatureEnabled("FF_COMMERCIAL_PROPOSAL_BUILDER")) {
    return renderFeatureDisabledNotice(
      "FF_COMMERCIAL_PROPOSAL_BUILDER",
      "Commercial Proposal Builder (UX-COM-006)",
      "/workspace"
    );
  }

  const proposal = resolveRendererInput(proposalOrStore);

  return `
    <div style="max-width: 1080px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">SALES PIPELINE &bull; UX-COM-006</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">
            Commercial Proposal Builder
          </h1>
          ${
            proposal
              ? `<p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Proposal Ref: <code>${escapeHtml(proposal.id)}</code> &bull; Client: <strong>${escapeHtml(proposal.clientName)}</strong> &bull; Canonical deal: <code>${escapeHtml(proposal.dealId)}</code>
          </p>`
              : `<p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            No commercial proposals exist in the canonical store yet. Create one via <code>POST /api/v1/commercial/proposals</code> — this surface renders canonical records only and never invents rows.
          </p>`
          }
        </div>
        ${
          proposal
            ? `<div style="display: flex; gap: 10px;">
          <a href="/workspace/commercial/proposals/${escapeHtml(proposal.id)}/quote" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Preview Quote &rarr;
          </a>
        </div>`
            : ""
        }
      </div>
      ${
        proposal
          ? `
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Campaign Flight Parameters
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Campaign Title</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text);">${escapeHtml(proposal.campaignTitle)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Flight Period</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text);">${escapeHtml(proposal.flightStart)} &rarr; ${escapeHtml(proposal.flightEnd)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Account Executive</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text);">${escapeHtml(proposal.accountExec)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Lifecycle State</div>
            <div><span class="vmn-badge ${proposal.status === "ACCEPTED" ? "badge-ready" : "badge-warning"}">${escapeHtml(proposal.status)}</span></div>
          </div>
        </div>
      </div>

      <!-- Inventory Spot Package Table -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden; margin-bottom: 24px;">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--vmn-color-border); background: var(--vmn-color-background); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: var(--vmn-color-primary-text);">Spot Placement Packages &amp; Volume Incentives</span>
          <span class="vmn-badge badge-success">${proposal.items.length} Package Items</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 16px; font-weight: 700;">Inventory Item &amp; Daypart</th>
              <th style="padding: 12px 16px; font-weight: 700;">Channel</th>
              <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Units</th>
              <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Rate Card</th>
              <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Volume Disc.</th>
              <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Net Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.items
              .map((it) => {
                const itemNet = it.units * it.ratePerUnitNgn * (1 - it.discountPercent / 100);
                return `
              <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(it.name)}</div>
                  <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">${escapeHtml(it.daypart)}</div>
                </td>
                <td style="padding: 12px 16px; color: var(--vmn-color-secondary-text);">${escapeHtml(it.channel)}</td>
                <td style="padding: 12px 16px; text-align: center; font-weight: 700;">${it.units}</td>
                <td style="padding: 12px 16px; text-align: right; color: var(--vmn-color-secondary-text);">&#8358;${it.ratePerUnitNgn.toLocaleString()}</td>
                <td style="padding: 12px 16px; text-align: center;"><span class="vmn-badge badge-info">-${it.discountPercent}%</span></td>
                <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: var(--vmn-color-primary-text);">&#8358;${Math.round(itemNet).toLocaleString()}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Financial Totals Summary Card -->
      <div style="display: flex; justify-content: flex-end;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; width: 100%; max-width: 440px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; color: var(--vmn-color-secondary-text);">
            <span>Gross Rate Card Total:</span>
            <span>&#8358;${computeProposalTotals(proposal.items).grossTotal.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem; color: #059669; font-weight: 600;">
            <span>Volume Incentive Savings:</span>
            <span>-&#8358;${computeProposalTotals(proposal.items).totalSavings.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid var(--vmn-color-border); padding-top: 12px; font-size: 1.25rem; font-weight: 800; color: var(--vmn-color-primary-text);">
            <span>Net Contract Value:</span>
            <span>&#8358;${computeProposalTotals(proposal.items).netTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>`
          : ""
      }
    </div>
  `;
}

/**
 * UX-COM-007: Media Quote Review & Acceptance. Acceptance POSTs to the
 * guarded route which mutates the canonical deal via
 * CommercialProposalStore.acceptProposal (dual-authorisation sign-off).
 */
export function renderQuoteReviewHtml(
  proposalOrStore: CommercialProposalStore | CommercialProposal | undefined,
  successNotice?: string,
  errorMessage?: string
): string {
  if (!isFeatureEnabled("FF_COMMERCIAL_PROPOSAL_BUILDER")) {
    return renderFeatureDisabledNotice(
      "FF_COMMERCIAL_PROPOSAL_BUILDER",
      "Commercial Quote Review (UX-COM-007)",
      "/workspace"
    );
  }

  const proposal = resolveRendererInput(proposalOrStore);

  if (!proposal) {
    return `
    <div style="max-width: 960px; margin: 32px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px;">
        <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">BINDING MEDIA QUOTE &bull; UX-COM-007</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 8px 0 12px 0;">
          Broadcasting Quotation &amp; Term Sheet
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          No quote is available: the requested proposal does not exist in the canonical store. Quotes are issued only from created proposals linked to a Quote-to-Cash deal.
        </p>
      </div>
    </div>`;
  }

  const netTotal = computeProposalTotals(proposal.items).netTotal;
  const accepted = proposal.status === "ACCEPTED";

  return `
    <div style="max-width: 960px; margin: 32px auto; padding: 0 16px;">
      ${
        successNotice
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Quote Accepted &amp; Contract Signed</div>
            <div style="font-size: 0.85rem; color: #047857;">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        errorMessage
          ? `
        <div class="vmn-alert" role="alert" style="background: #FEF2F2; border: 1px solid #DC2626; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: 700; color: #991B1B;">Acceptance not completed</div>
          <div style="font-size: 0.85rem; color: #B91C1C;">${escapeHtml(errorMessage)}</div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--vmn-color-border); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">BINDING MEDIA QUOTE &bull; UX-COM-007</span>
            <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
              Broadcasting Quotation &amp; Term Sheet
            </h1>
            <div style="font-size: 0.9rem; color: var(--vmn-color-secondary-text);">
              Client: <strong>${escapeHtml(proposal.clientName)}</strong> &bull; Campaign: <strong>${escapeHtml(proposal.campaignTitle)}</strong> &bull; Canonical deal: <code>${escapeHtml(proposal.dealId)}</code>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Total Investment</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--vmn-color-primary-text);">&#8358;${netTotal.toLocaleString()}</div>
            <div style="font-size: 0.8rem; color: var(--vmn-color-text-muted);">Exclusive of 7.5% VAT</div>
          </div>
        </div>

        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--vmn-color-primary-text); margin-bottom: 12px;">
            Executive Summary &amp; Carriage Terms
          </h2>
          <p style="color: var(--vmn-color-secondary-text); font-size: 0.95rem; line-height: 1.6; margin: 0 0 12px 0;">
            Virtual Media Network Limited guarantees scheduled playout across the StarTimes DTT/DTH satellite transponder footprint in accordance with the NBC 7th Edition Broadcast Code. Proof-of-Air certificates with frame-accurate as-run logs will be released within 24 hours of flight.
          </p>
          <p style="color: var(--vmn-color-secondary-text); font-size: 0.85rem; line-height: 1.6; margin: 0;">
            Acceptance executes the governed quote-to-contract handoff on the canonical sales deal (stage ${escapeHtml(proposal.status === "ACCEPTED" ? "CONTRACT_SIGNED" : "PROPOSAL")}): sales-lead and finance dual authorisation is recorded before the contract is binding.
          </p>
        </div>

        ${
          accepted
            ? `<div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-weight: 700; color: #065F46;">This quote was accepted${proposal.acceptedAt ? ` on ${escapeHtml(proposal.acceptedAt.toISOString().substring(0, 10))}` : ""}${proposal.acceptedBy ? ` by ${escapeHtml(proposal.acceptedBy)}` : ""}. The canonical contract is signed; no further acceptance is possible.</div>
        </div>`
            : `<form method="POST" action="/api/v1/commercial/quotes/${escapeHtml(proposal.id)}/accept" style="border-top: 1px solid var(--vmn-color-border); padding-top: 24px;">
          <div class="vmn-form-field" style="margin-bottom: 20px;">
            <label for="sign-name" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Authorised Signatory Full Legal Name <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="sign-name"
              name="signatoryName"
              type="text"
              required
              placeholder="e.g. Group Commercial Director"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin-bottom: 24px;">
            <input type="checkbox" name="termsConfirmed" required style="margin-top: 4px;" />
            <span style="font-size: 0.875rem; color: var(--vmn-color-primary-text); line-height: 1.4;">
              I formally confirm acceptance of the spot placement schedule, rate card discounts, and standard commercial advertising agreement terms.
            </span>
          </label>

          <div style="display: flex; gap: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 48px; padding: 0 28px; font-weight: 700; cursor: pointer;">
              ${renderIcon("check", { size: 16 })} Digitally Accept Quote &amp; Generate Contract
            </button>
            <a href="/workspace/commercial/proposals/${escapeHtml(proposal.id)}/builder" class="btn btn-secondary" style="min-height: 48px; padding: 0 20px; display: inline-flex; align-items: center;">
              Modify Proposal
            </a>
          </div>
        </form>`
        }
      </div>
    </div>
  `;
}

function resolveLatest(store: CommercialProposalStore | undefined): CommercialProposal | undefined {
  if (!store) return undefined;
  const all = store.listProposals();
  return all.length > 0 ? all[all.length - 1] : undefined;
}

/**
 * Narrows a renderer input that may be a canonical proposal, a store (render
 * the latest), or nothing (honest empty state).
 */
function resolveRendererInput(
  input: CommercialProposalStore | CommercialProposal | undefined
): CommercialProposal | undefined {
  if (!input) return undefined;
  if (typeof (input as CommercialProposal).dealId === "string") {
    return input as CommercialProposal;
  }
  return resolveLatest(input as CommercialProposalStore);
}
