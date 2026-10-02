/**
 * Governance, Editorial Review, and Broadcast Operational Workbenches
 * Authority: VMN APP UI UX.docx §8.4 / VMN UI UX CLAUDE CODE PROMPTS .docx
 *
 * Implements:
 * - UX-BR-012: Broadcast Schedule Review & Rights Blocker Explanations (J-RL1-08)
 * - UX-GOV-004: Rights Review & Exemption Request (J-RL1-09)
 * - UX-BR-030 / UX-GOV-006: Proof-of-Air Exceptions Workbench (J-RL1-10)
 * - UX-CMS-001..008: Content Review & Publication Workflow (J-RL1-11)
 * - UX-GOV-001/002: Multi-Tier Governance & Approval Review (J-RL1-14)
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { SessionUser } from "../../core/auth/index.js";
import { createApproval, listAllApprovals } from "../../core/approvals/index.js";

/** Human-readable copy for approval decision failure codes (UX-GOV-002). */
const APPROVAL_ERROR_COPY: Record<string, string> = {
  APR_FORBIDDEN: "Your active role is not authorised to decide this category.",
  APR_STALE_REVISION: "The object changed after the decision was opened. Re-review the current revision and decide again.",
  APR_SOD_SELF: "Separation of duties: the initiator of a request cannot decide their own request.",
  APR_FOUR_EYES: "Four-eyes principle: a second, distinct approver is required for this value band.",
  APR_LIMIT: "Your financial authority limit is below this approval's scope.",
  APR_REASON_REQUIRED: "A recorded reason is required for every decision.",
  APR_ALREADY_DECIDED: "This approval has already been decided.",
  APR_NOT_FOUND: "Approval not found.",
};

/**
 * UX-BR-012: Broadcast Schedule Review (J-RL1-08)
 */
export function renderBroadcastScheduleReviewHtml(options: {
  channel?: string;
  date?: string;
  hasBlocker?: boolean;
} = {}): string {
  const channel = options.channel || "Nigezie Xtreme (NXTR)";
  const date = options.date || "2026-09-30";
  const hasBlocker = options.hasBlocker ?? true;

  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-live" style="margin-bottom: 8px; font-weight: 700;">OPERATIONS &bull; UX-BR-012</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Broadcast Master Schedule Review
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Transmission Agenda for <strong>${escapeHtml(channel)}</strong> &bull; Date: <strong>${escapeHtml(date)}</strong> (WAT / UTC+1)
          </p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="/broadcast/schedule/grid" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("calendar", { size: 16 })} Visual Grid
          </a>
          <a href="/broadcast/rights/review-request" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("shield", { size: 16 })} Request Rights Waiver
          </a>
        </div>
      </div>

      ${
        hasBlocker
          ? `
        <div style="background: #FEF2F2; border: 2px solid #EF4444; border-radius: var(--vmn-radius-lg); padding: 20px 24px; margin-bottom: 28px;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="color: #DC2626; margin-top: 2px;">
              ${renderIcon("warning", { size: 24 })}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #991B1B; font-size: 1.05rem;">
                  CRITICAL RIGHTS BLOCKER &bull; Playout Automated Ingest Lock
                </span>
                <span class="vmn-badge badge-warning">AIR TIME -02:14:00</span>
              </div>
              <p style="color: #7F1D1D; font-size: 0.9rem; line-height: 1.5; margin: 0 0 12px 0;">
                Slot <strong>20:30 - 21:45 WAT</strong> (<em>Urban Sound Showcase #4102</em>) has failed StarTimes Carriage Clearance.
                Distributor contract has a regional holdback on StarTimes DTT Multiplex 4 expiring 2026-10-01.
              </p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="/broadcast/rights/review-request?slotId=SLOT-4102" class="btn btn-primary" style="min-height: 38px; font-size: 0.85rem; padding: 0 16px; background: #DC2626; border-color: #DC2626;">
                  Resolve Blocker / Request Emergency Waiver &rarr;
                </a>
                <a href="/broadcast/playout/live" class="btn btn-outline" style="min-height: 38px; font-size: 0.85rem; padding: 0 16px; border-color: #DC2626; color: #DC2626;">
                  Prime Emergency Cultural Filler
                </a>
              </div>
            </div>
          </div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px; font-weight: 700;">Slot (WAT)</th>
              <th style="padding: 12px 14px; font-weight: 700;">Programme Title</th>
              <th style="padding: 12px 14px; font-weight: 700;">Technical Specs</th>
              <th style="padding: 12px 14px; font-weight: 700;">Audio Loudness</th>
              <th style="padding: 12px 14px; font-weight: 700;">Rights Status</th>
              <th style="padding: 12px 14px; font-weight: 700; text-align: right;">Transmission State</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-family: monospace;">18:00 - 19:00</td>
              <td style="padding: 12px 14px; font-weight: 700; color: var(--vmn-color-primary-text);">
                Xtreme Street Hop Hits (Ep. 44)
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">1080i50 H.264</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">-23.1 LUFS OK</span></td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">Cleared All Carriage</span></td>
              <td style="padding: 12px 14px; text-align: right; color: var(--vmn-color-text-muted);">Transmitted</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--vmn-color-border); background: var(--vmn-color-background);">
              <td style="padding: 12px 14px; font-family: monospace; font-weight: 700;">19:00 - 20:30</td>
              <td style="padding: 12px 14px; font-weight: 800; color: var(--vmn-color-primary-text);">
                Afrobeat Titans Live Concert
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">1080i50 H.264</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">-23.0 LUFS OK</span></td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">Cleared StarTimes</span></td>
              <td style="padding: 12px 14px; text-align: right;"><span class="vmn-badge badge-live">ON AIR NOW</span></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--vmn-color-border); background: #FEF2F2;">
              <td style="padding: 12px 14px; font-family: monospace; font-weight: 700; color: #DC2626;">20:30 - 21:45</td>
              <td style="padding: 12px 14px; font-weight: 700; color: #991B1B;">
                Urban Sound Showcase #4102
              </td>
              <td style="padding: 12px 14px; color: #7F1D1D;">1080i50 H.264</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">-23.2 LUFS OK</span></td>
              <td style="padding: 12px 14px;">
                <span class="vmn-badge badge-warning" style="background: #FEE2E2; color: #991B1B; border: 1px solid #DC2626;">
                  RIGHTS HOLD (StarTimes DTT)
                </span>
              </td>
              <td style="padding: 12px 14px; text-align: right;">
                <a href="/broadcast/rights/review-request?slotId=SLOT-4102" class="btn btn-outline" style="min-height: 32px; padding: 0 10px; font-size: 0.8rem; border-color: #DC2626; color: #DC2626;">
                  Review Blocker
                </a>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-family: monospace;">21:45 - 23:00</td>
              <td style="padding: 12px 14px; font-weight: 700; color: var(--vmn-color-primary-text);">
                Lagos Underground Beats (Vol. 3)
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">1080i50 H.264</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">-22.9 LUFS OK</span></td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">Cleared All Carriage</span></td>
              <td style="padding: 12px 14px; text-align: right;"><span class="vmn-badge badge-neutral">Queued Playout</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * UX-GOV-004: Rights Review Request (J-RL1-09)
 */
export function renderRightsReviewRequestHtml(options: {
  slotId?: string;
  submitted?: boolean;
} = {}): string {
  const slotId = options.slotId || "SLOT-4102";

  return `
    <div style="max-width: 680px; margin: 36px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="margin-bottom: 24px;">
          <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">GOVERNANCE &bull; UX-GOV-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Expedited Rights Clearance &amp; Waiver Request
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.9rem;">
            Submit an emergency clearance request to the Broadcast Rights Coordinator and Legal Counsel.
          </p>
        </div>

        ${
          options.submitted
            ? `
          <div style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 20px; margin-bottom: 24px; text-align: center;">
            <div style="color: #059669; margin-bottom: 8px;">${renderIcon("check", { size: 32 })}</div>
            <div style="font-weight: 800; color: #065F46; font-size: 1.1rem; margin-bottom: 4px;">Emergency Waiver Dispatched</div>
            <p style="color: #047857; font-size: 0.9rem; margin: 0 0 16px 0;">
              Ticket <strong>RW-2026-0931</strong> transmitted to Broadcast Rights Coordinator. SLA countdown: 30 minutes.
            </p>
            <a href="/broadcast/schedule/review" class="btn btn-primary" style="min-height: 40px; padding: 0 20px;">
              Return to Schedule Review
            </a>
          </div>
        `
            : `
          <form method="POST" action="/api/v1/broadcast/rights/review-requests" style="display: flex; flex-direction: column; gap: 18px;">
            <input type="hidden" name="slotId" value="${escapeHtml(slotId)}" />

            <div class="vmn-form-field">
              <label class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">Target Programme Slot</label>
              <input
                type="text"
                disabled
                value="${escapeHtml(slotId)}: Urban Sound Showcase #4102 (20:30 - 21:45 WAT)"
                class="vmn-input"
                style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); background: var(--vmn-color-background);"
              />
            </div>

            <div class="vmn-form-field">
              <label for="rw-carrier" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Carriage Platform Exemption <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <select
                id="rw-carrier"
                name="carrier"
                required
                class="vmn-input"
                style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              >
                <option value="STARTIMES_DTT">StarTimes DTT Carriage (Multiplex 4)</option>
                <option value="STARTIMES_DTH">StarTimes DTH Satellite Feed</option>
                <option value="TERRESTRIAL_LAGOS">Lagos Terrestrial Carriage</option>
                <option value="AZEEBO_SIMULCAST">Azeebo+ Mobile Simulcast</option>
              </select>
            </div>

            <div class="vmn-form-field">
              <label for="rw-distributor" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Licensor / Content Distributor <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-distributor"
                name="distributor"
                type="text"
                required
                value="Afro-Beat Media Global Ltd"
                class="vmn-input"
                style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              />
            </div>

            <div class="vmn-form-field">
              <label for="rw-justification" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Waiver Justification &amp; Authority <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <textarea
                id="rw-justification"
                name="justification"
                required
                rows="4"
                placeholder="State the contractual amendment, oral distributor consent, or emergency broadcast override reason..."
                class="vmn-input"
                style="width: 100%; padding: 10px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              ></textarea>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex: 1; min-height: 46px; font-weight: 700; cursor: pointer;">
                Submit Expedited Waiver Request
              </button>
              <a href="/broadcast/schedule/review" class="btn btn-secondary" style="min-height: 46px; padding: 0 20px; display: inline-flex; align-items: center;">
                Cancel
              </a>
            </div>
          </form>
        `
        }
      </div>
    </div>
  `;
}

/**
 * UX-BR-030 & UX-GOV-006: Proof-of-Air Exceptions Workbench (J-RL1-10)
 */
export function renderPoaExceptionsWorkbenchHtml(options: { resolvedId?: string } = {}): string {
  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">RECONCILIATION &bull; UX-BR-030 / UX-GOV-006</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Proof-of-Air Exceptions Workbench
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Audit as-run playout variances, clipping discrepancies, and commercial make-good resolutions.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/broadcast/proof-of-air" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Dispatch Certificates
          </a>
        </div>
      </div>

      ${
        options.resolvedId
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Exception ${escapeHtml(options.resolvedId)} Successfully Remediated</div>
            <div style="font-size: 0.85rem; color: #047857;">Make-good slot reserved and counterparty notification logged to ledger.</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px; font-weight: 700;">Exception ID</th>
              <th style="padding: 12px 14px; font-weight: 700;">Campaign / Client</th>
              <th style="padding: 12px 14px; font-weight: 700;">Planned vs As-Run</th>
              <th style="padding: 12px 14px; font-weight: 700;">Discrepancy Nature</th>
              <th style="padding: 12px 14px; font-weight: 700;">Recommended Remedy</th>
              <th style="padding: 12px 14px; font-weight: 700; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-family: monospace; font-weight: 700;">EXP-2026-081</td>
              <td style="padding: 12px 14px;">
                <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Dangote Refinery Crawler</div>
                <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">Dangote Group &bull; COMM-DAG-8842</div>
              </td>
              <td style="padding: 12px 14px;">
                <div>Plan: 30s &bull; Run: 22s</div>
                <div style="font-size: 0.75rem; color: #DC2626; font-weight: 700;">-8s Clipped (News Alert Cut)</div>
              </td>
              <td style="padding: 12px 14px;">
                <span class="vmn-badge badge-warning">UNDER_DELIVERY_TIME</span>
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">
                Grant 1x Prime 30s Spot in Tomorrow 20:00 News
              </td>
              <td style="padding: 12px 14px; text-align: right;">
                <form method="POST" action="/api/v1/broadcast/asrun/exceptions/EXP-2026-081/resolve" style="display: inline;">
                  <input type="hidden" name="resolutionType" value="APPROVE_MAKE_GOOD" />
                  <button type="submit" class="btn btn-primary" style="min-height: 34px; padding: 0 12px; font-size: 0.8rem; cursor: pointer;">
                    Authorize Make-Good
                  </button>
                </form>
              </td>
            </tr>

            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-family: monospace; font-weight: 700;">EXP-2026-084</td>
              <td style="padding: 12px 14px;">
                <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Airtel 5G Ultra Fast Promo</div>
                <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">Airtel Nigeria &bull; COMM-AIR-1049</div>
              </td>
              <td style="padding: 12px 14px;">
                <div>Plan: 21:15 &bull; Run: 22:45</div>
                <div style="font-size: 0.75rem; color: #D97706; font-weight: 700;">+90m Daypart Shift</div>
              </td>
              <td style="padding: 12px 14px;">
                <span class="vmn-badge badge-warning">DISPLACED_DAYPART</span>
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">
                Issue 15% Rate Card Credit Note
              </td>
              <td style="padding: 12px 14px; text-align: right;">
                <form method="POST" action="/api/v1/broadcast/asrun/exceptions/EXP-2026-084/resolve" style="display: inline;">
                  <input type="hidden" name="resolutionType" value="ISSUE_CREDIT_NOTE" />
                  <button type="submit" class="btn btn-outline" style="min-height: 34px; padding: 0 12px; font-size: 0.8rem; cursor: pointer;">
                    Issue Credit Note
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * UX-CMS-001..008: Content Review & Publication Workflow (J-RL1-11)
 */
export function renderContentReviewAndPublicationHtml(options: { publishedId?: string } = {}): string {
  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">EDITORIAL &bull; UX-CMS-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Editorial Review &amp; Syndication Publication
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Review programme synopsis slates, NBC ratings, localized language tracks, and publish to StarTimes EPG &amp; Web.
          </p>
        </div>
      </div>

      ${
        options.publishedId
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Content Item ${escapeHtml(options.publishedId)} Published</div>
            <div style="font-size: 0.85rem; color: #047857;">Syndicated to StarTimes EPG XMLTV feed and public web portal.</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px; font-weight: 700;">Content Title</th>
              <th style="padding: 12px 14px; font-weight: 700;">Target Channels</th>
              <th style="padding: 12px 14px; font-weight: 700;">NBC Rating</th>
              <th style="padding: 12px 14px; font-weight: 700;">Languages</th>
              <th style="padding: 12px 14px; font-weight: 700;">Editorial State</th>
              <th style="padding: 12px 14px; font-weight: 700; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-weight: 700; color: var(--vmn-color-primary-text);">
                Lagos Noir (Season 2, Episode 1: 'The Causeway')
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">NXTR &bull; Azeebo+ OTT</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-neutral">18+ (Violence)</span></td>
              <td style="padding: 12px 14px;">EN, YO, IG</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-success">READY FOR AIR</span></td>
              <td style="padding: 12px 14px; text-align: right;">
                <form method="POST" action="/api/v1/workspace/content/CNT-LAGOS-201/publish" style="display: inline;">
                  <button type="submit" class="btn btn-primary" style="min-height: 34px; padding: 0 12px; font-size: 0.8rem; cursor: pointer;">
                    Publish to EPG &amp; Web
                  </button>
                </form>
              </td>
            </tr>

            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-weight: 700; color: var(--vmn-color-primary-text);">
                The Afro-Fusion Sound: Highlife to Amapiano Doc
              </td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">NXTR &bull; Orisun</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-neutral">PG (General)</span></td>
              <td style="padding: 12px 14px;">EN, YO</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge badge-info">PENDING EDITORIAL SIGNOFF</span></td>
              <td style="padding: 12px 14px; text-align: right;">
                <form method="POST" action="/api/v1/workspace/content/CNT-DOC-102/publish" style="display: inline;">
                  <button type="submit" class="btn btn-outline" style="min-height: 34px; padding: 0 12px; font-size: 0.8rem; cursor: pointer;">
                    Approve &amp; Publish
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * UX-GOV-001/002: Approval Review (J-RL1-14) — TODO-SCR-06
 * Renders the REAL four-eyes approval queue from the approvals domain. Demo
 * seed rows are created only when the queue is empty and are explicitly
 * labelled; every row carries its live status and revision.
 */
const APPROVAL_SEEDED_IDS = new Set<string>(["APV-2026-004", "APV-2026-009"]);

function ensureApprovalDemoSeed(): void {
  if (listAllApprovals().length > 0) return;
  createApproval({
    id: "APV-2026-004",
    category: "RATE_CARD_OVERRIDE",
    subject: "Prime Time 15% Volume Discount",
    justification: "Dangote Q3 2026 Industrial Campaign",
    financialScopeNgn: 45_000_000,
    initiatorId: "usr-chidinma-nwosu",
    initiatorName: "Chidinma Nwosu (Commercial)",
    objectRevision: 3,
  });
  createApproval({
    id: "APV-2026-009",
    category: "AFCA_MILESTONE",
    subject: "Milestone 2 Studio Build Disbursement",
    justification: "Creative Economy Media Hub Yaba",
    financialScopeNgn: 18_500_000,
    initiatorId: "usr-adebayo-adeleke",
    initiatorName: "Adebayo Adeleke (AFCA Dean)",
    objectRevision: 1,
  });
}

export function renderApprovalReviewHtml(user?: SessionUser, options: { decidedId?: string; error?: string; errorId?: string } = {}): string {
  ensureApprovalDemoSeed();
  const approvals = listAllApprovals();
  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">FOUR-EYES GOVERNANCE &bull; UX-GOV-001/002</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Pending Approvals &amp; Executive Authorization
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Authorized reviewer: <strong>${escapeHtml(user?.email || "Executive Signoff Officer")}</strong> &bull; Four-Eyes Principle Enforced
          </p>
        </div>
      </div>

      ${
        options.decidedId
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Decision recorded for ${escapeHtml(options.decidedId)}</div>
            <div style="font-size: 0.85rem; color: #047857;">Recorded with actor identity, reason and object revision (UX-GOV-002).</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        options.error
          ? `
        <div class="vmn-alert" style="background: #FEF2F2; border: 1px solid #EF4444; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px;" role="alert">
          <div style="font-weight: 700; color: #991B1B;">Decision not recorded${options.errorId ? ` — ${escapeHtml(options.errorId)}` : ""}</div>
          <div style="font-size: 0.85rem; color: #7F1D1D;">${escapeHtml(APPROVAL_ERROR_COPY[options.error] || "The decision could not be recorded. Review the item and retry.")}</div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px; font-weight: 700;">Approval ID</th>
              <th style="padding: 12px 14px; font-weight: 700;">Category</th>
              <th style="padding: 12px 14px; font-weight: 700;">Subject &amp; Justification</th>
              <th style="padding: 12px 14px; font-weight: 700;">Financial Scope</th>
              <th style="padding: 12px 14px; font-weight: 700;">Initiator</th>
              <th style="padding: 12px 14px; font-weight: 700; text-align: right;">Decision Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              approvals.length === 0
                ? `
            <tr><td colspan="6" style="padding: 24px 14px; text-align: center; color: var(--vmn-color-secondary-text);">
              No pending approvals awaiting decision.
            </td></tr>`
                : approvals
                    .map((approval) => {
                      const badgeClass =
                        approval.status === "PENDING" ? "badge-warning" : approval.status === "APPROVED" ? "badge-ready" : "badge-neutral";
                      const fourEyesTag = approval.requiresFourEyes
                        ? `<span class="vmn-badge badge-info" title="₦10M+ or contract signature: second distinct approver required" style="margin-left: 6px;">FOUR-EYES</span>`
                        : "";
                      const decisionActions =
                        approval.status === "PENDING"
                          ? `
                <div style="display: flex; gap: 6px; justify-content: flex-end;">
                  <form method="POST" action="/api/v1/workspace/approvals/${escapeHtml(approval.id)}/decide" style="display: inline;">
                    <input type="hidden" name="decision" value="APPROVED" />
                    <input type="hidden" name="reason" value="Reviewed against current revision ${approval.objectRevision}." />
                    <button type="submit" class="btn btn-primary" style="min-height: 32px; padding: 0 10px; font-size: 0.8rem; cursor: pointer;">
                      Approve
                    </button>
                  </form>
                  <form method="POST" action="/api/v1/workspace/approvals/${escapeHtml(approval.id)}/decide" style="display: inline;">
                    <input type="hidden" name="decision" value="REJECTED" />
                    <input type="hidden" name="reason" value="Rejected after review of revision ${approval.objectRevision}." />
                    <button type="submit" class="btn btn-outline" style="min-height: 32px; padding: 0 10px; font-size: 0.8rem; color: #DC2626; border-color: #DC2626; cursor: pointer;">
                      Reject
                    </button>
                  </form>
                </div>`
                          : `<div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text); text-align: right;">
                ${escapeHtml(approval.decidedByName || "")} &bull; ${escapeHtml(approval.decisionReason || "")}
              </div>`;
                      return `
            <tr style="border-bottom: 1px solid var(--vmn-color-border);">
              <td style="padding: 12px 14px; font-family: monospace; font-weight: 700;">${escapeHtml(approval.id)}</td>
              <td style="padding: 12px 14px;"><span class="vmn-badge ${badgeClass}">${escapeHtml(approval.category)}</span>${fourEyesTag}</td>
              <td style="padding: 12px 14px;">
                <div style="font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(approval.subject)}</div>
                <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${escapeHtml(approval.justification)} &bull; Revision ${approval.objectRevision}${APPROVAL_SEEDED_IDS.has(approval.id) ? " &bull; DEMO SEED" : ""}</div>
              </td>
              <td style="padding: 12px 14px; font-weight: 700;">&#8358;${approval.financialScopeNgn.toLocaleString("en-NG")}</td>
              <td style="padding: 12px 14px; color: var(--vmn-color-secondary-text);">${escapeHtml(approval.initiatorName)}</td>
              <td style="padding: 12px 14px; text-align: right;">${decisionActions}</td>
            </tr>`;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}
