import { randomUUID } from "node:crypto";
import type { RoundOutcome } from "./shootout.js";

/**
 * Аркадная серия пенальти — отдельная от послематчевой серии «Удачи»:
 * доступна в любое время (не только после ничьей), с выбором сложности
 * соперника вместо реального состава бота.
 */
export type ArcadeDifficulty = "EASY" | "MEDIUM" | "HARD";

const DIFFICULTY_OVR: Record<ArcadeDifficulty, number> = { EASY: 62, MEDIUM: 76, HARD: 90 };
export const DIFFICULTY_LABEL: Record<ArcadeDifficulty, string> = {
  EASY: "Лёгкий",
  MEDIUM: "Средний",
  HARD: "Сложный",
};
export const ARCADE_PAID_COST = 200;

export function difficultyOvr(d: ArcadeDifficulty): number {
  return DIFFICULTY_OVR[d];
}

export function isValidDifficulty(d: unknown): d is ArcadeDifficulty {
  return d === "EASY" || d === "MEDIUM" || d === "HARD";
}

export interface ArcadeSession {
  draftId: string;
  userId: string;
  difficulty: ArcadeDifficulty;
  opponentOvr: number;
  userGkOverall: number;
  userScore: number;
  oppScore: number;
  round: number;
  rounds: RoundOutcome[];
  createdAt: number;
}

const sessions = new Map<string, ArcadeSession>();
const TTL_MS = 15 * 60 * 1000;

export function createArcadeSession(
  data: Omit<ArcadeSession, "draftId" | "userScore" | "oppScore" | "round" | "rounds" | "createdAt">,
): ArcadeSession {
  const draftId = randomUUID();
  const session: ArcadeSession = { ...data, draftId, userScore: 0, oppScore: 0, round: 1, rounds: [], createdAt: Date.now() };
  sessions.set(draftId, session);
  return session;
}

export function getArcadeSession(draftId: string, userId: string): ArcadeSession | null {
  const session = sessions.get(draftId);
  if (!session || session.userId !== userId) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(draftId);
    return null;
  }
  return session;
}

export function deleteArcadeSession(draftId: string): void {
  sessions.delete(draftId);
}

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);
sweepTimer.unref();

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface ArcadeRewards {
  coins: number;
  xp: number;
  /** Шанс на бонусную бронзовую карту при победе. */
  bonusCardChance: number;
}

/** Награды заметно скромнее быстрого матча — режим бесплатный раз в сутки и доступен без ограничений за монеты. */
export function calcArcadeRewards(won: boolean): ArcadeRewards {
  if (won) return { coins: randInt(300, 800), xp: 40, bonusCardChance: 0.15 };
  return { coins: randInt(50, 150), xp: 10, bonusCardChance: 0 };
}
