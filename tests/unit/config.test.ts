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
    expect(config.STORAGE_DRIVER).toBe("minio"); // default
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
