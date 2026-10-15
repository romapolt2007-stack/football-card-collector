import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";

export const CLAN_CREATE_COST = 7000;

export interface ClanListItem {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  totalPower: number;
  createdAt: string;
}

export interface ClanMemberInfo {
  userId: string;
  name: string;
  level: number;
  role: "LEADER" | "MEMBER";
  joinedAt: string;
  squadStrength: number;
}

export interface MyClan {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  avatarUrl: string | null;
  leaderId: string;
  createdAt: string;
  totalPower: number;
  members: ClanMemberInfo[];
}

export function useClanList() {
  return useQuery({
    queryKey: ["clans"],
    queryFn: () => api.get<{ clans: ClanListItem[] }>("/api/clans").then((r) => r.clans),
  });
}

export function useMyClan() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["my-clan"],
    queryFn: () => api.get<{ clan: MyClan | null }>("/api/clans/mine").then((r) => r.clan),
    enabled: Boolean(token),
  });
}

export function useCreateClan() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: { name: string; tag: string; description?: string; avatarUrl?: string }) =>
      api.post<{ clanId: string }>("/api/clans", input),
    onSuccess: () => {
      if (user) setUser({ ...user, coins: user.coins - CLAN_CREATE_COST });
      queryClient.invalidateQueries({ queryKey: ["my-clan"] });
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });
}

export function useSetClanAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string | null) =>
      api.post<{ avatarUrl: string | null }>("/api/clans/avatar", { avatarUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-clan"] });
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });
}

export function useJoinClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clanId: string) => api.post<{ joined: boolean }>(`/api/clans/${clanId}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-clan"] });
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });
}

export function useLeaveClan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<{ left: boolean }>("/api/clans/leave", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-clan"] });
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.post<{ kicked: boolean }>(`/api/clans/kick/${userId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-clan"] });
    },
  });
}
