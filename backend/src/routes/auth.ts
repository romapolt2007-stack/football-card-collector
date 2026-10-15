import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { verifyTelegramInitData } from "../lib/telegramAuth.js";

const router = Router();

const authSchema = z.object({
  initData: z.string().min(1),
});

router.post("/telegram", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса", details: parsed.error.flatten() });
    return;
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    res.status(500).json({ error: "BOT_TOKEN не настроен на сервере" });
    return;
  }

  const data = verifyTelegramInitData(parsed.data.initData, botToken);
  if (!data) {
    res.status(401).json({ error: "Не удалось подтвердить подпись Telegram initData" });
    return;
  }

  const tgId = String(data.user.id);

  const user = await prisma.user.upsert({
    where: { tgId },
    update: {
      username: data.user.username,
      firstName: data.user.first_name,
      photoUrl: data.user.photo_url,
    },
    create: {
      tgId,
      username: data.user.username,
      firstName: data.user.first_name,
      photoUrl: data.user.photo_url,
    },
  });

  const token = signAuthToken({ userId: user.id });
  res.json({ token, user });
});

export default router;
