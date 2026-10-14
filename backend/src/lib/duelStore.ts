import { randomUUID } from "node:crypto";
import type { RoundOutcome } from "./shootout.js";

export interface DuelSession {
  draftId: string;
  userId: string;
  opponentName: string;
  opponentOvr: number;
  opponentUserId: string | null;
  opponentPoints: number;
  isRealOpponent: boolean;
  userGkOverall: number;
  selfPoints: number;
  userScore: number;
  oppScore: number;
  round: number;
  rounds: RoundOutcome[];
  createdAt: number;
}

const sessions = new Map<string, DuelSession>();
const TTL_MS = 15 * 60 * 1000;

export function createDuelSession(
  data: Omit<DuelSession, "draftId" | "userScore" | "oppScore" | "round" | "rounds" | "createdAt">,
): DuelSession {
  const draftId = randomUUID();
  const session: DuelSession = { ...data, draftId, userScore: 0, oppScore: 0, round: 1, rounds: [], createdAt: Date.now() };
  sessions.set(draftId, session);
  return session;
}

export function getDuelSession(draftId: string, userId: string): DuelSession | null {
  const session = sessions.get(draftId);
  if (!session || session.userId !== userId) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(draftId);
    return null;
  }
  return session;
}

export function deleteDuelSession(draftId: string): void {
  sessions.delete(draftId);
}

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);
sweepTimer.unref();
