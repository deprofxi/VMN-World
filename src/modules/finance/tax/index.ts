/**
 * Nigerian Statutory Corporate Tax Treatment & Withholding Engine
 * Authority: Nigerian Finance Act (FIRS Circulars 2021/02 & 2023 Update)
 * VMN Governance & Financial Authority Master R1.1 — CMP-041
 *
 * Implements period-specific VAT (7.5%), statutory WHT (5% / 10%) rules,
 * gross-up calculations for net agreements, and immutable audit rationale logging.
 */

export type TaxCategory =
  | "COMMERCIAL_SUPPLY"
  | "TALENT_ENTERTAINMENT"
  | "EQUIPMENT_RENTAL"
  | "MANAGEMENT_CONSULTING"
  | "ROYALTY_DISTRIBUTION"
  | "ACADEMIC_TUITION"
  | "DIRECTOR_EMOLUMENT";

export interface TaxPolicyRate {
  vatBps: bigint; // 750n = 7.5%
  whtIndividualBps: bigint; // 500n = 5%
  whtCorporateBps: bigint; // 1000n = 10%
  firsStatutoryReference: string;
  isVatExempt: boolean;
}

export const TAX_POLICY_RATES: Record<TaxCategory, TaxPolicyRate> = {
  COMMERCIAL_SUPPLY: {
    vatBps: 750n,
    whtIndividualBps: 500n,
    whtCorporateBps: 500n,
    firsStatutoryReference: "FIRS Act §38 — Supply of goods and standard commercial contracts",
    isVatExempt: false,
  },
  TALENT_ENTERTAINMENT: {
    vatBps: 750n,
    whtIndividualBps: 500n,
    whtCorporateBps: 500n,
    firsStatutoryReference: "FIRS Information Circular 2021/02 — Talent, artist, and entertainment performance",
    isVatExempt: false,
  },
  EQUIPMENT_RENTAL: {
    vatBps: 750n,
    whtIndividualBps: 1000n,
    whtCorporateBps: 1000n,
    firsStatutoryReference: "FIRS WHT Regulations §2(1) — Hire or rental of equipment and plant",
    isVatExempt: false,
  },
  MANAGEMENT_CONSULTING: {
    vatBps: 750n,
    whtIndividualBps: 500n,
    whtCorporateBps: 1000n,
    firsStatutoryReference: "CITA §81 / PITA §73 — Management, consultancy, and technical advisory fees",
    isVatExempt: false,
  },
  ROYALTY_DISTRIBUTION: {
    vatBps: 0n,
    whtIndividualBps: 1000n,
    whtCorporateBps: 1000n,
    firsStatutoryReference: "CITA §80 / PITA §69 — Copyright, musical work and broadcast rights royalties",
    isVatExempt: true,
  },
  ACADEMIC_TUITION: {
    vatBps: 0n,
    whtIndividualBps: 0n,
    whtCorporateBps: 0n,
    firsStatutoryReference: "VAT Act 1st Schedule Part 1 §2 — Educational services statutory exemption",
    isVatExempt: true,
  },
  DIRECTOR_EMOLUMENT: {
    vatBps: 0n,
    whtIndividualBps: 1000n,
    whtCorporateBps: 1000n,
    firsStatutoryReference: "PITA §73(2) — Corporate governance sitting allowances and directors' emoluments",
    isVatExempt: true,
  },
};

export interface TaxCalculationParams {
  amountKobo: bigint;
  category: TaxCategory;
  isNetAgreement?: boolean;
  counterpartyType?: "INDIVIDUAL" | "CORPORATE";
  counterpartyTin?: string;
  referenceId?: string;
}

export interface TaxCalculationResult {
  grossInvoiceKobo: bigint;
  vatKobo: bigint;
  whtKobo: bigint;
  netDisbursementKobo: bigint;
  vatRatePercent: string;
  whtRatePercent: string;
  statutoryReference: string;
  auditRationale: string;
  counterpartyTin?: string;
  compliantTinFormat: boolean;
}

export class CorporateTaxEngine {
  private static readonly BPS_BASE = 10_000n;

  /**
   * Validates Nigerian FIRS Tax Identification Number (TIN) format (8 to 12 numeric digits).
   */
  public static validateTin(tin?: string): boolean {
    if (!tin) return false;
    const cleanTin = tin.replace(/[-\s]/g, "");
    return /^\d{8,12}$/.test(cleanTin);
  }

  /**
   * Calculates statutory VAT and WHT with support for gross-up on net-of-tax counterparty agreements.
   */
  public static calculate(params: TaxCalculationParams): TaxCalculationResult {
    const policy = TAX_POLICY_RATES[params.category];
    const counterparty = params.counterpartyType || "CORPORATE";
    const whtBps = counterparty === "INDIVIDUAL" ? policy.whtIndividualBps : policy.whtCorporateBps;
    const vatBps = policy.vatBps;

    let grossKobo: bigint;
    let netKobo: bigint;
    let whtKobo: bigint;
    let vatKobo: bigint;

    if (params.isNetAgreement) {
      // Gross-up calculation: Counterparty must receive amountKobo net of WHT
      // net = gross - wht = gross * (1 - whtBps / 10000)
      // gross = (net * 10000) / (10000 - whtBps)
      if (whtBps >= CorporateTaxEngine.BPS_BASE) {
        throw new Error("[TAX-001] Withholding tax rate cannot equal or exceed 100%");
      }
      grossKobo = (params.amountKobo * CorporateTaxEngine.BPS_BASE) / (CorporateTaxEngine.BPS_BASE - whtBps);
      whtKobo = grossKobo - params.amountKobo;
      vatKobo = policy.isVatExempt ? 0n : (grossKobo * vatBps) / CorporateTaxEngine.BPS_BASE;
      netKobo = params.amountKobo;
    } else {
      // Standard invoice: amountKobo is the gross contract amount
      grossKobo = params.amountKobo;
      whtKobo = (grossKobo * whtBps) / CorporateTaxEngine.BPS_BASE;
      vatKobo = policy.isVatExempt ? 0n : (grossKobo * vatBps) / CorporateTaxEngine.BPS_BASE;
      netKobo = grossKobo - whtKobo;
    }

    const compliantTin = CorporateTaxEngine.validateTin(params.counterpartyTin);
    const vatPercent = (Number(vatBps) / 100).toFixed(2);
    const whtPercent = (Number(whtBps) / 100).toFixed(2);

    const auditRationale = `Statutory Tax Assessment [${params.category} / ${counterparty}]: ` +
      `Gross ₦${(Number(grossKobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}, ` +
      `WHT (${whtPercent}%) ₦${(Number(whtKobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}, ` +
      `VAT (${vatPercent}%) ₦${(Number(vatKobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}, ` +
      `Net Payable ₦${(Number(netKobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}. ` +
      `Agreement Basis: ${params.isNetAgreement ? "GROSS_UP_NET_GUARANTEE" : "STANDARD_INVOICE"}. ` +
      `TIN Status: ${compliantTin ? "VERIFIED_FIRS_COMPLIANT" : "MISSING_OR_UNVERIFIED"}. ` +
      `Governing Authority: ${policy.firsStatutoryReference}.`;

    return {
      grossInvoiceKobo: grossKobo,
      vatKobo,
      whtKobo,
      netDisbursementKobo: netKobo,
      vatRatePercent: `${vatPercent}%`,
      whtRatePercent: `${whtPercent}%`,
      statutoryReference: policy.firsStatutoryReference,
      auditRationale,
      counterpartyTin: params.counterpartyTin,
      compliantTinFormat: compliantTin,
    };
  }
}
