import type { FastifyInstance } from 'fastify';
import * as portfolioService from './portfolio.service.js';

export async function portfolioRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => {
    try {
      const works = await portfolioService.getPortfolioWorks();
      return reply.send(works);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/featured', async (_request, reply) => {
    try {
      const works = await portfolioService.getFeaturedWorks();
      return reply.send(works);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/linked', async (_request, reply) => {
    try {
      const works = await portfolioService.getLinkedWorksForFrontend();
      return reply.send({ works });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { workId: string } }>('/:workId', async (request, reply) => {
    const { workId } = request.params;
    try {
      const work = await portfolioService.getWorkById(workId);
      if (!work) {
        return reply.code(404).send({ detail: 'العمل غير موجود' });
      }
      return reply.send(work);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
