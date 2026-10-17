import { useState, type ReactNode } from "react";
import { AzartBar } from "./AzartBar";
import { AzartDetailSheet } from "./AzartDetailSheet";
import { MockRedDot } from "./MockBottomNav";
import { MOCK_BANNERS, MOCK_PREVIEW_PLAYER } from "./mockData";
import { MOCK_ACTIVE_COLOR, MOCK_ACTIVE_TINT, MOCK_BG, MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_PRIMARY_GRADIENT, MOCK_PRIMARY_TEXT } from "./theme";

type SpinMode = "players" | "stadiums";
type Multiplier = 1 | 2 | 5 | 10;

interface Props {
  mode: SpinMode;
  onModeChange: (mode: SpinMode) => void;
  multiplier: Multiplier;
  onMultiplierChange: (m: Multiplier) => void;
  selectedLabel: string;
  spinPrice: number;
  onOpenPicker: () => void;
  onOpenMore: () => void;
  reeling: boolean;
  hasResult: boolean;
  /** Содержимое барабана/результата делегировано наружу — у "Игроков" оно реальное (с бэкенда),
   * у "Стадионов" пока моковое (см. комментарий в MockPreviewApp про экономику стадионов). */
  reelSlot: ReactNode;
  resultSlot: ReactNode;
  onSpin: () => void;
  spinDisabled?: boolean;
  errorText?: string | null;
  hotStreak: number;
  hotStreakThreshold: number;
  coins: number;
}

/** Силуэт игрока — собственная абстрактная графика, не фото. */
function PlayerSilhouette() {
  return (
    <svg viewBox="0 0 100 130" className="h-24 w-20 opacity-70">
      <circle cx="50" cy="26" r="16" fill={MOCK_ACTIVE_COLOR} opacity="0.35" />
      <path d="M50 44c-16 0-28 12-30 30l-4 40h68l-4-40c-2-18-14-30-30-30z" fill={MOCK_ACTIVE_COLOR} opacity="0.22" />
      <path d="M50 44c-16 0-28 12-30 30l-4 40h68l-4-40c-2-18-14-30-30-30z" fill="none" stroke={MOCK_ACTIVE_COLOR} strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

/** Силуэт трибун стадиона — собственная абстрактная графика. */
function StadiumSilhouette() {
  return (
    <svg viewBox="0 0 120 90" className="h-20 w-28 opacity-70">
      <path d="M4 70 Q60 20 116 70 L116 80 Q60 40 4 80 Z" fill={MOCK_ACTIVE_COLOR} opacity="0.25" />
      <path d="M4 70 Q60 20 116 70" fill="none" stroke={MOCK_ACTIVE_COLOR} strokeWidth="2" opacity="0.6" />
      <circle cx="60" cy="58" r="10" fill="none" stroke={MOCK_ACTIVE_COLOR} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function MockPlayScreen({
  mode,
  onModeChange,
  multiplier,
  onMultiplierChange,
  selectedLabel,
  spinPrice,
  onOpenPicker,
  onOpenMore,
  reeling,
  hasResult,
  reelSlot,
  resultSlot,
  onSpin,
  spinDisabled,
  errorText,
  hotStreak,
  hotStreakThreshold,
  coins,
}: Props) {
  const [multiplierOpen, setMultiplierOpen] = useState(false);
  const [azartOpen, setAzartOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ background: MOCK_BG }}>
      {/* 1.1 — верхняя панель */}
      <div className="flex items-center justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <button onClick={onOpenMore} className="relative flex h-9 w-9 items-center justify-center rounded-full" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
          <span className="text-base leading-none">☰</span>
          <MockRedDot />
        </button>

        <AzartBar streak={hotStreak} threshold={hotStreakThreshold} onOpen={() => setAzartOpen(true)} />

        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] text-white/40">Баланс</span>
          <span className="text-sm font-extrabold">{coins.toLocaleString("ru-RU")} 🪙</span>
        </div>
      </div>

      {/* 1.2 — переключатель режима, на всю ширину */}
      <div className="mt-3 flex items-center gap-2 px-3">
        <div className="flex flex-1 rounded-[12px] p-1" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
          {(["players", "stadiums"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              disabled={reeling}
              className="flex-1 rounded-[9px] py-2 text-xs font-bold transition disabled:opacity-50"
              style={{ background: mode === m ? MOCK_ACTIVE_TINT : "transparent", color: mode === m ? MOCK_ACTIVE_COLOR : "rgba(255,255,255,0.55)" }}
            >
              {m === "players" ? "Игроки" : "Стадионы"}
            </button>
          ))}
        </div>
      </div>

      {/* 1.3 — баннеры */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {MOCK_BANNERS.map((b) => (
          <div
            key={b.id}
            className="relative flex w-[78%] shrink-0 flex-col justify-center rounded-[14px] px-4 py-3"
            style={{ background: `linear-gradient(135deg, ${MOCK_PANEL}, #15303a)`, border: "1px solid rgba(255,209,102,0.3)" }}
          >
            <p className="text-xs font-extrabold">{b.title}</p>
            <p className="mt-0.5 text-[10px] text-white/50">{b.subtitle}</p>
            {b.kind === "ad" && <span className="absolute bottom-1.5 right-2.5 text-[8px] text-white/30">РЕКЛАМА</span>}
          </div>
        ))}
      </div>

      {/* 1.4 — превью / барабан */}
      <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-2 px-3">
        <div className="flex w-full items-center justify-between text-[11px] text-white/40">
          <span>Готов к игре</span>
          <button className="text-white/50">—</button>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i < 2 ? MOCK_ACTIVE_COLOR : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        {reeling ? (
          reelSlot
        ) : hasResult ? (
          resultSlot
        ) : (
          <div
            className="relative flex h-[220px] w-[170px] flex-col items-center justify-center gap-2 rounded-[16px]"
            style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
          >
            {mode === "players" ? <PlayerSilhouette /> : <StadiumSilhouette />}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-white/30">??</span>
              {mode === "players" ? (
                <>
                  <span className="text-[11px] font-bold">{MOCK_PREVIEW_PLAYER.club}</span>
                  <span className="text-[10px] text-white/40">{MOCK_PREVIEW_PLAYER.leagueFlag} {MOCK_PREVIEW_PLAYER.position}</span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold">??? мест</span>
                  <span className="text-[10px] text-white/40">🏴 Англия</span>
                </>
              )}
            </div>
          </div>
        )}
        <p className="text-[11px] text-white/35">{reeling ? "Крутим..." : hasResult ? "Твой результат" : "Пример карточки"}</p>
        {!reeling && <p className="text-xs text-white/50">{hasResult ? "Жми «Крутить» ещё раз" : "Жми «Крутить»"}</p>}
        {errorText && <p className="max-w-[260px] text-center text-xs text-red-400">{errorText}</p>}
      </div>

      {/* 1.5 — параметры */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <button
          onClick={onOpenPicker}
          disabled={reeling}
          className="flex flex-1 items-center justify-between rounded-[12px] px-3 py-2.5 text-xs font-semibold disabled:opacity-50"
          style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
        >
          <span className="truncate">{selectedLabel}</span>
          <span className="text-white/40">⌄</span>
        </button>
        <button
          onClick={() => setMultiplierOpen((v) => !v)}
          className="relative flex items-center gap-1 rounded-[12px] px-3 py-2.5 text-xs font-semibold"
          style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
        >
          Множитель x{multiplier} <span className="text-white/40">⌄</span>
          {multiplierOpen && (
            <div className="absolute bottom-[110%] right-0 flex flex-col overflow-hidden rounded-[10px]" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
              {([1, 2, 5, 10] as const).map((m) => (
                <button
                  key={m}
                  disabled={m !== 1}
                  onClick={() => {
                    onMultiplierChange(m);
                    setMultiplierOpen(false);
                  }}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-left text-xs font-semibold hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  x{m} {m !== 1 && <span className="text-[9px] text-white/40">скоро</span>}
                </button>
              ))}
            </div>
          )}
        </button>
        <button
          disabled
          className="shrink-0 rounded-[12px] px-3 py-2.5 text-xs font-bold opacity-30"
          style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
        >
          5x
        </button>
      </div>

      {/* 1.6 — главная кнопка */}
      <div className="px-3 pb-[96px]">
        <button
          onClick={onSpin}
          disabled={reeling || spinDisabled}
          className="flex w-full items-center justify-between rounded-[14px] px-6 py-4 text-base font-extrabold disabled:opacity-60"
          style={{ background: MOCK_PRIMARY_GRADIENT, color: MOCK_PRIMARY_TEXT, textShadow: "0 1px 2px rgba(255,255,255,0.35)" }}
        >
          {reeling ? "Крутим..." : "Крутить"}
          {!reeling && <span className="rounded-[10px] bg-black/25 px-3 py-1.5 text-sm">{spinPrice.toLocaleString("ru-RU")} 🪙</span>}
        </button>
      </div>

      {azartOpen && <AzartDetailSheet streak={hotStreak} threshold={hotStreakThreshold} onClose={() => setAzartOpen(false)} />}
    </div>
  );
}
