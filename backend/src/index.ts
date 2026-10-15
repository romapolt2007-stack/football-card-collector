import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import authRouter from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import marketRouter from "./routes/market.js";
import spinRouter from "./routes/spin.js";
import stadiumsRouter from "./routes/stadiums.js";
import userRouter from "./routes/user.js";
import { startBot } from "./bot.js";
import { startMarketAuctionSettler } from "./lib/marketAuctionSettler.js";
import { startMarketBotSeeder } from "./lib/marketBot.js";
import { setIo } from "./lib/socket.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

// Проверка живости сервера — пригодится для хостинга (Railway healthcheck)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Общий лимит на все API-запросы + отдельный, более строгий — для спинов и рынка
const apiLimiter = rateLimit({ windowMs: 60_000, limit: 60 });
const actionLimiter = rateLimit({ windowMs: 2_000, limit: 1 });

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/user/daily-claim", actionLimiter);
app.use("/api/cards", cardsRouter);
app.use("/api/spin/spin", actionLimiter);
app.use("/api/spin", spinRouter);
app.use("/api/stadiums/spin", actionLimiter);
app.use("/api/stadiums", stadiumsRouter);
app.use("/api/market/list", actionLimiter);
app.use("/api/market/buy", actionLimiter);
app.use(/^\/api\/market\/listings\/[^/]+\/bid$/, actionLimiter);
app.use("/api/market", marketRouter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? "*" },
});
setIo(io);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`Backend запущен на http://localhost:${port}`);
});

startBot();
startMarketAuctionSettler();
startMarketBotSeeder();
