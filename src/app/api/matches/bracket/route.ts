import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const stageOrder = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { stage: { in: [...stageOrder] } },
      select: {
        id: true,
        stage: true,
        status: true,
        matchNumber: true,
        homeSlot: { select: { label: true } },
        awaySlot: { select: { label: true } },
      },
      orderBy: [{ matchNumber: "asc" }],
    });

    const grouped = stageOrder.map((stage) => ({
      stage,
      matches: matches.filter((m) => m.stage === stage),
    }));

    return NextResponse.json(grouped, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
