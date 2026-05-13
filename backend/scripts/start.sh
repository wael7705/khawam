#!/bin/sh
set -e
cd /app/backend

echo "[start] pre-db-push: drop legacy constraints (if present)..."
pnpm exec prisma db execute --schema prisma/schema.prisma --file scripts/sql/pre-db-push-legacy-constraints.sql

echo "[start] db push..."
pnpm exec prisma db push --schema prisma/schema.prisma --accept-data-loss

echo "[start] seed..."
pnpm exec prisma db seed --schema prisma/schema.prisma

echo "[start] server..."
exec node dist/run.js
