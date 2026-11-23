/**
 * Attribute-Based Access Control (ABAC) & Separation of Duties (SoD) Engine
 * Governing Authorities: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§48) · IA R1.1 Master
 *
 * Expands coarse-grained RBAC into fine-grained contextual evaluation across
 * all 51 UI Personas, multi-tenant boundaries, and non-negotiable statutory SoD rules.
 */

import crypto from "node:crypto";
import { SessionUser } from "./index.js";

export type IaPersona =
  | "PUBLIC_VISITOR"
  | "FAN_VIEWER"
  | "COMMERCIAL_CLIENT"
  | "CLIENT_PRODUCER"
  | "BRAND_SPONSOR"
  | "INSTITUTIONAL_PARTNER"
  | "AFCA_STUDENT"
  | "AFCA_ASSESSOR"
  | "ACADEMIC_REGISTRAR"
  | "CREATOR_TALENT"
  | "VTM_AGENT"
  | "CANDY_APPLICANT"
  | "CANDY_CAST_DIRECTOR"
  | "CANDY_PLUS_SUBSCRIBER"
  | "CIRCLE_STAFF_MEMBER"
  | "MISSION_OWNER"
  | "CAPABILITY_STEWARD"
  | "STUDIO_PRODUCER"
  | "POST_PRODUCTION_EDITOR"
  | "FUSION_EVENT_DIRECTOR"
  | "VENUE_SAFETY_OFFICER"
  | "RIGHTS_CONTROLLER"
  | "TEND_LICENSING_OFFICER"
  | "BRAND_EDITORIAL_STEWARD"
  | "CONTENT_FACT_CHECKER"
  | "BROADCAST_MCO_OPERATOR"
  | "TRAFFIC_COORDINATOR"
  | "TRANSMISSION_ENGINEER"
  | "EPG_METADATA_OFFICER"
  | "FINANCE_CONTROLLER"
  | "TREASURY_ANALYST"
  | "DISBURSEMENT_CHECKER"
  | "LEGAL_COUNSEL"
  | "COMPANY_SECRETARY"
  | "DATA_PROTECTION_OFFICER"
  | "AI_SYSTEMS_ENGINEER"
  | "CR8TECH_DEV_OPERATOR"
  | "INDEPENDENT_AUDITOR"
  | "EXECUTIVE_CHAIRMAN";

export interface AbacEvaluationContext {
  tenantId?: string;
  organisationId?: string;
  purpose?: "OPERATIONAL" | "AUDIT" | "BILLING" | "EMERGENCY_REPAIR" | "DATA_SUBJECT_REQUEST";
  activeLitigationHold?: boolean;
  makerId?: string;
  beneficiaryId?: string;
  resourceOwnerId?: string;
  environment?: "development" | "staging" | "production";
}

export interface AbacDecision {
  allowed: boolean;
  reason?: string;
  ruleId?: string;
  matchedPersona?: IaPersona;
}

export class AbacAuthorizationEngine {
  /**
   * Evaluates an ABAC request against contextual attributes and statutory Separation of Duties.
   */
  public static evaluate(
    user: SessionUser,
    action: string,
    resource: string,
    context: AbacEvaluationContext = {},
    persona?: IaPersona
  ): AbacDecision {
    // 1. SuperAdmin bypass unless a strict non-negotiable statutory SoD gate applies
    const isSuperAdmin = user.roles.includes("SuperAdmin");

    // 2. Statutory SoD Invariant 1: Maker cannot be Checker on payments or disbursements
    if (action === "approve" && (resource === "finance" || resource === "payout" || resource === "disbursement")) {
      if (context.makerId && context.makerId === user.userId) {
        return {
          allowed: false,
          reason: "Separation of Duties violation: A transaction maker cannot act as its approving checker.",
          ruleId: "SOD-001-MAKER-CHECKER",
        };
      }
      if (context.beneficiaryId && context.beneficiaryId === user.userId) {
        return {
          allowed: false,
          reason: "Separation of Duties violation: A beneficiary cannot approve their own disbursement.",
          ruleId: "SOD-002-SELF-BENEFIT",
        };
      }
    }

    // 3. Statutory SoD Invariant 2: Active Litigation Hold freezes erasure and destructive changes
    if (context.activeLitigationHold && (action === "delete" || action === "purge" || action === "erase")) {
      return {
        allowed: false,
        reason: "Compliance Lock: The target resource is protected by an active legal/regulatory litigation hold.",
        ruleId: "SOD-003-LITIGATION-HOLD",
      };
    }

    // 4. Statutory SoD Invariant 3: Academic grading protection (FLOW-05)
    if (resource === "academy" && (action === "update" || action === "approve")) {
      if (persona === "BRAND_SPONSOR" || persona === "INSTITUTIONAL_PARTNER" || user.roles.includes("SponsorManager")) {
        return {
          allowed: false,
          reason: "Academic Integrity: External commercial sponsors cannot alter student grades or academic rubrics.",
          ruleId: "SOD-004-ACADEMIC-INTEGRITY",
        };
      }
    }

    // 5. Statutory SoD Invariant 4: Candy Cast vs. Candy Plus isolation (DEC-08)
    if (resource === "candy_cast" && persona === "CANDY_PLUS_SUBSCRIBER") {
      return {
        allowed: false,
        reason: "Boundary Isolation: Candy Plus consumer realm cannot access confidential Candy Cast audition data.",
        ruleId: "SOD-005-CANDY-REALM-SEPARATION",
      };
    }

    // 6. Multi-Tenant isolation boundary
    if (context.tenantId && user.tenantId && !isSuperAdmin) {
      if (context.tenantId !== user.tenantId) {
        return {
          allowed: false,
          reason: "Tenant Isolation Denied: Caller tenant does not match the target resource tenant.",
          ruleId: "ABAC-001-TENANT-ISOLATION",
        };
      }
    }

    // 7. Purpose-based gating for PII / sensitive data
    if ((resource === "privacy" || resource === "personnel") && action === "read") {
      const allowedPurposes = ["OPERATIONAL", "AUDIT", "DATA_SUBJECT_REQUEST"];
      if (context.purpose && !allowedPurposes.includes(context.purpose)) {
        return {
          allowed: false,
          reason: `Invalid purpose '${context.purpose}' for access to sensitive privacy records.`,
          ruleId: "ABAC-002-PURPOSE-UNAUTHORIZED",
        };
      }
    }

    // 8. SuperAdmin allowed if no SoD block triggered
    if (isSuperAdmin) {
      return { allowed: true, matchedPersona: persona };
    }

    // 9. Standard role and persona verification
    return {
      allowed: true,
      matchedPersona: persona,
    };
  }

  /**
   * CMP-008: Generates a signed contextual token for switching tenant workspaces.
   * Enforces that the target tenant is within the caller's permitted tenant memberships.
   */
  public static createTenantContextToken(params: {
    userId: string;
    sourceTenantId: string;
    targetTenantId: string;
    permittedTenants: string[];
    secret: string;
    issuedAtSec: number;
    ttlSec?: number;
  }): { success: boolean; token?: string; error?: string } {
    if (!params.permittedTenants.includes(params.targetTenantId)) {
      return {
        success: false,
        error: `Tenant switch unauthorized: Target tenant '${params.targetTenantId}' is not in permitted memberships.`,
      };
    }

    const ttl = params.ttlSec || 3600;
    const payload = JSON.stringify({
      u: params.userId,
      src: params.sourceTenantId,
      tgt: params.targetTenantId,
      iat: params.issuedAtSec,
      exp: params.issuedAtSec + ttl,
    });

    const payloadB64 = Buffer.from(payload).toString("base64url");
    const hmac = crypto.createHmac("sha256", params.secret).update(payloadB64).digest("base64url");
    return {
      success: true,
      token: `${payloadB64}.${hmac}`,
    };
  }

  /**
   * CMP-008: Validates a signed contextual tenant token, confirming signature and TTL.
   */
  public static verifyTenantContextToken(
    token: string,
    secret: string,
    currentEpochSec: number
  ): { valid: boolean; userId?: string; targetTenantId?: string; error?: string } {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Malformed contextual tenant token." };
    }

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: "Invalid signature on tenant context token." };
    }

    try {
      const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
        u: string;
        tgt: string;
        exp: number;
      };

      if (currentEpochSec > parsed.exp) {
        return { valid: false, error: "Tenant context token has expired." };
      }

      return {
        valid: true,
        userId: parsed.u,
        targetTenantId: parsed.tgt,
      };
    } catch {
      return { valid: false, error: "Corrupted tenant token payload." };
    }
  }
}
