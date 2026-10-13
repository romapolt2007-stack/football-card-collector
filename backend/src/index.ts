import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import authRouter from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import casesRouter from "./routes/cases.js";
import luckySpinRouter from "./routes/luckySpin.js";
import marketRouter from "./routes/market.js";
import matchesRouter from "./routes/matches.js";
import packsRouter from "./routes/packs.js";
import paymentsRouter from "./routes/payments.js";
import questsRouter from "./routes/quests.js";
import teamRouter from "./routes/team.js";
import userRouter from "./routes/user.js";
import { startBot } from "./bot.js";
import { startFreeBonusNotifier } from "./lib/freeBonusNotifier.js";
import { setIo } from "./lib/socket.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

// Проверка живости сервера — пригодится для хостинга (Railway healthcheck)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Общий лимит на все API-запросы + отдельный, более строгий — для паков и платежей
const apiLimiter = rateLimit({ windowMs: 60_000, limit: 60 });
const actionLimiter = rateLimit({ windowMs: 2_000, limit: 1 });

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/payments", actionLimiter, paymentsRouter);
app.use("/api/packs/open", actionLimiter);
app.use("/api/packs", packsRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/team", teamRouter);
app.use("/api/user/daily-claim", actionLimiter);
app.use("/api/quests", questsRouter);
app.use("/api/market/list", actionLimiter);
app.use("/api/market/buy", actionLimiter);
app.use("/api/market", marketRouter);
app.use("/api/matches/quick", actionLimiter);
app.use("/api/matches/shootout", actionLimiter);
app.use("/api/matches", matchesRouter);
app.use("/api/cases/spin", actionLimiter);
app.use("/api/cases", casesRouter);
app.use("/api/lucky-spin/spin", actionLimiter);
app.use("/api/lucky-spin", luckySpinRouter);
app.use("/api/user/emergency-bonus", actionLimiter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? "*" },
});
setIo(io);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`Backend запущен на http://localhost:${port}`);
});

const bot = startBot();
if (bot) startFreeBonusNotifier(bot);
