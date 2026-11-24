/**
 * Episode Master Linkage renderers — shared read-only UI for broadcast views
 * that must surface registered DAM masters (SCR-03 follow-on):
 * - channel detail pages (/channels/*): full reference table
 * - public schedule (/schedule): compact per-channel summary
 * - EPG Inspector (SCR-BCST-14): full reference table
 *
 * Read-only by construction: these functions only format rows produced by
 * `modules/broadcast/episode-masters`; they offer no mutation path.
 */

import { escapeHtml } from "./escape.js";
import type { EpisodeMasterRow, EpisodeMasterState } from "../../modules/broadcast/episode-masters.js";

const STATE_COLORS: Record<EpisodeMasterState, string> = {
  AVAILABLE: "var(--vmn-color-success-600, #15803d)",
  QUARANTINED: "var(--vmn-color-danger-600, #b91c1c)",
  FAILED: "var(--vmn-color-danger-600, #b91c1c)",
  UNREGISTERED: "var(--vmn-color-warning-600, #b45309)",
  NO_REFERENCE: "var(--vmn-color-text-muted, #64748b)",
};

function renderStateCell(row: EpisodeMasterRow): string {
  const color = STATE_COLORS[row.state];
  if (row.state === "NO_REFERENCE") {
 return `<span style="color:${escapeHtml(color)}; font-size:0.8rem; font-weight:700;">No master reference</span>`;
  }
  if (row.state === "UNREGISTERED") {
 return `<span style="color:${escapeHtml(color)}; font-size:0.8rem; font-weight:700;">UNREGISTERED</span> <span class="s-Wb159Mw4sr">${escapeHtml(row.mediaAssetId)}</span>`;
  }
 return `<span style="color:${escapeHtml(color)}; font-size:0.8rem; font-weight:700;">${escapeHtml(row.state)}</span> <span class="s-Wb159Mw4sr">${escapeHtml(row.mediaAssetId)}</span>${row.assetTitle ? ` · ${escapeHtml(row.assetTitle)}` : ""}`;
}

const EMPTY_STATE_TEXT =
  "No episode master linkage is loaded in this environment. The index populates at server boot from the canonical BroadcastEpisode → DAM chain once the database seed has run.";

/**
 * Full reference table: one row per episode with its registered master id and
 * live registry state. Renders an honest empty state when the index has no
 * rows (e.g. database not connected, seed not run).
 */
export function renderEpisodeMastersTableHtml(
  rows: EpisodeMasterRow[],
  options: { heading?: string; note?: string } = {}
): string {
  const heading = options.heading ?? "Registered Episode Masters (DAM)";
  if (rows.length === 0) {
    return `
    <div class="card" role="region" aria-label="${escapeHtml(heading)}">
 <h2 class="s-0AseXnZokY">${escapeHtml(heading)}</h2>
 <p class="s-BnV4bAX0S5">${EMPTY_STATE_TEXT}</p>
    </div>`;
  }

  const rowsHtml = rows
    .map(
      (row) => `
 <tr class="s-luRfE-TINB">
 <td class="s-fcnnoYGhc3">${escapeHtml(row.programmeTitle)}</td>
 <td class="s-EbkeYA0uDR">${escapeHtml(row.episodeCode)}</td>
 <td class="s-XJMZ8Jmu4T">${escapeHtml(row.episodeTitle)}</td>
 <td class="s-drsUO0gkUT">${renderStateCell(row)}</td>
          </tr>`
    )
    .join("");

  return `
    <div class="card" role="region" aria-label="${escapeHtml(heading)}">
 <div class="s-RbdLgOeBnZ">
 <h2 class="s-5yiBMOtiRi">${escapeHtml(heading)}</h2>
 <span class="s-37h9gF_4Xa">${escapeHtml(rows.length)} episode${rows.length === 1 ? "" : "s"} · verified episode to media asset linkage</span>
      </div>
 ${options.note ? `<p class="s-Bn4hJjdmcO">${escapeHtml(options.note)}</p>` : ""}
 <div class="s-0GmMSMP86s">
 <table class="s-b-Ai5vuAKC">
          <thead>
 <tr class="s-y6vAX1Tc3O">
 <th scope="col" class="s-drsUO0gkUT">Programme</th>
 <th scope="col" class="s-drsUO0gkUT">Episode</th>
 <th scope="col" class="s-drsUO0gkUT">Title</th>
 <th scope="col" class="s-drsUO0gkUT">Master asset &amp; access state</th>
            </tr>
          </thead>
          <tbody>${escapeHtml(rowsHtml)}
          </tbody>
        </table>
      </div>
    </div>`;
}

/**
 * Compact per-channel summary for the public schedule page. States are
 * counted honestly; any non-AVAILABLE state is called out so a member of the
 * public never sees a quarantined master presented as fine.
 */
export function renderEpisodeMasterSummaryHtml(rows: EpisodeMasterRow[]): string {
  if (rows.length === 0) {
 return `<p class="s-lLqQ4wPot4">Episode masters: not loaded in this environment (no BroadcastEpisode → DAM linkage available).</p>`;
  }

  const programmes = new Set(rows.map((r) => r.programmeCode)).size;
  const counts = rows.reduce<Record<EpisodeMasterState, number>>(
    (acc, row) => {
      acc[row.state] += 1;
      return acc;
    },
    { AVAILABLE: 0, QUARANTINED: 0, FAILED: 0, UNREGISTERED: 0, NO_REFERENCE: 0 }
  );

  const problems = counts.QUARANTINED + counts.FAILED + counts.UNREGISTERED + counts.NO_REFERENCE;
  const parts = [`${rows.length} episode masters across ${programmes} programme${programmes === 1 ? "" : "s"}`, `AVAILABLE ${counts.AVAILABLE}`];
  if (counts.QUARANTINED) parts.push(`QUARANTINED ${counts.QUARANTINED}`);
  if (counts.FAILED) parts.push(`FAILED ${counts.FAILED}`);
  if (counts.UNREGISTERED) parts.push(`UNREGISTERED ${counts.UNREGISTERED}`);
  if (counts.NO_REFERENCE) parts.push(`no reference ${counts.NO_REFERENCE}`);
  const color = problems > 0 ? "var(--vmn-color-warning-600, #b45309)" : "var(--vmn-color-success-600, #15803d)";

 return `<p style="font-size:0.82rem; color:${escapeHtml(color)}; margin:8px 0 0;"><strong>DAM masters:</strong> ${escapeHtml(parts.join(" · "))}</p>`;
}
