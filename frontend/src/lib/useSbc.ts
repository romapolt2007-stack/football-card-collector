import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, SbcDef, SbcSubmitResult } from "../types/game";

export function useSbcChallenges() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["sbc"],
    queryFn: () => api.get<{ sbcs: SbcDef[]; completedIds: string[] }>("/api/sbc"),
    enabled: Boolean(token),
  });
}

export function useSubmitSbc() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ sbcId, cardIds }: { sbcId: string; cardIds: string[] }) =>
      api.post<SbcSubmitResult>("/api/sbc/submit", { sbcId, cardIds }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins, xp: result.xp, level: result.level });
      const consumed = new Set(result.consumedCardIds);
      queryClient.setQueryData<Card[]>(["cards"], (prev) => {
        const next = prev?.filter((c) => !consumed.has(c.id)) ?? [];
        return result.grantedCard ? [result.grantedCard, ...next] : next;
      });
      queryClient.invalidateQueries({ queryKey: ["sbc"] });
    },
  });
}
