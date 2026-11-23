/**
 * Corporate Governance & Delegation of Authority (DoA) Limit Engine
 * Governing Authorities: VMNL-AZP-VMN-EXEC-001 · Financial Master R1.1 · Legal Master R1.1
 *
 * Implements statutory monetary approval thresholds, multi-signature corporate governance,
 * and Board Resolution cryptographic registry for consequential commitments.
 */

import crypto from "node:crypto";

export enum DoaTier {
  L1_OPERATIONAL = "L1_OPERATIONAL",         // <= NGN 500,000 (50,000,000 kobo)
  L2_DOMAIN_DIRECTOR = "L2_DOMAIN_DIRECTOR", // <= NGN 5,000,000 (500,000,000 kobo)
  L3_EXECUTIVE = "L3_EXECUTIVE",             // <= NGN 25,000,000 (2,500,000,000 kobo)
  L4_BOARD_RESERVED = "L4_BOARD_RESERVED",   // > NGN 25,000,000
}

export const DOA_LIMITS_KOBO = {
  L1_MAX_KOBO: 50_000_000n,       // NGN 500,000
  L2_MAX_KOBO: 500_000_000n,      // NGN 5,000,000
  L3_MAX_KOBO: 2_500_000_000n,    // NGN 25,000,000
} as const;

export interface DoaEvaluationResult {
  tier: DoaTier;
  amountKobo: bigint;
  requiredSignatures: number;
  boardApprovalRequired: boolean;
  requiredRoles: string[];
  compliant: boolean;
  violations: string[];
}

export interface BoardResolution {
  resolutionId: string;
  resolutionNumber: string;
  meetingDate: string;
  title: string;
  authorizingLimitKobo: bigint;
  signatories: Array<{ name: string; title: string; signedAt: string }>;
  hashSeal: string;
}

export class DelegationOfAuthorityEngine {
  /**
   * Resolves the required DoA tier and statutory signing requirements for a given amount.
   */
  public static evaluateSpend(
    amountKobo: bigint,
    signers: Array<{ userId: string; role: string }>,
    boardResolutionId?: string
  ): DoaEvaluationResult {
    let tier: DoaTier;
    let requiredSignatures: number;
    let boardApprovalRequired = false;
    let requiredRoles: string[];

    if (amountKobo <= DOA_LIMITS_KOBO.L1_MAX_KOBO) {
      tier = DoaTier.L1_OPERATIONAL;
      requiredSignatures = 1;
      requiredRoles = ["OperationalManager", "ChannelManager", "TrafficManager", "SuperAdmin"];
    } else if (amountKobo <= DOA_LIMITS_KOBO.L2_MAX_KOBO) {
      tier = DoaTier.L2_DOMAIN_DIRECTOR;
      requiredSignatures = 1;
      requiredRoles = ["BroadcastDirector", "FinanceController", "AcademyDirector", "SuperAdmin"];
    } else if (amountKobo <= DOA_LIMITS_KOBO.L3_MAX_KOBO) {
      tier = DoaTier.L3_EXECUTIVE;
      requiredSignatures = 2; // Dual authorization required
      requiredRoles = ["ExecutiveLeader", "FinanceController", "SuperAdmin"];
    } else {
      tier = DoaTier.L4_BOARD_RESERVED;
      requiredSignatures = 2; // Executive Chairman + Company Secretary / Director
      boardApprovalRequired = true;
      requiredRoles = ["ExecutiveChairman", "CompanySecretary", "SuperAdmin"];
    }

    const violations: string[] = [];

    // Check signature count
    if (signers.length < requiredSignatures) {
      violations.push(
        `Insufficient signatories: ${signers.length} provided, ${requiredSignatures} required for ${tier}.`
      );
    }

    // Check authority roles
    const authorizedSigners = signers.filter((s) => requiredRoles.includes(s.role));
    if (authorizedSigners.length < requiredSignatures) {
      violations.push(
        `Signatories lack required governance roles: requires at least ${requiredSignatures} from [${requiredRoles.join(", ")}].`
      );
    }

    // Check Board resolution if reserved matter
    if (boardApprovalRequired && !boardResolutionId) {
      violations.push(
        "Board of Directors reserved matter: Requires active verified Board Resolution reference."
      );
    }

    return {
      tier,
      amountKobo,
      requiredSignatures,
      boardApprovalRequired,
      requiredRoles,
      compliant: violations.length === 0,
      violations,
    };
  }
}

export class BoardResolutionRegistry {
  private static resolutions: Record<string, BoardResolution> = {};

  public static registerResolution(resolution: Omit<BoardResolution, "hashSeal">): BoardResolution {
    const rawPayload = `${resolution.resolutionNumber}|${resolution.meetingDate}|${resolution.authorizingLimitKobo}|${resolution.signatories.map((s) => s.name).join(",")}`;
    const hashSeal = crypto.createHash("sha256").update(rawPayload).digest("hex");

    const record: BoardResolution = {
      ...resolution,
      hashSeal,
    };

    BoardResolutionRegistry.resolutions[record.resolutionId] = record;
    return record;
  }

  public static getResolution(resolutionId: string): BoardResolution | undefined {
    return BoardResolutionRegistry.resolutions[resolutionId];
  }

  public static verifySeal(resolutionId: string): boolean {
    const res = BoardResolutionRegistry.resolutions[resolutionId];
    if (!res) return false;
    const rawPayload = `${res.resolutionNumber}|${res.meetingDate}|${res.authorizingLimitKobo}|${res.signatories.map((s) => s.name).join(",")}`;
    const computed = crypto.createHash("sha256").update(rawPayload).digest("hex");
    return computed === res.hashSeal;
  }
}
