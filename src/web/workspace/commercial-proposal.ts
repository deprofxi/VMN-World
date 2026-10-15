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
  _user?: SessionUser
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
 <div class="s-pDOVXGiU2L">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >SALES PIPELINE &bull; UX-COM-006</span>
 <h1 class="s-EnfZSIVIG1">
            Commercial Proposal Builder
          </h1>
          ${
            proposal
 ? `<p class="s-zrikAgYqXF">
            Proposal Ref: <code>${escapeHtml(proposal.id)}</code> &bull; Client: <strong>${escapeHtml(proposal.clientName)}</strong> &bull; Canonical deal: <code>${escapeHtml(proposal.dealId)}</code>
          </p>`
 : `<p class="s-zrikAgYqXF">
            No commercial proposals exist in the canonical store yet. Create one via <code>POST /api/v1/commercial/proposals</code> — this surface renders canonical records only and never invents rows.
          </p>`
          }
        </div>
        ${
          proposal
 ? `<div class="s-1ffWzM6Quc">
 <a href="/workspace/commercial/proposals/${escapeHtml(proposal.id)}/quote" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Preview Quote &rarr;
          </a>
        </div>`
            : ""
        }
      </div>
      ${
        proposal
          ? `
 <div class="vmn-card s-58Wdku8jfj" >
 <h2 class="s-GQWXb2_MRq">
          Campaign Flight Parameters
        </h2>
 <div class="s-_kPDsWlOkW">
          <div>
 <div class="s-Nb3w08KQ-O">Campaign Title</div>
 <div class="s-RvEwnh2gYk">${escapeHtml(proposal.campaignTitle)}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Flight Period</div>
 <div class="s-RvEwnh2gYk">${escapeHtml(proposal.flightStart)} &rarr; ${escapeHtml(proposal.flightEnd)}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Account Executive</div>
 <div class="s-RvEwnh2gYk">${escapeHtml(proposal.accountExec)}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Lifecycle State</div>
            <div><span class="vmn-badge ${proposal.status === "ACCEPTED" ? "badge-ready" : "badge-warning"}">${escapeHtml(proposal.status)}</span></div>
          </div>
        </div>
      </div>

      <!-- Inventory Spot Package Table -->
 <div class="vmn-card s-wcVsfAg15v" >
 <div class="s-dLeS_DPTdT">
 <span class="s-v9ujfxeGxB">Spot Placement Packages &amp; Volume Incentives</span>
          <span class="vmn-badge badge-success">${proposal.items.length} Package Items</span>
        </div>
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-A_Iz40xZtX">
 <th class="s-MKAnYaImTh">Inventory Item &amp; Daypart</th>
 <th class="s-MKAnYaImTh">Channel</th>
 <th class="s-oMc7U7Ha0O">Units</th>
 <th class="s-PlZob6utH8">Rate Card</th>
 <th class="s-oMc7U7Ha0O">Volume Disc.</th>
 <th class="s-PlZob6utH8">Net Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.items
              .map((it) => {
                const itemNet = it.units * it.ratePerUnitNgn * (1 - it.discountPercent / 100);
                return `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-te3BDKRRsJ">
 <div class="s-v9ujfxeGxB">${escapeHtml(it.name)}</div>
 <div class="s-OdlmY1tzrc">${escapeHtml(it.daypart)}</div>
                </td>
 <td class="s-_QxDliOZ47">${escapeHtml(it.channel)}</td>
 <td class="s-V08YmU-HsM">${it.units}</td>
 <td class="s-W_dnHLVmdE">&#8358;${it.ratePerUnitNgn.toLocaleString()}</td>
 <td class="s-LFVsd3Qfe0"><span class="vmn-badge badge-info">-${it.discountPercent}%</span></td>
 <td class="s-8r9s_0NSbH">&#8358;${Math.round(itemNet).toLocaleString()}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Financial Totals Summary Card -->
 <div class="s--PW0UlQXH-">
 <div class="vmn-card s-hVjsKwradD" >
 <div class="s-puEqlkbKzT">
            <span>Gross Rate Card Total:</span>
            <span>&#8358;${computeProposalTotals(proposal.items).grossTotal.toLocaleString()}</span>
          </div>
 <div class="s-7QIZhf2_08">
            <span>Volume Incentive Savings:</span>
            <span>-&#8358;${computeProposalTotals(proposal.items).totalSavings.toLocaleString()}</span>
          </div>
 <div class="s-bPo7Difu_U">
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
 <div class="s-k3X1RRTyyB">
 <div class="vmn-card s-UfkZM9inhs" >
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >BINDING MEDIA QUOTE &bull; UX-COM-007</span>
 <h1 class="s-x9iw23zc1_">
          Broadcasting Quotation &amp; Term Sheet
        </h1>
 <p class="s-74eGsJhV6B">
          No quote is available: the requested proposal does not exist in the canonical store. Quotes are issued only from created proposals linked to a Quote-to-Cash deal.
        </p>
      </div>
    </div>`;
  }

  const netTotal = computeProposalTotals(proposal.items).netTotal;
  const accepted = proposal.status === "ACCEPTED";

  return `
 <div class="s-k3X1RRTyyB">
      ${
        successNotice
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Quote Accepted &amp; Contract Signed</div>
 <div class="s-huAjaSyPZk">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        errorMessage
          ? `
 <div class="vmn-alert s-6zhA7w7xb4" role="alert" >
 <div class="s-Hr-29x9Riz">Acceptance not completed</div>
 <div class="s-fBvDcjQpto">${escapeHtml(errorMessage)}</div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-sQ4H2l8IG7" >
 <div class="s-xCgVe5R7-o">
          <div>
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >BINDING MEDIA QUOTE &bull; UX-COM-007</span>
 <h1 class="s-n_bp1PhViu">
              Broadcasting Quotation &amp; Term Sheet
            </h1>
 <div class="s-4s4trEJKoc">
              Client: <strong>${escapeHtml(proposal.clientName)}</strong> &bull; Campaign: <strong>${escapeHtml(proposal.campaignTitle)}</strong> &bull; Canonical deal: <code>${escapeHtml(proposal.dealId)}</code>
            </div>
          </div>
 <div class="s-E8vgO5r8HT">
 <div class="s-Nb3w08KQ-O">Total Investment</div>
 <div class="s-Bd0-zgvy61">&#8358;${netTotal.toLocaleString()}</div>
 <div class="s-Zda0APXQzv">Exclusive of 7.5% VAT</div>
          </div>
        </div>

 <div class="s-PkP2-D_KTq">
 <h2 class="s-whGI4FvLGc">
            Executive Summary &amp; Carriage Terms
          </h2>
 <p class="s-9lzrNLZoT4">
            Virtual Media Network Limited guarantees scheduled playout across the StarTimes DTT/DTH satellite transponder footprint in accordance with the NBC 7th Edition Broadcast Code. Proof-of-Air certificates with frame-accurate as-run logs will be released within 24 hours of flight.
          </p>
 <p class="s-EC84oGvvhB">
            Acceptance executes the governed quote-to-contract handoff on the canonical sales deal (stage ${escapeHtml(proposal.status === "ACCEPTED" ? "CONTRACT_SIGNED" : "PROPOSAL")}): sales-lead and finance dual authorisation is recorded before the contract is binding.
          </p>
        </div>

        ${
          accepted
 ? `<div class="vmn-alert s-PKduv4p2I5" >
 <div class="s-4jLxKmoprh">This quote was accepted${proposal.acceptedAt ? ` on ${escapeHtml(proposal.acceptedAt.toISOString().substring(0, 10))}` : ""}${proposal.acceptedBy ? ` by ${escapeHtml(proposal.acceptedBy)}` : ""}. The canonical contract is signed; no further acceptance is possible.</div>
        </div>`
 : `<form method="POST" action="/api/v1/commercial/quotes/${escapeHtml(proposal.id)}/accept" class="s-ybLJvGp_-m">
 <div class="vmn-form-field s-t1-tAAl8Ne" >
 <label for="sign-name" class="vmn-label s-d6tlFZezBi" >
 Authorised Signatory Full Legal Name <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="sign-name"
              name="signatoryName"
              type="text"
              required
              placeholder="e.g. Group Commercial Director"
              class="vmn-input"
 class="s-npZXKSAIoi"
            />
          </div>

 <label class="s-F0WRsenTRl">
 <input type="checkbox" name="termsConfirmed" required class="s-xxNz4ecjPo" />
 <span class="s-pooHE0Pomj">
              I formally confirm acceptance of the spot placement schedule, rate card discounts, and standard commercial advertising agreement terms.
            </span>
          </label>

 <div class="s-1jFqfgs1FA">
 <button type="submit" class="btn btn-primary s-jK_oHpQVeg" >
              ${renderIcon("check", { size: 16 })} Digitally Accept Quote &amp; Generate Contract
            </button>
 <a href="/workspace/commercial/proposals/${escapeHtml(proposal.id)}/builder" class="btn btn-secondary s-rQ5Hnx2FIg" >
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
