/**
 * مسارات رفع ملفات الطلبات.
 * نستخدم الطلب الخام (request.raw) + busboy لتحليل multipart مباشرة
 * لتجنب 415 عندما الـ proxy يغيّر الهيدرات أو عندما لا يطابق محلل Fastify.
 */
import type { FastifyInstance } from 'fastify';
import Busboy from 'busboy';
import * as ordersService from './orders.service.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function parseFirstFileFromRaw(
  raw: NodeJS.ReadableStream,
  headers: Record<string, string | string[] | undefined>,
): Promise<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const ct = headers['content-type'];
    const contentType = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    if (!contentType || !contentType.toLowerCase().includes('multipart')) {
      reject(new Error('MISSING_MULTIPART'));
      return;
    }
    const busboy = Busboy({
      headers: { ...headers, 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE },
    });
    let resolved = false;
    busboy.on('file', (_name: string, stream: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      if (resolved) {
        stream.resume();
        return;
      }
      resolved = true;
      resolve({
        filename: info.filename ?? 'upload',
        file: stream,
        mimetype: info.mimeType ?? 'application/octet-stream',
      });
    });
    busboy.on('error', (err: Error) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
    busboy.on('finish', () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('NO_FILE'));
      }
    });
    (raw as NodeJS.ReadableStream).pipe(busboy);
  });
}

export async function ordersUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/orders/upload', async (request, reply) => {
    const raw = request.raw;
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v !== undefined) headers[k.toLowerCase()] = v;
    }
    let part: { filename: string; file: NodeJS.ReadableStream; mimetype: string };
    try {
      part = await parseFirstFileFromRaw(raw, headers);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'MISSING_MULTIPART') {
        request.log.warn({ contentType: request.headers['content-type'] }, 'orders/upload: missing or non-multipart Content-Type');
        return reply.code(415).send({
          detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً في المتصفح.',
        });
      }
      if (msg === 'NO_FILE') {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      request.log.warn({ err }, 'orders/upload: busboy parse failed');
      return reply.code(415).send({
        detail: 'تعذر قراءة الطلب كـ multipart. تأكد من عدم تعيين Content-Type يدوياً.',
      });
    }
    try {
      const result = await ordersService.uploadOrderFile({
        filename: part.filename,
        file: part.file,
        mimetype: part.mimetype,
      });
      return result;
    } catch (err: unknown) {
      const message = (err as { message?: string }).message;
      return reply.code(400).send({ detail: message ?? 'فشل رفع الملف' });
    }
  });

  app.post('/api/orders/upload-batch', async (request, reply) => {
    const raw = request.raw;
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v !== undefined) headers[k.toLowerCase()] = v;
    }
    const ct = headers['content-type'];
    const contentType = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    if (!contentType || !contentType.toLowerCase().includes('multipart')) {
      return reply.code(415).send({
        detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً.',
      });
    }
    const results: Awaited<ReturnType<typeof ordersService.uploadOrderFile>>[] = [];
    const busboy = Busboy({
      headers: { ...headers, 'content-type': contentType },
      limits: { fileSize: 50 * 1024 * 1024 },
    });
    const filePromises: Promise<void>[] = [];
    busboy.on('file', (_name: string, stream: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      const filename = info.filename ?? 'upload';
      const mimetype = info.mimeType ?? 'application/octet-stream';
      const p = ordersService
        .uploadOrderFile({ filename, file: stream, mimetype })
        .then((r) => {
          results.push(r);
        })
        .catch((e: unknown) => {
          throw e;
        });
      filePromises.push(p);
    });
    const finished = new Promise<void>((resolve, reject) => {
      busboy.on('finish', resolve);
      busboy.on('error', reject);
    });
    (raw as NodeJS.ReadableStream).pipe(busboy);
    await finished;
    await Promise.all(filePromises);
    if (results.length === 0) {
      return reply.code(400).send({ detail: 'لم يتم إرسال أي ملفات' });
    }
    return { files: results };
  });
}
