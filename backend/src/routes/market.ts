import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getIo } from "../lib/socket.js";
import { clearCardFromSquads } from "../lib/squadCleanup.js";
import { MARKET_FEE_RATE } from "../lib/marketConstants.js";
import type { Position, Rarity } from "@prisma/client";

const router = Router();

const DURATION_HOURS = [1, 6, 24, 168] as const;

const listingInclude = {
  card: { include: { player: { include: { club: { include: { league: true } } } } } },
  seller: { select: { id: true, username: true, firstName: true } },
  bids: { orderBy: { amount: "desc" as const }, take: 1, include: { bidder: { select: { id: true, username: true, firstName: true } } } },
} as const;

const listQuerySchema = z.object({
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

/** "Горячие сделки" — активные лоты с ощутимой скидкой от системной цены скупки (quickSellPrice). */
router.get("/hot", async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const withScore = listings.map((l) => {
    const referencePrice = l.buyNowPrice ?? l.price;
    const discount = 1 - referencePrice / Math.max(1, l.card.quickSellPrice * 4);
    return { listing: l, discount };
  });

  const hot = withScore
    .filter((x) => x.discount > 0.1)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 12)
    .map((x) => x.listing);

  res.json({ listings: hot });
});

/** Тренды цен по редкости: средняя цена продажи за последние 24ч против предыдущих 24ч. */
router.get("/trends", async (_req, res) => {
  const now = Date.now();
  const since48h = new Date(now - 48 * 60 * 60 * 1000);

  const recentSales = await prisma.transaction.findMany({
    where: { type: "MARKET_SELL", createdAt: { gte: since48h } },
    select: { amount: true, createdAt: true, meta: true },
  });

  if (recentSales.length === 0) {
    res.json({ trends: [] });
    return;
  }

  const listingIds = [...new Set(recentSales.map((t) => (t.meta as { listingId?: string })?.listingId).filter((id): id is string => Boolean(id)))];
  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    include: { card: true },
  });
  const rarityByListing = new Map(listings.map((l) => [l.id, l.card.rarity]));

  const buckets: Record<string, { recent: number[]; prior: number[] }> = {};
  const cutoff = new Date(now - 24 * 60 * 60 * 1000);

  for (const sale of recentSales) {
    const listingId = (sale.meta as { listingId?: string })?.listingId;
    const rarity = listingId ? rarityByListing.get(listingId) : undefined;
    if (!rarity) continue;
    buckets[rarity] ??= { recent: [], prior: [] };
    if (sale.createdAt >= cutoff) buckets[rarity].recent.push(sale.amount);
    else buckets[rarity].prior.push(sale.amount);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const trends = Object.entries(buckets)
    .map(([rarity, b]) => {
      const recentAvg = avg(b.recent);
      const priorAvg = avg(b.prior);
      if (recentAvg === null || priorAvg === null || priorAvg === 0) return null;
      const changePct = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
      return { rarity, recentAvg: Math.round(recentAvg), changePct };
    })
    .filter((t): t is { rarity: string; recentAvg: number; changePct: number } => t !== null);

  res.json({ trends });
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
    include: { card: { include: { player: { include: { club: true } } } } },
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
      playerName: listing?.card.player.name ?? null,
      rarity: listing?.card.rarity ?? null,
    };
  });

  res.json({ history });
});

const createListingSchema = z.object({
  cardId: z.string(),
  price: z.number().int().positive().max(100_000_000),
  buyNowPrice: z.number().int().positive().max(100_000_000).optional(),
  durationHours: z.number().int().refine((h) => (DURATION_HOURS as readonly number[]).includes(h)),
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

  const card = await prisma.card.findUnique({ where: { id: parsed.data.cardId } });
  if (!card || card.ownerId !== req.userId) {
    res.status(404).json({ error: "Карта не найдена" });
    return;
  }
  if (card.isListed) {
    res.status(400).json({ error: "Карта уже выставлена на продажу" });
    return;
  }

  await clearCardFromSquads(req.userId!, card.id);

  const expiresAt = new Date(Date.now() + parsed.data.durationHours * 60 * 60 * 1000);
  const [, listing] = await prisma.$transaction([
    prisma.card.update({ where: { id: card.id }, data: { isListed: true } }),
    prisma.listing.create({
      data: {
        cardId: card.id,
        sellerId: req.userId!,
        price: parsed.data.price,
        buyNowPrice: parsed.data.buyNowPrice,
        expiresAt,
      },
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
    prisma.card.update({ where: { id: listing.cardId }, data: { isListed: false } }),
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
      await tx.card.update({
        where: { id: listing.cardId },
        data: { ownerId: req.userId!, isListed: false },
      });
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
