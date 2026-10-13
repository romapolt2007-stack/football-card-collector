import { useState } from "react";
import { useUpdateTeamProfile } from "../lib/queries";
import { haptics } from "../lib/telegram";

const COLOR_PRESETS: [string, string][] = [
  ["#1e3a8a", "#f59e0b"],
  ["#991b1b", "#f8fafc"],
  ["#064e3b", "#eab308"],
  ["#312e81", "#38bdf8"],
  ["#7c2d12", "#fde68a"],
  ["#4c0519", "#f472b6"],
  ["#1e1b4b", "#a3e635"],
  ["#0c4a6e", "#fef08a"],
];

const LOGO_PRESETS = ["⚽", "🦁", "🐺", "🦅", "🔱", "⚡", "🛡️", "👑", "🔥", "⭐"];

export function OnboardingScreen() {
  const updateTeam = useUpdateTeamProfile();
  const [name, setName] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [logo, setLogo] = useState(LOGO_PRESETS[0]);

  const [colorPrimary, colorSecondary] = COLOR_PRESETS[colorIndex];
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= 2 && !updateTeam.isPending;

  function handleCreate() {
    if (!canSubmit) return;
    haptics.impact("medium");
    updateTeam.mutate({ teamName: trimmedName, teamLogo: logo, teamColors: `${colorPrimary},${colorSecondary}` });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pb-10">
      <div className="text-center">
        <h1 className="text-xl font-extrabold">⚽ Создайте свой клуб</h1>
        <p className="mt-1 text-sm text-white/50">Название, цвета и эмблема — ваш клуб на годы вперёд</p>
      </div>

      <div
        className="flex h-24 w-24 items-center justify-center rounded-full border-2 text-4xl shadow-2xl"
        style={{
          background: `linear-gradient(160deg, ${colorPrimary}, ${colorSecondary})`,
          borderColor: "rgba(255,255,255,0.4)",
        }}
      >
        {logo}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/50">Название команды</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Например, Стальные Волки"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/50">Цвета клуба</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map(([p, s], i) => (
              <button
                key={i}
                onClick={() => {
                  haptics.select();
                  setColorIndex(i);
                }}
                className="h-9 w-9 rounded-full border-2"
                style={{
                  background: `linear-gradient(160deg, ${p}, ${s})`,
                  borderColor: colorIndex === i ? "#ffd166" : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/50">Эмблема</label>
          <div className="flex flex-wrap gap-2">
            {LOGO_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  haptics.select();
                  setLogo(emoji);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-lg"
                style={{
                  borderColor: logo === emoji ? "#ffd166" : "rgba(255,255,255,0.15)",
                  background: logo === emoji ? "rgba(255,209,102,0.12)" : "rgba(255,255,255,0.04)",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {updateTeam.isError && (
        <p className="text-sm text-red-400">{(updateTeam.error as Error)?.message ?? "Не удалось создать клуб"}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={!canSubmit}
        className="w-full max-w-xs rounded-full bg-gold py-3.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
      >
        Создать клуб
      </button>
    </div>
  );
}
