import { describe, expect, it } from "vitest";
import {
  QuoteToCashSalesEngine,
  SevenWayLedgerEngine,
  TalentPayoutEngine,
  BankReconciliationEngine,
} from "../../src/modules/finance/index.js";

describe("Phase 8: Commercial, Financial & Reconciliation Engine", () => {
  describe("TASK-P8-01: Master Quote-to-Cash Workflow Pipeline", () => {
    it("enforces dual authorization and proof-of-performance billing gates", () => {
      const qtc = new QuoteToCashSalesEngine();

      // 1. Create Deal
      const deal = qtc.createDeal({
        id: "DEAL-AD-GTBANK-01",
        clientOrgId: "ORG-GTBANK",
        dealName: "GTBank Q2 Prime Time Campaign",
        totalContractValueNgn: 15000000,
        salesLeadId: "SALES-REP-01",
      });

      expect(deal.stage).toBe("LEAD");

      // 2. Invariant: Dual authorization violation if same person signs as sales and finance
      expect(() =>
        qtc.signContract({
          dealId: deal.id,
          salesLeadId: "USER-KWAME",
          financeApproverId: "USER-KWAME",
        })
      ).toThrow("[QTC-AUTH-01] Dual control violation: Sales Lead and Finance Approver must be distinct individuals.");

      // 3. Successful dual sign-off
      const signedDeal = qtc.signContract({
        dealId: deal.id,
        salesLeadId: "SALES-REP-01",
        financeApproverId: "FINANCE-CONTROLLER-01",
      });
      expect(signedDeal.stage).toBe("CONTRACT_SIGNED");

      // 4. Deposit
      qtc.recordDeposit(deal.id, 5000000);
      expect(qtc.getDeal(deal.id)?.stage).toBe("DEPOSIT_RECEIVED");

      // 5. Invariant: Cannot invoice without proof-of-performance documentation
      expect(() => qtc.generateInvoice(deal.id, "", 10000000)).toThrow(
        "[QTC-INV-01] Invoicing requires verified proof-of-performance documentation."
      );

      // 6. Generate Invoice with verified Certificate of Airing
      qtc.generateInvoice(
        deal.id,
        "https://vmnl.ng/evidence/coa/COA-GTB-2026-05.pdf",
        10000000
      );
      expect(qtc.getDeal(deal.id)?.stage).toBe("INVOICED");

      // 7. Collect remaining cash and recognize revenue
      qtc.recordCashPayment(deal.id, 10000000);
      const finalized = qtc.getDeal(deal.id);
      expect(finalized?.stage).toBe("REVENUE_RECOGNIZED");
      expect(finalized?.recognizedRevenueNgn).toBe(15000000);
    });
  });

  describe("TASK-P8-02: Seven-Way Financial Data Separation Engine", () => {
    it("maintains strict 7-way segregation and enforces double-entry balanced journals", () => {
      const ledger = new SevenWayLedgerEngine();

      // 1. Record 7-way snapshot amounts
      const snapshot = ledger.recordPillarAmounts({
        contractValueNgn: 50000000,
        gmvNgn: 45000000,
        invoicedRevenueNgn: 30000000,
        recognizedRevenueNgn: 25000000,
        cashCollectionsNgn: 28000000,
        talentPayablesNgn: 12000000,
        partnerSplitsNgn: 6000000,
      });

      expect(snapshot.contractValueNgn).toBe(50000000);
      expect(snapshot.gmvNgn).toBe(45000000);
      expect(snapshot.recognizedRevenueNgn).toBe(25000000);
      // Invariant check: GMV is not equal to company recognized revenue
      expect(snapshot.gmvNgn).not.toBe(snapshot.recognizedRevenueNgn);

      // 2. Invariant: Unbalanced journal entry is rejected
      expect(() =>
        ledger.postJournalEntry({
          id: "JRN-UNBALANCED",
          reference: "REF-001",
          description: "Unbalanced booking test",
          lines: [
            { accountCode: "1010_CASH", accountName: "Bank Cash", debitNgn: 1000000, creditNgn: 0 },
            { accountCode: "4010_REV", accountName: "Broadcast Revenue", debitNgn: 0, creditNgn: 800000 },
          ],
        })
      ).toThrow("[LEDGER-02] Unbalanced journal entry 'JRN-UNBALANCED': Debits (1000000) do not equal Credits (800000).");

      // 3. Balanced journal entry posts successfully
      const entry = ledger.postJournalEntry({
        id: "JRN-BALANCED-01",
        reference: "REC-AD-AIR-01",
        description: "Recognize Linear Ad Revenue for Orisun prime time",
        lines: [
          { accountCode: "1010_CASH", accountName: "Bank Cash Account", debitNgn: 1500000, creditNgn: 0 },
          { accountCode: "4010_REV", accountName: "Linear Ad Revenue", debitNgn: 0, creditNgn: 1500000 },
        ],
      });

      expect(entry.isBalanced).toBe(true);
      expect(entry.totalDebitNgn).toBe(1500000);
      expect(entry.totalCreditNgn).toBe(1500000);
      expect(ledger.getEntries().length).toBe(1);
    });
  });

  describe("TASK-P8-03: Talent Payout & Withholding Tax Engine", () => {
    it("calculates statutory WHT, enforces Maker-Checker rules, and exports NIP CSV", () => {
      const payoutEngine = new TalentPayoutEngine();

      // 1. Tax calculation: Individual beneficiary (5% WHT)
      const indCalc = TalentPayoutEngine.calculatePayoutAmounts({
        grossAmountNgn: 1000000,
        beneficiaryTaxType: "INDIVIDUAL",
        platformFeePercent: 15,
      });
      // 15% platform fee = 150,000 NGN; Subtotal = 850,000 NGN
      // 5% WHT of 850,000 = 42,500 NGN; Net = 807,500 NGN
      expect(indCalc.platformFeeNgn).toBe(150000);
      expect(indCalc.whtPercent).toBe(5);
      expect(indCalc.whtDeductionNgn).toBe(42500);
      expect(indCalc.netDisbursementNgn).toBe(807500);

      // Tax calculation: Corporate beneficiary (10% WHT)
      const corpCalc = TalentPayoutEngine.calculatePayoutAmounts({
        grossAmountNgn: 2000000,
        beneficiaryTaxType: "CORPORATE",
        platformFeePercent: 15,
      });
      // 15% fee = 300,000 NGN; Subtotal = 1,700,000 NGN
      // 10% WHT of 1,700,000 = 170,000 NGN; Net = 1,530,000 NGN
      expect(corpCalc.whtPercent).toBe(10);
      expect(corpCalc.whtDeductionNgn).toBe(170000);
      expect(corpCalc.netDisbursementNgn).toBe(1530000);

      // 2. Create Batch (Maker)
      const batch = payoutEngine.createPayoutBatch({
        id: "BAT-2026-05",
        batchReference: "VTM-PAYOUT-MAY-01",
        makerUserId: "FINANCE-OFFICER-01",
        items: [
          {
            beneficiaryId: "TAL-001",
            beneficiaryName: "Chinedu Ibe",
            beneficiaryTaxType: "INDIVIDUAL",
            bankName: "Access Bank",
            accountNumber: "0123456789",
            grossAmountNgn: 1000000,
          },
        ],
      });

      expect(batch.status).toBe("DRAFT_PENDING_APPROVAL");

      // 3. Invariant: Cannot export unapproved batch
      expect(() => payoutEngine.exportNipCsv(batch.id)).toThrow(
        "[PAY-EXP-01] Cannot export unapproved batch (status: 'DRAFT_PENDING_APPROVAL')."
      );

      // 4. Invariant: Maker cannot approve their own batch
      expect(() => payoutEngine.approvePayoutBatch(batch.id, "FINANCE-OFFICER-01")).toThrow(
        "[PAY-CHK-02] Maker-Checker violation: Approver cannot be the same user who created the batch."
      );

      // 5. Checker approves batch
      payoutEngine.approvePayoutBatch(batch.id, "FINANCE-CONTROLLER-01");
      expect(payoutEngine.getBatch(batch.id)?.status).toBe("APPROVED_FOR_DISBURSEMENT");

      // 6. Export NIP CSV
      const csv = payoutEngine.exportNipCsv(batch.id);
      expect(csv).toContain("BeneficiaryAccount,BeneficiaryName,BankName,AmountNgn");
      expect(csv).toContain('"0123456789","Chinedu Ibe","Access Bank",807500');
    });
  });

  describe("TASK-P8-04: Bank & Payment Gateway Automated Reconciliation", () => {
    it("matches exact bank credits, detects discrepancies, and routes unknown credits to suspense", () => {
      const reconEngine = new BankReconciliationEngine();

      const invoices = [
        { invoiceNumber: "INV-2026-001", expectedAmountNgn: 5000000, clientName: "Guaranty Trust Bank", isPaid: false },
        { invoiceNumber: "INV-2026-002", expectedAmountNgn: 3200000, clientName: "Airtel Nigeria", isPaid: false },
      ];

      // Ingest 3 bank records:
      // 1. Exact match for INV-2026-001
      // 2. Partial match for INV-2026-002 (underpaid)
      // 3. Unknown deposit with no matching invoice
      reconEngine.ingestBankTransactions([
        {
          id: "TX-BANK-01",
          source: "NIBSS_NIP",
          transactionReference: "NIP-GTB-INV-2026-001-9988",
          bankNarration: "Payment for INV-2026-001 GTBank ad campaign",
          amountNgn: 5000000,
          valueDate: new Date(),
        },
        {
          id: "TX-BANK-02",
          source: "NIBSS_NIP",
          transactionReference: "NIP-AIRTEL-INV-2026-002-3321",
          bankNarration: "Payment for INV-2026-002 Airtel",
          amountNgn: 3000000, // 200,000 NGN under expected
          valueDate: new Date(),
        },
        {
          id: "TX-BANK-03",
          source: "MANUAL_BANK_TRANSFER",
          transactionReference: "DIRECT-DEP-9999",
          bankNarration: "Mystery transfer from Unknown Sender",
          amountNgn: 1500000,
          valueDate: new Date(),
        },
      ]);

      const results = reconEngine.reconcileAgainstInvoices(invoices);
      expect(results.length).toBe(3);

      // Result 1: Exact match
      const r1 = reconEngine.getReconciliationResult("TX-BANK-01");
      expect(r1?.status).toBe("EXACT_MATCH_RECONCILED");
      expect(r1?.matchConfidencePercent).toBe(100);
      expect(invoices[0].isPaid).toBe(true);

      // Result 2: Partial match
      const r2 = reconEngine.getReconciliationResult("TX-BANK-02");
      expect(r2?.status).toBe("PARTIAL_MATCH");
      expect(r2?.matchConfidencePercent).toBe(75);

      // Result 3: Suspense
      const r3 = reconEngine.getReconciliationResult("TX-BANK-03");
      expect(r3?.status).toBe("UNMATCHED_SUSPENSE");
      expect(r3?.matchConfidencePercent).toBe(0);
      expect(r3?.reconciliationNotes).toContain("Flagged to suspense account");
    });
  });
});
