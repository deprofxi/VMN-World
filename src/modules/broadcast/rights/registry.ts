/**
 * Registered Rights Record Index — TSK-10 (report.md CA-07)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45; UIUX-CCPP-001 §2.2 UI-RL1-R07.
 *
 * The clearance gate decides whether a transmission is permitted, so it must
 * read the record of account, never a copy handed over by whoever asked. Before
 * this module the only way to get a record into the gate was the request body of
 * `POST /api/v1/broadcast/rights/validate`, i.e. the caller asserted its own
 * rights facts and the server checked the arithmetic of the claim.
 *
 * This is the durable side of that: `RightsRepository` rows (Postgres in
 * `fail_closed`, the sandbox Map only when the database is unavailable) loaded
 * into an in-process index so the synchronous schedule/export paths can gate on
 * them without a per-request round-trip — the same read-time derivation pattern
 * `episode-masters.ts` uses for DAM masters.
 *
 * Honesty contract:
 * - The index is a **projection of the durable store**, not a second truth. It is
 *   rebuilt by `refreshRegisteredRightsIndex()` at boot and updated by
 *   `publishRegisteredRightsRecord()` on every write through the shared
 *   repository, so a cleared review window is visible to the next gate check.
 * - A record id that is not registered resolves to `null`. Callers must fail
 *   closed — an unregistered record is never treated as an unlimited one.
 * - Nothing here invents a window: a record only enters the store through
 *   `registerRightsRecord` (an authorised import/authoring path) or through a
 *   resolved review request.
 */

import { RightsRepository, RightsRecordWrite, StoredRightsRecord } from "../../../core/database/repositories/rights.repository.js";

const byId = new Map<string, StoredRightsRecord>();

/**
 * One shared repository instance for the rights context. Constructed with a
 * write-through hook so no writer can land a durable row that the gate cannot
 * yet see — a cleared record that only lived in the database until the next
 * boot would silently keep blocking (or silently allow) the same slot twice.
 */
export const rightsRepository = new RightsRepository({
  onWritten: (record) => publishRegisteredRightsRecord(record),
});

/** Boot hydration: rebuild the whole index from the durable store. */
export async function refreshRegisteredRightsIndex(): Promise<{ records: number }> {
  const records = await rightsRepository.listAll();
  byId.clear();
  for (const record of records) byId.set(record.id, record);
  return { records: byId.size };
}

/** Sync gate read. `null` means unregistered, which every caller must fail on. */
export function getRegisteredRightsRecord(id: string | undefined | null): StoredRightsRecord | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}

/**
 * Exclusive windows already granted on the same asset (excluding the record
 * being checked), so `EXCLUSIVE_WINDOW_CONFLICT` has real data to compare
 * against instead of an empty list supplied by the caller.
 */
export function findExclusiveWindowsForAsset(assetId: string, excludeRecordId: string): { channelCode: string; startDate: Date; expiryDate: Date; exclusivity: boolean }[] {
  return [...byId.values()]
    .filter((r) => r.exclusivity && r.assetId === assetId && r.id !== excludeRecordId)
    .map((r) => ({ channelCode: r.channelCode ?? "ALL", startDate: r.startDate, expiryDate: r.expiryDate, exclusivity: true }));
}

/**
 * The registered record to clear a slot on this asset against, or null when the
 * asset carries no rights at all. Deterministic: the widest window wins (an
 * asset with no covering record fails the gate the same way whichever record is
 * chosen), tie-broken by id so two runs pick the same record.
 */
export function findRegisteredRightsRecordForAsset(assetId: string | null | undefined): StoredRightsRecord | null {
  if (!assetId) return null;
  let best: StoredRightsRecord | null = null;
  for (const record of byId.values()) {
    if (record.assetId !== assetId) continue;
    if (!best || record.expiryDate > best.expiryDate || (record.expiryDate.getTime() === best.expiryDate.getTime() && record.id < best.id)) {
      best = record;
    }
  }
  return best;
}

/** Write path for authorised rights authoring/imports (tests, migrations, legal intake). */
export async function registerRightsRecord(data: RightsRecordWrite): Promise<StoredRightsRecord> {
  return rightsRepository.upsert(data);
}

export function publishRegisteredRightsRecord(record: StoredRightsRecord): void {
  byId.set(record.id, record);
}

export function countRegisteredRightsRecords(): number {
  return byId.size;
}

export function _resetRegisteredRightsIndexForTesting(): void {
  byId.clear();
}
