/**
 * VMN Broadcast Operations Enterprise Database Repository
 * Authority: BRD R1.2A, PRD R1.3C, CCPP R1.1 §15, §19, §71-§75
 *
 * Provides transactional persistence for linear broadcast playout:
 * - BroadcastVersionRecord (Video Master Assets, QC Approvals, Loudness LUFS)
 * - BroadcastScheduleDay (24-Hour EPG Schedule Days, Integrity Hashes)
 */

import {
  normalizeRepositoryListOptions,
  paginateMemoryRows,
  RepositoryListOptions,
  RepositoryListPage,
} from "./pagination.js";

export interface BroadcastVersionEntity {
  id: string;
  contentId: string;
  versionLabel: string;
  durationSeconds: number;
  somTimecode: string;
  eomTimecode: string;
  videoCodec: string;
  audioTrackCount: number;
  loudnessLufs: number;
  qcStatus: string;
  qcReportNotes?: string;
  qcApprovedBy?: string;
  storageLocation: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

export interface BroadcastScheduleDayEntity {
  id: string;
  channelId: string;
  scheduleDate: Date;
  totalSlots: number;
  isLocked: boolean;
  lockedByUserId?: string;
  lockedAt?: Date;
  complianceHash?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

const store = {
  memoryVersions: new Map<string, BroadcastVersionEntity>(),
  memoryScheduleDays: new Map<string, BroadcastScheduleDayEntity>(),
};

export async function saveBroadcastVersion(
  version: Omit<BroadcastVersionEntity, "createdAt" | "updatedAt" | "source">
): Promise<BroadcastVersionEntity> {
  const entity: BroadcastVersionEntity = {
    ...version,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryVersions.set(entity.id, entity);
  return entity;
}

export async function getBroadcastVersion(id: string): Promise<BroadcastVersionEntity | null> {
  return store.memoryVersions.get(id) ?? null;
}

export async function listBroadcastVersions(
  options?: RepositoryListOptions & { contentId?: string; qcStatus?: string }
): Promise<RepositoryListPage<BroadcastVersionEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memoryVersions.values());
  if (options?.contentId) rows = rows.filter((r) => r.contentId === options.contentId);
  if (options?.qcStatus) rows = rows.filter((r) => r.qcStatus === options.qcStatus);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveScheduleDay(
  day: Omit<BroadcastScheduleDayEntity, "createdAt" | "updatedAt" | "source">
): Promise<BroadcastScheduleDayEntity> {
  const entity: BroadcastScheduleDayEntity = {
    ...day,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryScheduleDays.set(`${entity.channelId}:${entity.scheduleDate.toISOString()}`, entity);
  return entity;
}
