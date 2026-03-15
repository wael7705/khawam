import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { Readable } from 'node:stream';
import { lookup } from 'node:dns';
import { promisify } from 'node:util';
import { prisma } from '../../config/database.js';
import { cache } from '../../shared/cache/memory-cache.js';
import { saveUploadedFile } from '../../shared/plugins/upload.plugin.js';
import type { PaginatedResponse } from '../../shared/types/index.js';

// ─── Products CRUD ───────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Record<string, unknown>[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: {
        select: { id: true, name: true, nameAr: true, nameEn: true },
      },
      sizes: true,
    },
  });

  type ProductWithRelations = (typeof products)[number];
  return products.map((p: ProductWithRelations) => ({
    id: p.id,
    name: p.name,
    name_ar: p.nameAr,
    description: p.description,
    description_ar: p.descriptionAr,
    category_id: p.categoryId,
    category: p.category
      ? { id: p.category.id, name: p.category.name, name_ar: p.category.nameAr, name_en: p.category.nameEn }
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
    sizes: p.sizes.map((s: ProductWithRelations['sizes'][number]) => ({
      id: s.id,
      size_name: s.sizeName,
      width_cm: s.widthCm != null ? Number(s.widthCm) : null,
      height_cm: s.heightCm != null ? Number(s.heightCm) : null,
      price_multiplier: Number(s.priceMultiplier ?? 1),
      is_default: s.isDefault,
    })),
    created_at: p.createdAt,
  }));
}

export interface CreateProductInput {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category_id?: string;
  price?: number;
  base_price?: number;
  image_url?: string;
  images?: string[];
  featured_image?: string;
  is_active?: boolean;
  is_visible?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

export async function createProduct(input: CreateProductInput): Promise<{ id: string }> {
  const product = await prisma.product.create({
    data: {
      name: input.name ?? null,
      nameAr: input.name_ar ?? null,
      description: input.description ?? null,
      descriptionAr: input.description_ar ?? null,
      categoryId: input.category_id ?? null,
      price: input.price != null ? new Decimal(input.price) : null,
      basePrice: input.base_price != null ? new Decimal(input.base_price) : null,
      imageUrl: input.image_url ?? null,
      images: input.images ?? [],
      featuredImage: input.featured_image ?? null,
      isActive: input.is_active ?? true,
      isVisible: input.is_visible ?? true,
      isFeatured: input.is_featured ?? false,
      displayOrder: input.display_order ?? 0,
    },
  });
  cache.invalidate('products:');
  return { id: product.id };
}

export interface UpdateProductInput {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category_id?: string;
  price?: number;
  base_price?: number;
  image_url?: string;
  images?: string[];
  featured_image?: string;
  is_active?: boolean;
  is_visible?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      nameAr: input.name_ar,
      description: input.description,
      descriptionAr: input.description_ar,
      categoryId: input.category_id,
      price: input.price != null ? new Decimal(input.price) : undefined,
      basePrice: input.base_price != null ? new Decimal(input.base_price) : undefined,
      imageUrl: input.image_url,
      images: input.images,
      featuredImage: input.featured_image,
      isActive: input.is_active,
      isVisible: input.is_visible,
      isFeatured: input.is_featured,
      displayOrder: input.display_order,
    },
  });
  cache.invalidate('products:');
}

export async function deleteProduct(productId: string): Promise<void> {
  await prisma.product.delete({ where: { id: productId } });
  cache.invalidate('products:');
}

// ─── Services CRUD ──────────────────────────────────────────────────────────

export async function getAllServices(): Promise<Record<string, unknown>[]> {
  const services = await prisma.service.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: { options: true },
  });

  type ServiceWithOptions = (typeof services)[number];
  return services.map((s: ServiceWithOptions) => ({
    id: s.id,
    name_ar: s.nameAr,
    name_en: s.nameEn,
    description_ar: s.descriptionAr,
    description_en: s.descriptionEn,
    icon: s.icon,
    image_url: s.imageUrl,
    base_price: Number(s.basePrice),
    is_active: s.isActive,
    is_visible: s.isVisible,
    display_order: s.displayOrder,
    features: s.features,
    options: s.options.map((o: ServiceWithOptions['options'][number]) => ({
      id: o.id,
      option_type: o.optionType,
      option_name_ar: o.optionNameAr,
      option_name_en: o.optionNameEn,
      price_modifier: Number(o.priceModifier ?? 0),
      is_percentage: o.isPercentage,
      is_default: o.isDefault,
      display_order: o.displayOrder,
    })),
    created_at: s.createdAt,
  }));
}

export interface CreateServiceInput {
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  image_url?: string;
  base_price?: number;
  is_active?: boolean;
  is_visible?: boolean;
  display_order?: number;
  features?: Record<string, unknown>;
}

export async function createService(input: CreateServiceInput): Promise<{ id: string }> {
  const service = await prisma.service.create({
    data: {
      nameAr: input.name_ar,
      nameEn: input.name_en ?? null,
      descriptionAr: input.description_ar ?? null,
      descriptionEn: input.description_en ?? null,
      icon: input.icon ?? null,
      imageUrl: input.image_url ?? null,
      basePrice: input.base_price != null ? new Decimal(input.base_price) : new Decimal(0),
      isActive: input.is_active ?? true,
      isVisible: input.is_visible ?? true,
      displayOrder: input.display_order ?? 0,
      features: asInputJson(input.features),
    },
  });
  cache.invalidate('services:');
  return { id: service.id };
}

export interface UpdateServiceInput {
  name_ar?: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  image_url?: string;
  base_price?: number;
  is_active?: boolean;
  is_visible?: boolean;
  display_order?: number;
  features?: Record<string, unknown>;
}

function asInputJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export async function updateService(serviceId: string, input: UpdateServiceInput): Promise<void> {
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      nameAr: input.name_ar,
      nameEn: input.name_en,
      descriptionAr: input.description_ar,
      descriptionEn: input.description_en,
      icon: input.icon,
      imageUrl: input.image_url,
      basePrice: input.base_price != null ? new Decimal(input.base_price) : undefined,
      isActive: input.is_active,
      isVisible: input.is_visible,
      displayOrder: input.display_order,
      features: asInputJson(input.features),
    },
  });
  cache.invalidate('services:');
}

export async function deleteService(serviceId: string): Promise<void> {
  await prisma.service.delete({ where: { id: serviceId } });
  cache.invalidate('services:');
}

export async function cleanupDuplicateServices(): Promise<{ removed: number }> {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const s of services) {
    const key = `${s.nameAr}|${s.nameEn ?? ''}`;
    if (seen.has(key)) {
      toDelete.push(s.id);
    } else {
      seen.set(key, s.id);
    }
  }

  if (toDelete.length > 0) {
    await prisma.service.deleteMany({ where: { id: { in: toDelete } } });
    cache.invalidate('services:');
  }

  return { removed: toDelete.length };
}

// ─── Portfolio Works CRUD ───────────────────────────────────────────────────

export async function getAllWorks(): Promise<Record<string, unknown>[]> {
  const works = await prisma.portfolioWork.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });

  type Work = (typeof works)[number];
  return works.map((w: Work) => ({
    id: w.id,
    title: w.title,
    title_ar: w.titleAr,
    description: w.description,
    description_ar: w.descriptionAr,
    image_url: w.imageUrl,
    images: w.images,
    category: w.category,
    category_ar: w.categoryAr,
    is_featured: w.isFeatured,
    is_visible: w.isVisible,
    display_order: w.displayOrder,
    created_at: w.createdAt,
  }));
}

export interface CreateWorkInput {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  image_url: string;
  images?: string[];
  category?: string;
  category_ar?: string;
  is_featured?: boolean;
  is_visible?: boolean;
  display_order?: number;
}

export async function createWork(input: CreateWorkInput): Promise<{ id: string }> {
  const work = await prisma.portfolioWork.create({
    data: {
      title: input.title,
      titleAr: input.title_ar ?? null,
      description: input.description ?? null,
      descriptionAr: input.description_ar ?? null,
      imageUrl: input.image_url,
      images: input.images ?? [],
      category: input.category ?? null,
      categoryAr: input.category_ar ?? null,
      isFeatured: input.is_featured ?? false,
      isVisible: input.is_visible ?? true,
      displayOrder: input.display_order ?? 0,
    },
  });
  cache.invalidate('portfolio:');
  return { id: work.id };
}

export interface UpdateWorkInput {
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  images?: string[];
  category?: string;
  category_ar?: string;
  is_featured?: boolean;
  is_visible?: boolean;
  display_order?: number;
}

export async function updateWork(workId: string, input: UpdateWorkInput): Promise<void> {
  await prisma.portfolioWork.update({
    where: { id: workId },
    data: {
      title: input.title,
      titleAr: input.title_ar,
      description: input.description,
      descriptionAr: input.description_ar,
      imageUrl: input.image_url,
      images: input.images,
      category: input.category,
      categoryAr: input.category_ar,
      isFeatured: input.is_featured,
      isVisible: input.is_visible,
      displayOrder: input.display_order,
    },
  });
  cache.invalidate('portfolio:');
}

export async function deleteWork(workId: string): Promise<void> {
  await prisma.portfolioWork.delete({ where: { id: workId } });
  cache.invalidate('portfolio:');
}

export async function updateWorkImages(workId: string, images: string[]): Promise<void> {
  await prisma.portfolioWork.update({
    where: { id: workId },
    data: { images },
  });
  cache.invalidate('portfolio:');
}

interface LegacyWorkSeed {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryAr: string;
  categoryEn: string;
  imageUrl: string;
  gallery: string[];
  isFeatured: boolean;
  displayOrder: number;
}

const LEGACY_WORKS_SEED: LegacyWorkSeed[] = [
  {
    titleAr: 'هوية بصرية متكاملة',
    titleEn: 'Complete Brand Identity',
    descriptionAr: 'تنفيذ مشروع هوية متكامل لشركة محلية.',
    descriptionEn: 'A complete branding project for a local company.',
    categoryAr: 'هوية بصرية',
    categoryEn: 'Brand Identity',
    imageUrl: '/images/hero-mockup.jpg',
    gallery: ['/images/hero-mockup.jpg'],
    isFeatured: true,
    displayOrder: 1,
  },
  {
    titleAr: 'مشروع طباعة رول أب',
    titleEn: 'Roll Up Printing Project',
    descriptionAr: 'تصميم وطباعة رول أب للفعاليات.',
    descriptionEn: 'Design and print roll-up banners for events.',
    categoryAr: 'طباعة',
    categoryEn: 'Printing',
    imageUrl: '/images/hero-mockup.jpg',
    gallery: ['/images/hero-mockup.jpg'],
    isFeatured: true,
    displayOrder: 2,
  },
  {
    titleAr: 'حملة بروشورات',
    titleEn: 'Brochure Campaign',
    descriptionAr: 'إنتاج بروشورات تعريفية بحجم كبير.',
    descriptionEn: 'Large scale brochure printing campaign.',
    categoryAr: 'مواد تسويقية',
    categoryEn: 'Marketing',
    imageUrl: '/images/hero-mockup.jpg',
    gallery: ['/images/hero-mockup.jpg'],
    isFeatured: false,
    displayOrder: 3,
  },
];

export async function importLegacyWorksOnce(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const seed of LEGACY_WORKS_SEED) {
    const existing = await prisma.portfolioWork.findFirst({ where: { titleAr: seed.titleAr } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.portfolioWork.create({
      data: {
        title: seed.titleEn,
        titleAr: seed.titleAr,
        description: seed.descriptionEn,
        descriptionAr: seed.descriptionAr,
        imageUrl: seed.imageUrl,
        images: seed.gallery,
        category: seed.categoryEn,
        categoryAr: seed.categoryAr,
        isFeatured: seed.isFeatured,
        isVisible: true,
        displayOrder: seed.displayOrder,
      },
    });
    created += 1;
  }
  cache.invalidate('portfolio:');
  return { created, skipped };
}

// ─── Orders Management ──────────────────────────────────────────────────────

export interface OrderListFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAllOrders(
  filters: OrderListFilters,
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: {
    status?: string;
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<{ orderNumber?: { contains: string; mode: 'insensitive' }; customerName?: { contains: string; mode: 'insensitive' }; customerPhone?: { contains: string; mode: 'insensitive' } }>;
  } = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.date_from || filters.date_to) {
    where.createdAt = {};
    if (filters.date_from) {
      where.createdAt.gte = new Date(filters.date_from);
    }
    if (filters.date_to) {
      const d = new Date(filters.date_to);
      d.setHours(23, 59, 59, 999);
      where.createdAt.lte = d;
    }
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { customerPhone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, nameAr: true, nameEn: true } },
        items: { select: { id: true, productName: true, quantity: true, totalPrice: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  type OrderWithRelations = (typeof orders)[number];
  const data = orders.map((o: OrderWithRelations) => ({
    id: o.id,
    order_number: o.orderNumber,
    service_id: o.serviceId ?? undefined,
    service_name_ar: o.service?.nameAr ?? undefined,
    service_name_en: o.service?.nameEn ?? undefined,
    customer_id: o.customerId,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    shop_name: o.shopName,
    status: o.status,
    total_amount: Number(o.totalAmount),
    final_amount: Number(o.finalAmount),
    paid_amount: Number(o.paidAmount ?? 0),
    remaining_amount: Number(o.remainingAmount ?? 0),
    is_paid: o.isPaid,
    created_at: o.createdAt,
    customer: o.customer ? { id: o.customer.id, name: o.customer.name, phone: o.customer.phone } : null,
    items: o.items.map((i: OrderWithRelations['items'][number]) => ({
      id: i.id,
      product_name: i.productName,
      quantity: i.quantity,
      total_price: Number(i.totalPrice ?? 0),
    })),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderById(orderId: string): Promise<Record<string, unknown> | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      service: { select: { id: true, nameAr: true, nameEn: true } },
      items: {
        include: { product: { select: { id: true, name: true, nameAr: true } } },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    order_number: order.orderNumber,
    service_id: order.serviceId ?? undefined,
    service_name_ar: order.service?.nameAr ?? undefined,
    service_name_en: order.service?.nameEn ?? undefined,
    customer_id: order.customerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_whatsapp: order.customerWhatsapp,
    shop_name: order.shopName,
    status: order.status,
    priority: order.priority,
    total_amount: Number(order.totalAmount),
    discount_amount: Number(order.discountAmount ?? 0),
    tax_amount: Number(order.taxAmount ?? 0),
    final_amount: Number(order.finalAmount),
    paid_amount: Number(order.paidAmount ?? 0),
    remaining_amount: Number(order.remainingAmount ?? 0),
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    is_paid: order.isPaid,
    delivery_type: order.deliveryType,
    delivery_address: order.deliveryAddress,
    delivery_street: order.deliveryStreet,
    delivery_neighborhood: order.deliveryNeighborhood,
    delivery_building_floor: order.deliveryBuildingFloor,
    delivery_extra: order.deliveryExtra,
    delivery_latitude: order.deliveryLatitude != null ? Number(order.deliveryLatitude) : null,
    delivery_longitude: order.deliveryLongitude != null ? Number(order.deliveryLongitude) : null,
    delivery_date: order.deliveryDate,
    notes: order.notes,
    staff_notes: order.staffNotes,
    rating: order.rating,
    rating_comment: order.ratingComment,
    created_at: order.createdAt,
    completed_at: order.completedAt,
    customer: order.customer
      ? { id: order.customer.id, name: order.customer.name, phone: order.customer.phone, email: order.customer.email }
      : null,
    items: order.items.map((i: (typeof order.items)[number]) => ({
      id: i.id,
      product_id: i.productId,
      product_name: i.productName,
      product: i.product ? { id: i.product.id, name: i.product.name, name_ar: i.product.nameAr } : null,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice ?? 0),
      total_price: Number(i.totalPrice ?? 0),
      specifications: i.specifications,
      design_files: i.designFiles,
      production_notes: i.productionNotes,
      status: i.status,
    })),
    status_history: order.statusHistory.map((h: (typeof order.statusHistory)[number]) => ({
      id: h.id,
      status: h.status,
      notes: h.notes,
      changed_by: h.user ? { id: h.user.id, name: h.user.name } : null,
      created_at: h.createdAt,
    })),
  };
}

export async function verifyOrder(orderNumber: string): Promise<Record<string, unknown> | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { select: { productName: true, quantity: true, totalPrice: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    customer_name: order.customerName,
    final_amount: Number(order.finalAmount),
    created_at: order.createdAt,
    items: order.items.map((i: (typeof order.items)[number]) => ({
      product_name: i.productName,
      quantity: i.quantity,
      total_price: Number(i.totalPrice ?? 0),
    })),
  };
}

const ALLOWED_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as const;

export async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string,
  changedById?: string,
): Promise<void> {
  const normalized = status?.toLowerCase() ?? '';
  if (!ALLOWED_ORDER_STATUSES.includes(normalized as (typeof ALLOWED_ORDER_STATUSES)[number])) {
    throw { statusCode: 400, message: 'قيمة الحالة غير مسموحة. المسموح: pending, confirmed, processing, completed, cancelled' };
  }
  const updateData: { status: string; completedAt?: Date } = { status: normalized };
  if (normalized === 'completed') {
    updateData.completedAt = new Date();
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: updateData,
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: normalized,
        notes: notes ?? 'تحديث الحالة',
        changedBy: changedById ?? null,
      },
    }),
  ]);
}

export async function updateOrderRating(
  orderId: string,
  rating: number,
  ratingComment?: string,
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      rating: Math.min(5, Math.max(1, rating)),
      ratingComment: ratingComment ?? null,
    },
  });
}

export async function updateDeliveryCoordinates(
  orderId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryLatitude: new Decimal(latitude),
      deliveryLongitude: new Decimal(longitude),
    },
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  await prisma.order.delete({ where: { id: orderId } });
}

export async function bulkDeleteByStatus(status: string): Promise<{ deleted: number }> {
  const result = await prisma.order.deleteMany({ where: { status } });
  return { deleted: result.count };
}

export async function updateStaffNotes(orderId: string, staffNotes: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { staffNotes },
  });
}

export async function updatePaidStatus(
  orderId: string,
  isPaid: boolean,
  paidAmount?: number,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw { statusCode: 404, message: 'الطلب غير موجود' };

  const paid = paidAmount ?? (isPaid ? Number(order.finalAmount) : 0);
  const remaining = Math.max(0, Number(order.finalAmount) - paid);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      isPaid,
      paidAmount: new Decimal(paid),
      remainingAmount: new Decimal(remaining),
      paymentStatus: isPaid ? 'paid' : remaining > 0 ? 'partial' : 'unpaid',
    },
  });
}

export interface UpdatePaymentInput {
  payment_method?: string;
  payment_status?: string;
  paid_amount?: number;
  remaining_amount?: number;
}

export async function updatePayment(orderId: string, input: UpdatePaymentInput): Promise<void> {
  const data: { paymentMethod?: string; paymentStatus?: string; paidAmount?: Decimal; remainingAmount?: Decimal } = {};
  if (input.payment_method != null) data.paymentMethod = input.payment_method;
  if (input.payment_status != null) data.paymentStatus = input.payment_status;
  if (input.paid_amount != null) data.paidAmount = new Decimal(input.paid_amount);
  if (input.remaining_amount != null) data.remainingAmount = new Decimal(input.remaining_amount);

  await prisma.order.update({
    where: { id: orderId },
    data,
  });
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<Record<string, unknown>> {
  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue,
    customerCount,
    productCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.order.count({ where: { status: { in: ['pending', 'confirmed', 'processing'] } } }),
    prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { finalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { not: null } },
      _count: { customerId: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const uniqueCustomers = customerCount.length;

  return {
    total_orders: totalOrders,
    completed_orders: completedOrders,
    pending_orders: pendingOrders,
    total_revenue: Number(totalRevenue._sum.finalAmount ?? 0),
    total_customers: uniqueCustomers,
    total_products: productCount,
  };
}

export async function getPerformanceStats(): Promise<Record<string, unknown>> {
  const completed = await prisma.order.findMany({
    where: { status: 'completed', completedAt: { not: null } },
    select: { createdAt: true, completedAt: true },
  });

  const total = await prisma.order.count();
  const completedCount = completed.length;
  const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

  let avgProcessingMs = 0;
  if (completed.length > 0) {
    type CompletedOrder = (typeof completed)[number];
    const sum = completed.reduce((acc: number, o: CompletedOrder) => {
      const created = o.createdAt.getTime();
      const completedAt = (o.completedAt as Date).getTime();
      return acc + (completedAt - created);
    }, 0);
    avgProcessingMs = sum / completed.length;
  }

  return {
    average_processing_time_hours: Math.round((avgProcessingMs / (1000 * 60 * 60)) * 100) / 100,
    completion_rate: Math.round(completionRate * 100) / 100,
    total_orders: total,
    completed_orders: completedCount,
  };
}

export async function getTopProducts(limit = 10): Promise<Record<string, unknown>[]> {
  const items = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    where: { productId: { not: null } },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  type GroupedItem = (typeof items)[number];
  return items.map((i: GroupedItem) => ({
    product_id: i.productId,
    product_name: i.productName,
    total_quantity: i._sum.quantity ?? 0,
    order_count: i._count.id,
  }));
}

export async function getTopServices(limit = 10): Promise<Record<string, unknown>[]> {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { basePrice: 'desc' }],
    take: limit,
  });

  type ServiceItem = (typeof services)[number];
  return services.map((s: ServiceItem) => ({
    id: s.id,
    name_ar: s.nameAr,
    name_en: s.nameEn,
    base_price: Number(s.basePrice),
    display_order: s.displayOrder,
  }));
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export interface SalesOverviewResult {
  daily: Array<{ date: string; total: number; count: number }>;
  weekly: Array<{ week: string; total: number; count: number }>;
  monthly: Array<{ month: string; total: number; count: number }>;
}

export async function getSalesOverview(days = 30): Promise<SalesOverviewResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      status: 'completed',
      createdAt: { gte: startDate },
    },
    select: { createdAt: true, finalAmount: true },
  });

  const dailyMap = new Map<string, { total: number; count: number }>();
  const weeklyMap = new Map<string, { total: number; count: number }>();
  const monthlyMap = new Map<string, { total: number; count: number }>();

  for (const o of orders) {
    const d = o.createdAt;
    const dateStr = d.toISOString().slice(0, 10);
    const weekStr = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`;
    const monthStr = d.toISOString().slice(0, 7);

    const amt = Number(o.finalAmount);

    const daily = dailyMap.get(dateStr) ?? { total: 0, count: 0 };
    daily.total += amt;
    daily.count += 1;
    dailyMap.set(dateStr, daily);

    const weekly = weeklyMap.get(weekStr) ?? { total: 0, count: 0 };
    weekly.total += amt;
    weekly.count += 1;
    weeklyMap.set(weekStr, weekly);

    const monthly = monthlyMap.get(monthStr) ?? { total: 0, count: 0 };
    monthly.total += amt;
    monthly.count += 1;
    monthlyMap.set(monthStr, monthly);
  }

  const daily = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, total: v.total, count: v.count }));

  const weekly = [...weeklyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, v]) => ({ week, total: v.total, count: v.count }));

  const monthly = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, total: v.total, count: v.count }));

  return { daily, weekly, monthly };
}

export async function getRecentOrders(limit = 10): Promise<Record<string, unknown>[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      items: { select: { productName: true, quantity: true } },
    },
  });

  type RecentOrder = (typeof orders)[number];
  return orders.map((o: RecentOrder) => ({
    id: o.id,
    order_number: o.orderNumber,
    customer_name: o.customerName,
    status: o.status,
    final_amount: Number(o.finalAmount),
    created_at: o.createdAt,
    items: o.items.map((i: RecentOrder['items'][number]) => ({ product_name: i.productName, quantity: i.quantity })),
  }));
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Record<string, unknown>[]> {
  const ordersByCustomer = await prisma.order.groupBy({
    by: ['customerId', 'customerName', 'customerPhone'],
    where: { customerId: { not: null } },
    _count: { id: true },
    _sum: { finalAmount: true },
  });

  type OrderGroupBy = (typeof ordersByCustomer)[number];
  const customerIds = [...new Set(ordersByCustomer.map((o: OrderGroupBy) => o.customerId).filter(Boolean))] as string[];

  const users = await prisma.user.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, phone: true, email: true, notes: true },
  });

  type UserSelect = (typeof users)[number];
  const userMap = new Map<string, UserSelect>(users.map((u: UserSelect) => [u.id, u]));
  const orderCountMap = new Map<string, { count: number; total: number }>();

  for (const o of ordersByCustomer) {
    if (o.customerId) {
      orderCountMap.set(o.customerId, {
        count: o._count.id,
        total: Number(o._sum.finalAmount ?? 0),
      });
    }
  }

  type OrderGroupByWithCustomerId = OrderGroupBy & { customerId: string };
  return ordersByCustomer
    .filter((o: OrderGroupBy): o is OrderGroupByWithCustomerId => Boolean(o.customerId))
    .map((o: OrderGroupByWithCustomerId) => {
      const user = userMap.get(o.customerId) ?? null;
      const stats = orderCountMap.get(o.customerId) ?? null;
      return {
        id: o.customerId,
        name: user?.name ?? o.customerName,
        phone: user?.phone ?? o.customerPhone,
        email: user?.email,
        notes: user?.notes,
        order_count: stats?.count ?? 0,
        total_spent: stats?.total ?? 0,
      };
    });
}

export async function getCustomerByPhone(phone: string): Promise<Record<string, unknown> | null> {
  const user = await prisma.user.findFirst({
    where: { phone },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { items: { select: { productName: true, quantity: true, totalPrice: true } } },
      },
    },
  });

  if (user) {
    const orderCount = await prisma.order.count({ where: { customerId: user.id } });
    const totalSpent = await prisma.order.aggregate({
      where: { customerId: user.id, status: 'completed' },
      _sum: { finalAmount: true },
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      notes: user.notes,
      order_count: orderCount,
      total_spent: Number(totalSpent._sum.finalAmount ?? 0),
      orders: user.orders.map((o: (typeof user.orders)[number]) => ({
        id: o.id,
        order_number: o.orderNumber,
        status: o.status,
        final_amount: Number(o.finalAmount),
        created_at: o.createdAt,
        items: o.items.map((i: (typeof o.items)[number]) => ({
          product_name: i.productName,
          quantity: i.quantity,
          total_price: Number(i.totalPrice ?? 0),
        })),
      })),
    };
  }

  const ordersByPhone = await prisma.order.findMany({
    where: { customerPhone: phone },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { items: { select: { productName: true, quantity: true, totalPrice: true } } },
  });

  if (ordersByPhone.length === 0) return null;

  const orderCount = await prisma.order.count({ where: { customerPhone: phone } });
  const totalSpent = await prisma.order.aggregate({
    where: { customerPhone: phone, status: 'completed' },
    _sum: { finalAmount: true },
  });

  const orders = ordersByPhone;

  const firstOrder = orders[0];
  return {
    id: null,
    name: firstOrder?.customerName ?? null,
    phone,
    email: null,
    notes: null,
    order_count: orderCount,
    total_spent: Number(totalSpent._sum.finalAmount ?? 0),
    orders: orders.map((o: (typeof orders)[number]) => ({
      id: o.id,
      order_number: o.orderNumber,
      status: o.status,
      final_amount: Number(o.finalAmount),
      created_at: o.createdAt,
      items: o.items.map((i: (typeof o.items)[number]) => ({
        product_name: i.productName,
        quantity: i.quantity,
        total_price: Number(i.totalPrice ?? 0),
      })),
    })),
  };
}

export async function updateCustomerNotes(phone: string, notes: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) throw { statusCode: 404, message: 'العميل غير موجود' };

  await prisma.user.update({
    where: { id: user.id },
    data: { notes },
  });
}

// ─── Payment Settings ─────────────────────────────────────────────────────────

export async function getPaymentSettings(): Promise<Record<string, unknown>[]> {
  const settings = await prisma.paymentSettings.findMany({
    where: { isActive: true },
    orderBy: { paymentMethod: 'asc' },
  });

  type Setting = (typeof settings)[number];
  return settings.map((s: Setting) => ({
    id: s.id,
    payment_method: s.paymentMethod,
    account_name: s.accountName,
    account_number: s.accountNumber,
    phone_number: s.phoneNumber,
    is_active: s.isActive,
    created_at: s.createdAt,
  }));
}

export interface CreatePaymentSettingsInput {
  payment_method: string;
  account_name?: string;
  account_number?: string;
  phone_number?: string;
  api_key?: string;
  api_secret?: string;
  is_active?: boolean;
}

export async function createPaymentSettings(input: CreatePaymentSettingsInput): Promise<{ id: string }> {
  const settings = await prisma.paymentSettings.create({
    data: {
      paymentMethod: input.payment_method,
      accountName: input.account_name ?? null,
      accountNumber: input.account_number ?? null,
      phoneNumber: input.phone_number ?? null,
      apiKey: input.api_key ?? null,
      apiSecret: input.api_secret ?? null,
      isActive: input.is_active ?? true,
    },
  });
  return { id: settings.id };
}

export interface UpdatePaymentSettingsInput {
  payment_method?: string;
  account_name?: string;
  account_number?: string;
  phone_number?: string;
  api_key?: string;
  api_secret?: string;
  is_active?: boolean;
}

export async function updatePaymentSettings(
  settingsId: string,
  input: UpdatePaymentSettingsInput,
): Promise<void> {
  await prisma.paymentSettings.update({
    where: { id: settingsId },
    data: {
      paymentMethod: input.payment_method,
      accountName: input.account_name,
      accountNumber: input.account_number,
      phoneNumber: input.phone_number,
      apiKey: input.api_key,
      apiSecret: input.api_secret,
      isActive: input.is_active,
    },
  });
}

// ─── Archive ─────────────────────────────────────────────────────────────────

export async function dailyArchiveMove(daysOld = 30): Promise<{ moved: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  cutoff.setHours(0, 0, 0, 0);

  const result = await prisma.order.updateMany({
    where: {
      status: 'completed',
      completedAt: { lt: cutoff },
    },
    data: { status: 'archived_daily' },
  });

  return { moved: result.count };
}

export async function monthlyArchiveMove(): Promise<{ moved: number }> {
  const result = await prisma.order.updateMany({
    where: { status: 'archived_daily' },
    data: { status: 'archived_monthly' },
  });

  return { moved: result.count };
}

export async function getDailyArchive(page = 1, limit = 20): Promise<PaginatedResponse<Record<string, unknown>>> {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'archived_daily' },
      skip,
      take: limit,
      orderBy: { completedAt: 'desc' },
      include: { items: { select: { productName: true, quantity: true } } },
    }),
    prisma.order.count({ where: { status: 'archived_daily' } }),
  ]);

  type ArchiveOrder = (typeof orders)[number];
  const data = orders.map((o: ArchiveOrder) => ({
    id: o.id,
    order_number: o.orderNumber,
    customer_name: o.customerName,
    status: o.status,
    final_amount: Number(o.finalAmount),
    completed_at: o.completedAt,
    items: o.items.map((i: ArchiveOrder['items'][number]) => ({ product_name: i.productName, quantity: i.quantity })),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMonthlyArchive(page = 1, limit = 20): Promise<PaginatedResponse<Record<string, unknown>>> {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'archived_monthly' },
      skip,
      take: limit,
      orderBy: { completedAt: 'desc' },
      include: { items: { select: { productName: true, quantity: true } } },
    }),
    prisma.order.count({ where: { status: 'archived_monthly' } }),
  ]);

  type ArchiveOrder = (typeof orders)[number];
  const data = orders.map((o: ArchiveOrder) => ({
    id: o.id,
    order_number: o.orderNumber,
    customer_name: o.customerName,
    status: o.status,
    final_amount: Number(o.finalAmount),
    completed_at: o.completedAt,
    items: o.items.map((i: ArchiveOrder['items'][number]) => ({ product_name: i.productName, quantity: i.quantity })),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getArchiveDates(): Promise<{ daily: string[]; monthly: string[] }> {
  const [daily, monthly] = await Promise.all([
    prisma.order.groupBy({
      by: ['completedAt'],
      where: { status: 'archived_daily', completedAt: { not: null } },
    }),
    prisma.order.groupBy({
      by: ['completedAt'],
      where: { status: 'archived_monthly', completedAt: { not: null } },
    }),
  ]);

  type GroupByResult = (typeof daily)[number];
  const dailyDates = [...new Set(daily.map((d: GroupByResult) => d.completedAt!.toISOString().slice(0, 10)))].sort() as string[];
  const monthlyDates = [...new Set(monthly.map((d: GroupByResult) => d.completedAt!.toISOString().slice(0, 7)))].sort() as string[];

  return { daily: dailyDates, monthly: monthlyDates };
}

// ─── File Upload ─────────────────────────────────────────────────────────────

export async function uploadImage(
  file: { filename: string; file: NodeJS.ReadableStream; mimetype: string },
  subDir: 'products' | 'general' = 'general',
): Promise<{ url: string; filename: string }> {
  const result = await saveUploadedFile(file, subDir);
  return { url: result.url, filename: result.filename };
}

export async function uploadMultipleImages(
  files: Array<{ filename: string; file: NodeJS.ReadableStream; mimetype: string }>,
  subDir: 'products' | 'general' = 'general',
): Promise<{ urls: string[]; filenames: string[] }> {
  const results = await Promise.all(
    files.map((f: (typeof files)[number]) => saveUploadedFile(f, subDir)),
  );
  return {
    urls: results.map((r: (typeof results)[number]) => r.url),
    filenames: results.map((r: (typeof results)[number]) => r.filename),
  };
}

const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const DOWNLOAD_TIMEOUT_MS = 10_000; // 10 seconds

function isPrivateOrInternalIP(ip: string): boolean {
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const a = parts[0];
    const b = parts[1];
    if (a === undefined || b === undefined) return true;
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    return false;
  }
  if (ip.includes(':')) {
    const ipLower = ip.toLowerCase();
    if (ipLower === '::1') return true;
    const first = ipLower.split(':')[0];
    if (first === 'fc' || first === 'fd' || first === 'fe80') return true; // fc00::/7, link-local
    return false;
  }
  return true;
}

async function validateUrlForFetch(urlString: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('رابط غير صالح');
  }
  const scheme = parsed.protocol.slice(0, -1).toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    throw new Error('يُسمح فقط بروابط http و https');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('الوصول إلى localhost غير مسموح');
  }
  const lookupAsync = promisify(lookup);
  const { address } = await lookupAsync(hostname, { all: false });
  if (isPrivateOrInternalIP(address)) {
    throw new Error('الوصول إلى عناوين الشبكة الداخلية غير مسموح');
  }
}

export async function uploadByUrl(
  imageUrl: string,
  subDir: 'products' | 'general' = 'general',
): Promise<{ url: string; filename: string }> {
  await validateUrlForFetch(imageUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  const response = await fetch(imageUrl, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`فشل تحميل الصورة: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > MAX_DOWNLOAD_SIZE) {
      throw new Error('حجم الملف يتجاوز الحد المسموح (10 ميجابايت)');
    }
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('لا يمكن قراءة محتوى الرابط');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.length;
      if (totalSize > MAX_DOWNLOAD_SIZE) {
        reader.cancel();
        throw new Error('حجم الملف يتجاوز الحد المسموح (10 ميجابايت)');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = Buffer.concat(chunks);

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : contentType.includes('gif') ? '.gif' : '.jpg';
  const stream = Readable.from(buffer);
  const filename = `url-${Date.now()}${ext}`;

  const mimetype = contentType.split(';')[0]?.trim() ?? 'image/jpeg';
  const result = await saveUploadedFile(
    {
      filename,
      file: stream,
      mimetype,
    },
    subDir,
  );

  return { url: result.url, filename: result.filename };
}

// ─── Maintenance ────────────────────────────────────────────────────────────

export async function normalizeImages(): Promise<{ products: number; services: number; works: number }> {
  const baseUrl = '/uploads';

  let productsUpdated = 0;
  let servicesUpdated = 0;
  let worksUpdated = 0;

  const products = await prisma.product.findMany({
    select: { id: true, imageUrl: true, featuredImage: true, images: true },
  });

  for (const p of products) {
    let changed = false;
    const updates: { imageUrl?: string; featuredImage?: string; images?: string[] } = {};

    if (p.imageUrl && !p.imageUrl.startsWith('/') && !p.imageUrl.startsWith('http')) {
      updates.imageUrl = p.imageUrl.startsWith('uploads') ? `/${p.imageUrl}` : `${baseUrl}/products/${p.imageUrl}`;
      changed = true;
    }
    if (p.featuredImage && !p.featuredImage.startsWith('/') && !p.featuredImage.startsWith('http')) {
      updates.featuredImage = p.featuredImage.startsWith('uploads') ? `/${p.featuredImage}` : `${baseUrl}/products/${p.featuredImage}`;
      changed = true;
    }
    if (p.images.length > 0) {
      const normalized = p.images.map((img: string) => {
        if (img.startsWith('/') || img.startsWith('http')) return img;
        return img.startsWith('uploads') ? `/${img}` : `${baseUrl}/products/${img}`;
      });
      if (JSON.stringify(normalized) !== JSON.stringify(p.images)) {
        updates.images = normalized;
        changed = true;
      }
    }

    if (changed) {
      await prisma.product.update({ where: { id: p.id }, data: updates });
      productsUpdated++;
    }
  }

  const services = await prisma.service.findMany({
    select: { id: true, imageUrl: true },
  });

  for (const s of services) {
    if (s.imageUrl && !s.imageUrl.startsWith('/') && !s.imageUrl.startsWith('http')) {
      const normalized = s.imageUrl.startsWith('uploads') ? `/${s.imageUrl}` : `${baseUrl}/general/${s.imageUrl}`;
      await prisma.service.update({ where: { id: s.id }, data: { imageUrl: normalized } });
      servicesUpdated++;
    }
  }

  const works = await prisma.portfolioWork.findMany({
    select: { id: true, imageUrl: true, images: true },
  });

  for (const w of works) {
    let changed = false;
    const updates: { imageUrl?: string; images?: string[] } = {};

    if (w.imageUrl && !w.imageUrl.startsWith('/') && !w.imageUrl.startsWith('http')) {
      updates.imageUrl = w.imageUrl.startsWith('uploads') ? `/${w.imageUrl}` : `${baseUrl}/general/${w.imageUrl}`;
      changed = true;
    }
    if (w.images.length > 0) {
      const normalized = w.images.map((img: string) => {
        if (img.startsWith('/') || img.startsWith('http')) return img;
        return img.startsWith('uploads') ? `/${img}` : `${baseUrl}/general/${img}`;
      });
      if (JSON.stringify(normalized) !== JSON.stringify(w.images)) {
        updates.images = normalized;
        changed = true;
      }
    }

    if (changed) {
      await prisma.portfolioWork.update({ where: { id: w.id }, data: updates });
      worksUpdated++;
    }
  }

  cache.invalidate('products:');
  cache.invalidate('services:');
  cache.invalidate('portfolio:');

  return { products: productsUpdated, services: servicesUpdated, works: worksUpdated };
}
