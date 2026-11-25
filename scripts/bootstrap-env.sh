#!/bin/sh
# Bootstrap .env with safe defaults and cryptographically random credentials
# for all-in-one Docker Compose & Coolify deployments (POSIX sh, no Node.js required).
#
# Usage:
#   sh scripts/bootstrap-env.sh [.env]
#
# Existing keys in the target .env file are never overwritten.
set -eu

ENV_FILE="${1:-.env}"

rand_hex() {
  bytes="$1"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    od -An -tx1 -N "$bytes" /dev/urandom | tr -d ' \n'
  fi
}

get_existing() {
  key="$1"
  if [ -f "$ENV_FILE" ]; then
    grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true
  fi
}

set_if_missing() {
  key="$1"
  val="$2"
  cur="$(get_existing "$key")"
  if [ -z "$cur" ]; then
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

PG_USER="$(get_existing POSTGRES_USER)"
[ -n "$PG_USER" ] || PG_USER="vmn_user"

PG_PASS="$(get_existing POSTGRES_PASSWORD)"
[ -n "$PG_PASS" ] || PG_PASS="$(rand_hex 24)"

PG_DB="$(get_existing POSTGRES_DB)"
[ -n "$PG_DB" ] || PG_DB="vmn_enterprise"

PG_HOST="$(get_existing POSTGRES_HOST)"
[ -n "$PG_HOST" ] || PG_HOST="postgres"

PG_PORT="$(get_existing POSTGRES_PORT)"
[ -n "$PG_PORT" ] || PG_PORT="5432"

RD_PASS="$(get_existing REDIS_PASSWORD)"
[ -n "$RD_PASS" ] || RD_PASS="$(rand_hex 24)"

RD_HOST="$(get_existing REDIS_HOST)"
[ -n "$RD_HOST" ] || RD_HOST="redis"

RD_PORT="$(get_existing REDIS_PORT)"
[ -n "$RD_PORT" ] || RD_PORT="6379"

set_if_missing "NODE_ENV" "production"
set_if_missing "PORT" "5500"
set_if_missing "APP_NAME" "VMN World"
set_if_missing "AUTO_MIGRATE" "true"
set_if_missing "AUTO_SEED" "false"

set_if_missing "POSTGRES_USER" "$PG_USER"
set_if_missing "POSTGRES_PASSWORD" "$PG_PASS"
set_if_missing "POSTGRES_DB" "$PG_DB"
set_if_missing "POSTGRES_HOST" "$PG_HOST"
set_if_missing "POSTGRES_PORT" "$PG_PORT"
set_if_missing "DATABASE_URL" "postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public"

set_if_missing "REDIS_HOST" "$RD_HOST"
set_if_missing "REDIS_PORT" "$RD_PORT"
set_if_missing "REDIS_PASSWORD" "$RD_PASS"
set_if_missing "REDIS_URL" "redis://:${RD_PASS}@${RD_HOST}:${RD_PORT}"

set_if_missing "STORAGE_DRIVER" "local"
set_if_missing "STORAGE_ENDPOINT" "http://minio:9000"
set_if_missing "STORAGE_BUCKET" "vmnl-assets"
set_if_missing "STORAGE_REGION" "us-east-1"
set_if_missing "STORAGE_ACCESS_KEY" "vmnl_$(rand_hex 8)"
set_if_missing "STORAGE_SECRET_KEY" "$(rand_hex 24)"

set_if_missing "JWT_SECRET" "$(rand_hex 32)"
set_if_missing "SESSION_SECRET" "$(rand_hex 32)"
set_if_missing "PII_ENCRYPTION_KEY" "$(rand_hex 32)"
set_if_missing "FUSION_EVENTS_HMAC_SECRET" "$(rand_hex 24)"

set_if_missing "AZEEBO_CLIENT_ID" "vmnl_enterprise_hub"
set_if_missing "AZEEBO_WEBHOOK_SECRET" "$(rand_hex 24)"
set_if_missing "AZEEBO_FEDERATION_SECRET" "$(rand_hex 24)"

# Coolify-compatible SERVICE_* aliases for local docker compose parity
set_if_missing "SERVICE_USER_POSTGRES" "$PG_USER"
set_if_missing "SERVICE_PASSWORD_POSTGRES" "$PG_PASS"
set_if_missing "SERVICE_PASSWORD_REDIS" "$RD_PASS"
set_if_missing "SERVICE_USER_MINIO" "$(get_existing STORAGE_ACCESS_KEY)"
set_if_missing "SERVICE_PASSWORD_MINIO" "$(get_existing STORAGE_SECRET_KEY)"
set_if_missing "SERVICE_PASSWORD_64_JWT" "$(get_existing JWT_SECRET)"
set_if_missing "SERVICE_PASSWORD_64_SESSION" "$(get_existing SESSION_SECRET)"
set_if_missing "SERVICE_PASSWORD_64_PII" "$(get_existing PII_ENCRYPTION_KEY)"
set_if_missing "SERVICE_PASSWORD_64_FUSION" "$(get_existing FUSION_EVENTS_HMAC_SECRET)"
set_if_missing "SERVICE_PASSWORD_64_AZEEBO" "$(get_existing AZEEBO_WEBHOOK_SECRET)"

echo "[bootstrap-env] Verified/populated ${ENV_FILE}."
