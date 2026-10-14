import { motion } from "framer-motion";
import { useEffect } from "react";
import { sfx } from "../../lib/sfx";
import { useAuthStore } from "../../store/useAuthStore";

interface Props {
  opponentName: string;
  onDone: () => void;
  durationMs?: number;
}

/** Короткий выход команд перед матчем — свой клуб слева, бот справа, "VS" между ними. */
export function TeamWalkout({ opponentName, onDone, durationMs = 1900 }: Props) {
  const user = useAuthStore((s) => s.user);
  const [colorPrimary, colorSecondary] = (user?.teamColors ?? "#241a6b,#ffd166").split(",");
  const teamName = user?.teamName ?? "Моя команда";
  const teamLogo = user?.teamLogo ?? "⚽";

  useEffect(() => {
    sfx.whistle();
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="velvet-texture flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="flex w-full items-center justify-between">
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 text-4xl"
            style={{
              background: `linear-gradient(160deg, ${colorPrimary}, ${colorSecondary})`,
              borderColor: "rgba(255,255,255,0.5)",
              boxShadow: `0 0 26px ${colorPrimary}99, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.35)`,
            }}
          >
            <div className="foil-texture pointer-events-none absolute inset-0" />
            <span className="relative drop-shadow-lg">{teamLogo}</span>
          </div>
          <p className="max-w-[8rem] truncate text-center text-xs font-bold">{teamName}</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            background: "linear-gradient(160deg, #fff1c2 0%, #e3a825 50%, #8a5a06 100%)",
            boxShadow: "0 0 24px rgba(255,209,102,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <div className="foil-texture pointer-events-none absolute inset-0" />
          <span
            className="relative text-lg font-black text-pitch-dark"
            style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}
          >
            VS
          </span>
        </motion.div>

        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="circuit-texture relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 text-4xl"
            style={{
              background: "linear-gradient(160deg, #3a4654 0%, #1c232b 55%, #0a0d10 100%)",
              borderColor: "rgba(120,220,255,0.5)",
              boxShadow:
                "0 0 26px rgba(90,200,255,0.4), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.5)",
            }}
          >
            <span className="relative drop-shadow-lg">🤖</span>
          </div>
          <p className="max-w-[8rem] truncate text-center text-xs font-bold">{opponentName}</p>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs font-semibold text-white/40"
      >
        Команды выходят на поле...
      </motion.p>
    </div>
  );
}
