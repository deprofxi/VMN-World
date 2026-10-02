# Multi-stage Production Dockerfile for VMNL Enterprise Platform
# Authority: VMNL-AZP-VMN-CCPP-001 §21 / VMNL-AZP-VMN-EXEC-001

# Stage 1: Build & Compile
FROM node:22-alpine AS builder

WORKDIR /app

# AUD-27: pnpm is pinned via the packageManager field (corepack reads it from
# the copied package.json), guaranteeing reproducible installs across builds.
RUN corepack enable

COPY package.json pnpm-lock.yaml* tsconfig.json ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY src ./src/
COPY tests ./tests/

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

COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

RUN corepack enable && \
    pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

# Set ownership to unprivileged user
RUN chown -R vmnluser:vmnlgroup /app

USER vmnluser

EXPOSE 5500

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5500/healthz || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
