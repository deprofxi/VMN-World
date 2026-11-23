/**
 * Talent Payout & Withholding Tax (WHT) Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §18
 *
 * Core Mandate:
 * Computes net disbursements after platform fees and statutory Nigerian WHT (5% individual / 10% corporate).
 * Implements strict Maker-Checker authorization from Finance Controller.
 * Generates NIBSS Instant Payment (NIP) batch disbursement CSV records.
 */

export type BeneficiaryTaxType = "INDIVIDUAL" | "CORPORATE";

export interface PayoutItem {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryTaxType: BeneficiaryTaxType;
  bankName: string;
  accountNumber: string;
  grossAmountNgn: number;
  platformFeePercent: number; // e.g. 15%
  platformFeeNgn: number;
  whtPercent: number; // 5% for individual, 10% for corporate
  whtDeductionNgn: number;
  netDisbursementNgn: number;
}

export interface PayoutBatch {
  id: string;
  batchReference: string;
  totalGrossNgn: number;
  totalPlatformFeeNgn: number;
  totalWhtNgn: number;
  totalNetDisbursementNgn: number;
  items: PayoutItem[];
  makerUserId: string;
  checkerApproverId?: string;
  status: "DRAFT_PENDING_APPROVAL" | "APPROVED_FOR_DISBURSEMENT" | "PROCESSED" | "REJECTED";
  createdAt: Date;
  approvedAt?: Date;
}

/** TODO-FIN-04: one aggregated WHT line per beneficiary/tax-type per month. */
export interface WhtRemittanceLine {
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryTaxType: BeneficiaryTaxType;
  whtPercent: number;
  deductionCount: number;
  totalWhtDeductedNgn: number;
  sourceBatchReferences: string[];
}

/** TODO-FIN-04: monthly WHT remittance schedule. */
export interface WhtRemittanceSchedule {
  year: number;
  month: number;
  remittanceMonthKey: string;
  lines: WhtRemittanceLine[];
  totalWhtNgn: number;
  generatedAt: Date;
}

export class TalentPayoutEngine {
  private batches = new Map<string, PayoutBatch>();

  /**
   * Calculates gross, fees, WHT, and net amounts for a payout beneficiary.
   */
  public static calculatePayoutAmounts(params: {
    grossAmountNgn: number;
    beneficiaryTaxType: BeneficiaryTaxType;
    platformFeePercent?: number;
  }): { platformFeeNgn: number; whtPercent: number; whtDeductionNgn: number; netDisbursementNgn: number } {
    if (params.grossAmountNgn <= 0) {
      throw new Error("[PAY-CALC-01] Gross amount must be greater than zero.");
    }

    const platformFeeRate = (params.platformFeePercent ?? 15) / 100;
    const platformFeeNgn = Math.round(params.grossAmountNgn * platformFeeRate);
    const subtotalAfterPlatformFee = params.grossAmountNgn - platformFeeNgn;

    // Nigerian statutory WHT: 5% for individual / 10% for corporate
    const whtPercent = params.beneficiaryTaxType === "INDIVIDUAL" ? 5 : 10;
    const whtDeductionNgn = Math.round(subtotalAfterPlatformFee * (whtPercent / 100));
    const netDisbursementNgn = subtotalAfterPlatformFee - whtDeductionNgn;

    return {
      platformFeeNgn,
      whtPercent,
      whtDeductionNgn,
      netDisbursementNgn,
    };
  }

  /**
   * Creates a payout batch (Maker action).
   */
  public createPayoutBatch(params: {
    id: string;
    batchReference: string;
    makerUserId: string;
    items: Array<{
      beneficiaryId: string;
      beneficiaryName: string;
      beneficiaryTaxType: BeneficiaryTaxType;
      bankName: string;
      accountNumber: string;
      grossAmountNgn: number;
      platformFeePercent?: number;
    }>;
  }): PayoutBatch {
    if (params.items.length === 0) {
      throw new Error("[PAY-BAT-01] Payout batch must contain at least one item.");
    }

    let totalGross = 0;
    let totalFee = 0;
    let totalWht = 0;
    let totalNet = 0;

    const payoutItems: PayoutItem[] = params.items.map((item, idx) => {
      const calc = TalentPayoutEngine.calculatePayoutAmounts({
        grossAmountNgn: item.grossAmountNgn,
        beneficiaryTaxType: item.beneficiaryTaxType,
        platformFeePercent: item.platformFeePercent,
      });

      totalGross += item.grossAmountNgn;
      totalFee += calc.platformFeeNgn;
      totalWht += calc.whtDeductionNgn;
      totalNet += calc.netDisbursementNgn;

      return {
        id: `PAY-ITM-${Date.now()}-${idx + 1}`,
        beneficiaryId: item.beneficiaryId,
        beneficiaryName: item.beneficiaryName,
        beneficiaryTaxType: item.beneficiaryTaxType,
        bankName: item.bankName,
        accountNumber: item.accountNumber,
        grossAmountNgn: item.grossAmountNgn,
        platformFeePercent: item.platformFeePercent ?? 15,
        platformFeeNgn: calc.platformFeeNgn,
        whtPercent: calc.whtPercent,
        whtDeductionNgn: calc.whtDeductionNgn,
        netDisbursementNgn: calc.netDisbursementNgn,
      };
    });

    const batch: PayoutBatch = {
      id: params.id,
      batchReference: params.batchReference,
      totalGrossNgn: totalGross,
      totalPlatformFeeNgn: totalFee,
      totalWhtNgn: totalWht,
      totalNetDisbursementNgn: totalNet,
      items: payoutItems,
      makerUserId: params.makerUserId,
      status: "DRAFT_PENDING_APPROVAL",
      createdAt: new Date(),
    };

    this.batches.set(batch.id, batch);
    return batch;
  }

  /**
   * Maker-Checker Authorization (Checker action).
   * INVARIANT: Checker must be a different user from Maker.
   */
  public approvePayoutBatch(batchId: string, checkerApproverId: string): PayoutBatch {
    const batch = this.getBatchOrThrow(batchId);

    if (batch.status !== "DRAFT_PENDING_APPROVAL") {
      throw new Error(`[PAY-CHK-01] Cannot approve batch in state '${batch.status}'. Must be 'DRAFT_PENDING_APPROVAL'.`);
    }

    if (batch.makerUserId === checkerApproverId) {
      throw new Error("[PAY-CHK-02] Maker-Checker violation: Approver cannot be the same user who created the batch.");
    }

    batch.status = "APPROVED_FOR_DISBURSEMENT";
    batch.checkerApproverId = checkerApproverId;
    batch.approvedAt = new Date();

    return batch;
  }

  /**
   * Generates NIP / CSV batch file for Nigerian banking payment systems.
   */
  public exportNipCsv(batchId: string): string {
    const batch = this.getBatchOrThrow(batchId);
    if (batch.status !== "APPROVED_FOR_DISBURSEMENT" && batch.status !== "PROCESSED") {
      throw new Error(`[PAY-EXP-01] Cannot export unapproved batch (status: '${batch.status}').`);
    }

    const headers = "BeneficiaryAccount,BeneficiaryName,BankName,AmountNgn,Narration,BatchRef";
    const rows = batch.items.map((i) =>
      `"${i.accountNumber}","${i.beneficiaryName}","${i.bankName}",${i.netDisbursementNgn},"VMNL Payout ${batch.batchReference}","${batch.batchReference}"`
    );

    return [headers, ...rows].join("\n");
  }

  public getBatch(id: string): PayoutBatch | undefined {
    return this.batches.get(id);
  }

  /**
   * Read accessor for creator/vendor portal projections (SCR-19). Callers
   * must scope batches to the counterparty beneficiary before rendering.
   */
  public listBatches(): PayoutBatch[] {
    return Array.from(this.batches.values());
  }

  private getBatchOrThrow(id: string): PayoutBatch {
    const batch = this.batches.get(id);
    if (!batch) {
      throw new Error(`[PAY-ERR-404] Payout batch '${id}' not found.`);
    }
    return batch;
  }

  // ---------------------------------------------------------------------------
  // TODO-FIN-04: WHT remittance schedules & payment advice slips (TASK-P8-03)
  //
  // WHT deducted at source belongs to FIRS, not to VMNL: it is a liability,
  // never revenue and never talent payable (canonical law 5 — one
  // consolidated financial truth; Finance owns the accounting treatment).
  // The schedule aggregates approved/processed batches by remittance month
  // (per beneficiary / tax type) and each advice slip itemises one
  // beneficiary's deductions for the month in a FIRS-ready column layout.
  // Final FIRS submission remains a Finance-authority action.
  // ---------------------------------------------------------------------------

  public buildWhtRemittanceSchedule(params: { year: number; month: number }): WhtRemittanceSchedule {
    if (params.month < 1 || params.month > 12) {
      throw new Error("[WHT-REM-01] month must be 1..12.");
    }
    const monthKey = `${params.year}-${String(params.month).padStart(2, "0")}`;
    const byBeneficiary = new Map<string, WhtRemittanceLine>();

    for (const batch of this.listBatches()) {
      const batchMonth = `${batch.createdAt.getUTCFullYear()}-${String(batch.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
      if (batchMonth !== monthKey) continue;
      if (batch.status !== "APPROVED_FOR_DISBURSEMENT" && batch.status !== "PROCESSED") {
        continue; // DRAFT/REJECTED batches are not remittable evidence.
      }
      for (const item of batch.items) {
        if (item.whtDeductionNgn <= 0) continue;
        const key = `${item.beneficiaryId}:${item.beneficiaryTaxType}`;
        const line = byBeneficiary.get(key) || {
          beneficiaryId: item.beneficiaryId,
          beneficiaryName: item.beneficiaryName,
          beneficiaryTaxType: item.beneficiaryTaxType,
          whtPercent: item.whtPercent,
          deductionCount: 0,
          totalWhtDeductedNgn: 0,
          sourceBatchReferences: [],
        };
        line.deductionCount += 1;
        line.totalWhtDeductedNgn += item.whtDeductionNgn;
        line.sourceBatchReferences.push(batch.batchReference);
        byBeneficiary.set(key, line);
      }
    }

    const lines = [...byBeneficiary.values()].sort((a, b) => a.beneficiaryId.localeCompare(b.beneficiaryId));
    return {
      year: params.year,
      month: params.month,
      remittanceMonthKey: monthKey,
      lines,
      totalWhtNgn: lines.reduce((s, l) => s + l.totalWhtDeductedNgn, 0),
      generatedAt: new Date(),
    };
  }

  /** Renders one beneficiary's FIRS-ready advice slip for the month. */
  public renderWhtAdviceSlip(schedule: WhtRemittanceSchedule, beneficiaryId: string): string {
    const lines = schedule.lines.filter((l) => l.beneficiaryId === beneficiaryId);
    if (lines.length === 0) {
      throw new Error(`[WHT-REM-02] No WHT deductions recorded for beneficiary '${beneficiaryId}' in ${schedule.remittanceMonthKey}.`);
    }
    const total = lines.reduce((s, l) => s + l.totalWhtDeductedNgn, 0);
    const rows = lines
      .map(
        (l) =>
          `"${l.beneficiaryId}","${l.beneficiaryName}","${l.beneficiaryTaxType}",${l.whtPercent},${l.deductionCount},${l.totalWhtDeductedNgn},"${l.sourceBatchReferences.join(";")}"`
      )
      .join("\n");
    return [
      `# VMNL WHT Remittance Advice Slip — ${schedule.remittanceMonthKey}`,
      `# Withholding tax deducted at source from approved payout batches. Liability of VMNL to FIRS; not talent payable and not revenue.`,
      `# Finance authority confirmation is required before remittance (FIRS-ready format; treatment owned by Finance).`,
      `BeneficiaryId,BeneficiaryName,TaxType,WhtPercent,Deductions,TotalWhtNgn,SourceBatches`,
      rows,
      `TOTAL,,,,,${total},`,
    ].join("\n");
  }
}

export * from "./banking-gateway.js";
export * from "./nip-crypto.js";


