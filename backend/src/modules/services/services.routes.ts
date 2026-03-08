import type { FastifyInstance } from 'fastify';
import * as servicesService from './services.service.js';

export async function servicesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async () => {
    return servicesService.getServices();
  });

  app.get('/debug/all', async () => {
    return servicesService.getAllServices();
  });

  app.post('/clear-cache', async () => {
    servicesService.clearServicesCache();
    return { success: true, message: 'تم مسح الكاش بنجاح' };
  });

  app.post('/fix-visibility', async () => {
    return servicesService.fixVisibility();
  });

  app.post('/ensure-default-services', async () => {
    return servicesService.ensureDefaultServices();
  });
}
