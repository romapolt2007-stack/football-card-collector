import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card } from "../types/game";

export interface TournamentFreeStatus {
  ready: boolean;
  msLeft: number;
  intervalMs: number;
  bracketSize: number;
}

export interface TournamentStartResponse {
  draftId: string;
  round: number;
  roundLabel: string;
  bracketSize: number;
  strength: number;
}

export interface TournamentRoundResult {
  rewardCoins: number;
  rewardXp: number;
  coins: number;
  xp: number;
  level: number;
  levelUpReward: number;
  grantedCard: Card | null;
}

export interface TournamentRoundResponse {
  userScore: number;
  oppScore: number;
  opponentName: string;
  opponentOvr: number;
  won: boolean;
  roundLabel: string;
  finished: boolean;
  champion: boolean;
  nextRound: { round: number; label: string } | null;
  result: TournamentRoundResult;
}

export function useTournamentFreeStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["tournament-free"],
    queryFn: () => api.get<TournamentFreeStatus>("/api/global-tournament/free-status"),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const [msLeft, setMsLeft] = useState(query.data?.msLeft ?? 0);
  useEffect(() => {
    if (query.data) setMsLeft(query.data.msLeft);
  }, [query.data]);
  useEffect(() => {
    if (msLeft <= 0) return;
    const timer = setInterval(() => setMsLeft((v) => Math.max(0, v - 1000)), 1000);
    return () => clearInterval(timer);
  }, [msLeft]);

  return { ...query, msLeft, ready: query.data ? query.data.ready && msLeft <= 0 : false };
}

export function useStartTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<TournamentStartResponse>("/api/global-tournament/start", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-free"] });
    },
  });
}

export function useTournamentRound() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (draftId: string) => api.post<TournamentRoundResponse>(`/api/global-tournament/${draftId}/round`, {}),
    onSuccess: (response) => {
      if (user) {
        setUser({ ...user, coins: response.result.coins, xp: response.result.xp, level: response.result.level });
      }
      if (response.result.grantedCard) {
        const card = response.result.grantedCard;
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [card, ...(prev ?? [])]);
      }
    },
  });
}
