# Full-Stack Repository Audit Report

**Date:** 2026-10-05  
**Repository Primary Stack:** TypeScript 5.8 (strict, Node 22 ESM), hand-written `node:http` server with server-rendered HTML (no frontend framework), PostgreSQL 18 / Prisma 7 (`@prisma/adapter-pg`), Zod 3, Vitest 4, pnpm 10.17.1, Docker Compose (postgres / redis / minio / prometheus / backup), Prometheus metrics endpoint, GitHub Actions CI (gitleaks, Trivy, Prisma migrate deploy, coverage, quality gates).  
**Overall System Health Rating:** High Risk

> **Verification context:** This audit ran `pnpm run typecheck` (exit 0), `pnpm run lint` with `--max-warnings 0` (exit 0), and the full Vitest suite (2 files failed / 3 tests failed, 550 passed of 553). `pnpm audit --json` reports zero advisories at scan date. A configured PostgreSQL database (`vmnl_enterprise`) was not available in the audit environment, so migration deployment, live query plans, and DB-backed runtime behaviour could not be exercised; Docker was likewise unavailable, so the container build and Compose topology were reviewed statically. All findings below cite exact files/lines verified in this workspace; none are inferred from presence of abstractions alone.

---

## 1. Executive Summary

This repository is a broad enterprise application built on an unusually self-reliant stack: a hand-written HTTP router ([src/api/router.ts](src/api/router.ts), 7,287 lines), server-rendered HTML surfaces, domain modules for broadcast, finance, rights, talent, admissions and federation, and Prisma-backed PostgreSQL repositories with explicit failure modes. The engineering foundations are genuinely good: strict TypeScript passes clean (`tsc --noEmit` exit 0), lint runs at `--max-warnings 0`, a 553-test suite spans unit, integration, security, contract and accessibility layers, and the security skeleton — a declarative `ROUTE_GUARDS` authorization table, double-submit CSRF with Origin/Fetch-Metadata checks, centralized security headers, bounded bodies, and timeouts — is well above average for a custom server. The application is, however, structurally not production-ready: most of its operational state — rate limits, account lockouts, MFA one-time challenges, user credentials, sessions, idempotency keys, the audit ledger, feature-flag overrides and privacy data-subject requests — lives in process-local `Map`s that evaporate on restart and do not share state across instances.

The highest-risk findings are, in order: (1) the test suite is currently red — three failing assertions stem from stale exact-string expectations (a raw `&` that the renderer correctly escapes to `&amp;` in hub cards, and a canonical link expected on the auth-gated `/vtm/terms` route that the public-route registry deliberately marks noindex), which fails CI's `test:coverage` gate; (2) a Redis `KeyValueAdapter` abstraction exists ([src/core/cache/index.ts](src/core/cache/index.ts)) but is **never wired at server boot**, and even the auth store's KV helper reads only from the local Map ([src/core/auth/index.ts:182-184](src/core/auth/index.ts#L182-L184)), making Redis a write-only mirror that no code path would ever consult; (3) the audit ledger is memory-first with fire-and-forget Prisma persistence that degrades silently ([src/core/audit/index.ts:80-140](src/core/audit/index.ts#L80-L140)); (4) `Person.nationalId` and `User.mfaSecret` are plaintext-capable schema columns even though an AES-256-GCM field-encryption helper already exists unused ([prisma/schema.prisma:90,107](prisma/schema.prisma#L90), [src/core/websecurity/index.ts:182](src/core/websecurity/index.ts#L182)); (5) webhook payment replay protection and privacy export requests are process-local only. Structured logging has a subtler defect: `logStructured` serializes and returns a JSON string but never emits it, and every observed call site discards the return value ([src/core/observability/index.ts:160-176](src/core/observability/index.ts#L160-L176), [src/api/server.ts:245,249,264](src/api/server.ts#L245)) — WARN/ERROR entries, including bootstrap failures and audit-persistence degradation, are observable nowhere.

The strongest architectural patterns observed are worth preserving and extending: a default-deny `ROUTE_GUARDS` table (~80 declarations, [src/api/router.ts:609+](src/api/router.ts#L609)) enforced before dispatch; fail-closed repository mode with an explicit, per-deployment `ALLOW_SANDBOX_FALLBACK` decision ([src/core/database/repository-mode.ts:21](src/core/database/repository-mode.ts#L21)); a reviewed `PUBLIC_INDEXABLE_ROUTES` registry driving canonical/noindex/sitemap parity; verified secrets hygiene (`.env` gitignored and never committed, gitleaks in CI, zero advisories, strict prod config validation that rejects placeholder secrets and forbids `AUTH_BYPASS_ENABLED` in production/staging at [src/api/server.ts:53-58](src/api/server.ts#L53-L58)); a hardened multi-stage non-root Dockerfile; and read-path index migrations already shipped. The remediation roadmap below sequences these into P0 (restore green CI, make fail-closed non-optional in production), P1 (durable shared state, encrypted PII, durable audit and webhook dedup), P2 (quality gates, real-browser testing), and P3 (operational resilience and compliance evidence). The container, database and browser-based verification gaps noted above are limitations of this audit's environment, not findings against the code.

---

## 2. Findings Matrix

| ID | Category | Severity | File / Location | Issue Description | Recommended Fix |
|:---|:---|:---|:---|:---|:---|
| AUD-01 | Testing / CI Health | High | [tests/a11y/visual-regression-baseline.test.ts:56](tests/a11y/visual-regression-baseline.test.ts#L56), [tests/integration/enterprise-end-to-end.test.ts:124](tests/integration/enterprise-end-to-end.test.ts#L124) | Suite is red: tests assert the literal string `"African Film & Creative Arts Academy"` but the renderer correctly escapes `&` to `&amp;` via shared `escapeHtml` ([src/web/components/escape.ts:15](src/web/components/escape.ts#L15), applied at [src/web/public/dashboard.ts:568](src/web/public/dashboard.ts#L568)). CI's `test:coverage` step fails. | Update the test expectations to the escaped entity (`&amp;`) or a stable substring without `&`. Do **not** remove the escaping — the renderer is correct. |
| AUD-02 | Testing / SEO Contract | High | [tests/integration/enterprise-end-to-end.test.ts:886](tests/integration/enterprise-end-to-end.test.ts#L886) | Test expects `<link rel="canonical" href="https://vmnl.ng/vtm/terms">`, but `/vtm/terms` is auth-gated and deliberately excluded from `PUBLIC_INDEXABLE_ROUTES` ([src/web/public/public-route-registry.ts:4-23](src/web/public/public-route-registry.ts#L4-L23)), so the layout renders `noindex, nofollow` with no canonical ([src/web/public/dashboard.ts:205](src/web/public/dashboard.ts#L205)). Stale expectation conflicts with reviewed policy. | Align the test with registry policy: assert `noindex, nofollow` for unregistered routes. If `/vtm/terms` must be indexable, register it deliberately — that is a policy decision, not a code fix. |
| AUD-03 | Backend / State Durability | High | [src/core/auth/index.ts:25,174,290,476](src/core/auth/index.ts#L25), [src/core/auth/sessions.ts:40,191,241,293](src/core/auth/sessions.ts#L40), [src/core/websecurity/index.ts:118](src/core/websecurity/index.ts#L118), [src/core/audit/index.ts:39](src/core/audit/index.ts#L39), [src/api/routes/privacy.routes.ts:19](src/api/routes/privacy.routes.ts#L19), [src/core/feature-flags/index.ts:380](src/core/feature-flags/index.ts#L380) | MFA challenge consumption, rate-limit buckets, the user credential store, account lockouts, session registries, notification preferences, inboxes, idempotency records, the audit ledger, DSR requests and feature-flag overrides are all process-local `Map`s. Restarts drop sessions/lockouts/challenges (one-time consumption guarantees break); multiple instances do not share limits or revocations. | Move canonical state to PostgreSQL and ephemeral shared controls to the KV adapter with atomic operations; fail closed at boot when the durable backend is unavailable in production. |
| AUD-04 | Backend / Cache Wiring | High | [src/core/cache/index.ts:165-201](src/core/cache/index.ts#L165-L201), [src/core/auth/index.ts:178-196](src/core/auth/index.ts#L178-L196) | `resolveKeyValueAdapter()` and `configureRedisAdapterFactory()` exist but are **never called from `createApiServer()`**; `useKeyValueAdapterForAuthStores()` is never invoked at boot. Additionally `kvGetJson` reads only the local Map, so even a wired Redis would be a write-only mirror; `kvSetJson` writes are fire-and-forget with swallowed errors. | Register a real Redis client factory and resolve the adapter during boot; make the auth/session/read paths consult the adapter (or replace Maps entirely); propagate KV failures into health/readiness and refuse prod startup on memory backend. |
| AUD-05 | Security / Audit Integrity | High | [src/core/audit/index.ts:39,80-140](src/core/audit/index.ts#L39) | The tamper-evident hash chain is process-local; Prisma persistence is fire-and-forget; failures only flip an internal `persistenceMode` flag to `prisma_error` with no emit, alert or caller-visible failure. `getAuditLogs` reads memory only, so restarts orphan the chain and concurrent workers cannot share one durable chain. Audit writes are not atomic with the business writes they witness. | Persist audit entries in the same DB transaction as the consequential write (or a transactional outbox); surface `prisma_error` via health/readiness and alerts; persist sequence/hash state durably with concurrency control. |
| AUD-06 | Privacy / PII at Rest | High | [prisma/schema.prisma:90,107](prisma/schema.prisma#L90) (with [src/core/websecurity/index.ts:182](src/core/websecurity/index.ts#L182)) | `Person.nationalId` and `User.mfaSecret` are plain `String?` columns. A TOTP seed in plaintext is a full 2FA-bypass vector on any DB or backup leak; national ID is direct PII. `encryptSensitiveField` (AES-256-GCM) exists but is not applied to these columns on any write path. `User.passwordHash` (bcrypt) is acceptable as hashed. | Encrypt `mfaSecret` and `nationalId` at rest using the existing helper with managed-key versioning and rotation; add a migration plus read/write path tests; restrict column access and log access to decrypted values. |
| AUD-07 | Payments / Webhook Replay | High | [src/api/router.ts:6947](src/api/router.ts#L6947), [src/modules/finance/reconciliation/index.ts:39-58](src/modules/finance/reconciliation/index.ts#L39-L58) | Paystack/Flutterwave handlers validate HMAC signatures and Zod schemas correctly, but duplicate-event protection is an in-memory `Map` inside `BankReconciliationEngine.ingestBankTransactions`. A provider replay after restart, or across instances, re-ingests the transaction — a double-credit risk. | Add a durable unique constraint on provider event ID (DB table or KV `setIfAbsent` with TTL) checked transactionally before ingestion; reject-and-log replays; keep the in-memory path for tests only. |
| AUD-08 | Privacy / Data-Subject Rights | High | [src/api/routes/privacy.routes.ts:19,46-98](src/api/routes/privacy.routes.ts#L19) | The DSR export endpoint (correctly auth-gated with exact email match) records requests only in a process-local Map and returns `QUEUED` while no archive is ever produced and no durable workflow exists. A restart silently loses the request; the user is told it is queued. | Back DSRs with a durable table (status lifecycle, SLA timestamps), produce the export archive with signed expiry, and emit an audit event; until implemented, return an explicit "not available" rather than `QUEUED`. |
| AUD-09 | Config / Broadcast Governance | Medium | [src/core/config/index.ts:59-67](src/core/config/index.ts#L59-L67) | Hardcoded StarTimes channel/PID defaults (`NXTR_DTT_CHANNEL=428`, `NXTR_DTH_CHANNEL=312`, PIDs 1042/1044/1046, etc.). The repository constitution (CLAUDE.md broadcast law) forbids hard-coding unverified carriage numbers; `STARTIMES_CARRIAGE_VERIFIED=false` mitigates but the numbers still feed surfaces as if authoritative. | Remove numeric defaults (require explicit env values) or gate every rendering of them behind `STARTIMES_CARRIAGE_VERIFIED === true`; label rendered values "unverified" until carriage is confirmed. |
| AUD-10 | Config / Fail-Closed Tension | Medium | [.env.example:71](.env.example#L71), [src/core/database/repository-mode.ts:21](src/core/database/repository-mode.ts#L21) | The shipped example sets `ALLOW_SANDBOX_FALLBACK=true`; a production deployment copied from the example would silently serve memory-fallback data instead of failing closed when the DB is unavailable — directly undermining the fail-closed design. | Default the example to `false`; add boot-time refusal when `NODE_ENV` is production/staging and the flag is true; document the flag's blast radius. |
| AUD-11 | Security / Dev Fallback Secrets | Medium | [src/api/server.ts:68-75](src/api/server.ts#L68-L75) | Non-production boot injects known default secrets (`JWT_SECRET="vmnl-secure-jwt-secret-…"`, Azeebo secret) when unset. With `NODE_ENV` unset or mistyped, a deployment silently runs with publicly-known signing keys. Production/staging correctly fail fast. | Treat any `NODE_ENV` other than exactly `development`/`test` as production for secret purposes; refuse boot when a default/placeholder secret is in effect outside explicit development. |
| AUD-12 | API / Validation & Typing | Medium | [src/api/router.ts:414-426](src/api/router.ts#L414-L426), [eslint.config.js:21](eslint.config.js#L21) | `parseJsonBody` returns `Promise<any>` and untyped bodies flow through casts into handlers; `@typescript-eslint/no-explicit-any` is disabled. Zod validation covers selected routes only, so unknown fields reach domain logic unvalidated on others. | Return `Promise<unknown>`, parse through a typed error, and require a Zod schema at every mutating boundary; re-enable `no-explicit-any` (or `warn` + budget) and burn down the debt. |
| AUD-13 | API / Error Semantics | Medium | [src/api/routes/enquiry.routes.ts:53-60](src/api/routes/enquiry.routes.ts#L53-L60), [src/api/routes/privacy.routes.ts:21](src/api/routes/privacy.routes.ts#L21), [src/api/router.ts:7257-7280](src/api/router.ts#L7257) | Modular domain routes return RFC 9457 `application/problem+json`, but the monolithic router returns ad-hoc `{ error, message, code }` shapes and maps unknown errors inconsistently. Clients cannot rely on one error contract; `error.message` may leak internal detail. | Standardize on one problem+json boundary with stable codes and request IDs; map domain errors centrally; keep internals in restricted logs only; document status contracts in OpenAPI. |
| AUD-14 | API / Abuse Controls | Medium | [src/core/auth/index.ts:174,204](src/core/auth/index.ts#L204) | Rate limiting is selective (login/MFA/recovery) and process-local; there is no shared per-IP/per-principal budget for public unauthenticated intake forms, so a multi-instance deployment multiplies every limit by instance count. | Give the KV adapter an atomic INCR/sliding-window implementation and apply shared budgets to all public intake and auth endpoints; fail closed (or shed load) when the shared backend is down. |
| AUD-15 | Database / Query Patterns | Medium | [src/modules/broadcast/episode-masters.ts:149-168](src/modules/broadcast/episode-masters.ts#L149-L168) | `refreshEpisodeMasterIndex` pages programmes per channel and episodes per programme in nested loops — bounded page sizes, but sequential round-trips that scale with channel×programme count (N+1-shaped). Could not be EXPLAIN-verified: no live DB in audit environment. | Batch programme and episode fetches (single query per channel or a join), or parallelize with bounded concurrency; measure with representative data and indexes already added in the 2026-10-02 migrations. |
| AUD-16 | Observability | Medium | [src/core/observability/index.ts:160-176](src/core/observability/index.ts#L160-L176), [src/api/server.ts:245,249,264](src/api/server.ts#L245), [src/api/router.ts:7257](src/api/router.ts#L7257) | `logStructured` builds and **returns** a JSON string but never emits it; all four observed call sites discard the return value. WARN/ERROR signals — bootstrap failures, unhandled route errors, audit degradation — are observable nowhere. OTLP exporters exist but are referenced only by tests; Prometheus `/metrics` (correctly guarded, [src/api/router.ts:3405](src/api/router.ts#L3405)) is the only wired surface. | Emit inside `logStructured` (stdout JSON in production, console in dev) and wire the OTLP log exporter when configured; add an alert rule on `persistenceMode === "prisma_error"`. |
| AUD-17 | Performance / Event Loop | Medium | [src/api/router.ts:431,454,490](src/api/router.ts#L431) | `gzipSync` compresses HTML/JSON bodies synchronously on the event loop. The 1 MB default body cap bounds worst cases, but bursts of large dynamic pages (or the 30 MB storage path) stall all in-flight requests. | Compress with async `zlib.gzip` (callback/promise), pre-compress known-static assets at build time, and cache compressed representations keyed by ETag. |
| AUD-18 | Code Quality / Gates | Medium | [src/api/router.ts](src/api/router.ts) (7,287 lines), [vitest.config.ts:11-27](vitest.config.ts#L11-L27), [eslint.config.js:21](eslint.config.js#L21) | The router concentrates routing, auth, rendering and domain dispatch in one file; coverage reporters are configured with **no thresholds**, so coverage can silently regress; combined with AUD-12, type-safety gates are soft. | Split domain routers behind the existing modular `RouteDefinition` pattern ([src/api/routes/](src/api/routes/)); set a baseline coverage number in CI and ratchet upward; re-enable `no-explicit-any`. |
| AUD-19 | Accessibility / Verification | Medium | [tests/a11y/responsive.test.ts:99-106](tests/a11y/responsive.test.ts#L99-L106), [src/web/assets/client-bundle.ts](src/web/assets/client-bundle.ts) | A11y tests are static string assertions; "viewport" tests iterate pixel numbers without a real browser, so reflow, zoom, focus order, contrast and screen-reader behaviour are unproven. The client bundle's drawer inert-state handling is good but browser-unverified. WCAG 2.2 AA is a repository target (CLAUDE.md law 19). | Add a Playwright-based axe + keyboard-navigation suite against a served build; verify drawer/palette focus restoration in a real browser; document a manual screen-reader pass. |
| AUD-20 | Frontend / CSP Headroom | Medium | [src/api/router.ts:907](src/api/router.ts#L907), [src/web/public/dashboard.ts](src/web/public/dashboard.ts) | CSP is well-constructed (`default-src 'self'`, frame-deny, HSTS in prod), but styles require `unsafe-inline` because inline `style="…"` attributes are pervasive across every renderer. XSS payloads that reach HTML gain style-based exfiltration primitives. | Migrate repeated inline styles to classes in `/assets/styles.css` (design tokens already exist); then drop `style-src 'unsafe-inline'` or move to nonced styles. |
| AUD-21 | DevOps / CI Depth | Medium | [.github/workflows/ci.yml:71-107](.github/workflows/ci.yml#L71-L107), [scripts/audit-check.js](scripts/audit-check.js) | CI runs gitleaks (SHA-pinned), Trivy (CRITICAL,HIGH, exit 1), `prisma migrate deploy`, coverage and `gates:check` — strong. But `audit:check` only verifies advisory IDs are *registered* in the triage doc (registration ≠ approval), and there is no vulnerability-threshold or SBOM policy. CI is currently red solely due to AUD-01/02. | Add a real `pnpm audit` severity-threshold step; generate an SBOM on release builds; keep `audit:check` as a companion, not a substitute. |
| AUD-22 | DevOps / Compose | Low | [docker-compose.yml:78-93](docker-compose.yml#L78-L93) | Compose is loopback-bound with sandbox-only passwords (good), but Redis runs unauthenticated (`--appendonly yes`, no `requirepass`); any future port exposure or shared network joins an open Redis. The backup sidecar runs crond as root. Unverifiable here (no Docker in audit environment). | Add `--requirepass ${REDIS_PASSWORD:?required}` and `user:` non-root for the backup job in deployment topologies; keep sandbox defaults documented as such. |
| AUD-23 | SEO & Crawlability | Info | [src/web/public/public-route-registry.ts](src/web/public/public-route-registry.ts), [src/web/public/dashboard.ts:205](src/web/public/dashboard.ts#L205) | Verified healthy: 18-route registry drives canonical/noindex; robots.txt and sitemap endpoints exist ([src/api/router.ts:2396-2431](src/api/router.ts#L2396-L2431)); JSON-LD serialization escapes `<`, `>`, `&`, U+2028/9. Only risk is drift between registry and live routes (see AUD-02). | Add a contract test enumerating public routes and asserting canonical/noindex parity with the registry. |
| AUD-24 | Secrets Hygiene | Info | [.gitignore:65](.gitignore#L65), [.github/workflows/ci.yml:71-72](.github/workflows/ci.yml#L71-L72) | Verified clean: `.env` matches `*.env` ignore rule and appears in no commit history (checked `git log --all`); no production secrets hardcoded in `src/` or `scripts/`; only a historical `sk_test` reference in a handoff doc. Gitleaks runs on every CI push. | No action required; keep gitleaks SHA-pinned and extend secret scanning to the container image build. |
| AUD-25 | Dependency Security | Info | [package.json](package.json) (`pnpm.overrides`), [docs/audit/dependency-triage.md](docs/audit/dependency-triage.md) | `pnpm audit --json` reports zero advisories at scan date; overrides pin `lodash@4.18.1`, `deepmerge-ts@8.0.2`, `mysql2@3.24.5`. Point-in-time result — not a reachability or SBOM assessment (see AUD-21). | Maintain overrides; re-scan on dependency changes; add the threshold policy from AUD-21. |

---

## 3. Detailed Audit by Category

### 3.1 Frontend & Client Architecture

**Status:** Needs Attention

**Strengths:** Server-rendered string HTML with no framework runtime, keeping the client footprint to a single 357-line bundle ([src/web/assets/client-bundle.ts](src/web/assets/client-bundle.ts)) that uses DOM APIs rather than `innerHTML` for the command palette. A shared `escapeHtml` primitive ([src/web/components/escape.ts](src/web/components/escape.ts)) is imported by 20+ renderers, and JSON-LD passes through `serializeJsonLd` with `<`, `>`, `&`, U+2028/9 escaping ([src/web/public/dashboard.ts:195-197](src/web/public/dashboard.ts#L195-L197)). The drawer implements `aria-expanded`, `aria-controls`, initial `inert`/`aria-hidden`, focus capture and restoration ([src/web/public/dashboard.ts:262-300](src/web/public/dashboard.ts#L262-L300)). Authed pages are served with `Cache-Control: private, no-store` plus ETag/304 revalidation ([src/api/router.ts:483-527](src/api/router.ts#L483-L527)).

**Vulnerabilities & Anti-Patterns:** The renderer/test contract is broken in three places (AUD-01/02): tests assert pre-escaping exact strings, so CI is red even though the renderer is behaving *more* safely than the tests assume — the risk is someone "fixing" this by weakening `escapeHtml`. Inline `style="…"` attributes are pervasive (e.g. [src/web/public/dashboard.ts:581-585](src/web/public/dashboard.ts#L581-L585)), which is what forces `style-src 'unsafe-inline'` in CSP (AUD-20). There is no bundle budget, no fingerprinted assets, and client state is ad-hoc DOM + `localStorage`.

**Concrete Code Snippets:**

*Before (test expects the unescaped string — fails because the renderer is correct):*
```ts
// tests/a11y/visual-regression-baseline.test.ts:56
expect(hubHtml).toContain("African Film & Creative Arts Academy");
```

*After (assert the escaped contract — matches what a browser actually parses):*
```ts
expect(hubHtml).toContain("African Film &amp; Creative Arts Academy");
// or, resilient to escaping details while still pinning the vertical:
expect(hubHtml).toContain("Creative Arts Academy");
```

*Before (per-element inline styles force unsafe-inline CSP):*
```html
<h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 8px;">${escapeHtml(h.title)}</h3>
```

*After (class-based tokens, CSP can drop unsafe-inline):*
```html
<h3 class="card-title">${escapeHtml(h.title)}</h3>
```

### 3.2 Backend & API Architecture

**Status:** Needs Attention

**Strengths:** Declarative `ROUTE_GUARDS` (~80 entries) enforced before dispatch ([src/api/router.ts:609+](src/api/router.ts#L609)); bounded body reads with per-path limits and `PayloadTooLargeError`→413; request/headers timeouts on the Node server; double-submit CSRF + Origin + Fetch-Metadata verification for cookie-authenticated unsafe writes ([src/api/router.ts:961](src/api/router.ts#L961)); modular route definitions with Zod validation and problem+json ([src/api/routes/enquiry.routes.ts](src/api/routes/enquiry.routes.ts), [privacy.routes.ts](src/api/routes/privacy.routes.ts)); `/metrics` requires a token or operator role ([src/api/router.ts:3405](src/api/router.ts#L3405)); `AUTH_BYPASS_ENABLED` is forbidden in production/staging at boot ([src/api/server.ts:53-58](src/api/server.ts#L53-L58)).

**Vulnerabilities & Anti-Patterns:** `parseJsonBody` yields `any` and untyped bodies reach handlers via casts (AUD-12); rate limiting is selective and process-local (AUD-14); error shapes are inconsistent between modular and monolithic paths (AUD-13); the state behind nearly every control is process-local (AUD-03/04).

**Concrete Code Snippets:**

*Before (untyped body escapes into the domain):*
```ts
export async function parseJsonBody(req: IncomingMessage, pathname = ""): Promise<any> {
  const body = await readBodyWithLimit(req, maxBodyBytesForPath(pathname));
  if (!body.trim()) return {};
  try { return JSON.parse(body); }
  catch (_err) { throw new Error("Invalid JSON body payload", { cause: _err }); }
}
```

*After (untrusted `unknown`, schema-validated at the boundary):*
```ts
export async function parseJsonBody(req: IncomingMessage, pathname = ""): Promise<unknown> {
  const body = await readBodyWithLimit(req, maxBodyBytesForPath(pathname));
  if (!body.trim()) return {};
  try { return JSON.parse(body) as unknown; }
  catch (cause) { throw new InvalidJsonBodyError({ cause }); }
}

const dto = CreateEnquirySchema.parse(await parseJsonBody(req, pathname));
```

*Before (fire-and-forget KV write; reads never consult Redis):*
```ts
function kvGetJson<T>(store: Map<string, T>, key: string): T | undefined {
  return store.get(key);                      // memory only
}
function kvSetJson<T>(store: Map<string, T>, key: string, value: T, ttlMs?: number): void {
  store.set(key, value);
  if (kvAdapter && ttlMs) {
    void kvAdapter.set(`auth:${key}`, JSON.stringify(value), ttlMs).catch(() => { /* swallowed */ });
  }
}
```

*After (shared, atomic, failure-visible):*
```ts
const ok = await kvAdapter.setIfAbsent(`auth:lock:${key}`, "1", lockTtlMs);
if (!ok) return { locked: true, retryAfterMs: remainingTtl };
```

### 3.3 Database & Persistence

**Status:** Fail

**Strengths:** Prisma schema is canonical and relationship-complete; read-path and finance-event index migrations shipped 2026-10-02 ([prisma/migrations/20261002140000_add_read_path_indexes/migration.sql](prisma/migrations/20261002140000_add_read_path_indexes/migration.sql), [prisma/migrations/20261002150000_add_finance_event_indexes/migration.sql](prisma/migrations/20261002150000_add_finance_event_indexes/migration.sql)); repository mode is explicitly fail-closed unless a per-deployment flag opts into sandbox fallback ([src/core/database/repository-mode.ts:21](src/core/database/repository-mode.ts#L21)); keyset pagination caps pages at 100 ([src/core/database/repositories/pagination.ts](src/core/database/repositories/pagination.ts)); pool sizing and a 3s connect timeout are configured.

**Vulnerabilities & Anti-Patterns:** The canonical **identity** store is not Prisma at all — `const userStore = new Map<string, UserRecord>()` ([src/core/auth/index.ts:290](src/core/auth/index.ts#L290)) — so accounts, sessions and revocations do not survive restarts and cannot be shared (AUD-03). The episode-master refresh makes sequential per-programme page requests (AUD-15). The fail-closed posture is undermined by the example env (AUD-10). Migration deployment and query plans could not be exercised here: the configured database `vmnl_enterprise` does not exist in the audit environment — this is a verification limitation, not a code defect.

**Concrete Code Snippets:**

*Before (identity in a Map, evaporates on restart):*
```ts
// In-memory credential store with real bcrypt hashes for system users
const userStore = new Map<string, UserRecord>();
```

*After (canonical identity in PostgreSQL, cache optional):*
```ts
const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
  include: { person: true, userRoles: { include: { role: true } } },
});
if (!user) throw new AuthError("invalid_credentials"); // uniform, non-enumerating
```

*Before (example env opts every copy into memory fallback):*
```dotenv
ALLOW_SANDBOX_FALLBACK=true
```

*After (fail-closed default; explicit sandbox-only override):*
```dotenv
# Sandbox ONLY. Production/staging must run with this false (boot refuses otherwise).
ALLOW_SANDBOX_FALLBACK=false
```

### 3.4 Security & AppSec

**Status:** Needs Attention

**Strengths:** Verified clean secrets posture (AUD-24); strict prod config validation rejecting placeholder/CHANGE_ME secrets and minioadmin credentials; HMAC `timingSafeEqual` webhook signature checks with Zod payload validation ([src/api/router.ts:6947](src/api/router.ts#L6947), MT940 HMAC at [src/modules/finance/reconciliation/mt940.ts:254-269](src/modules/finance/reconciliation/mt940.ts#L254-L269)); security headers centrally set — CSP `default-src 'self'`, `X-Frame-Options: DENY`, `nosniff`, prod-only HSTS preload ([src/api/router.ts:903-914](src/api/router.ts#L903-L914)); account lockout with exponential backoff capped at 15 minutes ([src/core/auth/index.ts:470-479](src/core/auth/index.ts#L470-L479)); MFA challenge JWTs are one-time consumed in-process.

**Vulnerabilities & Anti-Patterns:** Plaintext-capable `mfaSecret`/`nationalId` columns (AUD-06); webhook replay dedup is memory-only (AUD-07); all lockout/rate-limit/challenge state is per-process, so a second instance resets every limit (AUD-03/04); dev boot can fall back to publicly-known signing secrets (AUD-11); CSP style headroom via pervasive inline styles (AUD-20). No SQLi surface found (Prisma parameterizes); no `innerHTML` sinks in the client bundle; SSRF exposure is limited by allowlist-checked exporter URLs in observability.

**Concrete Code Snippets:**

*Before (schema permits plaintext TOTP seed; helper exists but unused here):*
```prisma
model User {
  passwordHash   String
  mfaSecret      String?
}
```

*After (encrypted-at-rest with key version):*
```prisma
model User {
  passwordHash   String
  mfaSecretIv    String?
  mfaSecretTag   String?
  mfaSecretEnc   String?   // AES-256-GCM(mfaSecret, PII_ENCRYPTION_KEY vN)
  mfaKeyVersion  Int?
}
```
```ts
const rec = encryptSensitiveField(totpSecret);       // src/core/websecurity/index.ts:182
await prisma.user.update({ where: { id }, data: {
  mfaSecretEnc: rec.ciphertext, mfaSecretIv: rec.iv, mfaSecretTag: rec.tag, mfaKeyVersion: rec.keyVersion,
}});
```

*Before (idempotency in a process Map):*
```ts
const idempotencyStore = new Map<string, IdempotencyRecord>();   // src/core/websecurity/index.ts:118
```

*After (durable claim, replay-safe across instances):*
```ts
const claimed = await kv.setIfAbsent(`idem:${key}`, JSON.stringify(pending), 86_400_000);
if (!claimed) return checkIdempotency(key); // existing outcome or 409
```

### 3.5 Performance & Core Web Vitals

**Status:** Needs Attention

**Strengths:** Conditional gzip, weak-ETag/304 revalidation for dynamic HTML, `private, no-store` for authed pages, revalidate-on-reload for static assets, explicit Content-Type/Length for images ([src/api/router.ts:426-527](src/api/router.ts#L426-L527)); keyset pagination with a hard 100-row cap; read-path indexes recently added.

**Vulnerabilities & Anti-Patterns:** Synchronous `gzipSync` on the request path (AUD-17); the episode-master refresh performs sequential nested paging (AUD-15); no measured Core Web Vitals, transfer budgets or load-test evidence exists anywhere in the repo — the audit could not produce them either (no deployment). These are process/verification gaps rather than hot-code defects.

**Concrete Code Snippets:**

*Before (event-loop-blocking compression):*
```ts
const body = acceptsGzip ? gzipSync(rawBuffer) : rawBuffer;   // src/api/router.ts:431
```

*After (async, with a small-payload cutoff):*
```ts
const body = acceptsGzip && rawBuffer.length > 1_024
  ? await gzip(rawBuffer)
  : rawBuffer;
```

*Before (per-programme sequential paging):*
```ts
for (const programme of programmes) {
  let episodeCursor: string | undefined;
  do {
    const page = await repository.listEpisodes(programme.code, { after: episodeCursor });
    episodes.push(...page.rows);
    episodeCursor = page.nextCursor;
  } while (episodeCursor);
}
```

*After (batched per channel; bounded concurrency across channels):*
```ts
const episodePages = await Promise.all(
  programmes.map((p) => repository.listAllEpisodes(p.code)) // server-side cursor loop or JOIN
);
episodes.push(...episodePages.flat());
```

### 3.6 DevOps & Infrastructure

**Status:** Needs Attention

**Strengths:** Multi-stage `Dockerfile` on `node:22-alpine` with `pnpm install --frozen-lockfile`, non-root `vmnluser` (uid 1001), `dumb-init`, `HEALTHCHECK`, and corepack-pinned pnpm; CI pins every third-party Action by SHA, runs gitleaks, Trivy (CRITICAL/HIGH gate), `prisma migrate deploy`, coverage and `gates:check` ([.github/workflows/ci.yml](.github/workflows/ci.yml)); Compose binds service ports to `127.0.0.1` with healthchecks and sandbox-only credentials.

**Vulnerabilities & Anti-Patterns:** Compose Redis is unauthenticated (AUD-22); `audit:check` proves advisory *registration*, not approval or a severity policy (AUD-21); no SBOM/image provenance; backup cron runs as root with no verified restore drill; Docker/Compose could not be executed in this audit environment (limitation).

**Concrete Code Snippets:**

*Before (open Redis behind a loopback binding only):*
```yaml
redis:
  image: redis:7-alpine
  command: ["redis-server", "--appendonly", "yes"]
```

*After (authenticated; no host publishing in deployment topologies):*
```yaml
redis:
  image: redis:7-alpine
  command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD:?required}"]
  ports: []   # reachable only on the internal docker network
```

*Before (registration-only advisory gate):*
```js
// scripts/audit-check.js — verifies each advisory ID appears in docs/audit/dependency-triage.md
```

*After (severity policy in CI):*
```yaml
- name: Dependency vulnerability threshold
  run: node scripts/audit-threshold.js --max-high 0 --max-critical 0
```

### 3.7 Code Quality & Maintainability

**Status:** Needs Attention

**Strengths:** Strict TypeScript passes clean (`tsc --noEmit` exit 0); lint is enforced at `--max-warnings 0` with `no-unused-vars` as error; 47 test files across unit/integration/security/contract/a11y; modular `RouteDefinition` pattern already established for new domain routes; typing discipline is high outside the legacy router.

**Vulnerabilities & Anti-Patterns:** `@typescript-eslint/no-explicit-any` is off ([eslint.config.js:21](eslint.config.js#L21)) and the 7,287-line router is the main beneficiary (AUD-12/18); coverage has reporters but no thresholds ([vitest.config.ts:11-27](vitest.config.ts#L11-L27)), so the 553-test suite's value is unquantified and can silently regress; three failing tests indicate exact-string baselines that rot (AUD-01/02).

**Concrete Code Snippets:**

*Before (lint debt made permanent):*
```js
rules: {
  "@typescript-eslint/no-explicit-any": "off",
```

*After (budgeted debt with a ratchet):*
```js
rules: {
  "@typescript-eslint/no-explicit-any": ["warn", { fixToUnknown: true }], // count must not increase
```

*Before (coverage can regress silently):*
```ts
coverage: { provider: "v8", reporter: ["text", "json", "html"], exclude: [/* … */] },
```

*After (baseline + ratchet):*
```ts
coverage: {
  provider: "v8", reporter: ["text", "json", "html"], exclude: [/* … */],
  thresholds: { lines: 70, branches: 60, functions: 70, statements: 70 }, // ratchet upward
},
```

### 3.8 Accessibility (a11y)

**Status:** Needs Attention

**Strengths:** Shared shell emits `<!DOCTYPE html>`, `lang="en"`, viewport, skip link, landmarks and a header nav ([src/web/public/dashboard.ts:197-219](src/web/public/dashboard.ts#L197-L219)); form renderer pairs labels/IDs with `aria-invalid` and error messaging; drawer/palette manage `inert` and focus with prior-state restoration ([src/web/assets/client-bundle.ts](src/web/assets/client-bundle.ts)); a dedicated a11y test suite asserts landmarks, labels, alt text and ≥44px targets; WCAG 2.2 AA is an explicit repository target (CLAUDE.md law 19).

**Vulnerabilities & Anti-Patterns:** Verification is static: "viewport" tests loop pixel numbers over the same string HTML with no browser ([tests/a11y/responsive.test.ts:99-106](tests/a11y/responsive.test.ts#L99-L106)), so reflow, zoom/reflow (WCAG 1.4.10), focus order, contrast and screen-reader semantics remain unproven. Nothing here demonstrates a failure yet — it demonstrates **absence of proof**, which for a public-audience media platform is itself the finding.

**Concrete Code Snippets:**

*Before (simulated viewports, same string re-checked):*
```ts
it("verifies layout compatibility across all target viewports (360, 390, 671, 768, 1024, 1440 px)", () => {
  for (const _viewport of targetViewports) {
    for (const page of testPages) {
      expect(page.html.length).toBeGreaterThan(100);
      expect(page.html).toContain("</main>");
      expect(page.html).toContain("</body>");
    }
  }
});
```

*After (real layout engine + automated axe rules):*
```ts
for (const width of [360, 390, 671, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 800 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
  expect(await page.locator("main").isVisible()).toBe(true);
}
```

### 3.9 SEO & Crawlability

**Status:** Pass

**Strengths:** The strongest small system in the repo: an 18-route `PUBLIC_INDEXABLE_ROUTES` registry is the single source of truth for canonical URLs and indexing; unregistered routes render `noindex, nofollow` ([src/web/public/dashboard.ts:205](src/web/public/dashboard.ts#L205)); robots.txt and sitemap.xml are served from the same registry ([src/api/router.ts:2396-2431](src/api/router.ts#L2396-L2431)); OG/Twitter metadata plus Organization/BreadcrumbList/Course JSON-LD, all through the safe `serializeJsonLd` serializer.

**Vulnerabilities & Anti-Patterns:** One contract drift already materialized as a failing test (AUD-02): a test expects `/vtm/terms` to be canonical-indexable while the registry deliberately excludes the auth-gated route. Policy is right; the test is stale. Registry-to-live-route parity has no automated check.

**Concrete Code Snippets:**

*Before (test asserts indexability of an auth-gated route):*
```ts
expect(termsAuthorized.rawText).toContain('<link rel="canonical" href="https://vmnl.ng/vtm/terms"');
```

*After (test asserts the registry policy for unregistered routes):*
```ts
expect(termsAuthorized.rawText).toContain('<meta name="robots" content="noindex, nofollow">');
```

### 3.10 Privacy & Compliance

**Status:** Fail

**Strengths:** The DSR export endpoint is auth-gated with exact account-email match and does not overclaim (returns an explicit lifecycle); enquiry/webhook audit payloads were previously minimized; config enforces `PII_ENCRYPTION_KEY` in production; public pages carry honest "not verified" labelling; `package.json` is marked `UNLICENSED` (proprietary), and the OpenAPI spec states it.

**Vulnerabilities & Anti-Patterns:** DSR state is process-local with a fictitious `QUEUED` status (AUD-08); `nationalId`/`mfaSecret` are plaintext-capable (AUD-06); no retention policy, archive lifecycle, or third-party license/SBOM review exists in-repo; per CLAUDE.md law 12 (no high-risk personal-data processing without privacy review), the current schema+log posture must not process real national IDs in production until remediated.

**Concrete Code Snippets:**

*Before (request acknowledged to the user, stored nowhere):*
```ts
const requestsByUser = new Map<string, DataSubjectRequest>();   // privacy.routes.ts:19
requestsByUser.set(user.userId, request);                       // gone on restart
```

*After (durable lifecycle with SLA + audit):*
```ts
const dsr = await prisma.dataSubjectRequest.create({
  data: { userId: user.userId, type: "EXPORT", status: "QUEUED", dueAt: addDays(new Date(), 30) },
});
await audit.record({ action: "privacy.dsr.requested", resourceId: dsr.id });
return { status: "ACCEPTED", requestId: dsr.id, dueAt: dsr.dueAt };
```

---

## 4. Prioritized Remediation Roadmap

### 1. Immediate P0 Blockers (Fix within 24 hours)

1. **Restore a green suite without weakening safety (AUD-01, AUD-02).** Update `tests/a11y/visual-regression-baseline.test.ts:56` and `tests/integration/enterprise-end-to-end.test.ts:124` to assert the escaped entity (`&amp;`) — the renderer's escaping is correct and must stay. Update `tests/integration/enterprise-end-to-end.test.ts:886` to assert the `noindex, nofollow` policy for the unregistered, auth-gated `/vtm/terms` (or, if the business decides the terms page must be crawlable, add it to `PUBLIC_INDEXABLE_ROUTES` deliberately — a recorded policy decision, not a silent change). CI is red today solely because of these three assertions.
2. **Make fail-closed non-optional in production (AUD-10).** Flip `.env.example` to `ALLOW_SANDBOX_FALLBACK=false`, and add a boot-time refusal when `NODE_ENV` is production/staging and the flag is true.
3. **Harden environment detection for dev fallback secrets (AUD-11).** Only exact `development`/`test` may use `server.ts` test defaults; any other `NODE_ENV` value (including unset) must fail fast like production.
4. **Emit structured logs (AUD-16, minimal change).** Make `logStructured` write its JSON line to stdout (or console in dev) so the WARN paths in [src/api/server.ts:245-249](src/api/server.ts#L245) and the audit `prisma_error` degradation become observable. This is a prerequisite for trusting everything else.

### 2. Short-Term P1 Improvements (Next sprint)

1. **Wire the KV adapter for real (AUD-03, AUD-04, AUD-14).** Register a Redis client factory and call `resolveKeyValueAdapter()` + `useKeyValueAdapterForAuthStores()`/sessions in `createApiServer()`; replace the Map-first read with adapter-first reads (or replace the Maps); use atomic `setIfAbsent`/`INCR` for lockouts, one-time MFA challenges, rate limits and idempotency; fail startup in production when only the memory backend is available.
2. **Durable audit ledger (AUD-05).** Write audit entries in the same Prisma transaction as the consequential business write (or via a transactional outbox with a relay); persist chain sequence/hash state; expose `prisma_error` through `/health` and an alert rule.
3. **Encrypt PII/MFA at rest (AUD-06).** Apply the existing AES-256-GCM helper to `mfaSecret` and `nationalId` with key-versioned migration, decrypt-on-read path tests, and access logging.
4. **Durable webhook event dedup (AUD-07).** Unique provider-event-ID constraint checked transactionally in `ingestBankTransactions`; replay tests across "restart" boundaries.
5. **Durable DSR workflow (AUD-08).** Replace the Map with a `DataSubjectRequest` table and honest status lifecycle (see 3.10 snippet); produce the export archive with signed, expiring access.
6. **Remove/gate hardcoded StarTimes carriage numbers (AUD-09).** Require explicit env values; render carriage details only when `STARTIMES_CARRIAGE_VERIFIED=true`, otherwise an explicit "unverified" label (per CLAUDE.md broadcast law).
7. **Shared rate budgets on public intake (AUD-14).** Atomic per-IP and per-principal windows in the KV adapter for all unauthenticated forms.

### 3. Medium-Term P2 Hardening (Tech debt backlog)

1. **Type-safety and structure (AUD-12, AUD-18).** `parseJsonBody` → `unknown` + Zod at every mutating boundary; re-enable `no-explicit-any` (warn + ratchet); continue extracting domain routers from the monolith behind the existing `RouteDefinition` pattern.
2. **Coverage and contract gates (AUD-18, AUD-21).** Establish a coverage baseline, add thresholds, ratchet; replace `audit:check`'s registration-only check with a severity-threshold gate; add a registry↔route parity contract test (AUD-23).
3. **Real-browser quality (AUD-19, AUD-20).** Playwright + axe suite across the six target viewports, keyboard-path and drawer focus-restoration tests; migrate inline styles to classes and drop `style-src 'unsafe-inline'`.
4. **Error contract normalization (AUD-13).** One problem+json mapper with stable codes and request IDs across modular and monolithic routes; OpenAPI status documentation.
5. **Query verification at scale (AUD-15).** With a live PostgreSQL, EXPLAIN the keyset queries at representative volume; batch the episode-master refresh; record latency baselines.

### 4. Long-Term P3 Architecture

1. **Observability completeness (AUD-16).** OTLP log/trace exporters wired in production config; alert rules for audit-persistence degradation, KV backend loss and 5xx rates; dashboards for rate-limit/lockout activity.
2. **Operational resilience (AUD-05, AUD-22, AUD-24).** Backup restore drills and PITR evidence; audit-chain continuity across failover; image SBOM + provenance signing; authenticated Redis in deployment topologies; documented incident runbooks.
3. **Compliance evidence (AUD-06, AUD-08).** Data inventory and retention schedule; privacy review sign-off for national-ID processing; DPO-owned DSR SLA reporting; SBOM-based license clearance for `UNLICENSED` distribution boundaries.
4. **Performance program (AUD-17).** Synthetic CWV runs against a deployed build, transfer-size budgets in CI, pre-compressed static assets, and load tests for the compression and webhook paths.

---

*Audit method note: every file:line citation above was re-verified in this working tree on 2026-10-05. Environment limitations: no PostgreSQL instance (`vmnl_enterprise` absent) and no Docker daemon were available, so migration execution, live query plans, container build and browser-based checks are unverified rather than failing.*

---

## 5. Remediation Status (2026-10-06)

> **SUPERSEDED 2026-10-07 — do not read this section as current.** The verification sentence
> below ("typecheck exit 0, lint exit 0 … 47 files / 556 tests, all passing") regressed on
> 2026-10-06/07: the tree reached **152 `tsc --noEmit` errors across 3 files**, CI failed at the
> typecheck step, and 20 test files could not be collected (`report.md` CA-01/CA-02/CA-05).
> The repairs landed 2026-10-07 and the current measured pin is
> `docs/handoffs/LATEST.md` → "Verification pin — re-measured 2026-10-08"
> (tsc 0 · build 0 · lint 0 · **63 files / 689 tests / 0 skipped / 0 unhandled errors**;
> it read 50/588 when this note was first written on 2026-10-07). That pin has itself been superseded
> later the same day by **VMNL-EV-PIN-2026-10-08-B** (TSK-17 closure): **64 files / 705 tests, run twice
> back-to-back at exit 0**, coverage 78.14/69.31/81.69/79.52 against floors 73/62/77/72, over
> `ce098f8` + 178 dirty paths — logs in `docs/audit/evidence/tsk17-durability-2026-10-08/`. The live
> register is `tasks.md` (`VMNL-AZP-VMN-TODO-002`).


Statuses below record what was applied in this working tree after the audit (superseding the roadmap's deferral reasons where implementation has since landed). Environment limitations are unchanged (no PostgreSQL, Docker or browser), so DB-, container- and browser-dependent verification remains open rather than claimed fixed. Verification: `pnpm run typecheck` exit 0, `pnpm run lint` exit 0, `pnpm run audit:threshold` exit 0, and a full coverage run — 47 files / 556 tests, all passing — which also produced the AUD-18 coverage baseline (73.26 lines / 63.97 branches / 78.7 functions / 74.43 statements). Two earlier full-suite runs each contained a single load-induced timeout (an unrelated project's typecheck saturated the host); both files pass in isolation.

### 5.1 Fixed in full (verified)

| ID | What was changed | Evidence |
|:---|:---|:---|
| AUD-01 | Test expectations updated to the renderer's correct escaped entity (`&amp;`) in `tests/a11y/visual-regression-baseline.test.ts` and `tests/integration/enterprise-end-to-end.test.ts`; escaping untouched. | Suite green on those files. |
| AUD-02 | `/vtm/terms` test now asserts `noindex, nofollow` and the absence of a canonical link, matching the reviewed public-route registry policy. | enterprise-end-to-end passes. |
| AUD-09 | All StarTimes channel/PID numeric defaults removed from `src/core/config/index.ts` (optional env-only); the 428/312/1042-family numbers also removed from the channel registry (`src/modules/broadcast/channels/index.ts`) and the golden seed dataset (`src/db/seeds/golden/index.ts`); seed writes `NULL` carriage columns; `isProvisional` retained everywhere. | broadcast + config tests green; no fabricated carriage facts remain in code or seed data. |
| AUD-10 | `.env.example` defaults `ALLOW_SANDBOX_FALLBACK=false` with a blast-radius comment; boot now refuses `ALLOW_SANDBOX_FALLBACK=true` in production/staging (`src/api/server.ts`, beside the AUD-04 gate). | New regression test (production/staging throw; dev/test escape hatch preserved) in `tests/unit/audit-remediation-regressions.test.ts`. |
| AUD-11 | Only exact `development`/`test` may use fallback secrets; any other or unset `NODE_ENV` loads config strictly. | Server boot tests green. |
| AUD-16 (minimal) | `logStructured` now emits its serialized JSON line (stdout), so WARN/ERROR — including audit `prisma_error` degradation — are observable. | Observability tests green; degradation WARNs visible in run logs. |
| AUD-21 | New `scripts/audit-threshold.js` + `pnpm run audit:threshold` (fails on any critical/high advisory), wired into CI after `audit:check`. | Gate exits 0 with zero advisories. |
| AUD-23 | Contract test enumerating every `PUBLIC_INDEXABLE_ROUTES` entry and asserting canonical parity (and `noindex` absence), plus non-indexable paths staying `noindex, nofollow` with no canonical. | New test in `tests/unit/audit-remediation-regressions.test.ts` passes. |
| AUD-25 | The new threshold gate caught a live HIGH advisory (`source-map-js <1.2.2`, event-loop DoS, via `@vitest/coverage-v8`); added a `pnpm.overrides` pin `source-map-js@^1.2.2`. | `pnpm audit --json`: 0 critical / 0 high / 0 moderate / 0 low. |
| AUD-07 | Provider replay is durably claimed at the **single production ingestion path**: both webhook handlers claim `wh:<provider>:<eventId>` via KV `setIfAbsent` (7-day TTL) before any ingestion, duplicates return 200 `{duplicate:true}` with a metric. The engine's in-memory Map is retained as the documented test/second-layer path. | Webhook suites pass; claim-before-ingest order verified in `src/api/router.ts`. |
| AUD-14 | Shared, KV-backed fixed-window rate limiter (`checkSharedRateLimit`) built on the adapter's atomic `incrBy` + time-bucketed keys, so one budget holds across all instances; applied to login, MFA verification, recovery, access requests, invitation acceptance and public inquiry intake. A shared-backend failure sheds load (429) instead of silently unbounding intake. | New regression tests: budget sharing, per-key isolation, fail-closed shed under backend failure. |
| AUD-17 | `sendJson`/`sendText`/`sendHtml` compress with **async** zlib above a 64 KB threshold (small hot responses keep the synchronous path); no caller depended on the senders' return value. | New HTTP regression test: large JSON returns gzip that decompresses byte-exact; small responses stay uncompressed. |

### 5.2 Partially fixed (honest interim state)

| ID | Done | Still open | Reason for the interim scope |
|:---|:---|:---|:---|
| AUD-03/04 | KV adapter wired at boot (Redis factory injection when `REDIS_URL` is set — zero-dependency RESP client over `node:net` — plus `resolveKeyValueAdapter()` and auth/session stores bound); production/staging boot now **refuses** the memory-only backend unless `ALLOW_MEMORY_KV_IN_PRODUCTION=true` is set deliberately; `/readyz` surfaces `kvBackend` + `kvHealthy`. | Adapter-first reads for the auth store Maps (`kvGetJson` is still Map-first); atomic lockout and one-time-MFA-consumption semantics for the sync call sites. | The remaining read-path rewrite converts every sync auth call site to await adapter reads — a dedicated refactor needing Redis-backed tests. |
| AUD-05 | Persistence failure emits a structured WARN; the chain tail (sequence + latest hash) now persists through the KV adapter and is **restored at boot**, so a restarted process continues the durable chain instead of resetting to genesis; `/readyz` exposes `auditPersistence`, `auditChainSequence` and `auditBufferedEntries` for alerting. | Same-transaction audit writes with the business write (or a transactional outbox). | Requires a live PostgreSQL to implement and verify transactions. |
| AUD-06 | `User.mfaSecret` sealed at the KV auth-store boundary (AES-256-GCM, `enc:v1:<ct>:<iv>:<tag>`) with fail-closed decrypt and regression tests; `Person.nationalId` is documented in the schema as an **envelope-only column** (must be sealed via `encryptSensitiveField` before any write — no current write path touches it, so no plaintext can exist). | Key-versioning/rotation policy and decryption access logging. | Key-management ownership is a DPO decision (CLAUDE.md law 12). |
| AUD-08 | Truthful `RECORD_ONLY` messaging retained; requests now also write a **durable `DataSubjectRequest` ledger row** (schema + additive migration `20261006120000_add_data_subject_requests`) when the DB is reachable, reporting `RECEIVED` with `durableRecorded:true` only in that case and falling back honestly to the in-memory record otherwise; GET prefers the durable row. | SLA clock, operator-driven status transitions, signed expiring archive generation. | SLA/archive workflow is a DPO-owned design decision; no invented due-dates. |
| AUD-13 | Verified the terminal 500 mapper does **not** leak internals: stable `{error, message, traceId}` with a generic message; stack only in dev logs. | One problem+json contract across modular and monolithic routes. | Client-facing contract change — needs an interface decision before implementation. |
| AUD-15 | `refreshEpisodeMasterIndex` now fans channels and per-programme episode listings with **bounded concurrency** (8 in flight, order-preserving; cursor paging within a list stays sequential). | EXPLAIN/latency verification at representative volume. | Requires a live PostgreSQL. |
| AUD-18 | Coverage thresholds enforced from a measured baseline (lines 72 / branches 62 / functions 77 / statements 73; measured 73.26/63.97/78.7/74.43). | Router split behind `RouteDefinition`; `no-explicit-any` re-enablement. | Refactor program across the 7k-line monolith — sequenced, not rushed. |

### 5.3 Open — with reason

- **AUD-12** — `parseJsonBody` → `unknown` + Zod at every mutating boundary (41 call sites in the monolith alone) and `no-explicit-any` burn-down is a mechanical refactor program; converting them without per-route validation review would trade one risk for another.
- **AUD-18 (router split)** — extracting domain routers from the 7k-line monolith behind the existing `RouteDefinition` pattern is sequenced work to avoid destabilising the suite; the coverage-threshold half of this finding is done (§5.2).
- **AUD-19** — requires Playwright and a real browser (unavailable here; also a new-devDependency decision under the zero-dependency policy).
- **AUD-20** — inline-style → class migration across every renderer is a design-pass-scale refactor (the CSP change is all-or-nothing once no inline styles remain).
- **AUD-22** — Compose hardening (`requirepass`, non-root backup job) changes deployment topology defaults; requires Docker to verify and an ops decision.
- **AUD-24** — no action required (per finding).
