import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const now = new Date();

  let matches = await prisma.match.findMany({
    where: {
      OR: [
        { status: { in: ["LIVE", "HALFTIME", "EXTRA_TIME", "PENALTIES"] } },
        {
          kickoffUtc: {
            gte: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      ]
    },
    orderBy: [{ kickoffUtc: "asc" }],
    take: 50,
    include: {
      stadium: true,
      homeSlot: true,
      awaySlot: true,
      windows: {
        where: { status: { in: ["OPEN", "SCHEDULED", "LOCKED"] } },
        orderBy: { openAt: "asc" },
        take: 5
      }
    }
  });

  if (matches.length === 0) {
    matches = await prisma.match.findMany({
      where: { kickoffUtc: { gte: now } },
      orderBy: [{ kickoffUtc: "asc" }],
      take: 20,
      include: {
        stadium: true,
        homeSlot: true,
        awaySlot: true,
        windows: {
          where: { status: { in: ["OPEN", "SCHEDULED", "LOCKED"] } },
          orderBy: { openAt: "asc" },
          take: 5
        }
      }
    });
  }

  return NextResponse.json(matches);
}
