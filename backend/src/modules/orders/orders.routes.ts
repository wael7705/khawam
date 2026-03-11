import type { FastifyInstance } from 'fastify';
import { authenticate, optionalAuth } from '../../shared/middleware/auth.middleware.js';
import { isStaffRole } from '../../shared/types/index.js';
import * as ordersService from './orders.service.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.post('/upload', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      const result = await ordersService.uploadOrderFile({
        filename: data.filename,
        file: data.file,
        mimetype: data.mimetype,
      });
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return reply.code(400).send({ detail: error.message ?? 'فشل رفع الملف' });
    }
  });

  app.post('/upload-batch', async (request, reply) => {
    try {
      const parts = request.files();
      const results: Awaited<ReturnType<typeof ordersService.uploadOrderFile>>[] = [];
      for await (const part of parts) {
        const result = await ordersService.uploadOrderFile({
          filename: part.filename,
          file: part.file,
          mimetype: part.mimetype,
        });
        results.push(result);
      }
      if (results.length === 0) {
        return reply.code(400).send({ detail: 'لم يتم إرسال أي ملفات' });
      }
      return { files: results };
    } catch (err: unknown) {
      const error = err as { message?: string };
      return reply.code(400).send({ detail: error.message ?? 'فشل رفع الملفات' });
    }
  });

  app.post('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const items = body.items as ordersService.CreateOrderItemInput[];
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ detail: 'يجب إضافة عناصر للطلب' });
    }

    const input: ordersService.CreateOrderInput = {
      service_id: body.service_id as string | undefined,
      customer_id: body.customer_id as string | undefined,
      customer_name: body.customer_name as string | undefined,
      customer_phone: body.customer_phone as string | undefined,
      customer_whatsapp: body.customer_whatsapp as string | undefined,
      shop_name: body.shop_name as string | undefined,
      items,
      total_amount: Number(body.total_amount) || 0,
      discount_amount: body.discount_amount != null ? Number(body.discount_amount) : undefined,
      tax_amount: body.tax_amount != null ? Number(body.tax_amount) : undefined,
      final_amount: Number(body.final_amount) || 0,
      payment_method: body.payment_method as string | undefined,
      delivery_type: body.delivery_type as string | undefined,
      delivery_address: body.delivery_address as string | undefined,
      delivery_street: body.delivery_street as string | undefined,
      delivery_neighborhood: body.delivery_neighborhood as string | undefined,
      delivery_building_floor: body.delivery_building_floor as string | undefined,
      delivery_extra: body.delivery_extra as string | undefined,
      delivery_latitude: body.delivery_latitude != null ? Number(body.delivery_latitude) : undefined,
      delivery_longitude: body.delivery_longitude != null ? Number(body.delivery_longitude) : undefined,
      delivery_date: body.delivery_date as string | undefined,
      notes: body.notes as string | undefined,
      files: body.files as string[] | undefined,
    };

    try {
      const result = await ordersService.createOrder(input, request.user?.id);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as { status?: string; customer_id?: string; page?: string; limit?: string };
    const filters: ordersService.OrderFilters = {
      status: query.status,
      customer_id: query.customer_id,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };

    const isStaffUser = isStaffRole(request.user!.role);

    try {
      const result = await ordersService.getOrders(
        filters,
        request.user!.id,
        isStaffUser,
      );
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { orderId: string } }>(
    '/:orderId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = request.params;
      const isStaffUser = isStaffRole(request.user!.role);

      try {
        const order = await ordersService.getOrderById(
          orderId,
          request.user!.id,
          isStaffUser,
        );
        if (!order) {
          return reply.code(404).send({ detail: 'الطلب غير موجود' });
        }
        return order;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.get<{ Params: { orderId: string } }>(
    '/:orderId/attachments',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = request.params;
      const isStaffUser = isStaffRole(request.user!.role);

      const order = await ordersService.getOrderById(orderId, request.user!.id, isStaffUser);
      if (!order) {
        return reply.code(404).send({ detail: 'الطلب غير موجود' });
      }

      try {
        const attachments = await ordersService.getOrderAttachments(orderId);
        return { attachments };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.get<{ Params: { orderId: string } }>(
    '/:orderId/status-history',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = request.params;
      const isStaffUser = isStaffRole(request.user!.role);

      const order = await ordersService.getOrderById(orderId, request.user!.id, isStaffUser);
      if (!order) {
        return reply.code(404).send({ detail: 'الطلب غير موجود' });
      }

      try {
        const history = await ordersService.getOrderStatusHistory(orderId);
        return { history };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.get<{ Params: { orderId: string } }>(
    '/:orderId/reorder-data',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = request.params;
      const isStaffUser = isStaffRole(request.user!.role);

      const order = await ordersService.getOrderById(orderId, request.user!.id, isStaffUser);
      if (!order) {
        return reply.code(404).send({ detail: 'الطلب غير موجود' });
      }

      try {
        const data = await ordersService.getReorderData(orderId);
        if (!data) {
          return reply.code(404).send({ detail: 'الطلب غير موجود' });
        }
        return data;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );
}
