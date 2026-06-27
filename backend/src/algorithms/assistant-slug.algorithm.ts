interface ServiceSlugInput {
  id: string;
  nameAr: string;
  nameEn: string | null;
  features: unknown;
}

function subgroupFromFeatures(features: unknown): string | null {
  if (!features || typeof features !== 'object') return null;
  const key = (features as { subgroup_key?: unknown }).subgroup_key;
  return typeof key === 'string' && key.length > 0 ? key : null;
}

/** يربط خدمة قاعدة البيانات بمسار الطلب في المتجر (/order/:slug). */
export function resolveServiceOrderSlug(service: ServiceSlugInput): string {
  const subgroup = subgroupFromFeatures(service.features);
  const subgroupSlugMap: Record<string, string> = {
    lectures: 'lecture-printing',
    clothing: 'clothing-printing',
    flex: 'flex-printing',
    vinyl: 'vinyl-printing',
    brochures: 'brochure-printing',
    'business-cards': 'business-card-printing',
    posters: 'poster-printing',
    rollup: 'rollup-banners',
    engineering: 'engineering-printing',
    books: 'books-printing',
    thesis: 'thesis-printing',
    certificate: 'quran-certificate',
    'digital-dtf': 'dtf-printing',
    'digital-uv': 'uv-printing',
  };

  if (subgroup && subgroupSlugMap[subgroup]) {
    return subgroupSlugMap[subgroup];
  }

  const nameAr = service.nameAr;
  if (nameAr.includes('محاضرات')) return 'lecture-printing';
  if (nameAr.includes('فليكس')) return 'flex-printing';
  if (nameAr.includes('كروت') || nameAr.includes('بطاقات')) return 'business-card-printing';
  if (nameAr.includes('رسائل') || nameAr.includes('ماجستير')) return 'thesis-printing';
  if (nameAr.includes('هندسية')) return 'engineering-printing';
  if (nameAr.includes('كتب')) return 'books-printing';
  if (nameAr.includes('إجازة') || nameAr.includes('قرآن')) return 'quran-certificate';
  if (nameAr.includes('ملابس')) return 'clothing-printing';
  if (nameAr.includes('بوستر') || nameAr.includes('كلك')) return 'poster-printing';
  if (nameAr.includes('بانر') || nameAr.includes('Roll')) return 'rollup-banners';
  if (nameAr.includes('بروشور')) return 'brochure-printing';
  if (nameAr.includes('فينيل')) return 'vinyl-printing';
  if (nameAr.includes('DTF')) return 'dtf-printing';
  if (nameAr.includes('UV')) return 'uv-printing';

  const fromEn = (service.nameEn ?? service.nameAr)
    .toLowerCase()
    .replace(/[\s()\/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return fromEn || service.id;
}
