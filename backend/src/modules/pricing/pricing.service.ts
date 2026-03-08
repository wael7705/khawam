import { prisma } from '../../config/database.js';
import { calculatePrice, findBestMatchingRule } from '../../algorithms/pricing.algorithm.js';
import {
  detectPaperSize,
  calculateAdvancedPrice,
  applyBulkPriceUpdate,
} from '../../algorithms/advanced-pricing.algorithm.js';
import { Prisma } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';

type CalculationType = 'piece' | 'area' | 'page';

interface PriceMultipliers {
  color?: Record<string, number>;
  sides?: Record<string, number>;
  [key: string]: Record<string, number> | undefined;
}

interface PriceSpecifications {
  color?: string;
  sides?: string;
  paper_size?: string;
  unit?: string;
  [key: string]: string | undefined;
}

interface GetPricingRulesFilters {
  is_active?: boolean;
  calculation_type?: CalculationType;
}

interface CreatePricingRuleInput {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  calculationType: CalculationType;
  basePrice: number;
  priceMultipliers?: JsonValue | Record<string, unknown>;
  specifications?: JsonValue | Record<string, unknown>;
  unit?: string;
  isActive?: boolean;
  displayOrder?: number;
}

interface UpdatePricingRuleInput extends Partial<CreatePricingRuleInput> {}

interface CalculatePriceInput {
  quantity: number;
  specifications?: PriceSpecifications;
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
  calculationType?: string;
}

function asInputJson(
  value: JsonValue | Record<string, unknown> | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function getPricingRules(filters?: GetPricingRulesFilters) {
  const where: PricingRuleWhereInput = {};

  if (filters?.is_active !== undefined) {
    where.isActive = filters.is_active;
  }
  if (filters?.calculation_type) {
    where.calculationType = filters.calculation_type;
  }

  return prisma.pricingRule.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getPricingRuleById(ruleId: string) {
  const rule = await prisma.pricingRule.findUnique({
    where: { id: ruleId },
  });
  if (!rule) throw { statusCode: 404, message: 'قاعدة التسعير غير موجودة' };
  return rule;
}

export async function createPricingRule(input: CreatePricingRuleInput) {
  const validTypes: CalculationType[] = ['piece', 'area', 'page'];
  if (!validTypes.includes(input.calculationType)) {
    throw {
      statusCode: 400,
      message: 'نوع الحساب يجب أن يكون piece أو area أو page',
    };
  }

  return prisma.pricingRule.create({
    data: {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      calculationType: input.calculationType,
      basePrice: input.basePrice,
      priceMultipliers: asInputJson(input.priceMultipliers),
      specifications: asInputJson(input.specifications),
      unit: input.unit,
      isActive: input.isActive ?? true,
      displayOrder: input.displayOrder ?? 0,
    },
  });
}

export async function updatePricingRule(ruleId: string, input: UpdatePricingRuleInput) {
  if (input.calculationType) {
    const validTypes: CalculationType[] = ['piece', 'area', 'page'];
    if (!validTypes.includes(input.calculationType)) {
      throw {
        statusCode: 400,
        message: 'نوع الحساب يجب أن يكون piece أو area أو page',
      };
    }
  }

  await getPricingRuleById(ruleId);

  interface PricingRuleUpdateInput {
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    calculationType?: string;
    basePrice?: number;
    priceMultipliers?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    specifications?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    unit?: string;
    isActive?: boolean;
    displayOrder?: number;
  }
  const data: PricingRuleUpdateInput = {};
  if (input.nameAr !== undefined) data.nameAr = input.nameAr;
  if (input.nameEn !== undefined) data.nameEn = input.nameEn;
  if (input.descriptionAr !== undefined) data.descriptionAr = input.descriptionAr;
  if (input.descriptionEn !== undefined) data.descriptionEn = input.descriptionEn;
  if (input.calculationType !== undefined) data.calculationType = input.calculationType;
  if (input.basePrice !== undefined) data.basePrice = input.basePrice;
  if (input.priceMultipliers !== undefined) data.priceMultipliers = asInputJson(input.priceMultipliers);
  if (input.specifications !== undefined) data.specifications = asInputJson(input.specifications);
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;

  return prisma.pricingRule.update({
    where: { id: ruleId },
    data,
  });
}

export async function deletePricingRule(ruleId: string) {
  await getPricingRuleById(ruleId);
  await prisma.pricingRule.delete({ where: { id: ruleId } });
  return { success: true, message: 'تم حذف قاعدة التسعير بنجاح' };
}

export async function calculatePriceFromRules(input: CalculatePriceInput) {
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  if (rules.length === 0) {
    throw { statusCode: 404, message: 'لا توجد قواعد تسعير نشطة' };
  }

  type PricingRule = Awaited<ReturnType<typeof prisma.pricingRule.findMany>>[number];
  const ruleMatches = rules.map((r: PricingRule) => ({
    ruleId: r.id,
    basePrice: Number(r.basePrice),
    priceMultipliers: r.priceMultipliers as PriceMultipliers | null,
    specifications: r.specifications as PriceSpecifications | null,
    unit: r.unit,
    nameAr: r.nameAr,
  }));

  const requestSpecs: PriceSpecifications = input.specifications ?? {};
  const bestRule = findBestMatchingRule(ruleMatches, requestSpecs);
  const matchedRule = rules.find((r: PricingRule) => r.id === bestRule.ruleId)!;

  const price = calculatePrice({
    calculationType: matchedRule.calculationType as CalculationType,
    quantity: input.quantity,
    basePrice: bestRule.basePrice,
    priceMultipliers: bestRule.priceMultipliers,
    specifications: bestRule.specifications ?? input.specifications ?? null,
  });

  return {
    ruleId: bestRule.ruleId,
    ruleNameAr: bestRule.nameAr,
    quantity: input.quantity,
    unitPrice: bestRule.basePrice,
    totalPrice: price,
  };
}

export async function calculatePriceByRule(ruleId: string, input: CalculatePriceInput) {
  const rule = await getPricingRuleById(ruleId);

  const price = calculatePrice({
    calculationType: rule.calculationType as CalculationType,
    quantity: input.quantity,
    basePrice: Number(rule.basePrice),
    priceMultipliers: rule.priceMultipliers as PriceMultipliers | null,
    specifications: (input.specifications ?? rule.specifications) as PriceSpecifications | null,
  });

  return {
    ruleId: rule.id,
    ruleNameAr: rule.nameAr,
    quantity: input.quantity,
    unitPrice: Number(rule.basePrice),
    totalPrice: price,
  };
}

interface PricingConfigWhereInput {
  categoryId?: string;
  paperSize?: string;
  paperType?: string;
  printType?: string;
  isActive?: boolean;
}

export async function getAdvancedPricingRules(filters?: GetAdvancedPricingRulesFilters) {
  const where: PricingConfigWhereInput = {};

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.paperSize) where.paperSize = filters.paperSize;
  if (filters?.paperType) where.paperType = filters.paperType;
  if (filters?.printType) where.printType = filters.printType;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.pricingConfig.findMany({
    where,
    include: { category: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createAdvancedPricingRule(input: CreateAdvancedPricingRuleInput) {
  const category = await prisma.pricingCategory.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
    throw { statusCode: 404, message: 'فئة التسعير غير موجودة' };
  }

  return prisma.pricingConfig.create({
    data: {
      categoryId: input.categoryId,
      paperSize: input.paperSize,
      paperType: input.paperType,
      printType: input.printType,
      qualityType: input.qualityType,
      pricePerPage: input.pricePerPage,
      unit: input.unit ?? 'صفحة',
      isActive: input.isActive ?? true,
      displayOrder: input.displayOrder ?? 0,
    },
    include: { category: true },
  });
}

export async function calculateAdvancedPriceFromRules(input: CalculateAdvancedPriceInput) {
  let paperSize = input.paperSize;

  if (!paperSize && input.widthCm != null && input.heightCm != null) {
    paperSize = detectPaperSize(input.widthCm, input.heightCm) ?? undefined;
  }

  const where: PricingConfigWhereInput = {
    categoryId: input.categoryId,
    isActive: true,
  };
  if (paperSize) where.paperSize = paperSize;

  const configs = await prisma.pricingConfig.findMany({
    where,
    include: { category: true },
    orderBy: { displayOrder: 'asc' },
  });

  if (configs.length === 0) {
    throw {
      statusCode: 404,
      message: paperSize
        ? `لا يوجد إعداد تسعير لـ ${paperSize} في هذه الفئة`
        : 'لا توجد قواعد تسعير متقدمة مطابقة',
    };
  }

  const config = configs[0]!;
  const basePrice = Number(config.pricePerPage);
  const calculationType = 'page' as const;

  const totalPrice = calculateAdvancedPrice({
    calculationType,
    quantity: input.quantity,
    basePrice,
    widthCm: input.widthCm,
    heightCm: input.heightCm,
  });

  return {
    configId: config.id,
    categoryNameAr: config.category.nameAr,
    paperSize: config.paperSize,
    quantity: input.quantity,
    unitPrice: basePrice,
    totalPrice,
    detectedPaperSize: paperSize ?? null,
  };
}

export async function bulkUpdatePrices(input: BulkUpdatePricesInput) {
  const { percentage, operation, target } = input;

  if (percentage <= 0 || percentage > 100) {
    throw { statusCode: 400, message: 'النسبة يجب أن تكون بين 1 و 100' };
  }

  let rulesUpdated = 0;
  let configsUpdated = 0;

  if (target === 'pricing_rules' || target === 'both') {
    const rules = await prisma.pricingRule.findMany();
    for (const rule of rules) {
      const newPrice = applyBulkPriceUpdate(Number(rule.basePrice), percentage, operation);
      await prisma.pricingRule.update({
        where: { id: rule.id },
        data: { basePrice: newPrice },
      });
      rulesUpdated++;
    }
  }

  if (target === 'pricing_configs' || target === 'both') {
    const configs = await prisma.pricingConfig.findMany();
    for (const config of configs) {
      const newPrice = applyBulkPriceUpdate(Number(config.pricePerPage), percentage, operation);
      await prisma.pricingConfig.update({
        where: { id: config.id },
        data: { pricePerPage: newPrice },
      });
      configsUpdated++;
    }
  }

  return {
    success: true,
    message: 'تم تحديث الأسعار بنجاح',
    rulesUpdated,
    configsUpdated,
  };
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export async function getServicePricingCoverage(): Promise<ServicePricingCoverageItem[]> {
  const [services, financialRules] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, isVisible: true },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.financialRule.findMany({
      where: { isActive: true },
      select: {
        id: true,
        serviceId: true,
        name: true,
        dimensions: {
          where: { isActive: true },
          select: {
            id: true,
            ranges: { select: { id: true } },
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  type ServiceRow = (typeof services)[number];
  type FinancialRuleRow = (typeof financialRules)[number];

  return services.map((service: ServiceRow) => {
    const matched = financialRules.filter((rule: FinancialRuleRow) => rule.serviceId === service.id);
    const matchedWithRanges = matched.filter((rule) => rule.dimensions.some((dimension) => dimension.ranges.length > 0));
    return {
      service_id: service.id,
      service_name_ar: service.nameAr,
      service_name_en: service.nameEn,
      has_pricing: matchedWithRanges.length > 0,
      matched_rules_count: matched.length,
      matched_rules: matched.map((rule: FinancialRuleRow) => ({
        id: rule.id,
        name_ar: rule.name,
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
  return prisma.financialRule.findMany({
    where: {
      ...(serviceId ? { serviceId } : {}),
    },
    include: {
      service: { select: { id: true, nameAr: true, nameEn: true } },
      dimensions: {
        where: { isActive: true },
        include: { ranges: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
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

    const createdRule = await tx.financialRule.create({
      data: {
        serviceId: input.service_id,
        name: input.name,
        nameEn: input.name_en ?? null,
        unitType: input.unit_type,
        priority: input.priority ?? 0,
        isActive: input.is_active ?? true,
      },
    });

    for (const dimension of input.dimensions) {
      const createdDimension = await tx.financialRuleDimension.create({
        data: {
          financialRuleId: createdRule.id,
          printMode: dimension.print_mode,
          sizeCode: dimension.size_code,
          displayOrder: dimension.display_order ?? 0,
          isActive: true,
        },
      });

      for (const range of dimension.ranges) {
        await tx.financialRuleRange.create({
          data: {
            dimensionId: createdDimension.id,
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
  const rule = await prisma.financialRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw { statusCode: 404, message: 'القاعدة المالية غير موجودة' };

  if (input.dimensions) {
    for (const dimension of input.dimensions) {
      validateSequentialRanges(dimension.ranges);
    }
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedRule = await tx.financialRule.update({
      where: { id: ruleId },
      data: {
        serviceId: input.service_id ?? undefined,
        name: input.name ?? undefined,
        nameEn: input.name_en ?? undefined,
        unitType: input.unit_type ?? undefined,
        priority: input.priority ?? undefined,
        isActive: input.is_active ?? undefined,
      },
    });

    if (input.dimensions) {
      await tx.financialRuleRange.deleteMany({
        where: { dimension: { financialRuleId: ruleId } },
      });
      await tx.financialRuleDimension.deleteMany({
        where: { financialRuleId: ruleId },
      });

      for (const dimension of input.dimensions) {
        const createdDimension = await tx.financialRuleDimension.create({
          data: {
            financialRuleId: ruleId,
            printMode: dimension.print_mode,
            sizeCode: dimension.size_code,
            displayOrder: dimension.display_order ?? 0,
            isActive: true,
          },
        });

        for (const range of dimension.ranges) {
          await tx.financialRuleRange.create({
            data: {
              dimensionId: createdDimension.id,
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
  await prisma.financialRule.delete({ where: { id: ruleId } });
  return { success: true };
}

export async function calculateFinancialPrice(input: CalculateFinancialPriceInput) {
  const rule = await prisma.financialRule.findFirst({
    where: {
      serviceId: input.service_id,
      isActive: true,
    },
    include: {
      dimensions: {
        where: {
          printMode: input.print_mode,
          sizeCode: input.size_code,
          isActive: true,
        },
        include: {
          ranges: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
    },
    orderBy: { priority: 'asc' },
  });

  if (!rule) {
    throw { statusCode: 404, message: 'التسعير لهذه الخدمة غير كامل أو غير موجود' };
  }

  const dimension = rule.dimensions[0];
  if (!dimension) {
    throw { statusCode: 404, message: 'التسعير لهذه الخدمة غير كامل أو غير موجود' };
  }

  const unitValue = input.unit_value;
  const matchedRange = dimension.ranges.find((range) => {
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
    dimensionId: dimension.id,
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

  const existing = await prisma.financialRule.findFirst({
    where: { serviceId: printableService.id, name: 'قاعدة طباعة افتراضية' },
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
