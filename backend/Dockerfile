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

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD node -e "fetch('http://localhost:8000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["sh", "-c", "pnpm exec prisma db push && pnpm exec prisma db seed && node dist/server.js"]
