# Multi-stage Production Dockerfile for VMNL Enterprise Platform
# Authority: VMNL-AZP-VMN-CCPP-001 §21 / VMNL-AZP-VMN-EXEC-001
#
# PR-19: the image must be trustworthy as built. Four defects are fixed here,
# each of which made the artifact differ from what the test suite verified:
#   1. `prisma generate` never ran, so the runtime image had no generated client;
#   2. the runner installed prod-only, which drops the `prisma` CLI, so nothing in
#      the image could have produced the client the app imports;
#   3. `COPY pnpm-lock.yaml*` degraded silently when the lockfile was absent;
#   4. `HEALTHCHECK` probed `/healthz` (liveness) rather than `/readyz`, so an
#      instance with a dead database or object store stayed "healthy".
#
# Migrations do NOT belong in this image (they need a database and a
# release-time decision). They run as a release step —
# `.github/workflows/ci.yml` runs `pnpm exec prisma migrate deploy` against the
# target before the image is promoted; the reverse path is
# docs/runbooks/rollback-runbook.md.

# Stage 1: Build & Compile
FROM node:22-alpine AS builder

WORKDIR /app

# AUD-27: pnpm is pinned via the packageManager field (corepack reads it from
# the copied package.json), guaranteeing reproducible installs across builds.
RUN corepack enable

# PR-19: a hard COPY, not `pnpm-lock.yaml*`. A glob lets a missing lockfile
# build an image from resolved-at-build-time versions with no error.
COPY package.json pnpm-lock.yaml tsconfig.json prisma.config.ts vite.config.ts ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY src ./src/
COPY tests ./tests/
COPY scripts ./scripts/

# PR-19: the client is generated during the build and carried into the runtime
# stage below. Without this the app cannot start from the image at all, because
# `@prisma/client` is a thin loader around the generated directory.
RUN pnpm exec prisma generate && \
    node -e "const fs = require('fs'), path = require('path'); const src = path.resolve(path.dirname(require.resolve('@prisma/client')), '../../.prisma'); if (fs.existsSync(src)) fs.cpSync(src, '/app/node_modules/.prisma', { recursive: true });"

RUN pnpm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5500

# Install dumb-init for proper signal handling (SIGTERM/SIGINT) and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root system user for security compliance (Principle of Least Privilege)
RUN addgroup -g 1001 -S vmnlgroup && \
    adduser -u 1001 -S vmnluser -G vmnlgroup

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN corepack enable && \
    pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

# PR-19: the generated client is a build artifact of the builder stage, and the
# prod-only install above cannot regenerate it (the CLI is a devDependency).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN node -e "const fs = require('fs'), path = require('path'); try { const dest = path.resolve(path.dirname(require.resolve('@prisma/client')), '../../.prisma'); if (!fs.existsSync(dest)) fs.cpSync('/app/node_modules/.prisma', dest, { recursive: true }); } catch {}"

# Set ownership to unprivileged user
RUN chown -R vmnluser:vmnlgroup /app

USER vmnluser

EXPOSE 5500

# PR-19: readiness, not liveness. `/readyz` reports database, object-storage and
# KV health (PR-08 made the storage probe real); `/healthz` answers 200 while
# those are down. Pointing the container healthcheck at readiness is what takes
# a broken instance out of rotation.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:5500/readyz || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
