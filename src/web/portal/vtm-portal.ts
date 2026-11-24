/**
 * VTM Talent Marketplace & Engagement Portal (UX-VTM-005 to UX-VTM-012)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.4 / tasks.md Phase 6
 *
 * Implements talent terms review, 85/15 economic breakdown, digital signature
 * acceptance, casting matching, rate card management, and payout ledger.
 */

import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { BUYOUT_MULTIPLIERS, BuyoutTier } from "../../modules/hub/vtm/index.js";
// DEBT-009: contract, milestone and opportunity strings are authored by the
// counterparty (or, today, by the demo literal), not by this module, so they are
// escaped at the point they enter markup.
import { escapeHtml } from "../components/index.js";

export interface MockVtmContract {
  id: string;
  contractNumber: string;
  projectName: string;
  productionCompany: string;
  roleTitle: string;
  totalCompensationNgn: number;
  netTalentAmountNgn: number; // 85%
  platformCommissionNgn: number; // 15%
  startDate: string;
  endDate: string;
  isSigned: boolean;
  signedAt?: string;
  signedHash?: string;
  milestones: Array<{
    title: string;
    amountNgn: number;
    deliverable: string;
    status: string;
  }>;
}

/**
 * UX-VTM-008 & 009: Engagement Terms Review & Economic Compensation Breakdown
 */
export function renderVtmTermsReviewHtml(contract: MockVtmContract): string {
  const milestoneRows = contract.milestones
    .map(
      (m, idx) => `
 <tr class="s-z7JacQSDqk">
 <td class="s-0X4a4COY72">Milestone ${idx + 1}: ${escapeHtml(m.title)}</td>
 <td class="s-gL0G9B66bL">${escapeHtml(m.deliverable)}</td>
 <td class="s-PVlViuuo3G">₦${m.amountNgn.toLocaleString()}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-ready">${escapeHtml(m.status)}</span></td>
    </tr>
  `
    )
    .join("\n");

  return `
 <article class="container s-Gq1CYI3m9m" >
 <header class="s-S_I6YpSsii">
        <span class="vmn-badge badge-ready">Contract Agreement</span>
 <h1 class="s-jy1nuvWOw7">
          Talent Engagement Agreement & Terms
        </h1>
 <p class="s-AuP1EyxEBf">
          Reference: <code>${escapeHtml(contract.contractNumber)}</code> · Project: <strong>${escapeHtml(contract.projectName)}</strong>
        </p>
      </header>

      <!-- Parties and Production Details -->
 <section class="card s-aOQEhVcQ_B" >
 <h2 class="s-Om0jVh9g2w">
          Production Engagement Overview
        </h2>
 <dl class="s-8At14DM17U">
 <dt class="s-F7gY5MEZDy">Production Client:</dt>
 <dd class="s-tR1NYl3ZY2">${escapeHtml(contract.productionCompany)}</dd>
 <dt class="s-F7gY5MEZDy">Talent Role:</dt>
 <dd class="s-DwKwdeUqE1">${escapeHtml(contract.roleTitle)}</dd>
 <dt class="s-F7gY5MEZDy">Shoot Schedule:</dt>
 <dd class="s-DwKwdeUqE1">${escapeHtml(contract.startDate)} to ${escapeHtml(contract.endDate)}</dd>
 <dt class="s-F7gY5MEZDy">Escrow Guarantee:</dt>
 <dd class="s-75J06PRW51">100% Funds Secured in VMN Restricted Escrow</dd>
        </dl>
      </section>

      <!-- UX-VTM-009: Economic Breakdown (85/15 Invariant) -->
 <section class="card s-Y73Zn5KYXu" >
 <h2 class="s-JSToUoC75z">
          Economic Compensation Breakdown (85/15 Standard Rule)
        </h2>
 <div class="s-vN-YB36RMH">
 <div class="s-quN3jXhYhl">
 <span class="s-xJ657zAsLQ">Gross Contract Value</span>
 <div class="s-Ajhu2g89sd">
              ₦${contract.totalCompensationNgn.toLocaleString()}
            </div>
          </div>
 <div class="s-JRlJ-Qev52">
 <span class="s-cad0yQ-lDJ">Net Talent Payout (85%)</span>
 <div class="s-Ajhu2g89sd">
              ₦${contract.netTalentAmountNgn.toLocaleString()}
            </div>
          </div>
 <div class="s-quN3jXhYhl">
 <span class="s-x_D6mNEpV_">Platform Fee (15%)</span>
 <div class="s-VHqQLTVI9I">
              ₦${contract.platformCommissionNgn.toLocaleString()}
            </div>
          </div>
        </div>
 <p class="s-_tqIn3ZPXY">
          Funds are protected under VMNL's secure segregated escrow accounts. Net earnings are disbursed directly into verified Nigerian corporate or commercial bank accounts upon milestone acceptance.
        </p>
      </section>

      <!-- Milestones Table -->
 <section class="card s-ZBsY0hSfSL" >
 <div class="s-mv9Y99H955">
          Scheduled Production Milestones & Deliverables
        </div>
 <table class="s-t-Ktq1qpPd">
          <thead>
 <tr class="s-PVPp4tf1N4">
 <th class="s-6FCnPHXEyo">Milestone Title</th>
 <th class="s-6FCnPHXEyo">Deliverable Requirement</th>
 <th class="s-6FCnPHXEyo">Amount</th>
 <th class="s-6FCnPHXEyo">Escrow Status</th>
            </tr>
          </thead>
          <tbody>
            ${milestoneRows}
          </tbody>
        </table>
      </section>

      <!-- UX-VTM-010: Digital Signature Acceptance Form -->
      ${
        contract.isSigned
          ? `
 <div class="card s-0d_rKmV0-n" >
 <span class="vmn-badge badge-ready s-fzy69kMBd1" >Agreement Signed</span>
 <h2 class="s-aMXDq93VWh">
            Legally Binding Signature Executed
          </h2>
 <p class="s-EaI1YscjpR">
            Signed on ${escapeHtml(contract.signedAt)} by verified digital certificate.
          </p>
 <div class="s-Wag9ZD-NOW">
            SHA-256: <code>${escapeHtml(contract.signedHash)}</code>
          </div>
        </div>
      `
          : `
 <form method="POST" action="/api/v1/vtm/contracts/${escapeHtml(contract.id)}/sign" class="card s-sqzC72lluV" >
 <h2 class="s-2FSZNGekMT">
            Digital Execution & Acceptance
          </h2>
 <p class="s--YWDCnnLFV">
            By typing your full legal name below, you execute this talent engagement agreement, acknowledge the 85/15 economic settlement terms, and agree to shoot schedules and deliverable criteria.
          </p>

          <div>
 <label for="legalSignature" class="s-oMHwiwajnC">
 Type Full Legal Name as Electronic Signature <span class="s-R3NEaqY8J-">*</span>
            </label>
 <input type="text" id="legalSignature" name="legalSignature" required placeholder="e.g. Babatunde Olumide" class="input s-UPrN9pHjcM" />
          </div>

 <div class="s-uaYMBvJysP">
 <input type="checkbox" id="termsAffirmation" name="termsAffirmation" value="true" required class="s-9Isrvn5gw2" />
 <label for="termsAffirmation" class="s-EIgsbg6jRv">
              I confirm that I have reviewed the scope of work, shoot dates, escrow terms, and deliverable specifications. This digital execution creates a binding legal obligation under Nigerian commercial arbitration law.
            </label>
          </div>

 <button type="submit" class="btn btn-primary button button--primary s-HDpEMjHOpj" >
            Sign & Execute Engagement Contract
          </button>
        </form>
      `
      }
    </article>
  `;
}

/**
 * UX-VTM-005 & 006: Opportunity Matching & Casting Workbench
 */
export function renderVtmMarketplaceHtml(opportunities: Array<{
  id: string;
  title: string;
  production: string;
  category: string;
  matchScore: number;
  budgetPerDayNgn: number;
  buyoutTier: BuyoutTier;
}>): string {
  if (!isFeatureEnabled("FF_VTM_MARKETPLACE_DEPLOYMENT")) {
    return renderFeatureDisabledNotice("FF_VTM_MARKETPLACE_DEPLOYMENT", "VTM Talent Marketplace Deployment");
  }

  const cards = opportunities
    .map(
      (opp) => `
 <div class="card s-_Eo7me1G2b" >
      <div>
 <div class="s-QBgwgYUD6o">
          <span class="vmn-badge badge-ready">${escapeHtml(opp.matchScore)}% Match Score</span>
 <span class="s-LjiBFW-B18">${escapeHtml(opp.category)}</span>
        </div>
 <h3 class="s--AXXFl7-B0">${escapeHtml(opp.title)}</h3>
 <p class="s-5ASyq8OqJg">Production: <strong>${escapeHtml(opp.production)}</strong></p>
 <div class="s-cdCbWj2_iT">
          ₦${opp.budgetPerDayNgn.toLocaleString()} / day
        </div>
 <div class="s-JOJmlocg2U">
          Buyout: ${opp.buyoutTier.replace(/_/g, " ")} (${BUYOUT_MULTIPLIERS[opp.buyoutTier] || 1}x Multiplier)
        </div>
      </div>
 <button class="btn btn-primary button button--primary s-qOmA8-82zi" >
        Submit Casting Application
      </button>
    </div>
  `
    )
    .join("\n");

  return `
 <article class="container s-bJt7BJCshA" >
 <header class="s-8KqcJvoCxL">
        <span class="vmn-badge badge-ready">VTM Marketplace</span>
 <h1 class="s-yrxYod1Dke">
          Casting Opportunities & Creative Briefs
        </h1>
 <p class="s-Q99I6jpLHa">
          Curated film, television, and advertising opportunities matching your verified talent tier and skill tags.
        </p>
      </header>

 <div class="s-sWhhVoBuXm">
        ${cards}
      </div>
    </article>
  `;
}
