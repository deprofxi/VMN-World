import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/core/config/index.js";

describe("Configuration Loader & Validator (TASK-P0-03)", () => {
  it("should successfully load and parse valid configuration", () => {
    const validEnv = {
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/vmnl_test",
      JWT_SECRET: "12345678901234567890123456789012",
      AZEEBO_WEBHOOK_SECRET: "azeebo_secret_16chars_min",
    };

    const config = loadConfig(validEnv);
    expect(config.NODE_ENV).toBe("test");
    expect(config.PORT).toBe(5000);
    expect(config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/vmnl_test");
    expect(config.STORAGE_DRIVER).toBe("local"); // default
  });

  it("should fail fast when required DATABASE_URL is missing", () => {
    const invalidEnv = {
      JWT_SECRET: "12345678901234567890123456789012",
      AZEEBO_WEBHOOK_SECRET: "azeebo_secret_16chars_min",
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/DATABASE_URL is required/);
  });

  it("should fail fast when JWT_SECRET is too short (< 32 chars)", () => {
    const invalidEnv = {
      DATABASE_URL: "postgresql://localhost:5432/test",
      JWT_SECRET: "short_secret",
      AZEEBO_WEBHOOK_SECRET: "azeebo_secret_16chars_min",
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/JWT_SECRET must be at least 32 characters/);
  });

  it("rejects known/default production secrets and an enabled webhook bypass", () => {
    const base = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@db.example:5432/vmnl",
      JWT_SECRET: "independent-production-jwt-secret-material-123456",
      AZEEBO_WEBHOOK_SECRET: "production-webhook-secret-material-123456",
      SESSION_SECRET: "distinct-session-csrf-secret-material-123456",
      PII_ENCRYPTION_KEY: "dedicated-pii-encryption-key-material-123456",
      FUSION_EVENTS_HMAC_SECRET: "production-fusion-secret-material-123456",
      STORAGE_ACCESS_KEY: "production-storage-access",
      STORAGE_SECRET_KEY: "production-storage-secret-material",
      WEBHOOK_SIGNATURE_BYPASS_ALLOWED: "true",
    };
    expect(() => loadConfig(base)).toThrow(/WEBHOOK_SIGNATURE_BYPASS_ALLOWED/);
    expect(() => loadConfig({ ...base, WEBHOOK_SIGNATURE_BYPASS_ALLOWED: "false", STORAGE_ACCESS_KEY: "minioadmin" })).toThrow(/sandbox storage credentials/);
    expect(() => loadConfig({ ...base, WEBHOOK_SIGNATURE_BYPASS_ALLOWED: "false", FUSION_EVENTS_HMAC_SECRET: "vmnl_dev_fusion_hmac_placeholder_only" })).toThrow(/FUSION_EVENTS_HMAC_SECRET/);
    expect(() => loadConfig({ ...base, WEBHOOK_SIGNATURE_BYPASS_ALLOWED: "false", STORAGE_ACCESS_KEY: undefined as unknown as string })).toThrow(/must be explicitly provided/);
    expect(() => loadConfig({ ...base, WEBHOOK_SIGNATURE_BYPASS_ALLOWED: "false", FUSION_EVENTS_HMAC_SECRET: "too-short-secret" })).toThrow(/at least 32 characters/);
  });

  it("should reject invalid URLs for AZEEBO_API_BASE_URL", () => {
    const invalidEnv = {
      DATABASE_URL: "postgresql://localhost:5432/test",
      JWT_SECRET: "12345678901234567890123456789012",
      AZEEBO_WEBHOOK_SECRET: "azeebo_secret_16chars_min",
      AZEEBO_API_BASE_URL: "not-a-valid-url",
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/AZEEBO_API_BASE_URL/);
  });
});
