import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card } from "../types/game";

export interface BattlePassStatus {
  xp: number;
  level: number;
  maxLevel: number;
  xpPerLevel: number;
  premium: boolean;
  premiumCost: number;
  claimedFree: number[];
  claimedPremium: number[];
}

export interface BattlePassClaimResult {
  coins: number;
  rewardCoins: number;
  grantedCard: Card | null;
}

export function useBattlePassStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["battle-pass-status"],
    queryFn: () => api.get<BattlePassStatus>("/api/battle-pass/status"),
    enabled: Boolean(token),
  });
}

export function useBuyPremiumPass() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<{ coins: number; premium: boolean }>("/api/battle-pass/buy-premium", {}),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      queryClient.invalidateQueries({ queryKey: ["battle-pass-status"] });
    },
  });
}

export function useClaimBattlePass() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { level: number; track: "FREE" | "PREMIUM" }) =>
      api.post<BattlePassClaimResult>("/api/battle-pass/claim", input),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      if (res.grantedCard) {
        const card = res.grantedCard;
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [card, ...(prev ?? [])]);
      }
      queryClient.invalidateQueries({ queryKey: ["battle-pass-status"] });
    },
  });
}
