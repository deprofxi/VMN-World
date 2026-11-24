/**
 * Approved Media Picker — TODO-SCR-03 (UX-CMS-006)
 * Authority: UIUX-001 §7.3 evidence-attachment contract.
 *
 * Renders the DAM asset registry (src/core/storage/index.ts
 * registerMediaAsset/listApprovedMediaAssets) as the approved media picker:
 * every row carries provenance (source + registrant) and access state, and
 * only AVAILABLE assets are selectable. The picker itself is a read-only
 * selection component — it never mutates media state; the upload → validate →
 * register pipeline lives in the storage endpoints (`POST /api/v1/storage/*`,
 * `POST /api/v1/cms/media-assets`) and remains audited there.
 */

import { escapeHtml } from "../components/escape.js";
import { publicEdgeContract } from "../ia/operating-states.js";
import { getMediaAsset } from "../../core/storage/index.js";
import type { MediaAssetRecord } from "../../core/storage/index.js";

export interface MediaPickerProjection {
  assets: Array<{
    assetId: string;
    title: string;
    mimeType: string;
    sizeBytes: number;
    provenance: string;
    accessState: string;
    accessNotes?: string;
    registeredBy: string;
    registeredAt: string;
    checksumSha256: string;
    selectable: boolean;
  }>;
  summary: { total: number; available: number; quarantined: number; failed: number };
}

/**
 * Projects the registry into picker rows. Only AVAILABLE assets are
 * selectable (evidence-attachment contract); QUARANTINED/FAILED rows are
 * rendered with their rejection reason so review is possible without giving
 * them as usable references.
 */
export function projectMediaPicker(assets: MediaAssetRecord[]): MediaPickerProjection {
  const rows = assets.map((a) => ({
    assetId: a.assetId,
    title: a.title,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    provenance: a.provenance,
    accessState: a.accessState,
    accessNotes: a.accessNotes,
    registeredBy: a.registeredBy,
    registeredAt: a.registeredAt.toISOString(),
    checksumSha256: a.checksumSha256,
    selectable: a.accessState === "AVAILABLE",
  }));
  return {
    assets: rows,
    summary: {
      total: rows.length,
      available: rows.filter((r) => r.accessState === "AVAILABLE").length,
      quarantined: rows.filter((r) => r.accessState === "QUARANTINED").length,
      failed: rows.filter((r) => r.accessState === "FAILED").length,
    },
  };
}

// ---------------------------------------------------------------------------
// Review-queue media reference badges (SCR-03 follow-on): show editors WHICH
// registered DAM assets a content revision references BEFORE they approve.
// ---------------------------------------------------------------------------

export interface ContentMediaRefBadge {
  assetId: string;
  label: string;
  state: "AVAILABLE" | "QUARANTINED" | "FAILED" | "UNREGISTERED";
  detail?: string;
}

/**
 * Projects a revision's mediaAssetIds into review badges. Ids that do not
 * resolve in the DAM registry (legacy free-text references) are surfaced as
 * UNREGISTERED rather than silently shown as if they were real assets.
 */
export function projectMediaRefBadges(assetIds: string[]): ContentMediaRefBadge[] {
  return assetIds.map((id) => {
    const asset = getMediaAsset(id);
    if (!asset) {
      return { assetId: id, label: id, state: "UNREGISTERED" as const, detail: "not registered in the DAM — legacy free-text reference" };
    }
    return { assetId: id, label: asset.title, state: asset.accessState, detail: asset.provenance };
  });
}

const MEDIA_REF_STATE_COLOR: Record<ContentMediaRefBadge["state"], string> = {
  AVAILABLE: "var(--vmn-color-success-600, #15803d)",
  QUARANTINED: "var(--vmn-color-danger-600, #b91c1c)",
  FAILED: "var(--vmn-color-danger-600, #b91c1c)",
  UNREGISTERED: "var(--vmn-color-warning-600, #b45309)",
};

/**
 * Renders read-only reference badges for a review-queue row. Quarantined /
 * failed / unregistered references are visually flagged so a reviewer sees
 * them before approving; the badges never offer a mutation path.
 */
export function renderMediaRefBadgesHtml(badges: ContentMediaRefBadge[], emptyText = "No media references"): string {
  if (badges.length === 0) {
 return `<span class="s-GcwZlN-zUp">${escapeHtml(emptyText)}</span>`;
  }
  return badges
    .map((b) => {
      const color = MEDIA_REF_STATE_COLOR[b.state];
      const detail = b.detail ? ` title="${escapeHtml(b.detail)}"` : "";
 return `<span${escapeHtml(detail)} class="s-P3mdFH2Rdl"><strong style="color: ${escapeHtml(color)};">${escapeHtml(b.state)}</strong> ${escapeHtml(b.label)}<span class="s-wazT-oUSIh"> · ${escapeHtml(b.assetId)}</span></span>`;
    })
    .join("");
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function renderMediaPickerHtml(projection: MediaPickerProjection): string {
  const { assets, summary } = projection;

  if (assets.length === 0) {
    return `
 <section class="card s-kqRH8I4df0" aria-labelledby="media-picker-heading" >
    <h2 id="media-picker-heading">Approved Media Picker</h2>
    <p data-testid="media-picker-empty">No approved media assets are registered yet. Upload media assets through the media ingestion workstation to make them available here once security and file-format validation checks are verified.</p>
  </section>`;
  }

  // EDGE-023: rows that are not selectable are the inventory's upload state,
  // not a rendering accident — the picker quotes the contract so an editor can
  // tell "quarantined by the scan" from "refused by validation".
  const uploadState = summary.quarantined + summary.failed > 0 ? publicEdgeContract("EDGE-023") : undefined;
  const uploadStateNote = uploadState
    ? `<p class="s-Y2zrxdGou0" data-testid="media-picker-edge-023">${escapeHtml(uploadState.id)} · ${escapeHtml(uploadState.acceptanceId)} — ${escapeHtml(uploadState.title)}. A row in this state keeps its evidence and rejection reason and is never selectable media.</p>`
    : "";

  const rows = assets
    .map((a) => {
      const stateBadge =
        a.accessState === "AVAILABLE"
 ? `<span class="s-ikxPfbl-nL">AVAILABLE</span>`
 : `<span class="s-B0d0sZ8CYA">${escapeHtml(a.accessState)}</span>`;
 const notes = a.accessNotes ? `<div class="s-ylo9D2ENqA">${escapeHtml(a.accessNotes)}</div>` : "";
      const selector = a.selectable
        ? `<input type="radio" name="mediaAssetId" value="${escapeHtml(a.assetId)}" aria-label="Select ${escapeHtml(a.title)}">`
        : `<span aria-hidden="true">—</span>`;
      return `      <tr>
        <td>${selector}</td>
 <td><strong>${escapeHtml(a.title)}</strong><div class="s-sGwxze6eZT">${escapeHtml(a.assetId)}</div></td>
 <td>${escapeHtml(a.mimeType)}<div class="s-p2jBWkaaxX">${formatBytes(a.sizeBytes)}</div></td>
 <td>${escapeHtml(a.provenance)}<div class="s-9DUd7eES3z">by ${escapeHtml(a.registeredBy)} · ${escapeHtml(a.registeredAt.slice(0, 10))}</div></td>
        <td>${stateBadge}${notes}</td>
      </tr>`;
    })
    .join("\n");

  return `
 <section class="card s-kqRH8I4df0" aria-labelledby="media-picker-heading" >
    <h2 id="media-picker-heading">Approved Media Picker</h2>
 <p class="s-Y2zrxdGou0">
      ${escapeHtml(summary.total)} asset${summary.total === 1 ? "" : "s"} in the registry — ${escapeHtml(summary.available)} available,
      ${escapeHtml(summary.quarantined)} quarantined, ${escapeHtml(summary.failed)} failed. Only AVAILABLE assets satisfy the
      UIUX-001 §7.3 evidence-attachment contract; quarantined/failed rows are shown with their reason for review.
    </p>
    ${uploadStateNote}
 <div class="s-QtRFDAL0Yl">
 <table class="s-C8adFL88uc" data-testid="media-picker-table">
        <thead>
 <tr class="s-PA70Feg2tu">
            <th scope="col">Select</th>
            <th scope="col">Asset</th>
            <th scope="col">Type / Size</th>
            <th scope="col">Data Source</th>
            <th scope="col">Access state</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
  </section>`;
}
