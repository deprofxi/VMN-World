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
  <section class="card" aria-labelledby="media-picker-heading" style="padding: var(--vmn-space-8);">
    <h2 id="media-picker-heading">Approved Media Picker</h2>
    <p data-testid="media-picker-empty">No approved media assets are registered yet. Upload a master through the DAM endpoints
    (<code>POST /api/v1/storage/upload-url</code>, then <code>POST /api/v1/cms/media-assets</code>) — assets appear here
    once the virus-scan and MIME gates have evidence to show.</p>
  </section>`;
  }

  const rows = assets
    .map((a) => {
      const stateBadge =
        a.accessState === "AVAILABLE"
          ? `<span style="color: var(--vmn-color-success-600, #15803d); font-weight: 600;">AVAILABLE</span>`
          : `<span style="color: var(--vmn-color-danger-600, #b91c1c); font-weight: 600;">${escapeHtml(a.accessState)}</span>`;
      const notes = a.accessNotes ? `<div style="font-size: 0.8rem; color: var(--vmn-color-text-muted, #64748b);">${escapeHtml(a.accessNotes)}</div>` : "";
      const selector = a.selectable
        ? `<input type="radio" name="mediaAssetId" value="${escapeHtml(a.assetId)}" aria-label="Select ${escapeHtml(a.title)}">`
        : `<span aria-hidden="true">—</span>`;
      return `      <tr>
        <td>${selector}</td>
        <td><strong>${escapeHtml(a.title)}</strong><div style="font-size: 0.78rem; color: var(--vmn-color-text-muted, #64748b); font-family: monospace;">${escapeHtml(a.assetId)}</div></td>
        <td>${escapeHtml(a.mimeType)}<div style="font-size: 0.78rem;">${formatBytes(a.sizeBytes)}</div></td>
        <td>${escapeHtml(a.provenance)}<div style="font-size: 0.78rem; color: var(--vmn-color-text-muted, #64748b);">by ${escapeHtml(a.registeredBy)} · ${escapeHtml(a.registeredAt.slice(0, 10))}</div></td>
        <td>${stateBadge}${notes}</td>
      </tr>`;
    })
    .join("\n");

  return `
  <section class="card" aria-labelledby="media-picker-heading" style="padding: var(--vmn-space-8);">
    <h2 id="media-picker-heading">Approved Media Picker</h2>
    <p style="margin-bottom: var(--vmn-space-4);">
      ${summary.total} asset${summary.total === 1 ? "" : "s"} in the registry — ${summary.available} available,
      ${summary.quarantined} quarantined, ${summary.failed} failed. Only AVAILABLE assets satisfy the
      UIUX-001 §7.3 evidence-attachment contract; quarantined/failed rows are shown with their reason for review.
    </p>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;" data-testid="media-picker-table">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid var(--vmn-color-border, #e2e8f0);">
            <th scope="col">Select</th>
            <th scope="col">Asset</th>
            <th scope="col">Type / Size</th>
            <th scope="col">Provenance</th>
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
