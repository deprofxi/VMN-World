/**
 * VMNL Content Revision & Publication Domain — UX-CMS-001..006
 * (todo.md TODO-SCR-01, TODO-SCR-02)
 * Authority: VMN APP UI UX.docx §8.13
 *
 * Implements:
 * - Revision model: editing approved content creates a NEW revision and never
 *   mutates the approved publication.
 * - Publication preconditions: approved revision, checks satisfied,
 *   verified destination, publisher authority distinct from editor.
 * - Withdrawal consequences recorded (affected paths, replacement, campaign
 *   notification flag).
 * - SCR-03 (UX-CMS-006): mediaAssetIds must reference registered DAM assets
 *   (MediaAssetRecord registry in core/storage) — never free-text keys.
 */

import type { MediaAssetRecord } from "../storage/index.js";

/**
 * Seam for validating mediaAssetIds against the canonical DAM registry.
 * Wired at boot from core/storage (wireMediaAssetLookup) so this module
 * stays decoupled from the storage singleton while still enforcing the
 * canonical-reference invariant server-side.
 */
let mediaAssetLookup: ((assetId: string) => MediaAssetRecord | undefined) | null = null;

export function wireMediaAssetLookup(lookup: (assetId: string) => MediaAssetRecord | undefined): void {
  mediaAssetLookup = lookup;
}

function requireRegisteredMediaAssets(assetIds: string[] | undefined): void {
  if (!assetIds || assetIds.length === 0) return;
  if (!mediaAssetLookup) {
    throw new Error("[CMS-11] Media asset registry is not wired; mediaAssetIds cannot be validated.");
  }
  for (const id of assetIds) {
    const asset = mediaAssetLookup(id);
    if (!asset) {
      throw new Error(`[CMS-11] mediaAssetId '${id}' is not a registered DAM asset; use the approved media picker references only.`);
    }
    if (asset.accessState !== "AVAILABLE") {
      throw new Error(`[CMS-11] mediaAssetId '${id}' is ${asset.accessState} and does not satisfy the §7.3 evidence-attachment contract.`);
    }
  }
}

export type ContentStatus = "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "WITHDRAWN";

export interface ContentRevision {
  revision: number;
  title: string;
  slug: string;
  summary: string;
  body: string;
  relatedUnit: string;
  mediaAssetIds: string[];
  claimSources: string[];
  alternativeText: string;
  authorId: string;
  createdAt: Date;
  submittedForReviewAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  reviewNotes?: string;
}

export interface PublicationRecord {
  revision: number;
  publishedAt: Date;
  publishedBy: string;
  destinationId?: string;
}

export interface WithdrawalRecord {
  revision: number;
  withdrawnAt: Date;
  withdrawnBy: string;
  reason: string;
  affectedPublicPaths: string[];
  replacementContentId?: string;
  campaignNotificationRequired: boolean;
}

export interface ContentItem {
  id: string;
  currentRevision: number;
  status: ContentStatus;
  revisions: Map<number, ContentRevision>;
  publication?: PublicationRecord;
  withdrawal?: WithdrawalRecord;
  destinationId?: string;
}

const contentItems = new Map<string, ContentItem>();

export function createContent(params: {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  relatedUnit: string;
  mediaAssetIds?: string[];
  claimSources?: string[];
  alternativeText?: string;
  authorId: string;
}): ContentItem {
  if (contentItems.has(params.id)) {
    throw new Error(`[CMS-01] Content '${params.id}' already exists.`);
  }
  if (!params.slug || !/^[a-z0-9-]+$/.test(params.slug)) {
    throw new Error("[CMS-02] Canonical slug must be lower-kebab-case.");
  }
  // SCR-03: canonical media references — validated against the DAM registry.
  requireRegisteredMediaAssets(params.mediaAssetIds);
  const revision: ContentRevision = {
    revision: 1,
    title: params.title,
    slug: params.slug,
    summary: params.summary,
    body: params.body,
    relatedUnit: params.relatedUnit,
    mediaAssetIds: params.mediaAssetIds || [],
    claimSources: params.claimSources || [],
    alternativeText: params.alternativeText || "",
    authorId: params.authorId,
    createdAt: new Date(),
  };
  const item: ContentItem = {
    id: params.id,
    currentRevision: 1,
    status: "DRAFT",
    revisions: new Map([[1, revision]]),
  };
  contentItems.set(params.id, item);
  return item;
}

export function getContent(id: string): ContentItem | undefined {
  return contentItems.get(id);
}

/**
 * Editing approved/published content creates a NEW revision; the approved
 * publication is never silently mutated (UIUX-001 §8.13 invariant).
 */
export function editContent(params: {
  id: string;
  editorId: string;
  changes: Partial<Pick<ContentRevision, "title" | "summary" | "body" | "mediaAssetIds" | "claimSources" | "alternativeText">>;
}): ContentItem {
  const item = contentItems.get(params.id);
  if (!item) throw new Error(`[CMS-03] Content '${params.id}' not found.`);

  // SCR-03: canonical media references — validated against the DAM registry
  // for every NEW revision that carries mediaAssetIds.
  requireRegisteredMediaAssets(params.changes.mediaAssetIds);

  const current = item.revisions.get(item.currentRevision)!;
  const nextRevisionNumber = item.currentRevision + 1;
  const next: ContentRevision = {
    ...current,
    ...params.changes,
    revision: nextRevisionNumber,
    authorId: params.editorId,
    createdAt: new Date(),
    approvedAt: undefined,
    approvedBy: undefined,
    reviewNotes: undefined,
    submittedForReviewAt: undefined,
  };
  item.revisions.set(nextRevisionNumber, next);
  item.currentRevision = nextRevisionNumber;

  // A material change invalidates affected review: status resets.
  if (item.status === "PUBLISHED" || item.status === "APPROVED") {
    item.status = "DRAFT";
  } else if (item.status === "IN_REVIEW" || item.status === "CHANGES_REQUESTED") {
    item.status = "DRAFT";
  }
  return item;
}

export function submitForReview(id: string): ContentItem {
  const item = requireItem(id);
  if (item.status !== "DRAFT") {
    throw new Error(`[CMS-04] Only DRAFT content can enter review (current: ${item.status}).`);
  }
  item.status = "IN_REVIEW";
  item.revisions.get(item.currentRevision)!.submittedForReviewAt = new Date();
  return item;
}

export function requestChanges(id: string, reviewerId: string, notes: string): ContentItem {
  const item = requireItem(id);
  if (item.status !== "IN_REVIEW") throw new Error("[CMS-05] Content is not in review.");
  item.status = "CHANGES_REQUESTED";
  const rev = item.revisions.get(item.currentRevision)!;
  rev.reviewNotes = notes;
  rev.approvedBy = reviewerId;
  return item;
}

export function approveRevision(id: string, approverId: string): ContentItem {
  const item = requireItem(id);
  if (item.status !== "IN_REVIEW") throw new Error("[CMS-06] Content must be IN_REVIEW to approve.");
  if (item.revisions.get(item.currentRevision)!.authorId === approverId) {
    throw new Error("[CMS-07] Separation of duties: the author cannot approve their own revision.");
  }
  item.status = "APPROVED";
  const rev = item.revisions.get(item.currentRevision)!;
  rev.approvedAt = new Date();
  rev.approvedBy = approverId;
  return item;
}

/**
 * Publication (UIUX-001 §8.13 preconditions):
 * - current revision approved
 * - publisher authority (checked by caller via RBAC)
 * - verified destination for external action (registry checked here when supplied)
 * - editor alone is insufficient (author != publisher enforced)
 */
export function publishContent(params: {
  id: string;
  publisherId: string;
  destinationRegistry?: { isVerified(destinationId: string): boolean };
}): { item: ContentItem; publication: PublicationRecord } {
  const item = requireItem(params.id);
  if (item.status !== "APPROVED") {
    throw new Error(`[CMS-08] Publication requires an APPROVED revision (current: ${item.status}).`);
  }
  const rev = item.revisions.get(item.currentRevision)!;
  if (rev.authorId === params.publisherId) {
    throw new Error("[CMS-09] Editor role alone is insufficient: publisher must differ from the revision author.");
  }
  if (item.destinationId && params.destinationRegistry && !params.destinationRegistry.isVerified(item.destinationId)) {
    throw new Error(`[CMS-10] Destination '${item.destinationId}' is not a verified Azeebo+ destination.`);
  }
  const publication: PublicationRecord = {
    revision: item.currentRevision,
    publishedAt: new Date(),
    publishedBy: params.publisherId,
    destinationId: item.destinationId,
  };
  item.publication = publication;
  item.status = "PUBLISHED";
  return { item, publication };
}

export function withdrawContent(params: {
  id: string;
  withdrawnBy: string;
  reason: string;
  affectedPublicPaths: string[];
  replacementContentId?: string;
}): { item: ContentItem; withdrawal: WithdrawalRecord } {
  const item = requireItem(params.id);
  if (item.status !== "PUBLISHED") {
    throw new Error(`[CMS-11] Only PUBLISHED content can be withdrawn (current: ${item.status}).`);
  }
  if (!params.reason || params.reason.trim().length < 4) {
    throw new Error("[CMS-12] Withdrawal requires a recorded reason.");
  }
  const withdrawal: WithdrawalRecord = {
    revision: item.currentRevision,
    withdrawnAt: new Date(),
    withdrawnBy: params.withdrawnBy,
    reason: params.reason.trim(),
    affectedPublicPaths: params.affectedPublicPaths,
    replacementContentId: params.replacementContentId,
    campaignNotificationRequired: params.replacementContentId === undefined,
  };
  item.withdrawal = withdrawal;
  item.status = "WITHDRAWN";
  return { item, withdrawal };
}

export function listContentByStatus(status: ContentStatus): ContentItem[] {
  return [...contentItems.values()].filter((c) => c.status === status);
}

function requireItem(id: string): ContentItem {
  const item = contentItems.get(id);
  if (!item) throw new Error(`[CMS-03] Content '${id}' not found.`);
  return item;
}

export function _resetContentForTesting(): void {
  contentItems.clear();
}
