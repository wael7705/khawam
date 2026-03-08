import type { FastifyInstance } from 'fastify';
import * as productsService from './products.service.js';

export async function productsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => {
    try {
      const products = await productsService.getProducts();
      return { products };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get<{ Params: { productId: string } }>('/:productId', async (request, reply) => {
    const { productId } = request.params;

    try {
      const product = await productsService.getProductById(productId);
      if (!product) {
        return reply.code(404).send({ detail: 'المنتج غير موجود' });
      }
      return product;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
