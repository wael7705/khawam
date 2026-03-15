import { open, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import sharp from 'sharp';

const MAGIC_READ_LEN = 12;

const MAGIC_BYTES: Record<string, Buffer[]> = {
  '.pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
  '.jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  '.gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  '.webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
};

const SIZE_LIMITS: Record<string, number> = {
  '.jpg': 20 * 1024 * 1024,
  '.jpeg': 20 * 1024 * 1024,
  '.png': 20 * 1024 * 1024,
  '.gif': 20 * 1024 * 1024,
  '.webp': 20 * 1024 * 1024,
  '.svg': 10 * 1024 * 1024,
  '.pdf': 50 * 1024 * 1024,
  '.doc': 50 * 1024 * 1024,
  '.docx': 50 * 1024 * 1024,
  '.xls': 50 * 1024 * 1024,
  '.xlsx': 50 * 1024 * 1024,
  '.ppt': 50 * 1024 * 1024,
  '.pptx': 50 * 1024 * 1024,
  '.ai': 100 * 1024 * 1024,
  '.psd': 100 * 1024 * 1024,
  '.eps': 100 * 1024 * 1024,
  '.dwg': 100 * 1024 * 1024,
  '.dxf': 100 * 1024 * 1024,
};

const DEFAULT_LIMIT = 50 * 1024 * 1024;

export function getFileSizeLimit(ext: string): number {
  return SIZE_LIMITS[ext.toLowerCase()] ?? DEFAULT_LIMIT;
}

export async function validateMagicBytes(filePath: string, ext: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[ext.toLowerCase()];
  if (!signatures) return true;
  try {
    const fd = await open(filePath, 'r');
    const buf = Buffer.allocUnsafe(MAGIC_READ_LEN);
    const { bytesRead } = await fd.read(buf, 0, MAGIC_READ_LEN, 0);
    await fd.close();
    if (bytesRead < MAGIC_READ_LEN) return false;
    const header = buf.subarray(0, bytesRead);
    return signatures.some((sig) =>
      sig.every((byte, i) => header[i] === byte),
    );
  } catch {
    return false;
  }
}

export async function validateFileSize(filePath: string, ext: string): Promise<{ valid: boolean; size: number; limit: number }> {
  const info = await stat(filePath);
  const limit = getFileSizeLimit(ext);
  return { valid: info.size <= limit, size: info.size, limit };
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_DIMENSION = 4000;
const QUALITY = 85;

export async function compressImage(inputPath: string, outputPath: string): Promise<{ compressed: boolean; originalSize: number; newSize: number }> {
  const ext = extname(inputPath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return { compressed: false, originalSize: 0, newSize: 0 };
  }

  const info = await stat(inputPath);
  const originalSize = info.size;

  const metadata = await sharp(inputPath).metadata();
  const w = metadata.width ?? 0;
  const h = metadata.height ?? 0;
  const needsResize = w > MAX_DIMENSION || h > MAX_DIMENSION;

  let pipeline = sharp(inputPath);
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true });
  }
  await pipeline.webp({ quality: QUALITY }).toFile(outputPath);

  const newInfo = await stat(outputPath);
  return { compressed: true, originalSize, newSize: newInfo.size };
}
