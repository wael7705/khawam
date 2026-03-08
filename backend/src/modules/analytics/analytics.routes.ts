import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import {
  trackVisitSchema,
  trackPageViewSchema,
  dateRangeQuerySchema,
} from './analytics.schema.js';
import * as analyticsService from './analytics.service.js';

const adminPreHandler = [authenticate, requireRole('مدير', 'موظف')];

function parseDateFilters(query: { startDate?: string; endDate?: string }) {
  const parsed = dateRangeQuerySchema.safeParse({
    startDate: query.startDate,
    endDate: query.endDate,
  });
  if (!parsed.success) return undefined;
  return {
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  };
}

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/track', async (request, reply) => {
    try {
      const body = trackVisitSchema.parse(request.body);
      const result = await analyticsService.trackVisit(body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/page-view', async (request, reply) => {
    try {
      const body = trackPageViewSchema.parse(request.body);
      const result = await analyticsService.trackPageView(body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/stats', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { startDate?: string; endDate?: string };
      const filters = parseDateFilters(query);
      const result = await analyticsService.getStats(filters);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/exit-rates', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { startDate?: string; endDate?: string };
      const filters = parseDateFilters(query);
      const result = await analyticsService.getExitRates(filters);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/pages', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { pagePath?: string; startDate?: string; endDate?: string };
      const filters = parseDateFilters(query);
      if (query.pagePath) {
        const result = await analyticsService.getPageStats(query.pagePath, filters);
        if (!result) {
          return reply.code(404).send({ detail: 'الصفحة غير موجودة' });
        }
        return result;
      }
      const result = await analyticsService.getStats(filters);
      return { topPages: result.topPages };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/visitors', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { startDate?: string; endDate?: string };
      const filters = parseDateFilters(query);
      const result = await analyticsService.getVisitorCount(filters);
      return { count: result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/funnels', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { startDate?: string; endDate?: string };
      const filters = parseDateFilters(query);
      const result = await analyticsService.getFunnels(filters);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
