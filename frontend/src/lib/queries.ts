import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type {
  Card,
  CareerStatus,
  FlashChallengeStatus,
  Formation,
  GameUser,
  PackDef,
  QuickMatchResponse,
  ShootoutPower,
  ShootoutRoundResponse,
  ShootoutZone,
  Squad,
  SquadSlot,
  UserQuest,
  UserStats,
  WeatherDef,
} from "../types/game";

export function useWeather() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["weather"],
    queryFn: () => api.get<WeatherDef>("/api/matches/weather"),
    enabled: Boolean(token),
    staleTime: 10 * 60_000,
  });
}

export function useCareerStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["career-status"],
    queryFn: () => api.get<CareerStatus>("/api/matches/career"),
    enabled: Boolean(token),
  });
}

export function useFlashChallengeStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["flash-challenge-status"],
    queryFn: () => api.get<FlashChallengeStatus>("/api/matches/flash-challenge"),
    enabled: Boolean(token),
  });
}

export function usePacks() {
  return useQuery({
    queryKey: ["packs"],
    queryFn: () => api.get<{ packs: PackDef[]; happyHour: boolean; happyHourDiscount: number }>("/api/packs"),
  });
}

export function useInventory() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["cards"],
    queryFn: () => api.get<{ cards: Card[] }>("/api/cards").then((r) => r.cards),
    enabled: Boolean(token),
  });
}

export function useOpenPack() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (packId: string) =>
      api.post<{ cards: Card[]; coins: number }>("/api/packs/open", { packId }),
    onSuccess: ({ cards, coins }, packId) => {
      if (user) setUser({ ...user, coins, hasClaimedStarter: packId === "starter" ? true : user.hasClaimedStarter });
      queryClient.setQueryData<Card[]>(["cards"], (prev) => [...cards, ...(prev ?? [])]);
    },
  });
}

export function useQuickSell() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (cardId: string) => api.post<{ coins: number }>("/api/cards/quick-sell", { cardId }),
    onSuccess: (_result, cardId) => {
      if (user) setUser({ ...user, coins: _result.coins });
      queryClient.setQueryData<Card[]>(["cards"], (prev) => prev?.filter((c) => c.id !== cardId));
    },
  });
}

export function useTrainCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { cardId: string; duplicateCardId: string }) =>
      api.post<{ card: Card }>("/api/cards/train", input),
    onSuccess: (result, input) => {
      queryClient.setQueryData<Card[]>(["cards"], (prev) =>
        prev
          ?.filter((c) => c.id !== input.duplicateCardId)
          .map((c) => (c.id === result.card.id ? result.card : c)),
      );
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

export function useSquads() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["squads"],
    queryFn: () => api.get<{ squads: Squad[] }>("/api/team/squads").then((r) => r.squads),
    enabled: Boolean(token),
  });
}

export function useCreateSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { formation: Formation; slots: SquadSlot[] }) =>
      api.post<{ squad: Squad }>("/api/team/squads", payload).then((r) => r.squad),
    onSuccess: (squad) => {
      queryClient.setQueryData<Squad[]>(["squads"], (prev) => [...(prev ?? []), squad]);
    },
  });
}

export function useUpdateSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Pick<Squad, "name" | "formation" | "slots" | "isActive">>) =>
      api.put<{ squad: Squad }>(`/api/team/squads/${id}`, payload).then((r) => r.squad),
    onSuccess: (squad) => {
      queryClient.setQueryData<Squad[]>(["squads"], (prev) =>
        prev?.map((s) => (s.id === squad.id ? squad : s)),
      );
    },
  });
}

export function useQuests() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["quests"],
    queryFn: () => api.get<{ quests: UserQuest[] }>("/api/quests").then((r) => r.quests),
    enabled: Boolean(token),
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (userQuestId: string) =>
      api.post<{ coins: number; xp: number; level: number; levelUpReward: number }>("/api/quests/claim", {
        userQuestId,
      }),
    onSuccess: (result, userQuestId) => {
      if (user) setUser({ ...user, coins: result.coins, xp: result.xp, level: result.level });
      queryClient.setQueryData<UserQuest[]>(["quests"], (prev) =>
        prev?.map((q) => (q.id === userQuestId ? { ...q, claimed: true } : q)),
      );
    },
  });
}

export function useDailyClaim() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () =>
      api.post<{ coins: number; streak: number; reward: number; xp: number; level: number; levelUpReward: number }>(
        "/api/user/daily-claim",
      ),
    onSuccess: (result) => {
      if (user) {
        setUser({
          ...user,
          coins: result.coins,
          xp: result.xp,
          level: result.level,
          dailyStreak: result.streak,
          lastDailyClaimAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function usePlayQuickMatch() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<QuickMatchResponse>("/api/matches/quick"),
    onSuccess: (result) => {
      if ("needsShootout" in result) return;
      if (user) setUser({ ...user, coins: result.coins, xp: result.xp, level: result.level });
      if (result.wonCard) {
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.wonCard!, ...(prev ?? [])]);
      }
      queryClient.invalidateQueries({ queryKey: ["career-status"] });
      queryClient.invalidateQueries({ queryKey: ["flash-challenge-status"] });
    },
  });
}

export function useShootoutRound() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { draftId: string; kickZone: ShootoutZone; kickPower: ShootoutPower; saveZone: ShootoutZone }) =>
      api.post<ShootoutRoundResponse>(`/api/matches/shootout/${input.draftId}/round`, {
        kickZone: input.kickZone,
        kickPower: input.kickPower,
        saveZone: input.saveZone,
      }),
    onSuccess: (response) => {
      if (!response.finished || !response.result) return;
      const result = response.result;
      if (user) setUser({ ...user, coins: result.coins, xp: result.xp, level: result.level });
      if (result.wonCard) {
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.wonCard!, ...(prev ?? [])]);
      }
      queryClient.invalidateQueries({ queryKey: ["career-status"] });
      queryClient.invalidateQueries({ queryKey: ["flash-challenge-status"] });
    },
  });
}

export function useRefreshMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return () => api.get<{ user: GameUser }>("/api/user/me").then((r) => setUser(r.user));
}

export function useUpdateTeamProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: { teamName: string; teamLogo?: string; teamColors?: string }) =>
      api.post<{ user: GameUser }>("/api/user/team", input),
    onSuccess: (r) => setUser(r.user),
  });
}

export function useUpdateAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (icon: string) => api.post<{ user: GameUser }>("/api/user/avatar", { icon }),
    onSuccess: (r) => setUser(r.user),
  });
}

export function useUserStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: () => api.get<UserStats>("/api/user/stats"),
    enabled: Boolean(token),
  });
}
