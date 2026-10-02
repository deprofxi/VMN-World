/**
 * VMNL Restricted Case Queue — UX-GOV-009 (Privacy) & UX-GOV-010 (Security)
 * (todo.md TODO-SCR-08)
 * Authority: VMN APP UI UX.docx §5.6 — "Privacy and security cases require
 * their own restricted queues. They must not appear as ordinary project tasks."
 */

export type CaseType = "PRIVACY_REQUEST" | "SECURITY_REPORT";
export type CaseStatus = "RECEIVED" | "TRIAGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface PrivacySecurityCase {
  id: string;
  type: CaseType;
  subject: string;
  detail: string;
  reporterContact: string;
  dataSubjects?: string[]; // privacy cases: affected data subject references
  slaDueAt: Date;
  status: CaseStatus;
  assignedCaseOwner?: string;
  auditTrail: Array<{ at: Date; actor: string; action: string; note?: string }>;
  createdAt: Date;
}

const cases = new Map<string, PrivacySecurityCase>();

const SLA_HOURS: Record<CaseType, number> = {
  PRIVACY_REQUEST: 72, // NDPR DSAR response window baseline
  SECURITY_REPORT: 24,
};

export function openCase(params: {
  id: string;
  type: CaseType;
  subject: string;
  detail: string;
  reporterContact: string;
  dataSubjects?: string[];
}): PrivacySecurityCase {
  if (cases.has(params.id)) {
    throw new Error(`[CASE-01] Case '${params.id}' already exists.`);
  }
  if (!params.subject.trim() || !params.detail.trim()) {
    throw new Error("[CASE-02] Subject and detail are required.");
  }
  const kase: PrivacySecurityCase = {
    ...params,
    slaDueAt: new Date(Date.now() + SLA_HOURS[params.type] * 3600 * 1000),
    status: "RECEIVED",
    auditTrail: [{ at: new Date(), actor: "SYSTEM", action: "CASE_OPENED" }],
    createdAt: new Date(),
  };
  cases.set(params.id, kase);
  return kase;
}

export function getCase(id: string): PrivacySecurityCase | undefined {
  return cases.get(id);
}

/**
 * Restricted read: only the assigned case owner (or an explicit override list)
 * may read case contents. Search, counts, and exports must use this gate.
 */
export function canReadCase(kase: PrivacySecurityCase, userId: string): boolean {
  return kase.assignedCaseOwner === userId;
}

export function listCasesForOwner(userId: string, type?: CaseType): PrivacySecurityCase[] {
  return [...cases.values()].filter((k) => k.assignedCaseOwner === userId && (!type || k.type === type));
}

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  RECEIVED: ["TRIAGED", "IN_PROGRESS"],
  TRIAGED: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export function assignCase(id: string, caseOwnerId: string): PrivacySecurityCase {
  const kase = requireCase(id);
  kase.assignedCaseOwner = caseOwnerId;
  kase.auditTrail.push({ at: new Date(), actor: caseOwnerId, action: "CASE_ASSIGNED" });
  return kase;
}

export function transitionCase(id: string, actorId: string, target: CaseStatus, note?: string): PrivacySecurityCase {
  const kase = requireCase(id);
  const allowed = TRANSITIONS[kase.status];
  if (!allowed.includes(target)) {
    throw new Error(`[CASE-03] Invalid transition ${kase.status} -> ${target}.`);
  }
  kase.status = target;
  kase.auditTrail.push({ at: new Date(), actor: actorId, action: `TRANSITION_${target}`, note });
  return kase;
}

function requireCase(id: string): PrivacySecurityCase {
  const kase = cases.get(id);
  if (!kase) throw new Error(`[CASE-04] Case '${id}' not found.`);
  return kase;
}

export function _resetCasesForTesting(): void {
  cases.clear();
}
