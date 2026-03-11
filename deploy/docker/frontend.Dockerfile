# Khawam Frontend - Production Dockerfile
# Build context: repository root
# Stage 1: Build React/Vite app
# Stage 2: Serve with Nginx (lightweight, same container)

# ---- Build ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile

COPY frontend ./frontend

# Build-time API URL (override per environment)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app/frontend
RUN pnpm run build

# ---- Serve with Nginx ----
FROM nginx:alpine AS runner

# Remove default config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY deploy/docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Lightweight health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
