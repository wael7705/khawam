import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../../config/index.js';
import { createId } from '../../shared/utils/nanoid.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { isImageFile, isStudioAllowedFile } from '../../shared/plugins/upload.plugin.js';
import * as studioService from './studio.service.js';

const STUDIO_TEMP_DIR = 'studio/temp';

const STUDIO_ALLOWED_LIST = '.psd, .pdf, .ai, .eps, .png, .jpg, .jpeg, .webp, .gif, .svg';

async function getUploadedFile(request: FastifyRequest): Promise<{ filePath: string; filename: string }> {
  const data = await request.file();
  if (!data) {
    throw new Error('لم يتم رفع أي ملف');
  }

  const filename = data.filename ?? '';
  if (!isStudioAllowedFile(filename)) {
    throw new Error(`نوع الملف غير مسموح. المسموح: ${STUDIO_ALLOWED_LIST}`);
  }

  const ext = filename.toLowerCase().includes('.') ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '.png';
  await mkdir(join(config.uploadDir, STUDIO_TEMP_DIR), { recursive: true });
  const safeName = `${createId()}${ext}`;
  const filePath = join(config.uploadDir, STUDIO_TEMP_DIR, safeName);
  await pipeline(data.file, createWriteStream(filePath));
  return { filePath, filename };
}

export async function studioRoutes(app: FastifyInstance): Promise<void> {
  app.post('/remove-background', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { filePath, filename } = await getUploadedFile(request);
      if (!isImageFile(filename)) {
        return reply.code(400).send({ detail: 'هذه العملية تتطلب صورة (jpg, png, webp, gif, svg)' });
      }
      const resultPath = await studioService.removeBackground(filePath);
      return reply.send({ path: resultPath, url: resultPath });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.code(500).send({ detail: error.message });
    }
  });

  app.post<{ Querystring: { removeBgFirst?: string } }>('/passport-photos', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { filePath, filename } = await getUploadedFile(request);
      if (!isImageFile(filename)) {
        return reply.code(400).send({ detail: 'هذه العملية تتطلب صورة (jpg, png, webp, gif, svg)' });
      }
      const removeBgFirst = request.query?.removeBgFirst === 'true' || request.query?.removeBgFirst === '1';
      const resultPath = await studioService.createPassportPhotos(filePath, { removeBgFirst });
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
      const { filePath, filename } = await getUploadedFile(request);
      if (!isImageFile(filename)) {
        return reply.code(400).send({ detail: 'هذه العملية تتطلب صورة (jpg, png, webp, gif, svg)' });
      }
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
      const { filePath, filename } = await getUploadedFile(request);
      if (!isImageFile(filename)) {
        return reply.code(400).send({ detail: 'هذه العملية تتطلب صورة (jpg, png, webp, gif, svg)' });
      }
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
      const { filePath, filename } = await getUploadedFile(request);
      if (!isImageFile(filename)) {
        return reply.code(400).send({ detail: 'هذه العملية تتطلب صورة (jpg, png, webp, gif, svg)' });
      }
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
