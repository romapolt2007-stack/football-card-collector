import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getIo } from "../lib/socket.js";
import { MARKET_FEE_RATE } from "../lib/marketConstants.js";
import { getUserStadiumBuff } from "../lib/stadiumBuffs.js";
import { todaysLeagueTrends } from "../lib/marketTrends.js";
import type { Position, Rarity } from "@prisma/client";

const router = Router();

const DURATION_HOURS = [1, 6, 24, 168] as const;
/** Базовый лимит активных лотов на игрока — расширяется баффом лучшего владеемого стадиона. */
const BASE_LISTING_LIMIT = 10;

router.get("/trends-today", async (_req, res) => {
  const trends = await todaysLeagueTrends();
  res.json({ trends });
});

const listingInclude = {
  card: { include: { player: { include: { club: { include: { league: true } } } } } },
  stadiumCard: { include: { stadium: { include: { club: { include: { league: true } } } } } },
  seller: { select: { id: true, username: true, firstName: true } },
  bids: { orderBy: { amount: "desc" as const }, take: 1, include: { bidder: { select: { id: true, username: true, firstName: true } } } },
} as const;

const listQuerySchema = z.object({
  kind: z.enum(["player", "stadium"]).optional(),
  leagueId: z.string().optional(),
  clubId: z.string().optional(),
  nation: z.string().optional(),
  position: z.string().optional(),
  rarity: z.string().optional(),
  minOvr: z.coerce.number().optional(),
  maxOvr: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  auctionType: z.enum(["AUCTION", "BUY_NOW"]).optional(),
  sort: z.enum(["price_asc", "price_desc", "ovr_desc", "newest"]).default("newest"),
});

router.get("/listings", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректные параметры фильтра" });
    return;
  }
  const f = parsed.data;

  const where = {
    status: "ACTIVE" as const,
    price: { gte: f.minPrice, lte: f.maxPrice },
    ...(f.auctionType === "BUY_NOW" ? { buyNowPrice: { not: null } } : {}),
    ...(f.auctionType === "AUCTION" ? { buyNowPrice: null } : {}),
    ...(f.kind === "player" ? { cardId: { not: null } } : {}),
    ...(f.kind === "stadium" ? { stadiumCardId: { not: null } } : {}),
    ...(f.kind !== "stadium"
      ? {
          card: {
            ...(f.rarity ? { rarity: f.rarity as Rarity } : {}),
            player: {
              ...(f.nation ? { nation: f.nation } : {}),
              ...(f.position ? { position: f.position as Position } : {}),
              ...(f.search ? { name: { contains: f.search, mode: "insensitive" as const } } : {}),
              overall: { gte: f.minOvr, lte: f.maxOvr },
              ...(f.clubId ? { clubId: f.clubId } : {}),
              ...(f.leagueId ? { club: { leagueId: f.leagueId } } : {}),
            },
          },
        }
      : {}),
  };

  const orderBy =
    f.sort === "price_asc"
      ? { price: "asc" as const }
      : f.sort === "price_desc"
        ? { price: "desc" as const }
        : f.sort === "ovr_desc"
          ? { card: { player: { overall: "desc" as const } } }
          : { createdAt: "desc" as const };

  const listings = await prisma.listing.findMany({
    where,
    include: listingInclude,
    orderBy,
    take: 100,
  });
  res.json({ listings, feeRate: MARKET_FEE_RATE });
});

/** "Горячие сделки" — активные лоты карт игроков с ощутимой скидкой от системной цены скупки. */
router.get("/hot", async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", cardId: { not: null } },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const withScore = listings
    .filter((l) => l.card)
    .map((l) => {
      const referencePrice = l.buyNowPrice ?? l.price;
      const discount = 1 - referencePrice / Math.max(1, l.card!.quickSellPrice * 4);
      return { listing: l, discount };
    });

  const hot = withScore
    .filter((x) => x.discount > 0.1)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 12)
    .map((x) => x.listing);

  res.json({ listings: hot });
});

router.get("/mine", requireAuth, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.userId },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ listings });
});

router.get("/history", requireAuth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId, type: { in: ["MARKET_BUY", "MARKET_SELL"] } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const listingIds = [...new Set(transactions.map((t) => (t.meta as { listingId?: string })?.listingId).filter((id): id is string => Boolean(id)))];
  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    include: listingInclude,
  });
  const listingById = new Map(listings.map((l) => [l.id, l]));

  const history = transactions.map((t) => {
    const listingId = (t.meta as { listingId?: string })?.listingId;
    const listing = listingId ? listingById.get(listingId) : undefined;
    return {
      id: t.id,
      type: t.type,
      amount: t.amount,
      createdAt: t.createdAt,
      itemName: listing?.card?.player.name ?? listing?.stadiumCard?.stadium.name ?? null,
      rarity: listing?.card?.rarity ?? listing?.stadiumCard?.stadium.rarity ?? null,
    };
  });

  res.json({ history });
});

const createListingSchema = z
  .object({
    cardId: z.string().optional(),
    stadiumCardId: z.string().optional(),
    price: z.number().int().positive().max(100_000_000),
    buyNowPrice: z.number().int().positive().max(100_000_000).optional(),
    durationHours: z.number().int().refine((h) => (DURATION_HOURS as readonly number[]).includes(h)),
  })
  .refine((d) => Boolean(d.cardId) !== Boolean(d.stadiumCardId), {
    message: "Укажите ровно один предмет: cardId или stadiumCardId",
  });

router.post("/list", requireAuth, async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }
  if (parsed.data.buyNowPrice && parsed.data.buyNowPrice <= parsed.data.price) {
    res.status(400).json({ error: "Цена выкупа должна быть выше стартовой цены" });
    return;
  }

  const activeCount = await prisma.listing.count({ where: { sellerId: req.userId, status: "ACTIVE" } });
  const buff = await getUserStadiumBuff(req.userId!);
  const limit = BASE_LISTING_LIMIT + buff.extraListingSlots;
  if (activeCount >= limit) {
    res.status(400).json({
      error: `Лимит активных лотов исчерпан (${activeCount}/${limit}) — прокачайте стадион, чтобы расширить рынок`,
    });
    return;
  }

  const expiresAt = new Date(Date.now() + parsed.data.durationHours * 60 * 60 * 1000);

  if (parsed.data.cardId) {
    const card = await prisma.card.findUnique({ where: { id: parsed.data.cardId } });
    if (!card || card.ownerId !== req.userId) {
      res.status(404).json({ error: "Карта не найдена" });
      return;
    }
    if (card.isListed) {
      res.status(400).json({ error: "Карта уже выставлена на продажу" });
      return;
    }

    const [, listing] = await prisma.$transaction([
      prisma.card.update({ where: { id: card.id }, data: { isListed: true } }),
      prisma.listing.create({
        data: { cardId: card.id, sellerId: req.userId!, price: parsed.data.price, buyNowPrice: parsed.data.buyNowPrice, expiresAt },
        include: listingInclude,
      }),
    ]);
    getIo()?.emit("market:created", listing);
    res.status(201).json({ listing });
    return;
  }

  const stadiumCard = await prisma.stadiumCard.findUnique({ where: { id: parsed.data.stadiumCardId! } });
  if (!stadiumCard || stadiumCard.ownerId !== req.userId) {
    res.status(404).json({ error: "Карта стадиона не найдена" });
    return;
  }
  if (stadiumCard.isListed) {
    res.status(400).json({ error: "Уже выставлена на продажу" });
    return;
  }

  const [, listing] = await prisma.$transaction([
    prisma.stadiumCard.update({ where: { id: stadiumCard.id }, data: { isListed: true } }),
    prisma.listing.create({
      data: { stadiumCardId: stadiumCard.id, sellerId: req.userId!, price: parsed.data.price, buyNowPrice: parsed.data.buyNowPrice, expiresAt },
      include: listingInclude,
    }),
  ]);
  getIo()?.emit("market:created", listing);
  res.status(201).json({ listing });
});

router.post("/listings/:id/cancel", requireAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.sellerId !== req.userId) {
    res.status(404).json({ error: "Лот не найден" });
    return;
  }
  if (listing.status !== "ACTIVE") {
    res.status(400).json({ error: "Лот уже закрыт" });
    return;
  }

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { status: "EXPIRED" } }),
    ...(listing.cardId ? [prisma.card.update({ where: { id: listing.cardId }, data: { isListed: false } })] : []),
    ...(listing.stadiumCardId ? [prisma.stadiumCard.update({ where: { id: listing.stadiumCardId }, data: { isListed: false } })] : []),
  ]);

  getIo()?.emit("market:removed", { listingId: listing.id });
  res.json({ ok: true });
});

const bidSchema = z.object({ amount: z.number().int().positive() });

router.post("/listings/:id/bid", requireAuth, async (req, res) => {
  const parsed = bidSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректная ставка" });
    return;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { bids: { orderBy: { amount: "desc" }, take: 1 } },
  });
  if (!listing || listing.status !== "ACTIVE") {
    res.status(404).json({ error: "Лот недоступен" });
    return;
  }
  if (listing.sellerId === req.userId) {
    res.status(400).json({ error: "Нельзя делать ставку на свой лот" });
    return;
  }

  const minBid = listing.bids[0] ? listing.bids[0].amount + 1 : listing.price;
  if (parsed.data.amount < minBid) {
    res.status(400).json({ error: `Минимальная ставка — ${minBid.toLocaleString("ru-RU")}` });
    return;
  }

  const bidder = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (bidder.coins < parsed.data.amount) {
    res.status(400).json({ error: "Недостаточно монет для такой ставки" });
    return;
  }

  const bid = await prisma.marketBid.create({
    data: { listingId: listing.id, bidderId: req.userId!, amount: parsed.data.amount },
    include: { bidder: { select: { id: true, username: true, firstName: true } } },
  });

  getIo()?.emit("market:bid", { listingId: listing.id, amount: bid.amount, bidder: bid.bidder });
  res.status(201).json({ bid });
});

const buySchema = z.object({ listingId: z.string() });

router.post("/buy", requireAuth, async (req, res) => {
  const parsed = buySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing || listing.status !== "ACTIVE") {
    res.status(404).json({ error: "Лот недоступен" });
    return;
  }
  if (!listing.buyNowPrice) {
    res.status(400).json({ error: "Для этого лота доступны только ставки" });
    return;
  }
  if (listing.sellerId === req.userId) {
    res.status(400).json({ error: "Нельзя купить собственный лот" });
    return;
  }

  const buyer = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (buyer.coins < listing.buyNowPrice) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const price = listing.buyNowPrice;
  const fee = Math.round(price * MARKET_FEE_RATE);
  const sellerPayout = price - fee;

  const updatedBuyer = await prisma
    .$transaction(async (tx) => {
      const freshListing = await tx.listing.findUnique({ where: { id: listing.id } });
      if (!freshListing || freshListing.status !== "ACTIVE") {
        throw new Error("ALREADY_SOLD");
      }

      await tx.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
      if (listing.cardId) {
        await tx.card.update({ where: { id: listing.cardId }, data: { ownerId: req.userId!, isListed: false } });
      } else if (listing.stadiumCardId) {
        await tx.stadiumCard.update({ where: { id: listing.stadiumCardId }, data: { ownerId: req.userId!, isListed: false } });
      }
      const buyerAfter = await tx.user.update({
        where: { id: req.userId },
        data: { coins: { decrement: price } },
      });
      await tx.user.update({
        where: { id: listing.sellerId },
        data: { coins: { increment: sellerPayout } },
      });
      await tx.transaction.createMany({
        data: [
          { userId: req.userId!, type: "MARKET_BUY", amount: -price, meta: { listingId: listing.id } },
          { userId: listing.sellerId, type: "MARKET_SELL", amount: sellerPayout, meta: { listingId: listing.id } },
          { userId: listing.sellerId, type: "MARKET_FEE", amount: -fee, meta: { listingId: listing.id } },
        ],
      });
      return buyerAfter;
    })
    .catch((err) => {
      if (err instanceof Error && err.message === "ALREADY_SOLD") return null;
      throw err;
    });

  if (!updatedBuyer) {
    res.status(409).json({ error: "Лот уже купили" });
    return;
  }

  getIo()?.emit("market:sold", { listingId: listing.id });
  res.json({ coins: updatedBuyer.coins });
});

export default router;
