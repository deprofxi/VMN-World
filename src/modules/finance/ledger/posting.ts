/**
 * Canonical Ledger Posting Service — TODO-FIN-03 (P0)
 *
 * Bridges the operational engines (Quote-to-Cash sales, broadcast billing,
 * talent payouts) to the SevenWayLedgerEngine so the "7-way separation" is a
 * reconciled double-entry ledger rather than parallel bookkeeping.
 *
 * Every event posts a balanced journal (debits == credits to the kobo) AND
 * advances the seven-pillar snapshot, so contract / invoiced / cash /
 * payables / splits always tie out:
 *   contract value  = signed deal contract value
 *   invoiced        = invoiced amounts
 *   cash            = collected cash
 *   recognized      = delivery-gated recognition only (never > contract)
 *   talent payable  = net disbursement owed/paid out
 *   partner splits  = platform commission owed to platform partners
 *
 * Canonical Laws 5 & 7: one consolidated financial truth; internal unit
 * allocations never inflate consolidated external revenue.
 */

import { SevenWayLedgerEngine, JournalLine, JournalEntry } from "./index.js";
import { SalesDeal } from "../sales/index.js";

export type LedgerEventSource = "QUOTE_TO_CASH" | "BROADCAST_BILLING" | "TALENT_PAYOUT";

export interface LedgerPostingResult {
  entry: JournalEntry;
}

const ACCOUNTS = {
  contract: { accountCode: "1200_CONTRACT_ASSET", accountName: "Contract Asset (Legal Committed)" },
  receivable: { accountCode: "1300_ACCOUNTS_RECEIVABLE", accountName: "Accounts Receivable (Invoiced)" },
  bank: { accountCode: "1010_BANK_CASH", accountName: "Bank / Cash Collections" },
  recognized: { accountCode: "4010_RECOGNIZED_REVENUE", accountName: "Recognized Revenue" },
  deferred: { accountCode: "2300_DEFERRED_REVENUE", accountName: "Deferred Revenue (Undelivered Cash)" },
  talentPayable: { accountCode: "2010_TALENT_PAYABLE", accountName: "Talent Payable" },
  platformCommission: { accountCode: "2110_PLATFORM_COMMISSION_PAYABLE", accountName: "Platform Commission Payable" },
  contractClearing: { accountCode: "1290_CONTRACT_CLEARING", accountName: "Contract Clearing" },
} as const;

export class LedgerPostingService {
  private readonly ledger: SevenWayLedgerEngine;
  /** Deal id → contract value already posted (prevents double posting). */
  private postedContractValue = new Map<string, number>();
  private postedInvoiced = new Map<string, number>();
  private postedCash = new Map<string, number>();
  private postedRecognized = new Map<string, number>();

  constructor(ledger: SevenWayLedgerEngine = new SevenWayLedgerEngine()) {
    this.ledger = ledger;
  }

  public getLedger(): SevenWayLedgerEngine {
    return this.ledger;
  }

  /**
   * Posts the full lifecycle of a canonical sales deal. Idempotent: each
   * movement (contract / invoice / cash / recognition) is posted only for the
   * delta since the last posting, so replaying a deal never double-counts.
   */
  public postDeal(deal: SalesDeal): LedgerPostingResult[] {
    const results: LedgerPostingResult[] = [];
    const ref = `QTC:${deal.id}`;

    // 1. Contract signature: recognise the legal commitment (Dr contract / Cr
    //    contract clearing — a memo pair that nets to zero but records the
    //    committed value in the snapshot).
    const contractDelta = deal.totalContractValueNgn - (this.postedContractValue.get(deal.id) ?? 0);
    if (contractDelta > 0) {
      results.push({
        entry: this.post({
          id: `${ref}:CONTRACT:${this.postedContractValue.size}`,
          reference: ref,
          description: `Contract signed for deal ${deal.id} (${deal.dealName})`,
          lines: [
            { ...ACCOUNTS.contract, debitNgn: contractDelta, creditNgn: 0 },
            { ...ACCOUNTS.contractClearing, debitNgn: 0, creditNgn: contractDelta },
          ],
        }),
      });
      this.ledger.recordPillarAmounts({ contractValueNgn: contractDelta });
      this.postedContractValue.set(deal.id, deal.totalContractValueNgn);
    }

    // 2. Invoicing: Dr receivable / Cr contract clearing.
    const invoicedDelta = deal.invoicedAmountNgn - (this.postedInvoiced.get(deal.id) ?? 0);
    if (invoicedDelta > 0) {
      results.push({
        entry: this.post({
          id: `${ref}:INVOICE:${this.postedInvoiced.size}`,
          reference: ref,
          description: `Invoice raised for deal ${deal.id}`,
          lines: [
            { ...ACCOUNTS.receivable, debitNgn: invoicedDelta, creditNgn: 0 },
            { ...ACCOUNTS.contractClearing, debitNgn: 0, creditNgn: invoicedDelta },
          ],
        }),
      });
      this.ledger.recordPillarAmounts({ invoicedRevenueNgn: invoicedDelta });
      this.postedInvoiced.set(deal.id, deal.invoicedAmountNgn);
    }

    // 3. Cash collection: Dr bank / Cr receivable (up to invoiced amount;
    //    over-collected cash stays in deferred revenue, NOT revenue).
    const cashDelta = deal.cashCollectedAmountNgn - (this.postedCash.get(deal.id) ?? 0);
    if (cashDelta > 0) {
      const appliedSoFar = this.postedCashApplied.get(deal.id) ?? 0;
      const toReceivable = Math.max(0, Math.min(cashDelta, deal.invoicedAmountNgn - appliedSoFar));
      const toDeferred = cashDelta - toReceivable;
      const lines: JournalLine[] = [{ ...ACCOUNTS.bank, debitNgn: cashDelta, creditNgn: 0 }];
      if (toReceivable > 0) lines.push({ ...ACCOUNTS.receivable, debitNgn: 0, creditNgn: toReceivable });
      if (toDeferred > 0) lines.push({ ...ACCOUNTS.deferred, debitNgn: 0, creditNgn: toDeferred });
      results.push({
        entry: this.post({
          id: `${ref}:CASH:${this.postedCash.size}`,
          reference: ref,
          description: `Cash collected on deal ${deal.id}`,
          lines,
        }),
      });
      this.ledger.recordPillarAmounts({ cashCollectionsNgn: cashDelta });
      this.postedCashApplied.set(deal.id, appliedSoFar + cashDelta);
      this.postedCash.set(deal.id, deal.cashCollectedAmountNgn);
    }

    // 4. Recognition: only the delivery-gated, contract-capped amount moves
    //    from deferred to recognised. Cash that is not yet earned stays
    //    deferred (FIN-01 / GVR-05 pending ruling — conservative default).
    const recognizedDelta = deal.recognizedRevenueNgn - (this.postedRecognized.get(deal.id) ?? 0);
    if (recognizedDelta > 0) {
      results.push({
        entry: this.post({
          id: `${ref}:RECOGNITION:${this.postedRecognized.size}`,
          reference: ref,
          description: `Revenue recognition (delivery-gated) for deal ${deal.id}`,
          lines: [
            { ...ACCOUNTS.deferred, debitNgn: recognizedDelta, creditNgn: 0 },
            { ...ACCOUNTS.recognized, debitNgn: 0, creditNgn: recognizedDelta },
          ],
        }),
      });
      this.ledger.recordPillarAmounts({ recognizedRevenueNgn: recognizedDelta });
      this.postedRecognized.set(deal.id, deal.recognizedRevenueNgn);
    }

    return results;
  }

  /**
   * Posts a talent payout batch: recognises the 7-way split — talent payable
   * (net) and platform commission payable (fee) against the gross settlement.
   */
  public postPayoutBatch(batch: {
    id: string;
    totalGrossNgn: number;
    totalPlatformFeeNgn: number;
    totalNetDisbursementNgn: number;
    status: string;
  }): LedgerPostingResult {
    const ref = `PAYOUT:${batch.id}`;
    const entry = this.post({
      id: `${ref}:SPLIT`,
      reference: ref,
      description: `Talent payout batch ${batch.id} (${batch.status})`,
      lines: [
        // Gross cost lands on the platform commission payable + talent payable
        // pair: the two payables must sum to the gross settlement.
        { ...ACCOUNTS.contractClearing, debitNgn: batch.totalGrossNgn, creditNgn: 0 },
        { ...ACCOUNTS.talentPayable, debitNgn: 0, creditNgn: batch.totalNetDisbursementNgn },
        { ...ACCOUNTS.platformCommission, debitNgn: 0, creditNgn: batch.totalGrossNgn - batch.totalNetDisbursementNgn },
      ],
    });
    this.ledger.recordPillarAmounts({
      talentPayablesNgn: batch.totalNetDisbursementNgn,
      partnerSplitsNgn: batch.totalGrossNgn - batch.totalNetDisbursementNgn,
    });
    return { entry };
  }

  /**
   * Posts a broadcast billing milestone: the aired-value billed to the client
   * moves contract clearing to receivable (delivery-proven billing).
   */
  public postBroadcastBilling(params: {
    campaignCode: string;
    airedValueNgn: number;
  }): LedgerPostingResult {
    const ref = `BILLING:${params.campaignCode}`;
    const entry = this.post({
      id: `${ref}:${this.billingSeq++}`,
      reference: ref,
      description: `Broadcast billing milestone for campaign ${params.campaignCode}`,
      lines: [
        { ...ACCOUNTS.receivable, debitNgn: params.airedValueNgn, creditNgn: 0 },
        { ...ACCOUNTS.contractClearing, debitNgn: 0, creditNgn: params.airedValueNgn },
      ],
    });
    this.ledger.recordPillarAmounts({ invoicedRevenueNgn: params.airedValueNgn });
    return { entry };
  }

  private billingSeq = 0;

  private postedCashApplied = new Map<string, number>();

  private post(params: { id: string; reference: string; description: string; lines: JournalLine[] }): JournalEntry {
    return this.ledger.postJournalEntry(params);
  }
}
