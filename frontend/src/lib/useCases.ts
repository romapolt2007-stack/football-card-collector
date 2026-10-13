import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, CaseDef, CaseSpinResult } from "../types/game";

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: () => api.get<{ cases: CaseDef[] }>("/api/cases").then((r) => r.cases),
  });
}

export function useSpinCase() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (caseId: string) => api.post<CaseSpinResult>("/api/cases/spin", { caseId }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      if (result.prize.card) {
        queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.prize.card!, ...(prev ?? [])]);
      }
    },
  });
}
