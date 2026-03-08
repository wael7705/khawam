/**
 * Rule-based pricing algorithm
 * Supports: piece, area, page calculation types
 * Applies color and sides multipliers from rule configuration
 */

interface PriceMultipliers {
  color?: Record<string, number>;
  sides?: Record<string, number>;
  [key: string]: Record<string, number> | undefined;
}

interface PriceSpecifications {
  color?: string;
  sides?: string;
  paper_size?: string;
  unit?: string;
  [key: string]: string | undefined;
}

interface CalculatePriceParams {
  calculationType: 'piece' | 'area' | 'page';
  quantity: number;
  basePrice: number;
  priceMultipliers?: PriceMultipliers | null;
  specifications?: PriceSpecifications | null;
}

export function calculatePrice(params: CalculatePriceParams): number {
  const { calculationType, quantity, basePrice, priceMultipliers, specifications } = params;

  let price = basePrice;

  if (priceMultipliers && specifications) {
    let multiplier = 1.0;

    if (priceMultipliers.color && specifications.color) {
      const colorMultiplier = priceMultipliers.color[specifications.color];
      if (colorMultiplier !== undefined) {
        multiplier *= colorMultiplier;
      }
    }

    if (priceMultipliers.sides && specifications.sides) {
      const sidesMultiplier = priceMultipliers.sides[specifications.sides];
      if (sidesMultiplier !== undefined) {
        multiplier *= sidesMultiplier;
      }
    }

    price *= multiplier;
  }

  if (calculationType === 'page' && specifications?.sides === 'double') {
    return price * 2 * quantity;
  }

  return price * quantity;
}

interface RuleMatch {
  ruleId: string;
  basePrice: number;
  priceMultipliers: PriceMultipliers | null;
  specifications: PriceSpecifications | null;
  unit: string | null;
  nameAr: string;
}

export function findBestMatchingRule(
  rules: RuleMatch[],
  requestSpecs: PriceSpecifications,
): RuleMatch {
  let bestMatch: RuleMatch | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    const ruleSpecs = rule.specifications;

    if (requestSpecs && ruleSpecs) {
      if (requestSpecs.color && ruleSpecs.color && requestSpecs.color === ruleSpecs.color) {
        score += 2;
      }
      if (requestSpecs.sides && ruleSpecs.sides && requestSpecs.sides === ruleSpecs.sides) {
        score += 2;
      }
      if (requestSpecs.paper_size && ruleSpecs.paper_size && requestSpecs.paper_size === ruleSpecs.paper_size) {
        score += 1;
      }
      if (rule.unit && requestSpecs.unit && rule.unit === requestSpecs.unit) {
        score += 1;
      }
    }

    if (!ruleSpecs || Object.keys(ruleSpecs).length === 0) {
      score = 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestMatch ?? rules[0]!;
}
