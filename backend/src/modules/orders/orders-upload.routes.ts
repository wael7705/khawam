/**
 * مسارات رفع ملفات الطلبات.
 * نستخدم الطلب الخام (request.raw) + busboy لتحليل multipart مباشرة
 * لتجنب 415 عندما الـ proxy يغيّر الهيدرات أو عندما لا يطابق محلل Fastify.
 * عند غياب Content-Type نكتشف multipart من أول بايتات الجسم (fallback).
 */
import type { FastifyInstance } from 'fastify';
import { PassThrough } from 'node:stream';
import Busboy from 'busboy';
import * as ordersService from './orders.service.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PEEK_SIZE = 512;
const PEEK_TIMEOUT_MS = 5000;

/** قراءة أول PEEK_SIZE بايت من الـ stream ثم إرجاع البافر + stream يصدّر (الجزء المقروء + الباقي) */
function peekThenStream(raw: NodeJS.ReadableStream): Promise<{ buffer: Buffer; combined: NodeJS.ReadableStream }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let length = 0;
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      raw.removeListener('data', onData);
      raw.removeListener('error', onError);
      raw.removeListener('end', onEnd);
      fn();
    };
    const timer = setTimeout(() => {
      settle(() => reject(new Error('PEEK_TIMEOUT')));
    }, PEEK_TIMEOUT_MS);
    const finish = (buffer: Buffer, overflow: Buffer | null) => {
      settle(() => {
        const combined = new PassThrough();
        combined.write(buffer);
        if (overflow && overflow.length > 0) combined.write(overflow);
        (raw as NodeJS.ReadableStream).pipe(combined);
        resolve({ buffer, combined });
      });
    };
    const onData = (chunk: Buffer | string) => {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(b);
      length += b.length;
      if (length >= PEEK_SIZE) {
        const full = Buffer.concat(chunks);
        const buffer = full.subarray(0, PEEK_SIZE);
        const overflow = full.length > PEEK_SIZE ? full.subarray(PEEK_SIZE) : null;
        finish(buffer, overflow);
      }
    };
    const onError = (err: Error) => settle(() => reject(err));
    const onEnd = () => {
      settle(() => {
        const buffer = Buffer.concat(chunks);
        const combined = new PassThrough();
        combined.write(buffer);
        combined.end();
        resolve({ buffer, combined });
      });
    };
    raw.on('data', onData);
    raw.on('error', onError);
    raw.on('end', onEnd);
  });
}

/** استخراج boundary من أول سطر في جسم multipart (يبدأ بـ --) */
function extractBoundaryFromBody(peek: Buffer): string | null {
  const firstNewline = peek.indexOf('\n');
  const firstLine = firstNewline >= 0 ? peek.subarray(0, firstNewline) : peek;
  const line = firstLine.toString('utf8').replace(/\r$/, '').trim();
  if (!line.startsWith('--')) return null;
  const boundary = line.slice(2).trim();
  return boundary.length > 0 ? boundary : null;
}

function parseFirstFileFromRaw(
  raw: NodeJS.ReadableStream,
  headers: Record<string, string | string[] | undefined>,
): Promise<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }> {
  return new Promise((resolve, reject) => {
    let contentType: string = '';
    const ct = headers['content-type'];
    const ctStr = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    if (ctStr && ctStr.toLowerCase().includes('multipart')) {
      contentType = ctStr;
    }
    const streamToUse = raw;
    const headersForBusboy = { ...headers, 'content-type': contentType || 'application/octet-stream' };

    const busboy = Busboy({
      headers: contentType ? headersForBusboy : { ...headersForBusboy, 'content-type': 'application/octet-stream' },
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
    if (contentType) {
      (streamToUse as NodeJS.ReadableStream).pipe(busboy);
      return;
    }
    reject(new Error('MISSING_MULTIPART'));
  });
}

/** مثل parseFirstFileFromRaw لكن يقبل stream + contentType جاهز (بعد اكتشاف boundary من الجسم) */
function parseFirstFileWithContentType(
  combined: NodeJS.ReadableStream,
  contentType: string,
  headers: Record<string, string | string[] | undefined>,
): Promise<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }> {
  return new Promise((resolve, reject) => {
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
    (combined as NodeJS.ReadableStream).pipe(busboy);
  });
}

export async function ordersUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/orders/upload', async (request, reply) => {
    const raw = request.raw;
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v !== undefined) headers[k.toLowerCase()] = v;
    }
    // تسجيل الهيدرات للتشخيص (خصوصاً عند 415 خلف الـ proxy)
    const contentTypeReceived = request.headers['content-type'];
    request.log.info(
      { path: '/api/orders/upload', contentType: contentTypeReceived, hasRaw: !!raw },
      'orders/upload: request received',
    );

    let part: { filename: string; file: NodeJS.ReadableStream; mimetype: string };
    const ct = headers['content-type'];
    const contentType = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    const hasMultipart = !!contentType && contentType.toLowerCase().includes('multipart');

    try {
      if (hasMultipart) {
        part = await parseFirstFileFromRaw(raw, headers);
      } else {
        // Fallback: اكتشاف multipart من أول بايتات الجسم (عندما الـ proxy يحذف/يغيّر Content-Type)
        (raw as NodeJS.ReadableStream).resume?.();
        const { buffer, combined } = await peekThenStream(raw);
        const boundary = extractBoundaryFromBody(buffer);
        if (!boundary || !buffer.subarray(0, 2).toString('utf8').startsWith('--')) {
          request.log.warn({ contentType: contentTypeReceived }, 'orders/upload: missing or non-multipart Content-Type and body not multipart');
          return reply.code(415).send({
            detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً في المتصفح.',
          });
        }
        const syntheticContentType = `multipart/form-data; boundary=${boundary}`;
        request.log.info({ syntheticContentType }, 'orders/upload: using boundary from body (fallback)');
        part = await parseFirstFileWithContentType(combined, syntheticContentType, headers);
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'MISSING_MULTIPART') {
        request.log.warn({ contentType: contentTypeReceived }, 'orders/upload: missing or non-multipart Content-Type');
        return reply.code(415).send({
          detail: 'ارسل الطلب كـ multipart/form-data بحقل "file". لا تعيّن Content-Type يدوياً في المتصفح.',
        });
      }
      if (msg === 'PEEK_TIMEOUT') {
        request.log.warn({ contentType: contentTypeReceived }, 'orders/upload: body stream timeout (empty or already consumed)');
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
