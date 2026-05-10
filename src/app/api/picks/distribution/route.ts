import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/picks/distribution?windowId=<id>
 * Returns the count of HOME / DRAW / AWAY picks for a prediction window.
 * Used to show real community pick percentages after a user submits.
 */
export async function GET(req: NextRequest) {
  const windowId = req.nextUrl.searchParams.get("windowId");
  if (!windowId) {
    return NextResponse.json({ error: "windowId is required" }, { status: 400 });
  }

  try {
    const counts = await prisma.userPick.groupBy({
      by: ["choice"],
      where: { predictionWindowId: windowId },
      _count: { choice: true },
    });

    const map: Record<string, number> = {};
    for (const row of counts) {
      map[row.choice] = row._count.choice;
    }

    const home = map["HOME"] ?? 0;
    const draw = map["DRAW"] ?? 0;
    const away = map["AWAY"] ?? 0;
    const total = home + draw + away;

    return NextResponse.json(
      { home, draw, away, total },
      {
        headers: {
          // Cache for 10s — fresh enough without hammering DB on every pick
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    console.error("[picks/distribution] error:", err);
    return NextResponse.json({ error: "Failed to fetch distribution" }, { status: 500 });
  }
}
