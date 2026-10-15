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
 * - Internal unit allocations are eliminated on consolidation: they may never
 *   advance an external revenue pillar (canonical law 7, TSK-32).
 */

export interface SevenWayFinancialSnapshot {
  contractValueNgn: number;
  gmvNgn: number;
  invoicedRevenueNgn: number;
  recognizedRevenueNgn: number;
  cashCollectionsNgn: number;
  talentPayablesNgn: number;
  partnerSplitsNgn: number;
  /**
   * Canonical law 7 (`CLAUDE.md:24`, PRD §14 "Internal unit allocations must
   * never inflate consolidated external revenue"): allocations between VMN
   * units are eliminated on consolidation, so they accumulate HERE and are
   * reported separately from every revenue pillar.
   */
  internalAllocationsNgn: number;
  asOfDate: Date;
}

/** Which side of the consolidation line an amount belongs to (law 7). */
export type PillarScope = "EXTERNAL" | "INTERNAL_ALLOCATION";

/** The pillars that feed consolidated external revenue. */
const EXTERNAL_REVENUE_PILLARS = [
  "contractValueNgn",
  "gmvNgn",
  "invoicedRevenueNgn",
  "recognizedRevenueNgn",
  "cashCollectionsNgn",
] as const;

export type ExternalRevenuePillar = (typeof EXTERNAL_REVENUE_PILLARS)[number];

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

import { toKobo, fromKobo } from "../../../core/domain/types.js";
import { registerDurableStore, stageDurableWrite } from "../../../core/database/durable-journal.js";
import { persistJournalEntry } from "../../../core/database/repositories/release-critical.repository.js";

/**
 * TSK-17 (report.md CA-12): a posted journal is a financial fact, so it belongs
 * in `JournalEntryRecord`, not in an array that dies with the process. The
 * double-entry invariant below is unchanged — durability is additive, and an
 * entry the database rejects is taken back out of `entries` so the ledger never
 * shows a posting nobody persisted.
 */
registerDurableStore<JournalEntry>("journalEntry", persistJournalEntry);

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
    internalAllocationsNgn: 0,
    asOfDate: new Date(),
  };

  public postJournalEntry(params: {
    id: string;
    reference: string;
    description: string;
    lines: JournalLine[];
  }): JournalEntry {
    let totalDebitKobo = 0;
    let totalCreditKobo = 0;

    for (const line of params.lines) {
      if (line.debitNgn < 0 || line.creditNgn < 0) {
        throw new Error("[LEDGER-01] Debits and credits must be non-negative.");
      }
      totalDebitKobo += toKobo(line.debitNgn);
      totalCreditKobo += toKobo(line.creditNgn);
    }

    // Invariant: Debits must strictly equal Credits down to the exact kobo/cent
    if (totalDebitKobo !== totalCreditKobo) {
      throw new Error(
        `[LEDGER-02] Unbalanced journal entry '${params.id}': Debits (${fromKobo(totalDebitKobo)}) do not equal Credits (${fromKobo(totalCreditKobo)}).`
      );
    }

    const entry: JournalEntry = {
      ...params,
      totalDebitNgn: fromKobo(totalDebitKobo),
      totalCreditNgn: fromKobo(totalCreditKobo),
      isBalanced: true,
      postedAt: new Date(),
    };

    this.entries.push(entry);
    stageDurableWrite<JournalEntry>({
      store: "journalEntry",
      key: entry.id,
      payload: entry,
      rollback: () => {
        this.entries = this.entries.filter((posted) => posted.id !== entry.id);
      },
    });
    return entry;
  }

  /**
   * Advances the pillar snapshot.
   *
   * `scope` is the law-7 consolidation line (CLAUDE.md:24 / PRD §14: "Internal
   * unit allocations must never inflate consolidated external revenue"). The
   * guard is deliberately mechanical rather than an accounting judgement: which
   * unit-to-unit charges are internal is Finance's ruling (HD-04, see TSK-34),
   * but whichever they are, an amount flagged as an internal allocation cannot
   * move an external revenue pillar, and an external booking cannot hide in the
   * elimination bucket.
   */
  public recordPillarAmounts(
    amounts: Partial<Omit<SevenWayFinancialSnapshot, "asOfDate">>,
    scope: PillarScope = "EXTERNAL"
  ): SevenWayFinancialSnapshot {
    this.assertConsolidationScope(amounts, scope);

    if (amounts.contractValueNgn !== undefined) {
      this.snapshot.contractValueNgn = fromKobo(toKobo(this.snapshot.contractValueNgn) + toKobo(amounts.contractValueNgn));
    }
    if (amounts.gmvNgn !== undefined) {
      this.snapshot.gmvNgn = fromKobo(toKobo(this.snapshot.gmvNgn) + toKobo(amounts.gmvNgn));
    }
    if (amounts.invoicedRevenueNgn !== undefined) {
      this.snapshot.invoicedRevenueNgn = fromKobo(toKobo(this.snapshot.invoicedRevenueNgn) + toKobo(amounts.invoicedRevenueNgn));
    }
    if (amounts.recognizedRevenueNgn !== undefined) {
      this.snapshot.recognizedRevenueNgn = fromKobo(toKobo(this.snapshot.recognizedRevenueNgn) + toKobo(amounts.recognizedRevenueNgn));
    }
    if (amounts.cashCollectionsNgn !== undefined) {
      this.snapshot.cashCollectionsNgn = fromKobo(toKobo(this.snapshot.cashCollectionsNgn) + toKobo(amounts.cashCollectionsNgn));
    }
    if (amounts.talentPayablesNgn !== undefined) {
      this.snapshot.talentPayablesNgn = fromKobo(toKobo(this.snapshot.talentPayablesNgn) + toKobo(amounts.talentPayablesNgn));
    }
    if (amounts.partnerSplitsNgn !== undefined) {
      this.snapshot.partnerSplitsNgn = fromKobo(toKobo(this.snapshot.partnerSplitsNgn) + toKobo(amounts.partnerSplitsNgn));
    }
    if (amounts.internalAllocationsNgn !== undefined) {
      this.snapshot.internalAllocationsNgn = fromKobo(toKobo(this.snapshot.internalAllocationsNgn) + toKobo(amounts.internalAllocationsNgn));
    }

    this.snapshot.asOfDate = new Date();
    return { ...this.snapshot };
  }

  private assertConsolidationScope(
    amounts: Partial<Omit<SevenWayFinancialSnapshot, "asOfDate">>,
    scope: PillarScope
  ): void {
    if (scope === "INTERNAL_ALLOCATION") {
      const inflated = EXTERNAL_REVENUE_PILLARS.filter((pillar) => (amounts[pillar] ?? 0) !== 0);
      if (inflated.length > 0) {
        throw new Error(
          `[LEDGER-03] Law 7 violation: an internal unit allocation may not advance consolidated external revenue (${inflated.join(", ")}). Book it on internalAllocationsNgn instead.`
        );
      }
      if (amounts.internalAllocationsNgn === undefined) {
        throw new Error("[LEDGER-03] An internal allocation must state internalAllocationsNgn; nothing was routed to the elimination bucket.");
      }
      return;
    }
    if (amounts.internalAllocationsNgn !== undefined) {
      throw new Error("[LEDGER-03] internalAllocationsNgn is the consolidation elimination bucket — pass scope 'INTERNAL_ALLOCATION' to move it.");
    }
  }

  public getSnapshot(): SevenWayFinancialSnapshot {
    return { ...this.snapshot };
  }

  public getEntries(): JournalEntry[] {
    return [...this.entries];
  }

  /**
   * Boot hydration (TSK-17): adopt the durable journal. Entries are append-only,
   * so the sequence, the references and the recorded balance flags come back as
   * they were posted.
   *
   * Stated limit: `getSnapshot()` is NOT rebuilt here. The pillar totals (the
   * seven, plus the law-7 elimination accumulator) are accumulated by the
   * caller's `recordPillarAmounts` deltas, and deriving a pillar from an account
   * code would be inventing a mapping no authority supplies. A restarted engine
   * therefore reports zero pillars until its posting service replays them —
   * which is exactly why the journal itself, the evidence the pillars are
   * audited against, is the durable half.
   */
  public hydrate(entries: JournalEntry[]): void {
    this.entries = entries.map((entry) => ({ ...entry, lines: entry.lines.map((line) => ({ ...line })) }));
  }
}
