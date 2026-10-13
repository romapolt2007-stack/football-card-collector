import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "./prisma.js";
import { findStarProduct } from "./starProducts.js";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

if (!token) throw new Error("BOT_TOKEN не задан в .env");
if (!webAppUrl) throw new Error("WEBAPP_URL не задан в .env");

const bot = new Bot(token);

// Плейсхолдер из .env.example — реальный чужой домен на Vercel.
// Пока фронтенд не задеплоен, кнопку WebApp не показываем вовсе,
// чтобы случайно не открыть чужой/левый сайт поверх нашего бота.
const PLACEHOLDER_WEBAPP_URL = "https://your-app.vercel.app";
const isWebAppConfigured = webAppUrl !== PLACEHOLDER_WEBAPP_URL;

bot.command("start", async (ctx) => {
  const greeting =
    "Добро пожаловать в Football Card Collector!\n\nСобирай карточки игроков из топ-5 лиг, открывай паки и кейсы, строй состав и побеждай в матчах.";

  if (!isWebAppConfigured) {
    await ctx.reply(`${greeting}\n\n(Игра ещё готовится — кнопка появится после деплоя.)`);
    return;
  }

  const keyboard = new InlineKeyboard().webApp("🎮 Открыть игру", webAppUrl);
  await ctx.reply(greeting, { reply_markup: keyboard });
});

// Telegram даёт всего 10 секунд на ответ — здесь только быстрая проверка,
// без похода в БД за чем-то тяжёлым
bot.on("pre_checkout_query", async (ctx) => {
  try {
    const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload) as {
      userId: string;
      sku: string;
    };
    const product = findStarProduct(payload.sku);

    if (!product || product.priceStars !== ctx.preCheckoutQuery.total_amount) {
      await ctx.answerPreCheckoutQuery(false, { error_message: "Товар недоступен, попробуйте снова" });
      return;
    }

    await ctx.answerPreCheckoutQuery(true);
  } catch {
    await ctx.answerPreCheckoutQuery(false, { error_message: "Не удалось обработать платёж" });
  }
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  const payload = JSON.parse(payment.invoice_payload) as { userId: string; sku: string };
  const product = findStarProduct(payload.sku);
  if (!product) return;

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return;

  const vipUntil =
    product.grants.vipDays && user.vipUntil && user.vipUntil > new Date()
      ? new Date(user.vipUntil.getTime() + product.grants.vipDays * 86_400_000)
      : product.grants.vipDays
        ? new Date(Date.now() + product.grants.vipDays * 86_400_000)
        : undefined;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        coins: product.grants.coins ? { increment: product.grants.coins } : undefined,
        stars: { increment: payment.total_amount },
        isVip: vipUntil ? true : undefined,
        vipUntil,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "STARS_PURCHASE",
        amount: payment.total_amount,
        meta: { sku: product.sku, telegramChargeId: payment.telegram_payment_charge_id },
      },
    }),
  ]);

  await ctx.reply(
    product.grants.coins
      ? `Готово! Зачислено ${product.grants.coins.toLocaleString("ru-RU")} монет 🪙`
      : `Готово! VIP активирован на ${product.grants.vipDays} дней ⭐`,
  );
});

bot.start();
console.log("Бот запущен");
