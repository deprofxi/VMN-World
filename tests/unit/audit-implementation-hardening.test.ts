import { describe, it, expect, afterEach } from "vitest";
import { MemoryKeyValueAdapter, resolveKeyValueAdapter, _resetCacheAdapterForTesting } from "../../src/core/cache/index.js";
import { useKeyValueAdapterForAuthStores, checkSharedRateLimit } from "../../src/core/auth/index.js";
import { recordAuditLog } from "../../src/core/audit/index.js";
import { createApiServer } from "../../src/api/server.js";

describe("audit implementation hardening", () => {
  afterEach(() => {
    _resetCacheAdapterForTesting();
    useKeyValueAdapterForAuthStores(new MemoryKeyValueAdapter());
  });

  describe("AUD-14: shared KV-backed rate limiter", () => {
    it("counts one shared budget across calls and sheds load at the cap", async () => {
      const adapter = new MemoryKeyValueAdapter();
      _resetCacheAdapterForTesting();
      resolveKeyValueAdapter();
      useKeyValueAdapterForAuthStores(adapter);

      const first = await checkSharedRateLimit("test-budget", 2, 5_000);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);
      expect(first.backend).toBe("memory");
      expect(first.sharedBackendAvailable).toBe(true);

      const second = await checkSharedRateLimit("test-budget", 2, 5_000);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);

      const third = await checkSharedRateLimit("test-budget", 2, 5_000);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
      expect(third.resetInMs).toBeGreaterThan(0);
    });

    it("keeps budgets isolated per key within one fixed window", async () => {
      const adapter = new MemoryKeyValueAdapter();
      _resetCacheAdapterForTesting();
      resolveKeyValueAdapter();
      useKeyValueAdapterForAuthStores(adapter);

      // Wide window so both calls land in the same time bucket.
      const first = await checkSharedRateLimit("bucketed-budget", 1, 60_000);
      expect(first.allowed).toBe(true);
      const blocked = await checkSharedRateLimit("bucketed-budget", 1, 60_000);
      expect(blocked.allowed).toBe(false);
      // A different key is a different budget entirely.
      const otherKey = await checkSharedRateLimit("bucketed-budget-other", 1, 60_000);
      expect(otherKey.allowed).toBe(true);
    });

    it("sheds load (fail closed) when the shared backend is unreachable", async () => {
      class FailingKVAdapter extends MemoryKeyValueAdapter {
        public async incrBy(): Promise<number> {
          throw new Error("shared backend down");
        }
      }
      _resetCacheAdapterForTesting();
      resolveKeyValueAdapter();
      useKeyValueAdapterForAuthStores(new FailingKVAdapter());

      const result = await checkSharedRateLimit("down-backend", 10, 5_000);
      expect(result.allowed).toBe(false);
      expect(result.sharedBackendAvailable).toBe(false);
    });
  });

  describe("AUD-03/04: production boot refuses memory-only KV backend", () => {
    it("throws when production boots resolve the in-memory adapter", () => {
      const previousNodeEnv = process.env.NODE_ENV;
      const previousFallback = process.env.ALLOW_SANDBOX_FALLBACK;
      const previousRedisUrl = process.env.REDIS_URL;
      delete process.env.ALLOW_SANDBOX_FALLBACK;
      delete process.env.REDIS_URL;
      process.env.NODE_ENV = "production";
      try {
        expect(() =>
          createApiServer(0, {
            NODE_ENV: "production",
            JWT_SECRET: "kv-gate-jwt-secret-with-at-least-32-characters",
            SESSION_SECRET: "kv-gate-session-secret-with-at-least-32-characters",
            PII_ENCRYPTION_KEY: "kv-gate-pii-encryption-key-with-at-least-32-chars",
            AZEEBO_WEBHOOK_SECRET: "kv-gate-azeebo-webhook-secret-16-chars",
            FUSION_EVENTS_HMAC_SECRET: "kv-gate-fusion-hmac-secret-with-at-least-32-ch",
            STORAGE_ACCESS_KEY: "kv-gate-storage-access",
            STORAGE_SECRET_KEY: "kv-gate-storage-secret-key",
          })
        ).toThrow(/KV adapter resolved to the in-memory backend/);
      } finally {
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
        if (previousFallback === undefined) delete process.env.ALLOW_SANDBOX_FALLBACK;
        else process.env.ALLOW_SANDBOX_FALLBACK = previousFallback;
        if (previousRedisUrl === undefined) delete process.env.REDIS_URL;
        else process.env.REDIS_URL = previousRedisUrl;
      }
    });
  });

  describe("AUD-05: durable audit chain tail", () => {
    it("persists the chain tail to the KV adapter after each entry", async () => {
      // The audit module writes to the process-wide singleton resolved inside
      // persistChainTail(); the test must read that same instance.
      _resetCacheAdapterForTesting();
      const adapter = resolveKeyValueAdapter();
      useKeyValueAdapterForAuthStores(adapter);

      const first = recordAuditLog({ action: "hardening.chain.entry", resource: "audit", changes: { n: 1 } });
      const second = recordAuditLog({ action: "hardening.chain.entry", resource: "audit", changes: { n: 2 } });
      expect(second.previousHash).toBe(first.entryHash);

      // The tail write is fire-and-forget; poll briefly for determinism.
      let tailRaw: string | null = null;
      for (let i = 0; i < 50 && !tailRaw; i++) {
        tailRaw = await adapter.get("audit:chain:tail");
        if (!tailRaw) await new Promise((r) => setTimeout(r, 10));
      }
      expect(tailRaw).toBeTruthy();
      const tail = JSON.parse(tailRaw as string) as { seq: number; hash: string };
      expect(tail.seq).toBeGreaterThanOrEqual(2);
      expect(tail.hash).toBe(second.entryHash);
    });
  });
});
