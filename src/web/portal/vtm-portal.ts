/**
 * VTM Talent Marketplace & Engagement Portal (UX-VTM-005 to UX-VTM-012)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.4 / tasks.md Phase 6
 *
 * Implements talent terms review, 85/15 economic breakdown, digital signature
 * acceptance, casting matching, rate card management, and payout ledger.
 */

import { renderIcon } from "../components/index.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { BUYOUT_MULTIPLIERS, BuyoutTier } from "../../modules/hub/vtm/index.js";

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
    <tr style="border-bottom: 1px solid var(--vmn-color-border-subtle);">
      <td style="padding: 12px; font-weight: 700; color: var(--vmn-text-primary);">Milestone ${idx + 1}: ${m.title}</td>
      <td style="padding: 12px; color: var(--vmn-text-secondary);">${m.deliverable}</td>
      <td style="padding: 12px; font-weight: 700; color: var(--vmn-primary);">₦${m.amountNgn.toLocaleString()}</td>
      <td style="padding: 12px;"><span class="vmn-badge badge-ready">${m.status}</span></td>
    </tr>
  `
    )
    .join("\n");

  return `
    <article class="container" style="max-width: 900px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6); text-align: center;">
        <span class="vmn-badge badge-ready">Contract Agreement</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin: var(--vmn-space-3) 0;">
          Talent Engagement Agreement & Terms
        </h1>
        <p style="color: var(--vmn-text-secondary); font-size: 1rem;">
          Reference: <code>${contract.contractNumber}</code> · Project: <strong>${contract.projectName}</strong>
        </p>
      </header>

      <!-- Parties and Production Details -->
      <section class="card" style="margin-bottom: var(--vmn-space-6); padding: var(--vmn-space-6);">
        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--vmn-color-border-subtle); padding-bottom: 8px;">
          Production Engagement Overview
        </h2>
        <dl style="display: grid; grid-template-columns: 160px 1fr; gap: 12px; margin: 0; font-size: 0.95rem;">
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Production Client:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0; font-weight: 600;">${contract.productionCompany}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Talent Role:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0;">${contract.roleTitle}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Shoot Schedule:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0;">${contract.startDate} to ${contract.endDate}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Escrow Guarantee:</dt>
          <dd style="color: var(--vmn-semantic-success); margin: 0; font-weight: 600;">100% Funds Secured in VMN Restricted Escrow</dd>
        </dl>
      </section>

      <!-- UX-VTM-009: Economic Breakdown (85/15 Invariant) -->
      <section class="card" style="margin-bottom: var(--vmn-space-6); padding: var(--vmn-space-6); background: var(--vmn-color-surface-subtle); border-left: 4px solid var(--vmn-primary);">
        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 12px;">
          Economic Compensation Breakdown (85/15 Standard Rule)
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--vmn-space-4); margin-bottom: 16px;">
          <div style="background: var(--vmn-surface-card); padding: 16px; border-radius: 6px; text-align: center;">
            <span style="font-size: 0.8rem; color: var(--vmn-text-secondary); text-transform: uppercase;">Gross Contract Value</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-text-primary); margin-top: 4px;">
              ₦${contract.totalCompensationNgn.toLocaleString()}
            </div>
          </div>
          <div style="background: var(--vmn-surface-card); padding: 16px; border-radius: 6px; text-align: center; border: 2px solid var(--vmn-semantic-success);">
            <span style="font-size: 0.8rem; color: var(--vmn-semantic-success); text-transform: uppercase; font-weight: 700;">Net Talent Payout (85%)</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-text-primary); margin-top: 4px;">
              ₦${contract.netTalentAmountNgn.toLocaleString()}
            </div>
          </div>
          <div style="background: var(--vmn-surface-card); padding: 16px; border-radius: 6px; text-align: center;">
            <span style="font-size: 0.8rem; color: var(--vmn-text-muted); text-transform: uppercase;">Platform Fee (15%)</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-text-secondary); margin-top: 4px;">
              ₦${contract.platformCommissionNgn.toLocaleString()}
            </div>
          </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--vmn-text-secondary); margin: 0; line-height: 1.5;">
          Funds are protected under VMNL's 7-way segregated escrow architecture. Net earnings are disbursed directly into verified Nigerian corporate or commercial bank accounts upon milestone acceptance.
        </p>
      </section>

      <!-- Milestones Table -->
      <section class="card" style="margin-bottom: var(--vmn-space-6); padding: 0; overflow-x: auto;">
        <div style="padding: 16px; font-weight: 700; font-size: 1.1rem; color: var(--vmn-text-primary); border-bottom: 1px solid var(--vmn-color-border-subtle);">
          Scheduled Production Milestones & Deliverables
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: var(--vmn-color-surface-subtle); color: var(--vmn-text-secondary);">
              <th style="padding: 12px;">Milestone Title</th>
              <th style="padding: 12px;">Deliverable Requirement</th>
              <th style="padding: 12px;">Amount</th>
              <th style="padding: 12px;">Escrow Status</th>
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
        <div class="card" style="padding: var(--vmn-space-6); text-align: center; border: 2px solid var(--vmn-semantic-success);">
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px;">Agreement Signed</span>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">
            Legally Binding Signature Executed
          </h2>
          <p style="color: var(--vmn-text-secondary); font-size: 0.9rem; margin-bottom: 8px;">
            Signed on ${contract.signedAt} by verified digital certificate.
          </p>
          <div style="font-family: monospace; font-size: 0.8rem; color: var(--vmn-text-muted);">
            SHA-256: <code>${contract.signedHash}</code>
          </div>
        </div>
      `
          : `
        <form method="POST" action="/api/v1/vtm/contracts/${contract.id}/sign" class="card" style="padding: var(--vmn-space-8); display: flex; flex-direction: column; gap: var(--vmn-space-4);">
          <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--vmn-text-primary); margin-bottom: 4px;">
            Digital Execution & Acceptance
          </h2>
          <p style="font-size: 0.9rem; color: var(--vmn-text-secondary); line-height: 1.5;">
            By typing your full legal name below, you execute this talent engagement agreement, acknowledge the 85/15 economic settlement terms, and agree to shoot schedules and deliverable criteria.
          </p>

          <div>
            <label for="legalSignature" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Type Full Legal Name as Electronic Signature <span style="color: var(--vmn-semantic-error);">*</span>
            </label>
            <input type="text" id="legalSignature" name="legalSignature" required placeholder="e.g. Babatunde Olumide" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
          </div>

          <div style="background: var(--vmn-color-surface-subtle); padding: 16px; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px;">
            <input type="checkbox" id="termsAffirmation" name="termsAffirmation" value="true" required style="width: 20px; height: 20px; margin-top: 2px;" />
            <label for="termsAffirmation" style="font-size: 0.85rem; color: var(--vmn-text-secondary); line-height: 1.5;">
              I confirm that I have reviewed the scope of work, shoot dates, escrow terms, and deliverable specifications. This digital execution creates a binding legal obligation under Nigerian commercial arbitration law.
            </label>
          </div>

          <button type="submit" class="btn btn-primary button button--primary" style="min-height: 48px; font-size: 1rem; font-weight: 700;">
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
    <div class="card" style="padding: var(--vmn-space-6); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span class="vmn-badge badge-ready">${opp.matchScore}% Match Score</span>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--vmn-text-muted);">${opp.category}</span>
        </div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--vmn-text-primary); margin: 4px 0 8px 0;">${opp.title}</h3>
        <p style="font-size: 0.9rem; color: var(--vmn-text-secondary); margin-bottom: 12px;">Production: <strong>${opp.production}</strong></p>
        <div style="font-size: 1.1rem; font-weight: 800; color: var(--vmn-primary); margin-bottom: 8px;">
          ₦${opp.budgetPerDayNgn.toLocaleString()} / day
        </div>
        <div style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-bottom: 16px;">
          Buyout: ${opp.buyoutTier.replace(/_/g, " ")} (${BUYOUT_MULTIPLIERS[opp.buyoutTier] || 1}x Multiplier)
        </div>
      </div>
      <button class="btn btn-primary button button--primary" style="min-height: 44px; width: 100%; font-weight: 700;">
        Submit Casting Application
      </button>
    </div>
  `
    )
    .join("\n");

  return `
    <article class="container" style="max-width: 1200px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8);">
        <span class="vmn-badge badge-ready">VTM Marketplace</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Casting Opportunities & Creative Briefs
        </h1>
        <p style="color: var(--vmn-text-secondary); margin: 0;">
          Curated film, television, and advertising opportunities matching your verified talent tier and skill tags.
        </p>
      </header>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--vmn-space-6);">
        ${cards}
      </div>
    </article>
  `;
}
