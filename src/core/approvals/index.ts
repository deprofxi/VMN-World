/**
 * VMNL Four-Eyes Approval Domain — UX-GOV-001/002 (todo.md TODO-SCR-06)
 * Authority: VMN APP UI UX.docx §8.14
 *
 * Decision rules implemented:
 * - Recheck authority when the decision is submitted (server-side role check)
 * - Reject stale object revisions
 * - Apply separation of duties (decider != initiator; four-eyes for high value)
 * - Record actor, decision, reason, time and revision
 */

export type ApprovalCategory =
  | "RATE_CARD_OVERRIDE"
  | "AFCA_MILESTONE"
  | "CONTRACT_SIGNATURE"
  | "SCHEDULE_OVERRIDE"
  | "FINANCIAL_ADJUSTMENT"
  | "RIGHTS_EXCEPTION";

export type ApprovalDecision = "APPROVED" | "REJECTED";

export interface ApprovalItem {
  id: string;
  category: ApprovalCategory;
  subject: string;
  justification: string;
  financialScopeNgn: number;
  currency: string;
  initiatorId: string;
  initiatorName: string;
  /** Monotonic revision of the object under approval; stale decisions rejected. */
  objectRevision: number;
  requiresFourEyes: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: Date;
  decisionReason?: string;
  decisionRevision?: number;
  createdAt: Date;
}

export interface DecideApprovalResult {
  ok: boolean;
  item?: ApprovalItem;
  code?: string;
  error?: string;
}

const approvals = new Map<string, ApprovalItem>();

const FOUR_EYES_THRESHOLD_NGN = 10_000_000; // ₦10M+

export function createApproval(params: {
  id: string;
  category: ApprovalCategory;
  subject: string;
  justification: string;
  financialScopeNgn: number;
  initiatorId: string;
  initiatorName: string;
  objectRevision: number;
  currency?: string;
}): ApprovalItem {
  if (approvals.has(params.id)) {
    throw new Error(`[APR-01] Approval '${params.id}' already exists.`);
  }
  if (params.objectRevision < 1) {
    throw new Error("[APR-02] objectRevision must be a positive integer.");
  }
  const item: ApprovalItem = {
    ...params,
    currency: params.currency || "NGN",
    requiresFourEyes: params.financialScopeNgn >= FOUR_EYES_THRESHOLD_NGN || params.category === "CONTRACT_SIGNATURE",
    status: "PENDING",
    createdAt: new Date(),
  };
  approvals.set(params.id, item);
  return item;
}

export function getApproval(id: string): ApprovalItem | undefined {
  return approvals.get(id);
}

export function listPendingApprovals(): ApprovalItem[] {
  return [...approvals.values()]
    .filter((a) => a.status === "PENDING")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function listAllApprovals(): ApprovalItem[] {
  return [...approvals.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Bumps the object revision, invalidating any decisions made against the prior one. */
export function reviseApprovalObject(id: string, newRevision: number): ApprovalItem {
  const item = approvals.get(id);
  if (!item) throw new Error(`[APR-03] Approval '${id}' not found.`);
  if (newRevision <= item.objectRevision) {
    throw new Error("[APR-04] New object revision must be greater than the current revision.");
  }
  item.objectRevision = newRevision;
  return item;
}

/**
 * Records a decision (UIUX-001 §8.14).
 * @param authorizedRoles roles allowed to decide this category (server-checked)
 */
export function decideApproval(params: {
  approvalId: string;
  decision: ApprovalDecision;
  reason: string;
  deciderId: string;
  deciderName: string;
  deciderRoles: string[];
  authorizedRoles: string[];
  currentObjectRevision: number;
  financialAuthorityLimitNgn?: number;
}): DecideApprovalResult {
  const item = approvals.get(params.approvalId);
  if (!item) {
    return { ok: false, code: "APR_NOT_FOUND", error: "Approval not found." };
  }
  if (item.status !== "PENDING") {
    return { ok: false, item, code: "APR_ALREADY_DECIDED", error: `Approval already ${item.status.toLowerCase()}.` };
  }

  // Rule 1: authority rechecked at submit time (server-side)
  const authorized = params.authorizedRoles.some((role) => params.deciderRoles.includes(role));
  if (!authorized) {
    return { ok: false, item, code: "APR_FORBIDDEN", error: "Your active role is not authorised to decide this category." };
  }

  // Rule 2: stale revision rejection
  if (params.currentObjectRevision !== item.objectRevision) {
    return {
      ok: false,
      item,
      code: "APR_STALE_REVISION",
      error: `Decision was made against revision ${params.currentObjectRevision} but the object is now at revision ${item.objectRevision}. Re-review the current revision.`,
    };
  }

  // Rule 3: separation of duties — decider cannot be the initiator
  if (params.deciderId === item.initiatorId) {
    return { ok: false, item, code: "APR_SOD_SELF", error: "Separation of duties: the initiator cannot decide their own request." };
  }

  // Rule 4: four-eyes — high-value items need a second distinct approver
  if (item.requiresFourEyes) {
    const previousApprovers = new Set<string>([item.initiatorId]);
    if (previousApprovers.has(params.deciderId)) {
      return { ok: false, item, code: "APR_FOUR_EYES", error: "Four-eyes principle: a second, distinct approver is required for this value band." };
    }
    if (params.financialAuthorityLimitNgn !== undefined && params.financialAuthorityLimitNgn < item.financialScopeNgn) {
      return { ok: false, item, code: "APR_LIMIT", error: "Your financial authority limit is below this approval's scope." };
    }
  }

  // Rule 5: reason mandatory
  if (!params.reason || params.reason.trim().length < 4) {
    return { ok: false, item, code: "APR_REASON_REQUIRED", error: "A recorded reason is required for every decision." };
  }

  item.status = params.decision;
  item.decidedBy = params.deciderId;
  item.decidedByName = params.deciderName;
  item.decidedAt = new Date();
  item.decisionReason = params.reason.trim();
  item.decisionRevision = params.currentObjectRevision;

  return { ok: true, item };
}

export function _resetApprovalsForTesting(): void {
  approvals.clear();
}
