import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { COSMETIC_PATCHES, findCosmeticPatch } from "../lib/cosmeticPatches.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { cosmeticPatchId: true } });
  res.json({ patches: COSMETIC_PATCHES, installedId: user.cosmeticPatchId });
});

const applySchema = z.object({ patchId: z.string().nullable() });

router.post("/apply", requireAuth, async (req, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  if (parsed.data.patchId !== null && !findCosmeticPatch(parsed.data.patchId)) {
    res.status(404).json({ error: "Патч не найден" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { cosmeticPatchId: parsed.data.patchId },
    select: { cosmeticPatchId: true },
  });

  res.json({ installedId: user.cosmeticPatchId });
});

export default router;
