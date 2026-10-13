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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <div className="flex w-full items-center justify-between">
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl shadow-xl"
            style={{
              background: `linear-gradient(160deg, ${colorPrimary}, ${colorSecondary})`,
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            {teamLogo}
          </div>
          <p className="max-w-[8rem] truncate text-center text-xs font-bold">{teamName}</p>
        </motion.div>

        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
          className="text-xl font-black text-gold"
        >
          VS
        </motion.span>

        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-3xl shadow-xl">
            🤖
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
