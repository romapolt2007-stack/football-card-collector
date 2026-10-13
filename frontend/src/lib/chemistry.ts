import type { Card } from "../types/game";

/**
 * Химия состава: для каждого игрока стартового состава считаем связи
 * с остальными — одна лига/нация даёт +5, один клуб +10 (см. ТЗ).
 * Итог — среднее по всем игрокам, 0..100.
 */
export function calcChemistry(starters: (Card | null)[]): number {
  const players = starters.filter((c): c is Card => c !== null);
  if (players.length === 0) return 0;

  const perPlayer = players.map((p) => {
    let score = 0;
    for (const other of players) {
      if (other === p) continue;
      if (other.player.club.id === p.player.club.id) score += 10;
      else {
        if (other.player.club.league.id === p.player.club.league.id) score += 5;
        if (other.player.nation === p.player.nation) score += 5;
      }
    }
    return Math.min(100, score);
  });

  return Math.round(perPlayer.reduce((a, b) => a + b, 0) / perPlayer.length);
}

export function chemistryColor(value: number): string {
  if (value >= 70) return "#4ade80"; // зелёный
  if (value >= 40) return "#facc15"; // жёлтый
  return "#f87171"; // красный
}
