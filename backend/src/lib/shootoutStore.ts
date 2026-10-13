import { randomUUID } from "node:crypto";
import type { MatchEvent, MatchStats } from "./matchSimulation.js";
import type { RoundOutcome } from "./shootout.js";

export interface ShootoutSession {
  draftId: string;
  userId: string;
  opponentName: string;
  opponentOvr: number;
  userGkOverall: number;
  squad: { strength: number; avgOvr: number; chemistry: number };
  ninetyMin: { userScore: number; oppScore: number; events: MatchEvent[]; stats: MatchStats };
  starterCardIds: string[];
  benchCardIds: string[];
  userScore: number;
  oppScore: number;
  round: number;
  rounds: RoundOutcome[];
  createdAt: number;
}

const sessions = new Map<string, ShootoutSession>();
const TTL_MS = 15 * 60 * 1000;

export function createShootoutSession(
  data: Omit<ShootoutSession, "draftId" | "userScore" | "oppScore" | "round" | "rounds" | "createdAt">,
): ShootoutSession {
  const draftId = randomUUID();
  const session: ShootoutSession = { ...data, draftId, userScore: 0, oppScore: 0, round: 1, rounds: [], createdAt: Date.now() };
  sessions.set(draftId, session);
  return session;
}

export function getShootoutSession(draftId: string, userId: string): ShootoutSession | null {
  const session = sessions.get(draftId);
  if (!session || session.userId !== userId) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(draftId);
    return null;
  }
  return session;
}

export function deleteShootoutSession(draftId: string): void {
  sessions.delete(draftId);
}

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);
sweepTimer.unref();
