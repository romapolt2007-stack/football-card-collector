import { useState } from "react";
import { MOCK_ACTIVE_COLOR, MOCK_ACTIVE_TINT, MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_SHEET_BG } from "./theme";

export interface PickerLeague {
  id: string;
  name: string;
  flag: string;
}

export interface PickerClub {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  colorPrimary: string;
  colorSecondary: string;
  playerCount: number;
  stadiumCapacity: number | null;
  priceMultiplier: number;
}

type SpinMode = "players" | "stadiums";

interface Props {
  mode: SpinMode;
  leagues: PickerLeague[];
  clubs: PickerClub[];
  allLeaguesId: string;
  anyClubPriceMultiplier: number;
  selectedLeagueId: string;
  selectedClubId: string | null;
  onSelect: (leagueId: string, clubId: string | null) => void;
  onClose: () => void;
}

/** Шторка выбора лиги/клуба — данные (лиги, клубы) передаются снаружи: для "Игроков" это реальные
 * лиги и клубы с бэкенда (GET /api/meta/leagues), для "Стадионов" — пока локальный мок (см. MockPreviewApp). */
export function MockLeagueClubSheet({
  mode,
  leagues,
  clubs,
  allLeaguesId,
  anyClubPriceMultiplier,
  selectedLeagueId,
  selectedClubId,
  onSelect,
  onClose,
}: Props) {
  const [leagueId, setLeagueId] = useState(selectedLeagueId);
  const leagueClubs = clubs.filter((c) => c.leagueId === leagueId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-[24px] pb-[env(safe-area-inset-bottom)]"
        style={{ background: MOCK_SHEET_BG, border: `1px solid ${MOCK_PANEL_BORDER}`, borderBottom: "none" }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        {/* 2.1 — заголовок */}
        <div className="flex flex-col items-center gap-1 px-5 pb-3 pt-3 text-center">
          <h2 className="text-base font-extrabold">Что крутить</h2>
          <p className="text-xs text-white/45">
            {mode === "players" ? "Выбери лигу и клуб — или крути всю лигу" : "Выбери лигу и клуб — или крути все стадионы лиги"}
          </p>
        </div>

        {/* 2.2 — сетка лиг */}
        <div className="grid grid-cols-2 gap-2 px-5">
          {leagues.map((l) => {
            const active = leagueId === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLeagueId(l.id)}
                className="flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-left text-xs font-bold transition"
                style={{
                  background: active ? MOCK_ACTIVE_TINT : MOCK_PANEL,
                  border: `1px solid ${active ? MOCK_ACTIVE_COLOR : MOCK_PANEL_BORDER}`,
                  color: active ? MOCK_ACTIVE_COLOR : "white",
                }}
              >
                <span>{l.flag}</span>
                <span className="truncate">{l.name}</span>
              </button>
            );
          })}
        </div>

        {/* 2.3 / 2.4 — список клубов */}
        {leagueId !== allLeaguesId ? (
          <div className="mt-3 flex-1 overflow-y-auto px-5 pb-6">
            <button
              onClick={() => onSelect(leagueId, null)}
              className="mb-2 flex w-full items-center justify-between rounded-[14px] px-3 py-3"
              style={{
                background: !selectedClubId && selectedLeagueId === leagueId ? MOCK_ACTIVE_TINT : MOCK_PANEL,
                border: `1px solid ${MOCK_PANEL_BORDER}`,
              }}
            >
              <div className="text-left">
                <p className="text-sm font-bold">{mode === "players" ? "Любой клуб лиги" : "Все стадионы лиги"}</p>
                <p className="text-[11px] text-white/40">{mode === "players" ? "дешевле, любой игрок лиги" : "дешевле, любой стадион лиги"}</p>
              </div>
              <span className="text-xs font-semibold text-white/50">x{anyClubPriceMultiplier}</span>
            </button>

            {leagueClubs.map((c) => {
              const checked = selectedClubId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(leagueId, c.id)}
                  className="mb-2 flex w-full items-center gap-3 rounded-[14px] px-3 py-3"
                  style={{ background: checked ? MOCK_ACTIVE_TINT : MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
                    style={{ background: c.colorPrimary, color: c.colorSecondary }}
                  >
                    {c.shortName}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-[11px] text-white/40">
                      {mode === "players"
                        ? `${c.playerCount} игроков${c.stadiumCapacity != null ? ` · стадион ${c.stadiumCapacity.toLocaleString("ru-RU")}` : ""}`
                        : `стадион ${c.stadiumCapacity!.toLocaleString("ru-RU")} мест`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-white/50">x{c.priceMultiplier}</span>
                  {checked && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-[#2c1b00]" style={{ background: MOCK_ACTIVE_COLOR }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-5 pb-6 pt-3">
            <button
              onClick={() => onSelect(leagueId, null)}
              className="flex w-full items-center justify-between rounded-[14px] px-3 py-3"
              style={{ background: MOCK_ACTIVE_TINT, border: `1px solid ${MOCK_PANEL_BORDER}` }}
            >
              <div className="text-left">
                <p className="text-sm font-bold">{leagueId === allLeaguesId ? "Крутить все лиги" : "Крутить всю страну"}</p>
                <p className="text-[11px] text-white/40">{leagueId === allLeaguesId ? "дешевле всего" : "любой клуб этой лиги"}</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
