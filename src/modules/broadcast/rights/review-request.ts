/**
 * VMNL Rights **Review Request** Workflow — UX-GOV-004 (J-RL1-09)
 * Authority: UIUX-CCPP-001 §2.2 UI-RL1-R09 — "Request creation leaves the rights
 * block intact; resolution requires authoritative evidence."
 *
 * TSK-14 moved this half of the rights domain out of `src/core/rights` and next
 * to the clearance gate it is routinely confused with (`src/modules/broadcast/rights`).
 * The collision was not cosmetic: with the request lifecycle living under `core/`
 * and named `rights`, the domain *looked* covered while the gate was never fed by
 * it — that is how CA-07 went unnoticed.
 *
 * What this module owns:
 * - opening, transitioning and listing review requests (tracking only);
 * - `resolveRightsReviewRequest`, the one path that may change a RightsRecord,
 *   and only with evidence references plus a recorded note.
 *
 * What it never does: clearing rights at request time, or waiving the gate. A
 * cleared review changes the *record* the gate reads (`RightsRepository`); the
 * gate then re-decides on its own terms. The §62 C-1 override interpretation
 * (HD-02) is not implemented here and no wording in this file claims it is.
 *
 * Request state is per-process (`sandbox-state`, Rule 0.4a) — the RightsRecord it
 * clears is durable. Model + migration for a durable request store is TSK-17 scope.
 */

import { RightsRepository, StoredRightsRecord } from "../../../core/database/repositories/rights.repository.js";
// The shared context repository (./registry.js, TSK-10) is the only store this path may
// write through: the clearance gate reads the records a resolution writes, so both halves
// take the same instance, and the registry's write-through hook keeps the gate's read
// index current the moment a window is cleared.
import { rightsRepository } from "./registry.js";

export type RightsReviewRequestStatus =
  | "PREPARED"
  | "RECEIVED"
  | "ASSIGNED"
  | "EVIDENCE_REVIEW"
  | "RESOLVED_BLOCK_RETAINED"
  | "RESOLVED_CLEARED_BY_SOURCE"
  | "REFERRED";

export type ReviewDecision = "RESOLVED_BLOCK_RETAINED" | "RESOLVED_CLEARED_BY_SOURCE";

export interface RightsReviewRequest {
  id: string;
  ticketId: string;
  affectedRecordId: string;
  recordRevision: string;
  intendedUse: string;
  observedBlocker: string;
  requestReason: string;
  evidenceReferences: string[];
  requesterId: string;
  receivingOwner: string;
  status: RightsReviewRequestStatus;
  resolutionNote?: string;
  resolvedBy?: string;
  clearedExpiryDate?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

const requests = new Map<string, RightsReviewRequest>();

export function openRightsReviewRequest(params: {
  id: string;
  affectedRecordId: string;
  recordRevision: string;
  intendedUse: string;
  observedBlocker: string;
  requestReason: string;
  evidenceReferences?: string[];
  requesterId: string;
  receivingOwner: string;
}): { request: RightsReviewRequest; ticketId: string } {
  if (!params.affectedRecordId.trim()) {
    throw new Error("[RRR-07] A review request must name the RightsRecord it concerns.");
  }
  if (!params.observedBlocker.trim() || !params.intendedUse.trim()) {
    throw new Error("[RRR-01] Intended use and observed blocker are required.");
  }
  if (!params.receivingOwner.trim()) {
    throw new Error("[RRR-02] A receiving owner must be identified.");
  }
  const ticketId = `RW-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const request: RightsReviewRequest = {
    ...params,
    ticketId,
    evidenceReferences: params.evidenceReferences || [],
    status: "RECEIVED",
    createdAt: new Date(),
  };
  requests.set(params.id, request);
  return { request, ticketId };
}

export function getRightsReviewRequest(id: string): RightsReviewRequest | undefined {
  return requests.get(id);
}

const FLOW: Record<RightsReviewRequestStatus, RightsReviewRequestStatus[]> = {
  PREPARED: ["RECEIVED"],
  RECEIVED: ["ASSIGNED", "REFERRED"],
  ASSIGNED: ["EVIDENCE_REVIEW", "REFERRED"],
  EVIDENCE_REVIEW: ["RESOLVED_BLOCK_RETAINED", "RESOLVED_CLEARED_BY_SOURCE", "REFERRED"],
  RESOLVED_BLOCK_RETAINED: [],
  RESOLVED_CLEARED_BY_SOURCE: [],
  REFERRED: [],
};

/** Forward transition only: RECEIVED must pass through ASSIGNED and EVIDENCE_REVIEW. */
export function transitionRightsReviewRequest(
  id: string,
  target: RightsReviewRequestStatus,
  actor: string,
  resolutionNote?: string
): RightsReviewRequest {
  const request = requests.get(id);
  if (!request) throw new Error(`[RRR-03] Request '${id}' not found.`);
  if (!FLOW[request.status].includes(target)) {
    throw new Error(`[RRR-04] Invalid transition ${request.status} -> ${target}.`);
  }
  if (target.startsWith("RESOLVED") && (!resolutionNote || resolutionNote.trim().length < 8)) {
    throw new Error("[RRR-05] Resolution requires a recorded note referencing authoritative evidence.");
  }
  request.status = target;
  if (resolutionNote) request.resolutionNote = resolutionNote;
  if (target.startsWith("RESOLVED") || target === "REFERRED") {
    request.resolvedBy = actor;
    request.resolvedAt = new Date();
  }
  return request;
}

export interface ResolveClearedResult {
  request: RightsReviewRequest;
  decision: ReviewDecision;
  rightsRecord: StoredRightsRecord | null;
  gateRechecked: boolean;
}

/**
 * Resolves a review request that has reached EVIDENCE_REVIEW.
 *
 * `RESOLVED_CLEARED_BY_SOURCE` writes the new window through the same
 * `RightsRepository` the clearance gate reads, so the next gate check sees it.
 * `RESOLVED_BLOCK_RETAINED` writes nothing: the rights block stays intact.
 */
export async function resolveRightsReviewRequest(params: {
  requestId: string;
  decision: ReviewDecision;
  resolutionNote: string;
  actor: string;
  evidenceReferences?: string[];
  clearedExpiryDate?: Date;
  repository?: RightsRepository;
}): Promise<ResolveClearedResult> {
  const request = requests.get(params.requestId);
  if (!request) throw new Error(`[RRR-03] Request '${params.requestId}' not found.`);

  const target: RightsReviewRequestStatus = params.decision;
  if (!FLOW[request.status].includes(target)) {
    throw new Error(`[RRR-04] Invalid transition ${request.status} -> ${target}.`);
  }
  if (!params.resolutionNote || params.resolutionNote.trim().length < 8) {
    throw new Error("[RRR-05] Resolution requires a recorded note referencing authoritative evidence.");
  }

  if (target === "RESOLVED_BLOCK_RETAINED") {
    transitionRightsReviewRequest(request.id, target, params.actor, params.resolutionNote);
    return { request, decision: target, rightsRecord: null, gateRechecked: false };
  }

  const evidence = (params.evidenceReferences ?? []).map((e) => e.trim()).filter(Boolean);
  if (evidence.length === 0) {
    throw new Error("[RRR-06] Clearing rights from source requires at least one authoritative evidence reference.");
  }
  if (!params.clearedExpiryDate || Number.isNaN(params.clearedExpiryDate.getTime())) {
    throw new Error("[RRR-08] A cleared review must state the authorised expiry date.");
  }

  const repository = params.repository ?? rightsRepository;
  const current = await repository.findById(request.affectedRecordId);
  if (!current) {
    throw new Error(`[RRR-09] RightsRecord '${request.affectedRecordId}' is not registered — nothing to clear.`);
  }
  if (!(params.clearedExpiryDate > current.expiryDate)) {
    throw new Error("[RRR-10] Cleared window must extend the recorded expiry date; a shorter window is a new rights record, not a review.");
  }

  const cleared = await repository.applyReviewWindow(current.id, params.clearedExpiryDate);
  transitionRightsReviewRequest(request.id, target, params.actor, params.resolutionNote);
  request.evidenceReferences = [...new Set([...request.evidenceReferences, ...evidence])];
  request.clearedExpiryDate = params.clearedExpiryDate;
  return { request, decision: target, rightsRecord: cleared, gateRechecked: true };
}

export function listOpenRightsReviewRequests(): RightsReviewRequest[] {
  return [...requests.values()].filter((r) => !r.resolvedAt);
}

export function _resetRightsReviewRequestsForTesting(): void {
  requests.clear();
}
