/**
 * Production-readiness control regressions — PR-07, PR-08, PR-13, PR-14.
 *
 * Authority: `VMNL-AZP-VMN-CCPP-001` §16 (controls must be proven, not asserted);
 * findings and evidence: `docs/audit/production-readiness-deepcheck-2026-10-16.md`.
 *
 * Every case here is written to FAIL against the pre-fix implementation, because
 * a control whose repair cannot be falsified is not a repair:
 *
 * - PR-07 — the KV client wrote `AUTH <password>` in cleartext for a `rediss://`
 *   URL. The first case captures the bytes the process actually puts on the wire.
 * - PR-08 — `checkStorageReady()` parsed `STORAGE_ENDPOINT` and returned `ready`
 *   without opening a connection, so an endpoint on a dead port read as healthy.
 * - PR-13 — `z.coerce.boolean()` mapped `"false"` to `true`, inverting a switch.
 * - PR-14 — `PROMETHEUS_METRICS_ENABLED` and `STARTIMES_CARRIAGE_VERIFIED` were
 *   declared, documented and set, but nothing read them.
 * - PR-16 — the process listened for `SIGTERM`/`SIGINT` and for nothing else,
 *   and the stop they triggered had no deadline: `Server.close()` waits on open
 *   connections, so one keep-alive client could hold the process past the
 *   orchestrator's grace period and get it SIGKILLed.
 * - PR-09 — every `canPerform` call site passed three arguments, so the tenant
 *   predicate in the policy engine was unreachable, and `assertPermission` (the
 *   throwing variant) had no caller in `src`.
 */

import { describe, it, expect, afterEach } from "vitest";
import net from "node:net";
import { AddressInfo } from "node:net";
import { EventEmitter } from "node:events";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  installLifecycleGuards,
  stopWithinDeadline,
  type LifecycleLogLevel,
} from "../../src/core/runtime/lifecycle.js";
import { evaluateAccess, TENANT_SCOPE_HEADER } from "../../src/core/rbac/index.js";
import { signSessionToken, type SessionUser } from "../../src/core/auth/index.js";
import { createMinimalRespRedisClient } from "../../src/api/server.js";
import { createApiServer } from "../../src/api/server.js";
import { loadConfig, _resetConfigForTesting } from "../../src/core/config/index.js";
import { checkStorageReady, _resetStorageReadinessCacheForTesting } from "../../src/core/storage/index.js";
import { startStorageStub } from "../helpers/storage-stub.js";

const BASE_ENV = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/vmnl_control_test",
  JWT_SECRET: "control-suite-jwt-secret-material-123456",
  AZEEBO_WEBHOOK_SECRET: "control-suite-azeebo-secret",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A port nothing is listening on — the shape of the original PR-08 defect. */
async function closedPort(): Promise<number> {
  const probe = net.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  return port;
}

/** Every `.ts` file under a directory (build output and dependencies excluded). */
function walkSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) walkSources(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

/** The argument text of every `marker` call in `text`, paren-balanced. */
function callArguments(text: string, marker: string): string[] {
  const found: string[] = [];
  let from = 0;
  for (;;) {
    const at = text.indexOf(marker, from);
    if (at === -1) return found;
    const start = at + marker.length;
    let depth = 0;
    let i = start;
    for (; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        if (depth === 0) break;
        depth -= 1;
      }
    }
    found.push(text.slice(start, i));
    from = i + 1;
  }
}

/** Argument count of an already-extracted argument list. */
function topLevelArity(args: string): number {
  const trimmed = args.trim();
  if (trimmed === "") return 0;
  let depth = 0;
  let commas = 0;
  for (const ch of trimmed) {
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    else if (ch === "," && depth === 0) commas += 1;
  }
  return commas + 1;
}

/**
 * A plaintext TCP listener that records every byte it receives.
 *
 * The client under test deliberately leaks a half-open connection in both
 * directions (a TLS handshake that is never answered, and a RESP command whose
 * reply never comes), so `close()` destroys the accepted sockets first —
 * `server.close()` alone waits for live connections and would hang the suite.
 */
async function plaintextListener(): Promise<{ port: number; received: Buffer[]; close: () => Promise<void> }> {
  const received: Buffer[] = [];
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("data", (chunk) => received.push(chunk));
    socket.on("error", () => undefined);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    port,
    received,
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of sockets) socket.destroy();
        sockets.clear();
        server.close(() => resolve());
      }),
  };
}

// ---------------------------------------------------------------------------

describe("PR-07: the Redis transport follows the URL scheme", () => {
  it("never puts a plaintext AUTH on the wire for a rediss:// URL", async () => {
    const listener = await plaintextListener();
    try {
      // Pre-fix this used node:net unconditionally, so the password below left
      // the process in cleartext. It must now open a TLS ClientHello instead.
      const client = createMinimalRespRedisClient(`rediss://:super-secret-pw@127.0.0.1:${listener.port}`);
      void client.call("PING").catch(() => undefined);
      await delay(400);

      const wire = Buffer.concat(listener.received);
      expect(wire.toString("utf8")).not.toContain("AUTH");
      expect(wire.toString("utf8")).not.toContain("super-secret-pw");
      // A TLS handshake record starts with content-type 0x16 — positive proof
      // the transport is TLS rather than "no bytes were sent at all".
      expect(wire.length).toBeGreaterThan(0);
      expect(wire[0]).toBe(0x16);
    } finally {
      await listener.close();
    }
  });

  it("still speaks plaintext RESP for an explicitly plaintext redis:// URL", async () => {
    const listener = await plaintextListener();
    try {
      const client = createMinimalRespRedisClient(`redis://:super-secret-pw@127.0.0.1:${listener.port}`);
      void client.call("PING").catch(() => undefined);
      await delay(400);

      // The discriminator is the scheme, not an accident: redis:// is documented
      // plaintext and still authenticates in the clear on the operator's say-so.
      const wire = Buffer.concat(listener.received).toString("utf8");
      expect(wire).toContain("AUTH");
      expect(wire).toContain("super-secret-pw");
      expect(wire).toContain("PING");
    } finally {
      await listener.close();
    }
  });

  it("refuses an unrecognised scheme instead of presuming plaintext", () => {
    expect(() => createMinimalRespRedisClient("http://127.0.0.1:6379")).toThrow(
      /Unsupported REDIS_URL scheme/
    );
    expect(() => createMinimalRespRedisClient("redis+tls://127.0.0.1:6379")).toThrow(
      /Unsupported REDIS_URL scheme/
    );
  });
});

describe("PR-08: storage readiness is probed, not parsed", () => {
  const previousDriver = process.env.STORAGE_DRIVER;
  const previousEndpoint = process.env.STORAGE_ENDPOINT;
  const previousGating = process.env.STORAGE_READINESS_GATING;

  afterEach(() => {
    if (previousDriver === undefined) delete process.env.STORAGE_DRIVER;
    else process.env.STORAGE_DRIVER = previousDriver;
    if (previousEndpoint === undefined) delete process.env.STORAGE_ENDPOINT;
    else process.env.STORAGE_ENDPOINT = previousEndpoint;
    if (previousGating === undefined) delete process.env.STORAGE_READINESS_GATING;
    else process.env.STORAGE_READINESS_GATING = previousGating;
    _resetConfigForTesting();
    _resetStorageReadinessCacheForTesting();
  });

  it("reports unavailable for an endpoint on a dead port — the original defect", async () => {
    const port = await closedPort();
    process.env.STORAGE_DRIVER = "minio";
    process.env.STORAGE_ENDPOINT = `http://127.0.0.1:${port}`;
    _resetConfigForTesting();
    _resetStorageReadinessCacheForTesting();

    const readiness = await checkStorageReady();
    // Pre-fix this returned { ready: true, status: "ready" }: the endpoint
    // parsed as a URL and nothing else was checked.
    expect(readiness.ready).toBe(false);
    expect(readiness.status).toBe("unavailable");
    expect(readiness.error).toMatch(/STORAGE_UNREACHABLE|STORAGE_PROBE_TIMEOUT/);
  });

  it("reports ready only when the store answers the signed bucket request", async () => {
    const stub = await startStorageStub({ status: 200 });
    try {
      process.env.STORAGE_DRIVER = "minio";
      process.env.STORAGE_ENDPOINT = stub.endpoint;
      _resetConfigForTesting();
      _resetStorageReadinessCacheForTesting();

      const readiness = await checkStorageReady();
      expect(readiness.ready).toBe(true);
      expect(readiness.status).toBe("ready");

      // The readiness verdict is backed by an observed request, not by a string.
      expect(stub.requests.length).toBeGreaterThan(0);
      expect(stub.requests[0].method).toBe("HEAD");
      expect(stub.requests[0].url).toBe("/vmnl-assets");
      expect(stub.requests[0].authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
    } finally {
      await stub.close();
    }
  });

  it("does not read rejected credentials as readiness", async () => {
    const stub = await startStorageStub({ status: 403 });
    try {
      process.env.STORAGE_DRIVER = "minio";
      process.env.STORAGE_ENDPOINT = stub.endpoint;
      _resetConfigForTesting();
      _resetStorageReadinessCacheForTesting();

      const readiness = await checkStorageReady();
      expect(readiness.ready).toBe(false);
      expect(readiness.status).toBe("unavailable");
      expect(readiness.error).toMatch(/STORAGE_CREDENTIALS_REJECTED/);
    } finally {
      await stub.close();
    }
  });

  it("takes the pod out of rotation on the live readiness endpoint when storage is dead", async () => {
    const port = await closedPort();
    process.env.STORAGE_DRIVER = "minio";
    process.env.STORAGE_ENDPOINT = `http://127.0.0.1:${port}`;
    delete process.env.STORAGE_READINESS_GATING;
    _resetConfigForTesting();
    _resetStorageReadinessCacheForTesting();

    const app = createApiServer(0);
    await app.start();
    try {
      const { port: appPort } = app.server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${appPort}/readyz`);
      const payload = (await response.json()) as {
        checks: { database: string; storage: string; storageGating: string };
      };
      // Storage gating is enforced by default, so an unreachable object store
      // must answer 503 — which the pre-fix probe made impossible.
      expect(payload.checks.storageGating).toBe("enforced");
      expect(payload.checks.storage).toBe("unavailable");
      // Pinning the database half keeps this a statement about storage: without
      // it a dead database could produce the 503 on its own.
      expect(payload.checks.database).toBe("connected");
      expect(response.status).toBe(503);
    } finally {
      await app.stop();
    }
  });
});

describe("PR-13: a boolean env value cannot read as its opposite", () => {
  it('reads "false" as false for both boolean fields', () => {
    const config = loadConfig({
      ...BASE_ENV,
      PROMETHEUS_METRICS_ENABLED: "false",
      STARTIMES_CARRIAGE_VERIFIED: "false",
    });
    // Pre-fix both of these were `true`: Boolean("false") is true.
    expect(config.PROMETHEUS_METRICS_ENABLED).toBe(false);
    expect(config.STARTIMES_CARRIAGE_VERIFIED).toBe(false);
  });

  it("rejects a value that is neither true nor false rather than guessing", () => {
    expect(() => loadConfig({ ...BASE_ENV, PROMETHEUS_METRICS_ENABLED: "no" })).toThrow(
      /PROMETHEUS_METRICS_ENABLED/
    );
    expect(() => loadConfig({ ...BASE_ENV, PROMETHEUS_METRICS_ENABLED: "1" })).toThrow(
      /PROMETHEUS_METRICS_ENABLED/
    );
    expect(() => loadConfig({ ...BASE_ENV, STARTIMES_CARRIAGE_VERIFIED: "yes" })).toThrow(
      /STARTIMES_CARRIAGE_VERIFIED/
    );
  });

  it("keeps the documented defaults when the variable is absent or blank", () => {
    const declared = loadConfig(BASE_ENV);
    expect(declared.PROMETHEUS_METRICS_ENABLED).toBe(true);
    expect(declared.STARTIMES_CARRIAGE_VERIFIED).toBe(false);

    const blank = loadConfig({ ...BASE_ENV, PROMETHEUS_METRICS_ENABLED: "   " });
    expect(blank.PROMETHEUS_METRICS_ENABLED).toBe(true);
  });
});

describe("PR-14: the carriage flag governs carriage facts", () => {
  // Deliberately synthetic numbers: the real carriage assignments are
  // deployment facts (CLAUDE.md <broadcast>), never test fixtures that could be
  // mistaken for an authoritative record.
  const COMPLETE_FACTS = {
    NXTR_DTT_CHANNEL: "9001",
    NXTR_DTH_CHANNEL: "9002",
    NXTR_SERVICE_PID: "9003",
    ORIS_DTT_CHANNEL: "9004",
    ORIS_DTH_CHANNEL: "9005",
    ORIS_SERVICE_PID: "9006",
    IMBD_DTT_CHANNEL: "9007",
    IMBD_DTH_CHANNEL: "9008",
    IMBD_SERVICE_PID: "9009",
  };

  it("refuses carriage facts while STARTIMES_CARRIAGE_VERIFIED is false", () => {
    expect(() => loadConfig({ ...BASE_ENV, NXTR_DTT_CHANNEL: "9001" })).toThrow(
      /Carriage facts may not be configured/
    );
  });

  it("refuses a verification claim without the complete fact set", () => {
    expect(() =>
      loadConfig({ ...BASE_ENV, STARTIMES_CARRIAGE_VERIFIED: "true", NXTR_DTT_CHANNEL: "9001" })
    ).toThrow(/complete carriage fact set/);
  });

  it("accepts a verified, complete fact set", () => {
    const config = loadConfig({
      ...BASE_ENV,
      STARTIMES_CARRIAGE_VERIFIED: "true",
      ...COMPLETE_FACTS,
    });
    expect(config.STARTIMES_CARRIAGE_VERIFIED).toBe(true);
    expect(config.NXTR_DTT_CHANNEL).toBe(9001);
    expect(config.IMBD_SERVICE_PID).toBe(9009);
  });
});

describe("PR-16: the process fails and stops within a deadline", () => {
  const ROOT = fileURLToPath(new URL("../..", import.meta.url));

  interface Entry {
    level: LifecycleLogLevel;
    message: string;
  }

  function harness(stop: () => Promise<void>, deadlineMs?: number) {
    const target = new EventEmitter();
    const entries: Entry[] = [];
    const exits: number[] = [];
    const guard = installLifecycleGuards({
      target,
      stop,
      exit: (code) => exits.push(code),
      deadlineMs,
      log: (level, message) => entries.push({ level, message }),
    });
    return {
      target,
      guard,
      exits,
      entries,
      text: () => entries.map((entry) => entry.message).join("\n"),
      settled: async () => {
        const started = Date.now();
        while (exits.length === 0) {
          if (Date.now() - started > 5000) throw new Error(`lifecycle never exited; log:\n${entries.map((e) => e.message).join("\n")}`);
          await delay(5);
        }
      },
    };
  }

  it("reports an unhandled rejection and still terminates non-zero", async () => {
    let stops = 0;
    const h = harness(async () => {
      stops += 1;
    });

    // Pre-fix nothing listened for this event at all: Node's default behaviour
    // ended the process with the error printed only if it happened to be
    // unhandled at the top level, and `app.stop()` never ran.
    h.target.emit("unhandledRejection", new Error("payment reconciliation promise rejected"));
    await h.settled();

    expect(stops).toBe(1);
    expect(h.exits).toEqual([1]);
    expect(h.text()).toMatch(/unhandledRejection/);
    expect(h.text()).toMatch(/payment reconciliation promise rejected/);
  });

  it("reports an uncaught exception and still terminates non-zero", async () => {
    const h = harness(async () => undefined);
    h.target.emit("uncaughtException", new TypeError("cannot read properties of undefined"));
    await h.settled();

    expect(h.exits).toEqual([1]);
    expect(h.text()).toMatch(/uncaughtException/);
    expect(h.text()).toMatch(/TypeError/);
  });

  it("stops a signal-triggered shutdown with the signal's own exit code", async () => {
    const h = harness(async () => undefined);
    h.target.emit("SIGTERM");
    await h.settled();

    expect(h.exits).toEqual([0]);
    expect(h.text()).toMatch(/SIGTERM/);
    expect(h.guard.finished()).toBe(true);
  });

  it("gives up on a stop that never settles instead of waiting to be SIGKILLed", async () => {
    // A stop that hangs is exactly the reported failure: `Server.close()` with a
    // keep-alive client attached never calls back.
    let stops = 0;
    const h = harness(async () => {
      stops += 1;
      await new Promise<void>(() => undefined);
    }, 60);

    const started = Date.now();
    h.target.emit("SIGINT");
    await h.settled();
    const elapsed = Date.now() - started;

    expect(stops).toBe(1);
    // A signal asked for a graceful stop, but it did not complete, so reporting
    // 0 would record a clean shutdown that never happened.
    expect(h.exits).toEqual([1]);
    expect(h.text()).toMatch(/exceeded the 60ms deadline/);
    expect(elapsed).toBeLessThan(2000);
  });

  it("reports a stop that fails rather than exiting as if it had succeeded", async () => {
    const h = harness(async () => {
      throw new Error("journal flush refused: database unreachable");
    });
    h.target.emit("SIGTERM");
    await h.settled();

    expect(h.exits).toEqual([1]);
    expect(h.text()).toMatch(/Shutdown failed/);
    expect(h.text()).toMatch(/journal flush refused/);
  });

  it("never runs two shutdowns, and a repeated signal does not restart the deadline", async () => {
    let stops = 0;
    const h = harness(async () => {
      stops += 1;
      await delay(40);
    });

    h.target.emit("SIGTERM");
    h.target.emit("SIGTERM"); // operator impatience / restart storm
    h.target.emit("uncaughtException", new Error("late failure"));
    await h.settled();

    expect(stops).toBe(1);
    expect(h.exits).toHaveLength(1);
    expect(h.text()).toMatch(/Ignoring SIGTERM/);
    expect(h.text()).toMatch(/while shutting down/);
  });

  it("leaves the deadline timer unable to hold the event loop open", async () => {
    // The stop wins this race; the unref'd deadline timer must not keep the
    // process alive for the remaining ~10s.
    const started = Date.now();
    const outcome = await stopWithinDeadline(async () => undefined, 10_000);
    expect(outcome.outcome).toBe("stopped");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("is wired into the entrypoint — a control nothing installs is dead (PR-14's lesson)", () => {
    const entry = readFileSync(path.join(ROOT, "src/index.ts"), "utf8");
    expect(entry).toMatch(/installLifecycleGuards\(/);
    expect(entry).toMatch(/target: process/);
    expect(entry).toMatch(/VMNL_SHUTDOWN_DEADLINE_MS/);
  });
});

describe("PR-09: the tenant predicate runs on every guarded request", () => {
  const ROOT = fileURLToPath(new URL("../..", import.meta.url));
  const TENANT_A = "pr09-tenant-a";
  const TENANT_B = "pr09-tenant-b";
  /** update:schedule is granted to BroadcastDirector, so the guard is the only
   *  thing that can refuse the requests below. */
  const GUARDED_ROUTE = "/api/v1/broadcast/scheduling/validate";

  function session(tenantId: string | undefined, roles: string[]): string {
    return signSessionToken({
      userId: `usr-${tenantId ?? "unscoped"}`,
      personId: `per-${tenantId ?? "unscoped"}`,
      email: `actor@${tenantId ?? "unscoped"}.vmnl.ng`,
      roles,
      ...(tenantId ? { tenantId } : {}),
    }).accessToken;
  }

  it("refuses a request that claims another tenant, on a live server", async () => {
    const app = createApiServer(0);
    await app.start();
    try {
      const { port } = app.server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}${GUARDED_ROUTE}`;
      const bearer = (token: string) => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      // Same session, same route, same body — the only variable is the tenant
      // claim. A Bearer credential (rather than the cookie) keeps CSRF out of
      // the comparison, so the difference is the authorization decision.
      const ownTenant = await fetch(url, {
        method: "POST",
        headers: bearer(session(TENANT_A, ["BroadcastDirector"])),
        body: JSON.stringify({ channelCode: "NXTR" }),
      });
      expect(ownTenant.status).not.toBe(403);

      const foreignTenant = await fetch(url, {
        method: "POST",
        headers: { ...bearer(session(TENANT_A, ["BroadcastDirector"])), [TENANT_SCOPE_HEADER]: TENANT_B },
        body: JSON.stringify({ channelCode: "NXTR" }),
      });
      // Pre-fix this was indistinguishable from the request above: the guard
      // called canPerform with three arguments, so the claim was never read.
      expect(foreignTenant.status).toBe(403);
      const refusal = (await foreignTenant.json()) as { code: string };
      expect(refusal.code).toBe("TENANT_SCOPE_DENIED");
    } finally {
      await app.stop();
    }
  });

  it("refuses a tenant-less session that claims a tenant — the branch that failed open", () => {
    const unscoped: SessionUser = {
      userId: "usr-unscoped",
      personId: "per-unscoped",
      email: "unscoped@vmnl.ng",
      roles: ["BroadcastDirector"],
    };

    // Pre-fix the predicate read `context?.tenantId && user.tenantId && ...`, so
    // a session with no tenant skipped the boundary entirely: the one shape that
    // most needs it was the one shape it never applied to.
    const decision = evaluateAccess(unscoped, "update", "schedule", { tenantId: TENANT_B });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("TENANT_SCOPE");
  });

  it("keeps the documented exemptions: the caller's own tenant and SuperAdmin", () => {
    const own: SessionUser = {
      userId: "usr-a",
      personId: "per-a",
      email: "a@vmnl.ng",
      roles: ["BroadcastDirector"],
      tenantId: TENANT_A,
    };
    expect(evaluateAccess(own, "update", "schedule", { tenantId: TENANT_A }).allowed).toBe(true);
    expect(evaluateAccess(own, "read", "schedule", {}).allowed).toBe(true);

    const superAdmin: SessionUser = { userId: "usr-sa", personId: "per-sa", email: "sa@vmnl.ng", roles: ["SuperAdmin"] };
    expect(evaluateAccess(superAdmin, "read", "broadcast", { tenantId: TENANT_B }).allowed).toBe(true);
  });

  it("keeps the schedule-lock invariant reachable with its own reason", () => {
    const traffic: SessionUser = {
      userId: "usr-tm",
      personId: "per-tm",
      email: "tm@vmnl.ng",
      roles: ["TrafficManager"],
      tenantId: TENANT_A,
    };
    expect(evaluateAccess(traffic, "update", "schedule", { tenantId: TENANT_A, isScheduleLocked: true })).toEqual({
      allowed: false,
      reason: "SCHEDULE_LOCK",
    });
  });

  it("leaves no call site anywhere in src that omits the context argument", () => {
    // The structural half of the finding: the predicate is only reachable if
    // every call site supplies it, so the scan — not the intention — is what
    // keeps it that way. Written as a source scan because the pre-fix defect was
    // an omission at four sites, not a wrong decision at one.
    const offenders: string[] = [];
    let callSites = 0;
    let assertPermissionCallers = 0;

    for (const file of walkSources(path.join(ROOT, "src"))) {
      const text = readFileSync(file, "utf8");
      if (/assertPermission\(/.test(text) && !file.endsWith(path.join("core", "rbac", "index.ts"))) {
        assertPermissionCallers += 1;
      }
      for (const args of callArguments(text, "canPerform(")) {
        callSites += 1;
        if (topLevelArity(args) < 4) {
          offenders.push(`${path.relative(ROOT, file).split(path.sep).join("/")}: canPerform(${args.trim()})`);
        }
      }
    }

    expect(callSites).toBeGreaterThan(0); // anti-vacuity: a parser regression must fail loudly
    expect(offenders, `call sites that leave the tenant predicate unreachable:\n${offenders.join("\n")}`).toEqual([]);
    expect(assertPermissionCallers, "the throwing variant must keep a real caller").toBeGreaterThan(0);
  });
});

describe("PR-15: no variable is read without being declared and documented", () => {
  const ROOT = fileURLToPath(new URL("../..", import.meta.url));

  /**
   * Every name src/ reads from the environment, however it is spelled.
   *
   * Names shorter than two characters are ignored: a prose mention such as
   * `process.env.X` in a comment is not a read, and no real variable is one
   * character long. (Comments are not stripped — a naive stripper mis-reads
   * strings containing `//`, and a false *positive* is the safer failure here:
   * it asks the author to declare or reword, rather than hiding a real read.)
   */
  function environmentReads(): Set<string> {
    const used = new Set<string>();
    const record = (name: string) => {
      if (name.length > 1) used.add(name);
    };
    for (const file of walkSources(path.join(ROOT, "src"))) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) record(match[1]);
      for (const match of text.matchAll(/process\.env\[\s*"([A-Z0-9_]+)"\s*\]/g)) record(match[1]);
    }
    return used;
  }

  const used = environmentReads();
  const schemaSource = readFileSync(path.join(ROOT, "src", "core", "config", "index.ts"), "utf8");
  const declared = new Set([...schemaSource.matchAll(/^ {2}([A-Z0-9_]+):/gm)].map((m) => m[1]));
  const example = readFileSync(path.join(ROOT, ".env.example"), "utf8");
  const documented = new Set([...example.matchAll(/^#?\s*([A-Z0-9_]+)=/gm)].map((m) => m[1]));

  it("finds the environment surface at all (anti-vacuity)", () => {
    expect(used.size).toBeGreaterThan(20);
    expect(declared.size).toBeGreaterThan(20);
  });

  it("declares every one of them in the config schema", () => {
    // Pre-fix 27 of 37 were undeclared, so a typo reached the read site as
    // `undefined` — which fails open on `=== "true"` and silently changes which
    // half of a gate runs on `!== "false"`.
    const undeclared = [...used].filter((name) => !declared.has(name)).sort();
    expect(undeclared, `read but not declared in the config schema:\n${undeclared.join("\n")}`).toEqual([]);
  });

  it("documents every one of them in .env.example", () => {
    const undocumented = [...used].filter((name) => !documented.has(name)).sort();
    expect(undocumented, `read but not documented in .env.example:\n${undocumented.join("\n")}`).toEqual([]);
  });

  it("refuses a value that would otherwise be read as the opposite", () => {
    // The point of declaring them: these are the reads whose failure mode was
    // silence, so the loader must now be the thing that fails.
    expect(() => loadConfig({ ...BASE_ENV, STORAGE_READINESS_GATING: "flase" })).toThrow(/STORAGE_READINESS_GATING/);
    expect(() => loadConfig({ ...BASE_ENV, AUTH_BYPASS_ENABLED: "1" })).toThrow(/AUTH_BYPASS_ENABLED/);
    expect(() => loadConfig({ ...BASE_ENV, REDIS_URL: "http://cache:6379" })).toThrow(/redis:\/\/ or rediss:\/\//);
    expect(() => loadConfig({ ...BASE_ENV, METRICS_TOKEN: "short" })).toThrow(/METRICS_TOKEN/);
    expect(() => loadConfig({ ...BASE_ENV, TRUSTED_PROXY_HOPS: "first" })).toThrow(/TRUSTED_PROXY_HOPS/);

    // …and a blank assignment still means "not configured".
    const blank = loadConfig({ ...BASE_ENV, REDIS_URL: "", METRICS_TOKEN: "   " });
    expect(blank.REDIS_URL).toBeUndefined();
    expect(blank.METRICS_TOKEN).toBeUndefined();
  });
});

describe("PR-14: PROMETHEUS_METRICS_ENABLED is load-bearing", () => {
  const previousFlag = process.env.PROMETHEUS_METRICS_ENABLED;

  afterEach(() => {
    if (previousFlag === undefined) delete process.env.PROMETHEUS_METRICS_ENABLED;
    else process.env.PROMETHEUS_METRICS_ENABLED = previousFlag;
    _resetConfigForTesting();
  });

  it("serves /metrics when enabled and 404s when disabled, on one running server", async () => {
    process.env.PROMETHEUS_METRICS_ENABLED = "false";
    _resetConfigForTesting();

    const app = createApiServer(0);
    await app.start();
    try {
      const { port } = app.server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}/metrics`;

      // Pre-fix the endpoint was served regardless of the flag.
      const disabled = await fetch(url);
      expect(disabled.status).toBe(404);

      // The route reads the resolved config per request, so flipping the
      // declaration and re-resolving must bring it back — proving the 404 above
      // came from the switch rather than from a route that no longer exists.
      process.env.PROMETHEUS_METRICS_ENABLED = "true";
      _resetConfigForTesting();
      const enabled = await fetch(url);
      expect(enabled.status).toBe(200);
      expect(await enabled.text()).toContain("# TYPE");
    } finally {
      await app.stop();
    }
  });
});
