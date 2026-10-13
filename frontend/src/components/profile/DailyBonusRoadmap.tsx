interface Props {
  streak: number;
  claimedToday: boolean;
}

/** Визуальная дорожка 7-дневной серии — какие дни забраны, что ждёт на 7-й. */
export function DailyBonusRoadmap({ streak, claimedToday }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="mt-3 flex items-center justify-between gap-1">
      {days.map((day) => {
        const isDone = claimedToday ? day <= streak : day < streak || (streak === 0 && false);
        const isToday = claimedToday ? day === streak : day === streak + 1 || (streak === 7 && day === 1);
        const isJackpot = day === 7;
        return (
          <div key={day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm"
              style={{
                borderColor: isDone ? "#ffd166" : isToday ? "#5ad1ff" : "rgba(255,255,255,0.15)",
                background: isDone
                  ? "radial-gradient(circle at 35% 30%, #fff6d8, #e3a825 75%)"
                  : isJackpot
                    ? "radial-gradient(circle at 35% 30%, rgba(255,209,102,0.25), rgba(178,75,243,0.2))"
                    : "rgba(255,255,255,0.04)",
                boxShadow: isToday ? "0 0 10px rgba(90,209,255,0.5)" : undefined,
              }}
            >
              {isDone ? "✓" : isJackpot ? "👑" : day}
            </div>
            <span className="text-[9px] text-white/40">{day}д</span>
          </div>
        );
      })}
    </div>
  );
}
