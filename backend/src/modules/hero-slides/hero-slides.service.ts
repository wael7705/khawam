import { prisma } from '../../config/database.js';
import { cache } from '../../shared/cache/memory-cache.js';
import { saveUploadedFile } from '../../shared/plugins/upload.plugin.js';

const CACHE_KEY_PREFIX = 'hero_slides';
const CACHE_KEY = 'hero_slides:active';

interface CreateHeroSlideInput {
  imageUrl: string;
  isLogo?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

interface UpdateHeroSlideInput {
  imageUrl?: string;
  isLogo?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

interface ReorderSlidesInput {
  slideIds: string[];
}

function invalidateHeroSlidesCache(): void {
  cache.invalidate(CACHE_KEY_PREFIX);
}

export async function getHeroSlides() {
  const cached = cache.get<Awaited<ReturnType<typeof fetchHeroSlides>>>(CACHE_KEY);
  if (cached) return cached;

  const result = await fetchHeroSlides();
  cache.set(CACHE_KEY, result, 'heroSlides');
  return result;
}

async function fetchHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function createHeroSlide(input: CreateHeroSlideInput) {
  const slide = await prisma.heroSlide.create({
    data: {
      imageUrl: input.imageUrl,
      isLogo: input.isLogo ?? false,
      isActive: input.isActive ?? true,
      displayOrder: input.displayOrder ?? 0,
    },
  });
  invalidateHeroSlidesCache();
  return slide;
}

export async function updateHeroSlide(slideId: string, input: UpdateHeroSlideInput) {
  const slide = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!slide) throw { statusCode: 404, message: 'الشريحة غير موجودة' };

  const updated = await prisma.heroSlide.update({
    where: { id: slideId },
    data: {
      imageUrl: input.imageUrl,
      isLogo: input.isLogo,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    },
  });
  invalidateHeroSlidesCache();
  return updated;
}

export async function deleteHeroSlide(slideId: string) {
  const slide = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!slide) throw { statusCode: 404, message: 'الشريحة غير موجودة' };

  await prisma.heroSlide.delete({ where: { id: slideId } });
  invalidateHeroSlidesCache();
  return { success: true, message: 'تم حذف الشريحة بنجاح' };
}

export async function reorderSlides(input: ReorderSlidesInput) {
  const { slideIds } = input;

  if (slideIds.length === 0) {
    throw { statusCode: 400, message: 'يجب تحديد الشريحات لإعادة ترتيبها' };
  }

  const slides = await prisma.heroSlide.findMany({
    where: { id: { in: slideIds } },
  });

  if (slides.length !== slideIds.length) {
    throw { statusCode: 400, message: 'بعض الشريحات غير موجودة' };
  }

  await prisma.$transaction(
    slideIds.map((id, index) =>
      prisma.heroSlide.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
  );

  invalidateHeroSlidesCache();
  return { success: true, message: 'تم إعادة ترتيب الشريحات بنجاح' };
}

export async function uploadSlideImage(file: {
  filename: string;
  file: NodeJS.ReadableStream;
  mimetype: string;
}): Promise<{ imageUrl: string; filename: string }> {
  const result = await saveUploadedFile(file, 'hero_slides');
  return {
    imageUrl: result.url,
    filename: result.filename,
  };
}
