import { describe, it, expect } from 'vitest';
import {
  applyHeightFromWidth,
  applyWidthFromHeight,
  computeAspectRatio,
  isWithinMaxDimensions,
} from './digitalPrintMath';

describe('digitalPrintMath', () => {
  it('computeAspectRatio returns null for non-positive inputs', () => {
    expect(computeAspectRatio(0, 10)).toBeNull();
    expect(computeAspectRatio(10, 0)).toBeNull();
    expect(computeAspectRatio(-1, 5)).toBeNull();
  });

  it('computeAspectRatio divides width by height', () => {
    expect(computeAspectRatio(90, 60)).toBe(1.5);
  });

  it('applyWidthFromHeight and applyHeightFromWidth are inverse for a ratio', () => {
    const ratio = 1.5;
    const h = 40;
    const w = applyWidthFromHeight(h, ratio);
    expect(w).toBe(60);
    expect(applyHeightFromWidth(w, ratio)).toBe(h);
  });

  it('isWithinMaxDimensions respects bounds', () => {
    expect(isWithinMaxDimensions(90, 60, 90, 60)).toBe(true);
    expect(isWithinMaxDimensions(91, 60, 90, 60)).toBe(false);
    expect(isWithinMaxDimensions(90, 61, 90, 60)).toBe(false);
  });
});
