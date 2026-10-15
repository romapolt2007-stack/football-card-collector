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
  unavailableMatches: number;
  trainingBoost: number;
  academyEnrolledAt: string | null;
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
  referredBy: string | null;
  dailyStreak: number;
  lastDailyClaimAt: string | null;
  teamName: string | null;
  teamLogo: string | null;
  teamColors: string | null;
  avatarIcon: string | null;
  cosmeticPatchId: string | null;
  energy: number;
  energyUpdatedAt: string;
  createdAt: string;
}

export type DuelLeague = "BRONZE" | "SILVER" | "GOLD" | "CHAMPION";

export interface DuelStatus {
  energy: number;
  energyUpdatedAt: string;
  energyMax: number;
  energyCost: number;
  league: DuelLeague;
  leagueLabel: string;
  points: number;
  wins: number;
  losses: number;
}

export interface DuelFindResponse {
  draftId: string;
  opponentName: string;
  opponentOvr: number;
  isRealOpponent: boolean;
  energy: number;
}

export interface DuelResult {
  won: boolean;
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
  pointsDelta: number;
  points: number;
  league: DuelLeague;
  leagueLabel: string;
  opponentName: string;
  isRealOpponent: boolean;
  duelMatchId: string;
}

export const DUEL_EMOTES = ["🎉", "😎", "🔥", "💪", "😤", "🤝", "😢", "🫡"] as const;

export interface DuelRoundResponse {
  outcome: ShootoutRoundOutcome;
  userScore: number;
  oppScore: number;
  round: number;
  finished: boolean;
  result?: DuelResult;
}

export interface PenaltyTierInfo {
  tier: number;
  tierLabel: string | null;
  nextThreshold: number | null;
}

export interface UserStats {
  totalMatches: number;
  wins: number;
  winRate: number;
  totalGoals: number;
  totalCards: number;
  squadValue: number;
  marketSales: number;
  daysPlayed: number;
  bestCard: Card | null;
  penaltyGoals: number;
  penaltySaves: number;
  penaltySniperTier: PenaltyTierInfo;
  penaltyWallTier: PenaltyTierInfo;
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
  type: "GOAL" | "POST" | "SAVE" | "YELLOW" | "RED" | "INJURY" | "VAR";
  team: "user" | "opponent";
  cardId?: string;
  playerName?: string;
  varOutcome?: "disallowed" | "confirmed";
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

export interface ShootoutSummary {
  userScore: number;
  oppScore: number;
  rounds?: unknown[];
  won?: boolean;
}

export type CareerLeague = "BRONZE" | "SILVER" | "GOLD" | "CHAMPION";

export interface CareerResult {
  points: number;
  league: CareerLeague;
  pointsDelta: number;
}

export interface CareerStatus {
  league: CareerLeague;
  leagueLabel: string;
  points: number;
  wins: number;
  losses: number;
}

export interface FlashChallengeStatus {
  code: string;
  title: string;
  description: string;
  rewardCoins: number;
  claimed: boolean;
  msLeft: number;
}

export interface FlashChallengeClaim {
  claimed: boolean;
  code: string;
  title: string;
  rewardCoins: number;
}

export interface WeatherDef {
  code: string;
  label: string;
  emoji: string;
  goalMultiplier: number;
}

export interface QuickMatchResult {
  match: MatchRecord;
  stats: MatchStats;
  squad: { strength: number; avgOvr: number; chemistry: number };
  coins: number;
  xp: number;
  level: number;
  wonCard: Card | null;
  shootout: ShootoutSummary | null;
  weather: WeatherDef;
  career: CareerResult;
  flashChallenge: FlashChallengeClaim | null;
}

export interface ShootoutPending {
  needsShootout: true;
  draftId: string;
  ninetyMin: { userScore: number; oppScore: number; events: MatchEvent[]; stats: MatchStats };
  opponentName: string;
  opponentOvr: number;
  squad: { strength: number; avgOvr: number; chemistry: number };
  weather: WeatherDef;
}

export type QuickMatchResponse = QuickMatchResult | ShootoutPending;

export type ShootoutZone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ShootoutPower = "WEAK" | "MEDIUM" | "STRONG";

export interface ShootoutRoundOutcome {
  userShotOnTarget: boolean;
  userScored: boolean;
  botDiveZone: ShootoutZone;
  botShotZone: ShootoutZone;
  botShotPower: ShootoutPower;
  botOnTarget: boolean;
  userSaved: boolean;
  userConceded: boolean;
}

export interface ShootoutRoundResponse {
  outcome: ShootoutRoundOutcome;
  userScore: number;
  oppScore: number;
  round: number;
  finished: boolean;
  result?: QuickMatchResult;
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

export interface MarketBid {
  id: string;
  amount: number;
  createdAt: string;
  bidder: { id: string; username: string | null; firstName: string | null };
}

export interface Listing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  buyNowPrice: number | null;
  status: "ACTIVE" | "SOLD" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  card: Card;
  seller: { id: string; username: string | null; firstName: string | null };
  bids: MarketBid[];
}

export interface MarketTrend {
  rarity: Rarity;
  recentAvg: number;
  changePct: number;
}

export interface PlayerTrend {
  playerId: string;
  name: string;
  nationFlag: string;
  overall: number;
  recentAvg: number;
  changePct: number;
}

export interface MarketHistoryEntry {
  id: string;
  type: "MARKET_BUY" | "MARKET_SELL";
  amount: number;
  createdAt: string;
  playerName: string | null;
  rarity: Rarity | null;
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

export type FreeBonusPrizeType = "COINS" | "CARD" | "PACK";

export interface FreeBonusPrize {
  type: FreeBonusPrizeType;
  coins: number;
  cards: Card[];
}

export interface FreeBonusClaimResult {
  coins: number;
  prize: FreeBonusPrize;
  intervalMs: number;
}

export interface LuckySpinMeta {
  minStake: number;
  maxStake: number;
  step: number;
  minWeights: Record<Rarity, number>;
  maxWeights: Record<Rarity, number>;
}

export interface LuckySpinResult {
  card: Card;
  coins: number;
  spinNumber: number;
  wasPity: boolean;
  free: boolean;
}

export interface FreeLuckySpinStatus {
  ready: boolean;
  msLeft: number;
  intervalMs: number;
  stakeEquivalent: number;
}

export interface EmergencyBonusStatus {
  eligible: boolean;
  ready: boolean;
  msLeft: number;
  intervalMs: number;
  threshold: number;
  reward: number;
}

export interface PackDef {
  id: string;
  title: string;
  priceCoins: number;
  effectivePrice: number;
  cardCount: number;
  minRarity: Rarity;
  bonusChance: number;
  isStarter?: boolean;
}

export interface SbcReward {
  coins?: number;
  xp?: number;
  guaranteedRarity?: Rarity;
}

export interface SbcDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  count: number;
  minRarity?: Rarity;
  minOverallSum?: number;
  sameClub?: boolean;
  distinctNations?: boolean;
  reward: SbcReward;
  repeatable: boolean;
}

export interface SbcSubmitResult {
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
  consumedCardIds: string[];
}

export interface CosmeticPatchDef {
  id: string;
  title: string;
  author: string;
  sizeLabel: string;
  description: string;
  accentColor: string;
}

export type ArcadeDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface ArcadeFreeStatus {
  ready: boolean;
  msLeft: number;
  intervalMs: number;
  paidCost: number;
}

export interface ArcadeStartResponse {
  draftId: string;
  opponentOvr: number;
  difficulty: ArcadeDifficulty;
}

export interface ArcadeResult {
  won: boolean;
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
}

export interface ArcadeRoundResponse {
  outcome: ShootoutRoundOutcome;
  userScore: number;
  oppScore: number;
  round: number;
  finished: boolean;
  result?: ArcadeResult;
}

export interface CupFreeStatus {
  ready: boolean;
  msLeft: number;
  intervalMs: number;
}

export interface CupStartResponse {
  draftId: string;
  round: number;
  roundLabel: string;
  strength: number;
}

export interface CupRoundResult {
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
}

export interface CupRoundResponse {
  userScore: number;
  oppScore: number;
  opponentName: string;
  opponentOvr: number;
  won: boolean;
  roundLabel: string;
  finished: boolean;
  champion: boolean;
  nextRound: { round: number; label: string } | null;
  result: CupRoundResult;
}

export interface WorldTourStageInfo {
  city: string;
  rewardCoins: number;
  guaranteedRarity: Rarity | null;
  status: "done" | "current" | "locked";
}

export interface WorldTourStatus {
  stage: number;
  totalStages: number;
  completed: boolean;
  stages: WorldTourStageInfo[];
}

export interface WorldTourPlayResult {
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
}

export interface WorldTourPlayResponse {
  userScore: number;
  oppScore: number;
  opponentName: string;
  opponentOvr: number;
  won: boolean;
  city: string;
  tourCompleted: boolean;
  nextCity: string | null;
  result: WorldTourPlayResult;
}
