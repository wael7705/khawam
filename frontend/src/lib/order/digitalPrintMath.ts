/** حسابات أبعاد طباعة DTF/UV (عرض × ارتفاع بالسم). */

export function computeAspectRatio(width: number, height: number): number | null {
  if (width <= 0 || height <= 0) return null;
  return width / height;
}

export function applyWidthFromHeight(height: number, ratio: number): number {
  if (height <= 0 || ratio <= 0) return 0;
  return Math.round(height * ratio * 1000) / 1000;
}

export function applyHeightFromWidth(width: number, ratio: number): number {
  if (width <= 0 || ratio <= 0) return 0;
  return Math.round((width / ratio) * 1000) / 1000;
}

export function isWithinMaxDimensions(width: number, height: number, maxW: number, maxH: number): boolean {
  return width > 0 && height > 0 && width <= maxW && height <= maxH;
}
