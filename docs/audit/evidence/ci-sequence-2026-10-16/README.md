CI step sequence, run on commit f606da6 tree, 2026-10-16
Environment: CI-equivalent — NODE_ENV=test, DATABASE_URL=postgresql://root@localhost:5432/vmn_test_db (fresh, empty), JWT_SECRET/AZEEBO_WEBHOOK_SECRET as .github/workflows/ci.yml sets them; Node v22.23.2 (CI: 22), pnpm 10.17.1.
Substitution: the local superuser 'root' stands in for the workflow's vmn_user (POSTGRES_USER bootstrap superuser in the Actions service container); password-authenticated login is therefore not exercised locally.

Step (workflow order) | Exit
pnpm install --frozen-lockfile | 0
pnpm run typecheck | 0
pnpm run lint | 0
pnpm run audit:check | 0 (zero vulnerabilities; 6 historical advisories in triage register)
pnpm run audit:threshold | 0 (critical 0, high 0, moderate 0, low 0)
pnpm run any:budget | 0 (137 explicit any, budget 138)
pnpm exec prisma migrate deploy (fresh vmn_test_db) | 0 (all migrations applied)
pnpm run test:coverage | 0 — 81 files / 886 tests passed / 0 skipped; All files 79.59 lines / 70.84 branches / 82.91 functions / 80.92 statements vs floors 72/62/77/73
pnpm run build | 0
node dist/src/cli/index.js gates:check | 0 — BG0-BG5, BG7-BG9 PASSED; BG6_CARRIAGE CONDITION/UNTESTED (never represented as PASS); STATUS: RELEASE CLEARED FOR SANDBOX S2 TARGET (GO_WITH_CONDITIONS)

Not runnable on this host (definitions, not proofs):
- Secret Scan (gitleaks): GitHub Action only, no local binary.
- Build Production Container Image (docker build) + Trivy scan: 'docker info' -> exit 127, no Docker binary on this host (TSK-57's recorded blocker). Both run on ubuntu-latest when the workflow fires.
- The GitHub Actions run itself: no git remote is configured, so no run has seen this SHA. A local CI-equivalent green may not be published as a CI-verified green (Rule: evidence before claims).

Reproduce:
  export NODE_ENV=test DATABASE_URL=postgresql://root@localhost:5432/vmn_test_db JWT_SECRET=vmnl_ci_test_jwt_secret_must_be_at_least_32_characters_long AZEEBO_WEBHOOK_SECRET=azeebo_test_secret_16_chars
  pnpm install --frozen-lockfile && pnpm run typecheck && pnpm run lint && pnpm run audit:check && pnpm run audit:threshold && pnpm run any:budget && pnpm exec prisma migrate deploy && pnpm run test:coverage && pnpm run build && node dist/src/cli/index.js gates:check
