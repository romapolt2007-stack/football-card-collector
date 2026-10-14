import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, DuelFindResponse, DuelRoundResponse, DuelStatus, ShootoutPower, ShootoutZone } from "../types/game";

export function useDuelStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["duel-status"],
    queryFn: () => api.get<DuelStatus>("/api/duel/status"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useFindDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<DuelFindResponse>("/api/duel/find", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duel-status"] });
    },
  });
}

export function useDuelRound() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { draftId: string; kickZone: ShootoutZone; kickPower: ShootoutPower; saveZone: ShootoutZone }) =>
      api.post<DuelRoundResponse>(`/api/duel/${input.draftId}/round`, {
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
      queryClient.invalidateQueries({ queryKey: ["duel-status"] });
    },
  });
}
