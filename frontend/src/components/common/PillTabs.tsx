import { motion } from "framer-motion";
import { haptics } from "../../lib/telegram";

interface PillTab {
  id: string;
  label: string;
}

interface Props {
  tabs: PillTab[];
  active: string;
  onChange: (id: string) => void;
  layoutId: string;
}

/** Переключатель-таблетка с мягким неоновым свечением активной вкладки и скользящей подсветкой. */
export function PillTabs({ tabs, active, onChange, layoutId }: Props) {
  return (
    <div className="flex gap-1.5 rounded-full border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== active) {
                haptics.select();
                onChange(tab.id);
              }
            }}
            className="relative flex-1 rounded-full py-2 text-sm font-semibold"
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="pill-glow absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,209,102,0.3), rgba(255,209,102,0.1))",
                  border: "1px solid rgba(255,209,102,0.6)",
                }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative transition-colors ${isActive ? "text-gold" : "text-white/50"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
