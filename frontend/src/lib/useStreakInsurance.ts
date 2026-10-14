import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";

export interface StreakStatus {
  canInsure: boolean;
  alreadyInsured: boolean;
  cost: number;
  streak: number;
}

export function useStreakStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["streak-status"],
    queryFn: () => api.get<StreakStatus>("/api/user/streak/status"),
    enabled: Boolean(token),
  });
}

export function useInsureStreak() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: () => api.post<{ coins: number; insured: boolean }>("/api/user/streak/insure", {}),
    onSuccess: (res) => {
      if (user) setUser({ ...user, coins: res.coins });
      queryClient.invalidateQueries({ queryKey: ["streak-status"] });
    },
  });
}
