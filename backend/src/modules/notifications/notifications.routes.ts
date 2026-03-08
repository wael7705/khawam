import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import * as notificationsService from './notifications.service.js';

const adminPreHandler = [authenticate, requireRole('مدير', 'موظف')];

export async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = notificationsService.getWebSocketStatus();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
