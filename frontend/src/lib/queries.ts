import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, DailyClaimResult, DailyStatus, GameUser, StadiumCard } from "../types/game";

export function useInventory() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["cards"],
    queryFn: () => api.get<{ cards: Card[] }>("/api/cards").then((r) => r.cards),
    enabled: Boolean(token),
  });
}

export function useQuickSell() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (cardId: string) => api.post<{ coins: number }>("/api/cards/quick-sell", { cardId }),
    onSuccess: (result, cardId) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.setQueryData<Card[]>(["cards"], (prev) => prev?.filter((c) => c.id !== cardId));
    },
  });
}

export function useQuickSellBulk() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (cardIds: string[]) =>
      api.post<{ coins: number; soldCount: number; total: number; soldCardIds: string[] }>(
        "/api/cards/quick-sell-bulk",
        { cardIds },
      ),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      const sold = new Set(result.soldCardIds);
      queryClient.setQueryData<Card[]>(["cards"], (prev) => prev?.filter((c) => !sold.has(c.id)));
    },
  });
}

export function useStadiumCollection() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["stadium-cards"],
    queryFn: () => api.get<{ stadiumCards: StadiumCard[] }>("/api/stadiums").then((r) => r.stadiumCards),
    enabled: Boolean(token),
  });
}

export function useStadiumQuickSell() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (stadiumCardId: string) => api.post<{ coins: number }>("/api/stadiums/quick-sell", { stadiumCardId }),
    onSuccess: (result, stadiumCardId) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.setQueryData<StadiumCard[]>(["stadium-cards"], (prev) => prev?.filter((c) => c.id !== stadiumCardId));
    },
  });
}

export function useRefreshMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return () => api.get<{ user: GameUser }>("/api/user/me").then((r) => setUser(r.user));
}

export function useUpdateAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (avatarIcon: string) => api.post<{ user: GameUser }>("/api/user/avatar", { avatarIcon }),
    onSuccess: (r) => setUser(r.user),
  });
}

export function useDailyStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["daily-status"],
    queryFn: () => api.get<DailyStatus>("/api/user/daily-status"),
    enabled: Boolean(token),
  });
}

export function useDailyClaim() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<DailyClaimResult>("/api/user/daily-claim"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins, dailyStreak: result.streak });
      queryClient.invalidateQueries({ queryKey: ["daily-status"] });
    },
  });
}
