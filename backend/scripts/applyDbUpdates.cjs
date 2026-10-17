// Применяет переименования из scripts/_name_updates.json (создаётся englishifyNames.cjs) к уже
// засеянной базе — ТОЛЬКО обновляет name/fullName существующих Player, ничего не создаёт и не
// удаляет. Матчит игрока по (clubId, старое кириллическое name), т.к. в БД slug не хранится.
//
// Локально:  node scripts/applyDbUpdates.cjs
// Прод:      DATABASE_URL="<строка подключения к Neon>" node scripts/applyDbUpdates.cjs

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const updates = JSON.parse(fs.readFileSync(path.join(__dirname, "_name_updates.json"), "utf-8"));
  const clubs = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "prisma", "data", "clubs.json"), "utf-8"));
  const clubNameBySlug = new Map(clubs.map((c) => [c.slug, c.name]));

  const dbClubs = await prisma.club.findMany({ select: { id: true, name: true } });
  const clubIdByName = new Map(dbClubs.map((c) => [c.name, c.id]));

  let updated = 0;
  let notFound = 0;
  let alreadyDone = 0;

  for (const u of updates) {
    const clubName = clubNameBySlug.get(u.club);
    const clubId = clubName ? clubIdByName.get(clubName) : undefined;
    if (!clubId) {
      console.log(`Клуб не найден в БД: slug=${u.club}`);
      notFound++;
      continue;
    }

    const player = await prisma.player.findFirst({ where: { clubId, name: u.oldName } });
    if (!player) {
      // Либо уже переименован (повторный запуск), либо это новый игрок добавленный после сида.
      const already = await prisma.player.findFirst({ where: { clubId, name: u.newName } });
      if (already) alreadyDone++;
      else {
        console.log(`Не найден: клуб=${clubName} (${u.club}) имя="${u.oldName}"`);
        notFound++;
      }
      continue;
    }

    await prisma.player.update({
      where: { id: player.id },
      data: { name: u.newName, fullName: u.newFullName },
    });
    updated++;
  }

  console.log(`\nОбновлено: ${updated}`);
  console.log(`Уже было (повторный запуск): ${alreadyDone}`);
  console.log(`Не найдено: ${notFound}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
