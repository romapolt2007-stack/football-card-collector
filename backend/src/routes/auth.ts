import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { verifyTelegramInitData } from "../lib/telegramAuth.js";

const router = Router();

const authSchema = z.object({
  initData: z.string().min(1),
});

const REFERRAL_BONUS_COINS = 10000;

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
  const existing = await prisma.user.findUnique({ where: { tgId } });

  let referrerId: string | undefined;
  if (!existing && data.startParam?.startsWith("ref_")) {
    const code = data.startParam.slice(4);
    const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
    if (referrer) referrerId = referrer.id;
  }

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.upsert({
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
        referredBy: referrerId,
      },
    });

    // Реферальный бонус начисляется один раз, в момент первой регистрации приглашённого
    if (!existing && referrerId) {
      await tx.user.update({
        where: { id: referrerId },
        data: { coins: { increment: REFERRAL_BONUS_COINS } },
      });
      await tx.transaction.create({
        data: {
          userId: referrerId,
          type: "REFERRAL_BONUS",
          amount: REFERRAL_BONUS_COINS,
          meta: { referredUserId: u.id },
        },
      });
    }

    return u;
  });

  const token = signAuthToken({ userId: user.id });
  res.json({ token, user });
});

export default router;
