/**
 * POST /api/admin/score
 * Scores all unscored picks for a finished match.
 *
 * Body: { matchId: string }
 *
 * Logic:
 *  - Looks up the match result (homeScore / awayScore)
 *  - Determines the correct outcome (HOME | DRAW | AWAY)
 *  - Marks each UserPick as correct/incorrect, sets pointsAwarded
 *  - Updates user.points and streak fields
 *  - Protected by ADMIN_API_KEY header
 *
 * Points: +3 correct, +0 incorrect.
 * Streak bonus: +1 extra point per consecutive correct pick (max +5).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const POINTS_CORRECT = 3;

function correctOutcome(homeScore: number, awayScore: number): "HOME" | "DRAW" | "AWAY" {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

export async function POST(req: NextRequest) {
  // Auth check
  const key = req.headers.get("x-admin-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { matchId?: string };
  const { matchId } = body;
  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  // Load match + all its prediction windows + unscored picks
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      windows: {
        include: {
          picks: {
            where: { scoredAt: null },   // only unscored picks
          },
        },
      },
    },
  });

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "FINISHED") {
    return NextResponse.json({ error: "Match is not FINISHED yet" }, { status: 409 });
  }
  if (match.homeScore === null || match.awayScore === null) {
    return NextResponse.json({ error: "Match has no score recorded" }, { status: 409 });
  }

  const outcome = correctOutcome(match.homeScore, match.awayScore);
  const now = new Date();

  // Collect all unscored picks across all windows for this match
  const allPicks = match.windows.flatMap(w => w.picks);
  if (allPicks.length === 0) {
    return NextResponse.json({ ok: true, scored: 0, outcome, message: "No unscored picks found" });
  }

  // Group picks by userId so we can update streaks once per user
  const byUser = new Map<string, typeof allPicks>();
  for (const pick of allPicks) {
    const arr = byUser.get(pick.userId) ?? [];
    arr.push(pick);
    byUser.set(pick.userId, arr);
  }

  let totalScored = 0;

  for (const [userId, picks] of byUser) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakCurrent: true, streakBest: true } });
    if (!user) continue;

    let streak = user.streakCurrent;
    let bestStreak = user.streakBest;
    let pointsDelta = 0;

    for (const pick of picks) {
      const isCorrect = pick.choice === outcome;
      const basePoints = isCorrect ? POINTS_CORRECT : 0;
      // Streak bonus: +1 per consecutive correct (max +5)
      const streakBonus = isCorrect ? Math.min(streak, 5) : 0;
      const total = basePoints + streakBonus;

      // Update streak counter
      if (isCorrect) {
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }

      pointsDelta += total;

      await prisma.userPick.update({
        where: { id: pick.id },
        data: {
          isCorrect,
          pointsAwarded: total,
          scoredAt: now,
        },
      });

      totalScored++;
    }

    // Update user totals in one write
    await prisma.user.update({
      where: { id: userId },
      data: {
        points:        { increment: pointsDelta },
        xp:            { increment: pointsDelta },
        streakCurrent: streak,
        streakBest:    bestStreak,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    matchId,
    outcome,
    scored: totalScored,
    users: byUser.size,
  });
}
