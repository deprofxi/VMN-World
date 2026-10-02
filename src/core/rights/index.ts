/**
 * VMNL Rights Review Request Lifecycle — UX-GOV-004 (todo.md TODO-GVR-04)
 * Authority: UIUX-CCPP-001 §2.2 UI-RL1-R09 — "Request creation leaves the
 * rights block intact; resolution requires authoritative evidence."
 *
 * This is the REQUEST lifecycle only. It never clears rights and never
 * overrides the rights gate. Resolution references authoritative evidence;
 * the rights result changes only through the approved source/evaluation path.
 */

export type RequestStatus = "PREPARED" | "RECEIVED" | "ASSIGNED" | "EVIDENCE_REVIEW" | "RESOLVED_BLOCK_RETAINED" | "RESOLVED_CLEARED_BY_SOURCE" | "REFERRED";

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
  status: RequestStatus;
  resolutionNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const requests = new Map<string, RightsReviewRequest>();

export function createRightsReviewRequest(params: {
  id: string;
  affectedRecordId: string;
  recordRevision: string;
  intendedUse: string;
  observedBlocker: string;
  requestReason: string;
  evidenceReferences?: string[];
  requesterId: string;
  receivingOwner: string;
}): RightsReviewRequest {
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
  return request;
}

export function getRightsReviewRequest(id: string): RightsReviewRequest | undefined {
  return requests.get(id);
}

const FLOW: Record<RequestStatus, RequestStatus[]> = {
  PREPARED: ["RECEIVED"],
  RECEIVED: ["ASSIGNED", "REFERRED"],
  ASSIGNED: ["EVIDENCE_REVIEW", "REFERRED"],
  EVIDENCE_REVIEW: ["RESOLVED_BLOCK_RETAINED", "RESOLVED_CLEARED_BY_SOURCE", "REFERRED"],
  RESOLVED_BLOCK_RETAINED: [],
  RESOLVED_CLEARED_BY_SOURCE: [],
  REFERRED: [],
};

export function transitionRequest(id: string, target: RequestStatus, actor: string, resolutionNote?: string): RightsReviewRequest {
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
    request.resolvedAt = new Date();
  }
  return request;
}

export function listOpenRequests(): RightsReviewRequest[] {
  return [...requests.values()].filter((r) => !r.resolvedAt);
}

export function _resetRightsRequestsForTesting(): void {
  requests.clear();
}
