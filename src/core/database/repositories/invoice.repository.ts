/**
 * VMNL Enterprise Master Contract & Invoice/Settlement Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §18 (7-Way Financial Separation)
 */

import { getPrismaClient, checkDatabaseConnection } from "../index.js";
import { handleRepoError } from "../repository-mode.js";
import { validateSettlementInvariants, type SettlementEntity } from "../../domain/types.js";
import { createRepositoryListPage, normalizeRepositoryListOptions, paginateMemoryRows, RepositoryListOptions, RepositoryListPage } from "./pagination.js";

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
  source?: "DB" | "MEMORY";
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
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceRepository {
  private contracts = new Map<string, ContractRecord>();
  private settlements = new Map<string, SettlementRecord>();

  public getInMemoryContractsCount(): number {
    return this.contracts.size;
  }

  public getInMemorySettlementsCount(): number {
    return this.settlements.size;
  }

  /**
   * TSK-59: the 7-way separation rule is enforced here, on the only writer of the canonical
   * `Settlement` columns, before anything reaches Postgres or the in-process index. A refusal
   * writes nothing.
   */
  private assertSettlementInvariants(record: SettlementRecord): void {
    const check = validateSettlementInvariants(record as SettlementEntity);
    if (check.valid) return;
    throw new Error(
      `[VMNL-SETTLEMENT-INVARIANT] Settlement '${record.settlementNumber}' violates 7-Way Financial Separation: ${check.errors.join("; ")}`
    );
  }

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
        const created = await client.contract.upsert({
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

        return {
          id: created.id,
          contractNumber: created.contractNumber,
          title: created.title,
          organisationId: created.organisationId ?? undefined,
          personId: created.personId ?? undefined,
          status: created.status,
          contractValue: Number(created.contractValue || 0),
          currency: created.currency,
          startDate: created.startDate,
          endDate: created.endDate,
          signedAt: created.signedAt ?? undefined,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err: any) {
        await handleRepoError("contract", "write", err);
      }
    }

    const memoryRecord: ContractRecord = { ...record, source: "MEMORY" };
    this.contracts.set(record.contractNumber, memoryRecord);
    return memoryRecord;
  }

  public async getContract(contractNumber: string): Promise<ContractRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.contract.findUnique({
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
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err: any) {
        await handleRepoError("contract", "read", err);
      }
    }
    const mem = this.contracts.get(contractNumber);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  public async listContracts(status?: string, page: RepositoryListOptions = {}): Promise<RepositoryListPage<ContractRecord>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.contract.findMany({
          where: {
            ...(status ? { status: status as any } : {}),
            ...(paging.after ? { contractNumber: { gt: paging.after } } : {}),
          },
          orderBy: { contractNumber: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((c) => ({
            id: c.id,
            contractNumber: c.contractNumber,
            title: c.title,
            organisationId: c.organisationId ?? undefined,
            personId: c.personId ?? undefined,
            status: c.status,
            contractValue: Number(c.contractValue || 0),
            currency: c.currency,
            startDate: c.startDate,
            endDate: c.endDate,
            signedAt: c.signedAt ?? undefined,
            source: "DB" as const,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })), (contract) => contract.contractNumber, paging.limit);
        }
      } catch (err: any) {
        await handleRepoError("contract", "list", err);
      }
    }

    let list = Array.from(this.contracts.values()).map((c) => ({ ...c, source: "MEMORY" as const }));
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return paginateMemoryRows(list, (contract) => contract.contractNumber, paging);
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
    this.assertSettlementInvariants(record);

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const created = await client.settlement.upsert({
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

        return {
          id: created.id,
          settlementNumber: created.settlementNumber,
          contractId: created.contractId ?? undefined,
          status: created.status,
          contractValue: Number(created.contractValue || 0),
          gmvAmount: Number(created.gmvAmount || 0),
          invoicedAmount: Number(created.invoicedAmount || 0),
          recognizedAmount: Number(created.recognizedAmount || 0),
          cashCollectedAmount: Number(created.cashCollectedAmount || 0),
          talentPayableAmount: Number(created.talentPayableAmount || 0),
          partnerShareAmount: Number(created.partnerShareAmount || 0),
          currency: created.currency,
          reconciledAt: created.reconciledAt ?? undefined,
          source: "DB",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err: any) {
        await handleRepoError("settlement", "write", err);
      }
    }

    const memoryRecord: SettlementRecord = { ...record, source: "MEMORY" };
    this.settlements.set(record.settlementNumber, memoryRecord);
    return memoryRecord;
  }

  public async getSettlement(settlementNumber: string): Promise<SettlementRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.settlement.findUnique({
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
            source: "DB",
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          };
        }
      } catch (err: any) {
        await handleRepoError("settlement", "read", err);
      }
    }
    const mem = this.settlements.get(settlementNumber);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  public async updateSettlementStatus(
    settlementNumber: string,
    status: "PENDING" | "RECONCILED" | "DISPUTED" | "PAID",
    reconciledAt?: Date
  ): Promise<SettlementRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      // TSK-59: moving a settlement to RECONCILED or PAID is the moment the canonical model says its
      // seven columns must be internally consistent, so the stored row is guarded before the
      // transition is written — outside the try, because an invariant refusal is a caller error, not
      // a repository outage for `handleRepoError` to downgrade. A status change never moves money.
      const existing = await this.getSettlement(settlementNumber);
      if (existing) this.assertSettlementInvariants(existing);
      try {
        const client = getPrismaClient();
        const updated = await client.settlement.update({
          where: { settlementNumber },
          data: {
            status,
            reconciledAt: reconciledAt ?? (status === "RECONCILED" ? new Date() : undefined),
          },
        });
        return {
          id: updated.id,
          settlementNumber: updated.settlementNumber,
          contractId: updated.contractId ?? undefined,
          status: updated.status,
          contractValue: Number(updated.contractValue || 0),
          gmvAmount: Number(updated.gmvAmount || 0),
          invoicedAmount: Number(updated.invoicedAmount || 0),
          recognizedAmount: Number(updated.recognizedAmount || 0),
          cashCollectedAmount: Number(updated.cashCollectedAmount || 0),
          talentPayableAmount: Number(updated.talentPayableAmount || 0),
          partnerShareAmount: Number(updated.partnerShareAmount || 0),
          currency: updated.currency,
          reconciledAt: updated.reconciledAt ?? undefined,
          source: "DB",
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (err: any) {
        await handleRepoError("settlement", "update", err);
      }
    }

    const mem = this.settlements.get(settlementNumber);
    if (!mem) return null;
    this.assertSettlementInvariants(mem);
    const updatedMem: SettlementRecord = {
      ...mem,
      status,
      reconciledAt: reconciledAt ?? (status === "RECONCILED" ? new Date() : mem.reconciledAt),
      updatedAt: new Date(),
      source: "MEMORY",
    };
    this.settlements.set(settlementNumber, updatedMem);
    return updatedMem;
  }

  public async listSettlements(status?: string, page: RepositoryListOptions = {}): Promise<RepositoryListPage<SettlementRecord>> {
    const paging = normalizeRepositoryListOptions(page);
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.settlement.findMany({
          where: {
            ...(status ? { status: status as any } : {}),
            ...(paging.after ? { settlementNumber: { gt: paging.after } } : {}),
          },
          orderBy: { settlementNumber: "asc" },
          take: paging.limit + 1,
        });
        if (found.length > 0) {
          return createRepositoryListPage(found.map((s) => ({
            id: s.id,
            settlementNumber: s.settlementNumber,
            contractId: s.contractId ?? undefined,
            status: s.status,
            contractValue: Number(s.contractValue || 0),
            gmvAmount: Number(s.gmvAmount || 0),
            invoicedAmount: Number(s.invoicedAmount || 0),
            recognizedAmount: Number(s.recognizedAmount || 0),
            cashCollectedAmount: Number(s.cashCollectedAmount || 0),
            talentPayableAmount: Number(s.talentPayableAmount || 0),
            partnerShareAmount: Number(s.partnerShareAmount || 0),
            currency: s.currency,
            reconciledAt: s.reconciledAt ?? undefined,
            source: "DB" as const,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          })), (settlement) => settlement.settlementNumber, paging.limit);
        }
      } catch (err: any) {
        await handleRepoError("settlement", "list", err);
      }
    }

    let list = Array.from(this.settlements.values()).map((s) => ({ ...s, source: "MEMORY" as const }));
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return paginateMemoryRows(list, (settlement) => settlement.settlementNumber, paging);
  }
}
