import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { CosmeticPatchDef } from "../types/game";

export function useCosmeticPatches() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["cosmetic-patches"],
    queryFn: () => api.get<{ patches: CosmeticPatchDef[]; installedId: string | null }>("/api/cosmetic-patches"),
    enabled: Boolean(token),
  });
}

export function useApplyCosmeticPatch() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (patchId: string | null) =>
      api.post<{ installedId: string | null }>("/api/cosmetic-patches/apply", { patchId }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, cosmeticPatchId: result.installedId });
      queryClient.invalidateQueries({ queryKey: ["cosmetic-patches"] });
    },
  });
}
