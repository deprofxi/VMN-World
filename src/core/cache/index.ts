/**
 * Distributed Cache Adapter — TODO-SEC-10
 *
 * Provides a Redis-backed key-value adapter behind a narrow interface, with a
 * process-local in-memory fallback for sandbox/test environments. The queue
 * worker, session registry and rate-limit/lockout stores can run against
 * either backend WITHOUT interface changes, so a multi-instance deployment
 * points them all at the same Redis (REDIS_URL) while the sandbox keeps
 * working with zero infrastructure.
 *
 * Backing store selection: REDIS_URL set → Redis adapter; otherwise memory.
 * The active backend and any connection failures are reported through
 * telemetry so operators can see when they are NOT running distributed.
 */

export interface KeyValueAdapter {
  readonly backend: "redis" | "memory";
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Returns true when the key did not exist and was set (SET NX semantics). */
  setIfAbsent(key: string, value: string, ttlMs?: number): Promise<boolean>;
  incrBy(key: string, delta: number, ttlMs?: number): Promise<number>;
  keys(prefix: string): Promise<string[]>;
  isHealthy(): Promise<boolean>;
}

interface MemoryEntry {
  value: string;
  expiresAt?: number;
}

export class MemoryKeyValueAdapter implements KeyValueAdapter {
  public readonly backend = "memory" as const;
  private store = new Map<string, MemoryEntry>();

  private isExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt !== undefined && entry.expiresAt < Date.now();
  }

  public async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  public async set(key: string, value: string, ttlMs?: number): Promise<void> {
    this.store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : undefined });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async setIfAbsent(key: string, value: string, ttlMs?: number): Promise<boolean> {
    const existing = await this.get(key);
    if (existing !== null) return false;
    await this.set(key, value, ttlMs);
    return true;
  }

  public async incrBy(key: string, delta: number, ttlMs?: number): Promise<number> {
    const current = await this.get(key);
    const next = (current ? parseInt(current, 10) : 0) + delta;
    await this.set(key, String(next), ttlMs);
    return next;
  }

  public async keys(prefix: string): Promise<string[]> {
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }

  public async isHealthy(): Promise<boolean> {
    return true;
  }

  public _clear(): void {
    this.store.clear();
  }
}

/**
 * Redis adapter over a minimal RESP client contract. To keep the repo
 * dependency-free, the raw socket client is injected: in production the
 * operator supplies a `createRedisClient` implementation (node-redis or
 * ioredis) via configureRedisAdapterFactory; in tests the contract is
 * satisfied with a fake. Commands used: GET/SET/DEL/SET-NX/INCRBY/KEYS/PING.
 */
export interface MinimalRedisClient {
  call(command: string, ...args: (string | number)[]): Promise<unknown>;
}

export class RedisKeyValueAdapter implements KeyValueAdapter {
  public readonly backend = "redis" as const;
  constructor(
    private readonly client: MinimalRedisClient,
    private readonly keyPrefix: string = "vmnl:"
  ) {}

  private k(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  public async get(key: string): Promise<string | null> {
    const result = await this.client.call("GET", this.k(key));
    return typeof result === "string" ? result : null;
  }

  public async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      await this.client.call("SET", this.k(key), value, "PX", Math.round(ttlMs));
    } else {
      await this.client.call("SET", this.k(key), value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.call("DEL", this.k(key));
  }

  public async setIfAbsent(key: string, value: string, ttlMs?: number): Promise<boolean> {
    const result =
      ttlMs !== undefined
        ? await this.client.call("SET", this.k(key), value, "PX", Math.round(ttlMs), "NX")
        : await this.client.call("SET", this.k(key), value, "NX");
    return result === "OK";
  }

  public async incrBy(key: string, delta: number, ttlMs?: number): Promise<number> {
    const next = (await this.client.call("INCRBY", this.k(key), delta)) as number;
    if (ttlMs !== undefined) {
      await this.client.call("PEXPIRE", this.k(key), Math.round(ttlMs));
    }
    return next;
  }

  public async keys(prefix: string): Promise<string[]> {
    const result = (await this.client.call("KEYS", `${this.k(prefix)}*`)) as string[];
    return Array.isArray(result) ? result.map((k) => k.slice(this.keyPrefix.length)) : [];
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return (await this.client.call("PING")) === "PONG";
    } catch {
      return false;
    }
  }
}

export interface CacheAdapterConfig {
  telemetry?: { logStructured(level: string, message: string, span?: unknown, attrs?: Record<string, unknown>): void };
}

let adapter: KeyValueAdapter | null = null;
let redisAdapterFactory: ((url: string) => MinimalRedisClient) | null = null;

/**
 * Registers the production Redis client factory (node-redis / ioredis
 * wrapper). Call once at boot; resolveKeyValueAdapter then prefers Redis when
 * REDIS_URL is set.
 */
export function configureRedisAdapterFactory(factory: (url: string) => MinimalRedisClient): void {
  redisAdapterFactory = factory;
}

/**
 * Resolves the process-wide KV adapter once: Redis when REDIS_URL is set (and
 * a client factory has been provided), otherwise the in-memory fallback.
 */
export function resolveKeyValueAdapter(config: CacheAdapterConfig = {}, redisFactory?: (url: string) => MinimalRedisClient): KeyValueAdapter {
  if (adapter) return adapter;
  const factory = redisFactory ?? redisAdapterFactory ?? undefined;
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && factory) {
    try {
      adapter = new RedisKeyValueAdapter(factory(redisUrl));
      config.telemetry?.logStructured("INFO", "Distributed cache adapter: Redis (REDIS_URL set)", undefined, { backend: "redis" });
    } catch (err) {
      adapter = new MemoryKeyValueAdapter();
      config.telemetry?.logStructured("WARN", "Redis adapter construction failed; falling back to in-memory cache", undefined, {
        backend: "memory",
        reason: String(err),
      });
    }
  } else {
    adapter = new MemoryKeyValueAdapter();
    const reason = redisUrl
      ? "REDIS_URL set but no Redis client factory registered (configureRedisAdapterFactory)"
      : "REDIS_URL not set";
    config.telemetry?.logStructured("INFO", `Distributed cache adapter: in-memory fallback (${reason})`, undefined, {
      backend: "memory",
      telemetryFlag: "CACHE_BACKEND=memory",
      reason,
    });
  }
  return adapter;
}

/**
 * AUD-03/AUD-04 / TSK-27: a multi-instance production deployment must not
 * silently run on the process-local backend — sessions, account lockouts, MFA
 * challenge claims and rate limits would multiply per instance and vanish on
 * restart. Called at boot; the error carries the operator's remedy.
 */
export function assertSharedKvBackendForEnvironment(
  adapter: KeyValueAdapter,
  appEnv: string | undefined = process.env.NODE_ENV,
  allowMemoryOverride: string | undefined = process.env.ALLOW_MEMORY_KV_IN_PRODUCTION
): void {
  if (
    (appEnv === "production" || appEnv === "staging") &&
    adapter.backend === "memory" &&
    allowMemoryOverride !== "true"
  ) {
    throw new Error(
      "[VMNL-SEC] KV adapter resolved to the in-memory backend in production/staging: set REDIS_URL so sessions, lockouts and rate limits are shared (or explicitly set ALLOW_MEMORY_KV_IN_PRODUCTION=true for a deliberate single-instance deployment) (AUD-03/AUD-04)"
    );
  }
}

/** Test seam: resets the singleton and any memory store. */
export function _resetCacheAdapterForTesting(): void {
  adapter = null;
  redisAdapterFactory = null;
}
