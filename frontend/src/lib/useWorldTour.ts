import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, WorldTourPlayResponse, WorldTourStatus } from "../types/game";

export function useWorldTourStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["world-tour-status"],
    queryFn: () => api.get<WorldTourStatus>("/api/world-tour/status"),
    enabled: Boolean(token),
  });
}

export function usePlayWorldTour() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<WorldTourPlayResponse>("/api/world-tour/play", {}),
    onSuccess: (response) => {
      if (user) {
        setUser({ ...user, coins: response.result.coins, xp: response.result.xp, level: response.result.level });
      }
      if (response.result.grantedCard) {
        const card = response.result.grantedCard;
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [card, ...(prev ?? [])]);
      }
      queryClient.invalidateQueries({ queryKey: ["world-tour-status"] });
    },
  });
}
