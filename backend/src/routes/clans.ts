import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { CLAN_CREATE_COST, CLAN_NAME_MAX, calcUserSquadStrengths, isValidAvatarUrl, isValidTag } from "../lib/clans.js";

const router = Router();

router.get("/", async (_req, res) => {
  const clans = await prisma.clan.findMany({
    include: { members: { select: { userId: true } } },
  });

  const allUserIds = clans.flatMap((c) => c.members.map((m) => m.userId));
  const strengths = await calcUserSquadStrengths(allUserIds);

  const list = clans
    .map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      description: c.description,
      avatarUrl: c.avatarUrl,
      memberCount: c.members.length,
      totalPower: Math.round(c.members.reduce((sum, m) => sum + (strengths.get(m.userId) ?? 0), 0)),
      createdAt: c.createdAt,
    }))
    .sort((a, b) => b.totalPower - a.totalPower);

  res.json({ clans: list });
});

router.get("/mine", requireAuth, async (req, res) => {
  const membership = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (!membership) {
    res.json({ clan: null });
    return;
  }

  const clan = await prisma.clan.findUniqueOrThrow({
    where: { id: membership.clanId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, firstName: true, level: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  const strengths = await calcUserSquadStrengths(clan.members.map((m) => m.userId));

  res.json({
    clan: {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      description: clan.description,
      avatarUrl: clan.avatarUrl,
      leaderId: clan.leaderId,
      createdAt: clan.createdAt,
      totalPower: Math.round(clan.members.reduce((sum, m) => sum + (strengths.get(m.userId) ?? 0), 0)),
      members: clan.members.map((m) => ({
        userId: m.userId,
        name: m.user.username || m.user.firstName || "Игрок",
        level: m.user.level,
        role: m.role,
        joinedAt: m.joinedAt,
        squadStrength: strengths.get(m.userId) ?? 0,
      })),
    },
  });
});

const createSchema = z.object({
  name: z.string().min(2).max(CLAN_NAME_MAX),
  tag: z.string(),
  description: z.string().max(200).optional(),
  avatarUrl: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success || !isValidTag(parsed.data.tag)) {
    res.status(400).json({ error: "Некорректные название или тег клана" });
    return;
  }
  if (parsed.data.avatarUrl && !isValidAvatarUrl(parsed.data.avatarUrl)) {
    res.status(400).json({ error: "Ссылка на аватарку должна быть https-адресом картинки" });
    return;
  }

  const existing = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (existing) {
    res.status(400).json({ error: "Вы уже состоите в клане — сначала покиньте текущий" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.coins < CLAN_CREATE_COST) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const nameTaken = await prisma.clan.findFirst({
    where: { OR: [{ name: parsed.data.name }, { tag: parsed.data.tag }] },
  });
  if (nameTaken) {
    res.status(400).json({ error: "Название или тег уже заняты" });
    return;
  }

  const clan = await prisma.$transaction(async (tx) => {
    const created = await tx.clan.create({
      data: {
        name: parsed.data.name,
        tag: parsed.data.tag,
        description: parsed.data.description,
        avatarUrl: parsed.data.avatarUrl,
        leaderId: req.userId!,
      },
    });
    await tx.clanMember.create({ data: { userId: req.userId!, clanId: created.id, role: "LEADER" } });
    await tx.user.update({ where: { id: req.userId }, data: { coins: { decrement: CLAN_CREATE_COST } } });
    await tx.transaction.create({
      data: { userId: req.userId!, type: "CLAN", amount: -CLAN_CREATE_COST, meta: { action: "create", clanId: created.id } },
    });
    return created;
  });

  res.json({ clanId: clan.id });
});

const avatarSchema = z.object({ avatarUrl: z.string().nullable() });

router.post("/avatar", requireAuth, async (req, res) => {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success || (parsed.data.avatarUrl && !isValidAvatarUrl(parsed.data.avatarUrl))) {
    res.status(400).json({ error: "Ссылка на аватарку должна быть https-адресом картинки" });
    return;
  }

  const membership = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (!membership || membership.role !== "LEADER") {
    res.status(403).json({ error: "Только лидер клана может менять аватарку" });
    return;
  }

  await prisma.clan.update({ where: { id: membership.clanId }, data: { avatarUrl: parsed.data.avatarUrl } });
  res.json({ avatarUrl: parsed.data.avatarUrl });
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const existing = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (existing) {
    res.status(400).json({ error: "Вы уже состоите в клане" });
    return;
  }

  const clan = await prisma.clan.findUnique({ where: { id: req.params.id } });
  if (!clan) {
    res.status(404).json({ error: "Клан не найден" });
    return;
  }

  await prisma.clanMember.create({ data: { userId: req.userId!, clanId: clan.id, role: "MEMBER" } });
  res.json({ joined: true });
});

router.post("/leave", requireAuth, async (req, res) => {
  const membership = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (!membership) {
    res.status(400).json({ error: "Вы не состоите в клане" });
    return;
  }

  if (membership.role === "LEADER") {
    const others = await prisma.clanMember.findMany({
      where: { clanId: membership.clanId, userId: { not: req.userId } },
      orderBy: { joinedAt: "asc" },
      take: 1,
    });

    if (others.length > 0) {
      await prisma.$transaction([
        prisma.clanMember.update({ where: { userId: others[0].userId }, data: { role: "LEADER" } }),
        prisma.clan.update({ where: { id: membership.clanId }, data: { leaderId: others[0].userId } }),
        prisma.clanMember.delete({ where: { userId: req.userId } }),
      ]);
    } else {
      // последний участник — клан распускается
      await prisma.clan.delete({ where: { id: membership.clanId } });
    }
  } else {
    await prisma.clanMember.delete({ where: { userId: req.userId } });
  }

  res.json({ left: true });
});

router.post("/kick/:userId", requireAuth, async (req, res) => {
  const membership = await prisma.clanMember.findUnique({ where: { userId: req.userId } });
  if (!membership || membership.role !== "LEADER") {
    res.status(403).json({ error: "Только лидер клана может исключать участников" });
    return;
  }
  if (req.params.userId === req.userId) {
    res.status(400).json({ error: "Нельзя исключить самого себя — используйте выход из клана" });
    return;
  }

  const target = await prisma.clanMember.findUnique({ where: { userId: req.params.userId } });
  if (!target || target.clanId !== membership.clanId) {
    res.status(404).json({ error: "Участник не найден в вашем клане" });
    return;
  }

  await prisma.clanMember.delete({ where: { userId: req.params.userId } });
  res.json({ kicked: true });
});

export default router;
