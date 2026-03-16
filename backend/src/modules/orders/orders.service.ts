import { Decimal } from '@prisma/client/runtime/library';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { emitToStaff, emitToCustomer } from '../../shared/plugins/socket.plugin.js';
import { saveUploadedFile } from '../../shared/plugins/upload.plugin.js';
import { generateOrderNumber } from '../../algorithms/order-number.algorithm.js';
import { calculateFinancialPrice } from '../pricing/pricing.service.js';
import { specsToFinancialParams, type FinancialPricingParams } from './specs-to-financial.js';
import type { PaginatedResponse } from '../../shared/types/index.js';

export interface CreateOrderItemInput {
  product_id?: string;
  product_name?: string;
  quantity: number;
  unit_price?: number;
  size_id?: string;
  material_id?: string;
  specifications?: Record<string, unknown>;
  design_files?: string[];
  production_notes?: string;
}

interface PricingSpecs {
  service_id?: string;
  print_mode?: 'bw' | 'color_normal' | 'color_laser';
  size_code?: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'BOOKLET_A5' | 'BOOKLET_B5' | 'BOOKLET_A4';
  paper_type?: string | null;
  unit_value?: number;
}

export interface CreateOrderInput {
  service_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_whatsapp?: string;
  shop_name?: string;
  items: CreateOrderItemInput[];
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  final_amount: number;
  payment_method?: string;
  delivery_type?: string;
  delivery_address?: string;
  delivery_street?: string;
  delivery_neighborhood?: string;
  delivery_building_floor?: string;
  delivery_extra?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_date?: string;
  notes?: string;
  files?: string[];
}

export interface OrderFilters {
  status?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
}

function buildDeliveryAddress(input: CreateOrderInput): string | null {
  const parts = [
    input.delivery_street?.trim(),
    input.delivery_neighborhood?.trim(),
    input.delivery_building_floor?.trim(),
    input.delivery_extra?.trim(),
  ].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join('، ') : null;
}

export async function createOrder(
  input: CreateOrderInput,
  createdById?: string,
): Promise<{ id: string; order_number: string }> {
  let computedTotalAmount = 0;
  const normalizedItems: Array<CreateOrderItemInput & { resolved_unit_price: number; resolved_total_price: number }> = [];
  for (const item of input.items) {
    if (!item) continue;
    const specs = (item.specifications ?? {}) as PricingSpecs & Record<string, unknown>;
    let resolvedUnitPrice = item.unit_price ?? 0;
    let effectiveSpecs = specs as Record<string, unknown>;

    const hasDirectParams =
      specs.service_id &&
      specs.print_mode != null &&
      specs.size_code != null &&
      specs.unit_value != null;
    const financialParams: FinancialPricingParams | null = hasDirectParams
      ? {
          print_mode: specs.print_mode as FinancialPricingParams['print_mode'],
          size_code: specs.size_code as FinancialPricingParams['size_code'],
          paper_type: specs.paper_type ?? undefined,
          unit_value: Number(specs.unit_value),
        }
      : specs.service_id
        ? specsToFinancialParams(specs)
        : null;

    if (specs.service_id && financialParams) {
      const { print_mode: pm, size_code: sc, paper_type: pt, unit_value: uv } = financialParams;
      try {
        const priced = await calculateFinancialPrice({
          service_id: specs.service_id,
          print_mode: pm,
          size_code: sc,
          paper_type: pt ?? undefined,
          unit_value: uv,
          quantity: item.quantity,
        });
        resolvedUnitPrice = priced.unitPrice * uv;
        effectiveSpecs = { ...specs, print_mode: pm, size_code: sc, paper_type: pt, unit_value: uv };
      } catch {
        // غياب قاعدة أو شريحة مناسبة: نبقى على السعر 0 ولا نرفض الطلب
      }
    }

    const resolvedTotalPrice = resolvedUnitPrice * item.quantity;
    computedTotalAmount += resolvedTotalPrice;
    normalizedItems.push({
      ...item,
      specifications: effectiveSpecs,
      resolved_unit_price: resolvedUnitPrice,
      resolved_total_price: resolvedTotalPrice,
    });
  }

  const discount = input.discount_amount ?? 0;
  const tax = input.tax_amount ?? 0;
  const computedFinalAmount = Math.max(0, computedTotalAmount - discount + tax);

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // لا نستخدم FOR UPDATE مع COUNT — PostgreSQL يرفض ذلك (0A000). الترتيب داخل الـ transaction كافٍ؛ order_number فريد فالتصادم نادر.
    const seqResult = await tx.$queryRaw<[{ seq: bigint }]>`
      SELECT COUNT(*) + 1 AS seq FROM orders
      WHERE created_at >= ${todayStart} AND created_at < ${todayEnd}
    `;
    const sequenceNumber = Number(seqResult[0]?.seq ?? 1);
    const orderNumber = generateOrderNumber(today, sequenceNumber);

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        serviceId: input.service_id ?? null,
        customerId: input.customer_id ?? null,
        customerName: input.customer_name ?? null,
        customerPhone: input.customer_phone ?? null,
        customerWhatsapp: input.customer_whatsapp ?? null,
        shopName: input.shop_name ?? null,
        status: 'pending',
        totalAmount: new Decimal(computedTotalAmount),
        discountAmount: new Decimal(discount),
        taxAmount: new Decimal(tax),
        finalAmount: new Decimal(computedFinalAmount),
        remainingAmount: new Decimal(computedFinalAmount),
        paymentMethod: input.payment_method ?? 'sham_cash',
        deliveryType: input.delivery_type ?? 'self',
        deliveryAddress: input.delivery_address ?? buildDeliveryAddress(input),
        deliveryStreet: input.delivery_street ?? null,
        deliveryNeighborhood: input.delivery_neighborhood ?? null,
        deliveryBuildingFloor: input.delivery_building_floor ?? null,
        deliveryExtra: input.delivery_extra ?? null,
        deliveryLatitude: input.delivery_latitude != null ? new Decimal(input.delivery_latitude) : null,
        deliveryLongitude: input.delivery_longitude != null ? new Decimal(input.delivery_longitude) : null,
        deliveryDate: input.delivery_date ? new Date(input.delivery_date) : null,
        notes: input.notes ?? null,
        createdById: createdById ?? null,
      },
    });

    for (let i = 0; i < normalizedItems.length; i++) {
      const item = normalizedItems[i];
      if (!item) continue;
      const unitPrice = item.resolved_unit_price;
      const totalPrice = item.resolved_total_price;

      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.product_id ?? null,
          productName: item.product_name ?? null,
          quantity: item.quantity,
          unitPrice: new Decimal(unitPrice),
          totalPrice: new Decimal(totalPrice),
          sizeId: item.size_id ?? null,
          materialId: item.material_id ?? null,
          specifications: item.specifications != null ? (item.specifications as Prisma.InputJsonValue) : undefined,
          designFiles: item.design_files ?? undefined,
          productionNotes: item.production_notes ?? null,
        },
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: 'pending',
        changedBy: createdById ?? null,
        notes: 'تم إنشاء الطلب',
      },
    });

    return newOrder;
  });

  const orderEvent = {
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    created_at: order.createdAt,
  };

  try {
    emitToStaff('order_created', orderEvent);
    if (input.customer_id) {
      emitToCustomer(input.customer_id, 'order_created', orderEvent);
    }
  } catch {
    // Socket may not be initialized in tests
  }

  return {
    id: order.id,
    order_number: order.orderNumber,
  };
}

export async function getOrders(
  filters: OrderFilters,
  userId?: string,
  isStaff?: boolean,
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.status) {
    if (filters.status.toLowerCase() === 'active') {
      where['status'] = { in: ['pending', 'confirmed', 'processing'] };
    } else {
      where['status'] = filters.status;
    }
  }

  if (!isStaff && userId) {
    where['customerId'] = userId;
  } else if (filters.customer_id) {
    where['customerId'] = filters.customer_id;
  }

  const orderQuery = prisma.order.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true },
      },
      service: {
        select: { id: true, nameAr: true, nameEn: true },
      },
      items: {
        select: { id: true, productName: true, quantity: true, unitPrice: true, totalPrice: true },
      },
    },
  });

  const [orders, total] = await Promise.all([orderQuery, prisma.order.count({ where })]);

  type OrderWithRelations = Awaited<typeof orderQuery>[number];
  type OrderItemSelect = OrderWithRelations['items'][number];

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
    created_at: o.createdAt,
    customer: o.customer
      ? {
          id: o.customer.id,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.customer.email,
        }
      : null,
    items: o.items.map((i: OrderItemSelect) => ({
      id: i.id,
      product_name: i.productName,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice),
      total_price: Number(i.totalPrice),
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

export async function getOrderById(
  orderId: string,
  userId?: string,
  isStaff?: boolean,
): Promise<Record<string, unknown> | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true },
      },
      service: {
        select: { id: true, nameAr: true, nameEn: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, nameAr: true },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  if (!isStaff && userId && order.customerId !== userId) {
    return null;
  }

  interface OrderItemWithProduct {
    id: string;
    productId: string | null;
    productName: string | null;
    product: { id: string; name: string | null; nameAr: string | null } | null;
    quantity: number;
    unitPrice: unknown;
    totalPrice: unknown;
    sizeId: string | null;
    materialId: string | null;
    specifications: unknown;
    designFiles: unknown;
    productionNotes: string | null;
    status: string;
  }
  interface StatusHistoryWithUser {
    id: string;
    status: string;
    notes: string | null;
    user: { id: string; name: string } | null;
    createdAt: Date;
  }

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
    delivery_date: order.deliveryDate,
    notes: order.notes,
    staff_notes: order.staffNotes,
    created_at: order.createdAt,
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
        }
      : null,
    items: order.items.map((i: OrderItemWithProduct) => ({
      id: i.id,
      product_id: i.productId,
      product_name: i.productName,
      product: i.product
        ? { id: i.product.id, name: i.product.name, name_ar: i.product.nameAr }
        : null,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice),
      total_price: Number(i.totalPrice),
      size_id: i.sizeId,
      material_id: i.materialId,
      specifications: i.specifications,
      design_files: i.designFiles,
      production_notes: i.productionNotes,
      status: i.status,
    })),
    status_history: order.statusHistory.map((h: StatusHistoryWithUser) => ({
      id: h.id,
      status: h.status,
      notes: h.notes,
      changed_by: h.user ? { id: h.user.id, name: h.user.name } : null,
      created_at: h.createdAt,
    })),
  };
}

export async function getOrderAttachments(orderId: string): Promise<{ url: string; original_name?: string }[]> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { designFiles: true },
  });

  const attachments: { url: string; original_name?: string }[] = [];

  for (const item of items) {
    const files = item.designFiles as string[] | null;
    if (Array.isArray(files)) {
      for (const f of files) {
        const entry = typeof f === 'string' ? { url: f } : { url: (f as { url?: string }).url ?? String(f), original_name: (f as { original_name?: string }).original_name };
        if (entry.url) attachments.push(entry);
      }
    }
  }

  return attachments;
}

export async function getOrderStatusHistory(orderId: string): Promise<Record<string, unknown>[]> {
  const historyQuery = prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
  const history = await historyQuery;

  type HistoryWithUser = Awaited<typeof historyQuery>[number];
  return history.map((h: HistoryWithUser) => ({
    id: h.id,
    status: h.status,
    notes: h.notes,
    changed_by: h.user ? { id: h.user.id, name: h.user.name } : null,
    created_at: h.createdAt,
  }));
}

export async function uploadOrderFile(
  file: { filename: string; file: NodeJS.ReadableStream; mimetype: string },
): Promise<{ filename: string; url: string; original_name: string }> {
  const result = await saveUploadedFile(file, 'order-temp');
  return {
    filename: result.filename,
    url: result.url,
    original_name: result.originalName,
  };
}

export async function getReorderData(orderId: string): Promise<Record<string, unknown> | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              sizes: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  type ReorderOrder = NonNullable<typeof order>;
  type ReorderItem = ReorderOrder['items'][number];
  type ReorderProductSize = NonNullable<ReorderItem['product']>['sizes'][number];

  return {
    order_id: order.id,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_whatsapp: order.customerWhatsapp,
    shop_name: order.shopName,
    items: order.items.map((i: ReorderItem) => ({
      product_id: i.productId,
      product_name: i.productName,
      product: i.product
        ? {
            id: i.product.id,
            name: i.product.name,
            name_ar: i.product.nameAr,
            sizes: i.product.sizes.map((s: ReorderProductSize) => ({
              id: s.id,
              size_name: s.sizeName,
              price_multiplier: Number(s.priceMultiplier ?? 1),
            })),
          }
        : null,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice),
      size_id: i.sizeId,
      material_id: i.materialId,
      specifications: i.specifications,
      design_files: i.designFiles,
      production_notes: i.productionNotes,
    })),
    total_amount: Number(order.totalAmount),
    final_amount: Number(order.finalAmount),
  };
}
