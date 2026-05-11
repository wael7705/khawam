FROM node:20-slim AS base

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec prisma generate \
  && pnpm run build

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s \
  CMD node -e "const p=process.env.PORT||8000; fetch('http://127.0.0.1:'+p+'/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "echo '[start] db push...' && pnpm exec prisma db push --accept-data-loss && echo '[start] seed...' && pnpm exec prisma db seed && echo '[start] server...' && exec node dist/run.js"]
