import { useEffect, useState } from "react";
import { LoadingScreen } from "./components/LoadingScreen";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { useLeagues, useStadiumBuff } from "./lib/useMeta";
import { useSaveSpinPlayer, useSaveSpinStadium, useSpinPlayer, useSpinStadiumStaked, useSpinStatus } from "./lib/useSpin";
import { MockBottomNav, type MockTab } from "./mockups/nomerok/MockBottomNav";
import { MockLeagueClubSheet, type PickerClub, type PickerLeague } from "./mockups/nomerok/MockLeagueClubSheet";
import { MockMoreScreen } from "./mockups/nomerok/MockMoreScreen";
import { MockPlayScreen } from "./mockups/nomerok/MockPlayScreen";
import { RealPlayerReel, RealPlayerResultCard } from "./mockups/nomerok/RealPlayerReel";
import { RealStadiumReel, RealStadiumResultCard } from "./mockups/nomerok/RealStadiumReel";
import { flagForLeague } from "./mockups/nomerok/leagueFlags";
import { CollectionScreen } from "./screens/CollectionScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import type { PlayerSpinResult, StadiumSpinResult } from "./types/game";
import { useAuthStore } from "./store/useAuthStore";

type SpinMode = "players" | "stadiums";
type Multiplier = 1 | 2 | 5 | 10;

const ALL_LEAGUES_ID = "__all__";
const SPINS_PER_LEVEL = 25; // держать в синхроне с backend/src/lib/spin.ts SPINS_PER_LEVEL

function App() {
  const { status, error } = useTelegramAuth();
  const isReady = useAuthStore((s) => s.isReady);

  const [tab, setTab] = useState<MockTab>("play");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mode, setMode] = useState<SpinMode>("players");
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const realLeagues = useLeagues();
  const spinStatus = useSpinStatus();
  const buff = useStadiumBuff();
  const spinPlayerMutation = useSpinPlayer();
  const savePlayerMutation = useSaveSpinPlayer();
  const spinStadiumMutation = useSpinStadiumStaked();
  const saveStadiumMutation = useSaveSpinStadium();

  const [playerLeagueId, setPlayerLeagueId] = useState<string | null>(null);
  const [playerClubId, setPlayerClubId] = useState<string | null>(null);
  const [stadiumLeagueId, setStadiumLeagueId] = useState<string | null>(null);
  const [stadiumClubId, setStadiumClubId] = useState<string | null>(null);

  const [reeling, setReeling] = useState(false);
  const [playerResult, setPlayerResult] = useState<PlayerSpinResult | null>(null);
  const [stadiumResult, setStadiumResult] = useState<StadiumSpinResult | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Удобно для ручной проверки вне Telegram: вставьте токен из curl-теста
      // в консоли: window.__authStore.getState().setSession(token, user)
      (window as unknown as { __authStore: typeof useAuthStore }).__authStore = useAuthStore;
    }
  }, []);

  useEffect(() => {
    if (!realLeagues.data?.length) return;
    if (!playerLeagueId) setPlayerLeagueId(realLeagues.data[0].id);
    if (!stadiumLeagueId) setStadiumLeagueId(realLeagues.data[0].id);
  }, [realLeagues.data, playerLeagueId, stadiumLeagueId]);

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

  const pickerLeagues: PickerLeague[] = [
    ...(realLeagues.data ?? []).map((l) => ({ id: l.id, name: l.name, flag: flagForLeague(l.name) })),
    { id: ALL_LEAGUES_ID, name: "Все лиги", flag: "🌍" },
  ];
  const pickerClubs: PickerClub[] = (realLeagues.data ?? [])
    .flatMap((l) =>
      l.clubs.map((c) => ({
        id: c.id,
        leagueId: l.id,
        name: c.name,
        shortName: c.shortName,
        colorPrimary: c.colorPrimary,
        colorSecondary: c.colorSecondary,
        playerCount: c.playerCount,
        stadiumCapacity: c.stadiumCapacity,
        priceMultiplier: 3,
      })),
    )
    .filter((c) => (mode === "players" ? true : c.stadiumCapacity != null));

  const leagueId = mode === "players" ? playerLeagueId : stadiumLeagueId;
  const clubId = mode === "players" ? playerClubId : stadiumClubId;
  const league = pickerLeagues.find((l) => l.id === leagueId);
  const club = clubId ? pickerClubs.find((c) => c.id === clubId) : null;
  const selectedLabel = !league ? "Загрузка лиг..." : club ? `${league.flag} ${league.name} · ${club.name}` : `${league.flag} ${league.name} · Любой клуб`;

  const minCost = spinStatus.data?.minCost ?? 1_000;
  const maxCost = spinStatus.data?.maxCost ?? 10_000_000;
  const priceMultiplier = club?.priceMultiplier ?? (leagueId === ALL_LEAGUES_ID ? 0.7 : 1);
  const spinAmount = Math.min(maxCost, Math.max(minCost, Math.round(minCost * priceMultiplier * multiplier)));

  const level = spinStatus.data?.level ?? 1;
  const totalSpins = spinStatus.data?.totalSpins ?? 0;
  const xp = totalSpins % SPINS_PER_LEVEL;
  const coins = spinStatus.data?.coins ?? 0;
  // "Удача" пока derived от баффа лучшего стадиона (0-8% → 0-80) — отдельной покупаемой механики
  // "Удача" в бэкенде нет.
  const luck = Math.round((buff.data?.topTierWeightBonus ?? 0) * 1000);

  function handlePickerSelect(selLeagueId: string, selClubId: string | null) {
    if (mode === "players") {
      setPlayerLeagueId(selLeagueId);
      setPlayerClubId(selClubId);
    } else {
      setStadiumLeagueId(selLeagueId);
      setStadiumClubId(selClubId);
    }
    setPickerOpen(false);
  }

  function handleModeChange(m: SpinMode) {
    setMode(m);
    setPlayerResult(null);
    setStadiumResult(null);
  }

  function handleSpin() {
    if (!leagueId) return;
    const filters = { leagueId: leagueId === ALL_LEAGUES_ID ? undefined : leagueId, clubId: clubId ?? undefined, amount: spinAmount };
    if (mode === "players") {
      setPlayerResult(null);
      spinPlayerMutation.mutate(filters, { onSuccess: (r) => { setPlayerResult(r); setReeling(true); } });
    } else {
      setStadiumResult(null);
      spinStadiumMutation.mutate(filters, { onSuccess: (r) => { setStadiumResult(r); setReeling(true); } });
    }
  }

  // Экран "Играть" не спрашивает "продать/сохранить" — карта сразу уходит в коллекцию,
  // чтобы оплаченный спин никогда не терялся (бэкенд хранит только один "pending" результат за раз).
  function handlePlayerReelDone() {
    setReeling(false);
    savePlayerMutation.mutate();
  }

  function handleStadiumReelDone() {
    setReeling(false);
    saveStadiumMutation.mutate();
  }

  function handleTileClick(id: string) {
    if (id === "collection") setTab("collection");
    else if (id === "market") setTab("market");
    else if (id === "stadiums") {
      setMode("stadiums");
      setTab("play");
    }
    // Рейтинг/Задания/Колесо/Друзья/Подарок — пока без бэкенда, намеренно без реакции.
  }

  const hasResult = mode === "players" ? Boolean(playerResult) : Boolean(stadiumResult);
  const reelSlot =
    mode === "players" ? (
      playerResult && <RealPlayerReel player={playerResult.player} rarity={playerResult.rarity} onDone={handlePlayerReelDone} />
    ) : (
      stadiumResult && <RealStadiumReel stadium={stadiumResult.stadium} rarity={stadiumResult.rarity} onDone={handleStadiumReelDone} />
    );
  const resultSlot =
    mode === "players" ? (
      playerResult && <RealPlayerResultCard player={playerResult.player} rarity={playerResult.rarity} />
    ) : (
      stadiumResult && <RealStadiumResultCard stadium={stadiumResult.stadium} rarity={stadiumResult.rarity} />
    );

  const activeMutation = mode === "players" ? spinPlayerMutation : spinStadiumMutation;
  const errorText = activeMutation.isError ? (activeMutation.error as Error).message : null;

  return (
    <>
      {tab === "play" && (
        <MockPlayScreen
          mode={mode}
          onModeChange={handleModeChange}
          multiplier={multiplier}
          onMultiplierChange={setMultiplier}
          selectedLabel={selectedLabel}
          spinPrice={spinAmount}
          onOpenPicker={() => setPickerOpen(true)}
          onOpenMore={() => setTab("more")}
          reeling={reeling}
          hasResult={hasResult}
          reelSlot={reelSlot}
          resultSlot={resultSlot}
          onSpin={handleSpin}
          spinDisabled={!leagueId || activeMutation.isPending}
          errorText={errorText}
          level={level}
          xpPct={Math.round((xp / SPINS_PER_LEVEL) * 100)}
          luck={luck}
          coins={coins}
        />
      )}
      {tab === "collection" && <CollectionScreen />}
      {tab === "market" && <MarketScreen />}
      {tab === "friends" && (
        <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "#0E1013" }}>
          <p className="text-sm text-white/40">Рефералка скоро появится здесь</p>
        </div>
      )}
      {tab === "more" && (
        <MockMoreScreen
          onBack={() => setTab("play")}
          level={level}
          xp={xp}
          xpToNext={SPINS_PER_LEVEL}
          coins={coins}
          onOpenProfile={() => setProfileOpen(true)}
          onTileClick={handleTileClick}
        />
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-pitch-dark">
          <button
            onClick={() => setProfileOpen(false)}
            className="fixed left-3 top-[calc(env(safe-area-inset-top)+10px)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg text-white"
          >
            ‹
          </button>
          <ProfileScreen />
        </div>
      )}

      {pickerOpen && league && (
        <MockLeagueClubSheet
          mode={mode}
          leagues={pickerLeagues}
          clubs={pickerClubs}
          allLeaguesId={ALL_LEAGUES_ID}
          anyClubPriceMultiplier={1}
          selectedLeagueId={leagueId ?? pickerLeagues[0]?.id ?? ""}
          selectedClubId={clubId}
          onSelect={handlePickerSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {(tab === "play" || tab === "collection" || tab === "market" || tab === "friends" || tab === "more") && !profileOpen && (
        <MockBottomNav tab={tab} onChange={setTab} />
      )}
    </>
  );
}

export default App;
