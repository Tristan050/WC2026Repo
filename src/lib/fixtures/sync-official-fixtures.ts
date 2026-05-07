import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

export type FixtureOverride = {
  matchNumber: number;
  stage: "GROUP" | "ROUND_OF_32" | "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
  kickoffUtc: string;
  kickoffTimezone: string;
  stadiumSlug: string;
  homeSlotId: string;
  awaySlotId: string;
};

export async function syncOfficialFixturesFromFile(filePath?: string) {
  const fixturePath = filePath ?? path.join(process.cwd(), "seeds", "json", "worldcup_2026_official_fixtures.json");
  const raw = fs.readFileSync(fixturePath, "utf8");
  const parsed = JSON.parse(raw) as { fixtures: FixtureOverride[] };

  const stadiums = await prisma.stadium.findMany({ select: { id: true, slug: true } });
  const stadiumBySlug = new Map(stadiums.map((s) => [s.slug, s.id]));

  let updated = 0;
  for (const f of parsed.fixtures) {
    const stadiumId = stadiumBySlug.get(f.stadiumSlug);
    if (!stadiumId) throw new Error(`Unknown stadium slug: ${f.stadiumSlug}`);

    await prisma.match.update({
      where: { matchNumber: f.matchNumber },
      data: {
        stage: f.stage,
        kickoffUtc: new Date(f.kickoffUtc),
        kickoffTimezone: f.kickoffTimezone,
        stadiumId,
        homeSlotId: f.homeSlotId,
        awaySlotId: f.awaySlotId
      }
    });

    updated += 1;
  }

  return { updated };
}
