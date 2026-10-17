import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useLeagues, useStadiumBuff } from "../../lib/useMeta";
import { useSaveSpinPlayer, useSaveSpinStadium, useSpinPlayer, useSpinStadiumStaked, useSpinStatus } from "../../lib/useSpin";
import type { PlayerSpinResult, StadiumSpinResult } from "../../types/game";
import { MockBottomNav, type MockTab } from "./MockBottomNav";
import { MockLeagueClubSheet, type PickerClub, type PickerLeague } from "./MockLeagueClubSheet";
import { MockMoreScreen } from "./MockMoreScreen";
import { MockPlayScreen } from "./MockPlayScreen";
import { RealPlayerReel, RealPlayerResultCard } from "./RealPlayerReel";
import { RealStadiumReel, RealStadiumResultCard } from "./RealStadiumReel";
import { flagForLeague } from "./leagueFlags";

type SpinMode = "players" | "stadiums";
type Multiplier = 1 | 2 | 5 | 10;

const ALL_LEAGUES_ID = "__all__";
const SPINS_PER_LEVEL = 25; // держать в синхроне с backend/src/lib/spin.ts SPINS_PER_LEVEL

/** Харнесс макета "Номерок-стиль": оба режима подключены к реальному API — "Игроки" через
 * GET /api/meta/leagues + POST /api/spin/spin, "Стадионы" через те же лиги/клубы + новый
 * POST /api/stadiums/spin-staked (платный спин по ставке и фильтру, добавлен специально для
 * этого шага — раньше у стадионов был только бесплатный спин раз в 24ч без фильтров).
 * Не часть боевой навигации — открывается по ?mock=1. */
export function MockPreviewApp() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<MockTab>("play");
  const [mode, setMode] = useState<SpinMode>("players");
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const realLeagues = useLeagues();
  const status = useSpinStatus();
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
    if (!realLeagues.data?.length) return;
    if (!playerLeagueId) setPlayerLeagueId(realLeagues.data[0].id);
    if (!stadiumLeagueId) setStadiumLeagueId(realLeagues.data[0].id);
  }, [realLeagues.data, playerLeagueId, stadiumLeagueId]);

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
    // В режиме "Стадионы" клуб без стадиона в базе — тупиковый выбор (спин под него всегда пуст).
    .filter((c) => (mode === "players" ? true : c.stadiumCapacity != null));

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
    setStadiumResult(null);
  }

  function handleSpin() {
    if (!token || !leagueId) return;
    const filters = { leagueId: leagueId === ALL_LEAGUES_ID ? undefined : leagueId, clubId: clubId ?? undefined, amount: spinAmount };
    if (mode === "players") {
      setPlayerResult(null);
      spinPlayerMutation.mutate(filters, { onSuccess: (r) => { setPlayerResult(r); setReeling(true); } });
    } else {
      setStadiumResult(null);
      spinStadiumMutation.mutate(filters, { onSuccess: (r) => { setStadiumResult(r); setReeling(true); } });
    }
  }

  // Экран 1 в этом макете не спрашивает "продать/сохранить" — карта сразу уходит в коллекцию,
  // чтобы оплаченный спин никогда не терялся (бэкенд хранит только один "pending" результат за раз).
  function handlePlayerReelDone() {
    setReeling(false);
    savePlayerMutation.mutate();
  }

  function handleStadiumReelDone() {
    setReeling(false);
    saveStadiumMutation.mutate();
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
          onOpenPicker={handleOpenPicker}
          onOpenMore={() => setTab("more")}
          reeling={reeling}
          hasResult={hasResult}
          reelSlot={reelSlot}
          resultSlot={resultSlot}
          onSpin={handleSpin}
          spinDisabled={!token || !leagueId || activeMutation.isPending}
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
          allLeaguesId={ALL_LEAGUES_ID}
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
