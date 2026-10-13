export interface StarProduct {
  sku: string;
  title: string;
  description: string;
  priceStars: number;
  grants: { coins?: number; vipDays?: number };
}

/**
 * Каталог товаров за Telegram Stars.
 * ВАЖНО: этот список продублирован в bot/src/starProducts.ts — бот начисляет
 * награду сам (Telegram шлёт pre_checkout_query и successful_payment боту,
 * не бэкенду), поэтому обоим сервисам нужен один и тот же канонический список.
 */
export const STAR_PRODUCTS: StarProduct[] = [
  {
    sku: "coins_50000",
    title: "50 000 монет",
    description: "Пакет игровой валюты",
    priceStars: 100,
    grants: { coins: 50000 },
  },
  {
    sku: "vip_30d",
    title: "VIP на 30 дней",
    description: "x2 монет за матчи и квесты на 30 дней",
    priceStars: 500,
    grants: { vipDays: 30 },
  },
];

export function findStarProduct(sku: string): StarProduct | undefined {
  return STAR_PRODUCTS.find((p) => p.sku === sku);
}
