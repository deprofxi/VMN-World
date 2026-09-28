/**
 * VMNL Enterprise Master Contract & Invoice/Settlement Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §18 (7-Way Financial Separation)
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";

export interface ContractRecord {
  id: string;
  contractNumber: string;
  title: string;
  organisationId?: string;
  personId?: string;
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "SIGNED" | "EXPIRED" | "TERMINATED";
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementRecord {
  id: string;
  settlementNumber: string;
  contractId?: string;
  status: "PENDING" | "RECONCILED" | "DISPUTED" | "PAID";
  // Mandatory 7-Way Financial Separation
  contractValue: number;
  gmvAmount: number;
  invoicedAmount: number;
  recognizedAmount: number;
  cashCollectedAmount: number;
  talentPayableAmount: number;
  partnerShareAmount: number;
  currency: string;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceRepository {
  private contracts = new Map<string, ContractRecord>();
  private settlements = new Map<string, SettlementRecord>();

  public async createContract(data: {
    id?: string;
    contractNumber: string;
    title: string;
    organisationId?: string;
    personId?: string;
    status?: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "SIGNED" | "EXPIRED" | "TERMINATED";
    contractValue: number;
    currency?: string;
    startDate: Date;
    endDate: Date;
    signedAt?: Date;
  }): Promise<ContractRecord> {
    const id = data.id || `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: ContractRecord = {
      id,
      contractNumber: data.contractNumber,
      title: data.title,
      organisationId: data.organisationId,
      personId: data.personId,
      status: data.status || "DRAFT",
      contractValue: data.contractValue,
      currency: data.currency || "NGN",
      startDate: data.startDate,
      endDate: data.endDate,
      signedAt: data.signedAt,
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).contract.upsert({
          where: { contractNumber: data.contractNumber },
          update: {
            title: record.title,
            status: record.status,
            contractValue: record.contractValue,
            currency: record.currency,
            startDate: record.startDate,
            endDate: record.endDate,
            signedAt: record.signedAt,
          },
          create: {
            id: record.id,
            contractNumber: record.contractNumber,
            title: record.title,
            organisationId: record.organisationId,
            personId: record.personId,
            status: record.status,
            contractValue: record.contractValue,
            currency: record.currency,
            startDate: record.startDate,
            endDate: record.endDate,
            signedAt: record.signedAt,
          },
        });
      } catch {
        // Fall back
      }
    }

    this.contracts.set(record.contractNumber, record);
    return record;
  }

  public async getContract(contractNumber: string): Promise<ContractRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).contract.findUnique({
          where: { contractNumber },
        });
        if (found) {
          return {
            id: found.id,
            contractNumber: found.contractNumber,
            title: found.title,
            organisationId: found.organisationId ?? undefined,
            personId: found.personId ?? undefined,
            status: found.status,
            contractValue: Number(found.contractValue || 0),
            currency: found.currency,
            startDate: found.startDate,
            endDate: found.endDate,
            signedAt: found.signedAt ?? undefined,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back
      }
    }
    return this.contracts.get(contractNumber) || null;
  }

  public async listContracts(status?: string): Promise<ContractRecord[]> {
    let list = Array.from(this.contracts.values());
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return list;
  }

  public async createSettlement(data: {
    id?: string;
    settlementNumber: string;
    contractId?: string;
    status?: "PENDING" | "RECONCILED" | "DISPUTED" | "PAID";
    contractValue: number;
    gmvAmount: number;
    invoicedAmount: number;
    recognizedAmount: number;
    cashCollectedAmount: number;
    talentPayableAmount: number;
    partnerShareAmount: number;
    currency?: string;
    reconciledAt?: Date;
  }): Promise<SettlementRecord> {
    const id = data.id || `set-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const record: SettlementRecord = {
      id,
      settlementNumber: data.settlementNumber,
      contractId: data.contractId,
      status: data.status || "PENDING",
      contractValue: data.contractValue,
      gmvAmount: data.gmvAmount,
      invoicedAmount: data.invoicedAmount,
      recognizedAmount: data.recognizedAmount,
      cashCollectedAmount: data.cashCollectedAmount,
      talentPayableAmount: data.talentPayableAmount,
      partnerShareAmount: data.partnerShareAmount,
      currency: data.currency || "NGN",
      reconciledAt: data.reconciledAt,
      createdAt: now,
      updatedAt: now,
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).settlement.upsert({
          where: { settlementNumber: data.settlementNumber },
          update: {
            status: record.status,
            contractValue: record.contractValue,
            gmvAmount: record.gmvAmount,
            invoicedAmount: record.invoicedAmount,
            recognizedAmount: record.recognizedAmount,
            cashCollectedAmount: record.cashCollectedAmount,
            talentPayableAmount: record.talentPayableAmount,
            partnerShareAmount: record.partnerShareAmount,
            reconciledAt: record.reconciledAt,
          },
          create: {
            id: record.id,
            settlementNumber: record.settlementNumber,
            contractId: record.contractId,
            status: record.status,
            contractValue: record.contractValue,
            gmvAmount: record.gmvAmount,
            invoicedAmount: record.invoicedAmount,
            recognizedAmount: record.recognizedAmount,
            cashCollectedAmount: record.cashCollectedAmount,
            talentPayableAmount: record.talentPayableAmount,
            partnerShareAmount: record.partnerShareAmount,
            currency: record.currency,
            reconciledAt: record.reconciledAt,
          },
        });
      } catch {
        // Fall back
      }
    }

    this.settlements.set(record.settlementNumber, record);
    return record;
  }

  public async getSettlement(settlementNumber: string): Promise<SettlementRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await (client as any).settlement.findUnique({
          where: { settlementNumber },
        });
        if (found) {
          return {
            id: found.id,
            settlementNumber: found.settlementNumber,
            contractId: found.contractId ?? undefined,
            status: found.status,
            contractValue: Number(found.contractValue || 0),
            gmvAmount: Number(found.gmvAmount || 0),
            invoicedAmount: Number(found.invoicedAmount || 0),
            recognizedAmount: Number(found.recognizedAmount || 0),
            cashCollectedAmount: Number(found.cashCollectedAmount || 0),
            talentPayableAmount: Number(found.talentPayableAmount || 0),
            partnerShareAmount: Number(found.partnerShareAmount || 0),
            currency: found.currency,
            reconciledAt: found.reconciledAt ?? undefined,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch {
        // Fall back
      }
    }
    return this.settlements.get(settlementNumber) || null;
  }

  public async updateSettlementStatus(
    settlementNumber: string,
    status: "PENDING" | "RECONCILED" | "DISPUTED" | "PAID",
    reconciledAt?: Date
  ): Promise<SettlementRecord | null> {
    const existing = await this.getSettlement(settlementNumber);
    if (!existing) return null;

    const updated: SettlementRecord = {
      ...existing,
      status,
      reconciledAt: reconciledAt ?? (status === "RECONCILED" ? new Date() : existing.reconciledAt),
      updatedAt: new Date(),
    };

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        await (client as any).settlement.update({
          where: { settlementNumber },
          data: {
            status,
            reconciledAt: updated.reconciledAt,
          },
        });
      } catch {
        // Fall back
      }
    }

    this.settlements.set(settlementNumber, updated);
    return updated;
  }

  public async listSettlements(status?: string): Promise<SettlementRecord[]> {
    let list = Array.from(this.settlements.values());
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return list;
  }
}
