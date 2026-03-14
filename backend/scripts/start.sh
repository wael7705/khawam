#!/bin/sh
set -e
cd /app/backend

echo "[start] Running prisma db push..."
pnpm exec prisma db push

echo "[start] Running prisma db seed..."
pnpm exec prisma db seed

echo "[start] Starting Node server on 0.0.0.0:${PORT:-8000}..."
exec node dist/server.js
