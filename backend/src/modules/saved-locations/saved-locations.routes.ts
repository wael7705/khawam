import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import {
  createSavedLocationSchema,
  updateSavedLocationSchema,
} from './saved-locations.schema.js';
import * as savedLocationsService from './saved-locations.service.js';

export async function savedLocationsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    try {
      const list = await savedLocationsService.listByUserId(userId);
      return { data: list };
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.code(e.statusCode ?? 500).send({ detail: e.message ?? 'فشل في جلب المواقع' });
    }
  });

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createSavedLocationSchema.parse(request.body);
    try {
      const created = await savedLocationsService.create({
        userId,
        label: body.label,
        street: body.street ?? null,
        neighborhood: body.neighborhood ?? null,
        buildingFloor: body.building_floor ?? null,
        extra: body.extra ?? null,
        latitude: body.latitude,
        longitude: body.longitude,
      });
      return created;
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.code(e.statusCode ?? 500).send({ detail: e.message ?? 'فشل في حفظ الموقع' });
    }
  });

  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const body = updateSavedLocationSchema.parse(request.body);
      try {
        const updated = await savedLocationsService.update(id, userId, {
          street: body.street ?? undefined,
          neighborhood: body.neighborhood ?? undefined,
          buildingFloor: body.building_floor ?? undefined,
          extra: body.extra ?? undefined,
          latitude: body.latitude,
          longitude: body.longitude,
        });
        return updated;
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.code(e.statusCode ?? 500).send({ detail: e.message ?? 'فشل في تحديث الموقع' });
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      try {
        await savedLocationsService.remove(id, userId);
        return { success: true };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        return reply.code(e.statusCode ?? 500).send({ detail: e.message ?? 'فشل في حذف الموقع' });
      }
    }
  );
}
