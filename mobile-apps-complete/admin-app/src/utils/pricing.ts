import { Product } from "../types";

export function getPricingLabel(pricingType?: number) {
  return pricingType ? `Tier ${pricingType}` : "Tier N/A";
}

export function getEffectiveProductPrice(product: Product, fallbackPricingType = 1) {
  const effectivePricingType = product.pricing_type || fallbackPricingType;
  const tierPrice = product.pricing_rates?.[String(effectivePricingType)];
  return Number(tierPrice ?? product.price ?? 0);
}
