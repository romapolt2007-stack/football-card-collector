import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { RelicStatus } from "../types/game";

export function useRelicStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["relic-status"],
    queryFn: () => api.get<RelicStatus>("/api/relics/status"),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });
}

export function useCollectRelicDividends() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: () => api.post<{ coins: number; collected: number }>("/api/relics/collect"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.invalidateQueries({ queryKey: ["relic-status"] });
    },
  });
}
