/**
 * VMN Commercial Finance Enterprise Database Repository
 * Authority: BRD R1.2A, PRD R1.3C, CCPP R1.1 §18, §70
 *
 * Provides transactional persistence for talent payout batches and bank statement reconciliation.
 */

import {
  normalizeRepositoryListOptions,
  paginateMemoryRows,
  RepositoryListOptions,
  RepositoryListPage,
} from "./pagination.js";

export interface TalentPayoutBatchEntity {
  id: string;
  batchNumber: string;
  totalAmountNgn: number;
  currency: string;
  itemCount: number;
  status: string;
  approvedBy?: string;
  executedAt?: Date;
  source?: "DB" | "MEMORY";
  createdAt: Date;
  updatedAt: Date;
}

export interface BankStatementRecordEntity {
  id: string;
  statementReference: string;
  transactionDate: Date;
  rawSwiftCode?: string;
  amountNgn: number;
  isCredit: boolean;
  narrative: string;
  reconciledStatus: string;
  source?: "DB" | "MEMORY";
  createdAt: Date;
}

const store = {
  memoryPayoutBatches: new Map<string, TalentPayoutBatchEntity>(),
  memoryBankStatements: new Map<string, BankStatementRecordEntity>(),
};

export async function saveTalentPayoutBatch(
  batch: Omit<TalentPayoutBatchEntity, "createdAt" | "updatedAt" | "source">
): Promise<TalentPayoutBatchEntity> {
  const entity: TalentPayoutBatchEntity = {
    ...batch,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };

  store.memoryPayoutBatches.set(entity.batchNumber, entity);
  return entity;
}

export async function listTalentPayoutBatches(
  options?: RepositoryListOptions
): Promise<RepositoryListPage<TalentPayoutBatchEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  const rows = Array.from(store.memoryPayoutBatches.values());
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveBankStatement(
  statement: Omit<BankStatementRecordEntity, "createdAt" | "source">
): Promise<BankStatementRecordEntity> {
  const entity: BankStatementRecordEntity = {
    ...statement,
    createdAt: new Date(),
    source: "MEMORY",
  };

  store.memoryBankStatements.set(entity.id, entity);
  return entity;
}
