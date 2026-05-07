import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const stageOrder = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL"
] as const;

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { stage: { in: [...stageOrder] } },
    include: { homeSlot: true, awaySlot: true },
    orderBy: [{ matchNumber: "asc" }]
  });

  const grouped = stageOrder.map((stage) => ({
    stage,
    matches: matches.filter((m) => m.stage === stage)
  }));

  return NextResponse.json(grouped);
}
