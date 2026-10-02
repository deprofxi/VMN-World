/**
 * AFCA Admissions & Learner Onboarding Service (UX-APP-001 to UX-APP-008)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.3 / tasks.md Phase 5
 *
 * Implements multi-step learner application drafting, idempotent submission,
 * tracking reference generation (APP-YYYYMMDD-XXXX), admissions queue review,
 * and decision recording gated by FF_AFCA_ADMISSIONS_ENABLED.
 */

import { createHash, randomBytes } from "node:crypto";
import { recordAuditLog } from "../../../core/audit/index.js";
import { assertFeatureEnabled } from "../../../core/feature-flags/index.js";

export type CreativeTrack =
  | "CINEMATOGRAPHY"
  | "DIRECTING"
  | "SCREENWRITING"
  | "SOUND_ENGINEERING"
  | "CREATIVE_PRODUCING"
  | "ANIMATION_VFX";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "ACCEPTED"
  | "REJECTED";

export interface ApplicantDraftPayload {
  draftToken?: string;
  fullName: string;
  email: string;
  phone?: string;
  creativeTrack: CreativeTrack;
  experienceLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  portfolioUrl?: string;
  statementOfIntent?: string;
  financialAidRequested?: boolean;
  stepCompleted?: number;
}

export interface ApplicationSubmission {
  id: string;
  reference: string; // APP-YYYYMMDD-XXXX
  draftToken?: string;
  fullName: string;
  email: string;
  phone: string;
  creativeTrack: CreativeTrack;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  portfolioUrl?: string;
  statementOfIntent: string;
  financialAidRequested: boolean;
  status: ApplicationStatus;
  stepCompleted: number;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewerNotes?: string;
  reviewScores?: {
    portfolioScore: number; // 0-100
    statementScore: number; // 0-100
    overallRating: number; // 0-100
  };
  decisionReason?: string;
  idempotencyKey?: string;
}

// In-memory backing ledger with production isolation
const applicationLedger = new Map<string, ApplicationSubmission>();
const idempotencyRegistry = new Map<string, string>(); // idempotencyKey -> reference
let applicationSequence = 1000;

export function generateApplicationReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  applicationSequence += 1;
  const seqStr = String(applicationSequence).padStart(4, "0");
  return `APP-${dateStr}-${seqStr}`;
}

export class AfcaAdmissionsService {
  /**
   * Save or update an applicant draft (UX-APP-001 to 005 autosave)
   */
  public static async saveDraft(
    payload: ApplicantDraftPayload
  ): Promise<{ draftToken: string; reference?: string; status: ApplicationStatus }> {
    assertFeatureEnabled("FF_AFCA_ADMISSIONS_ENABLED");

    const draftToken = payload.draftToken || `DRAFT-${randomBytes(8).toString("hex")}`;
    const reference = generateApplicationReference();

    const record: ApplicationSubmission = {
      id: `app-sub-${Date.now()}-${randomBytes(4).toString("hex")}`,
      reference,
      draftToken,
      fullName: payload.fullName,
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone || "",
      creativeTrack: payload.creativeTrack,
      experienceLevel: payload.experienceLevel || "BEGINNER",
      portfolioUrl: payload.portfolioUrl,
      statementOfIntent: payload.statementOfIntent || "",
      financialAidRequested: Boolean(payload.financialAidRequested),
      status: "DRAFT",
      stepCompleted: payload.stepCompleted || 1,
      submittedAt: new Date(),
    };

    applicationLedger.set(reference, record);

    return { draftToken, reference, status: "DRAFT" };
  }

  /**
   * Submit complete application with idempotency guarantee (UX-APP-005, 006)
   */
  public static async submitApplication(
    payload: Omit<ApplicationSubmission, "id" | "reference" | "status" | "submittedAt"> & {
      idempotencyKey?: string;
    }
  ): Promise<ApplicationSubmission> {
    assertFeatureEnabled("FF_AFCA_ADMISSIONS_ENABLED");

    if (payload.idempotencyKey && idempotencyRegistry.has(payload.idempotencyKey)) {
      const existingRef = idempotencyRegistry.get(payload.idempotencyKey)!;
      const existing = applicationLedger.get(existingRef);
      if (existing) {
        return existing;
      }
    }

    if (!payload.fullName || !payload.email || !payload.statementOfIntent) {
      throw new Error("Validation failed: fullName, email, and statementOfIntent are required.");
    }

    const reference = generateApplicationReference();
    const id = `app-sub-${Date.now()}-${randomBytes(4).toString("hex")}`;

    const submission: ApplicationSubmission = {
      ...payload,
      id,
      reference,
      email: payload.email.toLowerCase().trim(),
      status: "SUBMITTED",
      stepCompleted: 5,
      submittedAt: new Date(),
    };

    applicationLedger.set(reference, submission);
    if (payload.idempotencyKey) {
      idempotencyRegistry.set(payload.idempotencyKey, reference);
    }

    await recordAuditLog({
      action: "AFCA_APPLICATION_SUBMITTED",
      resource: "afca_application",
      resourceId: reference,
      tenantId: "afca_academy",
      changes: {
        reference,
        creativeTrack: submission.creativeTrack,
        email: submission.email,
        financialAid: submission.financialAidRequested,
      },
    });

    return submission;
  }

  /**
   * Get an application by its unique reference (UX-APP-006 status tracking)
   */
  public static async getByReference(reference: string): Promise<ApplicationSubmission | null> {
    return applicationLedger.get(reference) || null;
  }

  /**
   * Admissions Staff Queue (UX-APP-007)
   */
  public static async listQueue(filter?: {
    status?: ApplicationStatus;
    creativeTrack?: CreativeTrack;
  }): Promise<ApplicationSubmission[]> {
    assertFeatureEnabled("FF_AFCA_ADMISSIONS_ENABLED");

    let items = Array.from(applicationLedger.values());
    if (filter?.status) {
      items = items.filter((i) => i.status === filter.status);
    }
    if (filter?.creativeTrack) {
      items = items.filter((i) => i.creativeTrack === filter.creativeTrack);
    }
    return items.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  /**
   * Staff Assessment & Decision (UX-APP-008)
   */
  public static async recordDecision(params: {
    reference: string;
    reviewerId: string;
    decision: "ACCEPTED" | "REJECTED" | "CHANGES_REQUESTED" | "UNDER_REVIEW";
    notes: string;
    scores?: {
      portfolioScore: number;
      statementScore: number;
      overallRating: number;
    };
  }): Promise<ApplicationSubmission> {
    assertFeatureEnabled("FF_AFCA_ADMISSIONS_ENABLED");

    const application = applicationLedger.get(params.reference);
    if (!application) {
      throw new Error(`Application ${params.reference} not found`);
    }

    application.status = params.decision;
    application.reviewedBy = params.reviewerId;
    application.reviewedAt = new Date();
    application.reviewerNotes = params.notes;
    if (params.scores) {
      application.reviewScores = params.scores;
    }

    applicationLedger.set(params.reference, application);

    await recordAuditLog({
      action: "AFCA_APPLICATION_DECISION_RECORDED",
      resource: "afca_application",
      resourceId: params.reference,
      userId: params.reviewerId,
      tenantId: "afca_academy",
      changes: {
        decision: params.decision,
        reviewer: params.reviewerId,
        scores: params.scores,
      },
    });

    return application;
  }

  /**
   * Reset in-memory ledger (used for isolated unit testing)
   */
  public static _resetLedger(): void {
    applicationLedger.clear();
    idempotencyRegistry.clear();
  }
}
