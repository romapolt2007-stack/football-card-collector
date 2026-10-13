export interface StarProduct {
  sku: string;
  priceStars: number;
  grants: { coins?: number; vipDays?: number };
}

/**
 * Канонический список цен — должен совпадать с backend/src/lib/starProducts.ts.
 * Бот сверяет сумму оплаты с этим списком перед начислением (не доверяет payload).
 */
export const STAR_PRODUCTS: StarProduct[] = [
  { sku: "coins_50000", priceStars: 100, grants: { coins: 50000 } },
  { sku: "vip_30d", priceStars: 500, grants: { vipDays: 30 } },
];

export function findStarProduct(sku: string): StarProduct | undefined {
  return STAR_PRODUCTS.find((p) => p.sku === sku);
}
