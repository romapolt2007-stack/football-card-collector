export interface MatchEvent {
  minute: number;
  type: "GOAL" | "POST" | "SAVE" | "YELLOW" | "RED" | "INJURY";
  team: "user" | "opponent";
  /** Только для дисциплинарных событий своей команды — нужно для применения последствий. */
  cardId?: string;
  playerName?: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  corners: [number, number];
  xg: [number, number];
}

export interface MatchResult {
  userScore: number;
  oppScore: number;
  events: MatchEvent[];
  stats: MatchStats;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BOT_PREFIXES = ["Теневой", "Стальной", "Ночной", "Грозовой", "Железный", "Дикий", "Быстрый"];
const BOT_SUFFIXES = ["Клуб", "Юнайтед", "Роверс", "Атлетик", "Спортинг"];

export function generateBotName(): string {
  return `${BOT_PREFIXES[randInt(0, BOT_PREFIXES.length - 1)]} ${BOT_SUFFIXES[randInt(0, BOT_SUFFIXES.length - 1)]}`;
}

/** OVR бота привязан к силе игрока ± разброс — чтобы матч был примерно по силам. */
export function generateBotOvr(userStrength: number): number {
  return clamp(Math.round(userStrength + randInt(-6, 6)), 40, 99);
}

export function simulateMatch(userStrength: number, opponentOvr: number): MatchResult {
  const diff = userStrength - opponentOvr;
  const userXg = clamp(1.3 + diff / 15, 0.3, 4.5);
  const oppXg = clamp(1.3 - diff / 15, 0.3, 4.5);

  const events: MatchEvent[] = [];
  let userScore = 0;
  let oppScore = 0;

  for (let minute = 1; minute <= 90; minute++) {
    if (Math.random() < userXg / 90) {
      userScore++;
      events.push({ minute, type: "GOAL", team: "user" });
    }
    if (Math.random() < oppXg / 90) {
      oppScore++;
      events.push({ minute, type: "GOAL", team: "opponent" });
    }
  }

  const flavorCount = randInt(2, 5);
  for (let i = 0; i < flavorCount; i++) {
    events.push({
      minute: randInt(1, 90),
      type: Math.random() < 0.5 ? "POST" : "SAVE",
      team: Math.random() < 0.5 ? "user" : "opponent",
    });
  }
  events.sort((a, b) => a.minute - b.minute);

  const possessionUser = clamp(Math.round(50 + diff * 1.5), 30, 70);
  const shotsUser = Math.max(userScore, Math.round(userXg * 2.5 + randInt(0, 3)));
  const shotsOpp = Math.max(oppScore, Math.round(oppXg * 2.5 + randInt(0, 3)));

  return {
    userScore,
    oppScore,
    events,
    stats: {
      possession: [possessionUser, 100 - possessionUser],
      shots: [shotsUser, shotsOpp],
      corners: [randInt(1, 8), randInt(1, 8)],
      xg: [Math.round(userXg * 10) / 10, Math.round(oppXg * 10) / 10],
    },
  };
}

export interface DisciplineCandidate {
  cardId: string;
  name: string;
}

/**
 * Жёлтые/красные карточки и травмы — независимые редкие броски по
 * стартовому составу пользователя (+ флейвор-события у соперника без
 * игровых последствий, у бота нет настоящих карточек игроков).
 */
export function rollDisciplineEvents(userStarters: DisciplineCandidate[]): MatchEvent[] {
  const events: MatchEvent[] = [];

  for (const p of userStarters) {
    if (Math.random() < 0.05) {
      events.push({ minute: randInt(8, 88), type: "YELLOW", team: "user", cardId: p.cardId, playerName: p.name });
    }
  }

  if (userStarters.length > 0 && Math.random() < 0.035) {
    const p = userStarters[randInt(0, userStarters.length - 1)];
    events.push({ minute: randInt(10, 88), type: "RED", team: "user", cardId: p.cardId, playerName: p.name });
  }

  if (userStarters.length > 0 && Math.random() < 0.04) {
    const p = userStarters[randInt(0, userStarters.length - 1)];
    events.push({ minute: randInt(5, 85), type: "INJURY", team: "user", cardId: p.cardId, playerName: p.name });
  }

  if (Math.random() < 0.12) {
    events.push({ minute: randInt(8, 88), type: Math.random() < 0.75 ? "YELLOW" : "RED", team: "opponent" });
  }

  return events;
}

export interface MatchRewards {
  coins: number;
  xp: number;
  cardRarityFloor: "BRONZE" | null;
}

export function calcRewards(userScore: number, oppScore: number): MatchRewards {
  if (userScore > oppScore) return { coins: randInt(2000, 5000), xp: 150, cardRarityFloor: "BRONZE" };
  if (userScore === oppScore) return { coins: randInt(500, 1500), xp: 70, cardRarityFloor: Math.random() < 0.5 ? "BRONZE" : null };
  return { coins: randInt(200, 500), xp: 30, cardRarityFloor: null };
}
