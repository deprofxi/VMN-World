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
 <fieldset class="s-XFJdNBMojc">
 <legend class="s-BEMbOyJv0J">Media (approved picker)</legend>
 <p data-testid="editor-media-empty" class="s--LoUvClrjg">
          No DAM assets are registered yet. Register a master via the storage endpoints and it will appear here;
          content can still be saved without media references.
        </p>
      </fieldset>`;
  }
  const rows = mediaRows
    .map((row) => {
      const disabled = row.accessState !== "AVAILABLE";
      const stateLabel = disabled ? ` (${escapeHtml(row.accessState)} — not selectable)` : "";
 return ` <label style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${disabled ? "opacity: 0.6;" : ""}">
          <input type="checkbox" name="mediaAssetIds" value="${escapeHtml(row.assetId)}"${row.selected ? " checked" : ""}${disabled ? " disabled" : ""} aria-label="Use media ${escapeHtml(row.title)}${stateLabel}">
          <span>
            <strong>${escapeHtml(row.title)}</strong>
 <span class="s-FPphS-FhdW">${escapeHtml(row.assetId)}</span>
 <span class="s-dlX1Il0iRV">${escapeHtml(row.mimeType)} &middot; ${escapeHtml(row.provenance)}${stateLabel}</span>
          </span>
        </label>`;
    })
    .join("\n");
  return `
 <fieldset class="s-XFJdNBMojc">
 <legend class="s-BEMbOyJv0J">Media (approved picker &middot; UX-CMS-006)</legend>
 <p class="s-hoqXe4PDOU">
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
 ? `\n <p class="s-9MWunhwMC2">
            Content <strong>${escapeHtml(projection.contentId || "")}</strong> &middot; revision ${projection.currentRevision} &middot; state ${escapeHtml(projection.status || "")}.
            Saving creates a NEW revision; the prior approved revision is immutable.
          </p>`
    : "";

  return `
 <div class="s-6m0XILdru8">
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >EDITORIAL &bull; UX-CMS-001..006</span>
 <h1 class="s-2q3CO5UHYm">${heading}</h1>
 <form id="content-editor-form" method="POST" action="${action}" class="s-l3QuyaHqJE">
        ${csrfField}${hiddenId}${metaLine}
 <label class="s-zCbiFWUhSY" for="editor-title">Title</label>
 <input id="editor-title" name="title" required value="${escapeHtml(projection.title || "")}" class="s-TiIUZ68BNJ">
 <label class="s-zCbiFWUhSY" for="editor-slug">Slug (lower-kebab-case)</label>
 <input id="editor-slug" name="slug" required pattern="[a-z0-9-]+" value="${escapeHtml(projection.slug || "")}" class="s-TiIUZ68BNJ">
 <label class="s-zCbiFWUhSY" for="editor-summary">Summary</label>
 <textarea id="editor-summary" name="summary" rows="2" class="s-RH6tq5mnR3">${escapeHtml(projection.summary || "")}</textarea>
 <label class="s-zCbiFWUhSY" for="editor-body">Body</label>
 <textarea id="editor-body" name="body" rows="6" class="s-RH6tq5mnR3">${escapeHtml(projection.body || "")}</textarea>
${mediaPickerFieldset(projection)}
 <label class="s-zCbiFWUhSY" for="editor-alt">Alternative text (accessibility)</label>
 <input id="editor-alt" name="alternativeText" value="${escapeHtml(projection.alternativeText || "")}" class="s-rY867yiWKo">
 <button type="submit" class="btn btn-primary s-c4do-NUreb" >
          ${isEdit ? "Save new revision" : "Create content"}
        </button>
      </form>
    </div>`;
}
