/**
 * Advanced pricing algorithm
 * Supports: paper size detection (A1-A5), area calculation, flex/rollup pricing
 */

interface PaperDimensions {
  width: number;
  height: number;
  area: number;
}

const PAPER_SIZES: Record<string, PaperDimensions> = {
  A1: { width: 0.841, height: 0.594, area: 0.499 },
  A2: { width: 0.594, height: 0.420, area: 0.249 },
  A3: { width: 0.420, height: 0.297, area: 0.125 },
  A4: { width: 0.297, height: 0.210, area: 0.062 },
  A5: { width: 0.210, height: 0.148, area: 0.031 },
};

export const PAPER_TYPES: Record<string, string> = {
  normal: 'عادي',
  cardboard_170: 'كرتون 170غ',
  cardboard_250: 'كرتون 250غ',
  glossy: 'غلاسي',
  matte: 'معجن',
  coated: 'مقشش',
};

export function detectPaperSize(widthCm: number, heightCm: number): string | null {
  const widthM = widthCm / 100;
  const heightM = heightCm / 100;
  const tolerance = 0.01;

  const matched: string[] = [];

  for (const [size, dims] of Object.entries(PAPER_SIZES)) {
    const matchNormal =
      Math.abs(widthM - dims.width) <= tolerance &&
      Math.abs(heightM - dims.height) <= tolerance;

    const matchRotated =
      Math.abs(widthM - dims.height) <= tolerance &&
      Math.abs(heightM - dims.width) <= tolerance;

    if (matchNormal || matchRotated) {
      matched.push(size);
    }
  }

  if (matched.length === 0) return null;

  const sizeOrder = ['A1', 'A2', 'A3', 'A4', 'A5'];
  matched.sort((a, b) => {
    const idxA = sizeOrder.indexOf(a);
    const idxB = sizeOrder.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return matched[0]!;
}

export function calculateAreaSquareMeters(widthCm: number, heightCm: number): number {
  return (widthCm / 100) * (heightCm / 100);
}

interface AdvancedPriceParams {
  calculationType: 'page' | 'area' | 'piece';
  quantity: number;
  basePrice: number;
  widthCm?: number;
  heightCm?: number;
}

export function calculateAdvancedPrice(params: AdvancedPriceParams): number {
  const { calculationType, quantity, basePrice, widthCm, heightCm } = params;

  if (calculationType === 'area' && widthCm && heightCm) {
    const area = calculateAreaSquareMeters(widthCm, heightCm);
    return basePrice * area * quantity;
  }

  return basePrice * quantity;
}

export function applyBulkPriceUpdate(
  currentPrice: number,
  percentage: number,
  operation: 'increase' | 'decrease',
): number {
  const multiplier = operation === 'increase'
    ? 1 + percentage / 100
    : 1 - percentage / 100;

  return currentPrice * multiplier;
}
