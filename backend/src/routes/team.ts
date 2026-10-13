import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const FORMATIONS = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as const;

const slotSchema = z.object({ slotId: z.string(), cardId: z.string().nullable() });
const squadSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  formation: z.enum(FORMATIONS),
  slots: z.array(slotSchema),
  isActive: z.boolean().optional(),
});

async function assertOwnsCards(userId: string, slots: { cardId: string | null }[]) {
  const cardIds = [...new Set(slots.map((s) => s.cardId).filter((id): id is string => Boolean(id)))];
  if (cardIds.length === 0) return;
  const owned = await prisma.card.count({ where: { id: { in: cardIds }, ownerId: userId } });
  if (owned !== cardIds.length) {
    throw new Error("Некоторые карты не принадлежат вам");
  }
  const listed = await prisma.card.count({ where: { id: { in: cardIds }, isListed: true } });
  if (listed > 0) {
    throw new Error("Нельзя поставить в состав карту, выставленную на продажу");
  }
}

router.get("/squads", requireAuth, async (req, res) => {
  const squads = await prisma.squad.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json({ squads });
});

router.post("/squads", requireAuth, async (req, res) => {
  const parsed = squadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса", details: parsed.error.flatten() });
    return;
  }

  try {
    await assertOwnsCards(req.userId!, parsed.data.slots);
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
    return;
  }

  const squadCount = await prisma.squad.count({ where: { userId: req.userId } });
  const squad = await prisma.squad.create({
    data: {
      userId: req.userId!,
      name: parsed.data.name ?? `Состав ${squadCount + 1}`,
      formation: parsed.data.formation,
      slots: parsed.data.slots,
      isActive: squadCount === 0, // первый состав — активный по умолчанию
    },
  });
  res.status(201).json({ squad });
});

router.put("/squads/:id", requireAuth, async (req, res) => {
  const parsed = squadSchema.partial({ formation: true, slots: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса", details: parsed.error.flatten() });
    return;
  }

  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad || squad.userId !== req.userId) {
    res.status(404).json({ error: "Состав не найден" });
    return;
  }

  if (parsed.data.slots) {
    try {
      await assertOwnsCards(req.userId!, parsed.data.slots);
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
      return;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      await tx.squad.updateMany({
        where: { userId: req.userId, id: { not: squad.id } },
        data: { isActive: false },
      });
    }
    return tx.squad.update({
      where: { id: squad.id },
      data: {
        name: parsed.data.name,
        formation: parsed.data.formation,
        slots: parsed.data.slots,
        isActive: parsed.data.isActive,
      },
    });
  });

  res.json({ squad: updated });
});

export default router;
