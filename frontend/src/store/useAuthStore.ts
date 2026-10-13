import { create } from "zustand";
import type { GameUser } from "../types/game";

interface AuthState {
  token: string | null;
  user: GameUser | null;
  isReady: boolean;
  setSession: (token: string, user: GameUser) => void;
  setUser: (user: GameUser) => void;
  setReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isReady: false,
  setSession: (token, user) => set({ token, user, isReady: true }),
  setUser: (user) => set({ user }),
  setReady: () => set({ isReady: true }),
}));
