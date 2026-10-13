import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { prisma } from "./prisma.js";
import { FREE_BONUS_INTERVAL_MS } from "./freeBonus.js";

const CHECK_EVERY_MS = 60_000;
const PLACEHOLDER_WEBAPP_URL = "https://your-app.vercel.app";

/**
 * Раз в минуту проверяет, у кого бонус стал доступен, и шлёт ОДНО уведомление
 * за цикл (не долбит повторно, пока лежит неполученным) — иначе это быстро
 * превратится в спам и люди замьютят бота.
 */
export function startFreeBonusNotifier(bot: Bot) {
  const webAppUrl = process.env.WEBAPP_URL ?? PLACEHOLDER_WEBAPP_URL;
  if (webAppUrl === PLACEHOLDER_WEBAPP_URL) {
    console.log("WEBAPP_URL не настроен — уведомления о бонусе отключены");
    return;
  }

  setInterval(async () => {
    const cutoff = new Date(Date.now() - FREE_BONUS_INTERVAL_MS);
    const candidates = await prisma.user.findMany({
      where: { lastFreeBonusAt: { not: null, lte: cutoff } },
      select: { id: true, tgId: true, lastFreeBonusAt: true, freeBonusNotifiedAt: true },
    });

    const toNotify = candidates.filter(
      (u) => !u.freeBonusNotifiedAt || u.freeBonusNotifiedAt < u.lastFreeBonusAt!,
    );

    for (const user of toNotify) {
      try {
        const keyboard = new InlineKeyboard().webApp("🎁 Забрать бонус", webAppUrl);
        await bot.api.sendMessage(user.tgId, "🎁 Бесплатный бонус снова доступен!", {
          reply_markup: keyboard,
        });
      } catch (err) {
        // пользователь мог заблокировать бота — это ожидаемо, просто пропускаем
        console.log(`Не удалось отправить уведомление ${user.tgId}:`, (err as Error).message);
      } finally {
        await prisma.user.update({
          where: { id: user.id },
          data: { freeBonusNotifiedAt: new Date() },
        });
      }
    }
  }, CHECK_EVERY_MS);
}
