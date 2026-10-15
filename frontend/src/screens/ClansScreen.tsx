import { useState } from "react";
import { useClanList, useCreateClan, useJoinClan, useKickMember, useLeaveClan, useMyClan } from "../lib/useClans";
import { useAuthStore } from "../store/useAuthStore";
import { haptics } from "../lib/telegram";

interface Props {
  onClose: () => void;
}

const CREATE_COST = 5000;

/** Кланы: создание/вступление, рейтинг по суммарной силе составов участников. */
export function ClansScreen({ onClose }: Props) {
  const myClan = useMyClan();
  const clanList = useClanList();
  const createClan = useCreateClan();
  const joinClan = useJoinClan();
  const leaveClan = useLeaveClan();
  const kickMember = useKickMember();
  const user = useAuthStore((s) => s.user);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  function submitCreate() {
    if (!name.trim() || !tag.trim()) return;
    haptics.impact("medium");
    createClan.mutate(
      { name: name.trim(), tag: tag.trim().toUpperCase() },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  if (myClan.data) {
    const clan = myClan.data;
    const isLeader = clan.leaderId === user?.id;
    return (
      <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
          <h2 className="text-base font-bold">⚔️ Клан</h2>
          <button onClick={onClose} className="text-sm text-white/50">
            Закрыть
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-10">
          <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">[{clan.tag}]</p>
            <p className="mt-1 text-2xl font-extrabold text-gold">{clan.name}</p>
            {clan.description && <p className="mt-1 text-xs text-white/50">{clan.description}</p>}
            <p className="mt-2 text-sm text-white/60">
              💪 {clan.totalPower.toLocaleString("ru-RU")} суммарной силы · {clan.members.length} участников
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {clan.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {m.role === "LEADER" ? "👑" : "👤"} {m.name}
                  <span className="text-xs text-white/40">Ур. {m.level}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{Math.round(m.squadStrength)} 💪</span>
                  {isLeader && m.role !== "LEADER" && (
                    <button
                      onClick={() => {
                        haptics.impact("heavy");
                        kickMember.mutate(m.userId);
                      }}
                      className="text-xs text-red-400"
                    >
                      Исключить
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              haptics.impact("heavy");
              leaveClan.mutate();
            }}
            disabled={leaveClan.isPending}
            className="rounded-full border border-red-400/40 bg-red-400/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-30"
          >
            {isLeader && clan.members.length > 1 ? "Передать лидерство и выйти" : isLeader ? "Распустить клан" : "Покинуть клан"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">⚔️ Кланы</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-10">
        {showCreate ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm font-semibold">Создать клан — {CREATE_COST.toLocaleString("ru-RU")} 🪙</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название клана"
              className="mb-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="Тег (2-5 символов)"
              maxLength={5}
              className="mb-3 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm uppercase outline-none"
            />
            {createClan.isError && (
              <p className="mb-2 text-xs text-red-400">{(createClan.error as Error)?.message ?? "Не удалось создать клан"}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={submitCreate}
                disabled={createClan.isPending || !name.trim() || !tag.trim() || (user?.coins ?? 0) < CREATE_COST}
                className="flex-1 rounded-full bg-gold py-2.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Создать
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark"
          >
            + Создать клан ({CREATE_COST.toLocaleString("ru-RU")} 🪙)
          </button>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Рейтинг кланов</p>
        <div className="flex flex-col gap-2">
          {clanList.data?.length === 0 && <p className="text-sm text-white/40">Пока нет ни одного клана — создайте первый</p>}
          {clanList.data?.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  #{i + 1} [{c.tag}] {c.name}
                </span>
                <span className="text-xs text-white/40">{c.memberCount} участников · {c.totalPower.toLocaleString("ru-RU")} 💪</span>
              </span>
              <button
                onClick={() => {
                  haptics.impact("medium");
                  joinClan.mutate(c.id);
                }}
                disabled={joinClan.isPending}
                className="shrink-0 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold disabled:opacity-30"
              >
                Вступить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
