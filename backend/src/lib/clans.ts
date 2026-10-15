import { prisma } from "./prisma.js";
import { calcSquadStrength } from "./squadStrength.js";
import type { SquadSlotJson } from "./squadTypes.js";

export const CLAN_CREATE_COST = 7000;
export const CLAN_NAME_MAX = 30;
export const CLAN_TAG_MIN = 2;
export const CLAN_TAG_MAX = 5;

const TAG_PATTERN = /^[A-Za-zА-Яа-яЁё0-9]+$/;

export function isValidTag(tag: string): boolean {
  return tag.length >= CLAN_TAG_MIN && tag.length <= CLAN_TAG_MAX && TAG_PATTERN.test(tag);
}

export const CLAN_AVATAR_URL_MAX = 500;

/** Позволяем любую https-ссылку на картинку (включая t.me/Telegram file-ссылки) — без загрузки файлов на свой сервер. */
export function isValidAvatarUrl(url: string): boolean {
  if (url.length === 0 || url.length > CLAN_AVATAR_URL_MAX) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Суммарная сила активных составов участников — один проход, без N+1 на каждого отдельно. */
export async function calcUserSquadStrengths(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const squads = await prisma.squad.findMany({ where: { userId: { in: userIds }, isActive: true } });
  const starterIdsBySquad = new Map<string, string[]>();
  const allCardIds = new Set<string>();

  for (const squad of squads) {
    const slots = squad.slots as unknown as SquadSlotJson[];
    const starterIds = slots
      .filter((s) => !s.slotId.startsWith("BENCH"))
      .map((s) => s.cardId)
      .filter((id): id is string => Boolean(id));
    starterIdsBySquad.set(squad.userId, starterIds);
    starterIds.forEach((id) => allCardIds.add(id));
  }

  const cards = await prisma.card.findMany({
    where: { id: { in: [...allCardIds] } },
    include: { player: { include: { club: true } } },
  });
  const cardById = new Map(cards.map((c) => [c.id, c]));

  const strengthByUser = new Map<string, number>();
  for (const [userId, starterIds] of starterIdsBySquad) {
    const starters = starterIds.map((id) => cardById.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (starters.length < 7) continue;
    const { strength } = calcSquadStrength(starters as Parameters<typeof calcSquadStrength>[0]);
    strengthByUser.set(userId, strength);
  }
  return strengthByUser;
}
