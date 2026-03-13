FROM node:20-slim AS base

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY backend/package.json backend/
COPY pnpm-workspace.yaml ./

# Install all deps (including dev) so prisma + typescript are available for generate/build
RUN pnpm install --frozen-lockfile

COPY backend/ backend/

WORKDIR /app/backend

RUN pnpm exec prisma generate
RUN pnpm run build

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD node -e "fetch('http://localhost:8000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
