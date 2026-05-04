# ---- Stage 1: shared Alpine base with pnpm ----
FROM node:20-alpine AS base

RUN apk add --no-cache openssl \
  && corepack enable && corepack prepare pnpm@8 --activate

# ---- Stage 2: install ALL backend deps (including devDeps needed for build) ----
FROM base AS backend-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile --filter @khawam/backend

# ---- Stage 3: build backend (generate Prisma client + compile TypeScript) ----
FROM backend-deps AS backend-build

COPY backend/ backend/

WORKDIR /app/backend

RUN pnpm exec prisma generate \
  && pnpm run build

# ---- Stage 4: production-only backend deps (no devDeps) ----
FROM base AS prod-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile --filter @khawam/backend --prod \
  && pnpm store prune

# ---- Stage 5: build frontend ----
FROM base AS frontend-build

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile --filter @khawam/frontend

COPY frontend/ frontend/

ENV VITE_API_URL=/api
RUN pnpm --filter @khawam/frontend build

# ---- Final: minimal Alpine runtime image ----
FROM node:20-alpine AS final

RUN apk add --no-cache openssl \
  && corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app/backend

# Production node_modules (no devDeps)
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/backend/node_modules ./node_modules

# tsx is a devDep but required at runtime for `prisma db seed` (runs seed.ts via tsx)
# Copy only the tsx package and its binary from the full-deps stage
COPY --from=backend-deps /app/node_modules/tsx /app/node_modules/tsx
COPY --from=backend-deps /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=backend-deps /app/backend/node_modules/.bin/tsx ./node_modules/.bin/tsx

# Generated Prisma client (produced by prisma generate in backend-build)
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma

# Compiled backend source
COPY --from=backend-build /app/backend/dist ./dist

# Prisma schema + seed script (seed.ts is executed via tsx at startup)
COPY --from=backend-build /app/backend/prisma ./prisma

# package.json required by pnpm exec and the prisma.seed config entry
COPY backend/package.json ./package.json

# Built frontend static assets served by the backend
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

# مهلة كافية لـ db push + seed + بدء السيرفر قبل أول فحص صحة
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s \
  CMD node -e "const p=process.env.PORT||8000; fetch('http://127.0.0.1:'+p+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# بدء التشغيل: db push ثم seed (يشمل الخدمات والـ workflow والقاعدة المالية) ثم السيرفر
CMD ["sh", "-c", "echo '[start] db push...' && pnpm exec prisma db push --accept-data-loss && echo '[start] seed...' && pnpm exec prisma db seed && echo '[start] server...' && exec node dist/run.js"]
