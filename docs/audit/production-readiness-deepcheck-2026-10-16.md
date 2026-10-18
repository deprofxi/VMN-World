# VMNL Production-Readiness Deep Check — Findings & Remediation Plan

**Document:** `VMNL-AZP-VMN-PRR-001 — R1.0`
**Governing Authorities:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` · `VMNL-AZP-VMN-CCPP-001 — R1.1` ·
`VMNL-AZP-VMN-EXEC-001` · `CLAUDE.md`
**Audit reference:** `VMNL-REPO-DEEPCHECK-005` (deep doc-vs-code check, enterprise/production lens)
**Date measured:** 2026-10-16
**Tree measured:** `37d0007` (branch `main`) + a working tree whose only difference from `HEAD` is
that `audit.md`, `report.md` and `tasks.md` are **deleted** (`git status` → `D audit.md`,
`D report.md`, `D tasks.md`; nothing else)
**Relationship to existing registers:** this document **adds** findings. It does not supersede
`tasks.md` (`VMNL-AZP-VMN-TODO-002`, the live remediation register), `report.md`
(`VMNL-REPO-COMPLETION-AUDIT-001`), `audit.md` (`VMNL-REPO-AUDIT-DEEPCHECK-004`),
`docs/design-debt-register.md`, or `docs/audit/journey-readiness-matrix.md`. Every `PR-nn` here is
either a finding those registers do not carry, or a **measured contradiction** of one of their
claims. Where an existing open item already covers the issue, the row cites it rather than
re-registering it — and the *new* part is the measurement that shows it is still live.

---

## 0. Method

Everything below was executed in this checkout on 2026-10-16. No figure is copied from another
document. Commands are in §7 and every claim quotes its own observed output. Where a claim could be
checked only by reading code, the row says so.

Three rules were applied to keep this audit honest rather than merely alarming:

1. **A finding must be reproduced, not inferred.** The Redis-TLS, storage-readiness, config-coercion
   and metrics-switch findings were each reproduced against the compiled artifact over the real
   interface, not argued from source alone.
2. **Suspicions that failed to reproduce are recorded as withdrawn** (§4), so the next session does
   not burn budget re-deriving them.
3. **Severity is about consequence, not taste.** P0 = a production or release claim that cannot
   defensibly be made today. P1 = a real production-readiness gap. P2 = hardening/hygiene.

---

## 1. Measured baseline (2026-10-16, this tree)

| Command | Result | Exit |
|:---|:---|:---:|
| `pnpm typecheck` | 0 errors | **0** |
| `pnpm lint` (`eslint . --max-warnings 0`) | 0 problems | **0** |
| `pnpm run audit:check` | 0 advisories; 6 historical records registered | **0** |
| `pnpm run audit:threshold` | critical 0, high 0, moderate 0, low 0 | **0** |
| `pnpm run any:budget` | explicit-any 137 (budget 138) | **0** |
| `pnpm run build` | compiled | **0** |
| `node dist/src/cli/index.js gates:check` | `GO_WITH_CONDITIONS`, BG6 `CONDITION/UNTESTED` | **0** |
| `pnpm test` | **5 files failed / 76 passed (81) · 4 tests failed / 866 passed (870)** | **1** |

`pnpm exec prisma migrate deploy` was **not** re-run as a clean-instance check in this pass; the
2026-10-15 pin (`docs/audit/evidence/tsk09-commit-series-2026-10-15/`) records 13 migrations / 44
tables from an empty database and is cited, not re-claimed, here.

**Postgres** was reachable on `localhost:5432`; Vitest provisioned its own
`vmnl_enterprise_test`. **Docker was not available** (`docker info` → exit 127), so the container
image, Trivy, and the compose stack remain unexecuted on this host — the same limitation
`tasks.md` TSK-57 records. **No git remote is configured** (`git remote -v` prints nothing), so no
GitHub Actions run has ever seen this code.

### 1.1 The suite is red on this working tree — and the cause is a deletion

```
FAIL  tests/unit/durability-drill-coverage.test.ts
FAIL  tests/unit/register-inheritance.test.ts
FAIL  tests/unit/a11y-claim-hygiene.test.ts  > keeps the browser-run claim at unproven …
FAIL  tests/unit/a11y-claim-hygiene.test.ts  > does not claim axe-core or a Playwright config …
FAIL  tests/unit/canonical-model.test.ts     > keeps the register rows the documents point at real
FAIL  tests/unit/citation-integrity.test.ts  > keeps every annotation earning its place

Error: ENOENT: no such file or directory, open '/Users/deprof/www/vmng/tasks.md'
AssertionError: the register must carry the annotations this test exempts: expected 3 to be greater than 4
 Test Files  5 failed | 76 passed (81)
      Tests  4 failed | 866 passed (870)
```

Two of the five fail while **loading** — `durability-drill-coverage.test.ts` and
`register-inheritance.test.ts` parse `tasks.md` as data at module scope, so their tests are never
collected. That reconciles the arithmetic with the last recorded pin: **870 collected + 16
(9 + 7 tests in those two files) = 886**, which is exactly the figure
`docs/audit/evidence/ci-sequence-2026-10-16/README.md` records. The tree is green **iff** `tasks.md`
exists; on this working tree it does not. This is `report.md` CA-06 recurring — *"the task registers
the project is managed from have been deleted"* — with the register now not merely stale but
**absent**, and the deletions are uncommitted, so a clone of `37d0007` is green while this checkout
is not.

**This is the single most consequential finding in this document**, because it means:
- every "all gates exit 0" claim in `docs/handoffs/LATEST.md`, `docs/audit/evidence-register.md` and
  `tasks.md §1.2` describes a tree that is not the tree on disk;
- seven CI-enforced instruments cannot run, so the doc-pin and census guards are dark;
- `tasks.md §0.1` closure protocol ("`pnpm test` exits 0 on the same commit") is unsatisfiable.

**Fix (one line, reversible):** `git restore audit.md report.md tasks.md` — or, if the deletion was
intentional, re-home each register into `docs/` **and** update the six instruments that read them
(`tests/unit/{durability-drill-coverage,register-inheritance,a11y-claim-hygiene,canonical-model,citation-integrity}.test.ts`)
in the same change. Deleting without re-homing is not a valid option under `tasks.md §0` while
those instruments read the paths.

---

## 2. Findings register

Legend — **Sev**: P0 blocks a defensible release claim · P1 is a real production-readiness gap ·
P2 is hardening/hygiene. **Repro**: `✓` reproduced against the compiled artifact or a live server in
this pass; `code` established by reading source; `doc` cross-checked in the registers.

### Track A — Verification & release integrity

| ID | Sev | Finding | Evidence (reproduced this pass) | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-01** | **P0** | **The working tree fails its own test suite**: `tasks.md` / `audit.md` / `report.md` are deleted, and six CI-enforced instruments read them. | ✓ `pnpm test` → `5 failed / 4 tests failed`; `ENOENT … open '…/tasks.md'` (§1.1) | Restore the three files, or re-home them **and** update the instruments in the same commit. Then re-run `pnpm test` to exit 0. Cross-ref: `report.md` CA-06, `tasks.md §1.2`. |
| **PR-02** | **P0** | **No git remote** → the pipeline has never run, there is no off-machine copy, and no PR review has occurred. Human contributors: 1. | ✓ `git remote -v` → empty. `tasks.md §1.2` and `docs/handoffs/LATEST.md` both concede "a CI-equivalent local green is still not a CI-verified green". | Owner decision: add the remote and push. Required fields: branch protection on `main`, required status check on `verify-and-test`, `GITHUB_TOKEN` scopes for gitleaks. Then TSK-57's second box closes on a real Actions run, not a local rehearsal. |
| **PR-03** | **P0** | **`gates:check` cannot fail on manifest/HEAD divergence, and `--allow-sha-drift` is dead code.** The manifest is pinned to `ca303f0` while `HEAD` is `37d0007`, and the gate still answers "RELEASE CLEARED". | ✓ `gates:check` output: `Notice: Manifest SHA (ca303f0) diverges from current HEAD (37d0007)` → then `GO_WITH_CONDITIONS`, **exit 0**. Code: the divergence branch only `console.warn`s, and `allowDrift` is computed then never used to fail (`src/cli/index.ts:77-95` — computed at `:77`, warns at `:88`, no failing branch). | Make divergence a hard failure unless `--allow-sha-drift` is explicitly passed; re-pin the manifest SHA to a commit that exists and carries the work. Cross-ref: HD-01, TSK-37, `tasks.md §8` ("no `--allow-sha-drift` once pinned"). |
| **PR-04** | **P0** | **The BG0–BG9 release gate is self-attestation.** `evaluateBroadcastRelease` consumes only the manifest's own `status` strings. `evidenceRef` is never resolved, `evaluatedAt` is never freshness-checked (`2026-09-28` on every gate), and the only independent control is `validateReleaseOwner`. | ✓ `gates:check` → all gates pass because `release-manifest.json` says `"status": "PASS"`. Code: `src/modules/quality/gates.ts:129-208` reads `gate.status` and nothing else (`:151-175`); the cited `evidenceRef` files are never opened. | Resolve each `evidenceRef` and assert the path exists **and** the named test ran in this build; fail on `evaluatedAt` older than a policy window; require the owner's SHA signature to bind to the built artifact digest. The honest alternative, if the register prefers it: relabel `gates:check` as a *manifest linter*, not a release gate. |

### Track B — Data & persistence

| ID | Sev | Finding | Evidence | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-05** | **P1** | **Most business state still has no durable copy.** `docs/audit/journey-readiness-matrix.md` §3.3 counts **30** `sandbox-state` families covering **147** of 226 documented IDs; the schedule day, broadcast versions, billing rate cards, traffic inventory, playout cache, proof-of-air registry, POA exceptions, rights review queue, routing rules, payout batches, bank reconciliation, feature-flag overrides, AOS runs and queue jobs all die with the process. | ✓ `grep -rc "= new Map\|= new Set\|= {};" src` → **158** module-level store sites; journey matrix §3.3 enumerated family-by-family; `docs/domain/systems-of-record.md` §3.1 lists only **15** durable stores. | This is a programme, not a task: extend the TSK-17 durable-journal + boot-hydration pattern family by family, highest-consequence first — **schedule day + broadcast versions** (a restart currently returns a reviewed, approved schedule to the demo seed), then **billing/traffic/playout** (money and air), then the rest. Each family needs its own restart drill, per `tests/unit/durability-drill-coverage.test.ts`. |
| **PR-06** | P1 | **The licence/payout tables exist but nothing reads or writes them.** `TalentPayoutBatch` and `BankStatementRecord` have no accessor anywhere in `src/`, so a project that pays out is not a project whose payout is recorded. | `code` — journey matrix Finance row states it; `grep -rn "talentPayoutBatch" src` → 0 accessors | Wire the engines to the tables they already have, or delete the tables. Leaving a durable table unreachable while the served projection is a `Map` is the most expensive of both worlds. |

### Track C — Security & privacy

| ID | Sev | Finding | Evidence (reproduced) | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-07** | **P0** | **`rediss://` is silently downgraded to plaintext.** `createMinimalRespRedisClient` never inspects `url.protocol` and always uses `net.connect`, so a TLS Redis URL transmits the Redis password, session ids, lockout counters and MFA challenge claims in cleartext over the wire. | ✓ Captured on a plain TCP listener: calling `createMinimalRespRedisClient("rediss://:secretpw@127.0.0.1:<port>")` sent `*2\r\n$4\r\nAUTH\r\n$8\r\nsecretpw\r\n*1\r\n$4\r\nPING\r\n` — no TLS handshake at all. Code: `src/api/server.ts:440-556`, the `net.connect` at `:442-445`; `url.protocol` is never read. | `tls.connect()` when `protocol === "rediss:"`, and **refuse to start** on an unrecognised scheme rather than presuming plaintext. Add a regression test that asserts no plaintext `AUTH` leaves a socket for a `rediss://` URL. This blocks any managed-Redis deployment (ElastiCache in-transit encryption, Upstash, Redis Cloud). |
| **PR-08** | **P1** | **`/readyz` cannot detect dead object storage**, so the readiness gate that exists to keep a pod out of rotation is inert. | ✓ `checkStorageReady()` with `STORAGE_ENDPOINT=http://127.0.0.1:1` (dead port) → `{"ready":true,"status":"ready","driver":"minio","endpoint":"http://127.0.0.1:1"}`. Code: `src/core/storage/index.ts:249-264` parses the URL and returns `ready`; it never opens a connection. `/readyz` reports `"storage":"ready"` with `"storageGating":"enforced"` on the live server. | Probe the bucket (authenticated `HEAD`/`listObjectsV2` with a short timeout and cached TTL) and return `unavailable` on failure. Keep `STORAGE_READINESS_GATING=false` as the explicit opt-out — but it must mean "do not gate", not "always pass". |
| **PR-09** | P1 | **The tenant predicate in the central authorization helper is unreachable, and the throwing variant is dead code.** All four `canPerform` call sites omit the fourth `context` argument, so the tenant branch never runs; isolation is per-handler only. `assertPermission` has **zero** call sites in `src/`. | ✓ `grep -rn "canPerform(" src` → `router.ts:769`, `router.ts:8093`, `enquiry.routes.ts:25`, `:49` — all three-argument. `grep -rn "assertPermission" src` → only its own definition. Code: `src/core/rbac/index.ts:521-578`. | Pass a real `AccessContext` (tenant, and any ABAC attributes) from a single request-scoped resolver so the predicate runs by construction, or delete the parameter and state plainly that isolation is handler-level. Leaving a dead tenant check is worse than having none: it reads as a control. Cross-ref: TSK-58 boxes 1 & 3 (open). |
| **PR-10** | P1 | **Rate limiting multiplies per instance.** `rateLimitStore` is a per-process `Map` **by design, even when a KV adapter is bound**, so N instances give an attacker N× the budget, and public unauthenticated intake has no shared budget at all. | `code` — `src/core/auth/index.ts:223`; `docs/domain/systems-of-record.md:166` states the design; `docs/audit/journey-readiness-matrix.md` J-RL1-02 records the `M` label. | Implement atomic `INCR`+`EXPIRE` (or a sliding window) in the KV adapter and make the limiter adapter-first, fail-closed. Cross-ref: AUD-14. |
| **PR-11** | P1 | **PII sealing covers two columns.** `Person.nationalId` and `User.mfaSecret` are envelope-constrained in Postgres, but `Person.phone`, `CommercialEnquiry.phone` and audit-payload free text are stored in the clear, and there is no key-rotation procedure — one un-rotated `PII_ENCRYPTION_KEY` with a `v1` marker. | `doc` — `tasks.md` TSK-30 closure note; `docs/security/threat-model.md` §C10 | Extend the sealed-envelope constraint to every direct identifier before any real personal data is loaded, and close HD-05 (key-management ownership) with a rotation runbook. Under canonical law 12 this is a precondition for production personal data, not a hardening item. |
| **PR-12** | P2 | **299 bare interpolations into markup on lines that do not call `escapeHtml(`**, across 32 files; the ceiling is ratchet-pinned but the sites are untriaged. | `doc` — `docs/design-debt-register.md` DEBT-009 (measured 2026-10-14 by TSK-42) | First burn-down step is triage, not rewriting: classify which of the 299 carry externally-sourced strings, fix those, and drop the ratchet. |

### Track D — Configuration & runtime

| ID | Sev | Finding | Evidence (reproduced) | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-13** | **P1** | **`z.coerce.boolean()` maps every non-empty string to `true` — including `"false"`.** Both boolean fields in the config schema are affected, so an operator who writes `…=false` gets `true`. | ✓ `"true"→true, "false"→true, "0"→true, "1"→true, ""→false, "no"→true, "FALSE"→true`. ✓ Through the real loader: `loadConfig()` with `PROMETHEUS_METRICS_ENABLED="false"` → `true`; `STARTIMES_CARRIAGE_VERIFIED="false"` → `true`. Code: `src/core/config/index.ts:71`, `:86`. | Replace with `z.enum(["true","false"]).default("false").transform((v) => v === "true")` (or a `booleanish` helper) so an invalid value fails boot instead of silently reading as the opposite. This is a fail-open coercion on a security-adjacent surface and should land with a config test per field. |
| **PR-14** | **P1** | **Two shipped switches are dead.** `PROMETHEUS_METRICS_ENABLED` has no consumer, so `/metrics` is served regardless; `STARTIMES_CARRIAGE_VERIFIED` has no consumer either, so the control that CLAUDE.md's broadcast law leans on to avoid publishing unverified carriage facts gates nothing. | ✓ Live server booted with `PROMETHEUS_METRICS_ENABLED=false` → `GET /metrics` → **200**, 756 B body. ✓ `grep -rn "CARRIAGE_VERIFIED\|METRICS_ENABLED" src` → only the two schema declarations and one comment. | Either honour both switches (gate the `/metrics` route; gate every carriage rendering) or delete them. A dead switch in `.env.example` and `docker-compose.yml` is a false assurance. |
| **PR-15** | **P1** | **27 of the 37 environment variables read from `process.env` bypass the Zod schema entirely**, and 12 are not documented in `.env.example` at all — including `METRICS_TOKEN`, `KV_READINESS_GATING`, `ALERT_WEBHOOK_URL`, `OTEL_ALLOWED_HOSTS`, `SES_REGION`, `CDN_BASE_URL`. | ✓ `process.env.X` census in `src/` = 37 names; schema = 44 keys; `comm -23` → 27 used-but-unvalidated, 12 used-but-undocumented (§7) | Move every security-bearing variable into the schema so `loadConfig()` fails fast on typos and malformed values; document the 12 in `.env.example`. `TRUST_PROXY_HEADERS`/`TRUSTED_PROXY_HOPS` deserve particular care — a mistyped proxy contract silently changes client-IP trust for rate limiting and audit. |
| **PR-16** | P1 | **No unhandled-rejection or uncaught-exception handling, and shutdown has no deadline.** The entry point registers only `SIGTERM`/`SIGINT` and awaits `app.stop()` before `process.exit(0)`, so a stuck drain holds the process until the orchestrator `SIGKILL`s it, and a stray rejection in any non-boot path terminates with default Node semantics and no structured line. | `code` — `src/index.ts:52-60`: only the two signal handlers (`:59-60`); `process.exit(0)` unconditional after `await app.stop()` (`:54`) with no timeout race. | Add `process.on("unhandledRejection"/"uncaughtException")` that emits a structured ERROR and exits non-zero deterministically; race `app.stop()` against a shutdown deadline (e.g. 10 s, below the container's grace period) and exit non-zero on timeout so the failure is visible. |
| **PR-17** | P2 | **Structured logging is bypassed in the paths that matter.** 71 `console.*` calls remain in `src/` — 4 in the boot entry point, 12 in `src/db/`, 3 in `websecurity`, 2 in `repository-mode`, 2 in `audit`. AUD-16 fixed `logStructured` itself; the callers were never converted. | ✓ `grep -rn "console\.\(log\|warn\|error\|info\)" src` → 71 across 12 files | Convert non-CLI call sites to `logStructured` so bootstrap degradation, repository warnings and audit failures reach the JSON log drain the alert rules read. `src/cli/index.ts` (40 hits) is legitimately console output and can stay. |
| **PR-18** | P2 | **No database request deadline.** The pg pool sets `connectionTimeoutMillis: 3000` but no `statement_timeout` or `query_timeout`, and there is no application-level request deadline, so a lock or pathological query can pin a request and its connection indefinitely. | `code` — `src/core/database/index.ts:40-45` (`connectionTimeoutMillis: 3000` at `:44`; no `statement_timeout`/`query_timeout`) | Set `statement_timeout` (and a pool `query_timeout`) from configuration, and add a bounded request deadline at the router choke point that answers 504 rather than hanging. |

### Track E — Deployment & operations

| ID | Sev | Finding | Evidence | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-19** | **P1** | **The container image cannot be trusted to run as built.** The Dockerfile never runs `prisma generate`, and the runtime stage installs **prod-only**, so the `prisma` CLI (a devDependency) is absent; no migration step runs; `COPY package.json pnpm-lock.yaml*` uses a glob, so a missing lockfile degrades silently; and the `HEALTHCHECK` probes `/healthz` (liveness) rather than `/readyz`. | `code` — `Dockerfile:12,30,39,45`; only reproducible on a Docker host (`docker info` → 127 here) | Add an explicit `pnpm exec prisma generate` build step, decide and document where migrations run (release job, not the app image), replace the `pnpm-lock.yaml*` glob with a hard `COPY pnpm-lock.yaml`, and point `HEALTHCHECK` at `/readyz`. Then actually build the image — this is the one row this host could not verify. |
| **PR-20** | P1 | **Container and compose are not hardened.** No `cap_drop`, `no-new-privileges`, read-only root filesystem, or CPU/memory limits anywhere; and MinIO credentials ship as *literal fallbacks* (`${STORAGE_SECRET_KEY:-minioadmin_secure_key}`) while JWT/webhook/Redis are `:?`-required — so the "no default secrets" contract is inconsistent inside one file. | `code` — `docker-compose.yml:33-35,45,110-118` | Apply the deployed hardening baseline to every service (`cap_drop: [ALL]`, `security_opt: ["no-new-privileges:true"]`, `read_only` + tmpfs where possible, `deploy.resources.limits`), and make the MinIO credentials `:?`-required like its neighbours so the sandbox values are a documented override rather than a silent default. |
| **PR-21** | P1 | **Alerting exists only as documentation.** `prometheus.yml` declares no `rule_files` and there is no Alertmanager, so the rules in `docs/runbooks/observability.md` §2 are never evaluated; the same file labels the sandbox stack `environment: "production"`. | `code` — `prometheus.yml` (scrape config only, 15 lines); rules live in the runbook as a YAML snippet | Ship the rules as a real `prometheus.rules.yml` mounted with `rule_files` (plus Alertmanager or an equivalent receiver), fix the label, and assert in CI that the documented rule names exist in the shipped file. |
| **PR-22** | P2 | **Supply chain: no SBOM, no image signing or provenance, no dependency automation, and Trivy runs with `ignore-unfixed: true`** — which silently permits unfixable CRITICAL/HIGH findings rather than recording them as accepted risk. | `code` — `.github/workflows/ci.yml` (Trivy step), `.trivyignore` ("No suppressions active"), no `dependabot.yml`/`renovate.json` | Generate an SBOM per release, sign/publish provenance for the image, add Dependabot (or Renovate) for the pnpm workspace, and either drop `ignore-unfixed` or record each unfixable finding with an owner and expiry in `.trivyignore`. |
| **PR-23** | P2 | **No runtime version pin.** No `engines` field, no `.nvmrc`/`.node-version`, while local is `v22.23.2`, CI is `node-version: 22`, and the image is `node:22-alpine`. `packageManager` is pinned, so pnpm is fine; Node is not. | `code` — `package.json` (no `engines`), repo root (no `.nvmrc`) | Add `engines.node` and a `.nvmrc`, and make CI read it so local, CI and image agree. |
| **PR-24** | P2 | **Repository governance files are absent**: no `SECURITY.md` (vulnerability-disclosure route), `CODEOWNERS` (review routing), `LICENSE` (package is `UNLICENSED` with no notice), `CONTRIBUTING.md`, or `CHANGELOG.md`. With a single human contributor, `CODEOWNERS` and `SECURITY.md` are the two that carry operational weight. | `code` — repo root listing | Add `SECURITY.md` (who to contact, SLA, scope) and `CODEOWNERS` at minimum; add a proprietary `LICENSE` notice to match `"license": "UNLICENSED"`. |
| **PR-25** | P2 | **Backup/DR remains TARGET, not proven.** Compose provides a 02:00 WAT `pg_dump` job with 14-day retention; WAL archiving (true PITR) is unstarted, and the only restore evidence is a single 2026-10-01 manual drill (restore 0.132 s, 26/26 table parity). | `doc` — `docker-compose.yml:139-176`, `docs/runbooks/disaster-recovery.md`, `docs/audit/backup-restore-drill.md` | Enable WAL archiving and rehearse a point-in-time recovery to a named timestamp; schedule the drill quarterly with a recorded RPO/RTO actual. |

### Track F — Quality, accessibility & compliance

| ID | Sev | Finding | Evidence | Required fix |
|:---|:---:|:---|:---|:---|
| **PR-26** | P1 | **WCAG 2.2 AA (canonical law 19) rests entirely on HTML-string assertions.** `@playwright/test` and `@axe-core/playwright` are installed as devDependencies and both binaries are present in `node_modules/.bin`, but the repository contains **zero** `*.spec.ts` files and **no** `playwright.config.*`; `pnpm test:a11y` runs Vitest over string matching. No browser has run in this suite's history. | ✓ `find . -name "*.spec.ts"` → 0; `find . -name "playwright.config*"` → 0; `ls node_modules/.bin \| grep -i play` → `playwright`, `playwright-core` | The register already frames this as HD-10 ("ratify-or-remove"). The measurement makes the decision cheap: either write the real suite (axe + keyboard path + focus restoration + the six viewports) and let the claim follow, or remove the two packages and downgrade the a11y statement to "automated token/shape checks only". Today the repo pays the install cost and makes the claim without the evidence. |
| **PR-27** | P2 | **Type-safety and coverage ratchets are at their ceiling and never move.** `explicit-any` sits at **137 of a 138 budget** and has not been reduced since it was recorded on 2026-10-06 (the script's own comment says "only ever decrease"); `@typescript-eslint/no-explicit-any` is `off`; coverage floors are lines 72 / branches **62** / functions 77 / statements 73; `src/api/router.ts` is **8,245 lines** and holds routing, auth, rendering and domain dispatch. | ✓ `any:budget` → `137 (budget 138)`; ✓ `wc -l src/api/router.ts` → `8245`; `code` — `vitest.config.ts:24-29`, `eslint.config.js:21` | Ratchet the `any` budget down in fixed increments per sprint (the infrastructure already exists), raise the branch floor now that `test:coverage` is a gate, and continue extracting domain routers behind the existing `RouteDefinition` pattern. Cross-ref: AUD-12/AUD-18, TSK-45/54/55/56. |
| **PR-28** | P2 | **Design-debt expiry wave.** Several entries expire within weeks and several are recorded misses: DEBT-004 expires **2026-10-31** on `[PROVISIONAL COMPLIANCE DD-4]` with the DPO's written confirmation outstanding; DEBT-001 (11-30), DEBT-005 (11-15), DEBT-006 (12-01); DEBT-008 misses the per-view budget over identity encoding (250,409 B vs 120 KB) and DEBT-010 misses the seeded-data channel shell (72,026 B vs 25 KB). The register's own §2.2 makes **expired debt block BG gate clearance**. | `doc` — `docs/design-debt-register.md`; `docs/audit/performance-budgets.md` §"Measured 2026-10-14 / 2026-10-16" | Put the four near-expiry items in front of their named owners before their dates, and note that DEBT-004 is a **privacy** dependency (NDPR/NDPA 2023 consent copy) — under canonical law 12 it belongs with PR-11, not with visual debt. |
| **PR-29** | P2 | **The CCPP §3 documentation structure is only partly realised.** `docs/architecture/` contains a single `descoped-modules.json`; `docs/api`, `docs/broadcast`, `docs/azeebo`, `docs/privacy`, `docs/testing`, `docs/migrations`, `docs/operations` do not exist. The register records this as an approved adaptation, but the substantive relationships CCPP §3 asks for are now spread across `docs/domain/`, `docs/security/` and `docs/runbooks/` without a navigation root. | `code` — `ls docs/` | Add a short index document at the top of `docs/` that maps the CCPP §3 sections to the directories that actually carry them, so the adaptation is navigable rather than implicit. Low cost, and it is what an external reviewer asks for first. |

---

## 3. What is verified good — preserve, do not rebuild

Measured this pass, or confirmed by reading the code. Recorded so remediation does not re-litigate
working foundations.

- **Security headers are complete and correctly scoped.** Live `GET /` returns
  `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; …`
  plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and prod-only HSTS.
  Only `style-src 'unsafe-inline'` is debt (AUD-20).
- **Route authorization is genuinely centralised and instrument-guarded.** 75 `ROUTE_GUARDS` over
  104 mutating `/api/` dispatch sites, with a parity scan that reads `src/api/router.ts` as data and
  fails if a mutating route is unguarded, if a guard is dead, or if a documented exemption rots.
- **The audit ledger is durable and transactional, and I confirmed it rather than assuming it.** On a
  live DB-connected instance `/readyz` initially read `auditPersistence: "memory"`, `sequence: 0`; a
  single audited write (a failed login) flipped it to `"prisma"`, `sequence: 1`, with
  `durableJournalPersisted` advancing 252 → 253 and `durableJournalFailed: 0`. The initial reading
  means "no audit writes yet", **not** a durability defect. TSK-18's claim holds.
- **Configuration validation in production is strict where it is applied** — placeholder `JWT_SECRET`,
  `minioadmin` storage credentials, a short or placeholder HMAC secret, a `SESSION_SECRET` equal to
  `JWT_SECRET`, and `WEBHOOK_SIGNATURE_BYPASS_ALLOWED=true` all refuse boot in production/staging.
  PR-15 is about the 27 variables *outside* that schema, not about this schema being weak.
- **The fail-closed posture is real.** `repository-mode` defaults to `fail_closed`; boot refuses
  `ALLOW_SANDBOX_FALLBACK=true` and a memory KV backend in production/staging (with a named escape
  hatch for deliberate single-instance deployments); a rejected durable write answers
  503 `REPOSITORY_UNAVAILABLE` rather than a 201 that attests nothing.
- **Webhook dedup is durable and two-phase** (`ProviderEventClaim` with `@@unique([provider, eventId])`),
  so a provider retry is taken over only when the first attempt never reached the engine.
- **Honest state labelling is exemplary.** The journey matrix distinguishes `D2` / `D1` /
  `sandbox-state (family)` and refuses the word "in-memory" without a family id; three independent
  inventories of the same fact must agree or CI fails. This is the discipline that made this audit
  cheap to write — the gaps were already inventoried, they were simply not all closed.
- **Dependency advisories are clean** (0 critical/high/moderate/low) and every override in
  `pnpm.overrides` resolves to a **published** version — verified against the registry for
  `lodash@4.18.1`, `deepmerge-ts@8.0.2`, `mysql2@3.24.5`, `source-map-js@1.2.2`. There are no phantom
  pins (§4).
- **Secrets hygiene is clean**: `.env` is untracked and gitignored, `.env.example` ships no live
  values, gitleaks is SHA-pinned in CI, and the doc-guard suite fails if either changes.

---

## 4. Examined and withdrawn — do not re-derive

Investigated this pass and **not** substantiated. Recorded so the next session does not spend budget
on them.

| Suspicion | Verdict | Why |
|:---|:---|:---|
| "`pnpm.overrides` pins versions that do not exist upstream, so `--frozen-lockfile` cannot work on a clean machine" | **FALSE** | Queried the registry directly: `lodash` latest **is** `4.18.1`, `deepmerge-ts` latest **is** `8.0.2`, `mysql2` has `3.24.5`, `source-map-js` has `1.2.2`. All four resolve. (`mysql2` latest is now `3.24.6` — a bump opportunity, not a defect.) |
| "`/readyz` reports the audit ledger as non-durable (`auditPersistence: memory`) on a DB-connected server" | **FALSE** | The field only flips on the first *attempted* audit write. After one audited request it reads `prisma` with `sequence: 1`. Working as designed. See §3. |
| "The config-coercion bug lets an operator accidentally mark StarTimes carriage verified and publish unverified channel numbers" | **TRUE bug, FALSE consequence** | The coercion is real and confirmed (PR-13), and `STARTIMES_CARRIAGE_VERIFIED="false"` does read as `true` — but the flag has **no consumer anywhere in `src/`** (PR-14), so at present it publishes nothing. Fixing PR-13 alone would still leave the control inert; both rows must land together. |
| "`release-manifest.json`'s `decision` field is trusted by the gate, so a manifest can self-declare `GO`" | **PARTIALLY FALSE** | The evaluator ignores `manifest.decision` and recomputes from gate statuses, and an all-`NOT_TESTED` manifest can never deploy; a `PRODUCTION_S5` manifest with any `NOT_TESTED` gate is forced to `HOLD`. PR-04 stands because the *statuses and evidence references* are unverified — not because the decision string is trusted. |
| "`audit:check` is a registration-only gate with no severity policy" | **SUPERSEDED** | `audit:check` remains registration-only **by design**, and the real policy gate (`audit:threshold`, critical ≤ 0 / high ≤ 0) now runs beside it and reports 0 advisories. AUD-21 is closed. |
| "`pnpm audit` reports nothing because the override pins hide vulnerable packages" | **Not substantiated** | All four overrides resolve to real published versions (§ above); `pnpm audit --json` is executed by two independent scripts, one of which parses `metadata.vulnerabilities` directly. |

---

## 5. Sequenced remediation plan

Ordered by **what unblocks other work**, matching `tasks.md §4`'s product that "ordering is
binding". Phases are gates, not suggestions: a phase's exit criteria must hold on one commit before
the next phase's claims may be published.

### Phase 0 — Restore a defensible baseline (hours, no design decisions)

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 0.1 | `git restore audit.md report.md tasks.md` — or re-home all three into `docs/` **and** repoint the six instruments reading them | PR-01 | `pnpm test` exits 0 with 81 files / 886 tests / 0 skipped on this exact tree |
| 0.2 | Fix the boolean coercion (`z.enum(["true","false"]).transform(...)`) and add a config test per boolean field | PR-13 | `loadConfig({PROMETHEUS_METRICS_ENABLED:"false"}).PROMETHEUS_METRICS_ENABLED === false`; an invalid value fails boot |
| 0.3 | Refuse `rediss://` unless TLS is actually used; add the no-plaintext-`AUTH` regression test | PR-07 | Test asserts no `AUTH` bytes leave a plaintext socket for a `rediss://` URL |
| 0.4 | Make `checkStorageReady()` probe the bucket; keep `STORAGE_READINESS_GATING=false` as the opt-out | PR-08 | A dead endpoint yields `/readyz` **503** with `storage: "unavailable"` while gating is enforced |
| 0.5 | Make `gates:check` fail on manifest/HEAD divergence unless `--allow-sha-drift`; re-pin the manifest SHA | PR-03 | Divergent SHA → exit 1; matching SHA → exit 0 |
| 0.6 | Add `unhandledRejection`/`uncaughtException` handling and a shutdown deadline | PR-16 | A thrown rejection exits non-zero with one structured ERROR line; a hung stop exits within the deadline |
| 0.7 | Add `CODEOWNERS`, `SECURITY.md`, `engines.node` + `.nvmrc`, and point CI at the Node version file | PR-23, PR-24 | — |

**Phase 0 exit gate:** typecheck, lint, three audit gates, `test:coverage`, build and `gates:check`
all exit 0 **on one commit**, with `tasks.md` present, and PR-01/03/07/08/13/16 each carry a
regression test. This is the precondition for every claim in §5's later phases.

### Phase 1 — Make CI real, and make it fail closed (1–3 days, needs the owner)

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 1.1 | Add the git remote; push `main`; require the `verify-and-test` check on `main` | PR-02 | A GitHub Actions run exists on a SHA this document cites, and its steps executed (gitleaks included) |
| 1.2 | Build the image on a Docker host; add `prisma generate`, fix the lockfile glob, point `HEALTHCHECK` at `/readyz` | PR-19 | `docker build` succeeds; container answers `/readyz` 200 in compose |
| 1.3 | Harden compose (cap_drop, no-new-privileges, read-only, limits) and `:?`-require the MinIO credentials | PR-20 | Compose starts with only `.env`-supplied credentials; a missing one refuses to start |
| 1.4 | Ship `prometheus.rules.yml` with `rule_files`, wire a receiver, fix the `environment` label | PR-21 | Prometheus loads the rules file; a forced alert fires end-to-end in the sandbox stack |
| 1.5 | SBOM per release; image provenance; Dependabot; record or drop `ignore-unfixed` | PR-22 | An SBOM artifact is attached to a release; Dependabot opens a PR on a stale dependency |

**Phase 1 exit gate:** TSK-57's two boxes close on a real Actions run — not a local rehearsal — and
`docs/handoffs/LATEST.md`'s posture line can stop saying "a CI-equivalent local green is still not a
CI-verified green".

### Phase 2 — Close the state-durability programme (weeks; the largest functional risk)

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 2.1 | Persist **schedule day + broadcast versions** and hydrate at boot; retire the demo seed as the only source of a schedule | PR-05 | Approve a schedule, restart the process, re-read the same approved schedule with its revision identity |
| 2.2 | Persist **billing rate cards, traffic inventory, playout cache** | PR-05 | A restarted instance serves the same billing panel the previous process computed |
| 2.3 | Wire **`TalentPayoutBatch`** and **`BankStatementRecord`**, or delete the tables | PR-06 | A payout batch survives a restart and reconciles to its ledger entries |
| 2.4 | Persist the rights review queue, routing rules, POA registry/exceptions, feature-flag overrides | PR-05 | Each family's restart drill is green in `durability-drill-coverage.test.ts` |
| 2.5 | Recompute §3.3 down to the families that genuinely have no durable copy and re-pin the matrices | PR-05 | `systems-of-record.test.ts` passes with a smaller `sandbox-state` census, and the journey matrix's Gate column moves where it earns it |

**Phase 2 exit gate:** no `D1`/`sandbox-state` label on any journey whose Gate column reads
`VERIFIED`, and every remaining label has a named owner and expiry in the journey matrix.

### Phase 3 — Close the security and privacy gap before real personal data

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 3.1 | Route a real `AccessContext` into `canPerform` from one request-scoped resolver, or delete the dead tenant branch and the dead `assertPermission` | PR-09 | A cross-tenant request is refused by the central guard, proved by a route test; TSK-58 boxes 1 and 3 close |
| 3.2 | Atomic shared rate limiting through the KV adapter, including public intake | PR-10 | Two simulated instances share one budget; the limiter fails closed when the backend is down |
| 3.3 | Seal every direct identifier; run the DPO key-rotation decision (HD-05) | PR-11 | Postgres refuses a plaintext value on every sealed column; a documented rotation has been rehearsed once |
| 3.4 | Move the remaining security-bearing env vars into the Zod schema; document the missing ones | PR-15 | The used-vs-schema gap is zero, and `.env.example` documents every variable `src/` reads |
| 3.5 | Triage the 299 unescaped interpolations and burn down the ones carrying external strings | PR-12 | DEBT-009's ratchet drops, with the classified list recorded |

### Phase 4 — Earn the compliance and quality claims

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 4.1 | Decide the Playwright question and act: write the axe + keyboard suite, **or** remove the packages and downgrade the claim | PR-26, HD-10 | Either a real browser run is archived under `docs/audit/evidence/`, or the a11y statement no longer implies one |
| 4.2 | Ratchet `explicit-any` down in fixed increments; raise the branch coverage floor; continue router extraction | PR-27 | The budget decreases on every commit; branch floor rises |
| 4.3 | Clear the near-expiry design debt, treating DEBT-004 as a privacy dependency | PR-28 | No item in `docs/design-debt-register.md` is past expiry without a new recorded decision |
| 4.4 | WAL archiving + a point-in-time recovery rehearsal to a named timestamp | PR-25 | A PITR drill restores to a chosen instant with recorded RPO/RTO actuals |
| 4.5 | Resolve the human decisions that gate promotion: HD-01 (`DEC-RL1-SCOPE-001` still `PENDING_SIGNATURE`), HD-03 (BG6 carriage), HD-04 (revenue recognition), HD-05/06 (privacy), HD-07 (error contract), HD-09 (manual WCAG) | PR-29 and the register's `BLOCKED` rows | Each decision has a signed record or an explicit, dated deferral with a named owner |

### Phase 5 — From "release gate" to "release evidence"

| # | Action | Fixes | Exit criterion |
|:--|:---|:---|:---|
| 5.1 | Resolve `evidenceRef` for every BG gate and fail on a missing path or a stale `evaluatedAt` | PR-04 | Deleting a cited test file fails `gates:check` |
| 5.2 | Bind the release owner's signature to the built artifact digest | PR-04 | A manifest signed against a different digest is refused |
| 5.3 | Simplify the error contract on one problem+json boundary with stable codes and request ids | PR-24, HD-07 | One contract across modular and monolithic routes, documented in OpenAPI |
| 5.4 | Add a top-level index in `docs/` mapping CCPP §3 sections to their actual directories | PR-29 | An external reviewer can navigate the governance structure from one page |

---

## 6. Cross-reference — what this document does *not* re-register

| Existing ID | Relationship to this document |
|:---|:---|
| `report.md` CA-06 | **Recurring.** PR-01 is the same finding, now with the register fully deleted rather than half-deleted. |
| `tasks.md` TSK-57 | **Unchanged and still the gate.** PR-02 is the only path to closing it; a local rehearsal cannot. |
| `tasks.md` TSK-37 / HD-01 | **Now measured as a gate defect, not just staleness.** PR-03/PR-04. |
| `tasks.md` TSK-58 (boxes 1, 3) | **Open, and now measured to be inert rather than merely unproven.** PR-09. |
| `tasks.md` TSK-30 / HD-05 | **Coverage half open.** PR-11. |
| `tasks.md` TSK-45 / HD-10 | **Made decidable by measurement.** PR-26 — zero specs, packages installed. |
| `audit.md` AUD-13 / HD-07 | **Open.** PR-24. |
| `audit.md` AUD-14 | **Open by design.** PR-10. |
| `audit.md` AUD-17, AUD-20 | **Open, unchanged.** Not restated here; see `docs/design-debt-register.md` DEBT-009 for the escape ceiling. |
| `docs/design-debt-register.md` DEBT-001…010 | **Expiry wave.** PR-28; no new debt is invented here. |
| `docs/audit/journey-readiness-matrix.md` §3.3 | **The census this audit relies on.** PR-05/2.5 do not dispute it — they schedule its closure. |

---

## 7. Reproduction

```bash
# --- baseline (2026-10-16) ---
pnpm typecheck                                   # exit 0
pnpm lint                                        # exit 0
pnpm run audit:check                             # exit 0, 0 advisories
pnpm run audit:threshold                         # exit 0, critical 0 / high 0
pnpm run any:budget                              # exit 0, "137 (budget 138)"
pnpm run build                                   # exit 0
node dist/src/cli/index.js gates:check           # exit 0, "Notice: Manifest SHA (ca303f0) diverges…"
pnpm test                                        # exit 1  <-- PR-01: 5 files / 4 tests red

# --- PR-01: what is red, and why ---
git status --short                               # D audit.md  D report.md  D tasks.md
grep -n "ENOENT" <(pnpm test 2>&1)               # ENOENT … open '/Users/deprof/www/vmng/tasks.md'

# --- PR-13: the boolean coercion, through the real loader ---
node -e 'process.env.NODE_ENV="development";process.env.PROMETHEUS_METRICS_ENABLED="false";
  import("./dist/src/core/config/index.js").then(m=>console.log(m.loadConfig({...process.env}).PROMETHEUS_METRICS_ENABLED))'
# -> true

# --- PR-14: the metrics switch does nothing (flag set false before boot) ---
PROMETHEUS_METRICS_ENABLED=false node dist/src/index.js &   # then:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5599/metrics   # -> 200
grep -rn "CARRIAGE_VERIFIED\|METRICS_ENABLED" src --include=*.ts          # -> 2 schema lines + 1 comment

# --- PR-08: readiness cannot see a dead bucket ---
node -e 'process.env.STORAGE_DRIVER="minio";process.env.STORAGE_ENDPOINT="http://127.0.0.1:1";
  import("./dist/src/core/storage/index.js").then(m=>m.checkStorageReady().then(r=>console.log(r)))'
# -> { ready: true, status: "ready", … }

# --- PR-07: rediss:// is plaintext ---
#   bind a plain TCP listener, then:
#   createMinimalRespRedisClient("rediss://:secretpw@127.0.0.1:<port>").call("PING")
# -> listener receives: "*2\r\n$4\r\nAUTH\r\n$8\r\nsecretpw\r\n*1\r\n$4\r\nPING\r\n"

# --- PR-09: the tenant predicate is unreachable ---
grep -rn "canPerform(" src --include=*.ts        # 4 call sites, all 3-argument
grep -rn "assertPermission" src --include=*.ts   # definition only

# --- PR-15: config coverage ---
grep -rhoE "process\.env\.[A-Z_][A-Z0-9_]*" src --include=*.ts | sed 's/process\.env\.//' | sort -u | wc -l   # 37
grep -oE "^  [A-Z_][A-Z0-9_]*:" src/core/config/index.ts | tr -d ' :' | sort -u | wc -l                      # 44 (schema)

# --- PR-26: the a11y claim has no browser behind it ---
find . -path ./node_modules -prune -o -name "*.spec.ts" -print          # nothing
find . -path ./node_modules -prune -o -name "playwright.config*" -print # nothing
ls node_modules/.bin | grep -i play                                     # playwright, playwright-core

# --- PR-27 ---
wc -l src/api/router.ts                           # 8245
```

---

## 8. Bottom line

The engineering discipline in this repository is unusually strong: 886 tests over 81 files, a
default-deny route-guard table with a parity scan, a tamper-evident transactional audit ledger, honest
`D1`/`D2`/`sandbox-state` labelling, and 11 registers written by their own commands. Almost every
issue this audit found is already *inventoried* somewhere in `docs/`; the gap is **closure and
enforcement**, not discovery.

Three things stand between this tree and a defensible production claim, in order:

1. **The verification baseline is not currently green** (PR-01) and **has never been seen by CI**
   (PR-02). Until both hold, every "verified" statement in the repository is a local observation.
2. **The controls that are supposed to fail closed do not all fail closed**: `rediss://` downgrades to
   plaintext (PR-07), `/readyz` cannot see dead DAM storage (PR-08), the tenant predicate never runs
   (PR-09), the release gate cannot fail on SHA drift and verifies nothing but its own manifest
   (PR-03/PR-04), and two shipped switches are dead (PR-13/PR-14). Each is small; together they are
   the difference between a system that is *designed* to fail closed and one that *does*.
3. **147 documented IDs still have no durable copy** (PR-05). A restart of the current build returns
   a reviewed, approved broadcast schedule to a demo seed. That is a business-continuity fact, not a
   technical one, and it is the largest remaining piece of work.

Phases 0 and 1 are hours-to-days and unblock everything else; Phase 2 is the real programme; Phases 3–5
convert compliance claims into evidence. Nothing in §5 requires a decision this audit cannot make —
the open human decisions are enumerated in `tasks.md §5` and are re-cited, not re-litigated.

*Measured 2026-10-16 on `37d0007` + the three deleted registers. Every figure in this document is
reproducible with §7 on this tree. This register adds findings; it supersedes nothing.*
