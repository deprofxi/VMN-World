/**
 * TSK-17 — persisters and hydrators for the release-critical stores report.md
 * CA-12 measured as process-memory only (`prisma/migrations/
 * 20261008213000_add_release_critical_durable_stores/migration.sql`).
 *
 * One file, one function pair per store, because these tables are *state
 * projections* rather than query targets: the domain module keeps the record it
 * already had, this file is the only place that knows the column layout, and each
 * `load…()` rebuilds the module's read index at boot. Rows are keyed by the
 * domain id, so the durable row and the in-process index entry are the same
 * record — a restart cannot renumber an approval or an enquiry reference.
 *
 * Deliberate omissions, stated rather than hidden:
 * - No foreign keys. A durable write must not fail because a test or a backfill
 *   created the child before its parent (the `DataSubjectRequest` precedent).
 *   Referential integrity for these id references is therefore application-side.
 * - `registeredBy` on `AzeeboDestination` and the row-level `updatedAt` are
 *   provenance columns with no counterpart on the domain record; hydration does
 *   not invent them back.
 */

import type { EnquiryRecord } from "../../../modules/hub/enquiry/index.js";
import type { ApprovalItem } from "../../approvals/index.js";
import type { PrivacySecurityCase } from "../../cases/index.js";
import type { AzeeboDestination } from "../../federation/destinations.js";
import type { IssueRecord, RiskRecord } from "../../work/index.js";
import type { SessionRecord } from "../../auth/sessions.js";
import type { IdempotencyRecord } from "../../websecurity/index.js";
import type { MediaAssetRecord } from "../../storage/index.js";
import type {
  ContentItem,
  ContentRevision,
  ContentStatus,
  PublicationRecord,
  WithdrawalRecord,
} from "../../content/index.js";
import type { JournalEntry, JournalLine } from "../../../modules/finance/ledger/index.js";
import type { SalesDeal, SalesStage } from "../../../modules/finance/sales/index.js";
import type { SponsorBinding, SponsorBindingFulfillment } from "../../../modules/broadcast/sponsorship/index.js";
import { getPrismaClient } from "../index.js";
// `Prisma.DbNull` is a value as well as a namespace, so this import is not
// type-only (it is the only way to write an explicit SQL NULL into a Json column).
import { Prisma } from "@prisma/client";

/** JSON columns arrive as `unknown`; these narrow the shape or throw honestly. */
function asArray<T>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`[VMNL-DURABILITY] expected a JSON array, got ${typeof value}`);
  return value as T[];
}

/** Anything the caller stored as a JSON payload, or `undefined` to leave the column null. */
function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return (value === null ? null : value) as Prisma.InputJsonValue;
}

/**
 * Required (non-nullable) Json column. Every domain record below always supplies
 * these payloads, so an absent one is a programming error, not a NULL to store —
 * it fails loudly rather than writing an empty array nobody assigned.
 */
function asRequiredJson(value: unknown): Prisma.InputJsonValue {
  const json = asJson(value);
  if (json === undefined) throw new Error("[VMNL-DURABILITY] required Json payload is missing");
  return json;
}

// ---------------------------------------------------------------------------
// CommercialEnquiry — VS-RL1-01 / HX-01 enquiry intake
// ---------------------------------------------------------------------------

export async function persistCommercialEnquiry(record: EnquiryRecord): Promise<void> {
  await getPrismaClient().commercialEnquiry.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      reference: record.reference,
      idempotencyKey: record.idempotencyKey ?? null,
      vertical: record.vertical,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone ?? null,
      organisationName: record.organisationName ?? null,
      message: record.message,
      ndprConsent: record.ndprConsent,
      submissionStatus: record.submissionStatus,
      routingStatus: record.routingStatus,
      downstreamLeadId: record.downstreamLeadId ?? null,
      assignedOperator: record.assignedOperator ?? null,
      routingError: record.routingError ?? null,
      retryCount: record.retryCount,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    },
    update: {
      reference: record.reference,
      idempotencyKey: record.idempotencyKey ?? null,
      vertical: record.vertical,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone ?? null,
      organisationName: record.organisationName ?? null,
      message: record.message,
      ndprConsent: record.ndprConsent,
      submissionStatus: record.submissionStatus,
      routingStatus: record.routingStatus,
      downstreamLeadId: record.downstreamLeadId ?? null,
      assignedOperator: record.assignedOperator ?? null,
      routingError: record.routingError ?? null,
      retryCount: record.retryCount,
      updatedAt: new Date(record.updatedAt),
    },
  });
}

export async function loadCommercialEnquiries(): Promise<EnquiryRecord[]> {
  const rows = await getPrismaClient().commercialEnquiry.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    ...(row.idempotencyKey ? { idempotencyKey: row.idempotencyKey } : {}),
    vertical: row.vertical as EnquiryRecord["vertical"],
    fullName: row.fullName,
    email: row.email,
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.organisationName ? { organisationName: row.organisationName } : {}),
    message: row.message,
    ndprConsent: row.ndprConsent,
    submissionStatus: row.submissionStatus as EnquiryRecord["submissionStatus"],
    routingStatus: row.routingStatus as EnquiryRecord["routingStatus"],
    ...(row.downstreamLeadId ? { downstreamLeadId: row.downstreamLeadId } : {}),
    ...(row.assignedOperator ? { assignedOperator: row.assignedOperator } : {}),
    ...(row.routingError ? { routingError: row.routingError } : {}),
    retryCount: row.retryCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// ApprovalItem — SCR-06 four-eyes decisions
// ---------------------------------------------------------------------------

export async function persistApprovalItem(record: ApprovalItem): Promise<void> {
  await getPrismaClient().approvalItem.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      category: record.category,
      subject: record.subject,
      justification: record.justification,
      financialScopeNgn: record.financialScopeNgn,
      currency: record.currency,
      initiatorId: record.initiatorId,
      initiatorName: record.initiatorName,
      objectRevision: record.objectRevision,
      requiresFourEyes: record.requiresFourEyes,
      status: record.status,
      decidedBy: record.decidedBy ?? null,
      decidedByName: record.decidedByName ?? null,
      decidedAt: record.decidedAt ?? null,
      decisionReason: record.decisionReason ?? null,
      decisionRevision: record.decisionRevision ?? null,
      createdAt: record.createdAt,
      updatedAt: record.decidedAt ?? record.createdAt,
    },
    update: {
      category: record.category,
      subject: record.subject,
      justification: record.justification,
      financialScopeNgn: record.financialScopeNgn,
      currency: record.currency,
      objectRevision: record.objectRevision,
      requiresFourEyes: record.requiresFourEyes,
      status: record.status,
      decidedBy: record.decidedBy ?? null,
      decidedByName: record.decidedByName ?? null,
      decidedAt: record.decidedAt ?? null,
      decisionReason: record.decisionReason ?? null,
      decisionRevision: record.decisionRevision ?? null,
      updatedAt: record.decidedAt ?? record.createdAt,
    },
  });
}

export async function loadApprovalItems(): Promise<ApprovalItem[]> {
  const rows = await getPrismaClient().approvalItem.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    category: row.category as ApprovalItem["category"],
    subject: row.subject,
    justification: row.justification,
    financialScopeNgn: Number(row.financialScopeNgn),
    currency: row.currency,
    initiatorId: row.initiatorId,
    initiatorName: row.initiatorName,
    objectRevision: row.objectRevision,
    requiresFourEyes: row.requiresFourEyes,
    status: row.status as ApprovalItem["status"],
    ...(row.decidedBy ? { decidedBy: row.decidedBy } : {}),
    ...(row.decidedByName ? { decidedByName: row.decidedByName } : {}),
    ...(row.decidedAt ? { decidedAt: row.decidedAt } : {}),
    ...(row.decisionReason ? { decisionReason: row.decisionReason } : {}),
    ...(row.decisionRevision !== null ? { decisionRevision: row.decisionRevision } : {}),
    createdAt: row.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// PrivacySecurityCase — SCR-08 case ledger
// ---------------------------------------------------------------------------

interface StoredCaseAuditEntry {
  at: string;
  actor: string;
  action: string;
  note?: string | null;
}

export async function persistPrivacySecurityCase(record: PrivacySecurityCase): Promise<void> {
  const auditTrail = record.auditTrail.map((entry) => ({
    at: entry.at.toISOString(),
    actor: entry.actor,
    action: entry.action,
    ...(entry.note === undefined ? {} : { note: entry.note }),
  }));
  await getPrismaClient().privacySecurityCase.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      type: record.type,
      subject: record.subject,
      detail: record.detail,
      reporterContact: record.reporterContact,
      dataSubjects: record.dataSubjects ?? undefined,
      slaDueAt: record.slaDueAt,
      status: record.status,
      assignedCaseOwner: record.assignedCaseOwner ?? null,
      auditTrail,
      createdAt: record.createdAt,
      updatedAt: new Date(),
    },
    update: {
      type: record.type,
      subject: record.subject,
      detail: record.detail,
      reporterContact: record.reporterContact,
      dataSubjects: record.dataSubjects ?? undefined,
      slaDueAt: record.slaDueAt,
      status: record.status,
      assignedCaseOwner: record.assignedCaseOwner ?? null,
      auditTrail,
      updatedAt: new Date(),
    },
  });
}

export async function loadPrivacySecurityCases(): Promise<PrivacySecurityCase[]> {
  const rows = await getPrismaClient().privacySecurityCase.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    type: row.type as PrivacySecurityCase["type"],
    subject: row.subject,
    detail: row.detail,
    reporterContact: row.reporterContact,
    ...(row.dataSubjects ? { dataSubjects: asArray<string>(row.dataSubjects) } : {}),
    slaDueAt: row.slaDueAt,
    status: row.status as PrivacySecurityCase["status"],
    ...(row.assignedCaseOwner ? { assignedCaseOwner: row.assignedCaseOwner } : {}),
    auditTrail: asArray<StoredCaseAuditEntry>(row.auditTrail).map((entry) => ({
      at: new Date(entry.at),
      actor: entry.actor,
      action: entry.action,
      ...(entry.note === undefined || entry.note === null ? {} : { note: entry.note }),
    })),
    createdAt: row.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// RiskRecord / IssueRecord — governance registers
// ---------------------------------------------------------------------------

export async function persistRiskRecord(record: RiskRecord): Promise<void> {
  await getPrismaClient().riskRecord.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      title: record.title,
      category: record.category,
      likelihood: record.likelihood,
      impact: record.impact,
      mitigation: record.mitigation,
      owner: record.owner,
      status: record.status,
      reviewDueAt: record.reviewDueAt,
      createdAt: record.createdAt,
      updatedAt: new Date(),
    },
    update: {
      title: record.title,
      category: record.category,
      likelihood: record.likelihood,
      impact: record.impact,
      mitigation: record.mitigation,
      owner: record.owner,
      status: record.status,
      reviewDueAt: record.reviewDueAt,
      updatedAt: new Date(),
    },
  });
}

export async function loadRiskRecords(): Promise<RiskRecord[]> {
  const rows = await getPrismaClient().riskRecord.findMany({ orderBy: { reviewDueAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    likelihood: row.likelihood as RiskRecord["likelihood"],
    impact: row.impact as RiskRecord["impact"],
    mitigation: row.mitigation,
    owner: row.owner,
    status: row.status as RiskRecord["status"],
    reviewDueAt: row.reviewDueAt,
    createdAt: row.createdAt,
  }));
}

export async function persistIssueRecord(record: IssueRecord): Promise<void> {
  await getPrismaClient().issueRecord.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      title: record.title,
      description: record.description,
      severity: record.severity,
      raisedBy: record.raisedBy,
      assignedTo: record.assignedTo ?? null,
      status: record.status,
      linkedRiskId: record.linkedRiskId ?? null,
      resolvedAt: record.resolvedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: new Date(),
    },
    update: {
      title: record.title,
      description: record.description,
      severity: record.severity,
      assignedTo: record.assignedTo ?? null,
      status: record.status,
      linkedRiskId: record.linkedRiskId ?? null,
      resolvedAt: record.resolvedAt ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function loadIssueRecords(): Promise<IssueRecord[]> {
  const rows = await getPrismaClient().issueRecord.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity as IssueRecord["severity"],
    raisedBy: row.raisedBy,
    ...(row.assignedTo ? { assignedTo: row.assignedTo } : {}),
    status: row.status as IssueRecord["status"],
    ...(row.linkedRiskId ? { linkedRiskId: row.linkedRiskId } : {}),
    ...(row.resolvedAt ? { resolvedAt: row.resolvedAt } : {}),
    createdAt: row.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// AzeeboDestination — federation verification state
// ---------------------------------------------------------------------------

/**
 * `registeredBy` is who asserted the destination; the domain record does not
 * carry the actor after registration, so the write states it explicitly.
 */
export interface AzeeboDestinationWrite {
  destination: AzeeboDestination;
  registeredBy?: string;
}

export async function persistAzeeboDestination(write: AzeeboDestinationWrite): Promise<void> {
  const record = write.destination;
  await getPrismaClient().azeeboDestination.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      universe: record.universe,
      universalUrl: record.universalUrl,
      status: record.status,
      verifiedAt: record.verifiedAt ?? null,
      verifiedBy: record.verifiedBy ?? null,
      statusReason: record.statusReason ?? null,
      stateChangedAt: record.stateChangedAt,
      campaignContextAllowed: record.campaignContextAllowed,
      registeredBy: write.registeredBy ?? "unknown",
      createdAt: record.stateChangedAt,
      updatedAt: new Date(),
    },
    update: {
      universe: record.universe,
      universalUrl: record.universalUrl,
      status: record.status,
      verifiedAt: record.verifiedAt ?? null,
      verifiedBy: record.verifiedBy ?? null,
      statusReason: record.statusReason ?? null,
      stateChangedAt: record.stateChangedAt,
      campaignContextAllowed: record.campaignContextAllowed,
      ...(write.registeredBy ? { registeredBy: write.registeredBy } : {}),
      updatedAt: new Date(),
    },
  });
}

export async function loadAzeeboDestinations(): Promise<AzeeboDestination[]> {
  const rows = await getPrismaClient().azeeboDestination.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    universe: row.universe,
    universalUrl: row.universalUrl,
    status: row.status as AzeeboDestination["status"],
    ...(row.verifiedAt ? { verifiedAt: row.verifiedAt } : {}),
    ...(row.verifiedBy ? { verifiedBy: row.verifiedBy } : {}),
    ...(row.statusReason ? { statusReason: row.statusReason } : {}),
    stateChangedAt: row.stateChangedAt,
    campaignContextAllowed: row.campaignContextAllowed,
  }));
}

// ---------------------------------------------------------------------------
// MediaAssetRecord — DAM registry (SCR-03)
// ---------------------------------------------------------------------------

export async function persistMediaAssetRecord(record: MediaAssetRecord): Promise<void> {
  // Byte counts arrive from client-supplied upload metadata; a fractional value
  // must not become a rejected row, so it is truncated at this boundary.
  const sizeBytes = BigInt(Math.trunc(record.sizeBytes));
  await getPrismaClient().mediaAssetRecord.upsert({
    where: { id: record.assetId },
    create: {
      id: record.assetId,
      title: record.title,
      assetKey: record.assetKey,
      tenantId: record.tenantId ?? null,
      mimeType: record.mimeType,
      sizeBytes,
      checksumSha256: record.checksumSha256,
      provenance: record.provenance,
      virusScanPassed: record.virusScanPassed,
      accessState: record.accessState,
      accessNotes: record.accessNotes ?? null,
      registeredBy: record.registeredBy,
      registeredAt: record.registeredAt,
      updatedAt: new Date(),
    },
    update: {
      title: record.title,
      assetKey: record.assetKey,
      tenantId: record.tenantId ?? null,
      mimeType: record.mimeType,
      sizeBytes,
      checksumSha256: record.checksumSha256,
      provenance: record.provenance,
      virusScanPassed: record.virusScanPassed,
      accessState: record.accessState,
      accessNotes: record.accessNotes ?? null,
      registeredBy: record.registeredBy,
      updatedAt: new Date(),
    },
  });
}

export async function loadMediaAssetRecords(): Promise<MediaAssetRecord[]> {
  const rows = await getPrismaClient().mediaAssetRecord.findMany({ orderBy: { registeredAt: "asc" } });
  return rows.map((row) => ({
    assetId: row.id,
    title: row.title,
    assetKey: row.assetKey,
    ...(row.tenantId ? { tenantId: row.tenantId } : {}),
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    checksumSha256: row.checksumSha256,
    provenance: row.provenance,
    virusScanPassed: row.virusScanPassed,
    accessState: row.accessState as MediaAssetRecord["accessState"],
    ...(row.accessNotes ? { accessNotes: row.accessNotes } : {}),
    registeredBy: row.registeredBy,
    registeredAt: row.registeredAt,
  }));
}

// ---------------------------------------------------------------------------
// SessionRecord — SEC-03 session registry (revocation outlives the process)
// ---------------------------------------------------------------------------

export async function persistSessionRecord(record: SessionRecord): Promise<void> {
  await getPrismaClient().sessionRecord.upsert({
    where: { id: record.tokenId },
    create: {
      id: record.tokenId,
      userId: record.userId,
      email: record.email,
      deviceLabel: record.deviceLabel,
      ipAddress: record.ipAddress,
      createdAt: record.createdAt,
      lastSeenAt: record.lastSeenAt,
      revokedAt: record.revokedAt ?? null,
    },
    update: {
      userId: record.userId,
      email: record.email,
      deviceLabel: record.deviceLabel,
      ipAddress: record.ipAddress,
      lastSeenAt: record.lastSeenAt,
      revokedAt: record.revokedAt ?? null,
    },
  });
}

export async function loadSessionRecords(): Promise<SessionRecord[]> {
  const rows = await getPrismaClient().sessionRecord.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    tokenId: row.id,
    userId: row.userId,
    email: row.email,
    deviceLabel: row.deviceLabel,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    ...(row.revokedAt ? { revokedAt: row.revokedAt } : {}),
  }));
}

// ---------------------------------------------------------------------------
// IdempotencyRecord — SEC-08 operation-identity ledger
// ---------------------------------------------------------------------------

export async function persistIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
  const responseBody = asJson(record.responseBody);
  await getPrismaClient().idempotencyRecord.upsert({
    where: { id: record.key },
    create: {
      id: record.key,
      outcome: record.outcome,
      responseBody,
      recordedAt: record.recordedAt,
      updatedAt: new Date(),
    },
    update: {
      outcome: record.outcome,
      responseBody,
      updatedAt: new Date(),
    },
  });
}

/**
 * Hydration honours the store's own TTL window: an outcome the registry has
 * already expired must not come back after a restart, or a replay would be
 * answered with a result the domain has decided to forget.
 */
export async function loadIdempotencyRecords(since?: Date): Promise<IdempotencyRecord[]> {
  const rows = await getPrismaClient().idempotencyRecord.findMany({
    where: since ? { recordedAt: { gt: since } } : undefined,
    orderBy: { recordedAt: "asc" },
  });
  return rows.map((row) => ({
    key: row.id,
    outcome: row.outcome,
    ...(row.responseBody === null ? {} : { responseBody: row.responseBody }),
    recordedAt: row.recordedAt,
  }));
}

// ---------------------------------------------------------------------------
// ContentItemRecord + ContentRevisionRecord — the CMS revision chain
// ---------------------------------------------------------------------------

/** The row key is derived, not minted: the chain is addressed by (item, number). */
function revisionRowId(contentId: string, revision: number): string {
  return `${contentId}:${revision}`;
}

interface StoredPublication {
  revision: number;
  publishedAt: string;
  publishedBy: string;
  destinationId?: string | null;
}

interface StoredWithdrawal {
  revision: number;
  withdrawnAt: string;
  withdrawnBy: string;
  reason: string;
  affectedPublicPaths: string[];
  replacementContentId?: string | null;
  campaignNotificationRequired: boolean;
}

/**
 * A content item is one governance-state row plus its whole revision chain.
 * Revision rows are keyed by `contentId:number`, so a review edit rewrites its
 * own row instead of appending a twin, and the chain that came back after a
 * restart is the chain the desk was looking at.
 */
export async function persistContentItem(item: ContentItem): Promise<void> {
  const prisma = getPrismaClient();
  const publication = item.publication
    ? {
        revision: item.publication.revision,
        publishedAt: item.publication.publishedAt.toISOString(),
        publishedBy: item.publication.publishedBy,
        ...(item.publication.destinationId ? { destinationId: item.publication.destinationId } : {}),
      }
    : undefined;
  const withdrawal = item.withdrawal
    ? {
        revision: item.withdrawal.revision,
        withdrawnAt: item.withdrawal.withdrawnAt.toISOString(),
        withdrawnBy: item.withdrawal.withdrawnBy,
        reason: item.withdrawal.reason,
        affectedPublicPaths: item.withdrawal.affectedPublicPaths,
        ...(item.withdrawal.replacementContentId
          ? { replacementContentId: item.withdrawal.replacementContentId }
          : {}),
        campaignNotificationRequired: item.withdrawal.campaignNotificationRequired,
      }
    : undefined;

  const itemState = {
    currentRevision: item.currentRevision,
    status: item.status,
    destinationId: item.destinationId ?? null,
    ...(publication ? { publication: publication as Prisma.InputJsonValue } : { publication: Prisma.DbNull }),
    ...(withdrawal ? { withdrawal: withdrawal as Prisma.InputJsonValue } : { withdrawal: Prisma.DbNull }),
    updatedAt: new Date(),
  };
  await prisma.contentItemRecord.upsert({
    where: { id: item.id },
    create: { id: item.id, createdAt: new Date(), ...itemState },
    update: itemState,
  });

  for (const revision of item.revisions.values()) {
    const rowState = {
      title: revision.title,
      slug: revision.slug,
      summary: revision.summary,
      body: revision.body,
      relatedUnit: revision.relatedUnit,
      mediaAssetIds: asRequiredJson(revision.mediaAssetIds),
      claimSources: asRequiredJson(revision.claimSources),
      alternativeText: revision.alternativeText,
      authorId: revision.authorId,
      submittedForReviewAt: revision.submittedForReviewAt ?? null,
      approvedAt: revision.approvedAt ?? null,
      approvedBy: revision.approvedBy ?? null,
      reviewNotes: revision.reviewNotes ?? null,
      updatedAt: new Date(),
    };
    await prisma.contentRevisionRecord.upsert({
      where: { id: revisionRowId(item.id, revision.revision) },
      create: {
        id: revisionRowId(item.id, revision.revision),
        contentId: item.id,
        revision: revision.revision,
        createdAt: revision.createdAt,
        ...rowState,
      },
      update: rowState,
    });
  }
}

function asPublication(value: unknown): PublicationRecord | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = value as StoredPublication;
  if (typeof raw.publishedAt !== "string" || typeof raw.publishedBy !== "string") {
    throw new Error("[VMNL-DURABILITY] publication payload is not the recorded shape");
  }
  return {
    revision: raw.revision,
    publishedAt: new Date(raw.publishedAt),
    publishedBy: raw.publishedBy,
    ...(raw.destinationId ? { destinationId: raw.destinationId } : {}),
  };
}

function asWithdrawal(value: unknown): WithdrawalRecord | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = value as StoredWithdrawal;
  if (typeof raw.withdrawnAt !== "string" || typeof raw.reason !== "string") {
    throw new Error("[VMNL-DURABILITY] withdrawal payload is not the recorded shape");
  }
  return {
    revision: raw.revision,
    withdrawnAt: new Date(raw.withdrawnAt),
    withdrawnBy: raw.withdrawnBy,
    reason: raw.reason,
    affectedPublicPaths: asArray<string>(raw.affectedPublicPaths),
    ...(raw.replacementContentId ? { replacementContentId: raw.replacementContentId } : {}),
    campaignNotificationRequired: raw.campaignNotificationRequired,
  };
}

export async function loadContentItems(): Promise<ContentItem[]> {
  const prisma = getPrismaClient();
  const [rows, revisionRows] = await Promise.all([
    prisma.contentItemRecord.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contentRevisionRecord.findMany({ orderBy: { revision: "asc" } }),
  ]);

  const chainByItem = new Map<string, ContentRevision[]>();
  for (const row of revisionRows) {
    const revision: ContentRevision = {
      revision: row.revision,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      body: row.body,
      relatedUnit: row.relatedUnit,
      mediaAssetIds: asArray<string>(row.mediaAssetIds),
      claimSources: asArray<string>(row.claimSources),
      alternativeText: row.alternativeText,
      authorId: row.authorId,
      createdAt: row.createdAt,
      ...(row.submittedForReviewAt ? { submittedForReviewAt: row.submittedForReviewAt } : {}),
      ...(row.approvedAt ? { approvedAt: row.approvedAt } : {}),
      ...(row.approvedBy ? { approvedBy: row.approvedBy } : {}),
      ...(row.reviewNotes ? { reviewNotes: row.reviewNotes } : {}),
    };
    const chain = chainByItem.get(row.contentId) ?? [];
    chain.push(revision);
    chainByItem.set(row.contentId, chain);
  }

  return rows.map((row) => {
    const publication = asPublication(row.publication);
    const withdrawal = asWithdrawal(row.withdrawal);
    return {
      id: row.id,
      currentRevision: row.currentRevision,
      status: row.status as ContentStatus,
      revisions: new Map((chainByItem.get(row.id) ?? []).map((revision) => [revision.revision, revision])),
      ...(publication ? { publication } : {}),
      ...(withdrawal ? { withdrawal } : {}),
      ...(row.destinationId ? { destinationId: row.destinationId } : {}),
    };
  });
}

// ---------------------------------------------------------------------------
// JournalEntryRecord — the double-entry journal (law 5)
// ---------------------------------------------------------------------------

/**
 * Lines are the pair set that makes the entry balance, so they travel as one
 * Json payload beside the typed debit/credit totals. `isBalanced` is written,
 * never implied: a hydrated ledger must still be able to prove the invariant
 * rather than re-derive it from rows someone could have edited.
 */
export async function persistJournalEntry(entry: JournalEntry): Promise<void> {
  const lines = entry.lines.map((line) => ({
    accountCode: line.accountCode,
    accountName: line.accountName,
    debitNgn: line.debitNgn,
    creditNgn: line.creditNgn,
  }));
  const state = {
    reference: entry.reference,
    description: entry.description,
    lines: asRequiredJson(lines),
    totalDebitNgn: entry.totalDebitNgn,
    totalCreditNgn: entry.totalCreditNgn,
    isBalanced: entry.isBalanced,
    postedAt: entry.postedAt,
    updatedAt: new Date(),
  };
  await getPrismaClient().journalEntryRecord.upsert({
    where: { id: entry.id },
    // The column states its unit, so the row states its currency. Nothing in
    // the domain supplies one, and hydration refuses anything else rather than
    // relabelling another currency's kobo figures as NGN.
    create: { id: entry.id, currency: "NGN", ...state },
    update: state,
  });
}

export async function loadJournalEntries(): Promise<JournalEntry[]> {
  const rows = await getPrismaClient().journalEntryRecord.findMany({ orderBy: { postedAt: "asc" } });
  return rows.map((row) => {
    if (row.currency !== "NGN") {
      throw new Error(`[VMNL-DURABILITY] journal entry '${row.id}' has currency '${row.currency}'`);
    }
    return {
      id: row.id,
      reference: row.reference,
      description: row.description,
      lines: asArray<JournalLine>(row.lines),
      totalDebitNgn: Number(row.totalDebitNgn),
      totalCreditNgn: Number(row.totalCreditNgn),
      isBalanced: row.isBalanced,
      postedAt: row.postedAt,
    };
  });
}

// ---------------------------------------------------------------------------
// SponsorBindingRecord + SponsorFulfillmentRecord — §32 entitlement bindings
// ---------------------------------------------------------------------------

export async function persistSponsorBinding(binding: SponsorBinding): Promise<void> {
  const state = {
    entitlementId: binding.entitlementId,
    programmeCode: binding.programmeCode,
    daypart: binding.daypart,
    assetType: binding.assetType,
    assetId: binding.assetId,
    assetDurationSeconds: binding.assetDurationSeconds,
    requiredPlacementsPerEpisode: binding.requiredPlacementsPerEpisode,
    fulfilledPlacements: binding.fulfilledPlacements,
    updatedAt: new Date(),
  };
  await getPrismaClient().sponsorBindingRecord.upsert({
    where: { id: binding.id },
    create: { id: binding.id, createdAt: new Date(), ...state },
    update: state,
  });
}

export async function loadSponsorBindings(): Promise<SponsorBinding[]> {
  const rows = await getPrismaClient().sponsorBindingRecord.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    entitlementId: row.entitlementId,
    programmeCode: row.programmeCode,
    daypart: row.daypart,
    assetType: row.assetType as SponsorBinding["assetType"],
    assetId: row.assetId,
    assetDurationSeconds: row.assetDurationSeconds,
    requiredPlacementsPerEpisode: row.requiredPlacementsPerEpisode,
    fulfilledPlacements: row.fulfilledPlacements,
  }));
}

/**
 * Fulfilment evidence is addressed by the (binding, episode, as-run) triple the
 * engine appends it under; the derived report fields are stored beside it so a
 * restarted desk shows the same completion percentage it showed before.
 */
export async function persistSponsorFulfillment(record: SponsorBindingFulfillment): Promise<void> {
  const id = `${record.bindingId}:${record.asRunLogId}`;
  const state = {
    bindingId: record.bindingId,
    episodeCode: record.episodeCode,
    asRunLogId: record.asRunLogId,
    airedAt: record.airedAt,
    placementsFulfilled: record.placementsFulfilled,
    placementsRequired: record.placementsRequired,
    isComplete: record.isComplete,
    fulfillmentPercent: record.fulfillmentPercent,
    updatedAt: new Date(),
  };
  await getPrismaClient().sponsorFulfillmentRecord.upsert({
    where: { id },
    create: { id, ...state },
    update: state,
  });
}

export async function loadSponsorFulfillments(): Promise<SponsorBindingFulfillment[]> {
  const rows = await getPrismaClient().sponsorFulfillmentRecord.findMany({ orderBy: { airedAt: "asc" } });
  return rows.map((row) => ({
    bindingId: row.bindingId,
    episodeCode: row.episodeCode,
    asRunLogId: row.asRunLogId,
    airedAt: row.airedAt,
    placementsFulfilled: row.placementsFulfilled,
    placementsRequired: row.placementsRequired,
    isComplete: row.isComplete,
    fulfillmentPercent: row.fulfillmentPercent,
  }));
}

/**
 * TSK-19 — the durable provider-event replay claim (AUD-07 remainder).
 *
 * Not a hydrating store: this table is the authority, not a projection of a
 * process-memory index, so there is no `load…()` pair. The claim is two-phase.
 * Phase one is a single INSERT under `@@unique([provider, eventId])`, which is
 * the whole transaction — two instances (or one instance before and after a
 * restart) racing for the same event id get exactly one winner, with no
 * read-then-write window. A loser sees the unique violation, and then one
 * conditional UPDATE: it may only take over a claim whose `ingestedAt` is still
 * null, i.e. an attempt that claimed the event and died before reaching the
 * engine. Refusing that retry would strand a genuine payment permanently;
 * refusing it is safe only because ingestion itself is idempotent per
 * transaction id, so the takeover re-delivers rather than double-credits.
 */
export async function claimProviderEvent(provider: string, eventId: string): Promise<boolean> {
  const now = new Date();
  const id = `${provider}:${eventId}`;
  try {
    await getPrismaClient().providerEventClaim.create({
      data: { id, provider, eventId, claimedAt: now, updatedAt: now },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const taken = await getPrismaClient().providerEventClaim.updateMany({
        where: { id, ingestedAt: null },
        data: { claimedAt: now, updatedAt: now },
      });
      return taken.count === 1;
    }
    throw err;
  }
}

/**
 * Phase two: stamp the claim once the event has reached the engine. From here
 * on every retry of this event id is a true replay and is refused.
 */
export async function markProviderEventIngested(provider: string, eventId: string): Promise<void> {
  const now = new Date();
  await getPrismaClient().providerEventClaim.updateMany({
    where: { provider, eventId, ingestedAt: null },
    data: { ingestedAt: now, updatedAt: now },
  });
}

/**
 * Releases a claim for an event that never reached the engine, so the
 * provider's retry — the mechanism that exists precisely to recover a dropped
 * delivery — is not refused as a duplicate. An already-ingested claim is left
 * in place: this is a rollback of a failed attempt, never an un-ingest.
 */
export async function releaseProviderEventClaim(provider: string, eventId: string): Promise<void> {
  await getPrismaClient().providerEventClaim.deleteMany({
    where: { provider, eventId, ingestedAt: null },
  });
}

// ---------------------------------------------------------------------------
// SalesDealRecord — TSK-60 box 3, the Quote-to-Cash portfolio
// ---------------------------------------------------------------------------

/**
 * The client portal projects every counterparty's deals, so the whole row
 * travels: stage, both approval stamps, and the four money counters. Optional
 * fields are written as SQL NULL and read back as *absent* rather than
 * undefined-valued keys, so a hydrated deal is indistinguishable from one the
 * engine just created.
 *
 * The counters are stored, never re-derived at load. A deal whose cash was
 * collected before a restart must still show the same recognised revenue; if
 * hydration recomputed it from the stage, an in-flight deal would silently
 * change value across a restart.
 */
export async function persistSalesDeal(deal: SalesDeal): Promise<void> {
  const state = {
    clientOrgId: deal.clientOrgId,
    dealName: deal.dealName,
    stage: deal.stage,
    totalContractValueNgn: deal.totalContractValueNgn,
    salesLeadId: deal.salesLeadId,
    salesLeadApprovedAt: deal.salesLeadApprovedAt ?? null,
    financeApproverId: deal.financeApproverId ?? null,
    financeApprovedAt: deal.financeApprovedAt ?? null,
    depositAmountNgn: deal.depositAmountNgn,
    depositPaidAt: deal.depositPaidAt ?? null,
    invoicedAmountNgn: deal.invoicedAmountNgn,
    cashCollectedAmountNgn: deal.cashCollectedAmountNgn,
    recognizedRevenueNgn: deal.recognizedRevenueNgn,
    proofOfPerformanceVerified: deal.proofOfPerformanceVerified,
    proofDocumentUrl: deal.proofDocumentUrl ?? null,
    updatedAt: new Date(),
  };
  await getPrismaClient().salesDealRecord.upsert({
    where: { id: deal.id },
    create: { id: deal.id, createdAt: deal.createdAt, ...state },
    update: state,
  });
}

export async function loadSalesDeals(): Promise<SalesDeal[]> {
  const rows = await getPrismaClient().salesDealRecord.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    clientOrgId: row.clientOrgId,
    dealName: row.dealName,
    stage: row.stage as SalesStage,
    // Decimal columns arrive as Prisma decimals; the domain computes on numbers.
    totalContractValueNgn: Number(row.totalContractValueNgn),
    salesLeadId: row.salesLeadId,
    ...(row.salesLeadApprovedAt ? { salesLeadApprovedAt: row.salesLeadApprovedAt } : {}),
    ...(row.financeApproverId ? { financeApproverId: row.financeApproverId } : {}),
    ...(row.financeApprovedAt ? { financeApprovedAt: row.financeApprovedAt } : {}),
    depositAmountNgn: Number(row.depositAmountNgn),
    ...(row.depositPaidAt ? { depositPaidAt: row.depositPaidAt } : {}),
    invoicedAmountNgn: Number(row.invoicedAmountNgn),
    cashCollectedAmountNgn: Number(row.cashCollectedAmountNgn),
    recognizedRevenueNgn: Number(row.recognizedRevenueNgn),
    proofOfPerformanceVerified: row.proofOfPerformanceVerified,
    ...(row.proofDocumentUrl ? { proofDocumentUrl: row.proofDocumentUrl } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

// ---------------------------------------------------------------------------
// AuditLog — the tamper-evident ledger (TSK-18)
// ---------------------------------------------------------------------------

/** Entries a durable read answers when the caller asked for no window (TSK-18). */
export const DEFAULT_AUDIT_READ_WINDOW = 1000;

/**
 * The durable half of an audit entry. `hashPayload` is the exact byte string
 * that was hashed: a jsonb column does not preserve key order, so re-serialising
 * `changes` does not reproduce the original payload. Measured on the development
 * database before this change, only 668 of 1783 durable rows could be recomputed
 * from their own columns — the rest were evidence the verifier could not check.
 * Storing the hashed bytes makes every new row independently verifiable.
 */
export interface AuditLogWrite {
  id: string;
  userId: string | null;
  tenantId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  changes: Record<string, unknown> | null;
  entryHash: string;
  previousHash: string;
  hashPayload: string;
}

export function persistAuditLogEntry(write: AuditLogWrite): Promise<unknown> {
  return getPrismaClient().auditLog.create({
    data: {
      id: write.id,
      userId: write.userId,
      tenantId: write.tenantId,
      action: write.action,
      resource: write.resource,
      resourceId: write.resourceId,
      ipAddress: write.ipAddress,
      userAgent: write.userAgent,
      // Event time, not write time: the ledger is ordered by when the action
      // happened. Measured before this change, 0 of 1783 durable rows had a
      // `createdAt` equal to the entry's own timestamp.
      createdAt: write.timestamp,
      changesJson: {
        changes: write.changes ?? null,
        auditEntryHash: write.entryHash,
        auditPreviousHash: write.previousHash,
        auditTimestamp: write.timestamp.toISOString(),
        auditHashPayload: write.hashPayload,
      } as unknown as Prisma.InputJsonObject,
    },
  });
}

export interface AuditLogQuery {
  resource?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}

/**
 * The ledger row exactly as the column layout stores it. The read stays here
 * because this file owns the columns; the domain shape (`AuditLogEntry`) is
 * rebuilt by the audit module, which owns the chain.
 */
export interface AuditLogRow {
  id: string;
  userId: string | null;
  tenantId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  changesJson: unknown;
}

/**
 * Reads ledger rows back out of Postgres, oldest first. Rows written before
 * `createdAt` carried the event time are ordered by write time; the payload's
 * `auditTimestamp` is what the ledger reports as the instant of the action.
 */
export async function loadAuditLogRows(query: AuditLogQuery): Promise<AuditLogRow[]> {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.resource) where.resource = query.resource;
  if (query.resourceId) where.resourceId = query.resourceId;
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;

  const rows = await getPrismaClient().auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit && query.limit > 0 ? query.limit : DEFAULT_AUDIT_READ_WINDOW,
  });

  return rows.reverse().map((row): AuditLogRow => ({
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    action: row.action,
    resource: row.resource,
    resourceId: row.resourceId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    changesJson: row.changesJson,
  }));
}
