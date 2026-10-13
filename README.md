# Football Card Collector

Telegram Mini App — футбольный коллекционный симулятор: паки, кейсы, рынок, матчи против ботов, конструктор команды.

## Структура проекта

```
football-card-collector/
├── frontend/   React + TypeScript + Vite + TailwindCSS — сам Mini App (WebApp)
├── backend/    Node.js + Express + TypeScript + Prisma — API, игровая логика, сокеты
└── bot/        grammY — Telegram-бот (/start, уведомления, реферальные ссылки)
```

## Стек

| Слой      | Технологии |
|-----------|------------|
| Frontend  | React, TypeScript, Vite, Telegram WebApp SDK, TailwindCSS, Framer Motion, Zustand, React Query, Socket.IO client |
| Backend   | Node.js, Express, TypeScript, PostgreSQL + Prisma, Redis, Socket.IO, JWT, Zod |
| Bot       | grammY |
| Хостинг   | Vercel (frontend) · Railway (backend) · Neon (PostgreSQL) · Upstash (Redis) · Cloudflare R2 (файлы) |

## Запуск локально

Понадобится Node.js 20+ и локальный PostgreSQL.

### 0. PostgreSQL

```bash
brew install postgresql@16
LC_ALL="en_US.UTF-8" /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/pg16.log start
/opt/homebrew/opt/postgresql@16/bin/createdb football_card_collector
```
Строка подключения для `.env`: `postgresql://<ваш-mac-юзер>@localhost:5432/football_card_collector`

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Откроется на `http://localhost:5273`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# впишите DATABASE_URL (см. шаг 0), JWT_SECRET (любая случайная строка), BOT_TOKEN
npm run prisma:migrate   # применит миграции
npm run prisma:seed      # сгенерирует 5 лиг, ~670 вымышленных игроков, квесты
npm run dev
```
Поднимется на `http://localhost:4000`, проверить: `curl http://localhost:4000/health`.

Готовые роуты на этом шаге:
- `POST /api/auth/telegram` — вход по initData, выдаёт JWT
- `GET /api/user/me` — профиль (нужен `Authorization: Bearer <token>`)
- `GET /api/payments/products` — каталог товаров за Stars
- `POST /api/payments/create-invoice` — ссылка на оплату Stars (нужен реальный BOT_TOKEN)

### 3. Bot

```bash
cd bot
npm install
cp .env.example .env
# впишите BOT_TOKEN, WEBAPP_URL (на локалке — ngrok/любой туннель, Telegram не откроет localhost) и тот же DATABASE_URL
npm run prisma:generate
npm run dev
```

## Как получить BOT_TOKEN

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → укажите имя и username (должен заканчиваться на `bot`)
3. Скопируйте выданный токен в `bot/.env` и `backend/.env`

## Оплата Telegram Stars

Товары заданы в `backend/src/lib/starProducts.ts` (канонический источник цен) и
продублированы в `bot/src/starProducts.ts` (бот не доверяет payload — сверяет
сумму со своим списком перед начислением). Поток: фронт запрашивает
`create-invoice` → открывает `Telegram.WebApp.openInvoice()` → Telegram шлёт
`pre_checkout_query` и `successful_payment` **боту** → бот сам зачисляет
монеты/VIP и пишет `Transaction`.

## Вымышленная вселенная

Все лиги/клубы/игроки придуманы — подробности и почему в
`backend/prisma/README-FICTION.md`.

## Этапы разработки

1. **Каркас** — структура, Prisma-схема, сид игроков, авторизация Telegram, оплата Stars ✅
2. **Карточки и паки** — UI карточек 5 редкостей, открытие паков с анимацией (тряска/вспышка/флип), полный каталог паков, quick-sell ✅
3. **Инвентарь и команда** — поле с 5 схемами, слоты + скамейка, пикер игрока с фильтрами, drag & drop, живой расчёт химии ✅
4. **Экономика** — ежедневный бонус (стрик 1-7, x3 на 7-й день), 3 ежедневных квеста с прогрессом, XP/уровни ✅
5. **Рынок** — листинги, фильтры/сортировка/поиск, покупка с комиссией 5%, live-обновления через Socket.IO ✅
6. **Матчи** — Quick Match: сила состава (OVR + химия), симуляция на сервере, live-плейбэк событий, награды (монеты/XP/карта) ✅
7. **Кейсы** — рулетка в стиле CS:GO, 4 кейса, призы (карты/монеты/джекпот) ✅
8. Полировка (достижения, лидерборды, деплой) ← *мы здесь*

### Не реализовано из Шага 6 (сознательно упрощено)
Division Rivals (10 дивизионов) и Tournament (турнир на 8 команд) из ТЗ не сделаны —
это отдельные крупные подсистемы (прогрессия дивизионов, бокс плей-офф), Quick Match
покрывает основную механику симуляции, остальное можно достроить по тому же паттерну.
