import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";

export interface ReferralStatus {
  referralCode: string;
  invitedCount: number;
  totalEarned: number;
}

export function useReferralStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["referrals"],
    queryFn: () => api.get<ReferralStatus>("/api/user/referrals"),
    enabled: Boolean(token),
  });
}

export function useApplyReferral() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (code: string) => api.post<{ applied: boolean }>("/api/user/apply-referral", { code }),
    onSuccess: () => {
      if (user) setUser({ ...user, referredBy: "applied" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}
