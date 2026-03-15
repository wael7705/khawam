import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import { socketPlugin } from './shared/plugins/socket.plugin.js';
import { uploadPlugin } from './shared/plugins/upload.plugin.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { servicesRoutes } from './modules/services/services.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { portfolioRoutes } from './modules/portfolio/portfolio.routes.js';
import { studioRoutes } from './modules/studio/studio.routes.js';
import { workflowsRoutes } from './modules/workflows/workflows.routes.js';
import { pricingRoutes } from './modules/pricing/pricing.routes.js';
import { heroSlidesRoutes } from './modules/hero-slides/hero-slides.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { savedLocationsRoutes } from './modules/saved-locations/saved-locations.routes.js';

export async function buildApp() {
  const app = Fastify({
    trustProxy: true,
    logger: {
      level: config.NODE_ENV === 'development' ? 'info' : 'warn',
      transport: config.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(cors, {
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  // Multipart on root so all /api routes (orders, studio, admin uploads) inherit the parser
  await app.register(uploadPlugin);

  // Static files (uploads)
  await app.register(fastifyStatic, {
    root: config.uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    },
  });

  // Socket.IO
  await app.register(socketPlugin);

  // Health check (not rate-limited)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes: rate limit applies only here (not to static files or health)
  await app.register(
    async (apiApp) => {
      await apiApp.register(rateLimit, {
        max: 400,
        timeWindow: '1 minute',
        skip: (request) => {
          const path = request.url.split('?')[0] ?? '';
          return (
            path === '/api/orders/upload' ||
            path === '/api/orders/upload-batch' ||
            path.startsWith('/api/studio/') ||
            path === '/api/admin/upload' ||
            path.startsWith('/api/admin/upload/') ||
            path === '/api/hero-slides/upload'
          );
        },
      });
      await apiApp.register(authRoutes, { prefix: '/auth' });
      await apiApp.register(ordersRoutes, { prefix: '/orders' });
      await apiApp.register(savedLocationsRoutes, { prefix: '/saved-locations' });
      await apiApp.register(productsRoutes, { prefix: '/products' });
      await apiApp.register(servicesRoutes, { prefix: '/services' });
      await apiApp.register(adminRoutes, { prefix: '/admin' });
      await apiApp.register(portfolioRoutes, { prefix: '/portfolio' });
      await apiApp.register(studioRoutes, { prefix: '/studio' });
      await apiApp.register(workflowsRoutes, { prefix: '/workflows' });
      await apiApp.register(pricingRoutes, { prefix: '/' });
      await apiApp.register(heroSlidesRoutes, { prefix: '/' });
      await apiApp.register(analyticsRoutes, { prefix: '/analytics' });
      await apiApp.register(notificationsRoutes, { prefix: '/ws' });
    },
    { prefix: '/api' },
  );

  // Serve frontend static + SPA fallback when public exists (Railway single-service deploy)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = resolve(join(__dirname, '..', 'public'));
  let cachedIndexHtml: string | null = null;
  if (existsSync(publicDir)) {
    const indexPath = join(publicDir, 'index.html');
    if (existsSync(indexPath)) {
      cachedIndexHtml = readFileSync(indexPath, 'utf-8');
    }
    await app.register(fastifyStatic, {
      root: publicDir,
      prefix: '/',
      decorateReply: false,
      index: ['index.html'],
      wildcard: false,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    });
    app.setNotFoundHandler(async (request, reply) => {
      const method = request.method;
      const pathname = (request.url.split('?')[0] ?? '').split('#')[0] || '/';
      if (
        (method !== 'GET' && method !== 'HEAD') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/uploads')
      ) {
        return reply.code(404).send({
          message: `Route ${method}:${request.url} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
      }
      if (!cachedIndexHtml) {
        return reply.code(404).send({
          message: 'Not Found',
          error: 'Not Found',
          statusCode: 404,
        });
      }
      return reply
        .header('Cache-Control', 'no-cache')
        .type('text/html')
        .send(cachedIndexHtml);
    });
  }

  return app;
}
