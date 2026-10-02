/**
 * Content Editor Form with the Approved Media Picker — TODO-SCR-03 (UX-CMS-006)
 *
 * The editor references media through the canonical DAM registry: the picker
 * rows come from `listApprovedMediaAssets` and submit selected
 * `MediaAssetRecord.assetId` values as `mediaAssetIds` checkboxes — never
 * free-text asset keys. Server-side, `createContent`/`editContent` reject any
 * id that is not a registered AVAILABLE asset ([CMS-11]), so the form and the
 * domain agree on the same canonical-reference invariant.
 *
 * Renderers here are pure projections: they never mutate content or media
 * state. Mutations go through the audited API routes:
 *   POST /api/v1/workspace/content        (create:content)
 *   PUT  /api/v1/workspace/content        (update:content)
 */

import { escapeHtml } from "../components/escape.js";
import { CSRF_FIELD_NAME } from "../../core/websecurity/index.js";
import type { MediaAssetRecord } from "../../core/storage/index.js";

export interface ContentEditorMediaRow {
  assetId: string;
  title: string;
  mimeType: string;
  provenance: string;
  accessState: string;
  selected: boolean;
}

export interface ContentEditorFormProjection {
  mode: "create" | "edit";
  contentId?: string;
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  alternativeText?: string;
  currentRevision?: number;
  status?: string;
  mediaRows: ContentEditorMediaRow[];
  mediaSummary: { available: number; hiddenUnavailable: number };
}

export function projectContentEditorForm(params: {
  mode: "create" | "edit";
  content?: { id: string; currentRevision: number; status: string; revision: { title: string; slug: string; summary: string; body: string; alternativeText: string; mediaAssetIds: string[] } };
  availableAssets: MediaAssetRecord[];
  unavailableAssets?: MediaAssetRecord[];
}): ContentEditorFormProjection {
  const selectedIds = new Set(params.content?.revision.mediaAssetIds ?? []);
  const allAssets = [...params.availableAssets, ...(params.unavailableAssets ?? [])];
  return {
    mode: params.mode,
    ...(params.content
      ? {
          contentId: params.content.id,
          currentRevision: params.content.currentRevision,
          status: params.content.status,
          title: params.content.revision.title,
          slug: params.content.revision.slug,
          summary: params.content.revision.summary,
          body: params.content.revision.body,
          alternativeText: params.content.revision.alternativeText,
        }
      : {}),
    mediaRows: allAssets.map((a) => ({
      assetId: a.assetId,
      title: a.title,
      mimeType: a.mimeType,
      provenance: a.provenance,
      accessState: a.accessState,
      // Unavailable assets are never selectable — §7.3 contract.
      selected: a.accessState === "AVAILABLE" && selectedIds.has(a.assetId),
    })),
    mediaSummary: {
      available: params.availableAssets.length,
      hiddenUnavailable: (params.unavailableAssets ?? []).length,
    },
  };
}

function mediaPickerFieldset(projection: ContentEditorFormProjection): string {
  const { mediaRows, mediaSummary } = projection;
  if (mediaRows.length === 0) {
    return `
      <fieldset style="border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); padding: 16px; margin: 0 0 16px 0;">
        <legend style="font-weight: 700; padding: 0 6px;">Media (approved picker)</legend>
        <p data-testid="editor-media-empty" style="color: var(--vmn-color-secondary-text, #475569); margin: 0;">
          No DAM assets are registered yet. Register a master via the storage endpoints and it will appear here;
          content can still be saved without media references.
        </p>
      </fieldset>`;
  }
  const rows = mediaRows
    .map((row) => {
      const disabled = row.accessState !== "AVAILABLE";
      const stateLabel = disabled ? ` (${escapeHtml(row.accessState)} — not selectable)` : "";
      return `        <label style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${disabled ? "opacity: 0.6;" : ""}">
          <input type="checkbox" name="mediaAssetIds" value="${escapeHtml(row.assetId)}"${row.selected ? " checked" : ""}${disabled ? " disabled" : ""} aria-label="Use media ${escapeHtml(row.title)}${stateLabel}">
          <span>
            <strong>${escapeHtml(row.title)}</strong>
            <span style="display: block; font-size: 0.78rem; color: var(--vmn-color-secondary-text, #475569); font-family: monospace;">${escapeHtml(row.assetId)}</span>
            <span style="display: block; font-size: 0.78rem; color: var(--vmn-color-secondary-text, #475569);">${escapeHtml(row.mimeType)} &middot; ${escapeHtml(row.provenance)}${stateLabel}</span>
          </span>
        </label>`;
    })
    .join("\n");
  return `
      <fieldset style="border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); padding: 16px; margin: 0 0 16px 0;">
        <legend style="font-weight: 700; padding: 0 6px;">Media (approved picker &middot; UX-CMS-006)</legend>
        <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: var(--vmn-color-secondary-text, #475569);">
          ${mediaSummary.available} available asset${mediaSummary.available === 1 ? "" : "s"}${mediaSummary.hiddenUnavailable > 0 ? ` &middot; ${mediaSummary.hiddenUnavailable} hidden (quarantined/failed, shown greyed for audit)` : ""}.
          Selected references are validated server-side against the DAM registry.
        </p>
${rows}
      </fieldset>`;
}

export function renderContentEditorFormHtml(projection: ContentEditorFormProjection, options: { csrfToken?: string } = {}): string {
  const isEdit = projection.mode === "edit";
  const heading = isEdit
    ? `Edit Content — ${escapeHtml(projection.title || projection.contentId || "")}`
    : "Create Content";
  // Distinct endpoints keep the declarative guard table exact: create →
  // create:content, update → update:content (HTML forms cannot send PUT).
  const action = isEdit ? "/api/v1/workspace/content-editor/update" : "/api/v1/workspace/content-editor";
  const hiddenId = isEdit ? `\n        <input type="hidden" name="contentId" value="${escapeHtml(projection.contentId || "")}">` : "";
  const csrfField = options.csrfToken
    ? `\n        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${escapeHtml(options.csrfToken)}">`
    : "";
  const metaLine = isEdit
    ? `\n        <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: var(--vmn-color-secondary-text, #475569);">
            Content <strong>${escapeHtml(projection.contentId || "")}</strong> &middot; revision ${projection.currentRevision} &middot; state ${escapeHtml(projection.status || "")}.
            Saving creates a NEW revision; the prior approved revision is immutable.
          </p>`
    : "";

  return `
    <div style="max-width: 900px; margin: 32px auto; padding: 0 16px;">
      <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">EDITORIAL &bull; UX-CMS-001..006</span>
      <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">${heading}</h1>
      <form id="content-editor-form" method="POST" action="${action}" style="background: var(--vmn-color-surface, #fff); border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-lg, 12px); padding: 24px;">
        ${csrfField}${hiddenId}${metaLine}
        <label style="display: block; font-weight: 700; margin-bottom: 4px;" for="editor-title">Title</label>
        <input id="editor-title" name="title" required value="${escapeHtml(projection.title || "")}" style="width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); margin-bottom: 16px;">
        <label style="display: block; font-weight: 700; margin-bottom: 4px;" for="editor-slug">Slug (lower-kebab-case)</label>
        <input id="editor-slug" name="slug" required pattern="[a-z0-9-]+" value="${escapeHtml(projection.slug || "")}" style="width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); margin-bottom: 16px;">
        <label style="display: block; font-weight: 700; margin-bottom: 4px;" for="editor-summary">Summary</label>
        <textarea id="editor-summary" name="summary" rows="2" style="width: 100%; padding: 10px; border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); margin-bottom: 16px;">${escapeHtml(projection.summary || "")}</textarea>
        <label style="display: block; font-weight: 700; margin-bottom: 4px;" for="editor-body">Body</label>
        <textarea id="editor-body" name="body" rows="6" style="width: 100%; padding: 10px; border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); margin-bottom: 16px;">${escapeHtml(projection.body || "")}</textarea>
${mediaPickerFieldset(projection)}
        <label style="display: block; font-weight: 700; margin-bottom: 4px;" for="editor-alt">Alternative text (accessibility)</label>
        <input id="editor-alt" name="alternativeText" value="${escapeHtml(projection.alternativeText || "")}" style="width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--vmn-color-border, #e2e8f0); border-radius: var(--vmn-radius-md, 8px); margin-bottom: 20px;">
        <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 20px; cursor: pointer;">
          ${isEdit ? "Save new revision" : "Create content"}
        </button>
      </form>
    </div>`;
}
