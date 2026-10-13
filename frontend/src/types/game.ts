export type Rarity = "BRONZE" | "SILVER" | "GOLD" | "LEGEND" | "ICON";

export type Position = "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LW" | "RW" | "ST" | "CF";

export interface League {
  id: string;
  name: string;
  order: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  colorPrimary: string;
  colorSecondary: string;
  league: League;
}

export interface Player {
  id: string;
  name: string;
  fullName: string;
  photoUrl: string | null;
  nation: string;
  nationFlag: string;
  position: Position;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  age: number;
  height: number;
  foot: "LEFT" | "RIGHT";
  weakFoot: number;
  skillMoves: number;
  rarity: Rarity;
  club: Club;
}

export interface Card {
  id: string;
  playerId: string;
  ownerId: string;
  rarity: Rarity;
  isListed: boolean;
  quickSellPrice: number;
  obtainedAt: string;
  player: Player;
}

export interface GameUser {
  id: string;
  tgId: string;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
  coins: number;
  stars: number;
  xp: number;
  level: number;
  isVip: boolean;
  hasClaimedStarter: boolean;
  referralCode: string;
  dailyStreak: number;
  lastDailyClaimAt: string | null;
}

export type Formation = "4-4-2" | "4-3-3" | "3-5-2" | "4-2-3-1" | "5-3-2";

export interface SquadSlot {
  slotId: string;
  cardId: string | null;
}

export interface Squad {
  id: string;
  userId: string;
  name: string;
  formation: Formation;
  slots: SquadSlot[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvent {
  minute: number;
  type: "GOAL" | "POST" | "SAVE";
  team: "user" | "opponent";
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  corners: [number, number];
  xg: [number, number];
}

export interface MatchRewards {
  coins: number;
  xp: number;
  cardRarityFloor: Rarity | null;
  cardId: string | null;
}

export interface MatchRecord {
  id: string;
  mode: "QUICK" | "DIVISION_RIVALS" | "TOURNAMENT" | "DRAFT";
  opponentName: string;
  opponentOvr: number;
  userScore: number;
  oppScore: number;
  events: MatchEvent[];
  rewards: MatchRewards;
  createdAt: string;
}

export interface QuickMatchResult {
  match: MatchRecord;
  stats: MatchStats;
  squad: { strength: number; avgOvr: number; chemistry: number };
  coins: number;
  xp: number;
  level: number;
  wonCard: Card | null;
}

export type CasePrizeType = "CARD" | "COINS" | "JACKPOT";

export interface CasePrizeDef {
  type: CasePrizeType;
  weight: number;
  rarity?: Rarity;
  coinsMin?: number;
  coinsMax?: number;
  jackpotMultiplier?: number;
}

export interface CaseDef {
  id: string;
  title: string;
  priceCoins: number;
  prizes: CasePrizeDef[];
}

export interface CasePrize {
  type: CasePrizeType;
  coins: number;
  card: Card | null;
}

export interface CaseSpinResult {
  prize: CasePrize;
  coins: number;
}

export interface Listing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  status: "ACTIVE" | "SOLD" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  card: Card;
  seller: { id: string; username: string | null; firstName: string | null };
}

export interface QuestDef {
  id: string;
  code: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  isDaily: boolean;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  expiresAt: string;
  quest: QuestDef;
}

export interface PackDef {
  id: string;
  title: string;
  priceCoins: number;
  cardCount: number;
  minRarity: Rarity;
  bonusChance: number;
  isStarter?: boolean;
}
