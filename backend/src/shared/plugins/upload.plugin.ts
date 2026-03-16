/**
 * رفع الملفات: التسلسل هو
 * 1. تهيئة الملفات للرفع (العميل يجهّز multipart/form-data)
 * 2. فحص الملفات للتأكد من الخلو من الفيروسات/الهجمات (مرحلة لاحقة، مثلاً ClamAV على الخادم)
 * 3. رفع الملفات للسيرفر (استقبال الـ stream، التحقق من الامتداد والحجم والتوقيع، ثم الحفظ)
 */
import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { config } from '../../config/index.js';
import { createId } from '../utils/nanoid.js';
import { validateMagicBytes, compressImage, getFileSizeLimit } from '../utils/file-validation.js';
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_REQUEST } from '../upload/upload.constants.js';

function createSizeLimitStream(maxBytes: number): Transform {
  let total = 0;
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      total += chunk.length;
      if (total > maxBytes) {
        cb(new Error(`حجم الملف يتجاوز الحد المسموح (${Math.round(maxBytes / 1024 / 1024)}MB)`));
        return;
      }
      cb(null, chunk);
    },
  });
}

const UPLOAD_DIR = config.uploadDir;

/** مسموح به: مستندات (PDF, Word, Excel, PowerPoint)، صور (png, jpg, jpeg, webp, gif, svg)، تصميم (ai, psd, eps)، أوتوكاد (dwg, dxf) */
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx',
  '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.svg', '.ai', '.psd', '.eps',
  '.dwg', '.dxf',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
]);

/** امتدادات مسموحة في الاستديو: صور + تصميم + PDF */
const STUDIO_ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.psd', '.pdf', '.ai', '.eps',
]);

const COMPRESSIBLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function saveUploadedFile(
  file: { filename: string; file: NodeJS.ReadableStream; mimetype: string },
  subDir: string,
): Promise<UploadedFile> {
  const ext = extname(file.filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`نوع الملف غير مسموح: ${ext}`);
  }

  const targetDir = join(UPLOAD_DIR, subDir);
  await ensureDir(targetDir);

  const sizeLimit = getFileSizeLimit(ext);
  const safeName = `${createId()}${ext}`;
  const filePath = join(targetDir, safeName);

  const writeStream = createWriteStream(filePath);
  const limitStream = createSizeLimitStream(sizeLimit);
  try {
    await pipeline(file.file, limitStream, writeStream);
  } catch (err) {
    const { unlink } = await import('node:fs/promises');
    await unlink(filePath).catch(() => {});
    throw err;
  }
  const size = writeStream.bytesWritten;

  const magicValid = await validateMagicBytes(filePath, ext);
  if (!magicValid) {
    const { unlink } = await import('node:fs/promises');
    await unlink(filePath).catch(() => {});
    throw new Error('محتوى الملف لا يتطابق مع نوعه — الملف قد يكون تالفاً أو مزيّفاً');
  }

  let displayUrl = `/uploads/${subDir}/${safeName}`;
  let thumbnailUrl: string | undefined;
  if (COMPRESSIBLE_EXTENSIONS.has(ext)) {
    try {
      const compressedName = `${createId()}.webp`;
      const compressedPath = join(targetDir, compressedName);
      const result = await compressImage(filePath, compressedPath);
      if (result.compressed) {
        const compressedUrl = `/uploads/${subDir}/${compressedName}`;
        thumbnailUrl = compressedUrl;
        displayUrl = compressedUrl;
      }
    } catch {
      // compression is optional — keep original as display
    }
  }

  return {
    filename: safeName,
    originalName: file.filename,
    path: filePath,
    url: displayUrl,
    mimeType: file.mimetype,
    size,
    thumbnailUrl,
  };
}

export function isImageFile(filename: string): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.has(extname(filename).toLowerCase());
}

export function isStudioAllowedFile(filename: string): boolean {
  return STUDIO_ALLOWED_EXTENSIONS.has(extname(filename).toLowerCase());
}

export async function uploadPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: MAX_FILES_PER_REQUEST,
    },
  });
}
