import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createId } from '../utils/nanoid.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx',
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.svg', '.ai', '.psd', '.eps',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
]);

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
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

  const safeName = `${createId()}${ext}`;
  const filePath = join(targetDir, safeName);

  const writeStream = createWriteStream(filePath);
  await pipeline(file.file, writeStream);

  const size = writeStream.bytesWritten;

  return {
    filename: safeName,
    originalName: file.filename,
    path: filePath,
    url: `/uploads/${subDir}/${safeName}`,
    mimeType: file.mimetype,
    size,
  };
}

export function isImageFile(filename: string): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.has(extname(filename).toLowerCase());
}

export async function uploadPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 10,
    },
  });
}
