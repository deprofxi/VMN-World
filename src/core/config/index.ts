import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file if available
dotenv.config();

// A blank assignment in a deployment env file means "not configured", not
// "invalid URL" — an unset optional must not block boot.
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());
const optionalTrimmed = z.preprocess(blankToUndefined, z.string().optional());

/**
 * PR-13: an env file can only express a boolean as a string, and
 * `z.coerce.boolean()` is the obvious-looking choice that is actively wrong —
 * `Boolean("false")`, `Boolean("0")` and `Boolean("no")` are all `true`, so an
 * operator who writes `FLAG=false` silently gets the opposite of what they
 * asked for on a fail-open path. This accepts exactly the two spellings (and a
 * blank assignment, which means "not configured" and takes the caller's
 * fallback); any other value is a boot error rather than a silent flip.
 */
const booleanish = (fallback: boolean) =>
  z.preprocess(
    (raw) => {
      if (raw === undefined || (typeof raw === "string" && raw.trim() === "")) return fallback;
      if (raw === true || raw === "true") return true;
      if (raw === false || raw === "false") return false;
      return raw; // falls through to z.boolean() and fails the load
    },
    z.boolean({
      invalid_type_error: 'must be exactly "true" or "false" (a blank value takes the default)',
    })
  );

/**
 * The carriage facts CLAUDE.md <broadcast> forbids inventing. They are
 * deployment inputs, never code defaults, and PR-14 makes
 * `STARTIMES_CARRIAGE_VERIFIED` the control that governs their admissibility
 * instead of a flag nothing reads.
 */
const CARRIAGE_FACT_KEYS = [
  "NXTR_DTT_CHANNEL",
  "NXTR_DTH_CHANNEL",
  "NXTR_SERVICE_PID",
  "ORIS_DTT_CHANNEL",
  "ORIS_DTH_CHANNEL",
  "ORIS_SERVICE_PID",
  "IMBD_DTT_CHANNEL",
  "IMBD_DTH_CHANNEL",
  "IMBD_SERVICE_PID",
] as const;

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(5500),
  APP_NAME: z.string().default("VMNL Enterprise Orchestrator"),
  APP_URL: z.string().url().default("http://localhost:5500"),

  // Primary PostgreSQL Database
  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }).min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  // PR-18: a lock wait or a pathological query used to pin a request and its
  // pool connection indefinitely — the pool set only `connectionTimeoutMillis`,
  // so acquiring a connection was bounded while *using* one was not. This bounds
  // both sides of the round trip: `statement_timeout` is enforced by Postgres
  // (the query is cancelled server-side and the connection returns to the pool)
  // and `query_timeout` bounds the client wait even when the server never
  // answers. Keep it below the request deadline so a slow query surfaces as a
  // query error rather than as a hung request.
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // Redis / Message Bus
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),

  // Authentication & Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for security"),
  JWT_EXPIRATION_SECONDS: z.coerce.number().default(86400),
  SESSION_COOKIE_NAME: z.string().default("vmnl_session"),

  // Storage
  STORAGE_DRIVER: z.enum(["local", "minio", "s3"]).default("local"),
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
  AZEEBO_FEDERATION_SECRET: z.string().min(16, "AZEEBO_FEDERATION_SECRET must be at least 16 characters").default("azeebo_federation_secret_key_32chars"),
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
  STARTIMES_CARRIAGE_VERIFIED: booleanish(false),
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

  // PR-04 / PR-15: the release-gate commands are the only readers of these two,
  // and they belong in this inventory rather than beside them: `tests/unit/production-readiness-controls.test.ts`
  // fails when `src/` reads a variable the schema does not declare, and the
  // release path is exactly where an unchecked typo is least affordable.
  //   RELEASE_ARTIFACT_DIGEST — digest of the build under evaluation.
  //   RELEASE_SIGNING_KEY     — the release owner's key; never committed, never
  //                             logged, and never required by the server itself.
  RELEASE_ARTIFACT_DIGEST: z.string().regex(/^[0-9a-fA-F]{64}$/, "must be a SHA-256 hex digest").optional(),
  RELEASE_SIGNING_KEY: z.string().min(16, "a release signing key must be at least 16 characters").optional(),

  // Observability
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
  PROMETHEUS_METRICS_ENABLED: booleanish(true),

  // PR-16: how long a graceful stop may take before the process exits rather
  // than waiting to be SIGKILLed. Must stay below the orchestrator's grace
  // period (Docker's default `stop_grace_period` is 10s).
  VMNL_SHUTDOWN_DEADLINE_MS: z.coerce.number().int().min(0).max(60000).default(8000),

  // ---------------------------------------------------------------------------
  // PR-15: variables the process reads directly from `process.env`.
  //
  // Before this block, 27 of the 37 variables the code consults bypassed the
  // schema entirely, so a typo produced `undefined` at the read site — which on
  // a `=== "true"` comparison fails open, and on a `!== "false"` comparison
  // silently changes which half of a gate is enforced. This block does not
  // change any default (each mirrors the fallback at the read site, and the
  // read sites still read `process.env`); it changes what happens when the
  // value is *wrong*, from a silent falsy to a refused boot.
  // `tests/unit/production-readiness-controls.test.ts` fails if a single
  // environment read in `src/` is missing from this object, which is what keeps
  // the coverage from decaying back.
  REDIS_URL: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^rediss?:\/\//, "REDIS_URL must start with redis:// or rediss:// (see PR-07: an unknown scheme is refused, not downgraded)")
      .optional()
  ),
  BROADCAST_HEADEND_UDP_HOST: optionalTrimmed,
  BROADCAST_HEADEND_UDP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
  ALLOW_MEMORY_KV_IN_PRODUCTION: booleanish(false),
  STORAGE_READINESS_GATING: booleanish(true),
  KV_READINESS_GATING: booleanish(true),
  TRUST_PROXY_HEADERS: booleanish(false),
  TRUSTED_PROXY_HOPS: z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(10).optional()),
  METRICS_TOKEN: z.preprocess(
    blankToUndefined,
    z.string().min(16, "METRICS_TOKEN must be at least 16 characters").optional()
  ),
  ALERT_WEBHOOK_URL: optionalUrl,
  ALERT_WEBHOOK_ALLOWED_HOSTS: optionalTrimmed,
  OTEL_ALLOWED_HOSTS: optionalTrimmed,
  AUTH_BYPASS_ENABLED: booleanish(false),
  ALLOW_SANDBOX_FALLBACK: booleanish(false),
  ALLOW_SHA_DRIFT: booleanish(false),
  PAYSTACK_SECRET_KEY: optionalTrimmed,
  FLUTTERWAVE_SECRET_HASH: optionalTrimmed,
  TERMII_API_KEY: optionalTrimmed,
  TERMII_BASE_URL: optionalUrl,
  TERMII_SENDER_ID: optionalTrimmed,
  SMTP_HOST: optionalTrimmed,
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
  EMAIL_FROM: optionalTrimmed,
  AWS_REGION: optionalTrimmed,
  SES_REGION: optionalTrimmed,
  // Sandbox seeding is opt-in and development/test-only; the value is read as a
  // string by `sandboxSeedOptIn`, so it is typed as one here rather than
  // coerced into a boolean the reader would not agree with.
  VMNL_ENABLE_SANDBOX_SEEDS: optionalTrimmed,
  VMNL_SEED_USERS_JSON: optionalTrimmed,
  DEV_SEED_PASSWORD: optionalTrimmed,
  DEV_SEED_PASSWORD_HASH: optionalTrimmed,
}).superRefine((data, ctx) => {
  // PR-14: carriage is verified as a COMPLETE fact set or not at all. Without
  // this the flag is decorative: an operator could inject provisional StarTimes
  // numbers with the flag left false and nothing would object, which is exactly
  // the failure CLAUDE.md <broadcast> names.
  const configuredCarriageFacts = CARRIAGE_FACT_KEYS.filter((key) => data[key] !== undefined);
  if (!data.STARTIMES_CARRIAGE_VERIFIED && configuredCarriageFacts.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STARTIMES_CARRIAGE_VERIFIED"],
      message: `Carriage facts may not be configured while STARTIMES_CARRIAGE_VERIFIED is false (received: ${configuredCarriageFacts.join(
        ", "
      )}). Unverified carriage data must not enter the process (CLAUDE.md <broadcast>).`,
    });
  }
  if (data.STARTIMES_CARRIAGE_VERIFIED) {
    const missingCarriageFacts = CARRIAGE_FACT_KEYS.filter((key) => data[key] === undefined);
    if (missingCarriageFacts.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STARTIMES_CARRIAGE_VERIFIED"],
        message: `STARTIMES_CARRIAGE_VERIFIED=true requires the complete carriage fact set; missing: ${missingCarriageFacts.join(
          ", "
        )}.`,
      });
    }
  }
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
