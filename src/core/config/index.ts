import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file if available
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default("VMNL Enterprise Orchestrator"),
  APP_URL: z.string().url().default("http://localhost:4000"),

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
  AZEEBO_PLUS_UNIVERSAL_URL: z.string().url().default("https://azeebo.plus"),
  AZEEBO_API_BASE_URL: z.string().url().default("https://api.azeebo.plus/v1"),
  AZEEBO_CLIENT_ID: z.string().default("vmnl_enterprise_hub"),
  AZEEBO_WEBHOOK_SECRET: z.string().min(16, "AZEEBO_WEBHOOK_SECRET must be at least 16 characters"),
  AZEEBO_APP_SCHEME: z.string().default("azeeboplus"),

  // Security & CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:4000,https://vmnl.ng,https://azeebo.plus"),
  FUSION_EVENTS_HMAC_SECRET: z.string().min(16).default("vmnl_fusion_events_hmac_secret_key_prod"),
  CDN_BASE_URL: z.string().url().default("http://localhost:9000/vmnl-assets"),

  // StarTimes Carriage & Verification Authority (CLAUDE.md Law: Mark clearly as provisional until verified)
  STARTIMES_CARRIAGE_VERIFIED: z.coerce.boolean().default(false),
  NXTR_DTT_CHANNEL: z.coerce.number().default(428),
  NXTR_DTH_CHANNEL: z.coerce.number().default(312),
  NXTR_SERVICE_PID: z.coerce.number().default(1042),
  ORIS_DTT_CHANNEL: z.coerce.number().default(430),
  ORIS_DTH_CHANNEL: z.coerce.number().default(315),
  ORIS_SERVICE_PID: z.coerce.number().default(1044),
  IMBD_DTT_CHANNEL: z.coerce.number().default(432),
  IMBD_DTH_CHANNEL: z.coerce.number().default(318),
  IMBD_SERVICE_PID: z.coerce.number().default(1046),
  COMPANY_RC_NUMBER: z.string().default("RC 642819 (Provisional - Pending StarTimes / CAC Verification)"),

  // Observability
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
  PROMETHEUS_METRICS_ENABLED: z.coerce.boolean().default(true),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const result = configSchema.safeParse(env);
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
    // Provide safe defaults for testing if DATABASE_URL is not set
    const fallbackEnv = {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://root@localhost:5432/vmnl_enterprise?schema=public",
      JWT_SECRET: process.env.JWT_SECRET || "default_test_jwt_secret_must_be_32_chars_long!!",
      AZEEBO_WEBHOOK_SECRET: process.env.AZEEBO_WEBHOOK_SECRET || "default_azeebo_webhook_secret_key_32chars"
    };
    configInstance = loadConfig(fallbackEnv);
  }
  return configInstance;
}
