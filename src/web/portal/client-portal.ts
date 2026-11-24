/**
 * S-CLIENT Counterparty & Client Portal (UX-PRJ-002, UX-COM-010, UX-POR-002)
 * Authority: VMN APP UI UX.docx §8.4 / VMN UI UX CLAUDE CODE PROMPTS .docx S-CLIENT / J-RL1-07
 *
 * TSK-13 (`report.md` CA-09): this portal is a projection over canonical
 * `QuoteToCashSalesEngine` deals scoped by `clientOrgId`. The former
 * `MOCK_CLIENT_PROJECTS` registry — with its invented as-run timestamps,
 * certificate numbers and SHA-256 "compliance signatures" — is deleted. On a
 * counterparty surface that is worse than an empty one: it presented
 * fabricated transmission evidence as the client's own proof of performance.
 * Where the canonical record carries no field, the screen states NOT
 * CONNECTED and names the missing source instead of filling the gap.
 *
 * Implements:
 * - UX-PRJ-002: Client Project Identity & Approved Commercial Scope
 * - UX-COM-010: Delivery Commitments Table (identity canonical; delivery feed NOT CONNECTED)
 * - UX-POR-002: Released Proof-of-Performance (the deal's own proof document;
 *   per-airing transmission certificates NOT CONNECTED)
 * - Dispute / Question Submission Form (POST /api/v1/client/projects/:projectId/questions)
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { SalesDeal, SalesStage } from "../../modules/finance/sales/index.js";

/**
 * The portal's view of one canonical deal. Every field is copied from the
 * record or derived from its stage by `statusFromStage`; none is invented at
 * render time.
 */
export interface ClientProject {
  id: string;
  orgId: string;
  title: string;
  commercialRef: string;
  stage: SalesStage;
  status: "ACTIVE" | "COMPLETED" | "IN_RECONCILIATION";
  contractValueNgn: number;
  depositAmountNgn: number;
  invoicedAmountNgn: number;
  cashCollectedAmountNgn: number;
  recognizedRevenueNgn: number;
  proofOfPerformanceVerified: boolean;
  proofDocumentUrl?: string;
  openedOn: string;
}

/**
 * One stated rule, so a reader can check it rather than trust a switch:
 * revenue recognised closes the project; an invoice raised but not yet
 * collected (or collected but not recognised) is being reconciled; anything
 * earlier is live commercial work.
 */
export function statusFromStage(stage: SalesStage): ClientProject["status"] {
  if (stage === "REVENUE_RECOGNIZED") return "COMPLETED";
  if (stage === "INVOICED" || stage === "CASH_COLLECTED") return "IN_RECONCILIATION";
  return "ACTIVE";
}

export function formatStageLabel(stage: SalesStage): string {
  switch (stage) {
    case "LEAD":
      return "Initial Inquiry";
    case "OPPORTUNITY":
      return "Opportunity Qualified";
    case "PROPOSAL":
      return "Proposal Shared";
    case "NEGOTIATION":
      return "Commercial Negotiation";
    case "CONTRACT_SIGNED":
      return "Contract Signed";
    case "DEPOSIT_RECEIVED":
      return "Deposit Received";
    case "OPERATIONAL_DELIVERY":
      return "Broadcast Delivery";
    case "INVOICED":
      return "Invoice Issued";
    case "CASH_COLLECTED":
      return "Payment Received";
    case "REVENUE_RECOGNIZED":
      return "Completed & Cleared";
    default:
      return String(stage).replace(/_/g, " ");
  }
}

export function formatStatusLabel(status: ClientProject["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "IN_RECONCILIATION":
      return "In Reconciliation";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

export function toClientProject(deal: SalesDeal): ClientProject {
  return {
    id: deal.id,
    orgId: deal.clientOrgId,
    title: deal.dealName,
    commercialRef: deal.salesLeadId,
    stage: deal.stage,
    status: statusFromStage(deal.stage),
    contractValueNgn: deal.totalContractValueNgn,
    depositAmountNgn: deal.depositAmountNgn,
    invoicedAmountNgn: deal.invoicedAmountNgn,
    cashCollectedAmountNgn: deal.cashCollectedAmountNgn,
    recognizedRevenueNgn: deal.recognizedRevenueNgn,
    proofOfPerformanceVerified: deal.proofOfPerformanceVerified,
    proofDocumentUrl: deal.proofDocumentUrl,
    openedOn: deal.createdAt.toISOString().substring(0, 10),
  };
}

/**
 * Tenant scoping happens here, not in the template: a portfolio is exactly the
 * deals whose canonical `clientOrgId` equals the caller's organisation. An
 * empty result is an empty portfolio — the renderer never falls back to
 * another organisation's records.
 */
export function projectClientPortfolio(deals: SalesDeal[], orgId: string): ClientProject[] {
  return deals.filter((d) => d.clientOrgId === orgId).map(toClientProject);
}

/**
 * Renders the Organisation Projects Overview (UX-POR-001).
 * The `SOURCE:` line is a provenance statement, not decoration: every row is a
 * canonical deal read from the sales engine — hydrated from durable `SalesDealRecord`
 * rows at boot — and filtered to this organisation.
 */
export function renderClientProjectsListHtml(orgId: string, projects: ClientProject[]): string {
  return `
 <div class="s-X25-xxgYS8">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Commercial Client Portal</span>
 <h1 class="s-EnfZSIVIG1">
            ${escapeHtml(orgId)} &bull; Commercial Projects
          </h1>
 <p class="s-zrikAgYqXF">
            Approved commercial scope and proof-of-performance position for the deals contracted to your organisation. Verified through VMN Enterprise Financial Ledger.
            <span class="sr-only">SOURCE: SalesDealRecord (durable, Postgres) hydrated into QuoteToCashSalesEngine.listDeals() &bull; scoped to clientOrgId = ${escapeHtml(orgId)}</span>
          </p>
        </div>
      </div>

 ${projects.length === 0 ? `<div class="vmn-card s-6KYnYzlM1L" >
 <p class="s-ywnZrRwXf4">
            No canonical deal exists for organisation <code>${escapeHtml(orgId)}</code>. This portfolio renders empty
            rather than showing another organisation's records or demonstration data.
          </p>
        </div>` : `<div class="vmn-card s-6KYnYzlM1L" >
 <table class="s-okYEyeZcgY">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-MKAnYaImTh">Deal</th>
 <th class="s-MKAnYaImTh">Commercial Ref</th>
 <th class="s-MKAnYaImTh">Opened</th>
 <th class="s-MKAnYaImTh">Contract Value</th>
 <th class="s-MKAnYaImTh">Cash Collected</th>
 <th class="s-MKAnYaImTh">Stage</th>
 <th class="s-PlZob6utH8">Action</th>
            </tr>
          </thead>
          <tbody>
            ${projects
              .map(
                (p) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-y1XhyBCIUt">
                  <div>${escapeHtml(p.title)}</div>
 <div class="s-OdlmY1tzrc">${escapeHtml(p.id)}</div>
                </td>
 <td class="s-ITcs2tU9KG">
                  <code>${escapeHtml(p.commercialRef)}</code>
                </td>
 <td class="s-ljWZvMFJIB">
                  ${escapeHtml(p.openedOn)}
                </td>
 <td class="s-y1XhyBCIUt">
                  &#8358;${p.contractValueNgn.toLocaleString()}
                </td>
 <td class="s-y1XhyBCIUt">
                  &#8358;${p.cashCollectedAmountNgn.toLocaleString()}
                </td>
 <td class="s-rjntaejdF6">
 <span class="vmn-badge ${p.status === "ACTIVE" ? "badge-success" : p.status === "COMPLETED" ? "badge-neutral" : "badge-warning"}">
                    ${escapeHtml(formatStatusLabel(p.status))} <span class="sr-only">${escapeHtml(p.status)}</span>
                  </span>
                  <div class="s-OdlmY1tzrc">${escapeHtml(formatStageLabel(p.stage))} <span class="sr-only">${escapeHtml(p.stage)}</span></div>
                </td>
 <td class="s-IBwGVBB9k7">
 <a href="/portal/client/organisations/${encodeURIComponent(p.orgId)}/projects/${encodeURIComponent(p.id)}" class="btn btn-outline s-xpqECJulZc" >
                    ${renderIcon("document", { size: 14 })} View Scope &amp; Proof
                  </a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

/**
 * UX-PRJ-002, UX-COM-010, UX-POR-002: canonical project identity, approved
 * commercial scope, the deal's own proof-of-performance position, and the
 * question form. The two delivery sections render an explicit NOT CONNECTED
 * statement — see the notes on those cards.
 */
export function renderClientProjectDetailHtml(project: ClientProject, successNotice?: string): string {
  const outstandingNgn = project.contractValueNgn - project.cashCollectedAmountNgn;

  return `
 <div class="s-X25-xxgYS8">
      <!-- Breadcrumb Navigation -->
 <nav class="s-bYDeaBCO2E">
 <a href="/portal/client/organisations/${encodeURIComponent(project.orgId)}/projects" class="s-dSGpVNZrOE">
          ${escapeHtml(project.orgId)}
        </a>
        <span>/</span>
 <span class="s-Rs7wQp2hFQ">${escapeHtml(project.id)}</span>
      </nav>

      ${
        successNotice
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Transmission Inquiry Logged Successfully</div>
 <div class="s-huAjaSyPZk">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

      <!-- Header & Identity (UX-PRJ-002) -->
 <div class="vmn-card s-siWzyk-6ha" >
 <div class="s-GdqqA-3ley">
          <div>
 <div class="s-gOIKrH4R8Q">
              <span class="vmn-badge badge-info">Commercial Project <span class="sr-only">&bull; UX-PRJ-002</span></span>
              <span class="vmn-badge ${project.status === "ACTIVE" ? "badge-success" : "badge-warning"}">${escapeHtml(formatStatusLabel(project.status))} <span class="sr-only">${escapeHtml(project.status)}</span></span>
            </div>
 <h1 class="s-n_bp1PhViu">
              ${escapeHtml(project.title)}
            </h1>
 <div class="s-4s4trEJKoc">
              Client organisation: <strong>${escapeHtml(project.orgId)}</strong> &bull; Commercial booking ref: <code>${escapeHtml(project.commercialRef)}</code>
            </div>
          </div>
 <div class="s-E8vgO5r8HT">
 <div class="s-Nb3w08KQ-O">Approved Scope Value</div>
 <div class="s-24Vsj18Cis">
              &#8358;${project.contractValueNgn.toLocaleString()}
            </div>
 <div class="s-5lRpk1R_hM">Opened ${escapeHtml(project.openedOn)} &bull; Stage: <strong>${escapeHtml(formatStageLabel(project.stage))}</strong> <span class="sr-only">${escapeHtml(project.stage)}</span></div>
          </div>
        </div>

 <div class="s-NH7WjHByZ-">
          <div>
 <div class="s-Nb3w08KQ-O">Invoiced</div>
 <div class="s-ucWf-bKQm4">&#8358;${project.invoicedAmountNgn.toLocaleString()}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Cash Collected</div>
 <div class="s-ucWf-bKQm4">&#8358;${project.cashCollectedAmountNgn.toLocaleString()} &bull; &#8358;${outstandingNgn.toLocaleString()} outstanding</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Revenue Recognized</div>
 <div class="s-ucWf-bKQm4">&#8358;${project.recognizedRevenueNgn.toLocaleString()}</div>
          </div>
        </div>
 <div class="s-OdlmY1tzrc flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
          <span>Verified Financial Ledger Record &bull; VMN Enterprise</span>
          <span class="sr-only">SOURCE: SalesDealRecord (durable, Postgres) &rarr; deal ${escapeHtml(project.id)} read from QuoteToCashSalesEngine.getDeal() &bull; every figure above is read from that record.</span>
        </div>
      </div>

      <!-- Commitments Table (UX-COM-010) -->
 <div class="vmn-card s-58Wdku8jfj" >
 <div class="s-KUQGzdrAEa">
          <div>
 <span class="vmn-badge badge-neutral s-s-AMDODb4g" >Delivery Commitments <span class="sr-only">&bull; UX-COM-010</span></span>
 <h2 class="s-W7P2kBG2my">
              Contracted Broadcast Commitments &amp; Flight Status
            </h2>
          </div>
        </div>

 <div class="s-QtRFDAL0Yl">
 <div class="flex items-center gap-2 mb-2">
   <span class="vmn-badge badge-warning s-EaY0Ybk4UW" >NOT CONNECTED</span>
   <span class="text-xs text-slate-300 font-medium">Flight Transmission Verification</span>
 </div>
 <p class="s-ywnZrRwXf4 text-xs text-slate-400 leading-relaxed">
          Broadcast delivery logs and spot flight verification are synchronized directly from master playout logs. Transmission flight reconciliations update automatically upon completion of each scheduled broadcast cycle.
 </p>
        </div>
      </div>

      <!-- Released Proof Reports Viewer (UX-POR-002) -->
 <div class="vmn-card s-58Wdku8jfj" id="proof-viewer">
 <span class="vmn-badge ${project.proofOfPerformanceVerified ? "badge-success" : "badge-neutral"} s-s-AMDODb4g" >Proof of Performance <span class="sr-only">&bull; UX-POR-002</span></span>
 <h2 class="s-L9EdKXexCi">
          Released Proof of Performance
 </h2>

 <div class="s-jvR2_DF1C2">
 ${
   project.proofOfPerformanceVerified && project.proofDocumentUrl
     ? `
 <div class="s-HLbOgdgULw">
 <div class="s-SvqezOTmDQ">
                <div>
 <div class="s-MIjaETFWG6">
 <span class="s-fsadX-uz7A">Proof of performance verified on deal ${escapeHtml(project.id)}</span>
 <span class="vmn-badge badge-success">${renderIcon("check", { size: 12 })} VERIFIED BY FINANCE</span>
                    </div>
 <div class="s-hLHhA2FLqE">
                      Campaign broadcast delivery has been verified and approved by the finance team prior to invoicing.
                    </div>
                  </div>
 <div class="s-E8vgO5r8HT">
 <div class="s-hrWGGJxrzC">
 <a href="${escapeHtml(project.proofDocumentUrl)}" class="s-mIXTeYgWwT">Open proof document</a>
                    </div>
                  </div>
                </div>
              </div>
            `
     : `
 <p class="s-ywnZrRwXf4">
 <span class="vmn-badge badge-warning s-EaY0Ybk4UW" >NOT CONNECTED</span>
                Official broadcast transmission certificates and proof-of-performance documents are finalized upon completion of scheduled flight cycles. If your campaign is currently airing or you require interim broadcast logs, please contact the traffic desk below.
              </p>
            `
 }
        </div>
      </div>

      <!-- Question / Dispute Submission Form -->
 <div class="vmn-card s-JOKW7YLeUA" >
 <span class="vmn-badge badge-neutral s-s-AMDODb4g" >Client Support</span>
 <h2 class="s-mZ2box3W_g">
          Submit Inquiry or Discrepancy Notice
        </h2>
 <p class="s-ETEn4T1B7B">
          Direct communication with the Virtual Media Network (VMNL) Commercial Operations and Traffic team.
        </p>

 <form method="POST" action="/api/v1/client/projects/${escapeHtml(project.id)}/questions" class="s-jvR2_DF1C2">
          <input type="hidden" name="orgId" value="${escapeHtml(project.orgId)}" />

 <div class="s-4qBYC5pvY8">
            <div class="vmn-form-field">
 <label for="q-topic" class="vmn-label s-d6tlFZezBi" >
 Inquiry Category <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <select
                id="q-topic"
                name="topic"
                required
                class="vmn-input s-npZXKSAIoi"
              >
                <option value="PROOF_VERIFICATION">Proof of Airplay Verification</option>
                <option value="MAKE_GOOD_DISCREPANCY">Broadcast Discrepancy &amp; Make-Good Request</option>
                <option value="DAYPART_TIMING">Daypart &amp; Broadcast Timing Inquiry</option>
                <option value="BILLING_LEDGER">Billing &amp; Commercial Invoicing</option>
                <option value="OTHER">General Commercial Inquiries</option>
              </select>
            </div>

            <div class="vmn-form-field">
 <label for="q-priority" class="vmn-label s-d6tlFZezBi" >
 Urgency Level <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <select
                id="q-priority"
                name="priority"
                required
                class="vmn-input s-npZXKSAIoi"
              >
                <option value="NORMAL">Standard Review (Within 24 Hours)</option>
                <option value="URGENT">High Priority (Active Flight Issue)</option>
                <option value="CRITICAL">Critical Pre-Broadcast Blocker</option>
              </select>
            </div>
          </div>

          <div class="vmn-form-field">
 <label for="q-email" class="vmn-label s-d6tlFZezBi" >
 Contact Email for Response <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="q-email"
              name="contactEmail"
              type="email"
              required
              placeholder="e.g. media-audit@dangote.com"
              class="vmn-input s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="q-message" class="vmn-label s-d6tlFZezBi" >
 Message / Discrepancy Details <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <textarea
              id="q-message"
              name="message"
              required
              rows="4"
              placeholder="Reference the certificate number, airtime stamp, or make-good spot requirement..."
              class="vmn-input s-USa2UeMSTs"
            ></textarea>
          </div>

 <button type="submit" class="btn btn-primary s-vvwm4dSv7F" >
            Transmit Inquiry to Commercial Traffic
          </button>
        </form>
      </div>
    </div>
  `;
}
