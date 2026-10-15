/**
 * TSK-27 (`report.md` CA-26): the auth stores kept their authoritative state in
 * process-local Maps, so a two-instance deployment disagreed about who was
 * enrolled, who was locked out, which MFA challenge had been spent and which
 * session had been revoked. Each test below runs two simulated instances against
 * one shared adapter: a fresh instance is exactly what a second process is — no
 * local copies, the same KV backend.
 */
import { describe, it, expect, afterAll } from "vitest";
import http from "node:http";
import { readFileSync } from "node:fs";
import {
  assertSharedKvBackendForEnvironment,
  configureRedisAdapterFactory,
  MemoryKeyValueAdapter,
  RedisKeyValueAdapter,
  resolveKeyValueAdapter,
  _resetCacheAdapterForTesting,
} from "../../src/core/cache/index.js";
import type { KeyValueAdapter, MinimalRedisClient } from "../../src/core/cache/index.js";
import {
  authenticateUser,
  consumeMfaLoginChallenge,
  findUserByEmail,
  InMemoryRevocationStore,
  primeSessionRevocation,
  registerUser,
  revokeToken,
  setTokenRevocationStore,
  signMfaLoginChallenge,
  signSessionToken,
  updateUserMfaEnrollment,
  useKeyValueAdapterForAuthStores,
  verifySessionToken,
  _resetSharedAuthStateForTesting,
} from "../../src/core/auth/index.js";
import {
  computeSessionId,
  registerSession,
  revokeSessionById,
  useKeyValueAdapterForSessions,
  _resetSessionsForTesting,
} from "../../src/core/auth/sessions.js";
import { createApiServer } from "../../src/api/server.js";
import type { ApiServerInstance } from "../../src/api/server.js";
import { checkDatabaseConnection } from "../../src/core/database/index.js";

const PASSWORD = "SharedAcrossInstances2026!";
const TOTP_SEED = "JBSWY3DPEHPK3PXP";

/** Bind a shared adapter as a process that has never served a request yet. */
function startInstance(adapter: KeyValueAdapter): void {
  _resetSharedAuthStateForTesting();
  _resetSessionsForTesting();
  setTokenRevocationStore(new InMemoryRevocationStore());
  useKeyValueAdapterForAuthStores(adapter);
  useKeyValueAdapterForSessions(adapter);
}

function request(port: number, pathname: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path: pathname, method: "GET" }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end();
  });
}

describe("TSK-27: auth state is the shared backend's, not this process's", () => {
  it("locks an account whose failures were earned across two instances", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = `lockout-fleet-${Date.now()}@vmnl.ng`;

    startInstance(shared);
    await registerUser({ email, password: PASSWORD });
    for (let i = 0; i < 3; i++) {
      expect((await authenticateUser(email, "wrong-password-1")).user).toBeNull();
    }
    // The counter lives in the adapter, not in the instance that wrote it.
    expect(await shared.get(`auth:fail:${email}`)).toBe("3");

    startInstance(shared); // second instance: no local failure history
    for (let i = 0; i < 2; i++) {
      expect((await authenticateUser(email, "wrong-password-2")).user).toBeNull();
    }
    expect(await shared.get(`auth:lock:${email}`)).toBeTruthy();

    startInstance(shared); // third instance: the correct password, still locked
    const attempt = await authenticateUser(email, PASSWORD);
    expect(attempt.user).toBeNull();
    expect(attempt.lockedForMs).toBeGreaterThan(0);
  });

  it("clears the shared counters on a good login, so the lockout is not permanent", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = `lockout-clear-${Date.now()}@vmnl.ng`;

    startInstance(shared);
    await registerUser({ email, password: PASSWORD });
    for (let i = 0; i < 4; i++) await authenticateUser(email, "nope-not-this-one");
    expect(await shared.get(`auth:fail:${email}`)).toBe("4");

    startInstance(shared);
    const ok = await authenticateUser(email, PASSWORD);
    expect(ok.user?.email).toBe(email);
    expect(await shared.get(`auth:fail:${email}`)).toBeNull();

    // A fresh instance starts from zero failures, not from the previous window.
    startInstance(shared);
    const again = await authenticateUser(email, PASSWORD);
    expect(again.user?.email).toBe(email);
  });

  it("spends an MFA login challenge once across the fleet", async () => {
    const shared = new MemoryKeyValueAdapter();
    const user = {
      userId: "usr-fleet-mfa",
      personId: "per-fleet-mfa",
      email: "fleet-mfa@vmnl.ng",
      roles: ["Operator"],
    };

    startInstance(shared);
    const challenge = signMfaLoginChallenge(user);
    expect(await consumeMfaLoginChallenge(challenge)).toMatchObject({ userId: user.userId });

    startInstance(shared); // this process never saw the first consumption
    expect(await consumeMfaLoginChallenge(challenge)).toBeNull();
  });

  it("refuses an MFA consumption it cannot record, instead of allowing a replay", async () => {
    const unusable: KeyValueAdapter = {
      backend: "redis",
      get: async () => {
        throw new Error("backend unreachable");
      },
      set: async () => {
        throw new Error("backend unreachable");
      },
      del: async () => undefined,
      setIfAbsent: async () => {
        throw new Error("backend unreachable");
      },
      incrBy: async () => {
        throw new Error("backend unreachable");
      },
      keys: async () => [],
      isHealthy: async () => false,
    };
    startInstance(unusable);
    const challenge = signMfaLoginChallenge({
      userId: "usr-fleet-mfa-2",
      personId: "per-fleet-mfa-2",
      email: "fleet-mfa2@vmnl.ng",
      roles: ["Operator"],
    });
    // An unreadable claim store cannot prove the challenge is unused.
    expect(await consumeMfaLoginChallenge(challenge)).toBeNull();
  });

  it("reads enrollment from the adapter, so a second instance sees it and cannot re-register it", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = `enroll-fleet-${Date.now()}@vmnl.ng`;

    startInstance(shared);
    await registerUser({ email, password: PASSWORD });
    await updateUserMfaEnrollment(email, TOTP_SEED);

    startInstance(shared);
    const hydrated = await findUserByEmail(email);
    expect(hydrated?.mfaEnabled).toBe(true);
    expect(hydrated?.mfaSecret).toBe(TOTP_SEED);
    // Existence is the adapter's answer too: the Map is empty here.
    await expect(registerUser({ email, password: PASSWORD })).rejects.toThrow(/already exists/);
  });

  it("claims a new account exactly once when two instances race to register it", async () => {
    const shared = new MemoryKeyValueAdapter();
    startInstance(shared);
    const email = `race-${Date.now()}@vmnl.ng`;

    const settled = await Promise.allSettled([
      registerUser({ email, password: PASSWORD }),
      registerUser({ email, password: PASSWORD }),
    ]);
    const accepted = settled.filter((s) => s.status === "fulfilled");
    expect(accepted).toHaveLength(1);
    expect(await shared.get(`user:${email}`)).toBeTruthy();
  });

  it("rejects a token revoked by another instance through the logout path", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = "fleet-logout@vmnl.ng";
    startInstance(shared);
    const token = signSessionToken({
      userId: "usr-fleet-logout",
      personId: "per-fleet-logout",
      email,
      roles: ["Operator"],
    }).accessToken;
    registerSession({ token, userId: "usr-fleet-logout", email });
    expect(await primeSessionRevocation(token)).toBe(false);
    expect(verifySessionToken(token).email).toBe(email);

    revokeToken(token); // /sign-out on this instance

    startInstance(shared);
    expect(await primeSessionRevocation(token)).toBe(true);
    expect(() => verifySessionToken(token)).toThrow(/revoked/);
  });

  it("rejects a token revoked by another instance through the session registry", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = "fleet-registry@vmnl.ng";
    const userId = "usr-fleet-registry";
    startInstance(shared);
    const token = signSessionToken({ userId, personId: "per-fleet-registry", email, roles: ["Operator"] }).accessToken;
    registerSession({ token, userId, email });

    // /account/sessions/revoke-one on this instance: revokeSessionById marks the id.
    expect(revokeSessionById(userId, computeSessionId(token))).toBe(computeSessionId(token));
    expect(await shared.get(`revoked:${computeSessionId(token)}`)).toBe("1");

    startInstance(shared);
    expect(await primeSessionRevocation(token)).toBe(true);
    expect(() => verifySessionToken(token)).toThrow(/revoked/);
  });

  it("consults the shared revocation store before authorizing a request", async () => {
    const shared = new MemoryKeyValueAdapter();
    const email = "fleet-entry@vmnl.ng";
    startInstance(shared);
    const token = signSessionToken({
      userId: "usr-fleet-entry",
      personId: "per-fleet-entry",
      email,
      roles: ["Operator"],
    }).accessToken;

    startInstance(shared);
    // Written straight to the shared store: this process has never seen it.
    await shared.set(`revoked:${computeSessionId(token)}`, "1", 60_000);
    expect(await primeSessionRevocation(token)).toBe(true);
    // The sync verification every handler uses now agrees.
    expect(() => verifySessionToken(token)).toThrow(/revoked/);
    expect(await primeSessionRevocation(undefined)).toBe(false);
  });

  it("refuses to boot on the in-memory backend in production-like environments", () => {
    const memory = new MemoryKeyValueAdapter();
    const redis = new RedisKeyValueAdapter({ call: async () => "PONG" } as MinimalRedisClient);
    expect(() => assertSharedKvBackendForEnvironment(memory, "production", undefined)).toThrow(/VMNL-SEC/);
    expect(() => assertSharedKvBackendForEnvironment(memory, "staging", undefined)).toThrow(/REDIS_URL/);
    // A deliberate single-instance deployment may opt out, loudly.
    expect(() => assertSharedKvBackendForEnvironment(memory, "production", "true")).not.toThrow();
    expect(() => assertSharedKvBackendForEnvironment(redis, "production", undefined)).not.toThrow();
    expect(() => assertSharedKvBackendForEnvironment(memory, "development", undefined)).not.toThrow();
  });

  it("wires that boot guard into the server bootstrap", () => {
    const source = readFileSync(new URL("../../src/api/server.ts", import.meta.url), "utf8");
    expect(source).toContain("assertSharedKvBackendForEnvironment(kvAdapter)");
    const routerSource = readFileSync(new URL("../../src/api/router.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("await primeSessionRevocation(sessionTokenFrom(req))");
    expect(routerSource).toContain("await consumeMfaLoginChallenge(challengeToken)");
  });
});

const dbConnection = await checkDatabaseConnection(true);
const WITH_DB = dbConnection.connected;
if (!WITH_DB) {
  console.warn(
    `[TSK-27] no reachable Postgres (${dbConnection.error}): the readiness half of the KV gating is NOT verified in this run.`
  );
}

describe.skipIf(!WITH_DB)("TSK-27: an unreachable shared backend takes the pod out of rotation", () => {
  const previousRedisUrl = process.env.REDIS_URL;
  const previousGating = process.env.KV_READINESS_GATING;
  let server: ApiServerInstance | null = null;

  afterAll(async () => {
    if (server) await server.stop();
    if (previousRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previousRedisUrl;
    if (previousGating === undefined) delete process.env.KV_READINESS_GATING;
    else process.env.KV_READINESS_GATING = previousGating;
    _resetCacheAdapterForTesting();
    startInstance(new MemoryKeyValueAdapter());
  });

  it("reports 503 while the shared backend is unhealthy, and 200 when an operator opts out", async () => {
    // Resolve the singleton *before* boot with a client whose commands all fail,
    // so /readyz probes an unreachable backend rather than a real socket.
    _resetCacheAdapterForTesting();
    process.env.REDIS_URL = "redis://127.0.0.1:6399";
    configureRedisAdapterFactory(() => ({
      call: async () => {
        throw new Error("backend unreachable");
      },
    }));
    const adapter = resolveKeyValueAdapter();
    expect(adapter.backend).toBe("redis");
    expect(await adapter.isHealthy()).toBe(false);

    server = createApiServer(0, { NODE_ENV: "test" });
    await server.start();
    const port = (server.server.address() as { port: number }).port;

    const gated = await request(port, "/readyz");
    const gatedPayload = JSON.parse(gated.body);
    expect(gated.status).toBe(503);
    expect(gatedPayload.checks.kvBackend).toBe("redis");
    expect(gatedPayload.checks.kvHealthy).toBe(false);
    expect(gatedPayload.checks.kvGating).toBe("enforced");
    expect(gatedPayload.status).toBe("unavailable");

    process.env.KV_READINESS_GATING = "false";
    const optedOut = await request(port, "/readyz");
    const optedOutPayload = JSON.parse(optedOut.body);
    expect(optedOut.status).toBe(200);
    expect(optedOutPayload.checks.kvGating).toBe("disabled");
    expect(optedOutPayload.checks.kvHealthy).toBe(false);
  });
});
