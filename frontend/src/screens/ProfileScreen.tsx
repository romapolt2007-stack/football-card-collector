import { useState } from "react";
import { FreeBonusRoulette } from "../components/profile/FreeBonusRoulette";
import { xpForLevel } from "../lib/xp";
import { useClaimQuest, useDailyClaim, useQuests } from "../lib/queries";
import { useClaimFreeBonus, useFreeBonusStatus, formatCountdown } from "../lib/useFreeBonus";
import { useClaimEmergencyBonus, useEmergencyBonusStatus } from "../lib/useLuckySpin";
import { useAuthStore } from "../store/useAuthStore";

function isSameUtcDay(a: Date, b: Date) {
  return Math.floor(a.getTime() / 86_400_000) === Math.floor(b.getTime() / 86_400_000);
}

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: quests } = useQuests();
  const claimQuest = useClaimQuest();
  const dailyClaim = useDailyClaim();
  const freeBonus = useFreeBonusStatus();
  const claimFreeBonus = useClaimFreeBonus();
  const [showRoulette, setShowRoulette] = useState(false);
  const emergencyBonus = useEmergencyBonusStatus();
  const claimEmergencyBonus = useClaimEmergencyBonus();

  if (!user) return null;

  const alreadyClaimedToday = Boolean(
    user.lastDailyClaimAt && isSameUtcDay(new Date(user.lastDailyClaimAt), new Date()),
  );

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const progress = Math.min(
    100,
    Math.round(((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  );

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">👤 Профиль</h1>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          {user.coins.toLocaleString("ru-RU")} 🪙
        </span>
      </header>

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
              onClick={() => claimEmergencyBonus.mutate()}
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
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">🎁 Бесплатный бонус</p>
            <p className="text-xs text-white/50">
              {freeBonus.ready ? "Готов к получению!" : `Следующий через ${formatCountdown(freeBonus.msLeft)}`}
            </p>
          </div>
          <button
            onClick={() => {
              setShowRoulette(true);
              claimFreeBonus.mutate();
            }}
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
        <p className="font-semibold">{user.firstName ?? user.username ?? "Игрок"}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-white/60">
          <span>Уровень {user.level}</span>
          <span>
            {user.xp} / {nextLevelXp} XP
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Ежедневный бонус</p>
            <p className="text-xs text-white/50">Серия: {user.dailyStreak} / 7 дней</p>
          </div>
          <button
            onClick={() => dailyClaim.mutate()}
            disabled={alreadyClaimedToday || dailyClaim.isPending}
            className="rounded-full bg-gold px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
          >
            {alreadyClaimedToday ? "Получено" : "Забрать"}
          </button>
        </div>
        {dailyClaim.isSuccess && (
          <p className="mt-2 text-xs text-gold">+{dailyClaim.data.reward.toLocaleString("ru-RU")} монет!</p>
        )}
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold text-white/70">Ежедневные квесты</p>
        <div className="flex flex-col gap-2">
          {quests?.map((uq) => (
            <div
              key={uq.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{uq.quest.title}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-pitch-blue"
                    style={{ width: `${Math.min(100, (uq.progress / uq.quest.target) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-white/40">
                  {uq.progress}/{uq.quest.target} · +{uq.quest.reward} 🪙
                </p>
              </div>
              <button
                onClick={() => claimQuest.mutate(uq.id)}
                disabled={!uq.completed || uq.claimed || claimQuest.isPending}
                className="ml-3 shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
              >
                {uq.claimed ? "Готово" : "Забрать"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
