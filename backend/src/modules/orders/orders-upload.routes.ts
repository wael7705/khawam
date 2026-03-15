/**
 * مسارات رفع ملفات الطلبات.
 * تستخدم @fastify/multipart (request.file / request.files) — محلل واحد على الجذر دون تعارض.
 */
import type { FastifyInstance } from 'fastify';
import { UPLOAD_FIELD_NAME } from '../../shared/upload/upload.constants.js';
import * as ordersService from './orders.service.js';

function isMultipartRequest(request: { headers: { [key: string]: string | string[] | undefined } }): boolean {
  const ct = request.headers['content-type'];
  const s = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
  return !!s && s.toLowerCase().includes('multipart/form-data');
}

export async function ordersUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/orders/upload', async (request, reply) => {
    if (!isMultipartRequest(request)) {
      return reply.code(415).send({
        detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً في المتصفح.',
      });
    }
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      const fieldname = data.fieldname;
      if (fieldname !== UPLOAD_FIELD_NAME) {
        return reply.code(400).send({
          detail: `استخدم حقل الرفع "${UPLOAD_FIELD_NAME}" فقط.`,
        });
      }
      const result = await ordersService.uploadOrderFile({
        filename: data.filename ?? 'upload',
        file: data.file,
        mimetype: data.mimetype,
      });
      return result;
    } catch (err: unknown) {
      const message = (err as { message?: string }).message;
      return reply.code(400).send({ detail: message ?? 'فشل رفع الملف' });
    }
  });

  app.post('/api/orders/upload-batch', async (request, reply) => {
    if (!isMultipartRequest(request)) {
      return reply.code(415).send({
        detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
      });
    }
    const results: Awaited<ReturnType<typeof ordersService.uploadOrderFile>>[] = [];
    try {
      const parts = request.files();
      for await (const part of parts) {
        if (part.fieldname !== UPLOAD_FIELD_NAME || !part.file) {
          continue;
        }
        const result = await ordersService.uploadOrderFile({
          filename: part.filename ?? 'upload',
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
      const message = (err as { message?: string }).message;
      return reply.code(400).send({ detail: message ?? 'فشل رفع الملفات' });
    }
  });
}
