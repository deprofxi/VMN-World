/**
 * Master Quote-to-Cash Workflow Pipeline
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §18
 *
 * Core Mandate:
 * Manages the full commercial sales lifecycle:
 * LEAD -> OPPORTUNITY -> PROPOSAL -> NEGOTIATION -> CONTRACT_SIGNED ->
 * DEPOSIT_RECEIVED -> OPERATIONAL_DELIVERY -> INVOICED -> CASH_COLLECTED -> REVENUE_RECOGNIZED.
 *
 * Invariants:
 * - Dual authorization required to sign contracts: Sales Lead + Legal/Finance approval.
 * - Milestone invoicing requires verified Proof-of-Performance / Proof-of-Air delivery.
 */

export type SalesStage =
  | "LEAD"
  | "OPPORTUNITY"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CONTRACT_SIGNED"
  | "DEPOSIT_RECEIVED"
  | "OPERATIONAL_DELIVERY"
  | "INVOICED"
  | "CASH_COLLECTED"
  | "REVENUE_RECOGNIZED";

export interface SalesDeal {
  id: string;
  clientOrgId: string;
  dealName: string;
  stage: SalesStage;
  totalContractValueNgn: number;
  salesLeadId: string;
  salesLeadApprovedAt?: Date;
  financeApproverId?: string;
  financeApprovedAt?: Date;
  depositAmountNgn: number;
  depositPaidAt?: Date;
  invoicedAmountNgn: number;
  cashCollectedAmountNgn: number;
  recognizedRevenueNgn: number;
  proofOfPerformanceVerified: boolean;
  proofDocumentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QuoteToCashSalesEngine {
  private deals = new Map<string, SalesDeal>();

  public createDeal(params: {
    id: string;
    clientOrgId: string;
    dealName: string;
    totalContractValueNgn: number;
    salesLeadId: string;
  }): SalesDeal {
    if (this.deals.has(params.id)) {
      throw new Error(`[QTC-DEAL-01] Deal '${params.id}' already exists.`);
    }

    if (params.totalContractValueNgn <= 0) {
      throw new Error("[QTC-DEAL-02] Contract value must be greater than zero.");
    }

    const deal: SalesDeal = {
      ...params,
      stage: "LEAD",
      depositAmountNgn: 0,
      invoicedAmountNgn: 0,
      cashCollectedAmountNgn: 0,
      recognizedRevenueNgn: 0,
      proofOfPerformanceVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.deals.set(deal.id, deal);
    return deal;
  }

  public advanceStage(dealId: string, nextStage: SalesStage): SalesDeal {
    const deal = this.getDealOrThrow(dealId);
    deal.stage = nextStage;
    deal.updatedAt = new Date();
    return deal;
  }

  /**
   * Dual Authorization Contract Sign-off.
   * INVARIANT: Both Sales Lead AND Legal/Finance Approver must sign before status transitions to CONTRACT_SIGNED.
   */
  public signContract(params: {
    dealId: string;
    salesLeadId: string;
    financeApproverId: string;
  }): SalesDeal {
    const deal = this.getDealOrThrow(params.dealId);

    if (params.salesLeadId === params.financeApproverId) {
      throw new Error("[QTC-AUTH-01] Dual control violation: Sales Lead and Finance Approver must be distinct individuals.");
    }

    deal.salesLeadApprovedAt = new Date();
    deal.financeApproverId = params.financeApproverId;
    deal.financeApprovedAt = new Date();
    deal.stage = "CONTRACT_SIGNED";
    deal.updatedAt = new Date();

    return deal;
  }

  public recordDeposit(dealId: string, depositAmountNgn: number): SalesDeal {
    const deal = this.getDealOrThrow(dealId);
    if (deal.stage !== "CONTRACT_SIGNED") {
      throw new Error(`[QTC-DEP-01] Cannot record deposit in state '${deal.stage}'. Contract must be signed.`);
    }

    deal.depositAmountNgn = depositAmountNgn;
    deal.cashCollectedAmountNgn += depositAmountNgn;
    deal.depositPaidAt = new Date();
    deal.stage = "DEPOSIT_RECEIVED";
    deal.updatedAt = new Date();

    return deal;
  }

  /**
   * Invoices the client.
   * INVARIANT: Invoicing requires verified proof-of-performance (Proof-of-Air or production deliverable acceptance).
   */
  public generateInvoice(dealId: string, proofDocumentUrl: string, invoiceAmountNgn: number): SalesDeal {
    const deal = this.getDealOrThrow(dealId);
    if (!proofDocumentUrl || proofDocumentUrl.trim() === "") {
      throw new Error("[QTC-INV-01] Invoicing requires verified proof-of-performance documentation.");
    }

    deal.proofOfPerformanceVerified = true;
    deal.proofDocumentUrl = proofDocumentUrl;
    deal.invoicedAmountNgn += invoiceAmountNgn;
    deal.stage = "INVOICED";
    deal.updatedAt = new Date();

    return deal;
  }

  /**
   * Cash collection and revenue recognition.
   *
   * FIN-01 / GVR-05 (DEC pending FinanceController ruling — FIN-01): revenue
   * is never recognised on a cash-basis shortcut. Recognition requires BOTH:
   *  - verified proof-of-performance (delivery obligation satisfied), and
   *  - collected cash covering the recognised amount.
   * Recognised revenue is additionally capped at the total contract value so
   * over-collection cannot inflate consolidated external revenue (Canonical
   * Law 7). Cash above the cap remains cash, not revenue.
   */
  public recordCashPayment(dealId: string, amountNgn: number): SalesDeal {
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      throw new Error("[QTC-CASH-01] Cash payment amount must be greater than zero.");
    }
    const deal = this.getDealOrThrow(dealId);
    deal.cashCollectedAmountNgn += amountNgn;
    deal.stage = "CASH_COLLECTED";

    this.recalculateRecognizedRevenue(deal);
    deal.updatedAt = new Date();
    return deal;
  }

  /**
   * Recognition recompute shared by cash and delivery events: revenue moves
   * only when proof-of-performance is verified, and never beyond the
   * contract value.
   */
  private recalculateRecognizedRevenue(deal: SalesDeal): void {
    if (!deal.proofOfPerformanceVerified) {
      return; // No verified delivery → no recognition (cash stays deferred).
    }
    const recognizable = Math.min(deal.cashCollectedAmountNgn, deal.totalContractValueNgn);
    if (recognizable > deal.recognizedRevenueNgn) {
      deal.recognizedRevenueNgn = recognizable;
    }
    if (deal.recognizedRevenueNgn >= deal.totalContractValueNgn) {
      deal.stage = "REVENUE_RECOGNIZED";
    }
  }

  /**
   * FIN-01: explicit recognition event for delivered-and-invoiced value —
   * e.g. milestone completion verified by proof-of-performance without a new
   * cash movement. Recognition is delivery-gated and contract-capped; cash
   * above the cap remains collected cash, not revenue.
   */
  public recognizeRevenue(dealId: string, amountNgn: number): SalesDeal {
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      throw new Error("[QTC-REC-01] Recognition amount must be greater than zero.");
    }
    const deal = this.getDealOrThrow(dealId);
    if (!deal.proofOfPerformanceVerified) {
      throw new Error("[QTC-REC-02] Revenue recognition requires verified proof-of-performance. Cash collected is not revenue until delivery is verified.");
    }
    const headroom = deal.totalContractValueNgn - deal.recognizedRevenueNgn;
    if (amountNgn > headroom) {
      throw new Error(
        `[QTC-REC-03] Recognition of ${amountNgn} exceeds the remaining contract value headroom (${Math.max(headroom, 0)}). Consolidated revenue must not be inflated beyond the contract (Canonical Law 7).`
      );
    }
    deal.recognizedRevenueNgn += amountNgn;
    if (deal.recognizedRevenueNgn >= deal.totalContractValueNgn) {
      deal.stage = "REVENUE_RECOGNIZED";
    }
    deal.updatedAt = new Date();
    return deal;
  }

  public getDeal(id: string): SalesDeal | undefined {
    return this.deals.get(id);
  }

  /**
   * Read accessor for workspace projections (SCR-17/SCR-19): returns all
   * canonical deals. Callers must apply their own tenant/relationship scoping
   * before rendering records to a counterparty.
   */
  public listDeals(): SalesDeal[] {
    return Array.from(this.deals.values());
  }

  private getDealOrThrow(id: string): SalesDeal {
    const deal = this.deals.get(id);
    if (!deal) {
      throw new Error(`[QTC-ERR-404] Sales deal '${id}' not found.`);
    }
    return deal;
  }
}
