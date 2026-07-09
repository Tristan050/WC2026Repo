import { PrismaClient, MatchStatus, PredictionStatus, TeamSlotKind, WindowStatus } from "@prisma/client";

const prisma = new PrismaClient();

const QUARTER_FINALS = [
  {
    matchNumber: 97,
    homeFromMatch: 89,
    awayFromMatch: 90,
    home: { name: "Morocco", fifaCode: "MAR" },
    away: { name: "France", fifaCode: "FRA" },
    kickoffUtc: "2026-07-09T20:00:00.000Z",
    stadiumSlug: "boston-stadium",
    odds: { home: 4.6, draw: 3.55, away: 1.82 }
  },
  {
    matchNumber: 98,
    homeFromMatch: 93,
    awayFromMatch: 94,
    home: { name: "Spain", fifaCode: "ESP" },
    away: { name: "Belgium", fifaCode: "BEL" },
    kickoffUtc: "2026-07-10T19:00:00.000Z",
    stadiumSlug: "los-angeles-stadium",
    odds: { home: 1.95, draw: 3.5, away: 4.1 }
  },
  {
    matchNumber: 99,
    homeFromMatch: 91,
    awayFromMatch: 92,
    home: { name: "Norway", fifaCode: "NOR" },
    away: { name: "England", fifaCode: "ENG" },
    kickoffUtc: "2026-07-11T21:00:00.000Z",
    stadiumSlug: "miami-stadium",
    odds: { home: 3.35, draw: 3.35, away: 2.2 }
  },
  {
    matchNumber: 100,
    homeFromMatch: 95,
    awayFromMatch: 96,
    home: { name: "Argentina", fifaCode: "ARG" },
    away: { name: "Switzerland", fifaCode: "SUI" },
    kickoffUtc: "2026-07-12T01:00:00.000Z",
    stadiumSlug: "kansas-city-stadium",
    odds: { home: 1.78, draw: 3.7, away: 4.75 }
  }
] as const;

const FUTURE_MATCHES = [
  { matchNumber: 101, kickoffUtc: "2026-07-14T20:00:00.000Z", stage: "SEMI_FINAL", stadiumSlug: "dallas-stadium" },
  { matchNumber: 102, kickoffUtc: "2026-07-15T20:00:00.000Z", stage: "SEMI_FINAL", stadiumSlug: "atlanta-stadium" },
  { matchNumber: 103, kickoffUtc: "2026-07-18T20:00:00.000Z", stage: "THIRD_PLACE", stadiumSlug: "miami-stadium" },
  { matchNumber: 104, kickoffUtc: "2026-07-19T20:00:00.000Z", stage: "FINAL", stadiumSlug: "new-york-new-jersey-stadium" }
] as const;

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureTeamSlotFromMatch(sourceMatchNumber: number, team: { name: string; fifaCode: string }) {
  const teamRow = await prisma.team.upsert({
    where: { fifaCode: team.fifaCode },
    update: { name: team.name, slug: slugify(team.name), isQualified: true },
    create: { fifaCode: team.fifaCode, name: team.name, slug: slugify(team.name), isQualified: true }
  });

  await prisma.teamSlot.upsert({
    where: { id: `slot_winner_m${sourceMatchNumber}` },
    update: {
      kind: TeamSlotKind.TEAM,
      label: team.name,
      teamId: teamRow.id,
      resolvedAt: new Date("2026-07-08T23:00:00.000Z")
    },
    create: {
      id: `slot_winner_m${sourceMatchNumber}`,
      kind: TeamSlotKind.TEAM,
      label: team.name,
      sourceMatchId: `match_${String(sourceMatchNumber).padStart(3, "0")}`,
      sourceMatchOutcome: "WINNER",
      teamId: teamRow.id,
      resolvedAt: new Date("2026-07-08T23:00:00.000Z")
    }
  });
}

async function setWindowState(matchNumberFrom: number, matchNumberTo: number, status: WindowStatus) {
  await prisma.predictionWindow.updateMany({
    where: {
      match: {
        matchNumber: {
          gte: matchNumberFrom,
          lte: matchNumberTo
        }
      }
    },
    data: {
      status,
      openAt: new Date("2026-07-09T00:00:00.000Z"),
      lockAt: new Date("2026-07-19T19:55:00.000Z")
    }
  });
}

async function openWindowsForMatch(matchNumber: number, kickoffUtc: string) {
  await prisma.predictionWindow.updateMany({
    where: { match: { matchNumber } },
    data: {
      status: WindowStatus.OPEN,
      openAt: new Date("2026-07-09T00:00:00.000Z"),
      lockAt: new Date(new Date(kickoffUtc).getTime() - 5 * 60 * 1000)
    }
  });
}

async function main() {
  await prisma.match.updateMany({
    where: { matchNumber: { lte: 96 } },
    data: {
      status: MatchStatus.FINISHED,
      predictionStatus: PredictionStatus.SCORED,
      minute: 90,
      second: 0,
      lastEventAt: new Date("2026-07-08T23:00:00.000Z")
    }
  });

  await setWindowState(1, 96, WindowStatus.SCORED);

  for (const qf of QUARTER_FINALS) {
    await ensureTeamSlotFromMatch(qf.homeFromMatch, qf.home);
    await ensureTeamSlotFromMatch(qf.awayFromMatch, qf.away);

    const stadium = await prisma.stadium.findUnique({ where: { slug: qf.stadiumSlug } });
    if (!stadium) throw new Error(`Missing stadium: ${qf.stadiumSlug}`);

    await prisma.match.update({
      where: { matchNumber: qf.matchNumber },
      data: {
        kickoffUtc: new Date(qf.kickoffUtc),
        stadiumId: stadium.id,
        homeSlotId: `slot_winner_m${qf.homeFromMatch}`,
        awaySlotId: `slot_winner_m${qf.awayFromMatch}`,
        status: MatchStatus.SCHEDULED,
        predictionStatus: PredictionStatus.OPEN,
        homeScore: 0,
        awayScore: 0,
        homeScorePenalties: null,
        awayScorePenalties: null,
        minute: null,
        second: null,
        stoppageMinute: null,
        oddsHomeWin: qf.odds.home,
        oddsDraw: qf.odds.draw,
        oddsAwayWin: qf.odds.away,
        statsJson: {
          phase: "quarter-final",
          source: "current-phase-sync",
          marketNote: "Illustrative odds placeholders for prediction UI"
        }
      }
    });

    await openWindowsForMatch(qf.matchNumber, qf.kickoffUtc);
  }

  for (const m of FUTURE_MATCHES) {
    const stadium = await prisma.stadium.findUnique({ where: { slug: m.stadiumSlug } });
    if (!stadium) throw new Error(`Missing stadium: ${m.stadiumSlug}`);

    await prisma.match.update({
      where: { matchNumber: m.matchNumber },
      data: {
        kickoffUtc: new Date(m.kickoffUtc),
        stadiumId: stadium.id,
        status: MatchStatus.SCHEDULED,
        predictionStatus: PredictionStatus.OPEN,
        homeScore: 0,
        awayScore: 0,
        minute: null,
        second: null,
        stoppageMinute: null
      }
    });

    await openWindowsForMatch(m.matchNumber, m.kickoffUtc);
  }

  console.log("Current phase synced: quarter-finals active, matches 97-104 prediction windows open.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
