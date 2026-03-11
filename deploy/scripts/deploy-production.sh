#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/production/.env"
cd "$REPO_ROOT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing production/.env. Copy deploy/env/env.production.example to production/.env"
  exit 1
fi
set -a; source "$ENV_FILE"; set +a
docker compose -f deploy/docker-compose.production.yml build --no-cache
docker compose -f deploy/docker-compose.production.yml up -d
docker exec khawam-backend-production pnpm exec prisma migrate deploy 2>/dev/null || true
echo "Production deploy done."
