import { prisma } from '../../config/database.js';
import { cache } from '../../shared/cache/memory-cache.js';
import { Prisma } from '@prisma/client';

const SERVICES_CACHE_KEY = 'services:list';

export async function getServices(): Promise<Record<string, unknown>[]> {
  const cached = cache.get<Record<string, unknown>[]>(SERVICES_CACHE_KEY);
  if (cached) return cached;

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      isVisible: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      options: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  type ServiceRow = typeof services[number];
  type OptionRow = ServiceRow['options'][number];
  const data = services.map((s: ServiceRow) => ({
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
    options: s.options.map((o: OptionRow) => ({
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

  cache.set(SERVICES_CACHE_KEY, data, 'services');
  return data;
}

export async function getAllServices(): Promise<Record<string, unknown>[]> {
  const services = await prisma.service.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      options: true,
    },
  });

  type SvcRow = typeof services[number];
  type OptRow = SvcRow['options'][number];
  return services.map((s: SvcRow) => ({
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
    options: s.options.map((o: OptRow) => ({
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

export function clearServicesCache(): void {
  cache.invalidate('services:');
}

export async function fixVisibility(): Promise<{ updated: number }> {
  const result = await prisma.service.updateMany({
    where: { isVisible: false },
    data: { isVisible: true },
  });
  clearServicesCache();
  return { updated: result.count };
}

const DEFAULT_SERVICES = [
  { nameAr: 'طباعة', nameEn: 'Printing', descriptionAr: 'خدمات الطباعة', descriptionEn: 'Printing services' },
  { nameAr: 'تصميم', nameEn: 'Design', descriptionAr: 'خدمات التصميم', descriptionEn: 'Design services' },
  { nameAr: 'تغليف', nameEn: 'Packaging', descriptionAr: 'خدمات التغليف', descriptionEn: 'Packaging services' },
];

export async function ensureDefaultServices(): Promise<{ created: number }> {
  const existing = await prisma.service.count();
  if (existing > 0) {
    return { created: 0 };
  }

  let created = 0;
  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const svc = DEFAULT_SERVICES[i]!;
    await prisma.service.create({
      data: {
        nameAr: svc.nameAr,
        nameEn: svc.nameEn,
        descriptionAr: svc.descriptionAr,
        descriptionEn: svc.descriptionEn,
        basePrice: 0,
        isActive: true,
        isVisible: true,
        displayOrder: i + 1,
      },
    });
    created++;
  }

  clearServicesCache();
  return { created };
}

interface LegacyWorkflowSeedStep {
  stepNameAr: string;
  stepNameEn: string;
  stepDescriptionAr: string;
  stepDescriptionEn: string;
  stepType: string;
}

interface LegacyServiceSeed {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  groupKey: string;
  groupLabelAr: string;
  groupLabelEn: string;
  subgroupKey?: string;
  subgroupLabelAr?: string;
  subgroupLabelEn?: string;
  steps: LegacyWorkflowSeedStep[];
}

function asInputJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const BASIC_PRINTING_STEPS: LegacyWorkflowSeedStep[] = [
  {
    stepNameAr: 'استلام الملفات',
    stepNameEn: 'Receive Files',
    stepDescriptionAr: 'استلام ملفات الطلب من العميل وتجهيزها للإنتاج.',
    stepDescriptionEn: 'Receive customer files and prepare for production.',
    stepType: 'upload',
  },
  {
    stepNameAr: 'مراجعة وتجهيز',
    stepNameEn: 'Review & Prepare',
    stepDescriptionAr: 'مراجعة الملف وضبط الخيارات قبل الطباعة.',
    stepDescriptionEn: 'Review file and configure settings before printing.',
    stepType: 'review',
  },
  {
    stepNameAr: 'الإنتاج والتسليم',
    stepNameEn: 'Production & Delivery',
    stepDescriptionAr: 'تنفيذ الطلب وتسليمه للعميل.',
    stepDescriptionEn: 'Process order and deliver to customer.',
    stepType: 'delivery',
  },
];

const LEGACY_SERVICE_SEEDS: LegacyServiceSeed[] = [
  {
    nameAr: 'طباعة محاضرات',
    nameEn: 'Lecture Printing',
    descriptionAr: 'طباعة محاضرات الطلاب مع التجليد.',
    descriptionEn: 'Lecture printing with binding.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'lectures',
    subgroupLabelAr: 'محاضرات',
    subgroupLabelEn: 'Lectures',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة كتب',
    nameEn: 'Books Printing',
    descriptionAr: 'طباعة الكتب مع خيارات ورق متعددة.',
    descriptionEn: 'Book printing with multiple paper options.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'books',
    subgroupLabelAr: 'كتب',
    subgroupLabelEn: 'Books',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة رسائل (ماجستير/دكتوراه)',
    nameEn: 'Thesis Printing',
    descriptionAr: 'طباعة الرسائل الأكاديمية والتجليد الفني.',
    descriptionEn: 'Academic thesis printing and finishing.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'thesis',
    subgroupLabelAr: 'رسائل',
    subgroupLabelEn: 'Thesis',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة مشاريع هندسية',
    nameEn: 'Engineering Printing',
    descriptionAr: 'طباعة المخططات والمشاريع الهندسية.',
    descriptionEn: 'Engineering and blueprint printing.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'engineering',
    subgroupLabelAr: 'مشاريع هندسية',
    subgroupLabelEn: 'Engineering',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة إجازة حفظ القرآن الكريم',
    nameEn: 'Quran Certificate Printing',
    descriptionAr: 'طباعة وتجهيز إجازة حفظ القرآن.',
    descriptionEn: 'Quran certificate printing service.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'certificate',
    subgroupLabelAr: 'إجازات',
    subgroupLabelEn: 'Certificates',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'الطباعة على الملابس',
    nameEn: 'Clothing Printing',
    descriptionAr: 'طباعة على الملابس والتيشيرتات.',
    descriptionEn: 'Clothing and t-shirt printing.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'clothing',
    subgroupLabelAr: 'ملابس',
    subgroupLabelEn: 'Clothing',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة فليكس',
    nameEn: 'Flex Printing',
    descriptionAr: 'طباعة فليكس خارجي وداخلي بأحجام كبيرة.',
    descriptionEn: 'Indoor and outdoor flex printing in large sizes.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'flex',
    subgroupLabelAr: 'فليكس',
    subgroupLabelEn: 'Flex',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة فينيل',
    nameEn: 'Vinyl Printing',
    descriptionAr: 'طباعة فينيل لاصق بجميع الأنواع.',
    descriptionEn: 'Vinyl printing in various types.',
    groupKey: 'branding',
    groupLabelAr: 'خدمات الهوية والإعلان',
    groupLabelEn: 'Branding Services',
    subgroupKey: 'vinyl',
    subgroupLabelAr: 'فينيل',
    subgroupLabelEn: 'Vinyl',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة بروشورات',
    nameEn: 'Brochure Printing',
    descriptionAr: 'طباعة بروشورات ورقية باحترافية.',
    descriptionEn: 'Professional brochure printing.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'brochures',
    subgroupLabelAr: 'بروشورات',
    subgroupLabelEn: 'Brochures',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'الكروت الشخصية',
    nameEn: 'Business Cards',
    descriptionAr: 'طباعة كروت شخصية بتشطيبات متعددة.',
    descriptionEn: 'Business cards printing with multiple finishing options.',
    groupKey: 'cards',
    groupLabelAr: 'خدمات البطاقات',
    groupLabelEn: 'Cards Services',
    subgroupKey: 'business-cards',
    subgroupLabelAr: 'كروت شخصية',
    subgroupLabelEn: 'Business Cards',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'طباعة كلك بولستر',
    nameEn: 'Glossy Poster Printing',
    descriptionAr: 'طباعة كلك بولستر عالية الجودة.',
    descriptionEn: 'High quality glossy poster printing.',
    groupKey: 'printing',
    groupLabelAr: 'خدمات الطباعة',
    groupLabelEn: 'Printing Services',
    subgroupKey: 'posters',
    subgroupLabelAr: 'بوسترات',
    subgroupLabelEn: 'Posters',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'البانرات الإعلانية (Roll up)',
    nameEn: 'Advertising Banners (Roll up)',
    descriptionAr: 'طباعة بانرات إعلانية بجميع المقاسات.',
    descriptionEn: 'Advertising roll-up banners in all sizes.',
    groupKey: 'branding',
    groupLabelAr: 'خدمات الهوية والإعلان',
    groupLabelEn: 'Branding Services',
    subgroupKey: 'rollup',
    subgroupLabelAr: 'رول أب',
    subgroupLabelEn: 'Roll Up',
    steps: BASIC_PRINTING_STEPS,
  },
  {
    nameAr: 'التصميم الجرافيكي',
    nameEn: 'Graphic Design',
    descriptionAr: 'خدمات تصميم الهوية والمحتوى البصري.',
    descriptionEn: 'Identity and visual content design.',
    groupKey: 'design',
    groupLabelAr: 'خدمات التصميم',
    groupLabelEn: 'Design Services',
    steps: [
      {
        stepNameAr: 'استلام المتطلبات',
        stepNameEn: 'Receive Requirements',
        stepDescriptionAr: 'جمع متطلبات العميل.',
        stepDescriptionEn: 'Collect customer requirements.',
        stepType: 'brief',
      },
      {
        stepNameAr: 'التنفيذ والمراجعة',
        stepNameEn: 'Design & Review',
        stepDescriptionAr: 'تنفيذ التصميم وإرسال نسخة للمراجعة.',
        stepDescriptionEn: 'Create design and send for review.',
        stepType: 'design',
      },
      {
        stepNameAr: 'التسليم',
        stepNameEn: 'Delivery',
        stepDescriptionAr: 'تسليم الملفات النهائية.',
        stepDescriptionEn: 'Deliver final files.',
        stepType: 'delivery',
      },
    ],
  },
];

export async function importLegacyServicesSeed(): Promise<{ created: number; updated: number; workflows: number }> {
  let created = 0;
  let updated = 0;
  let workflows = 0;

  for (let i = 0; i < LEGACY_SERVICE_SEEDS.length; i += 1) {
    const seed = LEGACY_SERVICE_SEEDS[i]!;
    const features: Record<string, unknown> = {
      group_key: seed.groupKey,
      group_label_ar: seed.groupLabelAr,
      group_label_en: seed.groupLabelEn,
      ...(seed.subgroupKey ? { subgroup_key: seed.subgroupKey } : {}),
      ...(seed.subgroupLabelAr ? { subgroup_label_ar: seed.subgroupLabelAr } : {}),
      ...(seed.subgroupLabelEn ? { subgroup_label_en: seed.subgroupLabelEn } : {}),
      source: 'legacy-seed',
    };

    const existing = await prisma.service.findFirst({ where: { nameAr: seed.nameAr } });
    const service =
      existing ??
      (await prisma.service.create({
        data: {
          nameAr: seed.nameAr,
          nameEn: seed.nameEn,
          descriptionAr: seed.descriptionAr,
          descriptionEn: seed.descriptionEn,
          basePrice: 0,
          isActive: true,
          isVisible: true,
          displayOrder: i + 1,
          features: asInputJson(features),
        },
      }));

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          nameEn: seed.nameEn,
          descriptionAr: seed.descriptionAr,
          descriptionEn: seed.descriptionEn,
          isActive: true,
          isVisible: true,
          displayOrder: i + 1,
          features: asInputJson(features),
        },
      });
      updated += 1;
    } else {
      created += 1;
    }

    await prisma.serviceWorkflow.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceWorkflow.createMany({
      data: seed.steps.map((step, idx) => ({
        serviceId: service.id,
        stepNumber: idx + 1,
        stepNameAr: step.stepNameAr,
        stepNameEn: step.stepNameEn,
        stepDescriptionAr: step.stepDescriptionAr,
        stepDescriptionEn: step.stepDescriptionEn,
        stepType: step.stepType,
        displayOrder: idx + 1,
        isActive: true,
      })),
    });
    workflows += seed.steps.length;
  }

  clearServicesCache();
  return { created, updated, workflows };
}
