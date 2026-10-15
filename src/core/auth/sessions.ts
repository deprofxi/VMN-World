/**
 * VMNL Session Registry & Notification Preferences — UX-SYS-013 / UX-SYS-012
 * (todo.md TODO-SEC-03, TODO-SEC-05)
 *
 * Tracks issued session tokens per user so "Active Sessions" reflects real
 * sessions and revocation actually revokes. Persistence is pluggable; default
 * is in-memory for sandbox, with a Prisma-backed adapter when the database is
 * available.
 */

import crypto from "crypto";
import type { KeyValueAdapter } from "../cache/index.js";
import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import { loadSessionRecords, persistSessionRecord } from "../database/repositories/release-critical.repository.js";

let sessionKvAdapter: KeyValueAdapter | null = null;

/** Hook to connect session storage to a shared Redis/KeyValue adapter */
export function useKeyValueAdapterForSessions(adapter: KeyValueAdapter): void {
  sessionKvAdapter = adapter;
}

export function getSessionKeyValueAdapter(): KeyValueAdapter | null {
  return sessionKvAdapter;
}

export interface SessionRecord {
  tokenId: string; // sha-256 of the token, never the raw token
  userId: string;
  email: string;
  deviceLabel: string;
  ipAddress: string;
  createdAt: Date;
  lastSeenAt: Date;
  revokedAt?: Date;
}

function tokenIdFor(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex").substring(0, 32);
}

const sessionsByUser = new Map<string, Map<string, SessionRecord>>();

/**
 * TSK-17: the session registry is durable. The KV adapter (Redis, optional) only
 * shares revocation between processes while it is up; `SessionRecord` rows are
 * what make "Active Sessions" and a revocation survive a restart, so a revoked
 * session cannot come back to life by being re-hydrated.
 *
 * `tokenId` is the sha-256 digest, never the raw token — the row is no more
 * sensitive than the registry it projects.
 */
registerDurableStore<SessionRecord>("sessionRecord", persistSessionRecord);

function stageSession(record: SessionRecord): void {
  stageDurableWrite<SessionRecord>({
    store: "sessionRecord",
    key: record.tokenId,
    payload: record,
    rollback: () => {
      const userSessions = sessionsByUser.get(record.userId);
      userSessions?.delete(record.tokenId);
      if (userSessions && userSessions.size === 0) sessionsByUser.delete(record.userId);
      revokedTokenIds.delete(record.tokenId);
    },
  });
}

/** Boot hydration (TSK-17): rebuild the registry, including revocation state. */
export async function refreshSessionIndex(): Promise<{ sessions: number; revoked: number }> {
  const loaded = await loadSessionRecords();
  sessionsByUser.clear();
  revokedTokenIds.clear();
  let revoked = 0;
  for (const record of loaded) {
    const userSessions = sessionsByUser.get(record.userId) || new Map<string, SessionRecord>();
    userSessions.set(record.tokenId, record);
    sessionsByUser.set(record.userId, userSessions);
    if (record.revokedAt) {
      revokedTokenIds.add(record.tokenId);
      revoked += 1;
    }
  }
  return { sessions: loaded.length, revoked };
}

export function registerSession(params: {
  token: string;
  userId: string;
  email: string;
  deviceLabel?: string;
  ipAddress?: string;
}): SessionRecord {
  const id = tokenIdFor(params.token);
  const record: SessionRecord = {
    tokenId: id,
    userId: params.userId,
    email: params.email,
    deviceLabel: params.deviceLabel || "Web Workstation",
    ipAddress: params.ipAddress || "127.0.0.1",
    createdAt: new Date(),
    lastSeenAt: new Date(),
  };
  const userSessions = sessionsByUser.get(params.userId) || new Map<string, SessionRecord>();
  userSessions.set(id, record);
  sessionsByUser.set(params.userId, userSessions);
  stageSession(record);
  if (sessionKvAdapter) {
    void sessionKvAdapter.set(`session:${id}`, JSON.stringify(record), 86400 * 1000).catch(() => {});
  }
  return record;
}

export function listSessions(userId: string): SessionRecord[] {
  const userSessions = sessionsByUser.get(userId);
  if (!userSessions) return [];
  return [...userSessions.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * TODO-SCR-13: registry-wide session listing for the read-only Access &
 * Membership Administration console. Returns every session record across all
 * users, newest first. Token ids are sha-256 digests — raw tokens are never
 * retained or exposed.
 */
export function listAllSessions(): SessionRecord[] {
  const all: SessionRecord[] = [];
  for (const userSessions of sessionsByUser.values()) {
    all.push(...userSessions.values());
  }
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function touchSession(token: string, userId: string): void {
  const id = tokenIdFor(token);
  const record = sessionsByUser.get(userId)?.get(id);
  if (record) {
    record.lastSeenAt = new Date();
    stageSession(record);
    if (sessionKvAdapter) {
      void sessionKvAdapter.set(`session:${id}`, JSON.stringify(record), 86400 * 1000).catch(() => {});
    }
  }
}

/**
 * Revokes a session both in the registry and in the token revocation store.
 * Returns the revoked session id, or null if unknown.
 */
export function revokeSessionById(userId: string, tokenId: string): string | null {
  const userSessions = sessionsByUser.get(userId);
  const record = userSessions?.get(tokenId);
  if (!record) return null;
  if (!record.revokedAt) {
    record.revokedAt = new Date();
  }
  revokedTokenIds.add(record.tokenId);
  stageSession(record);
  if (sessionKvAdapter) {
    void sessionKvAdapter.del(`session:${tokenId}`).catch(() => {});
    void sessionKvAdapter.set(`revoked:${tokenId}`, "1", 86400 * 1000).catch(() => {});
  }
  // The row is retained (marked revoked) so the Active Sessions surface can
  // show revocation history; raw tokens are never retained.
  return tokenId;
}

export function revokeAllSessions(userId: string): number {
  const userSessions = sessionsByUser.get(userId);
  if (!userSessions) return 0;
  const activeIds = [...userSessions.values()].filter((s) => !s.revokedAt).map((s) => s.tokenId);
  for (const id of activeIds) {
    revokeSessionById(userId, id);
  }
  return activeIds.length;
}

/**
 * Revoked-token-id lookup used by verifySessionToken to reject revoked
 * sessions even when the raw token is unknown to the registry.
 */
const revokedTokenIds = new Set<string>();

export function markTokenIdRevoked(tokenId: string): void {
  revokedTokenIds.add(tokenId);
  if (sessionKvAdapter) {
    void sessionKvAdapter.set(`revoked:${tokenId}`, "1", 86400 * 1000).catch(() => {});
  }
}

export function isTokenIdRevoked(tokenId: string): boolean {
  return revokedTokenIds.has(tokenId);
}

/**
 * TSK-27 (CA-26): consult the shared revocation records for a token id. The sync
 * `isTokenIdRevoked` cannot reach the adapter, so the request entry point awaits
 * this before any authorization decision: a revocation issued by another
 * instance lands in the local set here, and every later sync check on the same
 * request rejects the token too. Returns the revocation state. A shared-backend
 * failure is NOT a revocation — the signature check still governs.
 */
export async function primeRevocationFromSharedStore(tokenId: string): Promise<boolean> {
  if (revokedTokenIds.has(tokenId)) return true;
  if (!sessionKvAdapter) return false;
  try {
    if (await sessionKvAdapter.get(`revoked:${tokenId}`)) {
      revokedTokenIds.add(tokenId);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function computeSessionId(token: string): string {
  return tokenIdFor(token);
}

export function _resetSessionsForTesting(): void {
  sessionsByUser.clear();
  revokedTokenIds.clear();
  sessionKvAdapter = null;
}

// ---------------------------------------------------------------------------
// UX-SYS-012: Notification preferences (persisted; honored by dispatch)
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  /** Operational escalation categories the user is opted into. */
  categories: {
    playoutDisruption: boolean;
    rightsBlocks: boolean;
    financeApprovals: boolean;
    admissionsDecisions: boolean;
  };
  updatedAt: Date;
}

const preferencesByUser = new Map<string, NotificationPreferences>();

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  sms: false,
  inApp: true,
  categories: {
    playoutDisruption: true,
    rightsBlocks: true,
    financeApprovals: true,
    admissionsDecisions: false,
  },
  updatedAt: new Date(),
};

export function getNotificationPreferences(userId: string): NotificationPreferences {
  return preferencesByUser.get(userId) || { ...DEFAULT_PREFS, categories: { ...DEFAULT_PREFS.categories } };
}

export function saveNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences(userId);
  const updated: NotificationPreferences = {
    email: prefs.email ?? current.email,
    sms: prefs.sms ?? current.sms,
    inApp: prefs.inApp ?? current.inApp,
    categories: { ...current.categories, ...(prefs.categories || {}) },
    updatedAt: new Date(),
  };
  preferencesByUser.set(userId, updated);
  return updated;
}

export function _resetPreferencesForTesting(): void {
  preferencesByUser.clear();
}

// ---------------------------------------------------------------------------
// UX-SYS-005: First-use profile persistence (TODO-SEC-04 remainder).
// Profile saves are stored server-side and re-verified on resume, so the
// form POST persists instead of blindly redirecting.
// ---------------------------------------------------------------------------

export interface FirstUseProfile {
  userId: string;
  displayName: string;
  dutyPhone: string;
  timezone: string;
  completedAt: Date;
}

const firstUseProfiles = new Map<string, FirstUseProfile>();

/** Saves (or re-saves) the operator's first-use profile. */
export function saveFirstUseProfile(
  userId: string,
  profile: { displayName: string; dutyPhone: string; timezone: string }
): FirstUseProfile {
  const displayName = profile.displayName.trim();
  const dutyPhone = profile.dutyPhone.trim();
  if (!displayName) throw new Error("[PROFILE-01] Display name is required.");
  if (!/^\+?[0-9 ()-]{7,20}$/.test(dutyPhone)) {
    throw new Error("[PROFILE-02] Duty phone must be a valid phone number.");
  }
  const allowedTimezones = ["Africa/Lagos", "UTC", "Europe/London"];
  if (!allowedTimezones.includes(profile.timezone)) {
    throw new Error("[PROFILE-03] Unsupported operational timezone.");
  }
  const saved: FirstUseProfile = {
    userId,
    displayName,
    dutyPhone,
    timezone: profile.timezone,
    completedAt: new Date(),
  };
  firstUseProfiles.set(userId, saved);
  return saved;
}

/** Re-verifies a saved profile on resume; undefined when never completed. */
export function getFirstUseProfile(userId: string): FirstUseProfile | undefined {
  return firstUseProfiles.get(userId);
}

export function _resetProfilesForTesting(): void {
  firstUseProfiles.clear();
}

// ---------------------------------------------------------------------------
// UX-HUB-003: In-app notification inbox (per-user records; SCR-10)
// ---------------------------------------------------------------------------

export interface InboxNotificationRecord {
  id: string;
  userId: string;
  category: "PLAYOUT_DISRUPTION" | "RIGHTS_BLOCK" | "FINANCE_APPROVAL" | "ADMISSIONS_DECISION" | "SYSTEM";
  title: string;
  body: string;
  createdAt: Date;
  readAt?: Date | null;
  route?: string;
}

const inboxByUser = new Map<string, InboxNotificationRecord[]>();

/**
 * Delivers an in-app notification IF the user's preferences allow the
 * category (TODO-SEC-05 end-to-end honoring). Returns the record when
 * delivered, or null when suppressed by preference.
 */
export function deliverInAppNotification(params: {
  userId: string;
  category: InboxNotificationRecord["category"];
  title: string;
  body: string;
  route?: string;
}): InboxNotificationRecord | null {
  const prefs = getNotificationPreferences(params.userId);
  const categoryAllowed: Record<string, boolean> = {
    PLAYOUT_DISRUPTION: prefs.categories.playoutDisruption,
    RIGHTS_BLOCK: prefs.categories.rightsBlocks,
    FINANCE_APPROVAL: prefs.categories.financeApprovals,
    ADMISSIONS_DECISION: prefs.categories.admissionsDecisions,
    SYSTEM: true,
  };
  if (!categoryAllowed[params.category]) {
    return null; // Opted out — suppression honored end-to-end.
  }
  const record: InboxNotificationRecord = {
    id: `ntf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date(),
    readAt: null,
    ...params,
  };
  const list = inboxByUser.get(params.userId) || [];
  list.unshift(record);
  inboxByUser.set(params.userId, list);
  return record;
}

export function listInAppNotifications(userId: string): InboxNotificationRecord[] {
  return [...(inboxByUser.get(userId) || [])].map((n) => ({ ...n }));
}

export function markInAppNotificationsRead(userId: string): number {
  const list = inboxByUser.get(userId) || [];
  let count = 0;
  for (const n of list) {
    if (!n.readAt) {
      n.readAt = new Date();
      count += 1;
    }
  }
  return count;
}

export function _resetInboxForTesting(): void {
  inboxByUser.clear();
}
