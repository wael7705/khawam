/**
 * مسارات رفع ملفات الطلبات — تُسجّل على نفس الـ app الذي عليه multipart (الجذر)
 * لتجنب 415 خلف الـ proxy (Railway) بسبب encapsulation.
 */
import type { FastifyInstance } from 'fastify';
import * as ordersService from './orders.service.js';

function isMultipart(request: { headers: { 'content-type'?: string } }): boolean {
  const ct = request.headers['content-type'];
  return typeof ct === 'string' && ct.toLowerCase().trimStart().startsWith('multipart/form-data');
}

export async function ordersUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/orders/upload', async (request, reply) => {
    let part: { filename: string; file: NodeJS.ReadableStream; mimetype: string } | undefined;
    try {
      const data = await request.file();
      part = data ? { filename: data.filename, file: data.file, mimetype: data.mimetype } : undefined;
    } catch {
      return reply.code(415).send({
        detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
      });
    }
    if (!part) {
      if (!isMultipart(request)) {
        return reply.code(415).send({
          detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
        });
      }
      return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
    }
    try {
      const result = await ordersService.uploadOrderFile({
        filename: part.filename,
        file: part.file,
        mimetype: part.mimetype,
      });
      return result;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      return reply.code(400).send({ detail: msg ?? 'فشل رفع الملف' });
    }
  });

  app.post('/api/orders/upload-batch', async (request, reply) => {
    const results: Awaited<ReturnType<typeof ordersService.uploadOrderFile>>[] = [];
    try {
      const parts = request.files();
      for await (const part of parts) {
        const result = await ordersService.uploadOrderFile({
          filename: part.filename,
          file: part.file,
          mimetype: part.mimetype,
        });
        results.push(result);
      }
    } catch {
      return reply.code(415).send({
        detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
      });
    }
    if (results.length === 0) {
      if (!isMultipart(request)) {
        return reply.code(415).send({
          detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
        });
      }
      return reply.code(400).send({ detail: 'لم يتم إرسال أي ملفات' });
    }
    return { files: results };
  });
}
