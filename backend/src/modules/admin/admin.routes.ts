import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import * as adminService from './admin.service.js';
import { importLegacyServicesSeed } from '../services/services.service.js';

const adminPreHandler = [authenticate, requireRole('مدير', 'موظف')];

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // ─── Products (prefix: /products) ──────────────────────────────────────────
  app.get('/products/all', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const products = await adminService.getAllProducts();
      return { products };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/products', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: adminService.CreateProductInput = {
        name: body.name as string | undefined,
        name_ar: body.name_ar as string | undefined,
        description: body.description as string | undefined,
        description_ar: body.description_ar as string | undefined,
        category_id: body.category_id as string | undefined,
        price: body.price != null ? Number(body.price) : undefined,
        base_price: body.base_price != null ? Number(body.base_price) : undefined,
        image_url: body.image_url as string | undefined,
        images: Array.isArray(body.images) ? (body.images as string[]) : undefined,
        featured_image: body.featured_image as string | undefined,
        is_active: body.is_active as boolean | undefined,
        is_visible: body.is_visible as boolean | undefined,
        is_featured: body.is_featured as boolean | undefined,
        display_order: body.display_order != null ? Number(body.display_order) : undefined,
      };
      const result = await adminService.createProduct(input);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put<{ Params: { productId: string } }>(
    '/products/:productId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        const body = request.body as Record<string, unknown>;
        const input: adminService.UpdateProductInput = {
          name: body.name as string | undefined,
          name_ar: body.name_ar as string | undefined,
          description: body.description as string | undefined,
          description_ar: body.description_ar as string | undefined,
          category_id: body.category_id as string | undefined,
          price: body.price != null ? Number(body.price) : undefined,
          base_price: body.base_price != null ? Number(body.base_price) : undefined,
          image_url: body.image_url as string | undefined,
          images: Array.isArray(body.images) ? (body.images as string[]) : undefined,
          featured_image: body.featured_image as string | undefined,
          is_active: body.is_active as boolean | undefined,
          is_visible: body.is_visible as boolean | undefined,
          is_featured: body.is_featured as boolean | undefined,
          display_order: body.display_order != null ? Number(body.display_order) : undefined,
        };
        await adminService.updateProduct(productId, input);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.delete<{ Params: { productId: string } }>(
    '/products/:productId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        await adminService.deleteProduct(productId);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  // ─── Services (prefix: /services) ───────────────────────────────────────────
  app.get('/services/all', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const services = await adminService.getAllServices();
      return { services };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/services', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: adminService.CreateServiceInput = {
        name_ar: body.name_ar as string,
        name_en: body.name_en as string | undefined,
        description_ar: body.description_ar as string | undefined,
        description_en: body.description_en as string | undefined,
        icon: body.icon as string | undefined,
        image_url: body.image_url as string | undefined,
        base_price: body.base_price != null ? Number(body.base_price) : undefined,
        is_active: body.is_active as boolean | undefined,
        is_visible: body.is_visible as boolean | undefined,
        display_order: body.display_order != null ? Number(body.display_order) : undefined,
        features: body.features as Record<string, unknown> | undefined,
      };
      const result = await adminService.createService(input);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put<{ Params: { serviceId: string } }>(
    '/services/:serviceId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { serviceId } = request.params;
        const body = request.body as Record<string, unknown>;
        const input: adminService.UpdateServiceInput = {
          name_ar: body.name_ar as string | undefined,
          name_en: body.name_en as string | undefined,
          description_ar: body.description_ar as string | undefined,
          description_en: body.description_en as string | undefined,
          icon: body.icon as string | undefined,
          image_url: body.image_url as string | undefined,
          base_price: body.base_price != null ? Number(body.base_price) : undefined,
          is_active: body.is_active as boolean | undefined,
          is_visible: body.is_visible as boolean | undefined,
          display_order: body.display_order != null ? Number(body.display_order) : undefined,
          features: body.features as Record<string, unknown> | undefined,
        };
        await adminService.updateService(serviceId, input);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.delete<{ Params: { serviceId: string } }>(
    '/services/:serviceId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { serviceId } = request.params;
        await adminService.deleteService(serviceId);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.post('/services/cleanup-duplicates', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.cleanupDuplicateServices();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/services/import-legacy', { preHandler: adminPreHandler }, async (_request, reply) => {
    try {
      const result = await importLegacyServicesSeed();
      return { success: true, ...result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  // ─── Works (prefix: /works) ─────────────────────────────────────────────────
  app.get('/works/all', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const works = await adminService.getAllWorks();
      return { works };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/works', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: adminService.CreateWorkInput = {
        title: body.title as string,
        title_ar: body.title_ar as string | undefined,
        description: body.description as string | undefined,
        description_ar: body.description_ar as string | undefined,
        image_url: body.image_url as string,
        images: Array.isArray(body.images) ? (body.images as string[]) : undefined,
        category: body.category as string | undefined,
        category_ar: body.category_ar as string | undefined,
        is_featured: body.is_featured as boolean | undefined,
        is_visible: body.is_visible as boolean | undefined,
        display_order: body.display_order != null ? Number(body.display_order) : undefined,
      };
      const result = await adminService.createWork(input);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put<{ Params: { workId: string } }>(
    '/works/:workId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { workId } = request.params;
        const body = request.body as Record<string, unknown>;
        const input: adminService.UpdateWorkInput = {
          title: body.title as string | undefined,
          title_ar: body.title_ar as string | undefined,
          description: body.description as string | undefined,
          description_ar: body.description_ar as string | undefined,
          image_url: body.image_url as string | undefined,
          images: Array.isArray(body.images) ? (body.images as string[]) : undefined,
          category: body.category as string | undefined,
          category_ar: body.category_ar as string | undefined,
          is_featured: body.is_featured as boolean | undefined,
          is_visible: body.is_visible as boolean | undefined,
          display_order: body.display_order != null ? Number(body.display_order) : undefined,
        };
        await adminService.updateWork(workId, input);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.delete<{ Params: { workId: string } }>(
    '/works/:workId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { workId } = request.params;
        await adminService.deleteWork(workId);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { workId: string } }>(
    '/works/:workId/images',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { workId } = request.params;
        const body = request.body as { images: string[] };
        if (!Array.isArray(body.images)) {
          return reply.code(400).send({ detail: 'يجب إرسال مصفوفة images' });
        }
        await adminService.updateWorkImages(workId, body.images);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.post('/works/import-legacy-once', { preHandler: adminPreHandler }, async (_request, reply) => {
    try {
      const result = await adminService.importLegacyWorksOnce();
      return { success: true, ...result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  // ─── Orders (prefix: /orders) ─────────────────────────────────────────────
  // More specific routes first
  app.get('/orders/all', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as {
        status?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
        page?: string;
        limit?: string;
      };
      const filters: adminService.OrderListFilters = {
        status: query.status,
        date_from: query.date_from,
        date_to: query.date_to,
        search: query.search,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
      };
      const result = await adminService.getAllOrders(filters);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { orderNumber: string } }>(
    '/orders/verify/:orderNumber',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderNumber } = request.params;
        const order = await adminService.verifyOrder(orderNumber);
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

  app.get('/orders/archive/daily', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { page?: string; limit?: string };
      const result = await adminService.getDailyArchive(
        query.page ? parseInt(query.page, 10) : 1,
        query.limit ? parseInt(query.limit, 10) : 20,
      );
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/orders/archive/monthly', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { page?: string; limit?: string };
      const result = await adminService.getMonthlyArchive(
        query.page ? parseInt(query.page, 10) : 1,
        query.limit ? parseInt(query.limit, 10) : 20,
      );
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/orders/archive/dates', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.getArchiveDates();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/orders/archive/daily-move', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as { days?: number };
      const result = await adminService.dailyArchiveMove(body.days ?? 30);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/orders/archive/monthly-move', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.monthlyArchiveMove();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.delete('/orders/bulk/delete-by-status', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { status?: string };
      if (!query.status) {
        return reply.code(400).send({ detail: 'يجب تحديد status' });
      }
      const result = await adminService.bulkDeleteByStatus(query.status);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { orderId: string } }>(
    '/orders/:orderId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const order = await adminService.getOrderById(orderId);
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

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/status',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as { status: string; notes?: string };
        if (!body.status) {
          return reply.code(400).send({ detail: 'يجب تحديد status' });
        }
        await adminService.updateOrderStatus(
          orderId,
          body.status,
          body.notes,
          request.user?.id,
        );
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/rating',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as { rating: number; rating_comment?: string };
        if (body.rating == null) {
          return reply.code(400).send({ detail: 'يجب تحديد rating' });
        }
        await adminService.updateOrderRating(orderId, body.rating, body.rating_comment);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/delivery-coordinates',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as { latitude: number; longitude: number };
        if (body.latitude == null || body.longitude == null) {
          return reply.code(400).send({ detail: 'يجب تحديد latitude و longitude' });
        }
        await adminService.updateDeliveryCoordinates(orderId, body.latitude, body.longitude);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.delete<{ Params: { orderId: string } }>(
    '/orders/:orderId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        await adminService.deleteOrder(orderId);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/staff-notes',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as { staff_notes: string };
        await adminService.updateStaffNotes(orderId, body.staff_notes ?? '');
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/paid',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as { is_paid: boolean; paid_amount?: number };
        await adminService.updatePaidStatus(
          orderId,
          body.is_paid ?? false,
          body.paid_amount,
        );
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { orderId: string } }>(
    '/orders/:orderId/payment',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const body = request.body as adminService.UpdatePaymentInput;
        await adminService.updatePayment(orderId, body);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  // ─── Dashboard (prefix: /dashboard) ─────────────────────────────────────────
  app.get('/dashboard/stats', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.getDashboardStats();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/dashboard/performance-stats', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.getPerformanceStats();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/dashboard/top-products', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const result = await adminService.getTopProducts(query.limit ? parseInt(query.limit, 10) : 10);
      return { products: result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/dashboard/top-services', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const result = await adminService.getTopServices(query.limit ? parseInt(query.limit, 10) : 10);
      return { services: result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/dashboard/sales-overview', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { days?: string };
      const result = await adminService.getSalesOverview(query.days ? parseInt(query.days, 10) : 30);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/dashboard/recent-orders', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const result = await adminService.getRecentOrders(query.limit ? parseInt(query.limit, 10) : 10);
      return { orders: result };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  // ─── Customers ─────────────────────────────────────────────────────────────
  app.get('/customers', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const customers = await adminService.getAllCustomers();
      return { customers };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { phone: string } }>(
    '/customers/:phone',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { phone } = request.params;
        const customer = await adminService.getCustomerByPhone(phone);
        if (!customer) {
          return reply.code(404).send({ detail: 'العميل غير موجود' });
        }
        return customer;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.put<{ Params: { phone: string } }>(
    '/customers/:phone/notes',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { phone } = request.params;
        const body = request.body as { notes: string };
        await adminService.updateCustomerNotes(phone, body.notes ?? '');
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  // ─── Payment Settings ──────────────────────────────────────────────────────
  app.get('/payment-settings', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const settings = await adminService.getPaymentSettings();
      return { settings };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/payment-settings', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>;
      const input: adminService.CreatePaymentSettingsInput = {
        payment_method: body.payment_method as string,
        account_name: body.account_name as string | undefined,
        account_number: body.account_number as string | undefined,
        phone_number: body.phone_number as string | undefined,
        api_key: body.api_key as string | undefined,
        api_secret: body.api_secret as string | undefined,
        is_active: body.is_active as boolean | undefined,
      };
      const result = await adminService.createPaymentSettings(input);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put<{ Params: { settingsId: string } }>(
    '/payment-settings/:settingsId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      try {
        const { settingsId } = request.params;
        const body = request.body as Record<string, unknown>;
        const input: adminService.UpdatePaymentSettingsInput = {
          payment_method: body.payment_method as string | undefined,
          account_name: body.account_name as string | undefined,
          account_number: body.account_number as string | undefined,
          phone_number: body.phone_number as string | undefined,
          api_key: body.api_key as string | undefined,
          api_secret: body.api_secret as string | undefined,
          is_active: body.is_active as boolean | undefined,
        };
        await adminService.updatePaymentSettings(settingsId, input);
        return { success: true };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  // ─── Upload ────────────────────────────────────────────────────────────────
  app.post('/upload', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      const query = request.query as { subdir?: 'products' | 'general' };
      const result = await adminService.uploadImage(
        {
          filename: data.filename,
          file: data.file,
          mimetype: data.mimetype,
        },
        query.subdir ?? 'general',
      );
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/upload/multiple', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const files: Array<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }> = [];
      const parts = request.files();
      for await (const part of parts) {
        if (part.file) {
          files.push({
            filename: part.filename,
            file: part.file,
            mimetype: part.mimetype ?? 'application/octet-stream',
          });
        }
      }
      if (files.length === 0) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملفات' });
      }
      const query = request.query as { subdir?: 'products' | 'general' };
      const result = await adminService.uploadMultipleImages(files, query.subdir ?? 'general');
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/upload/by-url', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = request.body as { url: string; subdir?: 'products' | 'general' };
      if (!body.url) {
        return reply.code(400).send({ detail: 'يجب تحديد url' });
      }
      const result = await adminService.uploadByUrl(body.url, body.subdir ?? 'general');
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  // ─── Maintenance ───────────────────────────────────────────────────────────
  app.post('/maintenance/normalize-images', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const result = await adminService.normalizeImages();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
