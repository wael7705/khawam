# Khawam Backend - Production Dockerfile
# Build context: repository root (parent of backend/)
# Optimized for 4GB RAM VPS

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@8 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
WORKDIR /app/backend
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend
RUN pnpm exec prisma generate
RUN pnpm add -D prisma

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -sf http://localhost:8000/api/health || exit 1

CMD ["node", "dist/server.js"]
