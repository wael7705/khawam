import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createId } from '../../shared/utils/nanoid.js';
import { config } from '../../config/index.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const STUDIO_DIR = 'studio';

export interface CropRotateOptions {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
}

export interface AddDpiOptions {
  dpi: number;
}

export type FilterType = 'grayscale' | 'sepia' | 'blur';

export interface ApplyFilterOptions {
  filter: FilterType;
  blurSigma?: number;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

function getOutputPath(subDir: string, ext: string): string {
  const targetDir = join(UPLOAD_DIR, STUDIO_DIR, subDir);
  return join(targetDir, `${createId()}${ext}`);
}

export async function removeBackground(inputPath: string): Promise<string> {
  const apiKey = config.REMOVE_BG_API_KEY;
  const ext = '.png';
  const outputPath = getOutputPath('remove-bg', ext);
  await ensureDir(join(UPLOAD_DIR, STUDIO_DIR, 'remove-bg'));

  if (apiKey) {
    const imageBuffer = await readFile(inputPath);
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer]), 'image.png');
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Remove.bg API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await writeFile(outputPath, Buffer.from(arrayBuffer));
  } else {
    const buffer = await sharp(inputPath).png().toBuffer();
    await writeFile(outputPath, buffer);
  }

  const filename = outputPath.split(/[/\\]/).pop() ?? '';
  return `/uploads/${STUDIO_DIR}/remove-bg/${filename}`;
}

const PASSPORT_WIDTH = 413;
const PASSPORT_HEIGHT = 567;
const GRID_COLS = 4;
const GRID_ROWS = 2;

export async function createPassportPhotos(inputPath: string): Promise<string> {
  const ext = '.png';
  const outputPath = getOutputPath('passport', ext);
  await ensureDir(join(UPLOAD_DIR, STUDIO_DIR, 'passport'));

  const singlePhoto = await sharp(inputPath)
    .resize(PASSPORT_WIDTH, PASSPORT_HEIGHT, { fit: 'cover', position: 'center' })
    .toBuffer();

  const composite: sharp.OverlayOptions[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      composite.push({
        input: singlePhoto,
        left: col * PASSPORT_WIDTH,
        top: row * PASSPORT_HEIGHT,
      });
    }
  }

  const totalWidth = GRID_COLS * PASSPORT_WIDTH;
  const totalHeight = GRID_ROWS * PASSPORT_HEIGHT;

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composite)
    .png()
    .toFile(outputPath);

  const filename = outputPath.split(/[/\\]/).pop() ?? '';
  return `/uploads/${STUDIO_DIR}/passport/${filename}`;
}

export async function cropRotate(
  inputPath: string,
  options: CropRotateOptions,
): Promise<string> {
  const ext = '.png';
  const outputPath = getOutputPath('crop-rotate', ext);
  await ensureDir(join(UPLOAD_DIR, STUDIO_DIR, 'crop-rotate'));

  let pipeline = sharp(inputPath).extract({
    left: Math.round(options.left),
    top: Math.round(options.top),
    width: Math.round(options.width),
    height: Math.round(options.height),
  });

  if (options.rotate && options.rotate !== 0) {
    pipeline = pipeline.rotate(options.rotate);
  }

  await pipeline.png().toFile(outputPath);

  const filename = outputPath.split(/[/\\]/).pop() ?? '';
  return `/uploads/${STUDIO_DIR}/crop-rotate/${filename}`;
}

export async function addDpi(inputPath: string, options: AddDpiOptions): Promise<string> {
  const ext = '.png';
  const outputPath = getOutputPath('dpi', ext);
  await ensureDir(join(UPLOAD_DIR, STUDIO_DIR, 'dpi'));

  await sharp(inputPath)
    .withMetadata({ density: options.dpi })
    .png()
    .toFile(outputPath);

  const filename = outputPath.split(/[/\\]/).pop() ?? '';
  return `/uploads/${STUDIO_DIR}/dpi/${filename}`;
}

export async function applyFilter(
  inputPath: string,
  options: ApplyFilterOptions,
): Promise<string> {
  const ext = '.png';
  const outputPath = getOutputPath('filter', ext);
  await ensureDir(join(UPLOAD_DIR, STUDIO_DIR, 'filter'));

  let pipeline = sharp(inputPath);

  switch (options.filter) {
    case 'grayscale':
      pipeline = pipeline.grayscale();
      break;
    case 'sepia':
      pipeline = pipeline.modulate({ saturation: 0.3 }).tint({ r: 112, g: 66, b: 20 });
      break;
    case 'blur':
      pipeline = pipeline.blur(options.blurSigma ?? 5);
      break;
    default:
      throw new Error(`Unknown filter: ${options.filter}`);
  }

  await pipeline.png().toFile(outputPath);

  const filename = outputPath.split(/[/\\]/).pop() ?? '';
  return `/uploads/${STUDIO_DIR}/filter/${filename}`;
}
