import { z } from 'zod';

const calculationTypeSchema = z.enum(['piece', 'area', 'page']);
const printModeSchema = z.enum(['bw', 'color_normal', 'color_laser']);
const sizeCodeSchema = z.enum(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'BOOKLET_A5', 'BOOKLET_B5', 'BOOKLET_A4']);

/** @deprecated لا يطابق نموذج Prisma الحالي؛ الكتابة الفعلية تتم عبر createFinancialRuleSchema */
export const createPricingRuleSchema = z.object({
  nameAr: z.string().min(1, 'الاسم بالعربية مطلوب'),
  nameEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  calculationType: calculationTypeSchema,
  basePrice: z.number().positive(),
  priceMultipliers: z.record(z.unknown()).optional(),
  specifications: z.record(z.unknown()).optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

/** @deprecated لا يطابق نموذج Prisma؛ التحديث يتم عبر updateFinancialRuleSchema */
export const updatePricingRuleSchema = createPricingRuleSchema.partial();

export const calculatePriceSchema = z.object({
  quantity: z.number().int().positive(),
  service_id: z.string().optional(),
  print_mode: printModeSchema.optional(),
  size_code: sizeCodeSchema.optional(),
  unit_value: z.number().nonnegative().optional(),
  specifications: z
    .object({
      color: z.string().optional(),
      sides: z.string().optional(),
      paper_size: z.string().optional(),
      unit: z.string().optional(),
      service_id: z.string().optional(),
      print_mode: printModeSchema.optional(),
      size_code: sizeCodeSchema.optional(),
      unit_value: z.number().nonnegative().optional(),
    })
    .optional(),
});

/** @deprecated مسارات Advanced Pricing مُوقَفة (410)； استخدم financial-rules */
export const getAdvancedPricingRulesQuerySchema = z.object({
  categoryId: z.string().optional(),
  paperSize: z.string().optional(),
  paperType: z.string().optional(),
  printType: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

/** @deprecated مسارات Advanced Pricing مُوقَفة (410) */
export const createAdvancedPricingRuleSchema = z.object({
  categoryId: z.string().min(1),
  paperSize: z.string().min(1),
  paperType: z.string().optional(),
  printType: z.string().min(1),
  qualityType: z.string().optional(),
  pricePerPage: z.number().positive(),
  unit: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

/** @deprecated استخدم calculateFinancialPriceSchema و POST /pricing/calculate-financial-price */
export const calculateAdvancedPriceSchema = z.object({
  categoryId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  widthCm: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  paperSize: z.string().optional(),
});

export const bulkUpdatePricesSchema = z.object({
  percentage: z.number().min(1).max(100),
  operation: z.enum(['increase', 'decrease']),
  target: z.enum(['pricing_rules', 'pricing_configs', 'both']),
});

export const financialRangeSchema = z.object({
  min_value: z.number().min(0),
  max_value: z.number().positive().nullable().optional(),
  unit_price: z.number().nonnegative(),
  display_order: z.number().int().optional().default(0),
});

export const financialDimensionSchema = z.object({
  print_mode: printModeSchema,
  size_code: sizeCodeSchema,
  display_order: z.number().int().optional().default(0),
  ranges: z.array(financialRangeSchema).min(1),
});

export const createFinancialRuleSchema = z.object({
  service_id: z.string().min(1),
  name: z.string().min(1),
  name_en: z.string().optional(),
  unit_type: z.string().min(1),
  priority: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
  dimensions: z.array(financialDimensionSchema).min(1),
});

export const updateFinancialRuleSchema = createFinancialRuleSchema.partial();

export const calculateFinancialPriceSchema = z.object({
  service_id: z.string().min(1),
  print_mode: printModeSchema,
  size_code: sizeCodeSchema,
  unit_value: z.number().nonnegative(),
  quantity: z.number().int().positive().default(1),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
export type CreateFinancialRuleInput = z.infer<typeof createFinancialRuleSchema>;
export type UpdateFinancialRuleInput = z.infer<typeof updateFinancialRuleSchema>;
