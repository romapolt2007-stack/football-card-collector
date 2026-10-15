import { PrismaClient, Position } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rarityForCapacity, rarityForOverall, rollStats } from "./seedShared.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

interface ClubData {
  slug: string;
  name: string;
  shortName: string;
  league: string;
  colorPrimary: string;
  colorSecondary: string;
  stadium: { name: string; city: string; capacity: number; openedYear: number };
}

interface PlayerData {
  slug: string;
  name: string;
  fullName: string;
  club: string;
  position: Position;
  nation: string;
  nationFlag: string;
  overall: number;
  maxSupply?: number;
  age?: number;
  height?: number;
  foot?: "RIGHT" | "LEFT";
  weakFoot?: number;
  skillMoves?: number;
}

function loadJson<T>(filename: string): T {
  const path = join(__dirname, "data", filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn("Повтор после ошибки:", (e as Error).message);
    await prisma.$disconnect();
    await new Promise((r) => setTimeout(r, 1500));
    return fn();
  }
}

/**
 * АДДИТИВНЫЙ сид — в отличие от seed.ts НИЧЕГО не удаляет и безопасен для
 * продакшена. Загружает ту же prisma/data/clubs.json и players.json и
 * добавляет только то, чего там ещё нет (лиги/клубы/стадионы — по имени,
 * игроки — по паре клуб+полное имя). Идемпотентен: повторный запуск не
 * создаст дублей.
 */
async function main() {
  const clubsData = loadJson<ClubData[]>("clubs.json");
  const playersData = loadJson<PlayerData[]>("players.json");

  const existingLeagues = await prisma.league.findMany();
  const leagueIdByName = new Map(existingLeagues.map((l) => [l.name, l.id]));
  let nextOrder = existingLeagues.length;

  const neededLeagueNames = [...new Set(clubsData.map((c) => c.league))];
  for (const name of neededLeagueNames) {
    if (!leagueIdByName.has(name)) {
      const league = await withRetry(() => prisma.league.create({ data: { name, order: nextOrder++ } }));
      leagueIdByName.set(name, league.id);
      console.log(`+ Лига: ${name}`);
    }
  }

  const existingClubs = await prisma.club.findMany({ include: { stadium: true } });
  const clubKeyToId = new Map(existingClubs.map((c) => [`${c.leagueId}::${c.name}`, c.id]));
  const clubHasStadium = new Map(existingClubs.map((c) => [c.id, Boolean(c.stadium)]));

  const clubIdBySlug = new Map<string, string>();
  let newClubs = 0;
  let newStadiums = 0;
  for (const c of clubsData) {
    const leagueId = leagueIdByName.get(c.league)!;
    const key = `${leagueId}::${c.name}`;
    let clubId = clubKeyToId.get(key);

    if (!clubId) {
      const club = await withRetry(() =>
        prisma.club.create({
          data: { name: c.name, shortName: c.shortName, colorPrimary: c.colorPrimary, colorSecondary: c.colorSecondary, leagueId },
        }),
      );
      clubId = club.id;
      clubKeyToId.set(key, clubId);
      newClubs++;
    }
    clubIdBySlug.set(c.slug, clubId);

    if (!clubHasStadium.get(clubId)) {
      await withRetry(() =>
        prisma.stadium.create({
          data: {
            name: c.stadium.name,
            city: c.stadium.city,
            capacity: c.stadium.capacity,
            openedYear: c.stadium.openedYear,
            rarity: rarityForCapacity(c.stadium.capacity),
            clubId: clubId!,
          },
        }),
      );
      clubHasStadium.set(clubId, true);
      newStadiums++;
    }
  }
  console.log(`Клубы: +${newClubs} новых (всего в данных ${clubsData.length})`);
  console.log(`Стадионы: +${newStadiums} новых`);

  const existingPlayers = await prisma.player.findMany({ select: { clubId: true, fullName: true } });
  const existingPlayerKeys = new Set(existingPlayers.map((p) => `${p.clubId}::${p.fullName}`));

  let newPlayers = 0;
  const BATCH_SIZE = 200;
  let batch: ReturnType<typeof buildPlayerRow>[] = [];

  function buildPlayerRow(p: PlayerData, clubId: string) {
    const rarity = rarityForOverall(p.overall);
    const stats = rollStats(p.overall, p.position);
    return {
      name: p.name,
      fullName: p.fullName,
      nation: p.nation,
      nationFlag: p.nationFlag,
      position: p.position,
      overall: p.overall,
      ...stats,
      age: p.age ?? 24,
      height: p.height ?? (p.position === "GK" ? 190 : 180),
      foot: p.foot ?? "RIGHT",
      weakFoot: p.weakFoot ?? 3,
      skillMoves: p.skillMoves ?? (rarity === "LEGEND" || rarity === "ICON" ? 4 : 3),
      rarity,
      maxSupply: p.maxSupply ?? null,
      clubId,
    };
  }

  async function flushBatch() {
    if (batch.length === 0) return;
    await withRetry(() => prisma.player.createMany({ data: batch }));
    newPlayers += batch.length;
    batch = [];
  }

  for (const p of playersData) {
    const clubId = clubIdBySlug.get(p.club);
    if (!clubId) {
      throw new Error(`Игрок ${p.slug}: клуб "${p.club}" не найден в clubs.json`);
    }
    const key = `${clubId}::${p.fullName}`;
    if (existingPlayerKeys.has(key)) continue;
    existingPlayerKeys.add(key);

    batch.push(buildPlayerRow(p, clubId));
    if (batch.length >= BATCH_SIZE) await flushBatch();
  }
  await flushBatch();

  console.log(`Игроки: +${newPlayers} новых (всего в данных ${playersData.length})`);
  console.log("Готово. Ничего не удалено.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
