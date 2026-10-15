import confetti from "canvas-confetti";
import { ProfileHero } from "../components/profile/ProfileHero";
import { DailyBonusRoadmap } from "../components/profile/DailyBonusRoadmap";
import { CoinBalance } from "../components/common/CoinBalance";
import { useDailyClaim, useDailyStatus } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import { useAuthStore } from "../store/useAuthStore";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const dailyStatus = useDailyStatus();
  const dailyClaim = useDailyClaim();

  if (!user) return null;

  function handleDailyClaim() {
    haptics.notify("success");
    sfx.goalRoar();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.4 }, colors: ["#ffd166", "#6ee7a0"] });
    dailyClaim.mutate();
  }

  const ready = dailyStatus.data?.ready ?? false;
  const streak = dailyStatus.data?.streak ?? user.dailyStreak;

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-end gap-2">
        <CoinBalance coins={user.coins} />
      </header>

      <ProfileHero user={user} />

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Ежедневный бонус</p>
            <p className="text-xs text-white/50">Серия: {streak} / 7 дней</p>
          </div>
          <button
            onClick={handleDailyClaim}
            disabled={!ready || dailyClaim.isPending}
            className="rounded-full bg-gold px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
            style={{ boxShadow: ready ? "0 0 12px rgba(255,209,102,0.4)" : undefined }}
          >
            {ready ? "Забрать" : "Получено"}
          </button>
        </div>
        <DailyBonusRoadmap streak={streak} claimedToday={!ready} />
        {dailyClaim.isSuccess && (
          <p className="mt-2 text-xs text-gold">+{dailyClaim.data.reward.toLocaleString("ru-RU")} монет!</p>
        )}
      </section>
    </div>
  );
}
