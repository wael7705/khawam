#!/bin/sh
set -e
cd /app/backend

echo "[start] drop orphan constraint..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_unique')
  .then(() => console.log('done'))
  .catch(e => console.warn('skip:', e.message))
  .finally(() => p.\$disconnect());
"

echo "[start] db push..."
pnpm exec prisma db push --accept-data-loss

echo "[start] seed..."
pnpm exec prisma db seed

echo "[start] server..."
exec node dist/run.js
