import { prisma } from '../../config/database.js';
import { cache } from '../../shared/cache/memory-cache.js';

const PRODUCTS_CACHE_KEY = 'products:list';
const PRODUCT_CACHE_PREFIX = 'product:';

export async function getProducts(): Promise<Record<string, unknown>[]> {
  const cached = cache.get<Record<string, unknown>[]>(PRODUCTS_CACHE_KEY);
  if (cached) return cached;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isVisible: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true,
        },
      },
    },
  });

  type ProductRow = typeof products[number];
  const data = products.map((p: ProductRow) => ({
    id: p.id,
    name: p.name,
    name_ar: p.nameAr,
    description: p.description,
    description_ar: p.descriptionAr,
    category_id: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          name_ar: p.category.nameAr,
          name_en: p.category.nameEn,
        }
      : null,
    price: p.price != null ? Number(p.price) : null,
    base_price: p.basePrice != null ? Number(p.basePrice) : null,
    image_url: p.imageUrl,
    images: p.images,
    featured_image: p.featuredImage,
    is_active: p.isActive,
    is_visible: p.isVisible,
    is_featured: p.isFeatured,
    display_order: p.displayOrder,
    sales: p.sales,
    created_at: p.createdAt,
  }));

  cache.set(PRODUCTS_CACHE_KEY, data, 'products');
  return data;
}

export async function getProductById(productId: string): Promise<Record<string, unknown> | null> {
  const cacheKey = `${PRODUCT_CACHE_PREFIX}${productId}`;
  const cached = cache.get<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      isActive: true,
      isVisible: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true,
        },
      },
      sizes: true,
    },
  });

  if (!product) return null;

  const data: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    name_ar: product.nameAr,
    description: product.description,
    description_ar: product.descriptionAr,
    category_id: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          name_ar: product.category.nameAr,
          name_en: product.category.nameEn,
        }
      : null,
    price: product.price != null ? Number(product.price) : null,
    base_price: product.basePrice != null ? Number(product.basePrice) : null,
    image_url: product.imageUrl,
    images: product.images,
    featured_image: product.featuredImage,
    is_active: product.isActive,
    is_visible: product.isVisible,
    is_featured: product.isFeatured,
    display_order: product.displayOrder,
    sales: product.sales,
    sizes: product.sizes.map((s: typeof product.sizes[number]) => ({
      id: s.id,
      size_name: s.sizeName,
      width_cm: s.widthCm != null ? Number(s.widthCm) : null,
      height_cm: s.heightCm != null ? Number(s.heightCm) : null,
      width_px: s.widthPx,
      height_px: s.heightPx,
      price_multiplier: Number(s.priceMultiplier ?? 1),
      is_default: s.isDefault,
    })),
    created_at: product.createdAt,
  };

  cache.set(cacheKey, data, 'products');
  return data;
}
