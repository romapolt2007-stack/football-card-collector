import { randomUUID } from "node:crypto";
import type { TournamentRoundIndex } from "./globalTournament.js";

export interface TournamentSession {
  draftId: string;
  userId: string;
  strength: number;
  round: TournamentRoundIndex;
  createdAt: number;
}

const sessions = new Map<string, TournamentSession>();
const TTL_MS = 20 * 60 * 1000;

export function createTournamentSession(data: Omit<TournamentSession, "draftId" | "round" | "createdAt">): TournamentSession {
  const draftId = randomUUID();
  const session: TournamentSession = { ...data, draftId, round: 0, createdAt: Date.now() };
  sessions.set(draftId, session);
  return session;
}

export function getTournamentSession(draftId: string, userId: string): TournamentSession | null {
  const session = sessions.get(draftId);
  if (!session || session.userId !== userId) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(draftId);
    return null;
  }
  return session;
}

export function deleteTournamentSession(draftId: string): void {
  sessions.delete(draftId);
}

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);
sweepTimer.unref();
