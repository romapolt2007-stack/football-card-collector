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

export interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
  openedYear: number;
  rarity: Rarity;
  club: Club;
}

export interface StadiumCard {
  id: string;
  stadiumId: string;
  ownerId: string;
  isListed: boolean;
  quickSellPrice: number;
  obtainedAt: string;
  stadium: Stadium;
}

export interface GameUser {
  id: string;
  tgId: string;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
  avatarIcon: string | null;
  coins: number;
  dailyStreak: number;
  lastDailyClaimAt: string | null;
  lastFreeSpinAt: string | null;
  lastFreeStadiumSpinAt: string | null;
  createdAt: string;
}

export interface MarketBid {
  id: string;
  amount: number;
  createdAt: string;
  bidder: { id: string; username: string | null; firstName: string | null };
}

export interface Listing {
  id: string;
  cardId: string | null;
  stadiumCardId: string | null;
  sellerId: string;
  price: number;
  buyNowPrice: number | null;
  status: "ACTIVE" | "SOLD" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  card: Card | null;
  stadiumCard: StadiumCard | null;
  seller: { id: string; username: string | null; firstName: string | null };
  bids: MarketBid[];
  avgSalePrice: number | null;
}

export interface MarketHistoryEntry {
  id: string;
  type: "MARKET_BUY" | "MARKET_SELL";
  amount: number;
  createdAt: string;
  itemName: string | null;
  rarity: Rarity | null;
}

export interface SpinStatus {
  ready: boolean;
  msLeft: number;
  hotStreak?: number;
  hotStreakMax?: number;
}

export interface PlayerSpinStatus {
  coins: number;
  minCost: number;
  maxCost: number;
  level: number;
  hotStreak: number;
  hotStreakThreshold: number;
}

export interface PlayerSpinResult {
  player: Player;
  rarity: Rarity;
  estimatedValue: number;
  sellPrice: number;
  level?: number;
  hotStreak?: number;
  hotStreakThreshold?: number;
  wasGuaranteedTop?: boolean;
  coins?: number;
}

export interface SpinFiltersWithAmount extends SpinFilters {
  amount: number;
}

export interface StadiumBuff {
  topTierWeightBonus: number;
  extraListingSlots: number;
  bestRarity: Rarity | null;
}

export interface RelicStatus {
  relicCount: number;
  pending: number;
  perCardPerDay: number;
}

export interface LeagueTrend {
  leagueId: string;
  leagueName: string;
  multiplier: number;
  changePct: number;
}

export interface StadiumSpinResult {
  stadium: Stadium;
  rarity: Rarity;
  estimatedValue: number;
  sellPrice: number;
}

export interface DailyStatus {
  ready: boolean;
  streak: number;
}

export interface DailyClaimResult {
  coins: number;
  streak: number;
  reward: number;
}

export interface LeagueWithClubs extends League {
  clubs: { id: string; name: string; shortName: string; colorPrimary: string; colorSecondary: string }[];
}

export interface NationOption {
  nation: string;
  flag: string;
}

export interface SpinFilters {
  leagueId?: string;
  clubId?: string;
  nation?: string;
}

export interface SpinOdds {
  amount: number;
  minCost: number;
  maxCost: number;
  percentages: Record<Rarity, number>;
}
