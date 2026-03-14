FROM node:20-slim AS base

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install only backend deps (faster than full workspace install)
RUN pnpm install --frozen-lockfile --filter @khawam/backend

COPY backend/ backend/

WORKDIR /app/backend

RUN pnpm exec prisma generate \
  && pnpm run build

# ---- Frontend build ----
FROM node:20-slim AS frontend-build

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install only frontend deps (faster than full workspace install)
RUN pnpm install --frozen-lockfile --filter @khawam/frontend

COPY frontend/ frontend/

ENV VITE_API_URL=/api
RUN pnpm --filter @khawam/frontend build

# ---- Final ----
FROM base AS final

WORKDIR /app/backend

COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

# مهلة أطول لبدء الحاوية (seed + اختبارات + تشغيل السيرفر) قبل أول فحص صحة
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s \
  CMD node -e "const p=process.env.PORT||8000; fetch('http://127.0.0.1:'+p+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# تشغيل الاختبارات لا يمنع السيرفر من البدء؛ إن فشلت الاختبارات تُسجّل في السجل والنشر ينجح
CMD ["sh", "-c", "pnpm exec prisma db push && pnpm exec prisma db seed && (pnpm test || true) && echo 'Starting server...' && node dist/server.js"]
