/**
 * Seven-Way Financial Data Separation & Double-Entry Ledger Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §42, §70 / VMNL-AZP-VMN-CCPP-001 §18
 *
 * Core Mandate:
 * Strict mathematical segregation of the 7 enterprise financial pillars:
 * 1. Contract Value (Legal committed figure)
 * 2. Gross Merchandise Value / GMV (Platform throughput)
 * 3. Invoiced Revenue (Billed receivables)
 * 4. Recognized Revenue (Earned accounting income)
 * 5. Cash Collections (Actual verified bank deposits)
 * 6. Talent Payables (Owed to cast, crew, creators)
 * 7. Partner Splits (Shares owed to carriage, syndication, co-producers)
 *
 * Invariants:
 * - GMV is NEVER conflated with company recognized revenue.
 * - Double-entry journal debits must equal credits to the kobo/cent.
 */

export interface SevenWayFinancialSnapshot {
  contractValueNgn: number;
  gmvNgn: number;
  invoicedRevenueNgn: number;
  recognizedRevenueNgn: number;
  cashCollectionsNgn: number;
  talentPayablesNgn: number;
  partnerSplitsNgn: number;
  asOfDate: Date;
}

export interface JournalLine {
  accountCode: string; // e.g. "1010_BANK_CASH", "4010_LINEAR_AD_REVENUE", "2010_TALENT_PAYABLE"
  accountName: string;
  debitNgn: number;
  creditNgn: number;
}

export interface JournalEntry {
  id: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  totalDebitNgn: number;
  totalCreditNgn: number;
  isBalanced: boolean;
  postedAt: Date;
}

export class SevenWayLedgerEngine {
  private entries: JournalEntry[] = [];
  private snapshot: SevenWayFinancialSnapshot = {
    contractValueNgn: 0,
    gmvNgn: 0,
    invoicedRevenueNgn: 0,
    recognizedRevenueNgn: 0,
    cashCollectionsNgn: 0,
    talentPayablesNgn: 0,
    partnerSplitsNgn: 0,
    asOfDate: new Date(),
  };

  public postJournalEntry(params: {
    id: string;
    reference: string;
    description: string;
    lines: JournalLine[];
  }): JournalEntry {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of params.lines) {
      if (line.debitNgn < 0 || line.creditNgn < 0) {
        throw new Error("[LEDGER-01] Debits and credits must be non-negative.");
      }
      totalDebit += line.debitNgn;
      totalCredit += line.creditNgn;
    }

    // Invariant: Debits must strictly equal Credits
    if (Math.abs(totalDebit - totalCredit) !== 0) {
      throw new Error(
        `[LEDGER-02] Unbalanced journal entry '${params.id}': Debits (${totalDebit}) do not equal Credits (${totalCredit}).`
      );
    }

    const entry: JournalEntry = {
      ...params,
      totalDebitNgn: totalDebit,
      totalCreditNgn: totalCredit,
      isBalanced: true,
      postedAt: new Date(),
    };

    this.entries.push(entry);
    return entry;
  }

  public recordPillarAmounts(amounts: Partial<Omit<SevenWayFinancialSnapshot, "asOfDate">>): SevenWayFinancialSnapshot {
    if (amounts.contractValueNgn !== undefined) this.snapshot.contractValueNgn += amounts.contractValueNgn;
    if (amounts.gmvNgn !== undefined) this.snapshot.gmvNgn += amounts.gmvNgn;
    if (amounts.invoicedRevenueNgn !== undefined) this.snapshot.invoicedRevenueNgn += amounts.invoicedRevenueNgn;
    if (amounts.recognizedRevenueNgn !== undefined) this.snapshot.recognizedRevenueNgn += amounts.recognizedRevenueNgn;
    if (amounts.cashCollectionsNgn !== undefined) this.snapshot.cashCollectionsNgn += amounts.cashCollectionsNgn;
    if (amounts.talentPayablesNgn !== undefined) this.snapshot.talentPayablesNgn += amounts.talentPayablesNgn;
    if (amounts.partnerSplitsNgn !== undefined) this.snapshot.partnerSplitsNgn += amounts.partnerSplitsNgn;

    this.snapshot.asOfDate = new Date();
    return { ...this.snapshot };
  }

  public getSnapshot(): SevenWayFinancialSnapshot {
    return { ...this.snapshot };
  }

  public getEntries(): JournalEntry[] {
    return [...this.entries];
  }
}
