# VMNL Repository Deep-Check Report — Round 2: Remediation Verification & Outstanding Discrepancies

**Report Reference:** `VMNL-REPO-AUDIT-DEEPCHECK-002`
**Predecessor:** `VMNL-REPO-AUDIT-DEEPCHECK-001` (33 findings: A-1…A-4, B-5…B-23, C-24…C-28, D-29…D-33)
**Date of Audit:** 2026-09-28
**Scope:** Entire repository (`vmng`): byte-level verification of `archive/raw_docs/`, cross-comparison of archived authority documents (`docs/authorities/`, `archive/raw_docs/legacy/`) against `tasks.md`, `docs/handoffs/LATEST.md`, `docs/audit/evidence-register.md`, and the actual code, tests, CI and configuration.
**Method:** MD5 checksum verification of all 12 archived files; exhaustive search of R1.2A and archive sources for every cited requirement; execution of the full verification suite (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`); line-level inspection of every remediation claimed in commit `341582d` ("fix(audit): resolve all 33 findings").

---

## 1. Executive Summary

The remediation commit `341582d` **did not fix all 33 findings** as its message claims. Detailed verification shows:

| Prior Finding | Claimed Status (LATEST.md / commit msg) | Actual Status After Verification |
|---|---|---|
| A-1 StarTimes hard-coded data | Fixed (marked provisional) | ⚠️ **PARTIALLY FIXED** — marked provisional in config, but invented values still hard-coded in web UI, tests still assert them as fact, and `dashboard.ts` still prints "RC 642819" as certain |
| A-2 Invented endpoints | Fixed (config-driven) | ⚠️ **PARTIALLY FIXED** — Azeebo+ links & playout filler now config-driven; but `vmnl.ng` verify URLs, `azeebo.plus` fallback URLs in Surface E, and default webhook endpoint hard-coded fallback remain |
| A-3 Embedded secrets | Fixed | ⚠️ **PARTIALLY FIXED** — no more embedded HMAC keys in module code, but `server.ts`/`prisma.config.ts` contain **default JWT secrets and DB credentials in code**, and `getConfig()` silently fabricates fallback secrets |
| A-4 Legacy integration | Fixed (adapters built) | ⚠️ **PARTIALLY FIXED** — `RaveBroadcastAdapter` wraps real HTTP calls but **silently fabricates health/as-run data when unreachable and returns `executed: true` even on failure**; `VmnlControlMigrationAdapter` is a pure function with **zero actual DB connectivity** |
| B-5 No database layer | Fixed (Prisma integrated) | ⚠️ **PARTIALLY FIXED** — Prisma client exists, DDL written, `db:seed` can persist 3 of 10 entity types; but **runtime modules still use in-memory Maps**, and `db:seed` **fails silently** if DB is down (`SANDBOX_DEGRADED` mode) |
| B-6 RBAC never enforced | Fixed | 🔴 **BROKEN FIX / CRITICAL** — `assertRoutePermission` exists and is called on 9 routes, but the **default sandbox path bypasses it** via `dev-sandbox-superadmin` and the `x-test-role` header is still honored from any client |
| B-7 Auth gaps | Fixed (login + revocation) | 🔴 **BROKEN FIX / CRITICAL** — Login **never verifies passwords** (`hashPassword`/`verifyPassword` are dead code); any email/password combination authenticates |
| B-8 DAM / virus scan | Fixed (SigV4 + ClamAV) | ⚠️ **PARTIALLY FIXED** — EICAR detection and pattern matching implemented, but it is a **string-content scan**, not real ClamAV; SigV4 signing is **cryptographically incorrect** (does not follow AWS canonical request rules) |
| B-10 Proof-of-Air 3-way | Fixed | ⚠️ **PARTIALLY FIXED** — true 3-way match logic exists; but the "PDF" is a **plain-text file wearing a `.pdf` magic header**, and carrier telemetry matching is a naive ±60s window |
| B-11 Broadcast billing | Fixed | ✅ **FIXED** — daypart rate cards, contract binding, invoice-ready state |
| B-12 Sponsorship engine | Fixed | ✅ **FIXED** — entitlements, fulfillment audit, shortfall tracking |
| B-13 Playout formats | Fixed | ✅ **FIXED** — SMPTE-2067, BXF, Harris CSV, Grass Valley XML serializers (note: SMPTE-2067 output is a plausible-looking but non-conformant custom XML) |
| B-14 EPG automation | Fixed (7-day rolling) | ⚠️ **PARTIALLY FIXED** — rolling generator exists, but **no scheduler/cron/automation exists**; it is a one-shot function, still no daily export job |
| B-16 MT940 parser | Fixed | ✅ **FIXED** — real `:20:`/`:61:`/`:86:` parsing and reconciliation, Paystack HMAC-SHA512 verification |
| B-18 §67 BG0–BG9 gates | Fixed | ⚠️ **PARTIALLY FIXED** — BG0–BG9 evaluator implemented correctly, but the **CLI `gates:check` hard-codes a manifest that always passes**, replicating the original B-18 defect in new clothing |
| B-20 Evidence register honesty | Fixed (Tier S2) | ✅ **FIXED** — evidence register now honestly declares Tier S2 |
| B-23 Real linting | Fixed (ESLint) | ⚠️ **PARTIALLY FIXED** — real ESLint runs, but with critical rules disabled (`no-explicit-any: off`, `no-undef: off`, `no-useless-escape: off`) |
| C-24 Mis-citations | Fixed in tasks.md | ⚠️ **PARTIALLY FIXED** — `tasks.md` cleaned, but **9 code files still cite non-existent `§283` and `§158`** |
| C-25 §67 gate model | Fixed (BG0–BG9) | ⚠️ **PARTIALLY FIXED** — old four-tier model still lives as "backward compatible" evaluator; `tasks.md` TASK-P9-04 still says "Four-Tier"; **CI still names the step "Evaluate Four-Tier Release Gates"** |
| C-26 17 broadcast roles | Fixed | ✅ **FIXED** — all 17 §48 roles present with permissions |
| C-28 ADR approvers | Fixed | ✅ **FIXED** — all 12 ADRs have EAB approver + date |
| D-29 Prisma versions | Fixed | ✅ **FIXED** — aligned at 7.10.0 |
| D-30 CORS wildcard | Fixed | ✅ **FIXED** — validated ALLOWED_ORIGINS with credentials |
| D-31 CI lockfile | Fixed | ✅ **FIXED** — strict `--frozen-lockfile` |
| D-32 `.env.example` `[TEMPLATE]` | **NOT FIXED** | 🔴 **STILL BROKEN** — the invalid `[TEMPLATE]` line was moved into the user's local `.env` file instead of being fixed in `.env.example`'s first line; `.env.example` now starts with a comment, but the **user's live `.env` retains the broken line** (dotenv silently ignores it; documented for transparency) |
| D-33 `@types/bcryptjs` | Fixed | ✅ **FIXED** — removed from lockfile |

**Never remediated at all (silent omissions from the fix commit):** **B-9, B-15, B-17, B-19, B-21, B-22, C-27** — none appear in the fix commit's change list or LATEST.md's remediation summary.

**Bottom Line:** The fix commit is **substantive but overstated**. 11 of 33 findings are fully fixed; 13 are partially fixed with real defects in the fixes themselves; **9 were not attempted**. Two of the "fixes" (B-6, B-7) introduce a **critical authentication bypass** that did not exist in exactly this form before — login appears secure in tests but accepts any credentials.

**Truthful maturity tier remains: S2 (Internal Sandbox), now with an honest register — but the auth path must be treated as non-functional for security purposes.**

---

## 2. What Was Verified as Correctly Fixed

Independently re-verified by execution and inspection:

| Item | Verification |
|---|---|
| 142/142 tests across 21 suites | ✅ Confirmed by running `pnpm test` |
| `tsc --noEmit` | ✅ 0 errors |
| `pnpm build` | ✅ Clean compile |
| `eslint .` | ✅ Passes (with weakened rules, see D-23) |
| Archive integrity | ✅ All 12 MD5 checksums re-verified byte-perfect against `archive/raw_docs/README.md` register |
| Prisma schema + DDL | ✅ `prisma/migrations/0_init/migration.sql` (566 lines) covers Phase 1 entities + Broadcast/Hub/Finance models |
| Prisma client integration | ✅ `src/core/database/index.ts` creates real `PrismaClient` with `@prisma/adapter-pg` |
| MT940 parser | ✅ `src/modules/finance/reconciliation/mt940.ts` parses real SWIFT field structure |
| BG0–BG9 evaluator | ✅ `src/modules/quality/gates.ts` implements §67 semantics incl. NOT_TESTED never = PASS |
| 17 broadcast roles | ✅ All present in `src/core/rbac/index.ts` ROLE_PERMISSIONS |
| ADR approvers | ✅ 12/12 ADRs have EAB Approver field |
| Prisma versions | ✅ Both at 7.10.0 |
| CORS | ✅ Origin-allowlist based |
| CI lockfile | ✅ `pnpm install --frozen-lockfile` |
| Evidence register honesty | ✅ Declares Tier S2, marks carriage data provisional |

---

## 3. Critical Findings (New Blockers Introduced or Unresolved)

### 🔴 CR-1. Authentication accepts any credentials (B-7 fix is defective)
`src/api/router.ts` login handler (`/api/v1/auth/login`) checks only that email and password are **non-empty**, then issues a signed JWT. It **never calls** `verifyPassword` against any stored hash. `hashPassword`/`verifyPassword` in `src/core/auth/index.ts` are **dead code** — no code path invokes them, and no user/credential store exists.

**Consequence:** Any actor who can reach the API can mint a `SuperAdmin` session (any email containing "admin") and invoke every mutating endpoint. The security tests pass only because they test the mechanism, not a real credential check.

**Required action:** Introduce a user store (Prisma `User` model already exists), hash-verify at login, and gate role assignment on stored records — never on email substrings.

### 🔴 CR-2. Sandbox SuperAdmin bypass undermines RBAC enforcement (B-6 fix is defective)
`resolveSessionUser()` (router.ts:153-161) returns a hard-coded `dev-sandbox-superadmin` with `SuperAdmin` role **whenever `NODE_ENV !== "production"` and no `x-require-auth` header is present**. Additionally, the `x-test-role` header is honored from **any unauthenticated client** regardless of environment.

**Consequence:** In every non-production deployment (staging, sandbox, local) — including CI — all mutating endpoints are wide open with SuperAdmin privileges by default. The security tests only pass because they explicitly set `X-Require-Auth: true`, a header no real client sends.

**Required action:** Remove the automatic sandbox identity; require an explicit, configured bypass flag (e.g. `AUTH_BYPASS_ENABLED=true`) that is only permitted when `NODE_ENV === "development"`; strip `x-test-role` handling outside test runtime.

### 🔴 CR-3. CLI release gate manifest is hard-coded to pass (B-18 recurrence)
`src/cli/index.ts` `gates:check` constructs a `BroadcastReleaseManifest` with every gate pre-set to `PASS` (and BG6 as `FULFILLED_BY_VERIFIED_EXISTING_SYSTEM`) and a fabricated "Human Release Owner: Broadcast Architecture Authority". It **cannot fail**. This is the identical defect class as the original B-18 finding ("hard-coded to `passed: true` with fabricated officer names"), now wearing BG0–BG9 clothing. R1.2A §67 requires the authorised human release owner to record a decision against a **fixed** evidence set — not for the pipeline to invent one.

**Required action:** Load the manifest from a versioned file (e.g. `release-manifest.json` committed with the release, or operator-supplied), and have the CLI only evaluate it.

### 🔴 CR-4. Legacy adapter fabricates operational data (A-4 fix is defective in a dangerous way)
`RaveBroadcastAdapter.getHealthStatus()`, `fetchRawAsRunLog()`, and `exportApprovedPlaylist()` **catch all network failures and return invented data** ("version 1.4.2 (Offline/Sandbox)", synthetic as-run entries, `sandbox_offline_hash`), and `triggerPlayoutOverride()` **always returns `executed: true` even when the HTTP call fails**. `VmnlControlMigrationAdapter.verifyMigrationReadiness()` returns hard-coded `43/43 = 100%` without connecting to any database.

**Consequence:** Downstream reconciliation, uptime accounting, or operational dashboards consuming these adapters will treat fabricated data as telemetry. CLAUDE.md requires evidence before claims; an adapter that invents evidence violates it structurally.

**Required action:** Return explicit `UNAVAILABLE` states; never synthesize as-run/telemetry data; make override failures propagate as failures; wire `verifyMigrationReadiness` to an actual schema introspection query.

### 🔴 CR-5. Silent failure mode in database seeding (B-5 fix is defective)
`runDatabaseSeed()` catches Prisma upsert errors and downgrades to `SANDBOX_DEGRADED` with only a `console.warn`, still returning `{ success: true }`. Combined with CI's ephemeral Postgres service, a schema mismatch would be invisible.

**Required action:** Fail loudly on persistence errors unless an explicit `--allow-sandbox-fallback` flag is passed; report `success: false` on degraded mode.

### 🔴 CR-6. DB credentials and JWT secrets still defaulted in code (A-3 residual)
- `src/api/server.ts` (lines 32-36): `DATABASE_URL` and `JWT_SECRET` have in-code default fallbacks ("vmnl-secure-jwt-secret-with-at-least-32-chars-long").
- `prisma.config.ts`: same default DB URL.
- `src/core/config/index.ts` `getConfig()`: silently fabricates fallback `DATABASE_URL`, `JWT_SECRET`, and `AZEEBO_WEBHOOK_SECRET` values when env vars are missing — bypassing the fail-fast Zod validation the module otherwise enforces.

**Consequence:** The constitutional requirement (fail-fast, no embedded secrets) is enforced only on one code path; the singleton path silently degrades security.

**Required action:** Delete all fallbacks in `getConfig()`; make `createApiServer` fail fast like `runDatabaseSeed` does.

---

## 4. Category A Residuals (Constitutional Alignment)

### ⚠️ A-1r. Invented StarTimes data is now *labeled* but still *asserted*
- `src/core/config/index.ts` exposes channel numbers as configurable defaults (428/430/432, PIDs 1042/1044/1046) with `STARTIMES_CARRIAGE_VERIFIED` defaulting to false — good.
- **But:** `src/web/public/dashboard.ts` still prints "Registered in Nigeria (RC 642819)" unconditionally as fact, ignoring the provisional config value.
- **And:** unit tests (`broadcast.test.ts:31`, `public-surfaces.test.ts:100,133`) still **assert the invented values as expected truth** (`expect(nigezie?.starTimesCarriage.dttChannelNumber).toBe(428)`). The prior audit's core objection — tests verifying invented data — remains unaddressed.

**Exhaustive archive search:** channel numbers 428/430/432, PIDs 1042/1044/1046, and "RC 642819" appear in **zero** archived authority documents. Provenance remains invented.

### ⚠️ A-2r. Invented endpoint residuals
Config-driven now: Azeebo+ links gateway, playout filler URL, AFCA base URL.
Still hard-coded with no config:
- `src/web/federation/surface-e.ts` — 9 Azeebo+ universe fallback URLs (`https://azeebo.plus/watch`, `/creators`, `/events`, …) presented as working CTAs (R1.2A §41 verified-route rule).
- `src/modules/hub/talent/index.ts:300` — `https://vmnl.ng/verify/talent/${tokenId}`.
- `src/api/router.ts:669` — default webhook target `https://api.azeebo.plus/v1/webhooks` via inline env fallback rather than validated config.
- `src/web/public/corporate.ts`, `src/api/docs.ts` — `vmnl.ng` canonical/contact URLs (cosmetic, but presented as live).

### ⚠️ A-4r. Legacy integration is adapter-shaped, not integrated
No code path invokes `RaveBroadcastAdapter` in the running API server (grep: constructed only in tests). `vmnl_control` and `vmnltalentaccelerator` "adapters" are pure data mappers with no connectivity. The CLAUDE.md mandate to *integrate functioning legacy systems* remains unmet; what exists is scaffolding.

---

## 5. Category B Residuals — Findings Never Remediated

### 🔴 B-9. Notifications & audit logging — unchanged
`dispatchNotification` (src/core/audit/index.ts) still returns a synthetic `status: "queued"` with a comment admitting delegation is unimplemented. Audit log remains an **in-memory array** (`auditLogStore`), not DB-backed, not tamper-evident. TASK-P1-05's acceptance criterion ("immutable, tamper-evident audit record") is unmet despite `[x]`.

### 🔴 B-15. 33 screens remain a catalog, not screens — unchanged
- `src/web/broadcast/` **directory does not exist** (TASK-P2-12's stated deliverable path).
- Only catalog (`/broadcast/screens`) + static detail pages (`/broadcast/screens/:id`) are implemented.
- The 33 operational routes themselves are still not built.
- R1.2A §46's own caution (the list "does not order 33 new applications or screens") remains unreflected in `tasks.md` completion claims.

### 🔴 B-17. Contract & security test suites — unchanged
No Pact/OpenAPI route-contract validation; no SQLi/XSS/CSRF/IDOR/privilege-escalation test suite exists. The new `security-auth-rbac.test.ts` covers auth mechanics and RBAC unit checks only — and, per CR-1/CR-2, tests the secure path that the default runtime bypasses.

### 🔴 B-19. Observability delivery — unchanged
Alert "triggers" remain in-memory array entries in `TelemetryService`; no PagerDuty/Slack/email delivery, no Grafana dashboards, no OTLP export code despite `OTEL_EXPORTER_OTLP_ENDPOINT` being configured.

### 🔴 B-21. Accessibility conformance — unchanged
No axe-core or Lighthouse in dependencies or CI. "Zero accessibility violations" and "100/100 Lighthouse" remain unverified claims in `tasks.md`.

### 🔴 B-22. CRM routing — unchanged
Public inquiries are captured into an in-memory array (`PublicInquiry` in `src/web/public/hub.ts`); no CRM integration, no acknowledgment dispatch.

### 🔴 C-27. Handoff / commit traceability — regressed risk
`LATEST.md` now cites commit `5c124b2 (HEAD)` — but actual HEAD is `341582d`, which is the very commit that rewrote LATEST.md. The handoff therefore **describes its own successor commit incorrectly**, the same defect class flagged in the prior audit (C-27). Additionally, commit `4184e6c` still references a `walkthrough.md` that has never existed in the repository (verified across all git history).

---

## 6. Category B Residuals — Fix-Implementation Defects

These were "addressed" but the fixes themselves carry defects (detailed in §3):

| Finding | Residual Defect |
|---|---|
| B-5 | Seeding persists only 3 of 10 entity families (channels, AFCA courses, campaigns); programmes/episodes/schedules/talent/VCF/TEND remain unseeded; silent SANDBOX_DEGRADED mode (CR-5) |
| B-6 | Sandbox SuperAdmin bypass + unauthenticated `x-test-role` (CR-2) |
| B-7 | No password verification at login; role assignment by email substring (CR-1) |
| B-8 | SigV4 implementation is **not canonical AWS SigV4** (signs a hash of the query string, not a canonical request; uses secret key directly as signing key rather than deriving `kSigning`); string-pattern "ClamAV" is not an AV engine |
| B-10 | "PDF" is plain text with a `%PDF-1.4` first line; carrier telemetry match is ±60s presence, not per-airing RF confirmation |
| B-14 | Rolling generator is a pure function; no cron/queue/scheduled job anywhere in `src/` (grep: 0 matches for scheduler/cron/setInterval) |
| B-13 | SMPTE-2067 output is custom XML in IMF vocabulary, not schema-conformant IMF Composition Playlist (acceptable as sandbox adapter, mislabeled as standard-conformant) |
| B-18 | CLI manifest hard-coded (CR-3) |
| B-23 | ESLint enabled but critical rules disabled: `no-explicit-any: off`, `no-undef: off`, `no-useless-escape: off`, `prefer-const: warn` |

---

## 7. Category C Residuals — Document Inconsistencies

### ⚠️ C-24r. Mis-citations purged from `tasks.md` but persist in code (9 files)
`R1.2A §283` and `§158` still appear in:
- `src/modules/finance/index.ts:3`
- `src/modules/finance/ledger/index.ts:3`
- `src/modules/intelligence/index.ts:3`
- `src/modules/intelligence/cr8tech/index.ts:3`
- `src/web/workspace/surface-bc.ts:74,83,110`

R1.2A has 77 sections; §283 and §158 do not exist. (Ironically, some of these files cite `§158`/`§283` while other files in the same tree now correctly cite `§14/§42/§70`.)

### ⚠️ C-25r. Invented "Four-Tier Release Gates" model still lives alongside §67 BG0–BG9
- `tasks.md` TASK-P9-04 is still titled "Four-Tier Release Gates Execution (R1.2A §67)" — a misattribution; §67 defines only BG0–BG9.
- `src/modules/quality/gates.ts` retains the legacy `evaluateRelease()` + `ReleaseManifest` interfaces as "backward compatibility" — with the four-tier semantics the governing authority does not define.
- `.github/workflows/ci.yml` final step is still named **"Evaluate Four-Tier Release Gates"** even though `gates:check` now evaluates BG0–BG9.
- The API endpoint `/api/v1/quality/gates` dispatches to *either* model depending on payload shape — institutionalizing the invented model.

### ⚠️ C-26r. Role-set mismatch inside RBAC
`EnterpriseRole` now lists 10 enterprise + 17 broadcast roles = **27 roles**, and ROLE_PERMISSIONS defines all 27. However, the login endpoint can only ever assign one of 7 roles (by email substring), and the screens catalog still advertises "6 filter roles". Three different role vocabularies coexist.

### 🔴 C-27r. See §5 above (stale commit reference is a live defect, not historical).

---

## 8. Category D Residuals

| # | Status | Detail |
|---|---|---|
| D-29 | ✅ Fixed | Prisma CLI and client both 7.10.0 |
| D-30 | ✅ Fixed | Origin-allowlist CORS with credentials |
| D-31 | ✅ Fixed | Strict `--frozen-lockfile` in CI |
| D-32 | ⚠️ Ambiguous | `.env.example` now begins with a proper comment (fixed); however the **local `.env` still begins with the invalid literal `[TEMPLATE]` line** and carries placeholder secrets (`minioadmin`/`minioadmin`, sample JWT secret). Not tracked by git (correct), but it is the *active* config for local runs. `dotenv` silently ignores the `[TEMPLATE]` line; the placeholder secrets are the real exposure. |
| D-33 | ✅ Fixed | `@types/bcryptjs` removed from lockfile |

### New minor issues
| # | Issue |
|---|---|
| N-1 | `eslint.config.js` disables `@typescript-eslint/no-explicit-any` repo-wide; combined with `any`-typed request bodies in the router, this removes the main static guard on the API boundary. |
| N-2 | `.env.example` and the working `.env` contain identical placeholder secrets (`JWT_SECRET=super-secret-vmnl-token-change-in-production-min-32-chars`, `AZEEBO_WEBHOOK_SECRET=azeebo_hmac_webhook_secret_key_32chars`). Since `getConfig()` falls back silently (CR-6), these placeholders can silently become the production signing keys. |
| N-3 | `tests/unit/broadcast-advances.test.ts:149` asserts `servicePid: 1042` as carrier telemetry truth (A-1 residue in tests). |
| N-4 | `prisma/migrations/0_init/migration.sql` exists, but no CI step applies migrations to the CI Postgres service before `pnpm test` — the test suite never exercises persistence (consistent with B-5's in-memory reality). |
| N-5 | `docs/audit/evidence-register.md` EVD-03 cites "10 enterprise roles + 17 R1.2A §48 broadcast roles" — §48 says "Potential capability roles include:" and enumerates exactly 17; the RBAC engine defines 27 total (10 generic + 17 broadcast). The register under-describes the implemented role set while `tasks.md` TASK-P1-03 still promises only the 10 generic roles. |

---

## 9. Archive-vs-Project Cross-Reference (Round 2 Confirmation)

| Archive Document Claim | Project Status Claim | Verification |
|---|---|---|
| 3 channels (Nigezie Xtreme, Orisun, Isi Mbido) via StarTimes | Implemented in channel registry + seeds | ✅ Consistent (values provisional — correctly flagged) |
| 8 Azeebo+ consumer universes (Vertical, Movies & Series, Lifestyle, Comedy, Creator, Reality, Games, Sports) | 8 universes + broadcast bridge in Surface E | ✅ Consistent |
| 7-way financial separation (GMV, contract value, invoiced, recognized, cash, talent payable, partner split) | Ledger + legacy migration adapter + MT940 tests | ✅ Consistent in code |
| 33 broadcast screen surfaces | Catalog + detail views only; no per-screen routes | ❌ Overstated in `tasks.md` (B-15) |
| 20 broadcast UAT failure drills | 20/20 tests pass | ✅ Confirmed |
| Evidence ladder S1–S5 | Now honestly declared Tier S2 | ✅ Fixed (B-20) |
| §67 BG0–BG9 gate model | Evaluator implemented; CLI hard-codes a passing manifest | ⚠️ Partially (CR-3) |
| §48 17 broadcast capability roles | Implemented with permissions | ✅ Fixed (C-26) |
| WCAG 2.2 AA target | No automated accessibility testing exists | ❌ Unverified (B-21) |
| Legacy system integration mandate | Adapter scaffolding only; not wired into runtime | ❌ Unmet (A-4r/CR-4) |

---

## 10. Bottom Line

**Verified:** the archive remains byte-perfect; the test/typecheck/lint/build pipeline is genuinely green; the BG0–BG9 evaluator, MT940 parser, billing, sponsorship, export serializers, 17-role RBAC matrix, ADR formality, and evidence-register honesty are real improvements — credit where due.

**Not verified / materially overstated:** the commit message "resolve all 33 findings" is not supported by evidence. 11 of 33 are fully fixed. 13 are partially fixed — several with **defects more dangerous than the original findings** (auth that accepts any password, RBAC bypassed by default, telemetry fabrication, gates that cannot fail). 9 were silently never attempted.

**Security posture:** until CR-1 and CR-2 are closed, the API's authorization layer should be treated as **absent**, regardless of what the passing security tests suggest — the tests exercise the one code path that requires authentication, while the default runtime path grants SuperAdmin to everyone.

**Truthful maturity tier:** **S2 (Internal Sandbox)** — unchanged from the honest register's declaration. No basis yet for S3: staging requires working auth, real persistence exercised in CI, and an adapter that reports failure rather than fabricating success.

---

## 11. Recommended Remediation Order (Round 2)

1. **CR-1 / CR-2 (auth bypass, highest severity):** Verify credentials at login against a real user store; remove automatic sandbox SuperAdmin and unauthenticated `x-test-role` outside test runs. This is the smallest change with the largest security impact.
2. **CR-3 / CR-4 / CR-5 (honest machinery):** Load gate manifests from committed files; make the legacy adapter return explicit failure states; make seeding fail loudly on persistence errors.
3. **CR-6 / N-2 (secrets):** Delete silent fallbacks in `getConfig()` and `createApiServer`; rotate the placeholder secrets; align `.env` with `.env.example`.
4. **C-24r / C-25r / C-27r (documentation truth):** Correct the 9 files citing non-existent §283/§158; retire the four-tier model from `tasks.md`, CI naming, and the compat API; refresh `LATEST.md` commit references.
5. **B-5 completion:** Seed all 10 entity families; add a CI step that applies migrations and exercises persistence.
6. **A-1r completion:** Stop asserting invented StarTimes values in tests; render RC number from the provisional config value.
7. **Then** the never-attempted findings (B-9, B-15, B-17, B-19, B-21, B-22) against BG0–BG9 applicability rules, rather than blanket `[x]`.

---

*This report was produced by static inspection, code search, MD5 checksum verification, and execution of the project's own verification suite (142 tests, typecheck, lint, build). No production systems, databases, or external endpoints were contacted. All line references verified against working tree at HEAD `341582d`.*
