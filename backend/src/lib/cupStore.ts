import { randomUUID } from "node:crypto";
import type { CupRoundIndex } from "./cup.js";

export interface CupSession {
  draftId: string;
  userId: string;
  strength: number;
  avgOvr: number;
  chemistry: number;
  round: CupRoundIndex;
  wins: number;
  createdAt: number;
}

const sessions = new Map<string, CupSession>();
const TTL_MS = 15 * 60 * 1000;

export function createCupSession(data: Omit<CupSession, "draftId" | "round" | "wins" | "createdAt">): CupSession {
  const draftId = randomUUID();
  const session: CupSession = { ...data, draftId, round: 0, wins: 0, createdAt: Date.now() };
  sessions.set(draftId, session);
  return session;
}

export function getCupSession(draftId: string, userId: string): CupSession | null {
  const session = sessions.get(draftId);
  if (!session || session.userId !== userId) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(draftId);
    return null;
  }
  return session;
}

export function deleteCupSession(draftId: string): void {
  sessions.delete(draftId);
}

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);
sweepTimer.unref();
