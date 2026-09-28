/**
 * VMNL Enterprise Talent Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §23
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";

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
  createdAt: Date;
  updatedAt: Date;
}

export class TalentRepository {
  private inMemoryStore = new Map<string, TalentProfileRecord>();

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
        await (client as any).talentProfile.upsert({
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
      } catch {
        // Fall back to memory
      }
    }

    this.inMemoryStore.set(record.id, record);
    return record;
  }

  public async getTalentById(id: string): Promise<TalentProfileRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).talentProfile.findUnique({
          where: { id },
        });
        if (found) {
          return {
            id: found.id,
            personId: found.personId,
            stageName: found.stageName ?? undefined,
            tier: found.tier,
            bio: found.bio ?? undefined,
            skills: Array.isArray(found.skills) ? found.skills : [],
            rateCardAmount: Number(found.rateCardAmount || 0),
            rateCardCurrency: found.rateCardCurrency,
            verificationStatus: found.verificationStatus,
            verifiedAt: found.verifiedAt ?? undefined,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back to memory
      }
    }
    return this.inMemoryStore.get(id) || null;
  }

  public async getTalentByPersonId(personId: string): Promise<TalentProfileRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).talentProfile.findUnique({
          where: { personId },
        });
        if (found) {
          return {
            id: found.id,
            personId: found.personId,
            stageName: found.stageName ?? undefined,
            tier: found.tier,
            bio: found.bio ?? undefined,
            skills: Array.isArray(found.skills) ? found.skills : [],
            rateCardAmount: Number(found.rateCardAmount || 0),
            rateCardCurrency: found.rateCardCurrency,
            verificationStatus: found.verificationStatus,
            verifiedAt: found.verifiedAt ?? undefined,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    for (const record of this.inMemoryStore.values()) {
      if (record.personId === personId) {
        return record;
      }
    }
    return null;
  }

  public async listTalent(filter?: {
    tier?: "EMERGING" | "VERIFIED" | "PROFESSIONAL" | "MASTER";
    verificationStatus?: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
  }): Promise<TalentProfileRecord[]> {
    let records = Array.from(this.inMemoryStore.values());
    if (filter?.tier) {
      records = records.filter((r) => r.tier === filter.tier);
    }
    if (filter?.verificationStatus) {
      records = records.filter((r) => r.verificationStatus === filter.verificationStatus);
    }
    return records;
  }

  public async updateVerification(
    id: string,
    status: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED"
  ): Promise<TalentProfileRecord | null> {
    const existing = await this.getTalentById(id);
    if (!existing) return null;

    const updated: TalentProfileRecord = {
      ...existing,
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : existing.verifiedAt,
      updatedAt: new Date(),
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).talentProfile.update({
          where: { id },
          data: {
            verificationStatus: status,
            verifiedAt: updated.verifiedAt,
          },
        });
      } catch {
        // Fall back to memory
      }
    }

    this.inMemoryStore.set(id, updated);
    return updated;
  }

  public async deleteTalent(id: string): Promise<boolean> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).talentProfile.delete({ where: { id } });
      } catch {
        // Fall back
      }
    }
    return this.inMemoryStore.delete(id);
  }
}
