/**
 * VMNL Enterprise Commercial Campaign Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §19
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";

export interface CommercialCampaignRecord {
  id: string;
  campaignCode: string;
  clientName: string;
  brand: string;
  bookedSpots: number;
  totalContractValueNgn: number;
  status: "BOOKED" | "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignRepository {
  private inMemoryStore = new Map<string, CommercialCampaignRecord>();

  public async createCampaign(data: {
    id?: string;
    campaignCode: string;
    clientName: string;
    brand: string;
    bookedSpots: number;
    totalContractValueNgn: number;
    status?: "BOOKED" | "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
    startDate: Date;
    endDate: Date;
  }): Promise<CommercialCampaignRecord> {
    const id = data.id || `cmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: CommercialCampaignRecord = {
      id,
      campaignCode: data.campaignCode,
      clientName: data.clientName,
      brand: data.brand,
      bookedSpots: data.bookedSpots,
      totalContractValueNgn: data.totalContractValueNgn,
      status: data.status || "BOOKED",
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).commercialCampaign.upsert({
          where: { campaignCode: data.campaignCode },
          update: {
            clientName: record.clientName,
            brand: record.brand,
            bookedSpots: record.bookedSpots,
            totalContractValueNgn: record.totalContractValueNgn,
            status: record.status,
            startDate: record.startDate,
            endDate: record.endDate,
          },
          create: {
            id: record.id,
            campaignCode: record.campaignCode,
            clientName: record.clientName,
            brand: record.brand,
            bookedSpots: record.bookedSpots,
            totalContractValueNgn: record.totalContractValueNgn,
            status: record.status,
            startDate: record.startDate,
            endDate: record.endDate,
          },
        });
      } catch {
        // Fall back to memory
      }
    }

    this.inMemoryStore.set(record.campaignCode, record);
    return record;
  }

  public async getCampaignByCode(campaignCode: string): Promise<CommercialCampaignRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).commercialCampaign.findUnique({
          where: { campaignCode },
        });
        if (found) {
          return {
            id: found.id,
            campaignCode: found.campaignCode,
            clientName: found.clientName,
            brand: found.brand,
            bookedSpots: found.bookedSpots,
            totalContractValueNgn: Number(found.totalContractValueNgn || 0),
            status: found.status,
            startDate: found.startDate,
            endDate: found.endDate,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    return this.inMemoryStore.get(campaignCode) || null;
  }

  public async listCampaigns(status?: string): Promise<CommercialCampaignRecord[]> {
    let list = Array.from(this.inMemoryStore.values());
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return list;
  }

  public async updateStatus(
    campaignCode: string,
    status: "BOOKED" | "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED"
  ): Promise<CommercialCampaignRecord | null> {
    const existing = await this.getCampaignByCode(campaignCode);
    if (!existing) return null;

    const updated: CommercialCampaignRecord = {
      ...existing,
      status,
      updatedAt: new Date(),
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).commercialCampaign.update({
          where: { campaignCode },
          data: { status },
        });
      } catch {
        // Fall back to memory
      }
    }

    this.inMemoryStore.set(campaignCode, updated);
    return updated;
  }

  public async deleteCampaign(campaignCode: string): Promise<boolean> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).commercialCampaign.delete({ where: { campaignCode } });
      } catch {
        // Fall back
      }
    }
    return this.inMemoryStore.delete(campaignCode);
  }
}
