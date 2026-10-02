/**
 * VMNL Talent Accelerator Platform / Network
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §27 / VMNL-AZP-VMN-CCPP-001 §11
 *
 * Core Mandate:
 * Distributed partner-led talent-development network across Nigeria.
 * Discovery, structured onboarding, tier assignment, verification badges, and partner hub directory.
 */

import { createHash } from "node:crypto";
import { KycStatus, TalentTier } from "../../../core/domain/types.js";
import { getConfig } from "../../../core/config/index.js";

export type TalentOnboardingStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export type CreativeSkillCategory =
  | "ACTING"
  | "DIRECTING"
  | "CINEMATOGRAPHY"
  | "EDITING"
  | "SOUND_DESIGN"
  | "SCREENWRITING"
  | "VFX_ANIMATION"
  | "PRODUCTION_MANAGEMENT"
  | "COSTUME_STYLING"
  | "HAIR_MAKEUP"
  | "VOICEOVER";

export interface PortfolioItem {
  id: string;
  title: string;
  role: CreativeSkillCategory;
  mediaUrl: string;
  year: number;
  description?: string;
  verifiedCredit: boolean;
}

export interface SkillAssessment {
  category: CreativeSkillCategory;
  score: number; // 0 - 100
  assessedBy: string;
  assessedAt: Date;
  notes?: string;
}

export interface TalentVerificationBadge {
  tokenId: string;
  tier: TalentTier;
  issuedAt: Date;
  checksumSha256: string;
  verificationUrl: string;
}

export interface TalentAcceleratorProfile {
  id: string;
  personId: string;
  fullName: string;
  stageName?: string;
  primaryCategory: CreativeSkillCategory;
  secondaryCategories: CreativeSkillCategory[];
  tier: TalentTier;
  status: TalentOnboardingStatus;
  kycStatus: KycStatus;
  locationCity: string;
  locationState: string;
  partnerHubId?: string;
  portfolio: PortfolioItem[];
  assessments: SkillAssessment[];
  dayRateNgn: number;
  badge?: TalentVerificationBadge;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerHub {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  leadCoordinator: string;
  contactEmail: string;
  facilitiesAvailable: string[];
  activeTalentCount: number;
  isAccredited: boolean;
}

export const NATIONAL_PARTNER_HUBS: PartnerHub[] = [
  {
    id: "HUB-LOS-001",
    name: "Lagos Creative Hub (VMN Campus)",
    city: "Lagos",
    state: "Lagos",
    address: "Plot 12 Commercial Avenue, Ikeja, Lagos",
    leadCoordinator: "Babatunde Adeleke",
    contactEmail: "lagos-hub@vmnl.ng",
    facilitiesAvailable: ["Podcast Studio", "Editing Suites", "Soundstage", "Rehearsal Hall"],
    activeTalentCount: 350,
    isAccredited: true,
  },
  {
    id: "HUB-ABJ-001",
    name: "Abuja Media Innovation Lab",
    city: "Abuja",
    state: "FCT",
    address: "Central Business District, Abuja",
    leadCoordinator: "Amina Yusuf",
    contactEmail: "abuja-hub@vmnl.ng",
    facilitiesAvailable: ["Screening Room", "Audio Booth", "Coworking Space"],
    activeTalentCount: 180,
    isAccredited: true,
  },
  {
    id: "HUB-PHC-001",
    name: "Niger Delta Creative Incubator",
    city: "Port Harcourt",
    state: "Rivers",
    address: "Trans-Amadi Industrial Layout, Port Harcourt",
    leadCoordinator: "Tamuno Briggs",
    contactEmail: "phc-hub@vmnl.ng",
    facilitiesAvailable: ["Camera Workshop", "Edit Lab", "Green Screen Stage"],
    activeTalentCount: 140,
    isAccredited: true,
  },
  {
    id: "HUB-ENU-001",
    name: "Enugu Eastern Film Workshop",
    city: "Enugu",
    state: "Enugu",
    address: "Independence Layout, Enugu",
    leadCoordinator: "Chidiebere Okonkwo",
    contactEmail: "enugu-hub@vmnl.ng",
    facilitiesAvailable: ["Acting Studio", "Lighting Grid", "Co-working"],
    activeTalentCount: 160,
    isAccredited: true,
  },
  {
    id: "HUB-KAN-001",
    name: "Kano Media & Cultural Guild",
    city: "Kano",
    state: "Kano",
    address: "Nasarawa GRA, Kano",
    leadCoordinator: "Ibrahim Sani",
    contactEmail: "kano-hub@vmnl.ng",
    facilitiesAvailable: ["Voiceover Studio", "Translation Lab", "Script Room"],
    activeTalentCount: 110,
    isAccredited: true,
  },
  {
    id: "HUB-IBD-001",
    name: "Ibadan Heritage & Arts Center",
    city: "Ibadan",
    state: "Oyo",
    address: "Bodija, Ibadan",
    leadCoordinator: "Oluwaseun Alabi",
    contactEmail: "ibadan-hub@vmnl.ng",
    facilitiesAvailable: ["Rehearsal Space", "Screening Lounge"],
    activeTalentCount: 95,
    isAccredited: true,
  },
];

export interface TalentFilterCriteria {
  category?: CreativeSkillCategory;
  tier?: TalentTier;
  state?: string;
  status?: TalentOnboardingStatus;
  maxDayRateNgn?: number;
  minAssessmentScore?: number;
  partnerHubId?: string;
}

export class TalentAcceleratorRegistry {
  private profiles = new Map<string, TalentAcceleratorProfile>();
  private hubs = new Map<string, PartnerHub>();

  constructor() {
    for (const hub of NATIONAL_PARTNER_HUBS) {
      this.hubs.set(hub.id, hub);
    }
  }

  public registerTalent(params: {
    id: string;
    personId: string;
    fullName: string;
    stageName?: string;
    primaryCategory: CreativeSkillCategory;
    secondaryCategories?: CreativeSkillCategory[];
    locationCity: string;
    locationState: string;
    partnerHubId?: string;
    dayRateNgn?: number;
  }): TalentAcceleratorProfile {
    if (this.profiles.has(params.id)) {
      throw new Error(`[TALENT-REG-01] Talent with ID '${params.id}' already exists.`);
    }

    if (params.partnerHubId && !this.hubs.has(params.partnerHubId)) {
      throw new Error(`[TALENT-REG-02] Partner Hub '${params.partnerHubId}' not recognized.`);
    }

    const profile: TalentAcceleratorProfile = {
      id: params.id,
      personId: params.personId,
      fullName: params.fullName,
      stageName: params.stageName,
      primaryCategory: params.primaryCategory,
      secondaryCategories: params.secondaryCategories || [],
      tier: "EMERGING",
      status: "DRAFT",
      kycStatus: "PENDING",
      locationCity: params.locationCity,
      locationState: params.locationState,
      partnerHubId: params.partnerHubId,
      portfolio: [],
      assessments: [],
      dayRateNgn: params.dayRateNgn ?? 25000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  public addPortfolioItem(talentId: string, item: Omit<PortfolioItem, "id">): PortfolioItem {
    const profile = this.getProfileOrThrow(talentId);
    const portfolioItem: PortfolioItem = {
      ...item,
      id: `PORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    profile.portfolio.push(portfolioItem);
    profile.updatedAt = new Date();
    return portfolioItem;
  }

  public recordAssessment(talentId: string, assessment: SkillAssessment): SkillAssessment {
    const profile = this.getProfileOrThrow(talentId);
    if (assessment.score < 0 || assessment.score > 100) {
      throw new Error("[TALENT-ASSESS-01] Assessment score must be between 0 and 100.");
    }
    profile.assessments.push(assessment);
    profile.updatedAt = new Date();
    return assessment;
  }

  public submitForReview(talentId: string): TalentAcceleratorProfile {
    const profile = this.getProfileOrThrow(talentId);
    if (profile.status !== "DRAFT") {
      throw new Error(`[TALENT-STATE-01] Cannot submit from status '${profile.status}'. Must be 'DRAFT'.`);
    }
    if (profile.portfolio.length === 0) {
      throw new Error("[TALENT-STATE-02] Cannot submit for review without at least one portfolio item.");
    }
    profile.status = "SUBMITTED";
    profile.updatedAt = new Date();
    return profile;
  }

  public startReview(talentId: string): TalentAcceleratorProfile {
    const profile = this.getProfileOrThrow(talentId);
    if (profile.status !== "SUBMITTED") {
      throw new Error(`[TALENT-STATE-03] Cannot start review from status '${profile.status}'. Must be 'SUBMITTED'.`);
    }
    profile.status = "UNDER_REVIEW";
    profile.updatedAt = new Date();
    return profile;
  }

  /**
   * Approves and assigns verification badge.
   * Invariant: Requires KYC status === "VERIFIED" and at least 1 completed skill assessment.
   */
  public verifyTalent(talentId: string, assignedTier: TalentTier, verifierId: string): TalentVerificationBadge {
    const profile = this.getProfileOrThrow(talentId);

    if (profile.status !== "UNDER_REVIEW") {
      throw new Error(`[TALENT-VERIFY-01] Cannot verify profile in '${profile.status}' state. Must be 'UNDER_REVIEW'.`);
    }

    if (profile.kycStatus === "REJECTED") {
      throw new Error("[TALENT-VERIFY-02] Cannot verify profile with REJECTED KYC status.");
    }

    if (profile.assessments.length === 0) {
      throw new Error("[TALENT-VERIFY-03] Cannot verify profile without at least one recorded assessment.");
    }

    const issuedAt = new Date();
    const tokenPayload = `${profile.id}:${assignedTier}:${verifierId}:${issuedAt.toISOString()}`;
    const checksumSha256 = createHash("sha256").update(tokenPayload).digest("hex");
    const tokenId = `BADGE-${checksumSha256.substring(0, 16).toUpperCase()}`;

    const config = getConfig();
    const badge: TalentVerificationBadge = {
      tokenId,
      tier: assignedTier,
      issuedAt,
      checksumSha256,
      verificationUrl: `${config.APP_URL}/verify/talent/${tokenId}`,
    };

    profile.tier = assignedTier;
    profile.status = "VERIFIED";
    profile.kycStatus = "VERIFIED";
    profile.badge = badge;
    profile.updatedAt = new Date();

    return badge;
  }

  public filterTalent(criteria: TalentFilterCriteria): TalentAcceleratorProfile[] {
    return Array.from(this.profiles.values()).filter((p) => {
      if (criteria.category && p.primaryCategory !== criteria.category && !p.secondaryCategories.includes(criteria.category)) {
        return false;
      }
      if (criteria.tier && p.tier !== criteria.tier) {
        return false;
      }
      if (criteria.status && p.status !== criteria.status) {
        return false;
      }
      if (criteria.state && p.locationState.toLowerCase() !== criteria.state.toLowerCase()) {
        return false;
      }
      if (criteria.partnerHubId && p.partnerHubId !== criteria.partnerHubId) {
        return false;
      }
      if (criteria.maxDayRateNgn !== undefined && p.dayRateNgn > criteria.maxDayRateNgn) {
        return false;
      }
      if (criteria.minAssessmentScore !== undefined) {
        const avgScore =
          p.assessments.length > 0
            ? p.assessments.reduce((sum, a) => sum + a.score, 0) / p.assessments.length
            : 0;
        if (avgScore < criteria.minAssessmentScore) {
          return false;
        }
      }
      return true;
    });
  }

  public getProfile(id: string): TalentAcceleratorProfile | undefined {
    return this.profiles.get(id);
  }

  public listHubs(): PartnerHub[] {
    return Array.from(this.hubs.values());
  }

  /**
   * Registers a new institutional partner hub (SCR-18 accelerator intake).
   * Mirrors the seeded hub shape; duplicate IDs are rejected.
   */
  public registerHub(hub: PartnerHub): PartnerHub {
    if (this.hubs.has(hub.id)) {
      throw new Error(`[TALENT-HUB-01] Partner hub '${hub.id}' already exists.`);
    }
    this.hubs.set(hub.id, hub);
    return hub;
  }

  private getProfileOrThrow(id: string): TalentAcceleratorProfile {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`[TALENT-ERR-404] Talent profile with ID '${id}' not found.`);
    }
    return profile;
  }
}
