import type { Locale } from './servicesCatalog';

export interface SpecEntry {
  key: string;
  label: string;
  value: string;
}

/** مفاتيح داخلية أو تُعرض في أقسام أخرى — لا تظهر في «مواصفات الطلب» */
export const HIDDEN_SPEC_KEYS = new Set([
  'service_id',
  'files',
  'clothing_designs',
  'uploadedFileResults',
  'customer_name',
  'customer_whatsapp',
  'customer_phone',
  'customer_phone_extra',
  'shop_name',
  'delivery_address',
  'delivery_street',
  'delivery_neighborhood',
  'delivery_building_floor',
  'delivery_extra',
  'delivery_latitude',
  'delivery_longitude',
  'delivery_type',
  'notes',
  'total_pages',
  'dimensions_unit',
  'unit',
  /** مشتقة للتسعير — تُعرض عبر paper_size / print_color */
  'print_mode',
  'size_code',
  'unit_value',
]);

/** ترتيب العرض حسب خطوات الطلب */
const SPEC_DISPLAY_ORDER: string[] = [
  'quantity',
  'number_of_pages',
  'paper_size',
  'booklet',
  'print_color',
  'print_quality',
  'print_sides',
  'width',
  'height',
  'dimensions',
  'paper_type',
  'needs_scale',
  'scale_value',
  'card_type',
  'binding_type',
  'cover_type',
  'binding_color',
  'text_color',
  'cover_print_type',
  'digital_aspect_ratio',
  'digital_aspect_anchor',
  'digital_color_mode',
  'digital_custom_hex',
  'uv_material_type',
  'uv_cardboard_weight_g',
  'uv_material_other_text',
  'uv_thickness_mm',
  'clothing_source',
];

const SPEC_LABELS: Record<string, { ar: string; en: string }> = {
  quantity: { ar: 'الكمية', en: 'Quantity' },
  number_of_pages: { ar: 'عدد الصفحات', en: 'Page count' },
  paper_size: { ar: 'قياس الورق', en: 'Paper size' },
  print_color: { ar: 'نوع الطباعة', en: 'Print color' },
  print_quality: { ar: 'جودة الطباعة', en: 'Print quality' },
  print_sides: { ar: 'طباعة الوجه', en: 'Sides' },
  booklet: { ar: 'كتيب', en: 'Booklet' },
  width: { ar: 'العرض', en: 'Width' },
  height: { ar: 'الارتفاع', en: 'Height' },
  dimensions: { ar: 'الأبعاد', en: 'Dimensions' },
  paper_type: { ar: 'نوع الورق', en: 'Paper type' },
  needs_scale: { ar: 'تحجيم التصميم', en: 'Design scaling' },
  scale_value: { ar: 'قيمة المقياس', en: 'Scale value' },
  card_type: { ar: 'نوع البطاقة', en: 'Card type' },
  binding_type: { ar: 'نوع التجليد', en: 'Binding' },
  cover_type: { ar: 'نوع الغلاف', en: 'Cover type' },
  binding_color: { ar: 'لون التجليد', en: 'Binding color' },
  text_color: { ar: 'لون الكتابة', en: 'Text color' },
  cover_print_type: { ar: 'نوع طباعة الغلاف', en: 'Cover print' },
  clothing_source: { ar: 'مصدر الملابس', en: 'Clothing source' },
  digital_aspect_ratio: { ar: 'نسبة العرض للارتفاع', en: 'Aspect ratio' },
  digital_aspect_anchor: { ar: 'مرجع التناسب', en: 'Aspect anchor' },
  digital_color_mode: { ar: 'لون الطباعة', en: 'Print color' },
  digital_custom_hex: { ar: 'لون مخصص', en: 'Custom color' },
  uv_material_type: { ar: 'نوع المادة', en: 'Material' },
  uv_cardboard_weight_g: { ar: 'وزن الكرتون (غ/م²)', en: 'Cardboard weight (g/m²)' },
  uv_material_other_text: { ar: 'وصف مادة أخرى', en: 'Other material' },
  uv_thickness_mm: { ar: 'سماكة المادة (مم)', en: 'Thickness (mm)' },
  delivery_type: { ar: 'طريقة الاستلام', en: 'Delivery' },
};

const VALUE_LABELS: Record<string, Record<string, { ar: string; en: string }>> = {
  print_color: {
    bw: { ar: 'أبيض وأسود', en: 'Black & white' },
    color: { ar: 'ألوان', en: 'Color' },
  },
  print_quality: {
    standard: { ar: 'عادي', en: 'Standard' },
    laser: { ar: 'ليزر', en: 'Laser' },
  },
  print_sides: {
    single: { ar: 'وجه واحد', en: 'Single-sided' },
    double: { ar: 'وجهان', en: 'Double-sided' },
  },
  print_mode: {
    bw: { ar: 'أبيض وأسود', en: 'Black & white' },
    color_normal: { ar: 'ألوان عادية', en: 'Standard color' },
    color_laser: { ar: 'ألوان ليزر', en: 'Laser color' },
  },
  clothing_source: {
    customer: { ar: 'من العميل', en: 'From customer' },
    store: { ar: 'من المتجر', en: 'From store' },
  },
  delivery_type: {
    delivery: { ar: 'توصيل', en: 'Delivery' },
    self: { ar: 'استلام من المحل', en: 'Pickup' },
  },
  digital_aspect_anchor: {
    width: { ar: 'حسب العرض', en: 'From width' },
    height: { ar: 'حسب الارتفاع', en: 'From height' },
  },
  digital_color_mode: {
    silver: { ar: 'فضي', en: 'Silver' },
    gold: { ar: 'ذهبي', en: 'Gold' },
    black: { ar: 'أسود', en: 'Black' },
    white: { ar: 'أبيض', en: 'White' },
    file: { ar: 'ألوان الملف', en: 'As in file' },
    custom: { ar: 'لون مخصص', en: 'Custom' },
  },
  uv_material_type: {
    vinyl: { ar: 'فينيل', en: 'Vinyl' },
    cardboard: { ar: 'كرتون', en: 'Cardboard' },
    cardboard_reinforced: { ar: 'كرتون معجن', en: 'Reinforced cardboard' },
    transparent: { ar: 'شفافية', en: 'Transparent' },
    leather: { ar: 'جلد', en: 'Leather' },
    fabric: { ar: 'قماش', en: 'Fabric' },
    plex: { ar: 'بليكس', en: 'Plex' },
    glass: { ar: 'بلور / زجاج', en: 'Glass' },
    other: { ar: 'غير ذلك', en: 'Other' },
  },
  paper_type: {
    normal: { ar: 'ورق عادي', en: 'Normal paper' },
    canson: { ar: 'ورق كانسون', en: 'Canson paper' },
  },
  binding_type: {
    lamination: { ar: 'تغليف حراري', en: 'Lamination' },
    cover: { ar: 'غلاف كرتوني', en: 'Cardboard cover' },
  },
  cover_type: {
    normal_cardboard: { ar: 'كرتون عادي', en: 'Normal cardboard' },
    thick_cardboard: { ar: 'كرتون سميك', en: 'Thick cardboard' },
  },
  size_code: {
    A1: { ar: 'A1', en: 'A1' },
    A2: { ar: 'A2', en: 'A2' },
    A3: { ar: 'A3', en: 'A3' },
    A4: { ar: 'A4', en: 'A4' },
    A5: { ar: 'A5', en: 'A5' },
    A6: { ar: 'A6', en: 'A6' },
    BOOKLET_A4: { ar: 'كتيب A4', en: 'Booklet A4' },
    BOOKLET_A5: { ar: 'كتيب A5', en: 'Booklet A5' },
    BOOKLET_B5: { ar: 'كتيب B5', en: 'Booklet B5' },
  },
};

/** مفاتيح كل نوع خطوة في الـ workflow */
export const WORKFLOW_STEP_SPEC_KEYS: Record<string, string[]> = {
  files: ['quantity', 'number_of_pages', 'total_pages'],
  print_options: ['paper_size', 'print_color', 'print_quality', 'print_sides', 'booklet'],
  dimensions: ['width', 'height'],
  paper_type: ['paper_type', 'needs_scale', 'scale_value', 'width', 'height'],
  digital_dimensions: ['width', 'height', 'digital_aspect_ratio', 'digital_aspect_anchor'],
  digital_print_color: ['digital_color_mode', 'digital_custom_hex'],
  uv_material: ['uv_material_type', 'uv_cardboard_weight_g', 'uv_material_other_text', 'uv_thickness_mm'],
  card_type: ['card_type'],
  binding_options: ['binding_type', 'cover_type'],
  thesis_binding: ['binding_color', 'text_color', 'cover_print_type'],
  clothing_source: ['clothing_source'],
  clothing_designs: [],
  notes: [],
  customer_info: [],
};

export function getWorkflowAllowedSpecKeys(stepTypes: string[]): Set<string> {
  const keys = new Set<string>(['quantity']);
  for (const stepType of stepTypes) {
    const stepKeys = WORKFLOW_STEP_SPEC_KEYS[stepType];
    if (stepKeys) stepKeys.forEach((k) => keys.add(k));
  }
  return keys;
}

function lookupValueLabel(key: string, raw: string, locale: Locale): string | null {
  const map = VALUE_LABELS[key]?.[raw];
  return map ? (locale === 'ar' ? map.ar : map.en) : null;
}

export function formatSpecLabel(key: string, locale: Locale): string {
  return SPEC_LABELS[key]?.[locale === 'ar' ? 'ar' : 'en'] ?? key;
}

export function formatSpecValue(
  key: string,
  value: unknown,
  locale: Locale,
  contextSpecs?: Record<string, unknown>,
): string {
  if (value === null || value === undefined || value === '' || value === false) return '';
  if (value === true) return locale === 'ar' ? 'نعم' : 'Yes';

  const raw = String(value);
  const labeled = lookupValueLabel(key, raw, locale);
  if (labeled) return labeled;

  if (key === 'width' || key === 'height' || key === 'dimensions') {
    if (typeof value === 'number') {
      if (value === 0) return '';
      const unit =
        (contextSpecs?.dimensions_unit as string) ??
        (contextSpecs?.unit as string) ??
        (locale === 'ar' ? 'سم' : 'cm');
      return `${value} ${unit}`;
    }
    return raw;
  }

  if (key === 'uv_cardboard_weight_g') return `${raw} ${locale === 'ar' ? 'غ/م²' : 'g/m²'}`;
  if (key === 'uv_thickness_mm') return `${raw} ${locale === 'ar' ? 'مم' : 'mm'}`;

  return raw;
}

function isContextuallyHidden(key: string, specs: Record<string, unknown>): boolean {
  if (key === 'print_quality' && specs.print_color === 'bw') return true;
  if (key === 'cover_type' && !specs.binding_type) return true;
  if (key === 'scale_value' && !specs.needs_scale) return true;
  if (key === 'digital_custom_hex' && specs.digital_color_mode !== 'custom') return true;
  if (key.startsWith('digital_') && !specs.digital_aspect_ratio && key !== 'digital_aspect_ratio') {
    if (key === 'digital_color_mode' || key === 'digital_custom_hex') return true;
  }
  if (key.startsWith('uv_')) {
    const material = specs.uv_material_type;
    if (!material || material === '') return true;
    if (key === 'uv_cardboard_weight_g') {
      const m = String(material);
      if (m !== 'cardboard' && m !== 'cardboard_reinforced') return true;
    }
    if (key === 'uv_material_other_text' && material !== 'other') return true;
  }
  if (key === 'booklet' && specs.booklet === false) return true;
  if (key === 'needs_scale' && specs.needs_scale === false) return true;
  return false;
}

function isEmptyDefault(key: string, value: unknown, specs: Record<string, unknown>): boolean {
  if (value === null || value === undefined || value === '' || value === false) return true;
  if (typeof value === 'number' && value === 0 && (key === 'width' || key === 'height' || key === 'number_of_pages')) {
    return true;
  }
  if (key === 'digital_aspect_ratio' && (value === null || value === '')) return true;
  if (key === 'digital_custom_hex' && (value === '' || value === '#000000')) return true;
  if (HIDDEN_SPEC_KEYS.has(key)) return true;
  if (isContextuallyHidden(key, specs)) return true;
  return false;
}

export function getDisplayableSpecEntries(
  specs: Record<string, unknown>,
  locale: Locale,
  options?: { allowedKeys?: Set<string> },
): SpecEntry[] {
  const allowed = options?.allowedKeys;
  const entries: SpecEntry[] = [];

  for (const [key, value] of Object.entries(specs)) {
    if (HIDDEN_SPEC_KEYS.has(key)) continue;
    if (allowed && !allowed.has(key)) continue;
    if (isEmptyDefault(key, value, specs)) continue;

    const formatted = formatSpecValue(key, value, locale, specs);
    if (formatted === '' || formatted === '0') continue;
    if ((key === 'width' || key === 'height') && formatted === '0') continue;

    entries.push({
      key,
      label: formatSpecLabel(key, locale),
      value: formatted,
    });
  }

  entries.sort((a, b) => {
    const ai = SPEC_DISPLAY_ORDER.indexOf(a.key);
    const bi = SPEC_DISPLAY_ORDER.indexOf(b.key);
    const aOrder = ai === -1 ? 999 : ai;
    const bOrder = bi === -1 ? 999 : bi;
    return aOrder - bOrder;
  });

  return entries;
}
