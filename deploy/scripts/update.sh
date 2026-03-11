#!/usr/bin/env bash
# Khawam Printing - Pull from GitHub, rebuild and restart
# Usage: ./deploy/scripts/update.sh [staging|production|both]
# Run from repo root
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET="${1:-both}"

cd "$REPO_ROOT"

echo "Pulling latest from GitHub..."
git pull origin main

do_staging() {
  ENV_FILE="$REPO_ROOT/staging/.env"
  [[ -f "$ENV_FILE" ]] || { echo "Missing staging/.env"; return 1; }
  set -a && source "$ENV_FILE" && set +a
  echo "Rebuilding staging..."
  docker compose -f deploy/docker-compose.staging.yml build --no-cache
  docker compose -f deploy/docker-compose.staging.yml up -d
  docker exec khawam-backend-staging pnpm exec prisma migrate deploy 2>/dev/null || true
  echo "Staging updated."
}

do_production() {
  ENV_FILE="$REPO_ROOT/production/.env"
  [[ -f "$ENV_FILE" ]] || { echo "Missing production/.env"; return 1; }
  set -a && source "$ENV_FILE" && set +a
  echo "Rebuilding production..."
  docker compose -f deploy/docker-compose.production.yml build --no-cache
  docker compose -f deploy/docker-compose.production.yml up -d
  docker exec khawam-backend-production pnpm exec prisma migrate deploy 2>/dev/null || true
  echo "Production updated."
}

case "$TARGET" in
  staging)  do_staging ;;
  production) do_production ;;
  both) do_staging; do_production ;;
  *) echo "Usage: $0 [staging|production|both]"; exit 1 ;;
esac

echo "Update complete."
