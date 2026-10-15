import type { Prisma, PrismaClient } from "@prisma/client";

export const REFERRAL_BONUS_COINS = 10000;
// Многоуровневый реферал: "дедушка" (кто пригласил реферера) тоже получает бонус — меньше, одноразово.
export const REFERRAL_LEVEL2_BONUS_COINS = 3000;

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Начисляет 1-й уровень рефереру и (если есть) 2-й уровень его пригласившему. Один раз на приглашённого. */
export async function grantReferralBonus(tx: TxClient | Prisma.TransactionClient, referrerId: string, referredUserId: string) {
  await tx.user.update({
    where: { id: referrerId },
    data: { coins: { increment: REFERRAL_BONUS_COINS } },
  });
  await tx.transaction.create({
    data: {
      userId: referrerId,
      type: "REFERRAL_BONUS",
      amount: REFERRAL_BONUS_COINS,
      meta: { referredUserId, level: 1 },
    },
  });

  const referrer = await tx.user.findUnique({ where: { id: referrerId }, select: { referredBy: true } });
  if (referrer?.referredBy) {
    await tx.user.update({
      where: { id: referrer.referredBy },
      data: { coins: { increment: REFERRAL_LEVEL2_BONUS_COINS } },
    });
    await tx.transaction.create({
      data: {
        userId: referrer.referredBy,
        type: "REFERRAL_BONUS",
        amount: REFERRAL_LEVEL2_BONUS_COINS,
        meta: { referredUserId, level: 2 },
      },
    });
  }
}
