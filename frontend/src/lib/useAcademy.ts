import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, Rarity } from "../types/game";

export interface AcademyStatus {
  eligible: boolean;
  enrolled: boolean;
  msLeft: number | null;
  durationMs: number;
  nextRarity: Rarity | null;
  enrollCost: number | null;
}

export function useAcademyStatus(cardId: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["academy-status", cardId],
    queryFn: () => api.get<AcademyStatus>(`/api/cards/${cardId}/academy`),
    enabled: Boolean(token && cardId),
    refetchInterval: 30_000,
  });
}

function patchCardInCache(queryClient: ReturnType<typeof useQueryClient>, card: Card) {
  queryClient.setQueryData<Card[]>(["cards"], (prev) => prev?.map((c) => (c.id === card.id ? card : c)));
}

export function useEnrollAcademy() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (cardId: string) => api.post<{ card: Card; coins: number }>(`/api/cards/${cardId}/academy/enroll`, {}),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      patchCardInCache(queryClient, res.card);
      queryClient.invalidateQueries({ queryKey: ["academy-status", res.card.id] });
    },
  });
}

export function useGraduateAcademy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => api.post<{ card: Card }>(`/api/cards/${cardId}/academy/graduate`, {}),
    onSuccess: (res) => {
      patchCardInCache(queryClient, res.card);
      queryClient.invalidateQueries({ queryKey: ["academy-status", res.card.id] });
    },
  });
}
