/**
 * VMNL Canonical Domain Model TypeScript Definitions
 * Authority: VMNL-AZP-VMN-CDDS-001 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 */

export type KycStatus = "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type OrgType =
  | "CORPORATE"
  | "BROADCAST_PARTNER"
  | "PRODUCTION_HOUSE"
  | "ACADEMY_PARTNER"
  | "SPONSOR"
  | "ADVERTISER";

export type TalentTier = "EMERGING" | "VERIFIED" | "PROFESSIONAL" | "MASTER";
export type ProjectStatus = "PROPOSED" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED" | "ARCHIVED";
export type ContractStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "SIGNED" | "EXPIRED" | "TERMINATED";
export type RightsType = "BROADCAST_LINEAR" | "DIGITAL_STREAMING" | "SYNDICATION" | "DERIVATIVE";
export type SettlementStatus = "PENDING" | "RECONCILED" | "DISPUTED" | "PAID";
export type EvidenceType = "PROOF_OF_AIR" | "KYC_DOCUMENT" | "PAYMENT_RECEIPT" | "SIGNED_CONTRACT" | "AS_RUN_LOG";
export type AgentStatus = "ACTIVE" | "PAUSED" | "TERMINATED";

export interface PersonEntity {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  kycStatus: KycStatus;
  nationalId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEntity {
  id: string;
  personId: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  mfaEnabled: boolean;
  mfaSecret?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationEntity {
  id: string;
  name: string;
  slug: string;
  registrationNumber?: string | null;
  type: OrgType;
  kycStatus: KycStatus;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TalentProfileEntity {
  id: string;
  personId: string;
  stageName?: string | null;
  tier: TalentTier;
  bio?: string | null;
  skills: string[];
  rateCardAmount: number;
  rateCardCurrency: string;
  verificationStatus: KycStatus;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorProfileEntity {
  id: string;
  personId: string;
  handle: string;
  primaryNiche: string;
  platforms: Record<string, string>;
  audienceMetrics: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectEntity {
  id: string;
  code: string; // VMNL-PRJ-YYYY-NNNN
  name: string;
  description?: string | null;
  organisationId?: string | null;
  status: ProjectStatus;
  budget: number;
  currency: string;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractEntity {
  id: string;
  contractNumber: string;
  title: string;
  organisationId?: string | null;
  personId?: string | null;
  status: ContractStatus;
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  signedAt?: Date | null;
  signedDocumentUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RightsRecordEntity {
  id: string;
  assetId: string;
  title: string;
  granterOrgId?: string | null;
  granteeOrgId?: string | null;
  rightsType: RightsType;
  territory: string; // e.g. "NG", "WEST_AFRICA", "GLOBAL"
  mediaType: string; // "LINEAR_TV", "SVOD"
  exclusivity: boolean;
  startDate: Date;
  expiryDate: Date;
  subLicensable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mandatory 7-Way Financial Separation Ledger
 * Rule: Never conflate GMV, Invoiced, Cash, and Recognized Revenue
 */
export interface SettlementEntity {
  id: string;
  settlementNumber: string;
  contractId?: string | null;
  status: SettlementStatus;
  contractValue: number;
  gmvAmount: number;
  invoicedAmount: number;
  recognizedAmount: number;
  cashCollectedAmount: number;
  talentPayableAmount: number;
  partnerShareAmount: number;
  currency: string;
  reconciledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceEntity {
  id: string;
  type: EvidenceType;
  title: string;
  documentUrl: string;
  checksumSha256: string;
  verified: boolean;
  verifiedBy?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AgentEntity {
  id: string;
  agentIdentifier: string;
  name: string;
  purpose: string;
  operationalScope: string;
  humanOwnerId: string;
  allowedTools: string[];
  status: AgentStatus;
  killSwitchEngaged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntity {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  changesJson?: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Validates Rights Record invariants.
 * Invariant 1: Expiry date must be strictly after start date.
 * Invariant 2: Cannot exploit expired rights.
 */
export function isRightsActive(record: RightsRecordEntity, checkDate: Date = new Date()): boolean {
  if (record.expiryDate <= record.startDate) {
    throw new Error(`[VMNL-RIGHTS-ERROR] Invalid RightsRecord '${record.id}': expiryDate must be after startDate`);
  }
  return checkDate >= record.startDate && checkDate <= record.expiryDate;
}

/**
 * Validates 7-Way Financial Settlement invariants.
 */
export function validateSettlementInvariants(settlement: SettlementEntity): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (settlement.cashCollectedAmount > settlement.invoicedAmount) {
    errors.push("Cash collected cannot exceed invoiced amount");
  }

  if (settlement.talentPayableAmount + settlement.partnerShareAmount > settlement.gmvAmount && settlement.gmvAmount > 0) {
    errors.push("Talent payables and partner share cannot exceed GMV");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
