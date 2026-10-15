import { useBattlePassStatus, useBuyPremiumPass, useClaimBattlePass } from "../lib/useBattlePass";
import { haptics } from "../lib/telegram";

interface Props {
  onClose: () => void;
}

/** Зеркало backend/src/lib/battlePass.ts — держать в синхроне. */
function freeReward(level: number) {
  const guaranteedRarity = level === 30 ? "SILVER" : level % 5 === 0 ? "BRONZE" : null;
  return { coins: 100 + level * 20, guaranteedRarity };
}
function premiumReward(level: number) {
  const guaranteedRarity = level === 30 ? "LEGEND" : level % 10 === 0 ? "GOLD" : level % 5 === 0 ? "SILVER" : null;
  return { coins: 300 + level * 60, guaranteedRarity };
}

export function BattlePassScreen({ onClose }: Props) {
  const { data } = useBattlePassStatus();
  const buyPremium = useBuyPremiumPass();
  const claim = useClaimBattlePass();

  if (!data) return null;

  const xpIntoLevel = data.xp % data.xpPerLevel;
  const levels = Array.from({ length: data.maxLevel }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">🎫 Battle Pass</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-5 text-center">
          <p className="text-2xl font-extrabold text-gold">
            Уровень {data.level} / {data.maxLevel}
          </p>
          {data.level < data.maxLevel && (
            <>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gold"
                  style={{ width: `${Math.round((xpIntoLevel / data.xpPerLevel) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/50">
                {xpIntoLevel} / {data.xpPerLevel} XP до следующего уровня
              </p>
            </>
          )}
        </div>

        {!data.premium && (
          <button
            onClick={() => {
              haptics.impact("medium");
              buyPremium.mutate();
            }}
            disabled={buyPremium.isPending}
            className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            🎫 Купить Premium Pass — {data.premiumCost.toLocaleString("ru-RU")} 🪙
          </button>
        )}
        {buyPremium.isError && (
          <p className="text-center text-xs text-red-400">{(buyPremium.error as Error)?.message}</p>
        )}

        <div className="flex flex-col gap-1.5">
          {levels.map((level) => {
            const unlocked = data.level >= level;
            const free = freeReward(level);
            const premium = premiumReward(level);
            const freeClaimed = data.claimedFree.includes(level);
            const premiumClaimed = data.claimedPremium.includes(level);

            return (
              <div
                key={level}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                style={{
                  borderColor: unlocked ? "rgba(255,209,102,0.25)" : "rgba(255,255,255,0.08)",
                  background: unlocked ? "rgba(255,209,102,0.05)" : "transparent",
                  opacity: unlocked ? 1 : 0.4,
                }}
              >
                <span className="w-7 shrink-0 text-center text-xs font-bold text-white/50">{level}</span>

                <button
                  onClick={() => claim.mutate({ level, track: "FREE" })}
                  disabled={!unlocked || freeClaimed || claim.isPending}
                  className="flex flex-1 items-center justify-between rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs disabled:opacity-50"
                >
                  <span>
                    {free.coins} 🪙{free.guaranteedRarity ? ` · ${free.guaranteedRarity}` : ""}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {freeClaimed ? "✓" : unlocked ? "Забрать" : "🔒"}
                  </span>
                </button>

                <button
                  onClick={() => claim.mutate({ level, track: "PREMIUM" })}
                  disabled={!unlocked || !data.premium || premiumClaimed || claim.isPending}
                  className="flex flex-1 items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-2 py-1.5 text-xs disabled:opacity-50"
                >
                  <span className="text-gold">
                    {premium.coins} 🪙{premium.guaranteedRarity ? ` · ${premium.guaranteedRarity}` : ""}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {premiumClaimed ? "✓" : !data.premium ? "🎫" : unlocked ? "Забрать" : "🔒"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
