// Одноразовый скрипт: переводит name/fullName игроков с кириллицы на латиницу (английское
// написание). Фамилия — по slug (для топ-5 лиг slug уже в виде английской фамилии слитно,
// например "debruyne"), имя — транслитерация кириллицы. Для РПЛ (slug вида "zenit_zen_01",
// без полезной фамилии) — транслитерация имени и фамилии целиком.
//
// Запуск: node scripts/englishifyNames.cjs            — только пишет prisma/data/players.json
//         node scripts/englishifyNames.cjs --apply-db  — дополнительно обновляет уже засеянную БД
//         (матчит существующих Player по (clubId, старое name) — т.е. запускать ДО того, как
//         players.json перезаписан, импорт данных делает всё за один проход).

const fs = require("fs");
const path = require("path");

const PLAYERS_PATH = path.join(__dirname, "..", "prisma", "data", "players.json");
const CLUBS_PATH = path.join(__dirname, "..", "prisma", "data", "clubs.json");

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y",
  ь: "", э: "e", ю: "yu", я: "ya",
};

// Отдельные имена, где точечная поправка нужна до общей транслитерации: "дж" почти всегда это
// английское "J" (Jude, Jack, Jordan), а не раздельные "д"+"ж" ("Dzh"); пара известных исключений
// (итальянские Gi-имена, сербское Đ) — отдельным словарём ниже.
const GIVEN_NAME_OVERRIDES = {
  // "дж"-исключения: итальянские Gi-имена и сербское Đ пишутся не через J.
  Джованни: "Giovanni", Джовани: "Giovani", Джакомо: "Giacomo", Джузеппе: "Giuseppe",
  Джанлука: "Gianluca", Джанлуиджи: "Gianluigi", Джанджакомо: "Giangiacomo",
  Джордже: "Djordje", Джурич: "Djuric", Джибриль: "Djibril",
  // Самые частые англоязычные имена, где русское написание расходится с механической
  // транслитерацией побуквенно (Jude -> "Джуд", а не наоборот) — список по частотности
  // в players.json, топ-100 покрывает основную массу употреблений.
  Мохамед: "Mohamed", Мохаммед: "Mohammed", Мохаммад: "Mohammad",
  Йошко: "Josko", Тибо: "Thibaut", Деклан: "Declan", Уильям: "William",
  Джексон: "Jackson", Джеймс: "James", Джордан: "Jordan", Джо: "Joe",
  Джошуа: "Joshua", Джейдон: "Jaydon", Джейкоб: "Jacob", Джейсон: "Jason",
  Джаррод: "Jarrod", Джефферсон: "Jefferson", Джейми: "Jamie", Джордж: "George",
  Джей: "Jay", Джэ: "Jay", Джефф: "Jeff", Джеффри: "Jeffrey", Джонатан: "Jonathan",
  Джонни: "Johnny", Джарелл: "Jarrell", Джон: "John", Джек: "Jack",
  Брайан: "Bryan", Льюис: "Lewis", Ноа: "Noah", Кристофер: "Christopher",
  Энтони: "Anthony", Антони: "Anthony", Александер: "Alexander", Поль: "Paul",
  Сэм: "Sam", Майкл: "Michael",
  // Романские/испанские имена с "х"/"у" на месте неслоговых звуков оригинала.
  Хуан: "Juan", Карлос: "Carlos", Марко: "Marco", Хави: "Javi", Хавьер: "Javier",
  Хосе: "Jose", Хорхе: "Jorge", Алехандро: "Alejandro", Хамза: "Hamza",
  Серхио: "Sergio", Штефан: "Stefan", Жуан: "Joao", Антуан: "Antoine",
  Уго: "Hugo", Йонас: "Jonas", Йенс: "Jens", Пьер: "Pierre", Готье: "Gauthier",
  Венсан: "Vincent", Жуниор: "Junior", Лукаш: "Lukasz", Альфонсо: "Alphonso",
  Юлиан: "Julian", Джуд: "Jude",
  // Частые имена/фамилии, где русский источник передаёт звук нетривиально (h, финальное
  // португальское "o", и т.п.) — добавлены по итогам проверки топ-игроков (overall 86+).
  Гарри: "Harry", Фил: "Phil", Йозуа: "Joshua", Коул: "Cole", Бернарду: "Bernardo",
  Райя: "Raya", Фернандеш: "Fernandes", Рюдигер: "Rudiger", Диаш: "Dias",
  Гимарайнс: "Guimaraes", Зоммер: "Sommer", Тюрам: "Thuram", Араукхо: "Araujo",
  Кунде: "Kounde",
};

function transliterateWord(word) {
  if (GIVEN_NAME_OVERRIDES[word]) return GIVEN_NAME_OVERRIDES[word];
  const lower = word.toLowerCase().replace(/дж/g, ""); // временный маркер для "j"
  let out = "";
  for (const ch of lower) {
    out += ch === "" ? "j" : TRANSLIT[ch] ?? ch;
  }
  if (!out) return out;
  return out[0].toUpperCase() + out.slice(1);
}

/** Транслитерация произвольной кириллической строки, слово за словом (пробелы/дефисы сохраняются). */
function transliterate(text) {
  return text
    .split(/(\s+|-)/)
    .map((part) => (/[а-яёА-ЯЁ]/.test(part) ? transliterateWord(part) : part))
    .join("");
}

// Слитный slug ("vandijk", "debruyne") не содержит границы слов, а автоматическое угадывание
// частиц ("al", "la", "da"...) даёт ложные срабатывания на обычных фамилиях (Alisson -> "Al
// Isson", Lacazette -> "La cazette", Davies -> "Da vies"). Поэтому — явный список, сверенный
// со всеми 1636 slug в players.json (см. аудит в истории задачи): это единственные случаи,
// где реальная фамилия содержит пробел/частицу.
const SURNAME_OVERRIDES = {
  vandijk: "van Dijk",
  terstegen: "ter Stegen",
  debruyne: "De Bruyne",
  dilorenzo: "Di Lorenzo",
  digregorio: "Di Gregorio",
  mctominay: "McTominay",
};

function splitSlugSurname(slug) {
  if (SURNAME_OVERRIDES[slug]) return SURNAME_OVERRIDES[slug];
  return slug[0].toUpperCase() + slug.slice(1);
}

/** slug вида "zenit_zen_01" / содержащий цифры — не фамилия, транслитерацию делаем из кириллицы. */
function looksLikeRealSlug(slug) {
  return /^[a-z]+$/.test(slug) && slug.length >= 3;
}

/** Находит, на каком месте в fullName стоят слова отображаемого имени (p.name) — это НЕ всегда
 * конец строки: у части бразильцев (Алиссон Бекер -> показываем "Алиссон") отображаемое имя —
 * это первое слово, а не фамилия в конце. */
function findNameSpan(fullWords, nameWords) {
  for (let i = 0; i <= fullWords.length - nameWords.length; i++) {
    if (nameWords.every((w, j) => fullWords[i + j] === w)) return i;
  }
  return -1;
}

function buildEnglishNames(p) {
  const fullWords = p.fullName.trim().split(/\s+/);
  const nameWords = p.name.trim().split(/\s+/);

  const nameEn = looksLikeRealSlug(p.slug) ? splitSlugSurname(p.slug) : transliterate(p.name);

  const spanStart = findNameSpan(fullWords, nameWords);
  let fullNameEn;
  if (spanStart === -1) {
    // Отображаемое имя не найдено как подстрока слов в fullName (не ожидается, но на всякий
    // случай) — транслитерируем fullName целиком, не используя nameEn.
    fullNameEn = transliterate(p.fullName);
  } else {
    const spanEnd = spanStart + nameWords.length;
    const parts = [
      ...fullWords.slice(0, spanStart).map((w) => transliterate(w)),
      nameEn,
      ...fullWords.slice(spanEnd).map((w) => transliterate(w)),
    ];
    fullNameEn = parts.join(" ");
  }

  return { nameEn, fullNameEn };
}

// Ручные поправки для самых узнаваемых игроков (Gold/Legend/Icon) — там, где механическая
// транслитерация имени не совпадает с официальным написанием.
const MANUAL_FIXES = {
  mbappe: { name: "Mbappe", fullName: "Kylian Mbappe" },
  debruyne: { name: "De Bruyne", fullName: "Kevin De Bruyne" },
  odegaard: { name: "Odegaard", fullName: "Martin Odegaard" },
  hojlund: { name: "Hojlund", fullName: "Rasmus Hojlund" },
  terstegen: { name: "ter Stegen", fullName: "Marc-Andre ter Stegen" },
  ennesyri: { name: "En-Nesyri", fullName: "Youssef En-Nesyri" },
};

function main() {
  const applyDb = process.argv.includes("--apply-db");
  const players = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf-8"));

  const updates = []; // { club, oldName, newName, newFullName }
  for (const p of players) {
    const fix = MANUAL_FIXES[p.slug];
    const { nameEn, fullNameEn } = fix
      ? { nameEn: fix.name, fullNameEn: fix.fullName }
      : buildEnglishNames(p);
    updates.push({ club: p.club, oldName: p.name, newName: nameEn, newFullName: fullNameEn });
    p.name = nameEn;
    p.fullName = fullNameEn;
  }

  console.log("Пример (первые 20):");
  for (const u of updates.slice(0, 20)) {
    console.log(`  ${u.oldName} -> ${u.newName}  |  ${u.newFullName}`);
  }

  fs.writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2) + "\n", "utf-8");
  console.log(`\nОбновлено players.json: ${players.length} игроков.`);

  if (applyDb) {
    fs.writeFileSync(path.join(__dirname, "_name_updates.json"), JSON.stringify(updates), "utf-8");
    console.log("Список замен сохранён в scripts/_name_updates.json для applyDbUpdates.cjs");
  }
}

main();
