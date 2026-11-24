/**
 * Enterprise System Configuration Service (SuperAdmin Access Only)
 * Authority: VMNL-AZP-VMN-CCPP-001 §9 / PRD §12
 *
 * Centralizes global platform, brand identity, security governance, and
 * broadcast safeguard settings. Mutations require SuperAdmin authority,
 * validate against a strict schema, sync brand settings cleanly, persist
 * through the KV store, and append to the tamper-evident audit chain.
 */

import { z } from "zod";
import { resolveKeyValueAdapter } from "../cache/index.js";
import { recordAuditLog } from "../audit/index.js";
import { getBrandConfig, updateBrandLogo, resetBrandLogo } from "../branding/logo-service.js";
import { getConfig } from "./index.js";

export type BroadcastStatusLabel = "LIVE BROADCAST" | "MAINTENANCE WINDOW" | "SANDBOX MODE";

export interface SystemConfig {
  // Brand & Corporate Identity
  brandName: string;
  brandShort: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  companyRcNumber: string;

  // Security & Identity Governance
  sessionTtlHours: number;
  auditRetentionDays: number;
  requireMfaForAdmins: boolean;
  allowPublicSignUp: boolean;

  // Broadcast & Playout Safeguards
  scheduleLockWindowHours: number;
  competitorSeparationMinutes: number;
  failClosedRightsEnforcement: boolean;
  emergencyFillerFallbackEnabled: boolean;

  // Platform Operating Mode
  broadcastStatusLabel: BroadcastStatusLabel;
  federationHeartbeatIntervalSec: number;
  maintenanceBannerEnabled: boolean;
  maintenanceBannerMessage: string;

  // Audit metadata
  revision: number;
  updatedAt: string;
  updatedBy: string;
}

export interface EnvironmentPosture {
  nodeEnv: string;
  port: number;
  appName: string;
  storageDriver: string;
  databaseConfigured: boolean;
  redisConfigured: boolean;
  carriageVerified: boolean;
  authBypassActive: boolean;
}

const SYSTEM_CONFIG_KV_KEY = "vmnl:system:config";

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  brandName: "Virtual Media Network Limited",
  brandShort: "VMN World",
  tagline: "Nigeria's premier broadcast television, creative hub, and streaming ecosystem.",
  logoUrl: null,
  supportEmail: "support@vmnl.ng",
  companyRcNumber: "",

  sessionTtlHours: 24,
  auditRetentionDays: 2555,
  requireMfaForAdmins: true,
  allowPublicSignUp: false,

  scheduleLockWindowHours: 48,
  competitorSeparationMinutes: 15,
  failClosedRightsEnforcement: true,
  emergencyFillerFallbackEnabled: true,

  broadcastStatusLabel: "LIVE BROADCAST",
  federationHeartbeatIntervalSec: 30,
  maintenanceBannerEnabled: false,
  maintenanceBannerMessage: "",

  revision: 1,
  updatedAt: new Date(0).toISOString(),
  updatedBy: "system-default",
};

const logoUrlSchema = z
  .string()
  .trim()
  .max(2_500_000, "Logo image payload exceeds 2MB ceiling")
  .refine(
    (val) =>
      val === "" ||
      val.startsWith("data:image/") ||
      val.startsWith("http://") ||
      val.startsWith("https://") ||
      val.startsWith("/assets/") ||
      val.startsWith("/uploads/"),
    "Logo URL must start with https://, http://, /assets/, /uploads/, or data:image/"
  )
  .nullable()
  .optional();

export const SystemConfigUpdateSchema = z.object({
  brandName: z.string().trim().min(2).max(120).optional(),
  brandShort: z.string().trim().min(2).max(32).optional(),
  tagline: z.string().trim().min(4).max(240).optional(),
  logoUrl: logoUrlSchema,
  supportEmail: z.string().trim().email().max(120).optional(),
  companyRcNumber: z.string().trim().max(40).optional(),

  sessionTtlHours: z.coerce.number().int().min(1).max(168).optional(),
  auditRetentionDays: z.coerce.number().int().min(90).max(3650).optional(),
  requireMfaForAdmins: z.boolean().optional(),
  allowPublicSignUp: z.boolean().optional(),

  scheduleLockWindowHours: z.coerce.number().int().min(1).max(168).optional(),
  competitorSeparationMinutes: z.coerce.number().int().min(5).max(60).optional(),
  failClosedRightsEnforcement: z.boolean().optional(),
  emergencyFillerFallbackEnabled: z.boolean().optional(),

  broadcastStatusLabel: z.enum(["LIVE BROADCAST", "MAINTENANCE WINDOW", "SANDBOX MODE"]).optional(),
  federationHeartbeatIntervalSec: z.coerce.number().int().min(10).max(300).optional(),
  maintenanceBannerEnabled: z.boolean().optional(),
  maintenanceBannerMessage: z.string().trim().max(280).optional(),
});

export type SystemConfigPatch = z.infer<typeof SystemConfigUpdateSchema>;

let currentSystemConfig: SystemConfig = { ...DEFAULT_SYSTEM_CONFIG };

function syncBrandingService(next: SystemConfig): void {
  if (next.logoUrl) {
    updateBrandLogo({
      logoDataUrl: next.logoUrl,
      brandName: next.brandName,
      brandShort: next.brandShort,
      tagline: next.tagline,
    });
    return;
  }
  const existing = getBrandConfig();
  if (existing.logoUrl !== null) {
    resetBrandLogo();
  }
}

function persistConfigToKv(config: SystemConfig): void {
  void resolveKeyValueAdapter()
    .set(SYSTEM_CONFIG_KV_KEY, JSON.stringify(config), 0)
    .catch(() => {
      /* In-memory snapshot remains authoritative if KV is offline */
    });
}

/**
 * Returns a defensive copy of the active enterprise system configuration.
 */
export function getSystemConfig(): SystemConfig {
  return { ...currentSystemConfig };
}

/**
 * Hydrates persisted system configuration from the KV store at server startup.
 */
export async function hydrateSystemConfigFromKv(): Promise<{ hydrated: boolean; revision?: number }> {
  try {
    const raw = await resolveKeyValueAdapter().get(SYSTEM_CONFIG_KV_KEY);
    if (!raw) return { hydrated: false };
    const parsed = JSON.parse(raw) as Partial<SystemConfig>;
    const validated = SystemConfigUpdateSchema.safeParse(parsed);
    if (!validated.success) return { hydrated: false };

    currentSystemConfig = {
      ...DEFAULT_SYSTEM_CONFIG,
      ...validated.data,
      logoUrl: validated.data.logoUrl === "" ? null : (validated.data.logoUrl ?? DEFAULT_SYSTEM_CONFIG.logoUrl),
      revision: typeof parsed.revision === "number" && parsed.revision > 0 ? parsed.revision : 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "kv-hydrate",
    };
    syncBrandingService(currentSystemConfig);
    return { hydrated: true, revision: currentSystemConfig.revision };
  } catch {
    return { hydrated: false };
  }
}

/**
 * Normalizes form-encoded or JSON payloads into typed SystemConfigPatch inputs.
 */
export function parseSystemConfigInput(raw: Record<string, unknown>, isFormSubmission: boolean): SystemConfigPatch {
  const boolField = (key: string): boolean | undefined => {
    const value = raw[key];
    if (isFormSubmission) {
      return value === "true" || value === "on" || value === "1" || value === true;
    }
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  };

  const strField = (key: string): string | undefined =>
    typeof raw[key] === "string" ? (raw[key] as string) : undefined;

  const candidate: Record<string, unknown> = {
    ...(strField("brandName") !== undefined ? { brandName: strField("brandName") } : {}),
    ...(strField("brandShort") !== undefined ? { brandShort: strField("brandShort") } : {}),
    ...(strField("tagline") !== undefined ? { tagline: strField("tagline") } : {}),
    ...(raw.logoUrl === null || typeof raw.logoUrl === "string" ? { logoUrl: raw.logoUrl === "" ? null : raw.logoUrl } : {}),
    ...(strField("supportEmail") !== undefined ? { supportEmail: strField("supportEmail") } : {}),
    ...(strField("companyRcNumber") !== undefined ? { companyRcNumber: strField("companyRcNumber") } : {}),
    ...(raw.sessionTtlHours !== undefined ? { sessionTtlHours: raw.sessionTtlHours } : {}),
    ...(raw.auditRetentionDays !== undefined ? { auditRetentionDays: raw.auditRetentionDays } : {}),
    ...(isFormSubmission || raw.requireMfaForAdmins !== undefined ? { requireMfaForAdmins: boolField("requireMfaForAdmins") } : {}),
    ...(isFormSubmission || raw.allowPublicSignUp !== undefined ? { allowPublicSignUp: boolField("allowPublicSignUp") } : {}),
    ...(raw.scheduleLockWindowHours !== undefined ? { scheduleLockWindowHours: raw.scheduleLockWindowHours } : {}),
    ...(raw.competitorSeparationMinutes !== undefined ? { competitorSeparationMinutes: raw.competitorSeparationMinutes } : {}),
    ...(isFormSubmission || raw.failClosedRightsEnforcement !== undefined ? { failClosedRightsEnforcement: boolField("failClosedRightsEnforcement") } : {}),
    ...(isFormSubmission || raw.emergencyFillerFallbackEnabled !== undefined ? { emergencyFillerFallbackEnabled: boolField("emergencyFillerFallbackEnabled") } : {}),
    ...(strField("broadcastStatusLabel") !== undefined ? { broadcastStatusLabel: strField("broadcastStatusLabel") } : {}),
    ...(raw.federationHeartbeatIntervalSec !== undefined ? { federationHeartbeatIntervalSec: raw.federationHeartbeatIntervalSec } : {}),
    ...(isFormSubmission || raw.maintenanceBannerEnabled !== undefined ? { maintenanceBannerEnabled: boolField("maintenanceBannerEnabled") } : {}),
    ...(strField("maintenanceBannerMessage") !== undefined ? { maintenanceBannerMessage: strField("maintenanceBannerMessage") } : {}),
  };

  return SystemConfigUpdateSchema.parse(candidate);
}

/**
 * Applies validated SuperAdmin updates to system configuration and logs an audit entry.
 */
export function updateSystemConfig(
  patch: SystemConfigPatch,
  actor: { userId: string; email?: string; ipAddress?: string | null; userAgent?: string | null }
): SystemConfig {
  const previous = { ...currentSystemConfig };
  const normalizedLogo = patch.logoUrl === undefined ? previous.logoUrl : patch.logoUrl === "" ? null : patch.logoUrl;

  const next: SystemConfig = {
    ...previous,
    ...patch,
    logoUrl: normalizedLogo,
    revision: previous.revision + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email || actor.userId,
  };

  const changedKeys = (Object.keys(patch) as Array<keyof SystemConfigPatch>).filter(
    (key) => patch[key] !== undefined && previous[key] !== next[key]
  );

  currentSystemConfig = next;
  syncBrandingService(next);
  persistConfigToKv(next);

  recordAuditLog({
    userId: actor.userId,
    action: "system_config.update",
    resource: "audit",
    resourceId: `sys-config-rev-${next.revision}`,
    ipAddress: actor.ipAddress ?? null,
    userAgent: actor.userAgent ?? null,
    changes: {
      changedKeys,
      revision: next.revision,
    },
  });

  return { ...next };
}

/**
 * Restores factory default configuration and records an audit event.
 */
export function resetSystemConfig(actor: {
  userId: string;
  email?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): SystemConfig {
  const nextRevision = currentSystemConfig.revision + 1;
  const next: SystemConfig = {
    ...DEFAULT_SYSTEM_CONFIG,
    revision: nextRevision,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email || actor.userId,
  };

  currentSystemConfig = next;
  resetBrandLogo();
  persistConfigToKv(next);

  recordAuditLog({
    userId: actor.userId,
    action: "system_config.reset",
    resource: "audit",
    resourceId: `sys-config-rev-${next.revision}`,
    ipAddress: actor.ipAddress ?? null,
    userAgent: actor.userAgent ?? null,
    changes: { revision: next.revision },
  });

  return { ...next };
}

/**
 * Returns non-secret operational posture flags from runtime environment config.
 */
export function getEnvironmentPosture(): EnvironmentPosture {
  const cfg = getConfig();
  return {
    nodeEnv: cfg.NODE_ENV,
    port: cfg.PORT,
    appName: cfg.APP_NAME,
    storageDriver: cfg.STORAGE_DRIVER,
    databaseConfigured: Boolean(cfg.DATABASE_URL),
    redisConfigured: Boolean(cfg.REDIS_URL),
    carriageVerified: cfg.STARTIMES_CARRIAGE_VERIFIED,
    authBypassActive: cfg.NODE_ENV === "development" && cfg.AUTH_BYPASS_ENABLED,
  };
}

/**
 * Test seam for resetting in-memory state cleanly between test cases.
 */
export function _resetSystemConfigForTesting(): void {
  currentSystemConfig = { ...DEFAULT_SYSTEM_CONFIG };
  resetBrandLogo();
}
