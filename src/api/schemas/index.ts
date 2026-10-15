/**
 * VMNL Enterprise Unified API Validation Schemas (AUD-11)
 * Enforces declarative runtime validation on all critical JSON API endpoints.
 */

import { z } from "zod";

export const ListEnquiriesQuerySchema = z.object({
  vertical: z
    .enum([
      "COMMERCIAL_ADVERTISING",
      "SPONSORSHIP",
      "PARTNERSHIP",
      "AFCA_LEARNING",
      "TALENT_ACCELERATOR",
      "ONE_STUDIOS",
      "GENERAL_ENQUIRY",
    ])
    .optional(),
});

const enquiryVerticals = [
  "COMMERCIAL_ADVERTISING",
  "SPONSORSHIP",
  "PARTNERSHIP",
  "AFCA_LEARNING",
  "TALENT_ACCELERATOR",
  "ONE_STUDIOS",
  "GENERAL_ENQUIRY",
] as const;

export const SubmitEnquirySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(32).optional(),
  organisationName: z.string().trim().max(160).optional(),
  vertical: z.enum(enquiryVerticals).optional(),
  message: z.string().trim().min(10).max(5000),
  ndprConsent: z.preprocess(
    (value) => value === true || value === "true" || value === "on",
    z.literal(true, { errorMap: () => ({ message: "Submission acknowledgement is required" }) })
  ),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

const creativeTracks = [
  "CINEMATOGRAPHY", "DIRECTING", "SCREENWRITING", "SOUND_ENGINEERING", "CREATIVE_PRODUCING", "ANIMATION_VFX",
] as const;
const experienceLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const SaveApplicationDraftSchema = z.object({
  draftToken: z.string().min(1).max(200).optional(),
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(32).optional(),
  creativeTrack: z.enum(creativeTracks),
  experienceLevel: z.enum(experienceLevels).optional(),
  portfolioUrl: z.string().url().max(2048).optional(),
  statementOfIntent: z.string().max(5000).optional(),
  financialAidRequested: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).optional(),
  stepCompleted: z.number().int().min(1).max(5).optional(),
});

export const SubmitApplicationSchema = SaveApplicationDraftSchema.extend({
  statementOfIntent: z.string().trim().min(10).max(5000),
  idempotencyKey: z.string().min(1).max(200).optional(),
  draftToken: z.string().min(1).max(200).optional(),
});

export const AdmissionsDecisionSchema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED", "CHANGES_REQUESTED", "UNDER_REVIEW"]),
  notes: z.string().trim().max(5000).default(""),
  scores: z.object({
    portfolioScore: z.number().int().min(0).max(100),
    statementScore: z.number().int().min(0).max(100),
    overallRating: z.number().int().min(0).max(100),
  }).optional(),
});

export const AdmissionsQueueQuerySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "CHANGES_REQUESTED",
      "ACCEPTED",
      "REJECTED",
    ])
    .optional(),
  creativeTrack: z
    .enum([
      "CINEMATOGRAPHY",
      "DIRECTING",
      "SCREENWRITING",
      "SOUND_ENGINEERING",
      "CREATIVE_PRODUCING",
      "ANIMATION_VFX",
    ])
    .optional(),
});

const PaystackTransactionSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().positive()]).transform(String),
  reference: z.string().trim().min(1).max(200),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  status: z.string().trim().toLowerCase().optional(),
  paid_at: z.string().datetime({ offset: true }).optional(),
  gateway_response: z.string().max(200).optional(),
}).passthrough();

export const PaystackWebhookSchema = z.object({
  event: z.enum(["charge.success", "transfer.success"]),
  data: PaystackTransactionSchema,
}).passthrough();

const FlutterwaveTransactionSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().positive()]).transform(String),
  tx_ref: z.string().trim().min(1).max(200),
  amount: z.number().positive().finite(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  status: z.string().trim().toLowerCase(),
  created_at: z.string().datetime({ offset: true }).optional(),
}).passthrough();

export const FlutterwaveWebhookSchema = z.object({
  event: z.enum(["charge.completed", "transfer.completed"]),
  data: FlutterwaveTransactionSchema,
}).passthrough();

export const BatchPaymentItemSchema = z.object({
  recipientId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN"),
  description: z.string().optional(),
});

export const BatchPaymentSchema = z.object({
  id: z.string(),
  batchReference: z.string(),
  makerUserId: z.string(),
  items: z.array(BatchPaymentItemSchema).default([]),
});

export const ProposalCreateSchema = z.object({
  title: z.string().min(3),
  clientName: z.string().min(2),
  value: z.number().nonnegative(),
  vertical: z.string().optional(),
});

export const DealCreateSchema = z.object({
  dealCode: z.string().min(3),
  clientName: z.string().min(2),
  commercialLead: z.string().min(2),
  grossValue: z.number().nonnegative(),
  currency: z.string().default("NGN"),
  stage: z.string().default("LEAD"),
});

export const FeatureFlagToggleSchema = z.object({
  enabled: z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform((value) => value === "true"),
  ]),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const MediaAssetRegistrationSchema = z.object({
  programmeCode: z.string().min(1),
  assetType: z.string().default("MASTER_VIDEO"),
  title: z.string().min(1),
  durationSeconds: z.number().positive().optional(),
});

export const AccessElevationRequestSchema = z.object({
  role: z.string().min(1),
  duration: z.string().default("SHIFT_8H"),
  justification: z.string().min(5),
});

export const PrivacyExportRequestSchema = z.object({
  email: z.string().email(),
  reason: z.string().optional(),
});

export const AuditLogPruneSchema = z.object({
  retentionDays: z.number().int().min(1),
  dryRun: z.boolean().default(true),
});
