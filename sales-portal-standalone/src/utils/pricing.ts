import { Product } from "../types";

const pricingKeyPatterns = (pricingType: number) => [
  `${pricingType}`,
  `tier_${pricingType}`,
  `pricing_tier_${pricingType}`,
  `tier-${pricingType}`,
];

export function getTieredProductPrice(product: Product, pricingType?: number | null) {
  const basePrice = Number(product.price ?? 0);
  if (pricingType == null) {
    return basePrice;
  }

  const rates = product.pricing_rates;
  if (!rates) {
    return basePrice;
  }

  for (const key of pricingKeyPatterns(pricingType)) {
    const rate = rates[key];
    if (rate != null) {
      return Number(rate);
    }
  }

  return basePrice;
}
