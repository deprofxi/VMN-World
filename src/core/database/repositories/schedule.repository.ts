/**
 * VMNL Enterprise Broadcast Schedule & Playout Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §19
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";

export interface ProgrammeRecord {
  id: string;
  code: string;
  title: string;
  channelCode: string;
  category: string;
  targetDemographic: string;
  synopsis: string;
  totalEpisodes: number;
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
  createdAt: Date;
}

export class ScheduleRepository {
  private programmes = new Map<string, ProgrammeRecord>();
  private episodes = new Map<string, BroadcastEpisodeRecord>();
  private asRuns = new Map<string, AsRunLogRecordEntity>();

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
        await (client as any).programme.upsert({
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
      } catch {
        // Fall back
      }
    }

    this.programmes.set(record.code, record);
    return record;
  }

  public async getProgrammeByCode(code: string): Promise<ProgrammeRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).programme.findUnique({
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
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back
      }
    }
    return this.programmes.get(code) || null;
  }

  public async listProgrammes(channelCode?: string): Promise<ProgrammeRecord[]> {
    let list = Array.from(this.programmes.values());
    if (channelCode) {
      list = list.filter((p) => p.channelCode === channelCode);
    }
    return list;
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
        await (client as any).broadcastEpisode.upsert({
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
      } catch {
        // Fall back
      }
    }

    this.episodes.set(record.episodeCode, record);
    return record;
  }

  public async listEpisodes(programmeCode: string): Promise<BroadcastEpisodeRecord[]> {
    return Array.from(this.episodes.values()).filter((e) => e.programmeCode === programmeCode);
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
        await (client as any).asRunLogRecord.create({
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
      } catch {
        // Fall back
      }
    }

    this.asRuns.set(record.id, record);
    return record;
  }

  public async listAsRunRecords(channelCode?: string): Promise<AsRunLogRecordEntity[]> {
    let list = Array.from(this.asRuns.values());
    if (channelCode) {
      list = list.filter((a) => a.channelCode === channelCode);
    }
    return list;
  }
}
