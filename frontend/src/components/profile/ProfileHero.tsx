import { useState } from "react";
import { AvatarPicker } from "./AvatarPicker";
import { accountRating, rankForLevel } from "../../lib/profileRanks";
import { haptics } from "../../lib/telegram";
import type { GameUser } from "../../types/game";

interface Props {
  user: GameUser;
}

export function ProfileHero({ user }: Props) {
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const rank = rankForLevel(user.level);
  const rating = accountRating(user.level, user.xp);
  const name = user.teamName ?? user.firstName ?? user.username ?? "Legioner";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,209,102,0.12) 0%, transparent 55%), radial-gradient(circle at 80% 10%, rgba(90,209,255,0.12) 0%, transparent 50%), linear-gradient(160deg, #15102e 0%, #0b0f2b 100%)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            haptics.select();
            setPickingAvatar(true);
          }}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 text-4xl"
          style={{
            borderColor: "#ffd166",
            background: "radial-gradient(circle at 35% 30%, rgba(255,209,102,0.25), rgba(90,209,255,0.1))",
            boxShadow: "0 0 24px rgba(255,209,102,0.35)",
          }}
        >
          {user.avatarIcon ?? "⚽"}
          <span className="absolute -bottom-1 right-0 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold">
            ✏️
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{name}</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-gold">🏅 {rank}</p>
          <p className="mt-0.5 text-[11px] text-white/40">Рейтинг аккаунта: {rating.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      {pickingAvatar && <AvatarPicker current={user.avatarIcon} onClose={() => setPickingAvatar(false)} />}
    </div>
  );
}
