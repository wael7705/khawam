import Fastify, { type FastifyRequest } from 'fastify';
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
import { ordersUploadRoutes } from './modules/orders/orders-upload.routes.js';

const UPLOAD_BODY_LIMIT = 55 * 1024 * 1024; // 55 MB (أكبر من حد الملف 50 MB)

export async function buildApp() {
  const app = Fastify({
    trustProxy: true,
    bodyLimit: UPLOAD_BODY_LIMIT, // حد الجسم العام (لتجنب رفض الطلبات الكبيرة قبل المعالج)
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

  // مسارات رفع الطلبات فقط تحت /api/orders حتى لا تلتقط كل طلبات /api (وإلا لا تصل طلبات الاستديو /api/studio)
  await app.register(
    async (uploadApp) => {
      uploadApp.addContentTypeParser(
        'multipart/form-data',
        { bodyLimit: UPLOAD_BODY_LIMIT },
        (_req, payload, done) => {
          done(null, payload);
        },
      );
      await uploadApp.register(ordersUploadRoutes);
    },
    { prefix: '/api/orders' },
  );

  // Static files (uploads) — CORS so frontend can load studio images from another origin
  await app.register(fastifyStatic, {
    root: config.uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', config.FRONTEND_URL);
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
      await apiApp.register(uploadPlugin);
      await apiApp.register(rateLimit, {
        max: 400,
        timeWindow: '1 minute',
        allowList: (request: FastifyRequest, _key: string) => {
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
      // مسارات الإدارة داخل تطبيق فرعي يمرّر multipart كـ raw لتجنب 415 عند تغيير البروكسي لـ Content-Type
      await apiApp.register(
        async (adminApp) => {
          adminApp.addContentTypeParser(
            'multipart/form-data',
            { bodyLimit: UPLOAD_BODY_LIMIT },
            (_req, payload, done) => {
              done(null, payload);
            },
          );
          await adminApp.register(adminRoutes);
        },
        { prefix: '/admin' },
      );
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
