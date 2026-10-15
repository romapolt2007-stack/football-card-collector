import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/** Лиги + вложенные клубы — для панели фильтров перед спином и на рынке. */
router.get("/leagues", async (_req, res) => {
  const leagues = await prisma.league.findMany({
    orderBy: { order: "asc" },
    include: { clubs: { orderBy: { name: "asc" }, select: { id: true, name: true, shortName: true, colorPrimary: true, colorSecondary: true } } },
  });
  res.json({ leagues });
});

/** Список стран игроков (для фильтра "Страна") — по факту присутствия в базе, без дублей. */
router.get("/nations", async (_req, res) => {
  const players = await prisma.player.findMany({ select: { nation: true, nationFlag: true }, distinct: ["nation"] });
  const nations = players.map((p) => ({ nation: p.nation, flag: p.nationFlag })).sort((a, b) => a.nation.localeCompare(b.nation, "ru"));
  res.json({ nations });
});

export default router;
