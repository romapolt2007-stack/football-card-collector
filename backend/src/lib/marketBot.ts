import { prisma } from "./prisma.js";
import { quickSellPrice } from "./cardValue.js";
import type { Rarity } from "@prisma/client";

/**
 * Системный продавец для "рыночного бота" — честно подписан как бот в имени,
 * НЕ выдаётся за реального игрока. Нужен, чтобы рынок не выглядел мёртвым
 * у новых/маленьких комьюнити, но без обмана пользователей насчёт того,
 * кто на самом деле продаёт.
 */
const MARKET_BOT_TG_ID = "system:market_bot";

export async function ensureMarketBotUser() {
  return prisma.user.upsert({
    where: { tgId: MARKET_BOT_TG_ID },
    update: {},
    create: {
      tgId: MARKET_BOT_TG_ID,
      username: "market_bot",
      firstName: "🤖 Рыночный Бот",
      coins: 0,
    },
  });
}

const TARGET_ACTIVE_BOT_LISTINGS = 10;
const CHECK_EVERY_MS = 3 * 60 * 1000;
const DURATION_CHOICES_HOURS = [6, 24, 24, 24, 168];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/** Стартовая ставка и цена мгновенного выкупа — рыночная премия над системной ценой скупки. */
function botPricing(rarity: Rarity, overall: number) {
  const floor = quickSellPrice(rarity, overall);
  const startPrice = Math.round(floor * (1.3 + Math.random() * 0.7));
  const buyNowPrice = Math.round(startPrice * (1.3 + Math.random() * 0.3));
  return { startPrice, buyNowPrice };
}

async function seedOnce() {
  try {
    const bot = await ensureMarketBotUser();

    const activeCount = await prisma.listing.count({ where: { sellerId: bot.id, status: "ACTIVE" } });
    const toCreate = TARGET_ACTIVE_BOT_LISTINGS - activeCount;
    if (toCreate <= 0) return;

    for (let i = 0; i < toCreate; i++) {
        // слегка смещаем выбор к более редким игрокам — "горячие лоты" должны
        // иногда реально попадаться, не только бронза
        const rarityRoll = Math.random();
        const rarity: Rarity =
          rarityRoll < 0.35 ? "BRONZE" : rarityRoll < 0.6 ? "SILVER" : rarityRoll < 0.85 ? "GOLD" : rarityRoll < 0.96 ? "LEGEND" : "ICON";

        const candidates = await prisma.player.findMany({ where: { rarity }, select: { id: true, overall: true }, take: 50 });
        if (candidates.length === 0) continue;
        const player = pick(candidates);

        const card = await prisma.card.create({
          data: {
            playerId: player.id,
            ownerId: bot.id,
            rarity,
            quickSellPrice: quickSellPrice(rarity, player.overall),
          },
        });

        const { startPrice, buyNowPrice } = botPricing(rarity, player.overall);
        const durationHours = pick(DURATION_CHOICES_HOURS);
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.card.update({ where: { id: card.id }, data: { isListed: true } }),
          prisma.listing.create({
            data: { cardId: card.id, sellerId: bot.id, price: startPrice, buyNowPrice, expiresAt },
          }),
        ]);
      }
    } catch (err) {
      console.error("Ошибка подсева рыночного бота:", err);
    }
}

export function startMarketBotSeeder() {
  void seedOnce();
  setInterval(seedOnce, CHECK_EVERY_MS);
}
