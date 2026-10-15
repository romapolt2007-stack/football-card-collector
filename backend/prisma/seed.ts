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
}

function loadJson<T>(filename: string): T {
  const path = join(__dirname, "data", filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

/**
 * Сид РЕАЛЬНЫХ данных (prisma/data/clubs.json, prisma/data/players.json) —
 * никакой процедурной генерации вымышленных имён, только загрузка готового
 * curated-набора. ДЕСТРУКТИВНО: полностью очищает игровые данные перед
 * загрузкой — предназначено для полного сброса (см. README/план разворота
 * на реальных футболистов), НИКОГДА не запускать против прода без явного
 * согласования.
 */
async function main() {
  console.log("Очищаю старые данные...");
  await prisma.marketBid.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.card.deleteMany();
  await prisma.stadiumCard.deleteMany();
  await prisma.player.deleteMany();
  await prisma.stadium.deleteMany();
  await prisma.club.deleteMany();
  await prisma.league.deleteMany();

  const clubsData = loadJson<ClubData[]>("clubs.json");
  const playersData = loadJson<PlayerData[]>("players.json");

  const leagueNames = [...new Set(clubsData.map((c) => c.league))];
  const leagueByName = new Map<string, string>();
  for (const [order, name] of leagueNames.entries()) {
    const league = await prisma.league.create({ data: { name, order } });
    leagueByName.set(name, league.id);
  }

  const clubIdBySlug = new Map<string, string>();
  for (const c of clubsData) {
    const club = await prisma.club.create({
      data: {
        name: c.name,
        shortName: c.shortName,
        colorPrimary: c.colorPrimary,
        colorSecondary: c.colorSecondary,
        leagueId: leagueByName.get(c.league)!,
      },
    });
    clubIdBySlug.set(c.slug, club.id);

    await prisma.stadium.create({
      data: {
        name: c.stadium.name,
        city: c.stadium.city,
        capacity: c.stadium.capacity,
        openedYear: c.stadium.openedYear,
        rarity: rarityForCapacity(c.stadium.capacity),
        clubId: club.id,
      },
    });
  }
  console.log(`Клубы и стадионы: ${clubsData.length}`);

  for (const p of playersData) {
    const clubId = clubIdBySlug.get(p.club);
    if (!clubId) {
      throw new Error(`Игрок ${p.slug}: клуб "${p.club}" не найден в clubs.json`);
    }
    const rarity = rarityForOverall(p.overall);
    const stats = rollStats(p.overall, p.position);

    await prisma.player.create({
      data: {
        name: p.name,
        fullName: p.fullName,
        nation: p.nation,
        nationFlag: p.nationFlag,
        position: p.position,
        overall: p.overall,
        ...stats,
        age: 24,
        height: p.position === "GK" ? 190 : 180,
        foot: "RIGHT",
        weakFoot: 3,
        skillMoves: rarity === "LEGEND" || rarity === "ICON" ? 4 : 3,
        rarity,
        maxSupply: p.maxSupply ?? null,
        clubId,
      },
    });
  }
  console.log(`Игроки: ${playersData.length}`);

  console.log("Готово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
