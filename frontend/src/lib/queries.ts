import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, Formation, GameUser, PackDef, QuickMatchResult, Squad, SquadSlot, UserQuest } from "../types/game";

export function usePacks() {
  return useQuery({
    queryKey: ["packs"],
    queryFn: () => api.get<{ packs: PackDef[] }>("/api/packs").then((r) => r.packs),
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
    onSuccess: ({ cards, coins }) => {
      if (user) setUser({ ...user, coins });
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
      api.post<{ coins: number; xp: number; level: number }>("/api/quests/claim", { userQuestId }),
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
      api.post<{ coins: number; streak: number; reward: number; xp: number; level: number }>(
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
    mutationFn: () => api.post<QuickMatchResult>("/api/matches/quick"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins, xp: result.xp, level: result.level });
      if (result.wonCard) {
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.wonCard!, ...(prev ?? [])]);
      }
    },
  });
}

export function useRefreshMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return () => api.get<{ user: GameUser }>("/api/user/me").then((r) => setUser(r.user));
}
