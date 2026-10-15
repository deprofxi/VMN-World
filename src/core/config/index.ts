import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file if available
dotenv.config();

// A blank assignment in a deployment env file means "not configured", not
// "invalid URL" — an unset optional must not block boot.
const optionalUrl = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().url().optional());

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(5500),
  APP_NAME: z.string().default("VMNL Enterprise Orchestrator"),
  APP_URL: z.string().url().default("http://localhost:5500"),

  // Primary PostgreSQL Database
  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }).min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(20),

  // Redis / Message Bus
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),

  // Authentication & Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for security"),
  JWT_EXPIRATION_SECONDS: z.coerce.number().default(86400),
  SESSION_COOKIE_NAME: z.string().default("vmnl_session"),

  // Storage
  STORAGE_DRIVER: z.enum(["local", "minio", "s3"]).default("minio"),
  STORAGE_ENDPOINT: z.string().default("http://localhost:9000"),
  STORAGE_BUCKET: z.string().default("vmnl-assets"),
  STORAGE_ACCESS_KEY: z.string().default("minioadmin"),
  STORAGE_SECRET_KEY: z.string().default("minioadmin"),
  STORAGE_REGION: z.string().default("us-east-1"),

  // Azeebo+ Federation
  // CLAUDE.md <azeebo> / PRD §41: azeebo.plus is another company's production
  // domain. It must never be a code default — an unset value disables outbound
  // federation instead of fabricating an endpoint.
  AZEEBO_PLUS_UNIVERSAL_URL: optionalUrl,
  AZEEBO_API_BASE_URL: optionalUrl,
  AZEEBO_CLIENT_ID: z.string().default("vmnl_enterprise_hub"),
  AZEEBO_WEBHOOK_SECRET: z.string().min(16, "AZEEBO_WEBHOOK_SECRET must be at least 16 characters"),
  AZEEBO_APP_SCHEME: z.string().default("azeeboplus"),

  // Security & CORS
  // TSK-35: the partner origin is not a cross-origin trust default. A
  // deployment that needs azeebo.plus as an allowed origin states so here.
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5500,https://vmnl.ng"),
  // Local-only placeholder; deployment environments must provide real key material.
  FUSION_EVENTS_HMAC_SECRET: z.string().min(16).default("vmnl_dev_fusion_hmac_placeholder_only"),

  // Dedicated session CSRF secret — must not share value with JWT_SECRET (AUD-08)
  SESSION_SECRET: z.string().min(32).optional(),
  // PII field-level encryption key — required in production (AUD-09)
  PII_ENCRYPTION_KEY: z.string().min(32).optional(),
  // Webhook signature bypass — only allowed in dev/test (AUD-10)
  WEBHOOK_SIGNATURE_BYPASS_ALLOWED: z.string().optional().default("false"),

  CDN_BASE_URL: z.string().url().default("http://localhost:9000/vmnl-assets"),

  // StarTimes Carriage & Verification Authority (CLAUDE.md Law: Mark clearly as provisional until verified)
  // AUD-09: carriage numbers/PIDs are deployment facts that must come from a
  // verified carriage record, not code defaults — CLAUDE.md forbids hard-coding
  // unverified channel numbers. Values are optional and unset unless the
  // operator explicitly configures them alongside STARTIMES_CARRIAGE_VERIFIED.
  STARTIMES_CARRIAGE_VERIFIED: z.coerce.boolean().default(false),
  NXTR_DTT_CHANNEL: z.coerce.number().optional(),
  NXTR_DTH_CHANNEL: z.coerce.number().optional(),
  NXTR_SERVICE_PID: z.coerce.number().optional(),
  ORIS_DTT_CHANNEL: z.coerce.number().optional(),
  ORIS_DTH_CHANNEL: z.coerce.number().optional(),
  ORIS_SERVICE_PID: z.coerce.number().optional(),
  IMBD_DTT_CHANNEL: z.coerce.number().optional(),
  IMBD_DTH_CHANNEL: z.coerce.number().optional(),
  IMBD_SERVICE_PID: z.coerce.number().optional(),
  COMPANY_RC_NUMBER: z.string().default(""),

  // Observability
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
  PROMETHEUS_METRICS_ENABLED: z.coerce.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" || data.NODE_ENV === "staging") {
    if (
      data.JWT_SECRET.startsWith("CHANGE_ME") ||
      data.JWT_SECRET.includes("super-secret-vmnl") ||
      data.JWT_SECRET.includes("default_test_jwt_secret")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must not use a default template or placeholder secret in production/staging environments.",
      });
    }
    // AUD-09: PII_ENCRYPTION_KEY is required in production/staging
    if (!data.PII_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PII_ENCRYPTION_KEY"],
        message: "PII_ENCRYPTION_KEY is required in production/staging environments (min 32 chars).",
      });
    }
    if (!data.SESSION_SECRET || data.SESSION_SECRET === data.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be set and differ from JWT_SECRET in production/staging.",
      });
    }
    if (data.FUSION_EVENTS_HMAC_SECRET === "vmnl_dev_fusion_hmac_placeholder_only" || data.FUSION_EVENTS_HMAC_SECRET === "vmnl_fusion_events_hmac_secret_key_prod") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FUSION_EVENTS_HMAC_SECRET"],
        message: "FUSION_EVENTS_HMAC_SECRET must be deployment-provided in production/staging.",
      });
    }
    if (!data.STORAGE_ACCESS_KEY || !data.STORAGE_SECRET_KEY || ["minioadmin", "minioadmin_secure_key"].includes(data.STORAGE_ACCESS_KEY) || ["minioadmin", "minioadmin_secure_key"].includes(data.STORAGE_SECRET_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_ACCESS_KEY"],
        message: "Known sandbox storage credentials are forbidden in production/staging.",
      });
    }
    if (data.FUSION_EVENTS_HMAC_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FUSION_EVENTS_HMAC_SECRET"],
        message: "FUSION_EVENTS_HMAC_SECRET must be deployment-provided with at least 32 characters in production/staging.",
      });
    }
    // AUD-10: webhook signature bypass must never be enabled in production/staging
    if (data.WEBHOOK_SIGNATURE_BYPASS_ALLOWED.toLowerCase() === "true") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WEBHOOK_SIGNATURE_BYPASS_ALLOWED"],
        message: "WEBHOOK_SIGNATURE_BYPASS_ALLOWED must not be 'true' in production/staging environments.",
      });
    }
  }
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const deploymentEnvironment = env.NODE_ENV === "production" || env.NODE_ENV === "staging";
  const missingDeploymentSecrets = deploymentEnvironment
    ? [
        ...(!env.STORAGE_ACCESS_KEY ? ["STORAGE_ACCESS_KEY"] : []),
        ...(!env.STORAGE_SECRET_KEY ? ["STORAGE_SECRET_KEY"] : []),
        ...(!env.FUSION_EVENTS_HMAC_SECRET ? ["FUSION_EVENTS_HMAC_SECRET"] : []),
      ]
    : [];
  const result = configSchema.safeParse(env);
  if (missingDeploymentSecrets.length > 0) {
    throw new Error(`[VMNL-CONFIG-ERROR] Invalid environment configuration:\n  - Deployment secrets must be explicitly provided: ${missingDeploymentSecrets.join(", ")}`);
  }
  if (!result.success) {
    const errorDetails = result.error.errors.map(err => `  - [${err.path.join(".")}]: ${err.message}`).join("\n");
    throw new Error(`[VMNL-CONFIG-ERROR] Invalid environment configuration:\n${errorDetails}`);
  }
  return result.data;
}

// Default singleton instance using process.env
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    const isProductionOrStaging = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
    if (isProductionOrStaging) {
      // In production or staging, strictly fail-fast with zero in-code secret fallbacks (A-3, CR-6)
      configInstance = loadConfig(process.env);
    } else {
      // Safe non-production testing sandbox defaults
      const fallbackEnv = {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://vmn_user:vmn_sandbox_only_password@localhost:5432/vmn_enterprise?schema=public",
        JWT_SECRET: process.env.JWT_SECRET || "default_test_jwt_secret_must_be_32_chars_long!!",
        AZEEBO_WEBHOOK_SECRET: process.env.AZEEBO_WEBHOOK_SECRET || "default_azeebo_webhook_secret_key_32chars",
      };
      configInstance = loadConfig(fallbackEnv);
    }
  }
  return configInstance;
}

/**
 * Test seam: drop the cached singleton so the next getConfig() re-reads the
 * environment. Callers must restore the environment and reset again.
 */
export function _resetConfigForTesting(): void {
  configInstance = null;
}
