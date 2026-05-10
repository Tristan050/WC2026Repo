import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 60; // ISR: revalidate every 60s

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period    = (searchParams.get("period") ?? "TOURNAMENT") as "DAILY" | "MATCHDAY" | "TOURNAMENT";
  const periodKey = searchParams.get("key") ?? "wc2026";
  const limit     = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  try {
    // First check if we have snapshots
    const snapshots = await prisma.leaderboardSnapshot.findMany({
      where:   { period, periodKey },
      orderBy: { rank: "asc" },
      take:    limit,
    });

    // If no snapshots yet, fall back to live user rankings.
    // Show everyone who has made at least one pick — not just users with points > 0,
    // because picks are submitted before matches finish and scoring runs.
    if (snapshots.length === 0) {
      const users = await prisma.user.findMany({
        where:   { picks: { some: {} } },   // at least 1 pick submitted
        orderBy: [
          { points: "desc" },
          { streakCurrent: "desc" },
          { createdAt: "asc" },             // tiebreak: earliest signup first
        ],
        take:    limit,
        select: {
          id:            true,
          name:          true,
          username:      true,
          image:         true,
          points:        true,
          xp:            true,
          streakCurrent: true,
          streakBest:    true,
          _count: {
            select: { picks: true },
          },
        },
      });

      const rows = users.map((u, idx) => ({
        rank:          idx + 1,
        userId:        u.id,
        name:          u.name ?? u.username ?? `Fan #${u.id.slice(0, 6)}`,
        username:      u.username,
        image:         u.image,
        points:        u.points,
        xp:            u.xp,
        streakCurrent: u.streakCurrent,
        streakBest:    u.streakBest,
        totalPicks:    u._count.picks,
      }));

      return NextResponse.json({ period, periodKey, rows, source: "live" });
    }

    // Enrich snapshots with user profile data
    const userIds = snapshots.map(s => s.userId);
    const users   = await prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: {
        id:            true,
        name:          true,
        username:      true,
        image:         true,
        streakCurrent: true,
        streakBest:    true,
        _count: { select: { picks: true } },
      },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const rows = snapshots.map(s => {
      const u = userMap[s.userId];
      return {
        rank:          s.rank,
        userId:        s.userId,
        name:          u?.name ?? u?.username ?? `Fan #${s.userId.slice(0, 6)}`,
        username:      u?.username ?? null,
        image:         u?.image    ?? null,
        points:        s.points,
        xp:            s.xp,
        streakCurrent: u?.streakCurrent ?? 0,
        streakBest:    u?.streakBest    ?? 0,
        totalPicks:    u?._count.picks  ?? 0,
      };
    });

    return NextResponse.json({ period, periodKey, rows, source: "snapshot" });

  } catch (err) {
    console.error("[leaderboard] error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}