import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createId } from '../../shared/utils/nanoid.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isImageFile } from '../../shared/plugins/upload.plugin.js';
import * as studioService from './studio.service.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const STUDIO_TEMP_DIR = 'studio/temp';

async function getUploadedFilePath(request: FastifyRequest): Promise<string> {
  const data = await request.file();
  if (!data) {
    throw new Error('لم يتم رفع أي ملف');
  }

  const filename = data.filename ?? '';
  if (!isImageFile(filename)) {
    throw new Error('نوع الملف غير مسموح. يرجى رفع صورة (jpg, png, webp, gif)');
  }

  const ext = filename.toLowerCase().includes('.') ? filename.slice(filename.lastIndexOf('.')) : '.png';
  await mkdir(join(UPLOAD_DIR, STUDIO_TEMP_DIR), { recursive: true });
  const safeName = `${createId()}${ext}`;
  const filePath = join(UPLOAD_DIR, STUDIO_TEMP_DIR, safeName);
  await pipeline(data.file, createWriteStream(filePath));
  return filePath;
}

export async function studioRoutes(app: FastifyInstance): Promise<void> {
  app.post('/remove-background', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const filePath = await getUploadedFilePath(request);
      const resultPath = await studioService.removeBackground(filePath);
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });

  app.post('/passport-photos', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const filePath = await getUploadedFilePath(request);
      const resultPath = await studioService.createPassportPhotos(filePath);
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });

  app.post<{
    Querystring: {
      left?: string;
      top?: string;
      width?: string;
      height?: string;
      rotate?: string;
    };
  }>('/crop-rotate', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const filePath = await getUploadedFilePath(request);
      const q = request.query ?? {};
      const options = {
        left: Number(q.left) || 0,
        top: Number(q.top) || 0,
        width: Number(q.width) || 100,
        height: Number(q.height) || 100,
        rotate: Number(q.rotate) || 0,
      };
      const resultPath = await studioService.cropRotate(filePath, options);
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });

  app.post<{
    Querystring: { dpi?: string };
  }>('/add-dpi', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const filePath = await getUploadedFilePath(request);
      const q = request.query ?? {};
      const dpi = Number(q.dpi) || 300;
      const resultPath = await studioService.addDpi(filePath, { dpi });
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });

  app.post<{
    Querystring: { filter?: string; blurSigma?: string };
  }>('/apply-filter', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const filePath = await getUploadedFilePath(request);
      const q = request.query ?? {};
      const filter = (q.filter ?? 'grayscale') as studioService.FilterType;
      if (!['grayscale', 'sepia', 'blur'].includes(filter)) {
        return reply.code(400).send({ detail: 'فلتر غير صالح' });
      }
      const resultPath = await studioService.applyFilter(filePath, {
        filter,
        blurSigma: q.blurSigma ? Number(q.blurSigma) : undefined,
      });
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });
}
