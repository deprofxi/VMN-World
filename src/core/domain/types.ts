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
  channelCode?: string | null;
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

/**
 * Minor unit representation for monetary amounts (Kobo = NGN / 100, Cents = USD / 100).
 * Authority: tasks-9.md T9-10 / report-9.md F-9-08
 * All financial arithmetic MUST be performed on integer minor units to eliminate floating-point drift.
 */
export type Kobo = number & { readonly __brand: unique symbol };

export function toKobo(majorUnits: number): Kobo {
  return Math.round(majorUnits * 100) as Kobo;
}

/**
 * Validates that a value is an exact kobo (minor-unit) integer (AUD-25).
 * Accepts values produced by toKobo() or literal integer kobo from callers;
 * rejects fractional floats that would silently carry IEEE-754 error into
 * money columns.
 */
export function isWholeKobo(value: number): value is Kobo {
  return Number.isFinite(value) && Number.isInteger(value);
}

/**
 * API-boundary money normalizer (AUD-25): accepts NGN major-unit values that
 * are either exact kobo integers (already in minor units) or 2dp-correct major
 * units, and returns kobo. Throws on values that cannot be represented exactly
 * in kobo (more than 2 decimal places).
 */
export function requireKoboExact(value: number): Kobo {
  if (!Number.isFinite(value)) {
    throw new Error("[VMNL-MONEY-ERROR] Amount must be a finite number");
  }
  // A value is "exact kobo" if rounding to 2dp does not change it
  const rounded = Math.round(value * 100);
  if (Math.abs(value * 100 - rounded) > 1e-6) {
    throw new Error(
      `[VMNL-MONEY-ERROR] Amount ${value} cannot be represented exactly in kobo (max 2 decimal places)`
    );
  }
  return rounded as Kobo;
}

export function fromKobo(minorUnits: Kobo | number): number {
  return Number((minorUnits / 100).toFixed(2));
}

export function parseDecimalToKobo(decimalStr: string): Kobo {
  const sanitized = decimalStr.trim().replace(/,/g, ".");
  if (!sanitized) return 0 as Kobo;
  const isNegative = sanitized.startsWith("-");
  const cleaned = sanitized.replace(/^[+-]/, "");
  const [wholePart = "0", fracPart = ""] = cleaned.split(".");
  const whole = parseInt(wholePart, 10) || 0;
  const frac = parseInt((fracPart + "00").slice(0, 2), 10) || 0;
  const total = whole * 100 + frac;
  return (isNegative ? -total : total) as Kobo;
}
