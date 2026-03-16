/**
 * تحويل مواصفات الطلب من الواجهة (paper_size, print_color, ...) إلى معاملات التسعير المالي
 * (print_mode, size_code, unit_value) لاستخدامها في calculateFinancialPrice.
 */

export type PrintModeFinancial = 'bw' | 'color_normal' | 'color_laser';
export type SizeCodeFinancial =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'BOOKLET_A5'
  | 'BOOKLET_B5'
  | 'BOOKLET_A4';

export interface FinancialPricingParams {
  print_mode: PrintModeFinancial;
  size_code: SizeCodeFinancial;
  paper_type?: string | null;
  unit_value: number;
}

/** مواصفات كما ترسلها الواجهة (جزء منها) */
export interface FrontendSpecsLike {
  paper_size?: string;
  paper_type?: string | null;
  print_color?: string;
  print_quality?: string;
  number_of_pages?: number;
  total_pages?: number;
  booklet?: boolean;
  [key: string]: unknown;
}

const PAPER_SIZE_TO_SIZE_CODE: Record<string, SizeCodeFinancial> = {
  A1: 'A1',
  A2: 'A2',
  A3: 'A3',
  A4: 'A4',
  A5: 'A5',
  A6: 'A6',
  B5: 'BOOKLET_B5',
};

const BOOKLET_SIZE_CODE: Record<string, SizeCodeFinancial> = {
  A4: 'BOOKLET_A4',
  A5: 'BOOKLET_A5',
  B5: 'BOOKLET_B5',
};

const VALID_SIZE_CODES: Set<string> = new Set([
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'BOOKLET_A5', 'BOOKLET_B5', 'BOOKLET_A4',
]);

/**
 * يشتق معاملات التسعير المالي من مواصفات الصنف.
 * يرجع null إذا لم تكتمل البيانات (مثلاً حجم ورقي غير مدعوم أو غياب عدد الصفحات).
 */
export function specsToFinancialParams(specs: FrontendSpecsLike): FinancialPricingParams | null {
  const paperSize = typeof specs.paper_size === 'string' ? specs.paper_size.trim().toUpperCase() : '';
  const booklet = Boolean(specs.booklet);
  let sizeCode: SizeCodeFinancial | undefined;
  if (booklet && paperSize && BOOKLET_SIZE_CODE[paperSize]) {
    sizeCode = BOOKLET_SIZE_CODE[paperSize];
  } else if (paperSize && PAPER_SIZE_TO_SIZE_CODE[paperSize]) {
    sizeCode = PAPER_SIZE_TO_SIZE_CODE[paperSize];
  } else if (paperSize && VALID_SIZE_CODES.has(paperSize)) {
    sizeCode = paperSize as SizeCodeFinancial;
  }
  if (!sizeCode) return null;

  const printColor = typeof specs.print_color === 'string' ? specs.print_color : '';
  const printQuality = typeof specs.print_quality === 'string' ? specs.print_quality : '';
  let print_mode: PrintModeFinancial;
  if (printColor === 'bw') {
    print_mode = 'bw';
  } else if (printColor === 'color') {
    print_mode = printQuality === 'laser' ? 'color_laser' : 'color_normal';
  } else {
    return null;
  }

  const numPages = typeof specs.number_of_pages === 'number' ? specs.number_of_pages : undefined;
  const totalPages = typeof specs.total_pages === 'number' ? specs.total_pages : undefined;
  const unit_value = numPages ?? totalPages ?? 1;
  if (unit_value < 0 || !Number.isFinite(unit_value)) return null;

  const paper_type = typeof specs.paper_type === 'string' ? specs.paper_type.trim() || null : null;
  return { print_mode, size_code: sizeCode, paper_type: paper_type ?? undefined, unit_value };
}
