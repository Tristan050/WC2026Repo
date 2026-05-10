import { HomeClient } from "./home-client";
import { prisma } from "@/lib/db/prisma";

/* ─── Types (mirrors home-client.tsx) ─── */
type LiveMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  status: string;
  kickoffUtc: string;
  homeScore: number;
  awayScore: number;
  homeSlot: { label: string };
  awaySlot: { label: string };
  stadium: { city: string; name: string };
  windows?: { id: string; status: string; kind: string }[];
  oddsHomeWin?: number | null;
  oddsDraw?: number | null;
  oddsAwayWin?: number | null;
};

type BracketStage = {
  stage: string;
  matches: { id: string; homeSlot: { label: string }; awaySlot: { label: string }; status?: string }[];
};

const BRACKET_STAGES = [
  "GROUP", "ROUND_OF_32", "ROUND_OF_16",
  "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL",
] as const;

/* ─── Direct Prisma queries — no HTTP round-trip ─── */
async function prefetchData(): Promise<{
  initialMatches: LiveMatch[];
  initialBracket: BracketStage[];
}> {
  try {
    const now = new Date();

    const [rawMatches, bracketMatches] = await Promise.all([
      // Same logic as /api/matches/live: live or within 24 h window, else next upcoming
      prisma.match.findMany({
        where: {
          OR: [
            { status: { in: ["LIVE", "HALFTIME", "EXTRA_TIME", "PENALTIES"] } },
            {
              kickoffUtc: {
                gte: new Date(now.getTime() - 2 * 60 * 60 * 1000),  // 2 h ago
                lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 h ahead
              },
            },
          ],
        },
        orderBy: [{ kickoffUtc: "asc" }],
        take: 20,
        include: {
          stadium: true,
          homeSlot: true,
          awaySlot: true,
          windows: {
            where: { status: { in: ["OPEN", "SCHEDULED", "LOCKED"] } },
            orderBy: { openAt: "asc" },
            take: 5,
          },
        },
      }),

      // Bracket: all stages
      prisma.match.findMany({
        where: { stage: { in: [...BRACKET_STAGES] } },
        select: {
          id: true,
          stage: true,
          status: true,
          matchNumber: true,
          homeSlot: { select: { label: true } },
          awaySlot: { select: { label: true } },
        },
        orderBy: [{ matchNumber: "asc" }],
      }),
    ]);

    // Fall back to next 20 upcoming matches if nothing in the 24-h window
    const matches =
      rawMatches.length > 0
        ? rawMatches
        : await prisma.match.findMany({
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
                take: 5,
              },
            },
          });

    // Group bracket matches by stage
    const initialBracket: BracketStage[] = BRACKET_STAGES.map((stage) => ({
      stage,
      matches: bracketMatches.filter((m) => m.stage === stage),
    }));

    // Serialise Prisma Decimal → number and Date → ISO string for the client
    const initialMatches: LiveMatch[] = matches.map((m) => ({
      id: m.id,
      matchNumber: m.matchNumber ?? 0,
      stage: m.stage,
      status: m.status,
      kickoffUtc: m.kickoffUtc.toISOString(),
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      homeSlot: { label: m.homeSlot?.label ?? "" },
      awaySlot: { label: m.awaySlot?.label ?? "" },
      stadium: {
        city: m.stadium?.city ?? "",
        name: m.stadium?.name ?? "",
      },
      windows: (m.windows ?? []).map((w) => ({
        id: w.id,
        status: w.status,
        kind: w.kind,
      })),
      oddsHomeWin: m.oddsHomeWin ? Number(m.oddsHomeWin) : null,
      oddsDraw: m.oddsDraw ? Number(m.oddsDraw) : null,
      oddsAwayWin: m.oddsAwayWin ? Number(m.oddsAwayWin) : null,
    }));

    return { initialMatches, initialBracket };
  } catch (err) {
    console.error("[page] prefetchData failed:", err);
    return { initialMatches: [], initialBracket: [] };
  }
}

/* Revalidate every 30 s — matches update frequently during the tournament */
export const revalidate = 30;

export default async function Page() {
  const { initialMatches, initialBracket } = await prefetchData();
  return (
    <HomeClient
      initialMatches={initialMatches}
      initialBracket={initialBracket}
    />
  );
}
