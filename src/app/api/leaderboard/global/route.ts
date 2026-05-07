import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const rows = await prisma.leaderboardSnapshot.findMany({
    where: { period: "TOURNAMENT", periodKey: "wc2026" },
    orderBy: { rank: "asc" },
    take: 100
  });
  return NextResponse.json(rows);
}
