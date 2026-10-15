/**
 * VMNL Cross-Domain Work Graph — UX-HUB-001 My Work (todo.md TODO-SCR-11)
 * Aggregates tasks from real domain queues (approvals, admissions, enquiries,
 * content review, cases) with access-scoped counts and no duplicates.
 * Authority: VMN APP UI UX.docx §8.5
 */

import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import {
  loadIssueRecords,
  loadRiskRecords,
  persistIssueRecord,
  persistRiskRecord,
} from "../database/repositories/release-critical.repository.js";

export interface WorkTask {
  id: string;
  domain: "APPROVALS" | "ADMISSIONS" | "ENQUIRIES" | "CONTENT" | "CASES" | "RIGHTS" | "FINANCE";
  title: string;
  relatedRecordId: string;
  context: string;
  state: string;
  assignedOwner?: string;
  dueAt?: Date;
  reasonActionNeeded: string;
  route: string;
  priority: 1 | 2 | 3; // 1 = material blocker / decision awaiting user
}

export interface WorkTaskSource {
  listTasks(userId: string, roles: string[]): WorkTask[];
}

const sources: WorkTaskSource[] = [];

export function registerWorkTaskSource(source: WorkTaskSource): void {
  sources.push(source);
}

/**
 * Aggregates tasks across all registered domain sources for a user.
 * - Access scoping is delegated to each source (they receive userId + roles).
 * - De-duplication by `id` guarantees the same underlying task never appears
 *   twice across workspace and global queues (UIUX-001 §8.5 rule).
 * - Ordering: blockers → decisions → due/overdue → returned → followed.
 */
export function aggregateMyWork(userId: string, roles: string[], now: Date = new Date()): WorkTask[] {
  const byId = new Map<string, WorkTask>();
  for (const source of sources) {
    for (const task of source.listTasks(userId, roles)) {
      if (!byId.has(task.id)) {
        byId.set(task.id, task);
      }
    }
  }

  const tasks = [...byId.values()];
  return tasks.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aOverdue = a.dueAt ? a.dueAt.getTime() < now.getTime() : false;
    const bOverdue = b.dueAt ? b.dueAt.getTime() < now.getTime() : false;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
    return a.title.localeCompare(b.title);
  });
}

export function _resetWorkSourcesForTesting(): void {
  sources.length = 0;
}

// ---------------------------------------------------------------------------
// UX-HUB-002: Authorised Search — server-side scoped search over indexed records
// ---------------------------------------------------------------------------

export interface SearchRecord {
  kind: string;
  id: string;
  title: string;
  snippet: string;
  /** Role prefixes allowed to see this record at all (empty = any authenticated). */
  requiredRoles: string[];
  tenantId?: string;
  route: string;
}

const searchIndex: SearchRecord[] = [];

export function indexSearchRecord(record: SearchRecord): void {
  const existing = searchIndex.findIndex((r) => r.kind === record.kind && r.id === record.id);
  if (existing >= 0) {
    searchIndex[existing] = record;
  } else {
    searchIndex.push(record);
  }
}

export function authorisedSearch(params: {
  query: string;
  userId: string;
  roles: string[];
  tenantId?: string;
  limit?: number;
}): Array<SearchRecord & { score: number }> {
  const q = params.query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: Array<SearchRecord & { score: number }> = [];
  for (const record of searchIndex) {
    // Access scoping: role gate
    if (record.requiredRoles.length > 0 && !record.requiredRoles.some((r) => params.roles.includes(r))) {
      continue;
    }
    // Tenant gate (searches never cross tenant boundaries)
    if (record.tenantId && params.tenantId && record.tenantId !== params.tenantId) {
      continue;
    }
    const haystack = `${record.title} ${record.snippet} ${record.kind}`.toLowerCase();
    let matches = 0;
    for (const term of terms) {
      if (haystack.includes(term)) matches += 1;
    }
    if (matches > 0) {
      results.push({ ...record, score: matches / terms.length });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, params.limit ?? 20);
}

export function _resetSearchIndexForTesting(): void {
  searchIndex.length = 0;
}

// ---------------------------------------------------------------------------
// UX-REC-004 / UX-REC-005: Risk register & issue tracker domains
// ---------------------------------------------------------------------------

export interface RiskRecord {
  id: string;
  title: string;
  category: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  owner: string;
  status: "OPEN" | "MITIGATING" | "CLOSED";
  reviewDueAt: Date;
  createdAt: Date;
}

export interface IssueRecord {
  id: string;
  title: string;
  description: string;
  severity: "S1" | "S2" | "S3" | "S4";
  raisedBy: string;
  assignedTo?: string;
  status: "OPEN" | "ACKNOWLEDGED" | "FIX_IN_PROGRESS" | "RESOLVED";
  linkedRiskId?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const risks = new Map<string, RiskRecord>();
const issues = new Map<string, IssueRecord>();

/**
 * TSK-17: the risk and issue registers are durable. `linkedRiskId` stays an id
 * reference — the tables carry no foreign key, so `createIssue` keeps enforcing
 * the linkage in code ([ISSUE-02]) rather than depending on row order.
 */
registerDurableStore<RiskRecord>("riskRecord", persistRiskRecord);
registerDurableStore<IssueRecord>("issueRecord", persistIssueRecord);

function stageRisk(risk: RiskRecord): void {
  stageDurableWrite<RiskRecord>({
    store: "riskRecord",
    key: risk.id,
    payload: risk,
    rollback: () => {
      risks.delete(risk.id);
    },
  });
}

function stageIssue(issue: IssueRecord): void {
  stageDurableWrite<IssueRecord>({
    store: "issueRecord",
    key: issue.id,
    payload: issue,
    rollback: () => {
      issues.delete(issue.id);
    },
  });
}

/** Boot hydration (TSK-17): rebuild both registers from durable rows. */
export async function refreshRiskIssueIndex(): Promise<{ risks: number; issues: number }> {
  const [loadedRisks, loadedIssues] = await Promise.all([loadRiskRecords(), loadIssueRecords()]);
  risks.clear();
  issues.clear();
  for (const risk of loadedRisks) risks.set(risk.id, risk);
  for (const issue of loadedIssues) issues.set(issue.id, issue);
  return { risks: risks.size, issues: issues.size };
}

export function createRisk(params: {
  id: string;
  title: string;
  category: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  owner: string;
  reviewDueAt: Date;
}): RiskRecord {
  if (risks.has(params.id)) throw new Error(`[RISK-01] Risk '${params.id}' exists.`);
  const risk: RiskRecord = { ...params, status: "OPEN", createdAt: new Date() };
  risks.set(params.id, risk);
  stageRisk(risk);
  return risk;
}

export function listRisks(): RiskRecord[] {
  return [...risks.values()].sort((a, b) => a.reviewDueAt.getTime() - b.reviewDueAt.getTime());
}

export function getRisk(id: string): RiskRecord | undefined {
  return risks.get(id);
}

export function createIssue(params: {
  id: string;
  title: string;
  description: string;
  severity: "S1" | "S2" | "S3" | "S4";
  raisedBy: string;
  linkedRiskId?: string;
}): IssueRecord {
  if (issues.has(params.id)) throw new Error(`[ISSUE-01] Issue '${params.id}' exists.`);
  if (params.linkedRiskId && !risks.has(params.linkedRiskId)) {
    throw new Error(`[ISSUE-02] Linked risk '${params.linkedRiskId}' not found.`);
  }
  const issue: IssueRecord = { ...params, status: "OPEN", createdAt: new Date() };
  issues.set(params.id, issue);
  stageIssue(issue);
  return issue;
}

export function transitionIssue(id: string, target: IssueRecord["status"], actor: string): IssueRecord {
  const issue = issues.get(id);
  if (!issue) throw new Error(`[ISSUE-03] Issue '${id}' not found.`);
  const flow: IssueRecord["status"][] = ["OPEN", "ACKNOWLEDGED", "FIX_IN_PROGRESS", "RESOLVED"];
  const currentIdx = flow.indexOf(issue.status);
  const targetIdx = flow.indexOf(target);
  if (targetIdx !== currentIdx + 1) {
    throw new Error(`[ISSUE-04] Invalid transition ${issue.status} -> ${target}.`);
  }
  issue.status = target;
  if (target === "RESOLVED") {
    issue.resolvedAt = new Date();
    issue.assignedTo = issue.assignedTo || actor;
  } else {
    issue.assignedTo = issue.assignedTo || actor;
  }
  stageIssue(issue);
  return issue;
}

export function listIssues(): IssueRecord[] {
  return [...issues.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function _resetRiskIssueForTesting(): void {
  risks.clear();
  issues.clear();
}
