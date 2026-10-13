import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { findStarProduct, STAR_PRODUCTS } from "../lib/starProducts.js";

const router = Router();

router.get("/products", (_req, res) => {
  res.json({ products: STAR_PRODUCTS });
});

const invoiceSchema = z.object({ sku: z.string() });

router.post("/create-invoice", requireAuth, async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const product = findStarProduct(parsed.data.sku);
  if (!product) {
    res.status(404).json({ error: "Товар не найден" });
    return;
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    res.status(500).json({ error: "BOT_TOKEN не настроен на сервере" });
    return;
  }

  // payload кодирует userId и sku — бот прочитает его в successful_payment,
  // чтобы знать, кому и что начислить
  const payload = JSON.stringify({ userId: req.userId, sku: product.sku });

  const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: product.title,
      description: product.description,
      payload,
      currency: "XTR",
      prices: [{ label: product.title, amount: product.priceStars }],
    }),
  });

  const result = (await response.json()) as { ok: boolean; result?: string; description?: string };
  if (!result.ok || !result.result) {
    res.status(502).json({ error: result.description ?? "Telegram не вернул ссылку на счёт" });
    return;
  }

  res.json({ invoiceLink: result.result });
});

export default router;
