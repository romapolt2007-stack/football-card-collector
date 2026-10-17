import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useLeagues, useStadiumBuff } from "../../lib/useMeta";
import { useSaveSpinPlayer, useSpinPlayer, useSpinStatus } from "../../lib/useSpin";
import type { PlayerSpinResult } from "../../types/game";
import { MockBottomNav, type MockTab } from "./MockBottomNav";
import { MockLeagueClubSheet, type PickerClub, type PickerLeague } from "./MockLeagueClubSheet";
import { MockMoreScreen } from "./MockMoreScreen";
import { MockPlayScreen } from "./MockPlayScreen";
import { MockSpinReel, MockResultCard, type MockSpinOutcome } from "./MockSpinReel";
import { RealPlayerReel, RealPlayerResultCard } from "./RealPlayerReel";
import { MOCK_CLUBS, MOCK_LEAGUES } from "./mockData";
import { flagForLeague } from "./leagueFlags";

type SpinMode = "players" | "stadiums";
type Multiplier = 1 | 2 | 5 | 10;

const ALL_LEAGUES_ID = "__all__";
const SPINS_PER_LEVEL = 25; // держать в синхроне с backend/src/lib/spin.ts SPINS_PER_LEVEL

// Стадионы (режим "Стадионы") — свои мок-лиги/клубы (стадионы с настоящей платной прокруткой
// по лиге/клубу в бэкенде ещё нет, см. комментарий в MockSpinReel.tsx) — используем отдельные id,
// не пересекающиеся с реальными id лиг игроков.
const STADIUM_MOCK_LEAGUES: PickerLeague[] = MOCK_LEAGUES.map((l) => ({ id: l.id, name: l.name, flag: l.flag }));
const STADIUM_MOCK_CLUBS: PickerClub[] = MOCK_CLUBS.map((c) => ({
  id: c.id,
  leagueId: c.leagueId,
  name: c.name,
  shortName: c.shortName,
  colorPrimary: c.colorPrimary,
  colorSecondary: c.colorSecondary,
  playerCount: c.playerCount,
  stadiumCapacity: c.stadiumCapacity,
  priceMultiplier: c.spinPriceMultiplier,
}));

/** Харнесс макета "Номерок-стиль": "Игроки" уже подключены к реальному API (GET /api/meta/leagues,
 * /api/spin/status, POST /api/spin/spin + /save), "Стадионы" — пока на моке (см. MockSpinReel.tsx),
 * "Ещё" использует реальные баланс/уровень. Не часть боевой навигации — открывается по ?mock=1. */
export function MockPreviewApp() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<MockTab>("play");
  const [mode, setMode] = useState<SpinMode>("players");
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const realLeagues = useLeagues();
  const status = useSpinStatus();
  const buff = useStadiumBuff();
  const spinMutation = useSpinPlayer();
  const saveMutation = useSaveSpinPlayer();

  const [playerLeagueId, setPlayerLeagueId] = useState<string | null>(null);
  const [playerClubId, setPlayerClubId] = useState<string | null>(null);
  const [stadiumLeagueId, setStadiumLeagueId] = useState("eng");
  const [stadiumClubId, setStadiumClubId] = useState<string | null>(null);

  const [reeling, setReeling] = useState(false);
  const [playerResult, setPlayerResult] = useState<PlayerSpinResult | null>(null);
  const [stadiumOutcome, setStadiumOutcome] = useState<MockSpinOutcome | null>(null);

  useEffect(() => {
    if (!playerLeagueId && realLeagues.data?.length) setPlayerLeagueId(realLeagues.data[0].id);
  }, [realLeagues.data, playerLeagueId]);

  const pickerLeagues: PickerLeague[] =
    mode === "players"
      ? [...(realLeagues.data ?? []).map((l) => ({ id: l.id, name: l.name, flag: flagForLeague(l.name) })), { id: ALL_LEAGUES_ID, name: "Все лиги", flag: "🌍" }]
      : STADIUM_MOCK_LEAGUES;
  const pickerClubs: PickerClub[] =
    mode === "players"
      ? (realLeagues.data ?? []).flatMap((l) =>
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
      : STADIUM_MOCK_CLUBS;

  const leagueId = mode === "players" ? playerLeagueId : stadiumLeagueId;
  const clubId = mode === "players" ? playerClubId : stadiumClubId;
  const league = pickerLeagues.find((l) => l.id === leagueId);
  const club = clubId ? pickerClubs.find((c) => c.id === clubId) : null;
  const selectedLabel = !league ? "Загрузка лиг..." : club ? `${league.flag} ${league.name} · ${club.name}` : `${league.flag} ${league.name} · Любой клуб`;

  const minCost = status.data?.minCost ?? 1_000;
  const maxCost = status.data?.maxCost ?? 10_000_000;
  const priceMultiplier = club?.priceMultiplier ?? (leagueId === ALL_LEAGUES_ID ? 0.7 : 1);
  const spinAmount = Math.min(maxCost, Math.max(minCost, Math.round(minCost * priceMultiplier * multiplier)));

  const level = status.data?.level ?? 1;
  const totalSpins = status.data?.totalSpins ?? 0;
  const xp = totalSpins % SPINS_PER_LEVEL;
  const coins = status.data?.coins ?? 0;
  // "Удача" пока derived от баффа лучшего стадиона (0-8% → 0-80) — отдельной покупаемой механики
  // "Удача" в бэкенде нет, см. итоговую сводку по шагу подключения к API.
  const luck = Math.round((buff.data?.topTierWeightBonus ?? 0) * 1000);

  function handleOpenPicker() {
    setPickerOpen(true);
  }

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
    setStadiumOutcome(null);
  }

  function handleSpin() {
    if (mode === "stadiums") {
      setStadiumOutcome(null);
      setReeling(true);
      return;
    }
    if (!token) return;
    setPlayerResult(null);
    spinMutation.mutate(
      { leagueId: leagueId === ALL_LEAGUES_ID ? undefined : (leagueId ?? undefined), clubId: clubId ?? undefined, amount: spinAmount },
      { onSuccess: (r) => { setPlayerResult(r); setReeling(true); } },
    );
  }

  function handlePlayerReelDone() {
    setReeling(false);
    // Экран 1 в этом макете не спрашивает "продать/сохранить" — карта сразу уходит в коллекцию,
    // чтобы оплаченный спин никогда не терялся (бэкенд хранит только один "pending" результат за раз).
    saveMutation.mutate();
  }

  function handleStadiumReelDone(outcome: MockSpinOutcome) {
    setReeling(false);
    setStadiumOutcome(outcome);
  }

  const hasResult = mode === "players" ? Boolean(playerResult) : Boolean(stadiumOutcome);
  const reelSlot =
    mode === "players" && playerResult ? (
      <RealPlayerReel player={playerResult.player} rarity={playerResult.rarity} onDone={handlePlayerReelDone} />
    ) : (
      <MockSpinReel pool={MOCK_CLUBS.filter((c) => (stadiumLeagueId === "all" ? true : c.leagueId === stadiumLeagueId))} onDone={handleStadiumReelDone} />
    );
  const resultSlot =
    mode === "players" && playerResult ? (
      <RealPlayerResultCard player={playerResult.player} rarity={playerResult.rarity} />
    ) : stadiumOutcome ? (
      <MockResultCard outcome={stadiumOutcome} />
    ) : null;

  const errorText = mode === "players" && spinMutation.isError ? (spinMutation.error as Error).message : mode === "stadiums" ? "Стадионы: подключение к API — следующим шагом" : null;

  return (
    <>
      {tab === "play" && (
        <MockPlayScreen
          mode={mode}
          onModeChange={handleModeChange}
          multiplier={multiplier}
          onMultiplierChange={setMultiplier}
          selectedLabel={selectedLabel}
          spinPrice={mode === "players" ? spinAmount : 1_000}
          onOpenPicker={handleOpenPicker}
          onOpenMore={() => setTab("more")}
          reeling={reeling}
          hasResult={hasResult}
          reelSlot={reelSlot}
          resultSlot={resultSlot}
          onSpin={handleSpin}
          spinDisabled={mode === "players" && (!token || !leagueId || spinMutation.isPending)}
          errorText={errorText}
          level={level}
          xpPct={Math.round((xp / SPINS_PER_LEVEL) * 100)}
          luck={luck}
          coins={coins}
        />
      )}
      {tab === "more" && <MockMoreScreen onBack={() => setTab("play")} level={level} xp={xp} xpToNext={SPINS_PER_LEVEL} coins={coins} />}
      {(tab === "collection" || tab === "market" || tab === "friends") && (
        <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "#0E1013" }}>
          <p className="text-sm text-white/40">Экран «{tab}» — вне макета, не верстаем на этом шаге</p>
        </div>
      )}

      {pickerOpen && league && (
        <MockLeagueClubSheet
          mode={mode}
          leagues={pickerLeagues}
          clubs={pickerClubs}
          allLeaguesId={mode === "players" ? ALL_LEAGUES_ID : "all"}
          anyClubPriceMultiplier={1}
          selectedLeagueId={leagueId ?? pickerLeagues[0]?.id ?? ""}
          selectedClubId={clubId}
          onSelect={handlePickerSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <MockBottomNav tab={tab} onChange={setTab} />

      {!token && (
        <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+6px)] z-[60] rounded-[12px] bg-red-500/90 px-3 py-2 text-center text-[11px] font-bold text-white">
          Нет сессии — в консоли: window.__authStore.getState().setSession(token, user)
        </div>
      )}
    </>
  );
}
