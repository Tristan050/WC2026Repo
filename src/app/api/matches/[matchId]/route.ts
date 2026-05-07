import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      stadium: true,
      homeSlot: { include: { team: true } },
      awaySlot: { include: { team: true } },
      events: { orderBy: { sequence: "asc" }, take: 300 },
      windows: true
    }
  });

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json(match);
}
