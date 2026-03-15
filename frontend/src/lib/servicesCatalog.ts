/**
 * مصدر موحد لأسماء الخدمات وربطها بالطلبات.
 * يُستخدم في الكتالوج، الهيرو، وبطاقة الطلب.
 */

export type ServiceCategory = 'printing' | 'design' | 'cards' | 'branding';

export interface CatalogService {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: ServiceCategory;
  subgroup?: string;
}

export const CATALOG_SERVICES: CatalogService[] = [
  { id: 'svc-lecture', slug: 'lecture-printing', nameAr: 'طباعة محاضرات', nameEn: 'Lecture Printing', descriptionAr: 'طباعة محاضرات بجودة عالية وخيارات تجليد متعددة.', descriptionEn: 'High quality lecture printing with multiple binding options.', category: 'printing', subgroup: 'lectures' },
  { id: 'svc-clothing', slug: 'clothing-printing', nameAr: 'الطباعة على الملابس', nameEn: 'Clothing Printing', descriptionAr: 'طباعة الشعارات والتصاميم على الملابس.', descriptionEn: 'Print logos and designs on clothing.', category: 'printing', subgroup: 'clothing' },
  { id: 'svc-flex', slug: 'flex-printing', nameAr: 'طباعة فليكس', nameEn: 'Flex Printing', descriptionAr: 'طباعة فليكس خارجي وداخلي بأبعاد كبيرة.', descriptionEn: 'Indoor and outdoor flex printing in large sizes.', category: 'printing', subgroup: 'flex' },
  { id: 'svc-vinyl', slug: 'vinyl-printing', nameAr: 'طباعة فينيل', nameEn: 'Vinyl Printing', descriptionAr: 'طباعة فينيل لاصق بمقاسات متعددة.', descriptionEn: 'Vinyl sticker printing in multiple sizes.', category: 'branding', subgroup: 'vinyl' },
  { id: 'svc-brochure', slug: 'brochure-printing', nameAr: 'طباعة بروشورات', nameEn: 'Brochure Printing', descriptionAr: 'طباعة بروشورات احترافية بجودة ألوان ممتازة.', descriptionEn: 'Professional brochure printing with rich colors.', category: 'printing', subgroup: 'brochures' },
  { id: 'svc-business-card', slug: 'business-card-printing', nameAr: 'الكروت الشخصية', nameEn: 'Business Cards', descriptionAr: 'تصميم وطباعة كروت شخصية بأشكال متنوعة.', descriptionEn: 'Design and print business cards in many styles.', category: 'cards', subgroup: 'business-cards' },
  { id: 'svc-poster', slug: 'poster-printing', nameAr: 'طباعة كلك بولستر', nameEn: 'Glossy Poster Printing', descriptionAr: 'طباعة بوسترات لامعة بأحجام متعددة.', descriptionEn: 'Glossy poster printing in multiple sizes.', category: 'printing', subgroup: 'posters' },
  { id: 'svc-rollup', slug: 'rollup-banners', nameAr: 'البانرات الإعلانية (Roll up)', nameEn: 'Advertising Banners (Roll up)', descriptionAr: 'طباعة بانرات رول أب للمعارض والفعاليات.', descriptionEn: 'Roll-up banners for events and exhibitions.', category: 'branding', subgroup: 'rollup' },
  { id: 'svc-engineering', slug: 'engineering-printing', nameAr: 'طباعة مشاريع هندسية', nameEn: 'Engineering Printing', descriptionAr: 'طباعة مخططات ومشاريع هندسية بدقة عالية.', descriptionEn: 'High precision engineering drawings and projects printing.', category: 'printing', subgroup: 'engineering' },
  { id: 'svc-books', slug: 'books-printing', nameAr: 'طباعة كتب', nameEn: 'Books Printing', descriptionAr: 'طباعة كتب مع خيارات ورق وتجليد متنوعة.', descriptionEn: 'Book printing with various paper and binding options.', category: 'printing', subgroup: 'books' },
  { id: 'svc-thesis', slug: 'thesis-printing', nameAr: 'طباعة رسائل (ماجستير/دكتوراه)', nameEn: 'Thesis Printing', descriptionAr: 'طباعة وتجليد الرسائل الجامعية بشكل احترافي.', descriptionEn: 'Professional thesis printing and binding.', category: 'printing', subgroup: 'thesis' },
  { id: 'svc-quran', slug: 'quran-certificate', nameAr: 'طباعة إجازة حفظ القرآن الكريم', nameEn: 'Quran Certificate Printing', descriptionAr: 'طباعة إجازات حفظ القرآن بتشطيبات مميزة.', descriptionEn: 'Quran certificate printing with premium finishing.', category: 'printing', subgroup: 'certificate' },
  { id: 'svc-graphic', slug: 'graphic-design', nameAr: 'التصميم الجرافيكي', nameEn: 'Graphic Design', descriptionAr: 'تصميم شعارات وهوية بصرية ومحتوى إعلاني.', descriptionEn: 'Logo, brand identity, and marketing design services.', category: 'design', subgroup: 'graphic' },
];

/** تعيين الفئة الرئيسية → اسم العرض (عربي / إنجليزي) */
export const CATEGORY_LABELS: Record<ServiceCategory, { ar: string; en: string }> = {
  printing: { ar: 'طباعة', en: 'Printing' },
  design: { ar: 'تصميم', en: 'Design' },
  cards: { ar: 'كروت', en: 'Cards' },
  branding: { ar: 'إعلان', en: 'Branding' },
};

export type Locale = 'ar' | 'en';

export interface ServiceDisplayName {
  mainName: string;
  subName: string;
}

/**
 * يُرجع اسم الخدمة الرئيسي (الفئة) والفرعي (الخدمة) للعرض في بطاقة الطلب.
 * إن لم يُعثر على serviceId يُرجع قيم افتراضية.
 * إن وُجد fallback (من API) واستخدمناها للعرض، يُستخدم subName من الـ fallback و mainName يبقى "—" إن لم يُطابق الكتالوج.
 */
export function getServiceDisplayName(
  serviceId: string | null | undefined,
  locale: Locale,
  fallback?: { nameAr?: string | null; nameEn?: string | null },
): ServiceDisplayName {
  const dash = locale === 'ar' ? '—' : '—';
  const unspecified = locale === 'ar' ? 'غير محدد' : 'Not specified';
  if (!serviceId) {
    if (fallback && (fallback.nameAr ?? fallback.nameEn)) {
      const subName = locale === 'ar' ? (fallback.nameAr ?? fallback.nameEn ?? '') : (fallback.nameEn ?? fallback.nameAr ?? '');
      return { mainName: dash, subName: subName || unspecified };
    }
    return { mainName: dash, subName: unspecified };
  }
  const service = CATALOG_SERVICES.find((s) => s.id === serviceId);
  if (service) {
    const categoryLabel = CATEGORY_LABELS[service.category];
    const mainName = locale === 'ar' ? categoryLabel.ar : categoryLabel.en;
    const subName = locale === 'ar' ? service.nameAr : service.nameEn;
    return { mainName, subName };
  }
  if (fallback && (fallback.nameAr ?? fallback.nameEn)) {
    const subName = locale === 'ar' ? (fallback.nameAr ?? fallback.nameEn ?? '') : (fallback.nameEn ?? fallback.nameAr ?? '');
    return { mainName: dash, subName: subName || unspecified };
  }
  return { mainName: dash, subName: unspecified };
}

/** اسم الخدمة للعرض المختصر (فرعي فقط أو "الفئة > الفرعي") */
export function getServiceShortName(serviceId: string | null | undefined, locale: Locale): string {
  const { mainName, subName } = getServiceDisplayName(serviceId, locale);
  return subName || mainName;
}

/** تسميات الحالات الموحدة للطلبات (للعميل ولوحة التحكم) */
export const ORDER_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export function getOrderStatusLabel(status: string, locale: Locale): string {
  const normalized = status?.toLowerCase() ?? '';
  const labels = ORDER_STATUS_LABELS[normalized];
  return labels ? (locale === 'ar' ? labels.ar : labels.en) : (locale === 'ar' ? 'غير معروف' : 'Unknown');
}

/** تسلسل تقدم حالة الطلب (نشط فقط، بدون ملغي) */
export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'processing', 'completed'] as const;
export type OrderFlowStatus = (typeof ORDER_STATUS_FLOW)[number];

/** تسميات إجراء الانتقال لكل مرحلة (للأيقونة + hover في إدارة الطلبات) */
export const ORDER_STATUS_ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قبول الطلب', en: 'Accept order' },
  confirmed: { ar: 'تحضير الطلب', en: 'Prepare order' },
  processing: { ar: 'إتمام الطلب', en: 'Complete order' },
};
export const ORDER_CANCEL_ACTION_LABELS = { ar: 'إلغاء الطلب', en: 'Cancel order' } as const;

/** الحالة التالية في المسار، أو null إن لم يكن هناك تالٍ */
export function getNextOrderStatus(currentStatus: string): string | null {
  const normalized = currentStatus?.toLowerCase() ?? '';
  const i = ORDER_STATUS_FLOW.indexOf(normalized as OrderFlowStatus);
  if (i < 0 || i >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1] ?? null;
}

/** نص إجراء الانتقال للحالة التالية (للعرض عند hover) */
export function getOrderStatusActionLabel(currentStatus: string, locale: Locale): string {
  const normalized = currentStatus?.toLowerCase() ?? '';
  const labels = ORDER_STATUS_ACTION_LABELS[normalized];
  return labels ? (locale === 'ar' ? labels.ar : labels.en) : (locale === 'ar' ? 'المرحلة التالية' : 'Next status');
}

/** روابط الهيرو: مفتاح، slug للمسار، اختياري تسمية مخصصة */
export interface HeroLink {
  key: string;
  slug: string;
  category: ServiceCategory;
  labelAr?: string;
  labelEn?: string;
}

export const HERO_LINKS: HeroLink[] = [
  { key: 'printing', slug: 'printing', category: 'printing' },
  { key: 'tshirt', slug: 'tshirt', category: 'printing', labelAr: 'طباعة الملابس', labelEn: 'Clothing Printing' },
  { key: 'billboard', slug: 'billboard', category: 'branding', labelAr: 'لوحات إعلانية', labelEn: 'Billboards' },
  { key: 'branding', slug: 'branding', category: 'design', labelAr: 'تصميم هوية', labelEn: 'Branding' },
  { key: 'copyright', slug: 'copyright', category: 'design', labelAr: 'تصميم شعارات', labelEn: 'Logo Design' },
  { key: 'businessCard', slug: 'businesscard', category: 'cards', labelAr: 'كروت شخصية', labelEn: 'Business Cards' },
];

export function getHeroLinkLabel(link: HeroLink, locale: Locale): string {
  if (locale === 'ar' && link.labelAr) return link.labelAr;
  if (locale === 'en' && link.labelEn) return link.labelEn;
  return locale === 'ar' ? CATEGORY_LABELS[link.category].ar : CATEGORY_LABELS[link.category].en;
}
