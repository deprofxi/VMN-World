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
import { getContent } from "../../core/content/index.js";
import { projectMediaRefBadges, renderMediaRefBadgesHtml } from "./media-picker.js";
import { renderEpisodeMastersTableHtml } from "../components/episode-masters.js";
import { listEpisodeMasters } from "../../modules/broadcast/episode-masters.js";
import { listPoaExceptions, PoaDeliveryException } from "../../modules/broadcast/asrun/exceptions.js";
import { getChannelByCode, resolveChannelCode } from "../../modules/broadcast/channels/index.js";

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
  // Key the episode-master linkage by this desk's channel parameter — a
  // reference that does not resolve to a canonical active channel renders an
  // honest unknown state instead of silently defaulting to some channel's rows.
  const resolvedChannelCode = resolveChannelCode(channel);
  const resolvedChannel = resolvedChannelCode ? getChannelByCode(resolvedChannelCode) : undefined;

  return `
 <div class="s-dJGia7etx6">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-live s-Dnmmv3HPR8" >Playout Operations Desk <span class="sr-only">&bull; UX-BR-012</span></span>
 <h1 class="s-n_bp1PhViu">
            Broadcast Master Schedule Review
          </h1>
 <p class="s-zrikAgYqXF">
            Transmission Agenda for <strong>${escapeHtml(channel)}</strong> &bull; Date: <strong>${escapeHtml(date)}</strong> (WAT / UTC+1)
          </p>
        </div>
 <div class="s-URRPIWgn0i">
 <a href="/broadcast/schedule/grid" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("calendar", { size: 16 })} Visual Grid
          </a>
 <a href="/broadcast/rights/review-request" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("shield", { size: 16 })} Open Rights Review Request
          </a>
        </div>
      </div>

      ${
        hasBlocker
          ? `
 <div class="s-KsFxMktCcs">
 <div class="s-rrjmw70sEP">
 <div class="s-1ACL48qPRA">
              ${renderIcon("warning", { size: 24 })}
            </div>
 <div class="s-7j1Vv5m580">
 <div class="s-fNfgHipnYh">
 <span class="s-aPB9P_-rWl">
                  CRITICAL RIGHTS BLOCKER &bull; Playout Automated Ingest Lock
                </span>
                <span class="vmn-badge badge-warning">AIR TIME -02:14:00</span>
              </div>
 <p class="s-xXQ3WJrb2g">
                Slot <strong>20:30 - 21:45 WAT</strong> (<em>Urban Sound Showcase #4102</em>) has failed StarTimes Carriage Clearance.
                Distributor contract has a regional holdback on StarTimes DTT Multiplex 4 expiring 2026-10-01.
              </p>
 <div class="s-8-Jvrb7p7B">
 <a href="/broadcast/rights/review-request?slotId=SLOT-4102" class="btn btn-primary s-fOYgT95efs" >
                  Review Blocker / Open Rights Review Request &rarr;
                </a>
 <a href="/broadcast/playout/live" class="btn btn-outline s--xvVnLZNe-" >
                  Prime Emergency Cultural Filler
                </a>
              </div>
            </div>
          </div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-6KYnYzlM1L" >
 <p role="note" class="s-O6cnlXePf8">Illustrative schedule data only — no verified playout, rights, or carriage source is connected.</p>
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-gSzyZDrSbr">Slot (WAT)</th>
 <th class="s-gSzyZDrSbr">Programme Title</th>
 <th class="s-gSzyZDrSbr">Technical Specs</th>
 <th class="s-gSzyZDrSbr">Audio Loudness</th>
 <th class="s-gSzyZDrSbr">Rights Status</th>
 <th class="s-i6k8o9YRzt">Transmission State</th>
            </tr>
          </thead>
          <tbody>
 <tr class="s-EK6K8Vq5tY">
 <td class="s-9qwVZmzajs">18:00 - 19:00</td>
 <td class="s-PrQ5zOE0i2">
                Xtreme Street Hop Hits (Ep. 44)
              </td>
 <td class="s-o1-djKZYTY">1080i50 H.264</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-success">-23.1 LUFS OK</span></td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-info">Sample — not verified</span></td>
 <td class="s-hg1JOdptQg">Illustrative only</td>
            </tr>
 <tr class="s-gI8pRmYLQR">
 <td class="s-NrOVPHG2_K">19:00 - 20:30</td>
 <td class="s-ralpq_HcXn">
                Afrobeat Titans Live Concert
              </td>
 <td class="s-o1-djKZYTY">1080i50 H.264</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-success">-23.0 LUFS OK</span></td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-info">Sample — not verified</span></td>
 <td class="s-RhdStrjBOr"><span class="vmn-badge badge-info">Illustrative only</span></td>
            </tr>
 <tr class="s-sbCQbjgJlZ">
 <td class="s-eFhjxIHQbl">20:30 - 21:45</td>
 <td class="s-zsxWcAwKr-">
                Urban Sound Showcase #4102
              </td>
 <td class="s-bdCyXx6-gf">1080i50 H.264</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-success">-23.2 LUFS OK</span></td>
 <td class="s-O6cnlXePf8">
 <span class="vmn-badge badge-warning s-LA29WsymOD" >
                  RIGHTS HOLD (StarTimes DTT)
                </span>
              </td>
 <td class="s-RhdStrjBOr">
 <a href="/broadcast/rights/review-request?slotId=SLOT-4102" class="btn btn-outline s-Tdn42tLWkW" >
                  Review Blocker
                </a>
              </td>
            </tr>
 <tr class="s-EK6K8Vq5tY">
 <td class="s-9qwVZmzajs">21:45 - 23:00</td>
 <td class="s-PrQ5zOE0i2">
                Lagos Underground Beats (Vol. 3)
              </td>
 <td class="s-o1-djKZYTY">1080i50 H.264</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-success">-22.9 LUFS OK</span></td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-info">Sample — not verified</span></td>
 <td class="s-RhdStrjBOr"><span class="vmn-badge badge-neutral">Queued Playout</span></td>
            </tr>
          </tbody>
        </table>
      </div>

 <div class="s-73qd-9lEfm">
        ${
          resolvedChannel
            ? renderEpisodeMastersTableHtml(listEpisodeMasters(resolvedChannel.code), {
                heading: `Registered Episode Masters (DAM) — ${resolvedChannel.name} (${resolvedChannel.code})`,
                note: "Keyed from this desk's channel parameter; access states are read live from the media asset registry against verified episode records.",
              })
 : `<div class="vmn-card s-71k7hHtBhr" role="status" >
 <strong class="s-CUrYObcc9O">Episode master linkage unavailable:</strong> channel reference <code>${escapeHtml(channel)}</code> does not resolve to an active VMNL channel (NXTR / ORIS / IMBD or an official channel name) — linkage is never keyed to a guessed channel.
            </div>`
        }
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
 <div class="s-jNPXlgaoWl">
 <div class="vmn-card s-sQ4H2l8IG7" >
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >Broadcast Standards &amp; Compliance <span class="sr-only">&bull; UX-GOV-004</span></span>
 <h1 class="s-n_bp1PhViu">
            Expedited Rights Review Request
          </h1>
 <p class="s-YBXqvnNn8u">
            Raise a review request against a blocked RightsRecord with the Broadcast Rights Coordinator and Legal Counsel.
            Opening a request does not clear rights: the block stays in force until the request is resolved against
            authoritative evidence.
          </p>
        </div>

        ${
          options.submitted
            ? `
 <div class="s-VwN0c3dBdH">
 <div class="s-V5WZeJxJU3">${renderIcon("check", { size: 32 })}</div>
 <div class="s-Mgrk6Hw1ft">Review Request Opened</div>
 <p class="s-lTOnwGvAah">
              The request is with the receiving owner. The rights block stays in force until the review is resolved
              against authoritative evidence, which writes the cleared window onto the registered RightsRecord.
            </p>
 <a href="/broadcast/schedule/review" class="btn btn-primary s-tWuvNzaotY" >
              Return to Schedule Review
            </a>
          </div>
        `
            : `
 <form method="POST" action="/api/v1/broadcast/rights/review-requests" class="s-agFP9ZFhL6">
            <input type="hidden" name="slotId" value="${escapeHtml(slotId)}" />

            <div class="vmn-form-field">
 <label class="vmn-label s-d6tlFZezBi" >Target Programme Slot</label>
              <input
                type="text"
                disabled
                value="${escapeHtml(slotId)}: Urban Sound Showcase #4102 (20:30 - 21:45 WAT)"
                class="vmn-input"
 class="s-xcXw2RfUn4"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-carrier" class="vmn-label s-d6tlFZezBi" >
 Carriage Platform Exemption <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <select
                id="rw-carrier"
                name="carrier"
                required
                class="vmn-input"
 class="s-npZXKSAIoi"
              >
                <option value="STARTIMES_DTT">StarTimes DTT Carriage (Multiplex 4)</option>
                <option value="STARTIMES_DTH">StarTimes DTH Satellite Feed</option>
                <option value="TERRESTRIAL_LAGOS">Lagos Terrestrial Carriage</option>
                <option value="AZEEBO_SIMULCAST">Azeebo+ Mobile Simulcast</option>
              </select>
            </div>

            <div class="vmn-form-field">
 <label for="rw-distributor" class="vmn-label s-d6tlFZezBi" >
 Licensor / Content Distributor <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-distributor"
                name="distributor"
                type="text"
                required
                value="Afro-Beat Media Global Ltd"
                class="vmn-input"
 class="s-npZXKSAIoi"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-rights-record" class="vmn-label s-d6tlFZezBi" >
 Rights Record Under Review <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-rights-record"
                name="rightsRecordId"
                type="text"
                required
                placeholder="e.g. RGT-URBAN-4102 — the rights clearance blocking this slot"
                class="vmn-input"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-intended-use" class="vmn-label s-d6tlFZezBi" >
 Intended Use <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-intended-use"
                name="intendedUse"
                type="text"
                required
                placeholder="What the record would authorise, e.g. linear transmission on NXTR 20:30-21:45 WAT"
                class="vmn-input"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-observed-blocker" class="vmn-label s-d6tlFZezBi" >
 Observed Blocker <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-observed-blocker"
                name="observedBlocker"
                type="text"
                required
                placeholder="Describe the clearance issue (e.g. Broadcast window expired prior to scheduled airtime)"
                class="vmn-input"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-receiving-owner" class="vmn-label s-d6tlFZezBi" >
 Receiving Owner <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <input
                id="rw-receiving-owner"
                name="receivingOwner"
                type="text"
                required
                placeholder="Named coordinator or counsel who receives the request"
                class="vmn-input"
              />
            </div>

            <div class="vmn-form-field">
 <label for="rw-justification" class="vmn-label s-d6tlFZezBi" >
 Evidence &amp; Authority for Review <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
              </label>
              <textarea
                id="rw-justification"
                name="justification"
                required
                rows="4"
                placeholder="Cite the contractual amendment or distributor consent this review will be resolved against..."
                class="vmn-input"
              ></textarea>
            </div>

 <div class="s-nJrpNO03gx">
 <button type="submit" class="btn btn-primary s-R6xXPxcVik" >
                Open Rights Review Request
              </button>
 <a href="/broadcast/schedule/review" class="btn btn-secondary s-dPmDjbdu34" >
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
 *
 * TSK-16: the rows are the as-run register, not a decoration. Each one carries
 * the measured delivery shortfall and the remedy linkage that actually exists —
 * the traffic make-good obligation (with the break it was rebooked into) and the
 * billing make-good / credit note. TSK-33: a credit row also names the durable
 * journal entry the ledger posting produced. The desk offers the two remedies
 * the engines implement and claims nothing beyond what they returned.
 */
export function renderPoaExceptionsWorkbenchHtml(
  options: { resolvedId?: string; resolutionError?: string; exceptions?: PoaDeliveryException[] } = {}
): string {
  const exceptions = options.exceptions ?? listPoaExceptions();
  const resolved = options.resolvedId ? exceptions.find((e) => e.id === options.resolvedId) : undefined;
  const openShortfallSeconds = exceptions
    .filter((e) => e.status === "OPEN")
    .reduce((sum, e) => sum + e.shortfallSeconds, 0);

  return `
 <div class="s-dJGia7etx6">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >As-Run Reconciliation Desk <span class="sr-only">&bull; UX-BR-030 / UX-GOV-006</span></span>
 <h1 class="s-n_bp1PhViu">
            Proof-of-Air Exceptions Workbench
          </h1>
 <p class="s-zrikAgYqXF">
            Audit as-run playout variances, clipping discrepancies, and commercial make-good resolutions.
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="/broadcast/proof-of-air" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Dispatch Certificates
          </a>
        </div>
      </div>

      ${
        resolved
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Exception ${escapeHtml(resolved.id)} &mdash; ${
            resolved.status === "MAKE_GOOD_REBOOKED" ? "Make-good booked into inventory" : "Credit note issued"
          }</div>
 <div class="s-huAjaSyPZk">${
   resolved.status === "MAKE_GOOD_REBOOKED"
     ? `${escapeHtml(resolved.shortfallSeconds)}s of ${escapeHtml(resolved.campaignId)} inventory was scheduled into break ${escapeHtml(
         resolved.allocatedBreakId || ""
       )} by ${escapeHtml(resolved.resolvedBy || "traffic")}. The make-good obligation is no longer queued.`
     : `Credit note ${escapeHtml(resolved.creditNoteId || "")} (${resolved.makeGoodValueNgn.toLocaleString(
         "en-NG"
       )} NGN, provisional rate card) was issued against make-good ${escapeHtml(resolved.makeGoodId)} by ${escapeHtml(
         resolved.resolvedBy || "finance"
       )}, and the queued inventory obligation was withdrawn. Posted to the seven-way ledger as journal entry ${escapeHtml(
         resolved.journalEntryId || ""
       )} (Dr 4090 Contra-Revenue Allowances / Cr 2400 Client Credit Payable — a contra item, never revenue).`
 }</div>
          </div>
        </div>
      `
          : ""
      }

      ${
        options.resolutionError
          ? `
 <div class="vmn-alert vmn-alert--error s-NKbeyCer0q" role="alert">
          <div>${renderIcon("warning", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Remedy refused &mdash; the obligation is still open</div>
 <div class="s-huAjaSyPZk">${escapeHtml(options.resolutionError)}</div>
          </div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-6KYnYzlM1L" >
        <p class="s-zrikAgYqXF">
          <strong>${escapeHtml(exceptions.length)}</strong> registered delivery exception${
            exceptions.length === 1 ? "" : "s"
          } &bull; <strong>${escapeHtml(openShortfallSeconds)}</strong>s of commercial inventory still owed.
        </p>
 ${
   exceptions.length === 0
     ? `
        <p class="s-OdlmY1tzrc">
          No delivery exception has been raised. Exceptions appear here when an as-run reconciliation
          measures a spot that did not air for its contracted length.
        </p>
      `
     : `
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-gSzyZDrSbr">Exception ID</th>
 <th class="s-gSzyZDrSbr">Campaign / Client</th>
 <th class="s-gSzyZDrSbr">Shortfall (planned vs as-run)</th>
 <th class="s-gSzyZDrSbr">Discrepancy Nature</th>
 <th class="s-gSzyZDrSbr">Make-good / credit linkage</th>
 <th class="s-i6k8o9YRzt">Action</th>
            </tr>
          </thead>
          <tbody>
 ${exceptions
   .map(
     (e) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-NrOVPHG2_K">${escapeHtml(e.id)}</td>
 <td class="s-O6cnlXePf8">
 <div class="s-v9ujfxeGxB">${escapeHtml(e.campaignId)}</div>
 <div class="s-OdlmY1tzrc">${escapeHtml(e.clientName)} &bull; ${escapeHtml(e.channelCode)}</div>
              </td>
 <td class="s-O6cnlXePf8">
                <div>Plan: ${escapeHtml(e.plannedDurationSeconds)}s &bull; Run: ${escapeHtml(e.airedDurationSeconds)}s</div>
 <div class="s-TEJjAykNyT">-${escapeHtml(e.shortfallSeconds)}s owed (spot ${escapeHtml(e.spotId)})</div>
              </td>
 <td class="s-O6cnlXePf8">
                <span class="vmn-badge badge-warning">${escapeHtml(e.nature)}</span>
              </td>
 <td class="s-o1-djKZYTY">
                <div>Make-good ${escapeHtml(e.makeGoodId)}</div>
 <div class="s-OdlmY1tzrc">${escapeHtml(e.makeGoodValueNgn.toLocaleString("en-NG"))} NGN (provisional rate card)</div>
 <div class="s-OdlmY1tzrc">${
   e.status === "OPEN"
     ? "Queued for rebooking &mdash; no inventory allocated yet"
     : e.status === "MAKE_GOOD_REBOOKED"
       ? `Rebooked into break ${escapeHtml(e.allocatedBreakId || "")}`
       : `Credit note ${escapeHtml(e.creditNoteId || "")} issued`
 }</div>
              </td>
 <td class="s-RhdStrjBOr">
 ${
   e.status === "OPEN"
     ? `
 <form method="POST" action="/api/v1/broadcast/asrun/exceptions/${encodeURIComponent(e.id)}/resolve" class="s-Q0_DLsKcmN">
                  <input type="hidden" name="resolutionType" value="APPROVE_MAKE_GOOD" />
                  <label class="s-OdlmY1tzrc" for="targetBreak-${escapeHtml(e.id)}">Target break</label>
                  <input id="targetBreak-${escapeHtml(e.id)}" type="text" name="targetBreakId" placeholder="BRK-PRIME-01" required />
                  <button type="submit" class="btn btn-primary s-_MZYDlP4uN" >
                    Authorize Make-Good
                  </button>
                </form>
 <form method="POST" action="/api/v1/broadcast/asrun/exceptions/${encodeURIComponent(e.id)}/resolve" class="s-Q0_DLsKcmN">
                  <input type="hidden" name="resolutionType" value="ISSUE_CREDIT_NOTE" />
 <button type="submit" class="btn btn-outline s-_MZYDlP4uN" >
                    Issue Credit Note
                  </button>
                </form>
              `
     : `<span class="vmn-badge s-Dnmmv3HPR8">${e.status === "MAKE_GOOD_REBOOKED" ? "Closed by make-good" : "Closed by credit note"}</span>`
 }
              </td>
            </tr>
`
   )
   .join("")}
          </tbody>
        </table>
      `
 }
    </div>
  `;
}

/**
 * UX-CMS-001..008: Content Review & Publication Workflow (J-RL1-11)
 */

/**
 * SCR-03 follow-on: read-only media-reference cell for a review-queue row.
 * The row id is resolved against the canonical CMS store and the revision's
 * mediaAssetIds against the DAM registry, so an editor sees exactly which
 * registered assets (and their access states) a revision references BEFORE
 * approving. Unknown content ids and legacy free-text references are flagged
 * rather than silently rendered as if they were real assets.
 */
function renderQueueMediaCell(contentId: string): string {
  const item = getContent(contentId);
  if (!item) {
 return `<span class="s-dTmeKQvGfP">Content record not found in the CMS registry — demo row; publish will be refused (CMS_NOT_FOUND).</span>`;
  }
  const revision = item.revisions.get(item.currentRevision)!;
  return renderMediaRefBadgesHtml(projectMediaRefBadges(revision.mediaAssetIds));
}

export function renderContentReviewAndPublicationHtml(options: { publishedId?: string } = {}): string {
  return `
 <div class="s-dJGia7etx6">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Media Editorial Library <span class="sr-only">&bull; UX-CMS-001..008</span></span>
 <h1 class="s-n_bp1PhViu">
            Editorial Review &amp; Syndication Publication
          </h1>
 <p class="s-zrikAgYqXF">
            Review programme synopsis slates, NBC ratings, localized language tracks, and publish to StarTimes EPG &amp; Web.
          </p>
        </div>
      </div>

      ${
        options.publishedId
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Content Item ${escapeHtml(options.publishedId)} Published</div>
 <div class="s-huAjaSyPZk">Syndicated to StarTimes EPG XMLTV feed and public web portal.</div>
          </div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-6KYnYzlM1L" >
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-gSzyZDrSbr">Content Title</th>
 <th class="s-gSzyZDrSbr">Target Channels</th>
 <th class="s-gSzyZDrSbr">NBC Rating</th>
 <th class="s-gSzyZDrSbr">Languages</th>
 <th class="s-gSzyZDrSbr">Editorial State</th>
 <th class="s-gSzyZDrSbr">Media Assets <span class="sr-only">Media references (UX-CMS-006)</span></th>
 <th class="s-i6k8o9YRzt">Action</th>
            </tr>
          </thead>
          <tbody>
 <tr class="s-EK6K8Vq5tY">
 <td class="s-PrQ5zOE0i2">
                Lagos Noir (Season 2, Episode 1: 'The Causeway')
              </td>
 <td class="s-o1-djKZYTY">NXTR &bull; Azeebo+ OTT</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-neutral">18+ (Violence)</span></td>
 <td class="s-O6cnlXePf8">EN, YO, IG</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-success">READY FOR AIR</span></td>
 <td class="s-O6cnlXePf8">${renderQueueMediaCell("CNT-LAGOS-201")}</td>
 <td class="s-RhdStrjBOr">
 <form method="POST" action="/api/v1/workspace/content/CNT-LAGOS-201/publish" class="s-Q0_DLsKcmN">
 <button type="submit" class="btn btn-primary s-_MZYDlP4uN" >
                    Publish to EPG &amp; Web
                  </button>
                </form>
              </td>
            </tr>

 <tr class="s-EK6K8Vq5tY">
 <td class="s-PrQ5zOE0i2">
                The Afro-Fusion Sound: Highlife to Amapiano Doc
              </td>
 <td class="s-o1-djKZYTY">NXTR &bull; Orisun</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-neutral">PG (General)</span></td>
 <td class="s-O6cnlXePf8">EN, YO</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge badge-info">PENDING EDITORIAL SIGNOFF</span></td>
 <td class="s-O6cnlXePf8">${renderQueueMediaCell("CNT-DOC-102")}</td>
 <td class="s-RhdStrjBOr">
 <form method="POST" action="/api/v1/workspace/content/CNT-DOC-102/publish" class="s-Q0_DLsKcmN">
 <button type="submit" class="btn btn-outline s-_MZYDlP4uN" >
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
 <div class="s-dJGia7etx6">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >Dual-Authorization Governance <span class="sr-only">&bull; UX-GOV-001/002</span></span>
 <h1 class="s-n_bp1PhViu">
            Pending Approvals &amp; Executive Authorization
          </h1>
 <p class="s-zrikAgYqXF">
            Authorized reviewer: <strong>${escapeHtml(user?.email || "Executive Signoff Officer")}</strong> &bull; Four-Eyes Principle Enforced
          </p>
        </div>
      </div>

      ${
        options.decidedId
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Decision recorded for ${escapeHtml(options.decidedId)}</div>
 <div class="s-huAjaSyPZk">Recorded with reviewer identity, decision rationale, and version history <span class="sr-only">(UX-GOV-002)</span>.</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        options.error
          ? `
 <div class="vmn-alert s-gmP7w-PWvD" role="alert">
 <div class="s-Hr-29x9Riz">Decision not recorded${options.errorId ? ` — ${escapeHtml(options.errorId)}` : ""}</div>
 <div class="s-5gKEXR8JdD">${escapeHtml(APPROVAL_ERROR_COPY[options.error] || "The decision could not be recorded. Review the item and retry.")}</div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-6KYnYzlM1L" >
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-gSzyZDrSbr">Approval ID</th>
 <th class="s-gSzyZDrSbr">Category</th>
 <th class="s-gSzyZDrSbr">Subject &amp; Justification</th>
 <th class="s-gSzyZDrSbr">Financial Scope</th>
 <th class="s-gSzyZDrSbr">Initiator</th>
 <th class="s-i6k8o9YRzt">Decision Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              approvals.length === 0
                ? `
 <tr><td colspan="6" class="s-kvXoJxhgK6">
              No pending approvals awaiting decision.
            </td></tr>`
                : approvals
                    .map((approval) => {
                      const badgeClass =
                        approval.status === "PENDING" ? "badge-warning" : approval.status === "APPROVED" ? "badge-ready" : "badge-neutral";
                      const fourEyesTag = approval.requiresFourEyes
 ? `<span class="vmn-badge badge-info s-CfmzSbVvoC" title="₦10M+ or contract signature: second distinct approver required" >FOUR-EYES</span>`
                        : "";
                      const decisionActions =
                        approval.status === "PENDING"
                          ? `
 <div class="s-EDUTwg_Z-I">
 <form method="POST" action="/api/v1/workspace/approvals/${escapeHtml(approval.id)}/decide" class="s-Q0_DLsKcmN">
                    <input type="hidden" name="decision" value="APPROVED" />
                    <input type="hidden" name="reason" value="Reviewed against current revision ${escapeHtml(approval.objectRevision)}." />
 <button type="submit" class="btn btn-primary s-edUd71cpo5" >
                      Approve
                    </button>
                  </form>
 <form method="POST" action="/api/v1/workspace/approvals/${escapeHtml(approval.id)}/decide" class="s-Q0_DLsKcmN">
                    <input type="hidden" name="decision" value="REJECTED" />
                    <input type="hidden" name="reason" value="Rejected after review of revision ${escapeHtml(approval.objectRevision)}." />
 <button type="submit" class="btn btn-outline s-8BLmUnUUAh" >
                      Reject
                    </button>
                  </form>
                </div>`
 : `<div class="s-AhvNZvDMVC">
                ${escapeHtml(approval.decidedByName || "")} &bull; ${escapeHtml(approval.decisionReason || "")}
              </div>`;
                      return `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-NrOVPHG2_K">${escapeHtml(approval.id)}</td>
 <td class="s-O6cnlXePf8"><span class="vmn-badge ${badgeClass}">${escapeHtml(approval.category)}</span>${fourEyesTag}</td>
 <td class="s-O6cnlXePf8">
 <div class="s-v9ujfxeGxB">${escapeHtml(approval.subject)}</div>
 <div class="s-wUMD0XWoZI">${escapeHtml(approval.justification)} &bull; Revision ${escapeHtml(approval.objectRevision)}${APPROVAL_SEEDED_IDS.has(approval.id) ? " &bull; DEMO SEED" : ""}</div>
              </td>
 <td class="s-gSzyZDrSbr">&#8358;${escapeHtml(approval.financialScopeNgn.toLocaleString("en-NG"))}</td>
 <td class="s-o1-djKZYTY">${escapeHtml(approval.initiatorName)}</td>
 <td class="s-RhdStrjBOr">${escapeHtml(decisionActions)}</td>
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
