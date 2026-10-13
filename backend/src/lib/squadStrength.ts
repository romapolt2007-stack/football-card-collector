import type { Card } from "@prisma/client";

type CardWithPlayer = Card & { player: { overall: number; club: { id: string; leagueId: string }; nation: string } };

/** Та же формула химии, что и во фронтенде (src/lib/chemistry.ts) — держать в синхроне. */
export function calcChemistry(starters: CardWithPlayer[]): number {
  if (starters.length === 0) return 0;
  const perPlayer = starters.map((p) => {
    let score = 0;
    for (const other of starters) {
      if (other === p) continue;
      if (other.player.club.id === p.player.club.id) score += 10;
      else {
        if (other.player.club.leagueId === p.player.club.leagueId) score += 5;
        if (other.player.nation === p.player.nation) score += 5;
      }
    }
    return Math.min(100, score);
  });
  return Math.round(perPlayer.reduce((a, b) => a + b, 0) / perPlayer.length);
}

/** Сила состава: средний OVR стартового состава + бонус от химии (до +10%). */
export function calcSquadStrength(starters: CardWithPlayer[]): { strength: number; avgOvr: number; chemistry: number } {
  if (starters.length === 0) return { strength: 0, avgOvr: 0, chemistry: 0 };
  const avgOvr = starters.reduce((sum, c) => sum + c.player.overall, 0) / starters.length;
  const chemistry = calcChemistry(starters);
  const strength = avgOvr * (1 + chemistry / 1000);
  return { strength: Math.round(strength * 10) / 10, avgOvr: Math.round(avgOvr), chemistry };
}
