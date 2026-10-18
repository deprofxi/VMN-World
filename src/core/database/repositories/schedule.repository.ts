/**
 * VMNL Enterprise Broadcast Schedule & Playout Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §19
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";
import { handleRepoError } from "../repository-mode.js";
import { createRepositoryListPage, normalizeRepositoryListOptions, paginateMemoryRows, RepositoryListOptions, RepositoryListPage } from "./pagination.js";

export interface ProgrammeRecord {
  id: string;
  code: string;
  title: string;
  channelCode: string;
  category: string;
  targetDemographic: string;
  synopsis: string;
  totalEpisodes: number;
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export interface BroadcastEpisodeRecord {
  id: string;
  episodeCode: string;
  programmeCode: string;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  segmentCount: number;
  mediaAssetId?: string;
  complianceRating: string;
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export interface AsRunLogRecordEntity {
  id: string;
  channelCode: string;
  transmissionDate: Date;
  totalPlannedSpots: number;
  totalAiredSpots: number;
  matchedSpots: number;
  discrepancyCount: number;
  reconciliationStatus: string;
  certificateHashSha256?: string;
  source?: "DB" | "MEMORY";
  createdAt: Date;
}

export class ScheduleRepository {
  private programmes = new Map<string, ProgrammeRecord>();
  private episodes = new Map<string, BroadcastEpisodeRecord>();
  private asRuns = new Map<string, AsRunLogRecordEntity>();

  public getInMemoryProgrammesCount(): number {
    return this.programmes.size;
  }

  public async createProgramme(data: {
    id?: string;
    code: string;
    title: string;
    channelCode: string;
    category?: string;
    targetDemographic?: string;
    synopsis?: string;
    totalEpisodes?: number;
  }): Promise<ProgrammeRecord> {
    const id = data.id || `prg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: ProgrammeRecord = {
      id,
      code: data.code,
      title: data.title,
      channelCode: data.channelCode,
      category: data.category || "General",
      targetDemographic: data.targetDemographic || "18-35",
      synopsis: data.synopsis || "",
      totalEpisodes: data.totalEpisodes || 0,
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const created = await client.programme.upsert({
          where: { code: data.code },
          update: {
            title: record.title,
            channelCode: record.channelCode,
            category: record.category,
            targetDemographic: record.targetDemographic,
            synopsis: record.synopsis,
            totalEpisodes: record.totalEpisodes,
          },
          create: {
            id: record.id,
            code: record.code,
            title: record.title,
            channelCode: record.channelCode,
            category: record.category,
            targetDemographic: record.targetDemographic,
            synopsis: record.synopsis,
            totalEpisodes: record.totalEpisodes,
          },
        });

        return {
          id: created.id,
          code: created.code,
          title: created.title,
          channelCode: created.channelCode,
          category: created.category,
          targetDemographic: created.targetDemographic,
          synopsis: created.synopsis,
          totalEpisodes: created.totalEpisodes,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err) {
        await handleRepoError("programme", "write", err);
      }
    }

    const memoryRecord: ProgrammeRecord = { ...record, source: "MEMORY" };
    this.programmes.set(record.code, memoryRecord);
    return memoryRecord;
  }

  public async getProgrammeByCode(code: string): Promise<ProgrammeRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.programme.findUnique({
          where: { code },
        });
        if (found) {
          return {
            id: found.id,
            code: found.code,
            title: found.title,
            channelCode: found.channelCode,
            category: found.category,
            targetDemographic: found.targetDemographic,
            synopsis: found.synopsis,
            totalEpisodes: found.totalEpisodes,
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err) {
        await handleRepoError("programme", "read", err);
      }
    }
    const mem = this.programmes.get(code);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  public async listProgrammes(channelCode?: string, page: RepositoryListOptions = {}): Promise<RepositoryListPage<ProgrammeRecord>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.programme.findMany({
          where: {
            ...(channelCode ? { channelCode } : {}),
            ...(paging.after ? { code: { gt: paging.after } } : {}),
          },
          orderBy: { code: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((p) => ({
            id: p.id,
            code: p.code,
            title: p.title,
            channelCode: p.channelCode,
            category: p.category,
            targetDemographic: p.targetDemographic,
            synopsis: p.synopsis,
            totalEpisodes: p.totalEpisodes,
            source: "DB" as const,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })), (programme) => programme.code, paging.limit);
        }
      } catch (err) {
        await handleRepoError("programme", "list", err);
      }
    }

    let list = Array.from(this.programmes.values()).map((p) => ({ ...p, source: "MEMORY" as const }));
    if (channelCode) {
      list = list.filter((p) => p.channelCode === channelCode);
    }
    return paginateMemoryRows(list, (programme) => programme.code, paging);
  }

  public async createEpisode(data: {
    id?: string;
    episodeCode: string;
    programmeCode: string;
    episodeNumber: number;
    title: string;
    durationSeconds: number;
    segmentCount?: number;
    mediaAssetId?: string;
    complianceRating?: string;
  }): Promise<BroadcastEpisodeRecord> {
    const id = data.id || `ep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: BroadcastEpisodeRecord = {
      id,
      episodeCode: data.episodeCode,
      programmeCode: data.programmeCode,
      episodeNumber: data.episodeNumber,
      title: data.title,
      durationSeconds: data.durationSeconds,
      segmentCount: data.segmentCount || 4,
      mediaAssetId: data.mediaAssetId,
      complianceRating: data.complianceRating || "15",
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const created = await client.broadcastEpisode.upsert({
          where: { episodeCode: data.episodeCode },
          update: {
            title: record.title,
            durationSeconds: record.durationSeconds,
            segmentCount: record.segmentCount,
            complianceRating: record.complianceRating,
          },
          create: {
            id: record.id,
            episodeCode: record.episodeCode,
            programmeCode: record.programmeCode,
            episodeNumber: record.episodeNumber,
            title: record.title,
            durationSeconds: record.durationSeconds,
            segmentCount: record.segmentCount,
            mediaAssetId: record.mediaAssetId,
            complianceRating: record.complianceRating,
          },
        });

        return {
          id: created.id,
          episodeCode: created.episodeCode,
          programmeCode: created.programmeCode,
          episodeNumber: created.episodeNumber,
          title: created.title,
          durationSeconds: created.durationSeconds,
          segmentCount: created.segmentCount,
          mediaAssetId: created.mediaAssetId ?? undefined,
          complianceRating: created.complianceRating,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err) {
        await handleRepoError("broadcastEpisode", "write", err);
      }
    }

    const memoryRecord: BroadcastEpisodeRecord = { ...record, source: "MEMORY" };
    this.episodes.set(record.episodeCode, memoryRecord);
    return memoryRecord;
  }

  public async listEpisodes(programmeCode: string, page: RepositoryListOptions = {}): Promise<RepositoryListPage<BroadcastEpisodeRecord>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.broadcastEpisode.findMany({
          where: {
            programmeCode,
            ...(paging.after ? { episodeCode: { gt: paging.after } } : {}),
          },
          orderBy: { episodeCode: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((e) => ({
            id: e.id,
            episodeCode: e.episodeCode,
            programmeCode: e.programmeCode,
            episodeNumber: e.episodeNumber,
            title: e.title,
            durationSeconds: e.durationSeconds,
            segmentCount: e.segmentCount,
            mediaAssetId: e.mediaAssetId ?? undefined,
            complianceRating: e.complianceRating,
            source: "DB" as const,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          })), (episode) => episode.episodeCode, paging.limit);
        }
      } catch (err) {
        await handleRepoError("broadcastEpisode", "list", err);
      }
    }

    return paginateMemoryRows(
      Array.from(this.episodes.values())
        .filter((e) => e.programmeCode === programmeCode)
        .map((e) => ({ ...e, source: "MEMORY" as const })),
      (episode) => episode.episodeCode,
      paging
    );
  }

  public async recordAsRun(data: {
    id?: string;
    channelCode: string;
    transmissionDate: Date;
    totalPlannedSpots: number;
    totalAiredSpots: number;
    matchedSpots: number;
    discrepancyCount: number;
    reconciliationStatus: string;
    certificateHashSha256?: string;
  }): Promise<AsRunLogRecordEntity> {
    const id = data.id || `asrun-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: AsRunLogRecordEntity = {
      id,
      channelCode: data.channelCode,
      transmissionDate: data.transmissionDate,
      totalPlannedSpots: data.totalPlannedSpots,
      totalAiredSpots: data.totalAiredSpots,
      matchedSpots: data.matchedSpots,
      discrepancyCount: data.discrepancyCount,
      reconciliationStatus: data.reconciliationStatus,
      certificateHashSha256: data.certificateHashSha256,
      createdAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const created = await client.asRunLogRecord.create({
          data: {
            id: record.id,
            channelCode: record.channelCode,
            transmissionDate: record.transmissionDate,
            totalPlannedSpots: record.totalPlannedSpots,
            totalAiredSpots: record.totalAiredSpots,
            matchedSpots: record.matchedSpots,
            discrepancyCount: record.discrepancyCount,
            reconciliationStatus: record.reconciliationStatus,
            certificateHashSha256: record.certificateHashSha256,
          },
        });

        return {
          id: created.id,
          channelCode: created.channelCode,
          transmissionDate: created.transmissionDate,
          totalPlannedSpots: created.totalPlannedSpots,
          totalAiredSpots: created.totalAiredSpots,
          matchedSpots: created.matchedSpots,
          discrepancyCount: created.discrepancyCount,
          reconciliationStatus: created.reconciliationStatus,
          certificateHashSha256: created.certificateHashSha256 ?? undefined,
          source: "DB",
          createdAt: created.createdAt,
        };
      } catch (err) {
        await handleRepoError("asRunLogRecord", "write", err);
      }
    }

    const memoryRecord: AsRunLogRecordEntity = { ...record, source: "MEMORY" };
    this.asRuns.set(record.id, memoryRecord);
    return memoryRecord;
  }

  public async listAsRunRecords(channelCode?: string, page: RepositoryListOptions = {}): Promise<RepositoryListPage<AsRunLogRecordEntity>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.asRunLogRecord.findMany({
          where: {
            ...(channelCode ? { channelCode } : {}),
            ...(paging.after ? { id: { gt: paging.after } } : {}),
          },
          orderBy: { id: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((a) => ({
            id: a.id,
            channelCode: a.channelCode,
            transmissionDate: a.transmissionDate,
            totalPlannedSpots: a.totalPlannedSpots,
            totalAiredSpots: a.totalAiredSpots,
            matchedSpots: a.matchedSpots,
            discrepancyCount: a.discrepancyCount,
            reconciliationStatus: a.reconciliationStatus,
            certificateHashSha256: a.certificateHashSha256 ?? undefined,
            source: "DB" as const,
            createdAt: a.createdAt,
          })), (record) => record.id, paging.limit);
        }
      } catch (err) {
        await handleRepoError("asRunLogRecord", "list", err);
      }
    }

    let list = Array.from(this.asRuns.values()).map((a) => ({ ...a, source: "MEMORY" as const }));
    if (channelCode) {
      list = list.filter((a) => a.channelCode === channelCode);
    }
    return paginateMemoryRows(list, (record) => record.id, paging);
  }
}
