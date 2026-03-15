/**
 * مسارات رفع ملفات الطلبات: استخدام الطلب الخام (request.raw) + busboy فقط.
 * لا نعتمد على محلل multipart في Fastify — يعمل حتى لو البروكسي (مثل Railway) غيّر أو حذف Content-Type.
 */
import type { FastifyInstance } from 'fastify';
import { PassThrough } from 'node:stream';
import Busboy from 'busboy';
import { UPLOAD_FIELD_NAME } from '../../shared/upload/upload.constants.js';
import * as ordersService from './orders.service.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PEEK_SIZE = 512;
const PEEK_TIMEOUT_MS = 8000;

function readFirstChunk(raw: NodeJS.ReadableStream): Promise<{ buffer: Buffer; rest: NodeJS.ReadableStream }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let len = 0;
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      raw.removeListener('data', onData);
      raw.removeListener('error', onError);
      raw.removeListener('end', onEnd);
      reject(new Error('PEEK_TIMEOUT'));
    }, PEEK_TIMEOUT_MS);
    const onData = (chunk: Buffer | string) => {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(b);
      len += b.length;
      if (len >= PEEK_SIZE) {
        done = true;
        clearTimeout(t);
        raw.removeListener('data', onData);
        raw.removeListener('error', onError);
        raw.removeListener('end', onEnd);
        const full = Buffer.concat(chunks);
        const buffer = full.subarray(0, PEEK_SIZE);
        const overflow = full.length > PEEK_SIZE ? full.subarray(PEEK_SIZE) : null;
        const rest = new PassThrough();
        rest.write(buffer);
        if (overflow && overflow.length > 0) rest.write(overflow);
        (raw as NodeJS.ReadableStream).pipe(rest);
        resolve({ buffer, rest });
      }
    };
    const onError = (e: Error) => {
      if (!done) {
        done = true;
        clearTimeout(t);
        reject(e);
      }
    };
    const onEnd = () => {
      if (!done) {
        done = true;
        clearTimeout(t);
        raw.removeListener('data', onData);
        raw.removeListener('error', onError);
        const buffer = Buffer.concat(chunks);
        const rest = new PassThrough();
        rest.write(buffer);
        rest.end();
        resolve({ buffer, rest });
      }
    };
    (raw as NodeJS.ReadableStream).resume?.();
    raw.on('data', onData);
    raw.on('error', onError);
    raw.on('end', onEnd);
  });
}

function getBoundaryFromPeek(peek: Buffer): string | null {
  const i = peek.indexOf('\n');
  const line = (i >= 0 ? peek.subarray(0, i) : peek).toString('utf8').replace(/\r$/, '').trim();
  if (!line.startsWith('--')) return null;
  const b = line.slice(2).trim();
  return b.length ? b : null;
}

function parseOneFile(
  stream: NodeJS.ReadableStream,
  contentType: string,
  headers: Record<string, string | string[] | undefined>,
): Promise<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: { ...headers, 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE },
    });
    let resolved = false;
    bb.on('file', (name: string, s: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      if (resolved) {
        s.resume();
        return;
      }
      resolved = true;
      resolve({
        filename: info.filename ?? 'upload',
        file: s,
        mimetype: info.mimeType ?? 'application/octet-stream',
      });
    });
    bb.on('error', (e) => {
      if (!resolved) {
        resolved = true;
        reject(e);
      }
    });
    bb.on('finish', () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('NO_FILE'));
      }
    });
    (stream as NodeJS.ReadableStream).pipe(bb);
  });
}

function getBodyStream(request: { body: unknown; raw: unknown }): NodeJS.ReadableStream {
  const b = request.body;
  if (b && typeof (b as NodeJS.ReadableStream & { pipe?: unknown }).pipe === 'function') {
    return b as NodeJS.ReadableStream;
  }
  return request.raw as NodeJS.ReadableStream;
}

export async function ordersUploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/orders/upload', async (request, reply) => {
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v !== undefined) headers[k.toLowerCase()] = v;
    }
    const ct = headers['content-type'];
    const ctStr = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    const hasMultipart = !!ctStr && ctStr.toLowerCase().includes('multipart/form-data');

    let stream = getBodyStream(request);
    let contentType = ctStr;

    if (!hasMultipart) {
      try {
        const { buffer, rest } = await readFirstChunk(stream);
        stream = rest;
        const boundary = getBoundaryFromPeek(buffer);
        if (!boundary || !buffer.subarray(0, 2).toString('utf8').startsWith('--')) {
          return reply.code(415).send({
            detail: 'ارسل الطلب كـ multipart/form-data بحقل "file".',
          });
        }
        contentType = `multipart/form-data; boundary=${boundary}`;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === 'PEEK_TIMEOUT') {
          return reply.code(415).send({
            detail: 'ارسل الطلب كـ multipart/form-data بحقل "file".',
          });
        }
        throw e;
      }
    }

    try {
      const part = await parseOneFile(stream, contentType, headers);
      if (part.filename === 'upload' && !part.file) {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      const result = await ordersService.uploadOrderFile({
        filename: part.filename,
        file: part.file,
        mimetype: part.mimetype,
      });
      return result;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'NO_FILE') {
        return reply.code(400).send({ detail: 'لم يتم إرسال ملف' });
      }
      return reply.code(400).send({ detail: msg ?? 'فشل رفع الملف' });
    }
  });

  app.post('/orders/upload-batch', async (request, reply) => {
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v !== undefined) headers[k.toLowerCase()] = v;
    }
    const ct = headers['content-type'];
    let ctStr = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
    let stream: NodeJS.ReadableStream = getBodyStream(request);

    if (!ctStr || !ctStr.toLowerCase().includes('multipart/form-data')) {
      try {
        const { buffer, rest } = await readFirstChunk(raw);
        stream = rest;
        const boundary = getBoundaryFromPeek(buffer);
        if (!boundary) {
          return reply.code(415).send({
            detail: 'ارسل الطلب كـ multipart/form-data بحقل "file".',
          });
        }
        ctStr = `multipart/form-data; boundary=${boundary}`;
      } catch {
        return reply.code(415).send({
          detail: 'ارسل الطلب كـ multipart/form-data بحقل "file".',
        });
      }
    }

    const results: Awaited<ReturnType<typeof ordersService.uploadOrderFile>>[] = [];
    const bb = Busboy({
      headers: { ...headers, 'content-type': ctStr },
      limits: { fileSize: MAX_FILE_SIZE },
    });
    const promises: Promise<void>[] = [];
    bb.on('file', (name: string, s: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      if (name !== UPLOAD_FIELD_NAME) {
        s.resume();
        return;
      }
      const p = ordersService
        .uploadOrderFile({
          filename: info.filename ?? 'upload',
          file: s,
          mimetype: info.mimeType ?? 'application/octet-stream',
        })
        .then((r) => {
          results.push(r);
        });
      promises.push(p);
    });
    const finish = new Promise<void>((resolve, reject) => {
      bb.on('finish', resolve);
      bb.on('error', reject);
    });
    stream.pipe(bb);
    await finish;
    await Promise.all(promises);
    if (results.length === 0) {
      return reply.code(400).send({ detail: 'لم يتم إرسال أي ملفات' });
    }
    return { files: results };
  });
}
