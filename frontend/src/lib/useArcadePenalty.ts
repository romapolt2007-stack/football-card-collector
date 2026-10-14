import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type {
  ArcadeDifficulty,
  ArcadeFreeStatus,
  ArcadeRoundResponse,
  ArcadeStartResponse,
  Card,
  ShootoutPower,
  ShootoutZone,
} from "../types/game";

export function useArcadeFreeStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["arcade-penalty-free"],
    queryFn: () => api.get<ArcadeFreeStatus>("/api/arcade/penalty/free-status"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
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

export function useStartArcadePenalty() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { difficulty: ArcadeDifficulty; free?: boolean }) =>
      api.post<ArcadeStartResponse>("/api/arcade/penalty/start", input),
    onSuccess: (_result, input) => {
      if (input.free) {
        queryClient.invalidateQueries({ queryKey: ["arcade-penalty-free"] });
      } else if (user) {
        setUser({ ...user, coins: user.coins - 200 });
      }
    },
  });
}

export function useArcadePenaltyRound() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { draftId: string; kickZone: ShootoutZone; kickPower: ShootoutPower; saveZone: ShootoutZone }) =>
      api.post<ArcadeRoundResponse>(`/api/arcade/penalty/${input.draftId}/round`, {
        kickZone: input.kickZone,
        kickPower: input.kickPower,
        saveZone: input.saveZone,
      }),
    onSuccess: (response) => {
      if (!response.finished || !response.result) return;
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
