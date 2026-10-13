import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, FreeBonusClaimResult } from "../types/game";

interface FreeBonusStatus {
  ready: boolean;
  msLeft: number;
  intervalMs: number;
}

export function useFreeBonusStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["free-bonus"],
    queryFn: () => api.get<FreeBonusStatus>("/api/user/free-bonus"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  // локальный тикающий countdown между запросами к серверу
  const [msLeft, setMsLeft] = useState(query.data?.msLeft ?? 0);

  useEffect(() => {
    if (query.data) setMsLeft(query.data.msLeft);
  }, [query.data]);

  useEffect(() => {
    if (msLeft <= 0) return;
    const timer = setInterval(() => setMsLeft((v) => Math.max(0, v - 1000)), 1000);
    return () => clearInterval(timer);
  }, [msLeft]);

  return { ...query, msLeft, ready: query.data ? msLeft <= 0 : false };
}

export function useClaimFreeBonus() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<FreeBonusClaimResult>("/api/user/free-bonus"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      if (result.prize.cards.length > 0) {
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [...result.prize.cards, ...(prev ?? [])]);
      }
      queryClient.setQueryData<FreeBonusStatus>(["free-bonus"], {
        ready: false,
        msLeft: result.intervalMs,
        intervalMs: result.intervalMs,
      });
    },
  });
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
