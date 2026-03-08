import { prisma } from '../../config/database.js';
import { cache } from '../../shared/cache/memory-cache.js';

const CACHE_KEY_WORKS = 'portfolio:works';
const CACHE_KEY_FEATURED = 'portfolio:featured';
const CACHE_KEY_WORK = (id: string) => `portfolio:work:${id}`;

type PortfolioWork = Awaited<ReturnType<typeof prisma.portfolioWork.findMany>>[number];

export async function getPortfolioWorks(): Promise<PortfolioWork[]> {
  const cached = cache.get<PortfolioWork[]>(CACHE_KEY_WORKS);
  if (cached) return cached;

  const works = await prisma.portfolioWork.findMany({
    where: { isVisible: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });

  cache.set(CACHE_KEY_WORKS, works, 'portfolio');
  return works;
}

export async function getFeaturedWorks(): Promise<PortfolioWork[]> {
  const cached = cache.get<PortfolioWork[]>(CACHE_KEY_FEATURED);
  if (cached) return cached;

  const works = await prisma.portfolioWork.findMany({
    where: { isVisible: true, isFeatured: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });

  cache.set(CACHE_KEY_FEATURED, works, 'portfolio');
  return works;
}

export async function getWorkById(workId: string): Promise<PortfolioWork | null> {
  const cached = cache.get<PortfolioWork>(CACHE_KEY_WORK(workId));
  if (cached) return cached;

  const work = await prisma.portfolioWork.findFirst({
    where: { id: workId, isVisible: true },
  });

  if (work) {
    cache.set(CACHE_KEY_WORK(workId), work, 'portfolio');
  }
  return work;
}

export async function getLinkedWorksForFrontend(): Promise<Record<string, unknown>[]> {
  const works = await prisma.portfolioWork.findMany({
    where: { isVisible: true },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
  type WorkRow = (typeof works)[number];
  return works.map((work: WorkRow) => ({
    id: work.id,
    title: work.title,
    title_ar: work.titleAr,
    description: work.description,
    description_ar: work.descriptionAr,
    image_url: work.imageUrl,
    images: work.images,
    category: work.category,
    category_ar: work.categoryAr,
    is_featured: work.isFeatured,
    is_visible: work.isVisible,
    display_order: work.displayOrder,
    created_at: work.createdAt,
  }));
}
