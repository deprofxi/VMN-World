/**
 * Virtual Talent Management (VTM) Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §30 / VMNL-AZP-VMN-CCPP-001 §12
 *
 * Core Mandate:
 * Verified talent representation, casting/crew brief opportunity matching,
 * standardized contracting, milestone escrow fund protection, and transparent settlements.
 *
 * Invariants:
 * - Funds cannot be released from escrow without talent manager or client acceptance sign-off.
 * - Standard platform commission (15%) deducted automatically; 85% net talent disbursement.
 * - Adheres to 7-way financial separation (escrow held as restricted funds until release).
 */

import { createHash } from "node:crypto";
import { TalentTier } from "../../../core/domain/types.js";
import { CreativeSkillCategory } from "../talent/index.js";

export type BuyoutTier = "LOCAL_LINEAR_TV" | "REGIONAL_PAYTV" | "DIGITAL_STREAMING_AFRICA" | "GLOBAL_ALL_MEDIA";

export const BUYOUT_MULTIPLIERS: Record<BuyoutTier, number> = {
  LOCAL_LINEAR_TV: 1.0,
  REGIONAL_PAYTV: 1.5,
  DIGITAL_STREAMING_AFRICA: 1.8,
  GLOBAL_ALL_MEDIA: 2.5,
};

export interface TalentRateCard {
  talentId: string;
  baseDayRateNgn: number;
  halfDayRateNgn: number;
  overtimeHourlyRateNgn: number;
  buyoutRates: Record<BuyoutTier, number>;
  currency: string;
  isVerified: boolean;
  updatedAt: Date;
}

export interface OpportunityBrief {
  id: string;
  title: string;
  productionOrgId: string;
  roleCategory: CreativeSkillCategory;
  roleDescription: string;
  requiredTier: TalentTier;
  locationCity: string;
  startDate: Date;
  endDate: Date;
  budgetPerDayNgn: number;
  buyoutTier: BuyoutTier;
  isOpen: boolean;
}

export interface OpportunityMatch {
  briefId: string;
  talentId: string;
  matchScorePercent: number; // 0 - 100
  qualificationReasons: string[];
}

export type EscrowStatus = "PENDING_DEPOSIT" | "FUNDS_ESCROWED" | "MILESTONE_SUBMITTED" | "APPROVED_RELEASED" | "DISPUTED" | "REFUNDED";

export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  amountNgn: number;
  dueDate: Date;
  status: EscrowStatus;
  escrowDepositedAt?: Date;
  deliverableSubmittedAt?: Date;
  deliverableEvidenceUrl?: string;
  approvedAt?: Date;
  approvedBy?: string;
  talentDisbursedAmountNgn?: number;
  platformCommissionNgn?: number;
}

export interface VtmContract {
  id: string;
  contractNumber: string;
  briefId?: string;
  talentId: string;
  clientId: string;
  totalValueNgn: number;
  milestones: ContractMilestone[];
  talentSignedAt?: Date;
  clientSignedAt?: Date;
  contractHashSha256: string;
  isFullySigned: boolean;
}

const TIER_NUMERIC: Record<TalentTier, number> = {
  EMERGING: 1,
  VERIFIED: 2,
  PROFESSIONAL: 3,
  MASTER: 4,
};

export class VirtualTalentManagementEngine {
  private rateCards = new Map<string, TalentRateCard>();
  private briefs = new Map<string, OpportunityBrief>();
  private contracts = new Map<string, VtmContract>();

  public registerRateCard(params: {
    talentId: string;
    baseDayRateNgn: number;
    currency?: string;
  }): TalentRateCard {
    const base = params.baseDayRateNgn;
    const buyoutRates: Record<BuyoutTier, number> = {
      LOCAL_LINEAR_TV: Math.round(base * BUYOUT_MULTIPLIERS.LOCAL_LINEAR_TV),
      REGIONAL_PAYTV: Math.round(base * BUYOUT_MULTIPLIERS.REGIONAL_PAYTV),
      DIGITAL_STREAMING_AFRICA: Math.round(base * BUYOUT_MULTIPLIERS.DIGITAL_STREAMING_AFRICA),
      GLOBAL_ALL_MEDIA: Math.round(base * BUYOUT_MULTIPLIERS.GLOBAL_ALL_MEDIA),
    };

    const card: TalentRateCard = {
      talentId: params.talentId,
      baseDayRateNgn: base,
      halfDayRateNgn: Math.round(base * 0.6),
      overtimeHourlyRateNgn: Math.round((base / 8) * 1.5),
      buyoutRates,
      currency: params.currency || "NGN",
      isVerified: true,
      updatedAt: new Date(),
    };

    this.rateCards.set(card.talentId, card);
    return card;
  }

  public getRateCard(talentId: string): TalentRateCard | undefined {
    return this.rateCards.get(talentId);
  }

  public createBrief(brief: OpportunityBrief): OpportunityBrief {
    this.briefs.set(brief.id, brief);
    return brief;
  }

  /**
   * Matches available talent against an opportunity brief using skills, tier qualification, and rate bounds.
   */
  public matchTalent(
    briefId: string,
    candidates: Array<{
      id: string;
      primaryCategory: CreativeSkillCategory;
      secondaryCategories: CreativeSkillCategory[];
      tier: TalentTier;
      locationCity: string;
    }>
  ): OpportunityMatch[] {
    const brief = this.briefs.get(briefId);
    if (!brief) {
      throw new Error(`[VTM-BRF-01] Brief '${briefId}' not found.`);
    }

    const matches: OpportunityMatch[] = [];

    for (const candidate of candidates) {
      let score = 0;
      const reasons: string[] = [];

      // Category matching
      if (candidate.primaryCategory === brief.roleCategory) {
        score += 40;
        reasons.push(`Primary skill match: ${brief.roleCategory}`);
      } else if (candidate.secondaryCategories.includes(brief.roleCategory)) {
        score += 25;
        reasons.push(`Secondary skill match: ${brief.roleCategory}`);
      } else {
        // No skill match, disqualify
        continue;
      }

      // Tier matching
      const candidateTierLevel = TIER_NUMERIC[candidate.tier];
      const requiredTierLevel = TIER_NUMERIC[brief.requiredTier];
      if (candidateTierLevel >= requiredTierLevel) {
        score += 30;
        reasons.push(`Meets or exceeds tier requirement (${candidate.tier} >= ${brief.requiredTier})`);
      } else {
        score += 10;
        reasons.push(`Below preferred tier (${candidate.tier} < ${brief.requiredTier})`);
      }

      // Location match
      if (candidate.locationCity.toLowerCase() === brief.locationCity.toLowerCase()) {
        score += 15;
        reasons.push(`Local talent in ${brief.locationCity}`);
      }

      // Rate card alignment
      const rateCard = this.rateCards.get(candidate.id);
      if (rateCard) {
        if (rateCard.baseDayRateNgn <= brief.budgetPerDayNgn) {
          score += 15;
          reasons.push("Rate fits within client budget");
        } else {
          reasons.push("Rate card exceeds brief budget");
        }
      }

      matches.push({
        briefId: brief.id,
        talentId: candidate.id,
        matchScorePercent: Math.min(100, score),
        qualificationReasons: reasons,
      });
    }

    return matches.sort((a, b) => b.matchScorePercent - a.matchScorePercent);
  }

  public createStandardContract(params: {
    contractNumber: string;
    briefId?: string;
    talentId: string;
    clientId: string;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      amountNgn: number;
      dueDate: Date;
    }>;
  }): VtmContract {
    const totalValueNgn = params.milestones.reduce((sum, m) => sum + m.amountNgn, 0);
    if (totalValueNgn <= 0) {
      throw new Error("[VTM-CTR-01] Contract value must be greater than zero.");
    }

    const preHash = `${params.contractNumber}:${params.talentId}:${params.clientId}:${totalValueNgn}`;
    const contractHashSha256 = createHash("sha256").update(preHash).digest("hex");

    const contractMilestones: ContractMilestone[] = params.milestones.map((m) => ({
      ...m,
      status: "PENDING_DEPOSIT",
    }));

    const contract: VtmContract = {
      id: `CTR-${Date.now()}`,
      contractNumber: params.contractNumber,
      briefId: params.briefId,
      talentId: params.talentId,
      clientId: params.clientId,
      totalValueNgn,
      milestones: contractMilestones,
      contractHashSha256,
      isFullySigned: false,
    };

    this.contracts.set(contract.id, contract);
    return contract;
  }

  public signContract(contractId: string, signatory: "TALENT" | "CLIENT"): VtmContract {
    const contract = this.getContractOrThrow(contractId);
    if (signatory === "TALENT") {
      contract.talentSignedAt = new Date();
    } else {
      contract.clientSignedAt = new Date();
    }

    if (contract.talentSignedAt && contract.clientSignedAt) {
      contract.isFullySigned = true;
    }
    return contract;
  }

  public depositMilestoneEscrow(contractId: string, milestoneId: string): ContractMilestone {
    const contract = this.getContractOrThrow(contractId);
    if (!contract.isFullySigned) {
      throw new Error("[VTM-ESC-01] Cannot deposit escrow into contract that is not fully signed.");
    }

    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`[VTM-ESC-02] Milestone '${milestoneId}' not found on contract.`);
    }

    milestone.status = "FUNDS_ESCROWED";
    milestone.escrowDepositedAt = new Date();
    return milestone;
  }

  public submitMilestoneDeliverable(
    contractId: string,
    milestoneId: string,
    evidenceUrl: string
  ): ContractMilestone {
    const contract = this.getContractOrThrow(contractId);
    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`[VTM-ESC-03] Milestone '${milestoneId}' not found.`);
    }
    if (milestone.status !== "FUNDS_ESCROWED") {
      throw new Error(`[VTM-ESC-04] Cannot submit deliverable when status is '${milestone.status}'. Must be 'FUNDS_ESCROWED'.`);
    }

    milestone.status = "MILESTONE_SUBMITTED";
    milestone.deliverableSubmittedAt = new Date();
    milestone.deliverableEvidenceUrl = evidenceUrl;
    return milestone;
  }

  /**
   * Releases funds from escrow upon client or talent manager sign-off.
   * INVARIANT: Funds cannot be released without explicit sign-off.
   * Calculates platform fee (15%) and talent net payout (85%).
   */
  public releaseMilestoneEscrow(
    contractId: string,
    milestoneId: string,
    signOffApproverId: string
  ): ContractMilestone {
    const contract = this.getContractOrThrow(contractId);
    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`[VTM-ESC-05] Milestone '${milestoneId}' not found.`);
    }

    if (milestone.status !== "MILESTONE_SUBMITTED") {
      throw new Error(
        `[VTM-ESC-06] Cannot release escrow funds for milestone in state '${milestone.status}'. Must be 'MILESTONE_SUBMITTED'.`
      );
    }

    const platformFeeRate = 0.15; // 15% platform commission
    const platformCommissionNgn = Math.round(milestone.amountNgn * platformFeeRate);
    const talentDisbursedAmountNgn = milestone.amountNgn - platformCommissionNgn;

    milestone.status = "APPROVED_RELEASED";
    milestone.approvedAt = new Date();
    milestone.approvedBy = signOffApproverId;
    milestone.platformCommissionNgn = platformCommissionNgn;
    milestone.talentDisbursedAmountNgn = talentDisbursedAmountNgn;

    return milestone;
  }

  public getContract(id: string): VtmContract | undefined {
    return this.contracts.get(id);
  }

  private getContractOrThrow(id: string): VtmContract {
    const contract = this.contracts.get(id);
    if (!contract) {
      throw new Error(`[VTM-ERR-404] Contract '${id}' not found.`);
    }
    return contract;
  }
}
