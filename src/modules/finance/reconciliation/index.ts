/**
 * Bank & Payment Gateway Automated Reconciliation Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §18
 *
 * Core Mandate:
 * Ingests bank statements and payment gateway webhooks (Paystack, Flutterwave, NIP).
 * Matches bank credits against outstanding customer invoices and flags unmatched credits into suspense.
 */

export interface BankTransactionRecord {
  id: string;
  source: "NIBSS_NIP" | "PAYSTACK" | "FLUTTERWAVE" | "MANUAL_BANK_TRANSFER";
  transactionReference: string;
  bankNarration: string;
  amountNgn: number;
  valueDate: Date;
  senderName?: string;
  senderAccount?: string;
}

export interface InvoiceReconciliationTarget {
  invoiceNumber: string;
  expectedAmountNgn: number;
  clientName: string;
  isPaid: boolean;
}

export interface ReconciliationMatchResult {
  transactionId: string;
  transactionReference: string;
  amountNgn: number;
  matchedInvoiceNumber?: string;
  status: "EXACT_MATCH_RECONCILED" | "PARTIAL_MATCH" | "UNMATCHED_SUSPENSE";
  matchConfidencePercent: number;
  reconciliationNotes: string;
}

export class BankReconciliationEngine {
  private transactions = new Map<string, BankTransactionRecord>();
  private reconciliationResults = new Map<string, ReconciliationMatchResult>();

  public ingestBankTransactions(records: BankTransactionRecord[]): number {
    for (const r of records) {
      this.transactions.set(r.id, r);
    }
    return records.length;
  }

  /**
   * Automatically reconciles bank transactions against outstanding invoices.
   */
  public reconcileAgainstInvoices(
    invoices: InvoiceReconciliationTarget[]
  ): ReconciliationMatchResult[] {
    const results: ReconciliationMatchResult[] = [];

    for (const tx of this.transactions.values()) {
      // 1. Exact reference match in bank narration or tx reference
      const matchedInvoice: InvoiceReconciliationTarget | undefined = invoices.find(
        (inv) =>
          tx.transactionReference.includes(inv.invoiceNumber) ||
          tx.bankNarration.includes(inv.invoiceNumber)
      );

      if (matchedInvoice) {
        if (tx.amountNgn === matchedInvoice.expectedAmountNgn) {
          const result: ReconciliationMatchResult = {
            transactionId: tx.id,
            transactionReference: tx.transactionReference,
            amountNgn: tx.amountNgn,
            matchedInvoiceNumber: matchedInvoice.invoiceNumber,
            status: "EXACT_MATCH_RECONCILED",
            matchConfidencePercent: 100,
            reconciliationNotes: `Exact reference & amount match for invoice ${matchedInvoice.invoiceNumber}.`,
          };
          matchedInvoice.isPaid = true;
          this.reconciliationResults.set(tx.id, result);
          results.push(result);
          continue;
        } else {
          const result: ReconciliationMatchResult = {
            transactionId: tx.id,
            transactionReference: tx.transactionReference,
            amountNgn: tx.amountNgn,
            matchedInvoiceNumber: matchedInvoice.invoiceNumber,
            status: "PARTIAL_MATCH",
            matchConfidencePercent: 75,
            reconciliationNotes: `Reference matched but amount discrepancy: Bank ${tx.amountNgn} vs Invoice ${matchedInvoice.expectedAmountNgn}.`,
          };
          this.reconciliationResults.set(tx.id, result);
          results.push(result);
          continue;
        }
      }

      // 2. Unmatched deposit -> Suspense
      const suspenseResult: ReconciliationMatchResult = {
        transactionId: tx.id,
        transactionReference: tx.transactionReference,
        amountNgn: tx.amountNgn,
        status: "UNMATCHED_SUSPENSE",
        matchConfidencePercent: 0,
        reconciliationNotes: "No matching invoice found for transaction reference or narration. Flagged to suspense account.",
      };
      this.reconciliationResults.set(tx.id, suspenseResult);
      results.push(suspenseResult);
    }

    return results;
  }

  public getReconciliationResult(txId: string): ReconciliationMatchResult | undefined {
    return this.reconciliationResults.get(txId);
  }
}
