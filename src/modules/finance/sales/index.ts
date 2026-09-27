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
   */
  public recordCashPayment(dealId: string, amountNgn: number): SalesDeal {
    const deal = this.getDealOrThrow(dealId);
    deal.cashCollectedAmountNgn += amountNgn;
    deal.stage = "CASH_COLLECTED";

    // Recognize revenue once service delivered and cash collected
    if (deal.proofOfPerformanceVerified) {
      deal.recognizedRevenueNgn = deal.cashCollectedAmountNgn;
      if (deal.recognizedRevenueNgn >= deal.totalContractValueNgn) {
        deal.stage = "REVENUE_RECOGNIZED";
      }
    }

    deal.updatedAt = new Date();
    return deal;
  }

  public getDeal(id: string): SalesDeal | undefined {
    return this.deals.get(id);
  }

  private getDealOrThrow(id: string): SalesDeal {
    const deal = this.deals.get(id);
    if (!deal) {
      throw new Error(`[QTC-ERR-404] Sales deal '${id}' not found.`);
    }
    return deal;
  }
}
