/**
 * Statutory Corporate Contract Execution Workbench
 * Governing Authority: Companies and Allied Matters Act (CAMA 2020 §102)
 * VMN Legal Master R1.1 · GOV-008 to GOV-012 · FLOW-13
 *
 * Implements statutory dual-signatory digital execution workflows requiring
 * verifiable corporate officer signatures before a draft contract transitions
 * to LEGALLY_BINDING.
 */

import crypto from "node:crypto";

export type ContractLifecycle =
  | "DRAFT"
  | "LEGAL_REVIEW"
  | "PENDING_EXECUTION"
  | "LEGALLY_BINDING"
  | "TERMINATED"
  | "SUPERSEDED";

export type CorporateSignatoryRole = "Director" | "CompanySecretary" | "ExecutiveChairman";

export interface CorporateSignatory {
  signatoryId: string;
  name: string;
  role: CorporateSignatoryRole;
  digitalSignatureRef: string;
  signedAtEpochSec: number;
}

export interface StatutoryContractTerms {
  contractId: string;
  contractNumber: string;
  title: string;
  counterpartyName: string;
  counterpartyTin?: string;
  totalCommitmentKobo: bigint;
  governingLaw: string;
  contentHashSha256: string;
}

export interface ContractExecutionResult {
  contractId: string;
  contractNumber: string;
  status: ContractLifecycle;
  legallyBinding: boolean;
  signatories: CorporateSignatory[];
  executionSealSha256?: string;
  complianceNotes: string[];
}

export class StatutoryContractWorkbench {
  /**
   * Verifies CAMA 2020 §102 execution requirements:
   * A document is validly executed by a company if signed by:
   * (a) two directors, OR
   * (b) one director and the company secretary.
   */
  public static validateCamaDualSignatory(signatories: CorporateSignatory[]): { valid: boolean; reason?: string } {
    if (signatories.length < 2) {
      return {
        valid: false,
        reason: "CAMA 2020 §102 Violation: Company execution requires at least two authorized corporate officers.",
      };
    }

    const directors = signatories.filter((s) => s.role === "Director" || s.role === "ExecutiveChairman");
    const secretaries = signatories.filter((s) => s.role === "CompanySecretary");

    // Case 1: Two directors
    if (directors.length >= 2) {
      return { valid: true };
    }

    // Case 2: One director and one company secretary
    if (directors.length >= 1 && secretaries.length >= 1) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: "CAMA 2020 §102 Violation: Execution requires either two Directors, or one Director and the Company Secretary.",
    };
  }

  /**
   * Executes a contract into LEGALLY_BINDING status with cryptographic sealing.
   */
  public static executeContract(
    terms: StatutoryContractTerms,
    signatories: CorporateSignatory[],
    legalApprovalReference?: string
  ): ContractExecutionResult {
    const complianceNotes: string[] = [];

    // 1. Verify Legal Review Gate
    if (!legalApprovalReference) {
      return {
        contractId: terms.contractId,
        contractNumber: terms.contractNumber,
        status: "PENDING_EXECUTION",
        legallyBinding: false,
        signatories,
        complianceNotes: ["Execution refused: Contract lacks mandatory legal counsel approval reference (GOV-009)."],
      };
    }

    // 2. Validate CAMA Dual-Signatory Rule
    const signatoryValidation = StatutoryContractWorkbench.validateCamaDualSignatory(signatories);
    if (!signatoryValidation.valid) {
      return {
        contractId: terms.contractId,
        contractNumber: terms.contractNumber,
        status: "PENDING_EXECUTION",
        legallyBinding: false,
        signatories,
        complianceNotes: [signatoryValidation.reason || "Signatory validation failed."],
      };
    }

    // 3. Compute Cryptographic Execution Seal (SHA-256)
    const sealPayload = JSON.stringify({
      contractId: terms.contractId,
      contractNumber: terms.contractNumber,
      contentHash: terms.contentHashSha256,
      commitmentKobo: terms.totalCommitmentKobo.toString(),
      legalRef: legalApprovalReference,
      signatories: signatories.map((s) => ({
        id: s.signatoryId,
        name: s.name,
        role: s.role,
        sig: s.digitalSignatureRef,
        t: s.signedAtEpochSec,
      })),
    });

    const executionSealSha256 = crypto.createHash("sha256").update(sealPayload).digest("hex");

    complianceNotes.push("Executed in full statutory compliance with CAMA 2020 §102.");
    complianceNotes.push(`Sealed with cryptographic audit hash: ${executionSealSha256}`);

    return {
      contractId: terms.contractId,
      contractNumber: terms.contractNumber,
      status: "LEGALLY_BINDING",
      legallyBinding: true,
      signatories,
      executionSealSha256,
      complianceNotes,
    };
  }
}
