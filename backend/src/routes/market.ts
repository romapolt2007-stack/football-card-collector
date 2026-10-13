import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getIo } from "../lib/socket.js";
import { clearCardFromSquads } from "../lib/squadCleanup.js";
import type { Position, Rarity } from "@prisma/client";

const router = Router();

const MARKET_FEE_RATE = 0.05;
const LISTING_DURATION_DAYS = 7;

const listingInclude = {
  card: { include: { player: { include: { club: { include: { league: true } } } } } },
  seller: { select: { id: true, username: true, firstName: true } },
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
    price: {
      gte: f.minPrice,
      lte: f.maxPrice,
    },
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

const createListingSchema = z.object({
  cardId: z.string(),
  price: z.number().int().positive().max(100_000_000),
});

router.post("/list", requireAuth, async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
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

  const expiresAt = new Date(Date.now() + LISTING_DURATION_DAYS * 86_400_000);
  const [, listing] = await prisma.$transaction([
    prisma.card.update({ where: { id: card.id }, data: { isListed: true } }),
    prisma.listing.create({
      data: { cardId: card.id, sellerId: req.userId!, price: parsed.data.price, expiresAt },
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
  if (listing.sellerId === req.userId) {
    res.status(400).json({ error: "Нельзя купить собственный лот" });
    return;
  }

  const buyer = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (buyer.coins < listing.price) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const fee = Math.round(listing.price * MARKET_FEE_RATE);
  const sellerPayout = listing.price - fee;

  const updatedBuyer = await prisma.$transaction(async (tx) => {
    // перепроверяем статус лота внутри транзакции — защита от гонки двух одновременных покупок
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
      data: { coins: { decrement: listing.price } },
    });
    await tx.user.update({
      where: { id: listing.sellerId },
      data: { coins: { increment: sellerPayout } },
    });
    await tx.transaction.createMany({
      data: [
        { userId: req.userId!, type: "MARKET_BUY", amount: -listing.price, meta: { listingId: listing.id } },
        { userId: listing.sellerId, type: "MARKET_SELL", amount: sellerPayout, meta: { listingId: listing.id } },
        { userId: listing.sellerId, type: "MARKET_FEE", amount: -fee, meta: { listingId: listing.id } },
      ],
    });
    return buyerAfter;
  }).catch((err) => {
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
