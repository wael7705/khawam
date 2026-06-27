#!/bin/sh
set -e
cd /app/backend
echo "[cleanup] Dropping legacy non-public schemas (public schema untouched)..."
pnpm exec prisma db execute --schema prisma/schema.prisma --file scripts/sql/drop-legacy-schemas.sql
echo "[cleanup] Done."
