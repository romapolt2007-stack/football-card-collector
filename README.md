# Football Card Collector

Telegram Mini App — коллекционирование карточек РЕАЛЬНЫХ футболистов и
стадионов топ-5 европейских лиг. Механика в духе бота «Номерок»
(@NomerokAppBot): крути → получи результат с редкостью → сохрани в
коллекцию или продай → торгуй на рынке.

Только текстовые данные (имя, позиция, нация, клуб, факты о стадионе) —
никаких реальных фото или логотипов, собственная процедурная графика и
собственная формула рейтинга (см. `backend/prisma/README-DATA.md`).

## Структура проекта

```
football-card-collector/
├── frontend/   React + TypeScript + Vite + TailwindCSS — сам Mini App
└── backend/    Node.js + Express + TypeScript + Prisma — API, игровая логика, сокеты, бот (grammY, в том же процессе)
```

## Основные экраны

- **🎰 Собрать** — бесплатный спин раз в 4 часа: случайная позиция → случайный
  реальный игрок под неё → сохранить в коллекцию или продать.
- **🏟️ Стадионы** — отдельный спин: редкость по вместимости арены.
- **🗂️ Коллекция** — карты игроков и стадионов, фильтры по редкости, продажа.
- **🏪 Рынок** — листинги (ставки + мгновенный выкуп, комиссия 8%), live-обновления через Socket.IO.
- **👤 Профиль** — аватар, ежедневный бонус со стриком.

## Стек

| Слой      | Технологии |
|-----------|------------|
| Frontend  | React, TypeScript, Vite, Telegram WebApp SDK, TailwindCSS, Framer Motion, Zustand, React Query, Socket.IO client |
| Backend   | Node.js, Express, TypeScript, PostgreSQL + Prisma, Socket.IO, JWT, Zod, grammY (бот в том же процессе) |
| Хостинг   | Vercel (frontend) · Railway (backend) · Neon (PostgreSQL) |

## Запуск локально

Понадобится Node.js 20+ и локальный PostgreSQL.

### 0. PostgreSQL

```bash
brew install postgresql@16
LC_ALL="en_US.UTF-8" /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/pg16.log start
/opt/homebrew/opt/postgresql@16/bin/createdb football_card_collector
```
Строка подключения для `.env`: `postgresql://<ваш-mac-юзер>@localhost:5432/football_card_collector`

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# впишите DATABASE_URL (см. шаг 0), JWT_SECRET (любая случайная строка), BOT_TOKEN
npx prisma migrate deploy   # применит миграции
npx tsx prisma/seed.ts      # загрузит реальных игроков/клубы/стадионы (ДЕСТРУКТИВНО — полный сброс данных)
npm run dev
```
Поднимется на `http://localhost:4000`, проверить: `curl http://localhost:4000/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Откроется на `http://localhost:5273`.

## Как получить BOT_TOKEN

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → укажите имя и username (должен заканчиваться на `bot`)
3. Скопируйте выданный токен в `backend/.env`

## Данные

`backend/prisma/data/clubs.json` (20 клубов топ-5 лиг + их стадионы) и
`backend/prisma/data/players.json` (80 реальных игроков) — курируемый набор,
обновлять вручную по мере трансферных изменений. Подробности и юридические
правила — `backend/prisma/README-DATA.md`.
