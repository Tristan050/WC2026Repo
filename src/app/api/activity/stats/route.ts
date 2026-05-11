/**
 * GET /api/activity/stats
 * Returns real platform stats — used to replace the fake "predicting now" counter.
 *
 * Returns:
 *   { picksToday: number; picksTotal: number; usersTotal: number }
 *
 * Cached for 30 s (Next.js route cache).
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 30;

export async function GET() {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [picksToday, picksTotal, usersTotal] = await Promise.all([
      prisma.userPick.count({ where: { submittedAt: { gte: since24h } } }),
      prisma.userPick.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json(
      { picksToday, picksTotal, usersTotal },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ picksToday: 0, picksTotal: 0, usersTotal: 0 });
  }
}
