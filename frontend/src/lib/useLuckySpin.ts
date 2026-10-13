import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, EmergencyBonusStatus, FreeLuckySpinStatus, LuckySpinMeta, LuckySpinResult, Rarity } from "../types/game";

export function useLuckySpinMeta() {
  return useQuery({
    queryKey: ["lucky-spin-meta"],
    queryFn: () => api.get<LuckySpinMeta>("/api/lucky-spin"),
  });
}

/** Та же линейная интерполяция, что в backend/src/lib/luckySpin.ts — для живого превью шансов. */
export function weightsForStake(meta: LuckySpinMeta, stake: number): Record<Rarity, number> {
  const t = Math.max(0, Math.min(1, (stake - meta.minStake) / (meta.maxStake - meta.minStake)));
  const result = {} as Record<Rarity, number>;
  (Object.keys(meta.minWeights) as Rarity[]).forEach((rarity) => {
    result[rarity] = meta.minWeights[rarity] + (meta.maxWeights[rarity] - meta.minWeights[rarity]) * t;
  });
  return result;
}

export function useLuckySpin() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { stake: number } | { free: true }) =>
      api.post<LuckySpinResult>("/api/lucky-spin/spin", input),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.card, ...(prev ?? [])]);
      if (result.free) queryClient.invalidateQueries({ queryKey: ["free-lucky-spin"] });
    },
  });
}

export function useFreeLuckySpinStatus() {
  const token = useAuthStore((s) => s.token);
  const query = useQuery({
    queryKey: ["free-lucky-spin"],
    queryFn: () => api.get<FreeLuckySpinStatus>("/api/lucky-spin/free-status"),
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

/** Для длинных таймеров (часы) — "3:14:07" вместо "194:07". */
export function formatLongCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
