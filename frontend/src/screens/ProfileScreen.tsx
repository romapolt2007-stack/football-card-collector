import { useState } from "react";
import confetti from "canvas-confetti";
import { CommunityPatchesScreen } from "./CommunityPatchesScreen";
import { FreeBonusRoulette } from "../components/profile/FreeBonusRoulette";
import { ProfileHero } from "../components/profile/ProfileHero";
import { XpBar } from "../components/profile/XpBar";
import { DailyBonusRoadmap } from "../components/profile/DailyBonusRoadmap";
import { QuestCard } from "../components/profile/QuestCard";
import { StatsTab } from "../components/profile/StatsTab";
import { CoinBalance } from "../components/common/CoinBalance";
import { PillTabs } from "../components/common/PillTabs";
import { useClaimQuest, useDailyClaim, useQuests, useUserStats } from "../lib/queries";
import { useClaimFreeBonus, useFreeBonusStatus, formatCountdown } from "../lib/useFreeBonus";
import { useClaimEmergencyBonus, useEmergencyBonusStatus } from "../lib/useLuckySpin";
import { useDuelStatus } from "../lib/useDuel";
import { useInsureStreak, useStreakStatus } from "../lib/useStreakInsurance";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import { useAuthStore } from "../store/useAuthStore";

function isSameUtcDay(a: Date, b: Date) {
  return Math.floor(a.getTime() / 86_400_000) === Math.floor(b.getTime() / 86_400_000);
}

type Tab = "profile" | "stats";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("profile");
  const { data: quests } = useQuests();
  const claimQuest = useClaimQuest();
  const dailyClaim = useDailyClaim();
  const freeBonus = useFreeBonusStatus();
  const claimFreeBonus = useClaimFreeBonus();
  const [showRoulette, setShowRoulette] = useState(false);
  const [showPatches, setShowPatches] = useState(false);
  const emergencyBonus = useEmergencyBonusStatus();
  const duelStatus = useDuelStatus();
  const streakStatus = useStreakStatus();
  const insureStreak = useInsureStreak();
  const claimEmergencyBonus = useClaimEmergencyBonus();
  const stats = useUserStats();

  if (!user) return null;

  const alreadyClaimedToday = Boolean(
    user.lastDailyClaimAt && isSameUtcDay(new Date(user.lastDailyClaimAt), new Date()),
  );

  function handleClaimFreeBonus() {
    haptics.impact("medium");
    setShowRoulette(true);
    claimFreeBonus.mutate();
  }

  function handleDailyClaim() {
    haptics.notify("success");
    sfx.goalRoar();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.4 }, colors: ["#ffd166", "#6ee7a0"] });
    dailyClaim.mutate();
  }

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-end gap-2">
        {duelStatus.data && (
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-gold">
            ⚡ {duelStatus.data.energy}/{duelStatus.data.energyMax}
          </span>
        )}
        <CoinBalance coins={user.coins} />
      </header>

      <ProfileHero user={user} />

      <PillTabs
        layoutId="profile-tabs"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "profile", label: "Профиль" },
          { id: "stats", label: "Статистика" },
        ]}
      />

      {tab === "stats" ? (
        stats.data ? (
          <StatsTab stats={stats.data} />
        ) : (
          <p className="text-sm text-white/50">Загрузка...</p>
        )
      ) : (
        <>
          <XpBar level={user.level} xp={user.xp} />

          <button
            onClick={() => setShowPatches(true)}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <span className="text-sm font-semibold">🧩 Патчи сообщества</span>
            <span className="text-xs text-white/40">Открыть →</span>
          </button>

          {emergencyBonus.data?.eligible && (
            <section
              className="rounded-xl border p-4"
              style={{
                borderColor: emergencyBonus.ready ? "#f87171" : "rgba(248,113,113,0.3)",
                background: "rgba(248,113,113,0.1)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">🆘 Монеты кончились?</p>
                  <p className="text-xs text-white/50">
                    {emergencyBonus.ready
                      ? `+${emergencyBonus.data.reward.toLocaleString("ru-RU")} монет прямо сейчас`
                      : `Можно забрать через ${formatCountdown(emergencyBonus.msLeft)}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.impact("medium");
                    claimEmergencyBonus.mutate();
                  }}
                  disabled={!emergencyBonus.ready || claimEmergencyBonus.isPending}
                  className="shrink-0 rounded-full bg-red-400 px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
                >
                  Забрать
                </button>
              </div>
            </section>
          )}

          <section
            className="rounded-xl border p-4"
            style={{
              borderColor: freeBonus.ready ? "var(--color-gold)" : "rgba(255,255,255,0.1)",
              background: freeBonus.ready ? "rgba(255,209,102,0.12)" : "rgba(255,255,255,0.05)",
              boxShadow: freeBonus.ready ? "0 0 18px rgba(255,209,102,0.3)" : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold ${freeBonus.ready ? "neon-pulse" : ""}`}>🎁 Бесплатный бонус</p>
                <p className="text-xs text-white/50">
                  {freeBonus.ready ? "Готов к получению!" : `Следующий через ${formatCountdown(freeBonus.msLeft)}`}
                </p>
              </div>
              <button
                onClick={handleClaimFreeBonus}
                disabled={!freeBonus.ready || claimFreeBonus.isPending}
                className="rounded-full bg-gold px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Забрать
              </button>
            </div>
          </section>

          {showRoulette && (
            <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 px-4">
              {!claimFreeBonus.data ? (
                <p className="text-sm text-white/40">Крутим...</p>
              ) : (
                <FreeBonusRoulette
                  prize={claimFreeBonus.data.prize}
                  onDone={() => {
                    setShowRoulette(false);
                    claimFreeBonus.reset();
                  }}
                />
              )}
            </div>
          )}

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Ежедневный бонус</p>
                <p className="text-xs text-white/50">Серия: {user.dailyStreak} / 7 дней</p>
              </div>
              <button
                onClick={handleDailyClaim}
                disabled={alreadyClaimedToday || dailyClaim.isPending}
                className="rounded-full bg-gold px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
                style={{ boxShadow: !alreadyClaimedToday ? "0 0 12px rgba(255,209,102,0.4)" : undefined }}
              >
                {alreadyClaimedToday ? "Получено" : "Забрать"}
              </button>
            </div>
            <DailyBonusRoadmap streak={user.dailyStreak} claimedToday={alreadyClaimedToday} />
            {dailyClaim.isSuccess && (
              <p className="mt-2 text-xs text-gold">+{dailyClaim.data.reward.toLocaleString("ru-RU")} монет!</p>
            )}
            {streakStatus.data?.canInsure && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-2">
                <p className="text-xs text-white/70">Пропущен день — застрахуйте серию, пока не сгорела</p>
                <button
                  onClick={() => insureStreak.mutate()}
                  disabled={insureStreak.isPending || (user.coins < streakStatus.data.cost)}
                  className="shrink-0 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold disabled:opacity-30"
                >
                  −{streakStatus.data.cost} 🪙
                </button>
              </div>
            )}
            {insureStreak.isSuccess && <p className="mt-2 text-xs text-emerald-400">Серия застрахована ✓</p>}
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-white/70">Ежедневные квесты</p>
            <div className="flex flex-col gap-2">
              {quests?.map((uq) => (
                <QuestCard
                  key={uq.id}
                  userQuest={uq}
                  isPending={claimQuest.isPending}
                  onClaim={() => claimQuest.mutate(uq.id)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {showPatches && <CommunityPatchesScreen onClose={() => setShowPatches(false)} />}
    </div>
  );
}
