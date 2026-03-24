import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

type ServiceWorkflow = Awaited<ReturnType<typeof prisma.serviceWorkflow.findFirst>>;

export interface CreateWorkflowInput {
  serviceId: string;
  stepNumber: number;
  stepNameAr: string;
  stepNameEn?: string;
  stepDescriptionAr?: string;
  stepDescriptionEn?: string;
  stepType: string;
  stepConfig?: Record<string, unknown>;
  displayOrder?: number;
}

export interface UpdateWorkflowInput {
  stepNumber?: number;
  stepNameAr?: string;
  stepNameEn?: string;
  stepDescriptionAr?: string;
  stepDescriptionEn?: string;
  stepType?: string;
  stepConfig?: Record<string, unknown>;
  displayOrder?: number;
  isActive?: boolean;
}

function asInputJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export async function getServiceWorkflow(serviceId: string): Promise<ServiceWorkflow[]> {
  return prisma.serviceWorkflow.findMany({
    where: { serviceId, isActive: true },
    orderBy: [{ stepNumber: 'asc' }, { displayOrder: 'asc' }],
  });
}

function buildServiceSlugMap(services: Array<{ id: string; nameAr: string | null; nameEn: string | null }>): Record<string, string> {
  const slugMap: Record<string, string> = {};
  for (const svc of services) {
    const base = (svc.nameEn ?? svc.nameAr ?? '').toLowerCase().replace(/[\s()\/]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (base) slugMap[base] = svc.id;
    const nameAr = svc.nameAr ?? '';
    if (nameAr.includes('محاضرات')) slugMap['lecture-printing'] = svc.id;
    if (nameAr.includes('فليكس')) slugMap['flex-printing'] = svc.id;
    if (nameAr.includes('كروت') || nameAr.includes('بطاقات') || nameAr.includes('كرت')) slugMap['business-card-printing'] = svc.id;
    if (nameAr.includes('رسائل') || nameAr.includes('ماجستير') || nameAr.includes('دكتوراه')) slugMap['thesis-printing'] = svc.id;
    if (nameAr.includes('هندسية') || nameAr.includes('مشاريع هندسية')) slugMap['engineering-printing'] = svc.id;
    if (nameAr.includes('كتب')) slugMap['books-printing'] = svc.id;
    if (nameAr.includes('إجازة') || nameAr.includes('قرآن')) slugMap['quran-certificate'] = svc.id;
    if (nameAr.includes('ملابس') || nameAr.includes('تيشيرت')) slugMap['clothing-printing'] = svc.id;
    if (nameAr.includes('بوستر') || nameAr.includes('كلك')) slugMap['poster-printing'] = svc.id;
    if (nameAr.includes('بانر') || nameAr.includes('Roll')) slugMap['rollup-banners'] = svc.id;
    if (nameAr.includes('بروشور')) slugMap['brochure-printing'] = svc.id;
    if (nameAr.includes('فينيل')) slugMap['vinyl-printing'] = svc.id;
    if (nameAr.includes('DTF')) slugMap['dtf-printing'] = svc.id;
    if (nameAr.includes('UV') && nameAr.includes('طباعة')) slugMap['uv-printing'] = svc.id;
  }
  return slugMap;
}

export interface WorkflowBySlugResult {
  serviceId: string;
  steps: ServiceWorkflow[];
}

export async function getWorkflowByServiceSlug(slug: string): Promise<WorkflowBySlugResult | null> {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, nameAr: true, nameEn: true },
  });
  const slugMap = buildServiceSlugMap(services);
  const serviceId = slugMap[slug];
  if (!serviceId) return null;
  const steps = await getServiceWorkflow(serviceId);
  return { serviceId, steps };
}

export async function getWorkflowById(workflowId: string): Promise<ServiceWorkflow | null> {
  return prisma.serviceWorkflow.findUnique({
    where: { id: workflowId },
  });
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.create({
    data: {
      serviceId: input.serviceId,
      stepNumber: input.stepNumber,
      stepNameAr: input.stepNameAr,
      stepNameEn: input.stepNameEn,
      stepDescriptionAr: input.stepDescriptionAr,
      stepDescriptionEn: input.stepDescriptionEn,
      stepType: input.stepType,
      stepConfig: asInputJson(input.stepConfig),
      displayOrder: input.displayOrder ?? 0,
    },
  });
}

export async function updateWorkflow(
  workflowId: string,
  input: UpdateWorkflowInput,
): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.update({
    where: { id: workflowId },
    data: {
      ...(input.stepNumber !== undefined && { stepNumber: input.stepNumber }),
      ...(input.stepNameAr !== undefined && { stepNameAr: input.stepNameAr }),
      ...(input.stepNameEn !== undefined && { stepNameEn: input.stepNameEn }),
      ...(input.stepDescriptionAr !== undefined && { stepDescriptionAr: input.stepDescriptionAr }),
      ...(input.stepDescriptionEn !== undefined && { stepDescriptionEn: input.stepDescriptionEn }),
      ...(input.stepType !== undefined && { stepType: input.stepType }),
      ...(input.stepConfig !== undefined && { stepConfig: asInputJson(input.stepConfig) }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteWorkflow(workflowId: string): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.delete({
    where: { id: workflowId },
  });
}

/* ──────────────────────────────────────────
   Workflow Step Definitions per Service
   ────────────────────────────────────────── */

const LECTURE_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات',
    stepNameEn: 'Upload Files',
    stepDescriptionAr: 'ارفع ملفات المحاضرات (PDF أو Word)',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.doc,.docx',
      multiple: true,
      required: true,
      analyze_pages: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepDescriptionAr: 'اختر حجم الورق ونوع الطباعة',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['A3', 'A4', 'A5', 'B5'],
      show_booklet: true,
      show_color: true,
      show_quality: true,
      show_sides: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepDescriptionAr: 'أضف ملاحظات إضافية (اختياري)',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepDescriptionAr: 'أدخل بياناتك واختر طريقة الاستلام',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const GENERIC_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات',
    stepNameEn: 'Upload Files',
    stepDescriptionAr: 'ارفع ملف التصميم',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg',
      multiple: true,
      required: true,
      analyze_pages: false,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepDescriptionAr: 'اختر حجم الورق ونوع الطباعة',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['A3', 'A4', 'A5'],
      show_booklet: false,
      show_color: true,
      show_quality: true,
      show_sides: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const FLEX_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepDescriptionAr: 'ارفع ملف التصميم بجودة عالية',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد',
    stepNameEn: 'Dimensions',
    stepDescriptionAr: 'حدد أبعاد الطباعة بالسنتيمتر',
    stepType: 'dimensions',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const BUSINESS_CARDS_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepDescriptionAr: 'ارفع تصميم الكرت (وجه/ظهر)',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['9x5'],
      show_booklet: false,
      show_color: true,
      show_quality: true,
      show_sides: true,
      force_color: false,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const THESIS_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات',
    stepNameEn: 'Upload Files',
    stepDescriptionAr: 'ارفع ملف الرسالة (PDF أو Word)',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.doc,.docx',
      multiple: true,
      required: true,
      analyze_pages: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['A4'],
      show_booklet: false,
      show_color: true,
      show_quality: true,
      show_sides: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'خيارات التجليد',
    stepNameEn: 'Thesis Binding',
    stepDescriptionAr: 'اختر لون الغلاف ولون الخط ونوع الطباعة على الغلاف',
    stepType: 'thesis_binding',
    stepConfig: {
      binding_colors: [
        { value: 'navy', labelAr: 'كحلي', labelEn: 'Navy' },
        { value: 'black', labelAr: 'أسود', labelEn: 'Black' },
        { value: 'maroon', labelAr: 'خمري', labelEn: 'Maroon' },
        { value: 'green', labelAr: 'أخضر', labelEn: 'Green' },
      ],
      text_colors: [
        { value: 'gold', labelAr: 'ذهبي', labelEn: 'Gold' },
        { value: 'silver', labelAr: 'فضي', labelEn: 'Silver' },
        { value: 'white', labelAr: 'أبيض', labelEn: 'White' },
      ],
      cover_print_types: [
        { value: 'silk', labelAr: 'حريري', labelEn: 'Silk' },
        { value: 'emboss', labelAr: 'بارز (إمبوس)', labelEn: 'Emboss' },
      ],
    },
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 4,
  },
];

const ENGINEERING_PROJECTS_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات',
    stepNameEn: 'Upload Files',
    stepDescriptionAr: 'ارفع ملفات المشروع الهندسي',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.dwg,.dxf,.ai,.psd,.png,.jpg,.jpeg',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد ونوع الورق',
    stepNameEn: 'Dimensions & Paper Type',
    stepDescriptionAr: 'حدد الأبعاد ونوع الورق والمقياس',
    stepType: 'paper_type',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
      paper_types: [
        { value: 'normal', labelAr: 'ورق عادي', labelEn: 'Normal Paper' },
        { value: 'canson', labelAr: 'ورق كانسون', labelEn: 'Canson Paper' },
      ],
      show_color: true,
      show_scale: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const BOOKS_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات',
    stepNameEn: 'Upload Files',
    stepDescriptionAr: 'ارفع ملف الكتاب (PDF أو Word)',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.doc,.docx',
      multiple: true,
      required: true,
      analyze_pages: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['A4', 'A5', 'B5'],
      show_booklet: false,
      show_color: true,
      show_quality: true,
      show_sides: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'خيارات التجليد',
    stepNameEn: 'Binding Options',
    stepDescriptionAr: 'اختر نوع التجليد ونوع الغلاف',
    stepType: 'binding_options',
    stepConfig: {
      binding_types: [
        { value: 'lamination', labelAr: 'تغليف حراري', labelEn: 'Lamination' },
        { value: 'cover', labelAr: 'غلاف كرتوني', labelEn: 'Cardboard Cover' },
      ],
      cover_types: [
        { value: 'normal_cardboard', labelAr: 'كرتون عادي', labelEn: 'Normal Cardboard' },
        { value: 'thick_cardboard', labelAr: 'كرتون سميك', labelEn: 'Thick Cardboard' },
      ],
      show_cover_type_when: 'cover',
    },
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 4,
  },
];

const QURAN_CERTIFICATE_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepDescriptionAr: 'ارفع تصميم الإجازة (صورة أو PDF)',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg',
      multiple: false,
      required: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد',
    stepNameEn: 'Dimensions',
    stepDescriptionAr: 'حدد أبعاد الإجازة (الافتراضي 50×70 سم)',
    stepType: 'dimensions',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
      default_width: 50,
      default_height: 70,
      show_use_default: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'نوع البطاقة',
    stepNameEn: 'Card Type',
    stepDescriptionAr: 'اختر نوع الورق وطريقة الطباعة',
    stepType: 'card_type',
    stepConfig: {
      card_types: [
        { value: 'canson', labelAr: 'كرتون كانسون', labelEn: 'Canson Cardboard' },
        { value: 'normal', labelAr: 'كرتون عادي', labelEn: 'Normal Cardboard' },
        { value: 'glossy', labelAr: 'كرتون لامع', labelEn: 'Glossy Cardboard' },
      ],
      show_print_color: true,
    },
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 4,
  },
];

const CLOTHING_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'مصدر الملابس',
    stepNameEn: 'Clothing Source',
    stepDescriptionAr: 'حدد مصدر الملابس (من عندك أو من المتجر)',
    stepType: 'clothing_source',
    stepConfig: {
      sources: [
        { value: 'customer', labelAr: 'من العميل', labelEn: 'From Customer' },
        { value: 'store', labelAr: 'من المتجر', labelEn: 'From Store' },
      ],
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'التصاميم ومواقع الطباعة',
    stepNameEn: 'Designs & Print Locations',
    stepDescriptionAr: 'ارفع التصميم لكل موقع طباعة على الملابس',
    stepType: 'clothing_designs',
    stepConfig: {
      show_quantity: true,
      positions: [
        { value: 'logo', labelAr: 'شعار صغير', labelEn: 'Small Logo' },
        { value: 'front', labelAr: 'أمامي', labelEn: 'Front' },
        { value: 'back', labelAr: 'خلفي', labelEn: 'Back' },
        { value: 'shoulder_right', labelAr: 'كتف يمين', labelEn: 'Right Shoulder' },
        { value: 'shoulder_left', labelAr: 'كتف يسار', labelEn: 'Left Shoulder' },
      ],
      accept: '.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      max_size_mb: 50,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const POSTER_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد',
    stepNameEn: 'Dimensions',
    stepDescriptionAr: 'حدد أبعاد البوستر',
    stepType: 'dimensions',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const BANNER_ROLLUP_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد',
    stepNameEn: 'Dimensions',
    stepType: 'dimensions',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
      default_width: 80,
      default_height: 200,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const BROCHURE_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 50,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'خيارات الطباعة',
    stepNameEn: 'Print Options',
    stepType: 'print_options',
    stepConfig: {
      paper_sizes: ['A3', 'A4', 'A5'],
      show_booklet: false,
      show_color: true,
      show_quality: true,
      show_sides: true,
      force_color: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const VINYL_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع التصميم',
    stepNameEn: 'Upload Design',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'الأبعاد',
    stepNameEn: 'Dimensions',
    stepType: 'dimensions',
    stepConfig: {
      unit: 'سم',
      show_width: true,
      show_height: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 3,
  },
];

const DTF_DIGITAL_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات والكمية',
    stepNameEn: 'Upload files & quantity',
    stepDescriptionAr: 'ارفع ملفات التصميم وحدد الكمية',
    stepDescriptionEn: 'Upload design files and set quantity',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'القياس (العرض والارتفاع)',
    stepNameEn: 'Dimensions (width & height)',
    stepDescriptionAr: 'أدخل العرض والارتفاع بالسنتيمتر، أو استخدم أزرار التناسب',
    stepDescriptionEn: 'Enter width and height in cm, or use fit buttons',
    stepType: 'digital_dimensions',
    stepConfig: {
      unit: 'سم',
      show_aspect_buttons: true,
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'اللون',
    stepNameEn: 'Color',
    stepDescriptionAr: 'اختر لون الطباعة أو ألوان الملف أو لوناً مخصصاً',
    stepDescriptionEn: 'Choose print color, file colors, or a custom color',
    stepType: 'digital_print_color',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 4,
  },
];

const UV_DIGITAL_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'رفع الملفات والكمية',
    stepNameEn: 'Upload files & quantity',
    stepDescriptionAr: 'ارفع ملفات التصميم وحدد الكمية',
    stepDescriptionEn: 'Upload design files and set quantity',
    stepType: 'files',
    stepConfig: {
      accept: '.pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg,.webp',
      multiple: true,
      required: true,
      show_quantity: true,
      max_size_mb: 100,
    },
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'القياس (الحد الأقصى 90×60 سم)',
    stepNameEn: 'Dimensions (max 90×60 cm)',
    stepDescriptionAr: 'أقصى عرض 90 سم وأقصى ارتفاع 60 سم',
    stepDescriptionEn: 'Maximum width 90 cm and height 60 cm',
    stepType: 'digital_dimensions',
    stepConfig: {
      unit: 'سم',
      show_aspect_buttons: true,
      max_width_cm: 90,
      max_height_cm: 60,
      fallback_service_slug: 'dtf-printing',
    },
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'اللون',
    stepNameEn: 'Color',
    stepType: 'digital_print_color',
    stepConfig: {},
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'نوع المادة',
    stepNameEn: 'Substrate',
    stepDescriptionAr: 'أقصى سماكة للطباعة 14 مم',
    stepDescriptionEn: 'Maximum printable thickness 14 mm',
    stepType: 'uv_material',
    stepConfig: {
      max_thickness_mm: 14,
    },
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'ملاحظات',
    stepNameEn: 'Notes',
    stepType: 'notes',
    stepConfig: {},
    displayOrder: 4,
  },
  {
    stepNumber: 6,
    stepNameAr: 'بيانات العميل والتوصيل',
    stepNameEn: 'Customer Info & Delivery',
    stepType: 'customer_info',
    stepConfig: {
      fields: ['name', 'whatsapp', 'phone_extra', 'shop_name'],
      delivery: true,
    },
    displayOrder: 5,
  },
];

/* Mapping: slug -> steps definition */
const WORKFLOW_MAP: Record<string, Omit<CreateWorkflowInput, 'serviceId'>[]> = {
  'lecture-printing': LECTURE_PRINTING_STEPS,
  'flex-printing': FLEX_PRINTING_STEPS,
  'business-card-printing': BUSINESS_CARDS_STEPS,
  'thesis-printing': THESIS_PRINTING_STEPS,
  'engineering-printing': ENGINEERING_PROJECTS_STEPS,
  'books-printing': BOOKS_PRINTING_STEPS,
  'quran-certificate': QURAN_CERTIFICATE_STEPS,
  'clothing-printing': CLOTHING_PRINTING_STEPS,
  'poster-printing': POSTER_PRINTING_STEPS,
  'rollup-banners': BANNER_ROLLUP_STEPS,
  'brochure-printing': BROCHURE_STEPS,
  'vinyl-printing': VINYL_STEPS,
  'dtf-printing': DTF_DIGITAL_STEPS,
  'uv-printing': UV_DIGITAL_STEPS,
};

async function seedServiceWorkflow(
  serviceId: string,
  steps: Omit<CreateWorkflowInput, 'serviceId'>[],
): Promise<ServiceWorkflow[]> {
  await prisma.serviceWorkflow.deleteMany({ where: { serviceId } });
  const created: ServiceWorkflow[] = [];
  for (const step of steps) {
    const w = await createWorkflow({ ...step, serviceId });
    created.push(w);
  }
  return created;
}

export async function setupLecturePrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, LECTURE_PRINTING_STEPS);
}

export async function setupFlexPrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, FLEX_PRINTING_STEPS);
}

export async function setupBusinessCards(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, BUSINESS_CARDS_STEPS);
}

export async function setupThesisPrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, THESIS_PRINTING_STEPS);
}

export async function setupEngineeringProjects(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, ENGINEERING_PROJECTS_STEPS);
}

export async function setupBooksPrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, BOOKS_PRINTING_STEPS);
}

export async function setupQuranCertificate(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, QURAN_CERTIFICATE_STEPS);
}

export async function setupClothingPrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  return seedServiceWorkflow(serviceId, CLOTHING_PRINTING_STEPS);
}

export async function seedAllWorkflows(): Promise<{ seeded: number; errors: string[] }> {
  const services = await prisma.service.findMany({ where: { isActive: true } });
  let seeded = 0;
  const errors: string[] = [];

  const slugMap: Record<string, string> = {};
  for (const svc of services) {
    const slug = (svc.nameEn ?? svc.nameAr ?? '').toLowerCase().replace(/[\s()\/]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    slugMap[slug] = svc.id;
    const nameAr = svc.nameAr ?? '';
    if (nameAr.includes('محاضرات')) slugMap['lecture-printing'] = svc.id;
    if (nameAr.includes('فليكس')) slugMap['flex-printing'] = svc.id;
    if (nameAr.includes('كروت') || nameAr.includes('بطاقات') || nameAr.includes('كرت')) slugMap['business-card-printing'] = svc.id;
    if (nameAr.includes('رسائل') || nameAr.includes('ماجستير') || nameAr.includes('دكتوراه')) slugMap['thesis-printing'] = svc.id;
    if (nameAr.includes('هندسية') || nameAr.includes('مشاريع هندسية')) slugMap['engineering-printing'] = svc.id;
    if (nameAr.includes('كتب')) slugMap['books-printing'] = svc.id;
    if (nameAr.includes('إجازة') || nameAr.includes('قرآن')) slugMap['quran-certificate'] = svc.id;
    if (nameAr.includes('ملابس') || nameAr.includes('تيشيرت')) slugMap['clothing-printing'] = svc.id;
    if (nameAr.includes('بوستر') || nameAr.includes('كلك')) slugMap['poster-printing'] = svc.id;
    if (nameAr.includes('بانر') || nameAr.includes('Roll')) slugMap['rollup-banners'] = svc.id;
    if (nameAr.includes('بروشور')) slugMap['brochure-printing'] = svc.id;
    if (nameAr.includes('فينيل')) slugMap['vinyl-printing'] = svc.id;
    if (nameAr.includes('DTF')) slugMap['dtf-printing'] = svc.id;
    if (nameAr.includes('UV') && nameAr.includes('طباعة')) slugMap['uv-printing'] = svc.id;
  }

  for (const [slug, steps] of Object.entries(WORKFLOW_MAP)) {
    const svcId = slugMap[slug];
    if (!svcId) continue;
    try {
      await seedServiceWorkflow(svcId, steps);
      seeded++;
    } catch (err: unknown) {
      const e = err as { message?: string };
      errors.push(`${slug}: ${e.message ?? 'unknown error'}`);
    }
  }
  return { seeded, errors };
}
