import type { SbcDef } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { GoldCoinIcon } from "../common/GoldCoinIcon";

interface Props {
  sbc: SbcDef;
  completed: boolean;
  onOpen: () => void;
}

export function SbcTile({ sbc, completed, onOpen }: Props) {
  const rewardTheme = sbc.reward.guaranteedRarity ? RARITY_THEME[sbc.reward.guaranteedRarity] : null;
  const locked = completed && !sbc.repeatable;

  return (
    <button
      onClick={onOpen}
      disabled={locked}
      className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border-2 p-4 text-left disabled:opacity-50"
      style={{
        background: rewardTheme?.background ?? "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        borderColor: rewardTheme?.borderColor ?? "rgba(255,255,255,0.15)",
        boxShadow: rewardTheme?.glow ?? "none",
      }}
    >
      <div className="foil-texture pointer-events-none absolute inset-0" />

      {!sbc.repeatable && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white/70">
          {locked ? "Выполнено" : "Разовый"}
        </span>
      )}

      <span className="relative text-3xl">{sbc.icon}</span>
      <p className="relative text-sm font-extrabold" style={{ color: rewardTheme?.textColor }}>
        {sbc.title}
      </p>
      <p className="relative text-xs opacity-80" style={{ color: rewardTheme?.textColor }}>
        {sbc.description}
      </p>

      <div className="relative mt-1 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white">
        {sbc.reward.guaranteedRarity && (
          <span>
            {rewardTheme?.emoji} Гарантия {rewardTheme?.label}
          </span>
        )}
        {sbc.reward.coins ? (
          <span className="flex items-center gap-1">
            <GoldCoinIcon size={14} />
            {sbc.reward.coins.toLocaleString("ru-RU")}
          </span>
        ) : null}
      </div>
    </button>
  );
}
