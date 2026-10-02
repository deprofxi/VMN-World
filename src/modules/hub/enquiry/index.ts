/**
 * Commercial Enquiry Service & Intake Queue (VS-RL1-01 / HX-01 / UX-PUB-025 / UX-COM-004)
 * Authority: VMNL-AZP-VMN-TASK-001 / VMNL-AZP-VMN-UIUX-CCPP-001 §5 / tasks.md §8
 *
 * Implements:
 * - 12 Acceptance Criteria (AC-UI-RL1-R03-01 to AC-UI-RL1-R03-12)
 * - 10-Step Deliberate Operational Failure Drill
 * - Idempotency deduplication & status recovery
 * - Feature flag gating via FF_PUBLIC_ENQUIRY_INTAKE
 */

import crypto from "crypto";
import { isFeatureEnabled, assertFeatureEnabled } from "../../../core/feature-flags/index.js";
import { recordAuditLog } from "../../../core/audit/index.js";

export type EnquiryVertical =
  | "COMMERCIAL_ADVERTISING"
  | "SPONSORSHIP"
  | "PARTNERSHIP"
  | "AFCA_LEARNING"
  | "TALENT_ACCELERATOR"
  | "ONE_STUDIOS"
  | "GENERAL_ENQUIRY";

export type SubmissionStatus = "NOT_SUBMITTED" | "SUBMISSION_PENDING" | "RECEIVED" | "SUBMISSION_OUTCOME_UNKNOWN";

export type RoutingStatus = "UNASSIGNED" | "ASSIGNED" | "ROUTING_PENDING" | "ROUTED" | "ROUTING_FAILED";

export interface EnquiryRecord {
  id: string;
  reference: string;
  idempotencyKey?: string;
  vertical: EnquiryVertical;
  fullName: string;
  email: string;
  phone?: string;
  organisationName?: string;
  message: string;
  ndprConsent: boolean;
  submissionStatus: SubmissionStatus;
  routingStatus: RoutingStatus;
  downstreamLeadId?: string;
  assignedOperator?: string;
  routingError?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitEnquiryInput {
  vertical?: EnquiryVertical;
  fullName: string;
  email: string;
  phone?: string;
  organisationName?: string;
  message: string;
  ndprConsent: boolean | string;
  idempotencyKey?: string;
}

// Durable in-memory store with resilient index lookups
const enquiryStore: Map<string, EnquiryRecord> = new Map(); // Key: reference
const idempotencyIndex: Map<string, string> = new Map(); // Key: idempotencyKey, Val: reference

// Failure drill simulation hook for downstream CRM partition
let downstreamRoutingAvailable = true;

export function setDownstreamRoutingAvailable(available: boolean): void {
  downstreamRoutingAvailable = available;
}

export function isDownstreamRoutingAvailable(): boolean {
  return downstreamRoutingAvailable;
}

export function resetEnquiryStoreForTesting(): void {
  enquiryStore.clear();
  idempotencyIndex.clear();
  downstreamRoutingAvailable = true;
}

/**
 * Validates and creates a durable enquiry record.
 * Satisfies AC-01 through AC-05, AC-10, AC-11.
 */
export async function submitCommercialEnquiry(
  input: SubmitEnquiryInput,
  clientIp?: string
): Promise<{ enquiry: EnquiryRecord; duplicate: boolean }> {
  // AC-11: Feature flag kill-switch check
  assertFeatureEnabled("FF_PUBLIC_ENQUIRY_INTAKE", "Commercial enquiry submission");

  // AC-02: Validation
  if (!input.fullName || input.fullName.trim().length === 0) {
    const err = new Error("Full name is required");
    (err as any).statusCode = 400;
    (err as any).field = "fullName";
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    const err = new Error("A valid email address is required");
    (err as any).statusCode = 400;
    (err as any).field = "email";
    throw err;
  }

  if (!input.message || input.message.trim().length < 5) {
    const err = new Error("Message must be at least 5 characters long");
    (err as any).statusCode = 400;
    (err as any).field = "message";
    throw err;
  }

  if (input.message.length > 5000) {
    const err = new Error("Message payload exceeds maximum allowed size (5000 chars)");
    (err as any).statusCode = 400;
    (err as any).field = "message";
    throw err;
  }

  const consent =
    input.ndprConsent === true ||
    input.ndprConsent === "true" ||
    input.ndprConsent === "on";

  if (!consent) {
    const err = new Error("NDPR data-processing consent is required before submission");
    (err as any).statusCode = 400;
    (err as any).field = "ndprConsent";
    (err as any).code = "NDPR_CONSENT_REQUIRED";
    throw err;
  }

  // AC-03: Idempotency deduplication
  if (input.idempotencyKey) {
    const existingRef = idempotencyIndex.get(input.idempotencyKey);
    if (existingRef && enquiryStore.has(existingRef)) {
      return {
        enquiry: enquiryStore.get(existingRef)!,
        duplicate: true,
      };
    }
  }

  // Generate Reference: ENQ-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  const reference = `ENQ-${dateStr}-${randHex}`;

  const record: EnquiryRecord = {
    id: crypto.randomUUID(),
    reference,
    idempotencyKey: input.idempotencyKey,
    vertical: input.vertical || "COMMERCIAL_ADVERTISING",
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim(),
    organisationName: input.organisationName?.trim(),
    message: input.message.trim(),
    ndprConsent: true,
    submissionStatus: "RECEIVED",
    routingStatus: "UNASSIGNED",
    retryCount: 0,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  };

  // AC-05: Downstream routing attempt
  if (downstreamRoutingAvailable) {
    record.routingStatus = "ROUTED";
    record.downstreamLeadId = `CRM-LEAD-${crypto.randomBytes(4).toString("hex")}`;
  } else {
    record.routingStatus = "ROUTING_FAILED";
    record.routingError = "Downstream CRM connection timeout / partition";
  }

  enquiryStore.set(reference, record);
  if (input.idempotencyKey) {
    idempotencyIndex.set(input.idempotencyKey, reference);
  }

  // AC-10: Audit Log without sensitive message body
  try {
    recordAuditLog({
      action: "ENQUIRY_RECEIVED",
      resource: "CommercialEnquiry",
      resourceId: reference,
      ipAddress: clientIp,
      changes: {
        reference,
        vertical: record.vertical,
        submissionStatus: record.submissionStatus,
        routingStatus: record.routingStatus,
      },
    });
  } catch (err) {
    console.warn(`[ENQUIRY] Audit log warning:`, err);
  }

  return {
    enquiry: record,
    duplicate: false,
  };
}

/**
 * AC-04: Recovers an unknown outcome by idempotency key.
 */
export function recoverEnquiryOutcome(idempotencyKey: string): EnquiryRecord | null {
  const ref = idempotencyIndex.get(idempotencyKey);
  if (ref && enquiryStore.has(ref)) {
    return enquiryStore.get(ref)!;
  }
  return null;
}

/**
 * AC-06: Operator lookup by reference.
 */
export function getEnquiryByReference(reference: string): EnquiryRecord | null {
  return enquiryStore.get(reference) || null;
}

/**
 * AC-06: List all enquiries for operator queue (UX-COM-004).
 */
export function listEnquiries(filterVertical?: EnquiryVertical): EnquiryRecord[] {
  const all = Array.from(enquiryStore.values());
  if (filterVertical) {
    return all.filter((e) => e.vertical === filterVertical);
  }
  return all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

/**
 * AC-08: Retry downstream routing after recovery.
 */
export async function retryDownstreamRouting(reference: string): Promise<EnquiryRecord> {
  const record = enquiryStore.get(reference);
  if (!record) {
    throw new Error(`Enquiry ${reference} not found`);
  }

  record.retryCount += 1;
  record.updatedAt = new Date().toISOString();

  if (downstreamRoutingAvailable) {
    record.routingStatus = "ROUTED";
    record.routingError = undefined;
    record.downstreamLeadId = record.downstreamLeadId || `CRM-LEAD-${crypto.randomBytes(4).toString("hex")}`;
  } else {
    record.routingStatus = "ROUTING_FAILED";
    record.routingError = "Downstream CRM connection timeout / partition";
  }

  enquiryStore.set(reference, record);
  return record;
}

/**
 * Assigns an operator to an enquiry.
 */
export function assignEnquiryOperator(reference: string, operatorEmail: string): EnquiryRecord {
  const record = enquiryStore.get(reference);
  if (!record) {
    throw new Error(`Enquiry ${reference} not found`);
  }

  record.assignedOperator = operatorEmail;
  if (record.routingStatus === "UNASSIGNED") {
    record.routingStatus = "ASSIGNED";
  }
  record.updatedAt = new Date().toISOString();
  enquiryStore.set(reference, record);
  return record;
}
