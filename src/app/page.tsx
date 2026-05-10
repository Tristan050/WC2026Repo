import { HomeClient } from "./home-client";

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

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function prefetchData(): Promise<{
  initialMatches: LiveMatch[];
  initialBracket: BracketStage[];
}> {
  try {
    const [mr, br] = await Promise.all([
      fetch(`${BASE}/api/matches/live`, {
        next: { revalidate: 30 },
      }),
      fetch(`${BASE}/api/matches/bracket`, {
        next: { revalidate: 60 },
      }),
    ]);
    const matches = mr.ok ? await mr.json() : [];
    const bracket = br.ok ? await br.json() : [];
    return {
      initialMatches: Array.isArray(matches) ? matches : [],
      initialBracket: Array.isArray(bracket) ? bracket : [],
    };
  } catch {
    return { initialMatches: [], initialBracket: [] };
  }
}

export default async function Page() {
  const { initialMatches, initialBracket } = await prefetchData();
  return (
    <HomeClient
      initialMatches={initialMatches}
      initialBracket={initialBracket}
    />
  );
}
