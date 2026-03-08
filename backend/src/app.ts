import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
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

export async function buildApp() {
  const app = Fastify({
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

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // File upload support
  await app.register(uploadPlugin);

  // Static files
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    },
  });

  // Socket.IO
  await app.register(socketPlugin);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(ordersRoutes, { prefix: '/api/orders' });
  await app.register(productsRoutes, { prefix: '/api/products' });
  await app.register(servicesRoutes, { prefix: '/api/services' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' });
  await app.register(studioRoutes, { prefix: '/api/studio' });
  await app.register(workflowsRoutes, { prefix: '/api/workflows' });
  await app.register(pricingRoutes, { prefix: '/api' });
  await app.register(heroSlidesRoutes, { prefix: '/api' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(notificationsRoutes, { prefix: '/api/ws' });

  return app;
}
