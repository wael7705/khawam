#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/staging/.env"
cd "$REPO_ROOT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing staging/.env. Copy deploy/env/env.staging.example to staging/.env"
  exit 1
fi
set -a; source "$ENV_FILE"; set +a
docker compose -f deploy/docker-compose.staging.yml build --no-cache
docker compose -f deploy/docker-compose.staging.yml up -d
docker exec khawam-backend-staging pnpm exec prisma migrate deploy 2>/dev/null || true
echo "Staging deploy done."
