/**
 * Virtual Content Fund (VCF) Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §31 / VMNL-AZP-VMN-CCPP-001 §13
 *
 * Core Mandate:
 * Creative slate financing, pitch pipeline, investment evaluation rubrics,
 * production milestone disbursement, and multi-tier revenue recoupment waterfalls.
 */

export type ContentFormat = "FEATURE_FILM" | "EPISODIC_SERIES" | "DOCUMENTARY" | "CREATOR_SHORT" | "FORMAT_REALITY";

export type PitchStatus = "SUBMITTED" | "UNDER_REVIEW" | "REJECTED" | "GREENLIT" | "CONTRACTED";

export type SlateStage =
  | "DEVELOPMENT"
  | "PRE_PRODUCTION"
  | "PRODUCTION"
  | "POST_PRODUCTION"
  | "DELIVERY"
  | "DISTRIBUTION"
  | "RECOUPED";

export interface PitchSubmission {
  id: string;
  creatorId: string;
  title: string;
  logline: string;
  synopsis: string;
  format: ContentFormat;
  targetAudience: string;
  budgetEstimateNgn: number;
  treatmentDeckUrl: string;
  status: PitchStatus;
  submittedAt: Date;
  evaluation?: InvestmentEvaluation;
}

export interface InvestmentEvaluation {
  evaluatedBy: string;
  evaluatedAt: Date;
  commercialViability: number; // 0 - 100 (Weight: 35%)
  culturalRelevance: number; // 0 - 100 (Weight: 25%)
  distributionPotential: number; // 0 - 100 (Weight: 25%)
  productionFeasibility: number; // 0 - 100 (Weight: 15%)
  compositeScore: number; // 0 - 100
  recommendedAction: "APPROVE_GREENLIGHT" | "REVISE_RESUBMIT" | "DECLINE";
  notes?: string;
}

export interface SlateProject {
  id: string;
  pitchId: string;
  title: string;
  creatorId: string;
  format: ContentFormat;
  stage: SlateStage;
  approvedBudgetNgn: number;
  disbursedCapitalNgn: number;
  seniorInvestorPrincipalNgn: number;
  seniorInvestorRecoupedNgn: number;
  preferredReturnRate: number; // e.g. 0.10 for 10%
  totalGrossRevenueIncurredNgn: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaterfallDistribution {
  grossRevenueNgn: number;
  distributionFeeNgn: number; // e.g. 15%
  distributionExpensesNgn: number; // P&A deductions
  netReceivableNgn: number;
  seniorInvestorRecoupmentNgn: number;
  preferredReturnPaidNgn: number;
  netProfitsNgn: number;
  investorProfitShareNgn: number; // e.g. 50%
  producerProfitShareNgn: number; // e.g. 50%
  isFullyRecouped: boolean;
}

export class VirtualContentFundEngine {
  private pitches = new Map<string, PitchSubmission>();
  private slate = new Map<string, SlateProject>();

  public submitPitch(params: Omit<PitchSubmission, "status" | "submittedAt" | "evaluation">): PitchSubmission {
    if (this.pitches.has(params.id)) {
      throw new Error(`[VCF-PTC-01] Pitch '${params.id}' already exists.`);
    }

    const pitch: PitchSubmission = {
      ...params,
      status: "SUBMITTED",
      submittedAt: new Date(),
    };

    this.pitches.set(pitch.id, pitch);
    return pitch;
  }

  public evaluatePitch(
    pitchId: string,
    evaluatorId: string,
    scores: {
      commercialViability: number;
      culturalRelevance: number;
      distributionPotential: number;
      productionFeasibility: number;
      notes?: string;
    }
  ): InvestmentEvaluation {
    const pitch = this.getPitchOrThrow(pitchId);

    const { commercialViability, culturalRelevance, distributionPotential, productionFeasibility } = scores;
    for (const [k, v] of Object.entries(scores)) {
      if (typeof v === "number" && (v < 0 || v > 100)) {
        throw new Error(`[VCF-EVL-01] Score for '${k}' must be between 0 and 100.`);
      }
    }

    // Weighted composite score calculation: 35% commercial, 25% cultural, 25% distribution, 15% feasibility
    const compositeScore = Math.round(
      commercialViability * 0.35 +
      culturalRelevance * 0.25 +
      distributionPotential * 0.25 +
      productionFeasibility * 0.15
    );

    let recommendedAction: InvestmentEvaluation["recommendedAction"] = "DECLINE";
    if (compositeScore >= 75) {
      recommendedAction = "APPROVE_GREENLIGHT";
    } else if (compositeScore >= 60) {
      recommendedAction = "REVISE_RESUBMIT";
    }

    const evaluation: InvestmentEvaluation = {
      evaluatedBy: evaluatorId,
      evaluatedAt: new Date(),
      commercialViability,
      culturalRelevance,
      distributionPotential,
      productionFeasibility,
      compositeScore,
      recommendedAction,
      notes: scores.notes,
    };

    pitch.evaluation = evaluation;
    pitch.status = recommendedAction === "APPROVE_GREENLIGHT" ? "GREENLIT" : "UNDER_REVIEW";
    return evaluation;
  }

  public greenlightToSlate(
    pitchId: string,
    params: {
      projectId: string;
      approvedBudgetNgn: number;
      seniorInvestorPrincipalNgn: number;
      preferredReturnRate?: number;
    }
  ): SlateProject {
    const pitch = this.getPitchOrThrow(pitchId);
    if (pitch.status !== "GREENLIT") {
      throw new Error(`[VCF-SLT-01] Cannot greenlight pitch in '${pitch.status}' state. Must be 'GREENLIT'.`);
    }

    const project: SlateProject = {
      id: params.projectId,
      pitchId,
      title: pitch.title,
      creatorId: pitch.creatorId,
      format: pitch.format,
      stage: "DEVELOPMENT",
      approvedBudgetNgn: params.approvedBudgetNgn,
      disbursedCapitalNgn: 0,
      seniorInvestorPrincipalNgn: params.seniorInvestorPrincipalNgn,
      seniorInvestorRecoupedNgn: 0,
      preferredReturnRate: params.preferredReturnRate ?? 0.1,
      totalGrossRevenueIncurredNgn: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.slate.set(project.id, project);
    pitch.status = "CONTRACTED";
    return project;
  }

  public advanceStage(projectId: string, nextStage: SlateStage): SlateProject {
    const project = this.getSlateProjectOrThrow(projectId);
    project.stage = nextStage;
    project.updatedAt = new Date();
    return project;
  }

  public disburseCapital(projectId: string, amountNgn: number): SlateProject {
    const project = this.getSlateProjectOrThrow(projectId);
    if (project.disbursedCapitalNgn + amountNgn > project.approvedBudgetNgn) {
      throw new Error(
        `[VCF-CAP-01] Disbursed capital (${project.disbursedCapitalNgn + amountNgn}) exceeds approved budget (${project.approvedBudgetNgn}).`
      );
    }
    project.disbursedCapitalNgn += amountNgn;
    project.updatedAt = new Date();
    return project;
  }

  /**
   * Recoupment & Waterfall Accounting Engine.
   * Adheres to standard Nigerian & international distribution waterfalls:
   * 1. 15% Distribution commission.
   * 2. Direct P&A / distribution expenses.
   * 3. Senior investor principal recoupment + preferred return (e.g. 10%).
   * 4. 50/50 Net profit split between Investors and Producers/Creators.
   */
  public calculateWaterfall(
    projectId: string,
    grossRevenueNgn: number,
    distributionExpensesNgn: number = 0
  ): WaterfallDistribution {
    const project = this.getSlateProjectOrThrow(projectId);
    if (grossRevenueNgn < 0 || distributionExpensesNgn < 0) {
      throw new Error("[VCF-WTF-01] Gross revenue and distribution expenses must be non-negative.");
    }

    const distributionFeeRate = 0.15; // 15% standard distribution fee
    const distributionFeeNgn = Math.round(grossRevenueNgn * distributionFeeRate);
    const netReceivableNgn = Math.max(0, grossRevenueNgn - distributionFeeNgn - distributionExpensesNgn);

    // Calculate investor target: Principal + preferred return
    const totalSeniorTargetNgn = Math.round(
      project.seniorInvestorPrincipalNgn * (1 + project.preferredReturnRate)
    );
    const remainingSeniorToRecoupNgn = Math.max(
      0,
      totalSeniorTargetNgn - project.seniorInvestorRecoupedNgn
    );

    let seniorInvestorRecoupmentNgn: number;
    const preferredReturnPaidNgn = 0;
    let netProfitsNgn = 0;
    let investorProfitShareNgn = 0;
    let producerProfitShareNgn = 0;

    if (netReceivableNgn <= remainingSeniorToRecoupNgn) {
      seniorInvestorRecoupmentNgn = netReceivableNgn;
      project.seniorInvestorRecoupedNgn += netReceivableNgn;
    } else {
      seniorInvestorRecoupmentNgn = remainingSeniorToRecoupNgn;
      project.seniorInvestorRecoupedNgn += remainingSeniorToRecoupNgn;
      netProfitsNgn = netReceivableNgn - remainingSeniorToRecoupNgn;

      // 50/50 Profit Split
      investorProfitShareNgn = Math.round(netProfitsNgn * 0.5);
      producerProfitShareNgn = netProfitsNgn - investorProfitShareNgn;
    }

    const isFullyRecouped = project.seniorInvestorRecoupedNgn >= totalSeniorTargetNgn;
    if (isFullyRecouped && project.stage === "DISTRIBUTION") {
      project.stage = "RECOUPED";
    }

    project.totalGrossRevenueIncurredNgn += grossRevenueNgn;
    project.updatedAt = new Date();

    return {
      grossRevenueNgn,
      distributionFeeNgn,
      distributionExpensesNgn,
      netReceivableNgn,
      seniorInvestorRecoupmentNgn,
      preferredReturnPaidNgn,
      netProfitsNgn,
      investorProfitShareNgn,
      producerProfitShareNgn,
      isFullyRecouped,
    };
  }

  public getPitch(id: string): PitchSubmission | undefined {
    return this.pitches.get(id);
  }

  public getSlateProject(id: string): SlateProject | undefined {
    return this.slate.get(id);
  }

  private getPitchOrThrow(id: string): PitchSubmission {
    const pitch = this.pitches.get(id);
    if (!pitch) {
      throw new Error(`[VCF-ERR-404] Pitch submission '${id}' not found.`);
    }
    return pitch;
  }

  private getSlateProjectOrThrow(id: string): SlateProject {
    const project = this.slate.get(id);
    if (!project) {
      throw new Error(`[VCF-ERR-404] Slate project '${id}' not found.`);
    }
    return project;
  }
}
