import { prisma } from '../../config/database.js';
import { applyBulkPriceUpdate } from '../../algorithms/advanced-pricing.algorithm.js';
import { Prisma } from '@prisma/client';

interface GetPricingRulesFilters {
  is_active?: boolean;
  calculation_type?: string;
}

interface CalculatePriceInput {
  quantity: number;
  specifications?: Record<string, unknown>;
}

interface GetAdvancedPricingRulesFilters {
  categoryId?: string;
  paperSize?: string;
  paperType?: string;
  printType?: string;
  isActive?: boolean;
}

interface CreateAdvancedPricingRuleInput {
  categoryId: string;
  paperSize: string;
  paperType?: string;
  printType: string;
  qualityType?: string;
  pricePerPage: number;
  unit?: string;
  isActive?: boolean;
  displayOrder?: number;
}

interface CalculateAdvancedPriceInput {
  categoryId: string;
  quantity: number;
  widthCm?: number;
  heightCm?: number;
  paperSize?: string;
}

interface BulkUpdatePricesInput {
  percentage: number;
  operation: 'increase' | 'decrease';
  target: 'pricing_rules' | 'pricing_configs' | 'both';
}

interface ServicePricingCoverageItem {
  service_id: string;
  service_name_ar: string;
  service_name_en: string | null;
  has_pricing: boolean;
  matched_rules_count: number;
  matched_rules: Array<{ id: string; name_ar: string; calculation_type: string }>;
}

interface FinancialRangeInput {
  min_value: number;
  max_value?: number | null;
  unit_price: number;
  display_order?: number;
}

interface FinancialDimensionInput {
  print_mode: 'bw' | 'color_normal' | 'color_laser';
  size_code: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'BOOKLET_A5' | 'BOOKLET_B5' | 'BOOKLET_A4';
  display_order?: number;
  ranges: FinancialRangeInput[];
}

interface CreateFinancialRuleInput {
  service_id: string;
  name: string;
  name_en?: string;
  unit_type: string;
  priority?: number;
  is_active?: boolean;
  dimensions: FinancialDimensionInput[];
}

interface UpdateFinancialRuleInput extends Partial<CreateFinancialRuleInput> {}

interface CalculateFinancialPriceInput {
  service_id: string;
  print_mode: 'bw' | 'color_normal' | 'color_laser';
  size_code: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'BOOKLET_A5' | 'BOOKLET_B5' | 'BOOKLET_A4';
  unit_value: number;
  quantity: number;
}

interface PricingRuleWhereInput {
  isActive?: boolean;
}

export async function getPricingRules(filters?: GetPricingRulesFilters) {
  const where: PricingRuleWhereInput = {};
  if (filters?.is_active !== undefined) {
    where.isActive = filters.is_active;
  }
  return prisma.pricingRule.findMany({
    where,
    include: { service: { select: { id: true, nameAr: true, nameEn: true } }, ranges: { orderBy: { displayOrder: 'asc' } } },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getPricingRuleById(ruleId: string) {
  const rule = await prisma.pricingRule.findUnique({
    where: { id: ruleId },
    include: { service: { select: { id: true, nameAr: true, nameEn: true } }, ranges: { orderBy: { displayOrder: 'asc' } } },
  });
  if (!rule) throw { statusCode: 404, message: 'قاعدة التسعير غير موجودة' };
  return rule;
}

export async function createPricingRule(input: CreateFinancialRuleInput) {
  return createFinancialRule(input);
}

export async function updatePricingRule(ruleId: string, input: UpdateFinancialRuleInput) {
  return updateFinancialRule(ruleId, input);
}

export async function deletePricingRule(ruleId: string) {
  await getPricingRuleById(ruleId);
  await prisma.pricingRule.delete({ where: { id: ruleId } });
  return { success: true, message: 'تم حذف قاعدة التسعير بنجاح' };
}

export async function calculatePriceFromRules(input: CalculatePriceInput & Partial<CalculateFinancialPriceInput>) {
  const serviceId = input.service_id ?? (input.specifications as Record<string, unknown> | undefined)?.service_id as string | undefined;
  const printMode = input.print_mode ?? (input.specifications as Record<string, unknown> | undefined)?.print_mode as 'bw' | 'color_normal' | 'color_laser' | undefined;
  const sizeCode = input.size_code ?? (input.specifications as Record<string, unknown> | undefined)?.size_code as string | undefined;
  const unitValue = input.unit_value ?? (input.specifications as Record<string, unknown> | undefined)?.unit_value as number | undefined;
  const quantity = input.quantity;

  if (serviceId && printMode && sizeCode && unitValue != null) {
    const result = await calculateFinancialPrice({
      service_id: serviceId,
      print_mode: printMode,
      size_code: sizeCode as 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'BOOKLET_A5' | 'BOOKLET_B5' | 'BOOKLET_A4',
      unit_value: unitValue,
      quantity,
    });
    const rule = await prisma.pricingRule.findUnique({ where: { id: result.ruleId }, select: { nameAr: true } });
    return {
      ruleId: result.ruleId,
      ruleNameAr: rule?.nameAr ?? '',
      quantity,
      unitPrice: result.unitPrice,
      totalPrice: result.totalPrice,
    };
  }
  throw { statusCode: 400, message: 'لحساب السعر استخدم معاملات الخدمة: service_id, print_mode, size_code, unit_value, quantity' };
}

export async function calculatePriceByRule(ruleId: string, input: CalculatePriceInput) {
  const rule = await getPricingRuleById(ruleId);
  const specs = (input.specifications ?? {}) as Record<string, unknown>;
  const printMode = specs.print_mode as string | undefined;
  const sizeCode = specs.size_code as string | undefined;
  const unitValue = specs.unit_value as number | undefined;
  if (printMode == null || sizeCode == null || unitValue == null) {
    throw { statusCode: 400, message: 'يجب تمرير print_mode و size_code و unit_value في specifications لحساب السعر حسب القاعدة' };
  }
  const ranges = rule.ranges.filter((r) => r.printMode === printMode && r.sizeCode === sizeCode).sort((a, b) => a.displayOrder - b.displayOrder);
  const matched = ranges.find((r) => {
    const min = Number(r.minValue);
    const max = r.maxValue != null ? Number(r.maxValue) : null;
    if (max == null) return unitValue >= min;
    return unitValue >= min && unitValue <= max;
  });
  if (!matched) {
    throw { statusCode: 404, message: 'لا توجد شريحة سعر مطابقة لـ print_mode و size_code و unit_value المحددين' };
  }
  const unitPrice = Number(matched.unitPrice);
  const totalPrice = unitPrice * unitValue * input.quantity;
  return {
    ruleId: rule.id,
    ruleNameAr: rule.nameAr,
    quantity: input.quantity,
    unitPrice,
    totalPrice,
  };
}

export async function getAdvancedPricingRules(_filters?: GetAdvancedPricingRulesFilters) {
  return [];
}

export async function createAdvancedPricingRule(_input: CreateAdvancedPricingRuleInput) {
  throw { statusCode: 410, message: 'تم إيقاف قواعد التسعير المتقدمة؛ استخدم قواعد التسعير المالية حسب الخدمة' };
}

export async function calculateAdvancedPriceFromRules(
  _input: CalculateAdvancedPriceInput,
): Promise<{ configId: string; categoryNameAr: string; paperSize: string; quantity: number; unitPrice: number; totalPrice: number; detectedPaperSize: string | null }> {
  throw { statusCode: 410, message: 'تم إيقاف حساب السعر المتقدم؛ استخدم /pricing/calculate-financial-price' };
}

export async function bulkUpdatePrices(input: BulkUpdatePricesInput) {
  const { percentage, operation, target } = input;
  if (percentage <= 0 || percentage > 100) {
    throw { statusCode: 400, message: 'النسبة يجب أن تكون بين 1 و 100' };
  }
  let rangesUpdated = 0;
  if (target === 'pricing_rules' || target === 'both') {
    const ranges = await prisma.pricingRuleRange.findMany();
    for (const range of ranges) {
      const newPrice = applyBulkPriceUpdate(Number(range.unitPrice), percentage, operation);
      await prisma.pricingRuleRange.update({
        where: { id: range.id },
        data: { unitPrice: new Prisma.Decimal(newPrice) },
      });
      rangesUpdated++;
    }
  }
  return {
    success: true,
    message: 'تم تحديث الأسعار بنجاح',
    rulesUpdated: rangesUpdated,
    configsUpdated: 0,
  };
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export async function getServicePricingCoverage(): Promise<ServicePricingCoverageItem[]> {
  const [services, pricingRules] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, isVisible: true },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.pricingRule.findMany({
      where: { isActive: true },
      select: {
        id: true,
        serviceId: true,
        nameAr: true,
        ranges: { select: { id: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  type ServiceRow = (typeof services)[number];
  type PricingRuleRow = (typeof pricingRules)[number];

  return services.map((service: ServiceRow) => {
    const matched = pricingRules.filter((rule: PricingRuleRow) => rule.serviceId === service.id);
    const matchedWithRanges = matched.filter((rule) => rule.ranges.length > 0);
    return {
      service_id: service.id,
      service_name_ar: service.nameAr,
      service_name_en: service.nameEn,
      has_pricing: matchedWithRanges.length > 0,
      matched_rules_count: matched.length,
      matched_rules: matched.map((rule: PricingRuleRow) => ({
        id: rule.id,
        name_ar: rule.nameAr,
        calculation_type: 'financial',
      })),
    };
  });
}

function validateSequentialRanges(ranges: FinancialRangeInput[]): void {
  const sorted = [...ranges].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  if (sorted.length === 0) throw { statusCode: 400, message: 'يجب إدخال رينج واحد على الأقل' };
  const first = sorted[0];
  if (!first || first.min_value !== 0) {
    throw { statusCode: 400, message: 'أول رينج يجب أن يبدأ من الصفر' };
  }

  let previousMax: number | null = null;
  sorted.forEach((range, idx) => {
    if (range.max_value != null && range.max_value <= range.min_value) {
      throw { statusCode: 400, message: `الرينج رقم ${idx + 1} غير صالح: max يجب أن تكون أكبر من min` };
    }
    if (previousMax != null && range.min_value <= previousMax) {
      throw { statusCode: 400, message: `الرينج رقم ${idx + 1} متداخل مع الرينج السابق` };
    }
    previousMax = range.max_value ?? null;
  });
}

export async function getFinancialRules(serviceId?: string) {
  const rules = await prisma.pricingRule.findMany({
    where: serviceId ? { serviceId } : {},
    include: {
      service: { select: { id: true, nameAr: true, nameEn: true } },
      ranges: { orderBy: { displayOrder: 'asc' } },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
  return rules.map((rule) => ({
    id: rule.id,
    serviceId: rule.serviceId,
    name: rule.nameAr,
    nameEn: rule.nameEn,
    unitType: rule.unitType,
    priority: rule.priority,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    service: rule.service,
    dimensions: groupRangesByDimension(rule.ranges),
  }));
}

function groupRangesByDimension(
  ranges: Array<{ id: string; printMode: string; sizeCode: string; minValue: unknown; maxValue: unknown; unitPrice: unknown; displayOrder: number }>,
) {
  const byKey = new Map<string, typeof ranges>();
  for (const r of ranges) {
    const key = `${r.printMode}:${r.sizeCode}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(r);
  }
  return Array.from(byKey.entries()).map(([key, rs]) => {
    const [printMode, sizeCode] = key.split(':');
    return {
      id: rs[0]?.id ?? '',
      printMode,
      sizeCode,
      displayOrder: rs[0]?.displayOrder ?? 0,
      isActive: true,
      ranges: rs.sort((a, b) => a.displayOrder - b.displayOrder).map((r) => ({
        id: r.id,
        minValue: r.minValue,
        maxValue: r.maxValue,
        unitPrice: r.unitPrice,
        displayOrder: r.displayOrder,
      })),
    };
  });
}

export async function createFinancialRule(input: CreateFinancialRuleInput) {
  for (const dimension of input.dimensions) {
    validateSequentialRanges(dimension.ranges);
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const service = await tx.service.findUnique({
      where: { id: input.service_id },
      select: { id: true },
    });
    if (!service) throw { statusCode: 404, message: 'الخدمة غير موجودة' };

    const createdRule = await tx.pricingRule.create({
      data: {
        serviceId: input.service_id,
        nameAr: input.name,
        nameEn: input.name_en ?? null,
        unitType: input.unit_type,
        priority: input.priority ?? 0,
        isActive: input.is_active ?? true,
      },
    });

    for (const dimension of input.dimensions) {
      for (const range of dimension.ranges) {
        await tx.pricingRuleRange.create({
          data: {
            ruleId: createdRule.id,
            printMode: dimension.print_mode,
            sizeCode: dimension.size_code,
            minValue: new Prisma.Decimal(range.min_value),
            maxValue: range.max_value != null ? new Prisma.Decimal(range.max_value) : null,
            unitPrice: new Prisma.Decimal(range.unit_price),
            displayOrder: range.display_order ?? 0,
          },
        });
      }
    }

    return createdRule;
  });
}

export async function updateFinancialRule(ruleId: string, input: UpdateFinancialRuleInput) {
  const rule = await prisma.pricingRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw { statusCode: 404, message: 'القاعدة المالية غير موجودة' };

  if (input.dimensions) {
    for (const dimension of input.dimensions) {
      validateSequentialRanges(dimension.ranges);
    }
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedRule = await tx.pricingRule.update({
      where: { id: ruleId },
      data: {
        serviceId: input.service_id ?? undefined,
        nameAr: input.name ?? undefined,
        nameEn: input.name_en ?? undefined,
        unitType: input.unit_type ?? undefined,
        priority: input.priority ?? undefined,
        isActive: input.is_active ?? undefined,
      },
    });

    if (input.dimensions) {
      await tx.pricingRuleRange.deleteMany({ where: { ruleId } });

      for (const dimension of input.dimensions) {
        for (const range of dimension.ranges) {
          await tx.pricingRuleRange.create({
            data: {
              ruleId,
              printMode: dimension.print_mode,
              sizeCode: dimension.size_code,
              minValue: new Prisma.Decimal(range.min_value),
              maxValue: range.max_value != null ? new Prisma.Decimal(range.max_value) : null,
              unitPrice: new Prisma.Decimal(range.unit_price),
              displayOrder: range.display_order ?? 0,
            },
          });
        }
      }
    }

    return updatedRule;
  });
}

export async function deleteFinancialRule(ruleId: string) {
  await prisma.pricingRule.delete({ where: { id: ruleId } });
  return { success: true };
}

export async function calculateFinancialPrice(input: CalculateFinancialPriceInput) {
  const rule = await prisma.pricingRule.findFirst({
    where: {
      serviceId: input.service_id,
      isActive: true,
    },
    include: {
      ranges: {
        where: {
          printMode: input.print_mode,
          sizeCode: input.size_code,
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { priority: 'asc' },
  });

  if (!rule) {
    throw { statusCode: 404, message: 'التسعير لهذه الخدمة غير كامل أو غير موجود' };
  }

  const unitValue = input.unit_value;
  const matchedRange = rule.ranges.find((range) => {
    const min = Number(range.minValue);
    const max = range.maxValue != null ? Number(range.maxValue) : null;
    if (max == null) return unitValue >= min;
    return unitValue >= min && unitValue <= max;
  });

  if (!matchedRange) {
    throw { statusCode: 404, message: 'التسعير لهذه الخدمة غير كامل أو غير موجود' };
  }

  const unitPrice = Number(matchedRange.unitPrice);
  const totalPrice = unitPrice * input.unit_value * input.quantity;
  return {
    ruleId: rule.id,
    dimensionId: matchedRange.id,
    rangeId: matchedRange.id,
    unitType: rule.unitType,
    unitPrice,
    totalPrice,
  };
}

export async function importLegacyFinancialTemplates() {
  const services = await prisma.service.findMany({
    where: { isActive: true, isVisible: true },
    select: { id: true, nameAr: true },
  });

  const printableService = services.find((s) => normalizeText(s.nameAr).includes('طباعة')) ?? services[0];
  if (!printableService) {
    throw { statusCode: 404, message: 'لا توجد خدمات متاحة للاستيراد' };
  }

  const existing = await prisma.pricingRule.findFirst({
    where: { serviceId: printableService.id, nameAr: 'قاعدة طباعة افتراضية' },
    select: { id: true },
  });
  if (existing) return { success: true, imported: 0, message: 'القالب موجود مسبقاً' };

  await createFinancialRule({
    service_id: printableService.id,
    name: 'قاعدة طباعة افتراضية',
    unit_type: 'page',
    priority: 0,
    is_active: true,
    dimensions: [
      {
        print_mode: 'bw',
        size_code: 'A4',
        ranges: [
          { min_value: 0, max_value: 10, unit_price: 1800, display_order: 1 },
          { min_value: 11, max_value: 100, unit_price: 1500, display_order: 2 },
          { min_value: 101, max_value: null, unit_price: 1200, display_order: 3 },
        ],
      },
      {
        print_mode: 'color_normal',
        size_code: 'A4',
        ranges: [
          { min_value: 0, max_value: 10, unit_price: 2800, display_order: 1 },
          { min_value: 11, max_value: 100, unit_price: 2400, display_order: 2 },
          { min_value: 101, max_value: null, unit_price: 2100, display_order: 3 },
        ],
      },
      {
        print_mode: 'color_laser',
        size_code: 'A4',
        ranges: [
          { min_value: 0, max_value: 10, unit_price: 3500, display_order: 1 },
          { min_value: 11, max_value: 100, unit_price: 3200, display_order: 2 },
          { min_value: 101, max_value: null, unit_price: 2900, display_order: 3 },
        ],
      },
    ],
  });

  return { success: true, imported: 1, message: 'تم استيراد قالب مالي مبدئي من النظام القديم' };
}

/**
 * اسم قاعدة التسعير الافتراضية عند ملء القاعدة المالية الكاملة.
 * الأسعار في الشرائح افتراضية؛ تعديل الأرقام يتم من لوحة المالية/التسعير.
 */
const DEFAULT_FINANCIAL_RULE_NAME_AR = 'قاعدة تسعير افتراضية';

/** أبعاد تسعير موحّدة: أوضاع الطباعة × أحجام الورق، مع شرائح أسعار افتراضية (قابلة للتعديل لاحقاً من لوحة التسعير) */
const DEFAULT_FINANCIAL_DIMENSIONS: FinancialDimensionInput[] = (
  [
    { print_mode: 'bw' as const, ranges: [0, 10, 1800, 11, 100, 1500, 101, null, 1200] },
    { print_mode: 'color_normal' as const, ranges: [0, 10, 2800, 11, 100, 2400, 101, null, 2100] },
    { print_mode: 'color_laser' as const, ranges: [0, 10, 3500, 11, 100, 3200, 101, null, 2900] },
  ] as const
).flatMap(({ print_mode, ranges: r }) =>
  (['A3', 'A4', 'A5', 'A6', 'BOOKLET_A5', 'BOOKLET_B5', 'BOOKLET_A4'] as const).map((size_code) => ({
    print_mode,
    size_code,
    ranges: [
      { min_value: r[0], max_value: r[1], unit_price: r[2], display_order: 1 },
      { min_value: r[3], max_value: r[4], unit_price: r[5], display_order: 2 },
      { min_value: r[6], max_value: r[7], unit_price: r[8], display_order: 3 },
    ],
  })),
);

/**
 * ملء قاعدة مالية كاملة لجميع الخدمات النشطة/المرئية: قاعدة تسعير افتراضية واحدة لكل خدمة
 * بأبعاد (print_mode × size_code) وشرائح أسعار افتراضية. يبقى على المدير تعديل الأرقام من لوحة التسعير.
 */
export async function seedFullFinancialPricing(): Promise<{
  created: number;
  skipped: number;
  errors: string[];
}> {
  const services = await prisma.service.findMany({
    where: { isActive: true, isVisible: true },
    select: { id: true, nameAr: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const service of services) {
    const existing = await prisma.pricingRule.findFirst({
      where: {
        serviceId: service.id,
        nameAr: DEFAULT_FINANCIAL_RULE_NAME_AR,
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      await createFinancialRule({
        service_id: service.id,
        name: DEFAULT_FINANCIAL_RULE_NAME_AR,
        name_en: 'Default pricing rule',
        unit_type: 'page',
        priority: 0,
        is_active: true,
        dimensions: DEFAULT_FINANCIAL_DIMENSIONS,
      });
      created += 1;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err);
      errors.push(`${service.nameAr} (${service.id}): ${msg}`);
    }
  }

  return {
    created,
    skipped,
    errors,
  };
}
