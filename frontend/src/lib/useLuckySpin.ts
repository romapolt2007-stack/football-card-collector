import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, EmergencyBonusStatus, LuckySpinResult, StakeTier } from "../types/game";

export function useStakeTiers() {
  return useQuery({
    queryKey: ["lucky-spin-tiers"],
    queryFn: () => api.get<{ tiers: StakeTier[] }>("/api/lucky-spin").then((r) => r.tiers),
  });
}

export function useLuckySpin() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (stake: number) => api.post<LuckySpinResult>("/api/lucky-spin/spin", { stake }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.card, ...(prev ?? [])]);
    },
  });
}

export function useEmergencyBonusStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["emergency-bonus"],
    queryFn: () => api.get<EmergencyBonusStatus>("/api/user/emergency-bonus"),
    enabled: Boolean(token),
    refetchInterval: 15_000,
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

  return { ...query, msLeft, ready: query.data ? query.data.eligible && msLeft <= 0 : false };
}

export function useClaimEmergencyBonus() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<{ coins: number; reward: number }>("/api/user/emergency-bonus"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.invalidateQueries({ queryKey: ["emergency-bonus"] });
    },
  });
}
