import { NextResponse } from "next/server";
import { auth } from "../../auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        points: true,
        xp: true,
        streakCurrent: true,
        streakBest: true,
        role: true,
        createdAt: true,
        awards: {
          orderBy: { awardedAt: "desc" },
          take: 20,
        },
        _count: {
          select: { picks: true },
        },
        picks: {
          orderBy: { submittedAt: "desc" },
          take: 20,
          select: {
            id: true,
            choice: true,
            isCorrect: true,
            pointsAwarded: true,
            submittedAt: true,
            scoredAt: true,
            window: {
              select: {
                kind: true,
                match: {
                  select: {
                    matchNumber: true,
                    stage: true,
                    homeSlot: { select: { label: true } },
                    awaySlot: { select: { label: true } },
                    homeScore: true,
                    awayScore: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rank lookup
    const rankRow = await prisma.leaderboardSnapshot.findFirst({
      where: { userId: user.id, period: "TOURNAMENT", periodKey: "wc2026" },
      select: { rank: true },
    });

    // Accuracy calculation
    const scored = user.picks.filter(p => p.isCorrect !== null);
    const correct = scored.filter(p => p.isCorrect).length;
    const accuracy = scored.length > 0
      ? Math.round((correct / scored.length) * 100)
      : null;

    return NextResponse.json({
      ...user,
      totalPicks: user._count.picks,
      rank: rankRow?.rank ?? null,
      accuracy,
    });

  } catch (err) {
    console.error("[profile/me] error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PATCH: update username
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { username } = body as { username?: string };

  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters, letters/numbers/underscore only." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { id: true, username: true },
    });
    return NextResponse.json({ ok: true, username: updated.username });
  } catch (err: unknown) {
    const isUniqueViolation = err instanceof Error && err.message.includes("Unique constraint");
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update username." }, { status: 500 });
  }
}