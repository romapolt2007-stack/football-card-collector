import { useState } from "react";
import { useApplyReferral, useReferralStatus } from "../lib/useReferrals";
import { useAuthStore } from "../store/useAuthStore";
import { haptics } from "../lib/telegram";

interface Props {
  onClose: () => void;
}

/** «Пригласи друга» — свой код + статистика многоуровневых реферальных бонусов. */
export function ReferralScreen({ onClose }: Props) {
  const { data } = useReferralStatus();
  const user = useAuthStore((s) => s.user);
  const applyReferral = useApplyReferral();
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  async function copyCode() {
    if (!data) return;
    haptics.impact("medium");
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер обмена недоступен (например, вне защищённого контекста) — код всё равно виден на экране
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">Пригласи друга</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Ваш код</p>
          <p className="mt-1 break-all text-xl font-extrabold tracking-wide text-gold">{data?.referralCode ?? "..."}</p>
          <button
            onClick={copyCode}
            className="spin-button-texture relative mt-4 overflow-hidden rounded-full bg-gold px-6 py-2.5 text-sm font-extrabold text-pitch-dark"
          >
            {copied ? "Скопировано ✓" : "Скопировать код"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-extrabold">{data?.invitedCount ?? 0}</p>
            <p className="text-[10px] text-white/50">Приглашено</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-extrabold text-gold">{(data?.totalEarned ?? 0).toLocaleString("ru-RU")} 🪙</p>
            <p className="text-[10px] text-white/50">Заработано</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/60">
          <p className="mb-1 font-semibold text-white">Как это работает</p>
          <p>
            Отправьте другу свой код — он вводит его здесь же, в игре. Вы получаете{" "}
            <span className="font-semibold text-gold">10 000 🪙</span> за каждого приглашённого.
          </p>
          <p className="mt-2">
            Многоуровневый бонус: если приглашённый вами друг потом сам пригласит кого-то — вы получите ещё{" "}
            <span className="font-semibold text-gold">3 000 🪙</span> за это, автоматически.
          </p>
        </div>

        {!user?.referredBy && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-sm font-semibold">Есть код друга?</p>
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Код приглашения"
                className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => {
                  if (!codeInput.trim()) return;
                  haptics.impact("medium");
                  applyReferral.mutate(codeInput.trim());
                }}
                disabled={applyReferral.isPending || !codeInput.trim()}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Применить
              </button>
            </div>
            {applyReferral.isError && (
              <p className="mt-2 text-xs text-red-400">{(applyReferral.error as Error)?.message ?? "Не удалось применить код"}</p>
            )}
            {applyReferral.isSuccess && <p className="mt-2 text-xs text-emerald-400">Код применён ✓</p>}
          </div>
        )}
      </div>
    </div>
  );
}
