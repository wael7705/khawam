#!/bin/sh
set -e
cd /app/backend

echo "[start] pre-db-push: drop legacy constraints (if present)..."
pnpm exec prisma db execute --file scripts/sql/pre-db-push-legacy-constraints.sql

echo "[start] db push..."
pnpm exec prisma db push --accept-data-loss

echo "[start] seed..."
pnpm exec prisma db seed

echo "[start] server..."
exec node dist/run.js
