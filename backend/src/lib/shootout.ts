/**
 * Серия послематчевых пенальти: игрок за каждый раунд выбирает ОДНОВРЕМЕННО
 * зону/силу своего удара (атака по воротам соперника) и зону прыжка вратаря
 * (защита своих ворот от удара бота) — сервер считает оба исхода за один
 * раунд, не раскрывая "угадал ли вратарь" до совершения удара.
 */
export type ShootoutPower = "WEAK" | "MEDIUM" | "STRONG";

const ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isValidZone(zone: unknown): zone is number {
  return typeof zone === "number" && ZONES.includes(zone as (typeof ZONES)[number]);
}

export function isValidPower(power: unknown): power is ShootoutPower {
  return power === "WEAK" || power === "MEDIUM" || power === "STRONG";
}

const ON_TARGET_CHANCE: Record<ShootoutPower, number> = { WEAK: 0.96, MEDIUM: 0.87, STRONG: 0.68 };
/** Шанс всё равно забить, даже если вратарь прыгнул в ту же зону — чем сильнее удар, тем он опаснее. */
const BEATS_RIGHT_GUESS: Record<ShootoutPower, number> = { WEAK: 0.15, MEDIUM: 0.35, STRONG: 0.6 };

/** Углы чуть вероятнее центра — как в настоящих пенальти. */
function weightedZone(): number {
  const weights = [3, 2, 3, 2, 1, 2, 3, 2, 3];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < 9; i++) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 9;
}

function powerForOvr(ovr: number): ShootoutPower {
  if (ovr >= 85) return "STRONG";
  if (ovr >= 72) return "MEDIUM";
  return "WEAK";
}

export interface RoundInput {
  kickZone: number;
  kickPower: ShootoutPower;
  saveZone: number;
  opponentOvr: number;
  userGkOverall: number;
}

export interface RoundOutcome {
  userShotOnTarget: boolean;
  userScored: boolean;
  botDiveZone: number;
  botShotZone: number;
  botShotPower: ShootoutPower;
  botOnTarget: boolean;
  userSaved: boolean;
  userConceded: boolean;
}

export function resolveRound(input: RoundInput): RoundOutcome {
  const { kickZone, kickPower, saveZone, opponentOvr, userGkOverall } = input;

  const userShotOnTarget = Math.random() < ON_TARGET_CHANCE[kickPower];
  const botDiveZone = weightedZone();
  let userScored = false;
  if (userShotOnTarget) {
    userScored = botDiveZone === kickZone ? Math.random() < BEATS_RIGHT_GUESS[kickPower] : true;
  }

  const botShotPower = powerForOvr(opponentOvr);
  const botOnTarget = Math.random() < ON_TARGET_CHANCE[botShotPower] * 0.97;
  const botShotZone = weightedZone();
  let userSaved = false;
  let userConceded = false;
  if (botOnTarget) {
    if (saveZone === botShotZone) {
      const saveChance = clamp(0.3 + (userGkOverall - 60) / 100 - BEATS_RIGHT_GUESS[botShotPower] * 0.4, 0.15, 0.85);
      userSaved = Math.random() < saveChance;
      userConceded = !userSaved;
    } else {
      userConceded = true;
    }
  }

  return { userShotOnTarget, userScored, botDiveZone, botShotZone, botShotPower, botOnTarget, userSaved, userConceded };
}

const REGULATION_ROUNDS = 5;

/** Правило досрочной победы: когда разрыв больше, чем оставшиеся удары соперника. */
export function isShootoutDecided(userScore: number, oppScore: number, roundJustPlayed: number): boolean {
  if (roundJustPlayed >= REGULATION_ROUNDS) return userScore !== oppScore;
  const remaining = REGULATION_ROUNDS - roundJustPlayed;
  return userScore > oppScore + remaining || oppScore > userScore + remaining;
}

export { REGULATION_ROUNDS };
