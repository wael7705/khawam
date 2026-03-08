import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import {
  createHeroSlideSchema,
  updateHeroSlideSchema,
  reorderSlidesSchema,
} from './hero-slides.schema.js';
import * as heroSlidesService from './hero-slides.service.js';

const adminPreHandler = [authenticate, requireRole('مدير', 'موظف')];

export async function heroSlidesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/hero-slides', async (request, reply) => {
    try {
      const result = await heroSlidesService.getHeroSlides();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/hero-slides', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = createHeroSlideSchema.parse(request.body);
      const result = await heroSlidesService.createHeroSlide(body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put('/hero-slides/:slideId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const { slideId } = request.params as { slideId: string };
      const body = updateHeroSlideSchema.parse(request.body);
      const result = await heroSlidesService.updateHeroSlide(slideId, body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.delete('/hero-slides/:slideId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const { slideId } = request.params as { slideId: string };
      const result = await heroSlidesService.deleteHeroSlide(slideId);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/hero-slides/reorder', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = reorderSlidesSchema.parse(request.body);
      const result = await heroSlidesService.reorderSlides(body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/hero-slides/upload', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      const result = await heroSlidesService.uploadSlideImage({
        filename: data.filename,
        file: data.file,
        mimetype: data.mimetype,
      });
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
