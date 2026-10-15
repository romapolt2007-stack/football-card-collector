import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, CupFreeStatus, CupRoundResponse, CupStartResponse } from "../types/game";

export function useCupFreeStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["cup-free"],
    queryFn: () => api.get<CupFreeStatus>("/api/cup/free-status"),
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

export function useStartCup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<CupStartResponse>("/api/cup/start", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-free"] });
    },
  });
}

export function useCupRound() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (draftId: string) => api.post<CupRoundResponse>(`/api/cup/${draftId}/round`, {}),
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
