import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";

export interface StadiumStatus {
  level: number;
  maxLevel: number;
  incomePerHour: number;
  pending: number;
  upgradeCost: number | null;
}

export function useStadiumStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["stadium-status"],
    queryFn: () => api.get<StadiumStatus>("/api/stadium/status"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useCollectStadium() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<{ coins: number; collected: number }>("/api/stadium/collect", {}),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      queryClient.invalidateQueries({ queryKey: ["stadium-status"] });
    },
  });
}

export function useUpgradeStadium() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<{ coins: number; level: number }>("/api/stadium/upgrade", {}),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      queryClient.invalidateQueries({ queryKey: ["stadium-status"] });
    },
  });
}
