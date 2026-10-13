import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "./components/BottomNav";
import { LoadingScreen } from "./components/LoadingScreen";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { CasesScreen } from "./screens/CasesScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { MatchScreen } from "./screens/MatchScreen";
import { PacksScreen } from "./screens/PacksScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { status, error } = useTelegramAuth();
  const isReady = useAuthStore((s) => s.isReady);
  const [tab, setTab] = useState<TabId>("packs");

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Удобно для ручной проверки вне Telegram: вставьте токен из curl-теста
      // в консоли: window.__authStore.getState().setSession(token, user)
      (window as unknown as { __authStore: typeof useAuthStore }).__authStore = useAuthStore;
    }
  }, []);

  if (status === "loading") return <LoadingScreen />;

  if (status === "no-telegram" && !isReady) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-pitch-dark px-6 text-center">
        <h1 className="text-xl font-extrabold text-gold">Football Card Collector</h1>
        <p className="text-sm text-white/60">
          Откройте игру через Telegram-бота — здесь, в обычном браузере, она не авторизуется.
        </p>
      </div>
    );
  }

  if (status === "error" && !isReady) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-pitch-dark px-6 text-center">
        <h1 className="text-xl font-extrabold text-red-400">Не удалось войти</h1>
        <p className="text-sm text-white/60">{error}</p>
      </div>
    );
  }

  return (
    <>
      {tab === "packs" && <PacksScreen />}
      {tab === "cases" && <CasesScreen />}
      {tab === "team" && <TeamScreen />}
      {tab === "inventory" && <InventoryScreen />}
      {tab === "match" && <MatchScreen />}
      {tab === "market" && <MarketScreen />}
      {tab === "profile" && <ProfileScreen />}
      <BottomNav tab={tab} onChange={setTab} />
    </>
  );
}

export default App;
