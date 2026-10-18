/**
 * VMNL Enterprise Talent Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §23
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";
import { handleRepoError } from "../repository-mode.js";
import { createRepositoryListPage, normalizeRepositoryListOptions, paginateMemoryRows, RepositoryListOptions, RepositoryListPage } from "./pagination.js";

export interface TalentProfileRecord {
  id: string;
  personId: string;
  stageName?: string;
  tier: "EMERGING" | "VERIFIED" | "PROFESSIONAL" | "MASTER";
  bio?: string;
  skills: string[];
  rateCardAmount: number;
  rateCardCurrency: string;
  verificationStatus: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
  verifiedAt?: Date;
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export class TalentRepository {
  private inMemoryStore = new Map<string, TalentProfileRecord>();

  public getInMemoryCount(): number {
    return this.inMemoryStore.size;
  }

  public async createTalent(data: {
    id?: string;
    personId: string;
    stageName?: string;
    tier?: "EMERGING" | "VERIFIED" | "PROFESSIONAL" | "MASTER";
    bio?: string;
    skills?: string[];
    rateCardAmount?: number;
    rateCardCurrency?: string;
  }): Promise<TalentProfileRecord> {
    const id = data.id || `tal-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: TalentProfileRecord = {
      id,
      personId: data.personId,
      stageName: data.stageName,
      tier: data.tier || "EMERGING",
      bio: data.bio,
      skills: data.skills || [],
      rateCardAmount: data.rateCardAmount || 0,
      rateCardCurrency: data.rateCardCurrency || "NGN",
      verificationStatus: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const created = await client.talentProfile.upsert({
          where: { personId: data.personId },
          update: {
            stageName: record.stageName,
            tier: record.tier,
            bio: record.bio,
            skills: record.skills,
            rateCardAmount: record.rateCardAmount,
            rateCardCurrency: record.rateCardCurrency,
          },
          create: {
            id: record.id,
            personId: record.personId,
            stageName: record.stageName,
            tier: record.tier,
            bio: record.bio,
            skills: record.skills,
            rateCardAmount: record.rateCardAmount,
            rateCardCurrency: record.rateCardCurrency,
            verificationStatus: record.verificationStatus,
          },
        });

        // DB authoritative: return DB record without polluting in-memory fallback store
        return {
          id: created.id,
          personId: created.personId,
          stageName: created.stageName ?? undefined,
          tier: created.tier,
          bio: created.bio ?? undefined,
          skills: Array.isArray(created.skills) ? (created.skills as string[]) : [],
          rateCardAmount: Number(created.rateCardAmount || 0),
          rateCardCurrency: created.rateCardCurrency,
          verificationStatus: created.verificationStatus,
          verifiedAt: created.verifiedAt ?? undefined,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err) {
        await handleRepoError("talentProfile", "write", err);
      }
    }

    // Fall back to memory with source: "MEMORY"
    const memoryRecord: TalentProfileRecord = { ...record, source: "MEMORY" };
    this.inMemoryStore.set(record.id, memoryRecord);
    return memoryRecord;
  }

  public async getTalentById(id: string): Promise<TalentProfileRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.talentProfile.findUnique({
          where: { id },
        });
        if (found) {
          return {
            id: found.id,
            personId: found.personId,
            stageName: found.stageName ?? undefined,
            tier: found.tier,
            bio: found.bio ?? undefined,
            skills: Array.isArray(found.skills) ? (found.skills as string[]) : [],
            rateCardAmount: Number(found.rateCardAmount || 0),
            rateCardCurrency: found.rateCardCurrency,
            verificationStatus: found.verificationStatus,
            verifiedAt: found.verifiedAt ?? undefined,
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err) {
        await handleRepoError("talentProfile", "read", err);
      }
    }

    const mem = this.inMemoryStore.get(id);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  public async getTalentByPersonId(personId: string): Promise<TalentProfileRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.talentProfile.findUnique({
          where: { personId },
        });
        if (found) {
          return {
            id: found.id,
            personId: found.personId,
            stageName: found.stageName ?? undefined,
            tier: found.tier,
            bio: found.bio ?? undefined,
            skills: Array.isArray(found.skills) ? (found.skills as string[]) : [],
            rateCardAmount: Number(found.rateCardAmount || 0),
            rateCardCurrency: found.rateCardCurrency,
            verificationStatus: found.verificationStatus,
            verifiedAt: found.verifiedAt ?? undefined,
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err) {
        await handleRepoError("talentProfile", "read", err);
      }
    }

    for (const record of this.inMemoryStore.values()) {
      if (record.personId === personId) {
        return { ...record, source: "MEMORY" };
      }
    }
    return null;
  }

  public async listTalent(filter?: {
    tier?: "EMERGING" | "VERIFIED" | "PROFESSIONAL" | "MASTER";
    verificationStatus?: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
  }, page: RepositoryListOptions = {}): Promise<RepositoryListPage<TalentProfileRecord>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.talentProfile.findMany({
          where: {
            ...(filter?.tier ? { tier: filter.tier } : {}),
            ...(filter?.verificationStatus ? { verificationStatus: filter.verificationStatus } : {}),
            ...(paging.after ? { id: { gt: paging.after } } : {}),
          },
          orderBy: { id: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((r) => ({
            id: r.id,
            personId: r.personId,
            stageName: r.stageName ?? undefined,
            tier: r.tier,
            bio: r.bio ?? undefined,
            skills: Array.isArray(r.skills) ? (r.skills as string[]) : [],
            rateCardAmount: Number(r.rateCardAmount || 0),
            rateCardCurrency: r.rateCardCurrency,
            verificationStatus: r.verificationStatus,
            verifiedAt: r.verifiedAt ?? undefined,
            source: "DB" as const,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })), (talent) => talent.id, paging.limit);
        }
      } catch (err) {
        await handleRepoError("talentProfile", "list", err);
      }
    }

    let records = Array.from(this.inMemoryStore.values()).map((r) => ({ ...r, source: "MEMORY" as const }));
    if (filter?.tier) {
      records = records.filter((r) => r.tier === filter.tier);
    }
    if (filter?.verificationStatus) {
      records = records.filter((r) => r.verificationStatus === filter.verificationStatus);
    }
    return paginateMemoryRows(records, (talent) => talent.id, paging);
  }

  public async updateVerification(
    id: string,
    status: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED"
  ): Promise<TalentProfileRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const updated = await client.talentProfile.update({
          where: { id },
          data: {
            verificationStatus: status,
            verifiedAt: status === "VERIFIED" ? new Date() : undefined,
          },
        });
        return {
          id: updated.id,
          personId: updated.personId,
          stageName: updated.stageName ?? undefined,
          tier: updated.tier,
          bio: updated.bio ?? undefined,
          skills: Array.isArray(updated.skills) ? (updated.skills as string[]) : [],
          rateCardAmount: Number(updated.rateCardAmount || 0),
          rateCardCurrency: updated.rateCardCurrency,
          verificationStatus: updated.verificationStatus,
          verifiedAt: updated.verifiedAt ?? undefined,
          source: "DB",
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (err) {
        await handleRepoError("talentProfile", "update", err);
      }
    }

    const mem = this.inMemoryStore.get(id);
    if (!mem) return null;
    const updatedMem: TalentProfileRecord = {
      ...mem,
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : mem.verifiedAt,
      updatedAt: new Date(),
      source: "MEMORY",
    };
    this.inMemoryStore.set(id, updatedMem);
    return updatedMem;
  }

  public async deleteTalent(id: string): Promise<boolean> {
    const db = await checkDatabaseConnection();
    let dbDeleted = false;
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await client.talentProfile.delete({ where: { id } });
        dbDeleted = true;
      } catch (err) {
        await handleRepoError("talentProfile", "delete-failed", err);
      }
    }
    const memDeleted = this.inMemoryStore.delete(id);
    return dbDeleted || memDeleted;
  }
}
