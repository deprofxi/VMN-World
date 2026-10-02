/**
 * VMNL Enterprise Commercial Campaign Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §19
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";
import { handleRepoError } from "../repository-mode.js";

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
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignRepository {
  private inMemoryStore = new Map<string, CommercialCampaignRecord>();

  public getInMemoryCount(): number {
    return this.inMemoryStore.size;
  }

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
        const created = await client.commercialCampaign.upsert({
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

        return {
          id: created.id,
          campaignCode: created.campaignCode,
          clientName: created.clientName,
          brand: created.brand,
          bookedSpots: created.bookedSpots,
          totalContractValueNgn: Number(created.totalContractValueNgn || 0),
          status: created.status as CommercialCampaignRecord["status"],
          startDate: created.startDate,
          endDate: created.endDate,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err: any) {
        await handleRepoError("commercialCampaign", "write", err);
      }
    }

    const memoryRecord: CommercialCampaignRecord = { ...record, source: "MEMORY" };
    this.inMemoryStore.set(record.campaignCode, memoryRecord);
    return memoryRecord;
  }

  public async getCampaignByCode(campaignCode: string): Promise<CommercialCampaignRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.commercialCampaign.findUnique({
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
            status: found.status as CommercialCampaignRecord["status"],
            startDate: found.startDate,
            endDate: found.endDate,
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err: any) {
        await handleRepoError("commercialCampaign", "read", err);
      }
    }

    const mem = this.inMemoryStore.get(campaignCode);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  public async listCampaigns(status?: string): Promise<CommercialCampaignRecord[]> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.commercialCampaign.findMany({
          where: status ? { status: status as any } : undefined,
        });
        if (found.length > 0) {
          return found.map((r) => ({
            id: r.id,
            campaignCode: r.campaignCode,
            clientName: r.clientName,
            brand: r.brand,
            bookedSpots: r.bookedSpots,
            totalContractValueNgn: Number(r.totalContractValueNgn || 0),
            status: r.status as CommercialCampaignRecord["status"],
            startDate: r.startDate,
            endDate: r.endDate,
            source: "DB",
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }));
        }
      } catch (err: any) {
        await handleRepoError("commercialCampaign", "list", err);
      }
    }

    let list = Array.from(this.inMemoryStore.values()).map((c) => ({ ...c, source: "MEMORY" as const }));
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return list;
  }

  public async updateStatus(
    campaignCode: string,
    status: "BOOKED" | "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED"
  ): Promise<CommercialCampaignRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const updated = await client.commercialCampaign.update({
          where: { campaignCode },
          data: { status },
        });
        return {
          id: updated.id,
          campaignCode: updated.campaignCode,
          clientName: updated.clientName,
          brand: updated.brand,
          bookedSpots: updated.bookedSpots,
          totalContractValueNgn: Number(updated.totalContractValueNgn || 0),
          status: updated.status as CommercialCampaignRecord["status"],
          startDate: updated.startDate,
          endDate: updated.endDate,
          source: "DB",
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (err: any) {
        await handleRepoError("commercialCampaign", "update", err);
      }
    }

    const mem = this.inMemoryStore.get(campaignCode);
    if (!mem) return null;
    const updatedMem: CommercialCampaignRecord = {
      ...mem,
      status,
      updatedAt: new Date(),
      source: "MEMORY",
    };
    this.inMemoryStore.set(campaignCode, updatedMem);
    return updatedMem;
  }

  public async deleteCampaign(campaignCode: string): Promise<boolean> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await client.commercialCampaign.delete({ where: { campaignCode } });
      } catch (err: any) {
        await handleRepoError("commercialCampaign", "delete", err);
      }
    }
    return this.inMemoryStore.delete(campaignCode);
  }
}
