import { Bot, InlineKeyboard } from "grammy";

const PLACEHOLDER_WEBAPP_URL = "https://your-app.vercel.app";

/**
 * Бот живёт в том же процессе, что и backend (long polling) — это позволяет
 * обойтись одним Railway-сервисом вместо двух платных.
 */
export function startBot() {
  const token = process.env.BOT_TOKEN;
  const webAppUrl = process.env.WEBAPP_URL ?? PLACEHOLDER_WEBAPP_URL;

  if (!token) {
    console.log("BOT_TOKEN не задан — бот не запущен (только API)");
    return;
  }

  const bot = new Bot(token);
  const isWebAppConfigured = webAppUrl !== PLACEHOLDER_WEBAPP_URL;

  bot.command("start", async (ctx) => {
    const greeting =
      "Добро пожаловать!\n\nКрути состав, собирай карточки реальных футболистов топ-5 лиг и стадионов, строй коллекцию и торгуй на рынке.";

    if (!isWebAppConfigured) {
      await ctx.reply(`${greeting}\n\n(Игра ещё готовится — кнопка появится после деплоя.)`);
      return;
    }

    const keyboard = new InlineKeyboard().webApp("🎮 Открыть игру", webAppUrl);
    await ctx.reply(greeting, { reply_markup: keyboard });
  });

  // Не await'им — polling идёт бесконечно. Если он всё же упадёт (например,
  // конфликт с другим запущенным инстансом бота), ловим ошибку здесь, а не
  // даём ей обрушить весь процесс вместе с API.
  bot.start().catch((err) => {
    console.error("Бот остановился с ошибкой (API продолжает работать):", err);
  });
  console.log("Бот запущен (в процессе backend)");
  return bot;
}
