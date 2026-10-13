import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getInitData, initTelegram, isInsideTelegram } from "../lib/telegram";
import { useAuthStore } from "../store/useAuthStore";
import type { GameUser } from "../types/game";

type Status = "loading" | "ready" | "no-telegram" | "error";

export function useTelegramAuth() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    initTelegram();

    const initData = getInitData();
    if (!isInsideTelegram || !initData) {
      setStatus("no-telegram");
      return;
    }

    api
      .post<{ token: string; user: GameUser }>("/api/auth/telegram", { initData })
      .then(({ token, user }) => {
        setSession(token, user);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Не удалось войти");
        setStatus("error");
      });
  }, [setSession]);

  return { status, error };
}
