import { PrismaClient, MatchStage, PredictionKind, TeamSlotKind } from "@prisma/client";

const prisma = new PrismaClient();
const TOTAL_MATCHES = 104;

const GROUPS = [
  { code: "A", teams: [{ name: "Mexico", fifaCode: "MEX" }, { name: "South Africa", fifaCode: "RSA" }, { name: "Korea Republic", fifaCode: "KOR" }, { name: "Czechia", fifaCode: "CZE" }] },
  { code: "B", teams: [{ name: "Canada", fifaCode: "CAN" }, { name: "Bosnia and Herzegovina", fifaCode: "BIH" }, { name: "Qatar", fifaCode: "QAT" }, { name: "Switzerland", fifaCode: "SUI" }] },
  { code: "C", teams: [{ name: "Brazil", fifaCode: "BRA" }, { name: "Morocco", fifaCode: "MAR" }, { name: "Haiti", fifaCode: "HAI" }, { name: "Scotland", fifaCode: "SCO" }] },
  { code: "D", teams: [{ name: "USA", fifaCode: "USA" }, { name: "Paraguay", fifaCode: "PAR" }, { name: "Australia", fifaCode: "AUS" }, { name: "Turkiye", fifaCode: "TUR" }] },
  { code: "E", teams: [{ name: "Germany", fifaCode: "GER" }, { name: "Curacao", fifaCode: "CUW" }, { name: "Cote d'Ivoire", fifaCode: "CIV" }, { name: "Ecuador", fifaCode: "ECU" }] },
  { code: "F", teams: [{ name: "Netherlands", fifaCode: "NED" }, { name: "Japan", fifaCode: "JPN" }, { name: "Sweden", fifaCode: "SWE" }, { name: "Tunisia", fifaCode: "TUN" }] },
  { code: "G", teams: [{ name: "Belgium", fifaCode: "BEL" }, { name: "Egypt", fifaCode: "EGY" }, { name: "IR Iran", fifaCode: "IRN" }, { name: "New Zealand", fifaCode: "NZL" }] },
  { code: "H", teams: [{ name: "Spain", fifaCode: "ESP" }, { name: "Cabo Verde", fifaCode: "CPV" }, { name: "Saudi Arabia", fifaCode: "KSA" }, { name: "Uruguay", fifaCode: "URU" }] },
  { code: "I", teams: [{ name: "France", fifaCode: "FRA" }, { name: "Senegal", fifaCode: "SEN" }, { name: "Iraq", fifaCode: "IRQ" }, { name: "Norway", fifaCode: "NOR" }] },
  { code: "J", teams: [{ name: "Argentina", fifaCode: "ARG" }, { name: "Algeria", fifaCode: "ALG" }, { name: "Austria", fifaCode: "AUT" }, { name: "Jordan", fifaCode: "JOR" }] },
  { code: "K", teams: [{ name: "Portugal", fifaCode: "POR" }, { name: "Congo DR", fifaCode: "COD" }, { name: "Uzbekistan", fifaCode: "UZB" }, { name: "Colombia", fifaCode: "COL" }] },
  { code: "L", teams: [{ name: "England", fifaCode: "ENG" }, { name: "Croatia", fifaCode: "CRO" }, { name: "Ghana", fifaCode: "GHA" }, { name: "Panama", fifaCode: "PAN" }] }
] as const;

const GROUP_MATCH_PAIRS: Array<[number, number]> = [[1,2],[3,4],[1,3],[4,2],[1,4],[2,3]];

const GROUP_DAY_MATCH_COUNTS = [2,2,5,4,5,4,5,4,5,4,5,4,5,4,5,4,4]; // 11-27 June, total 72

const STADIUMS = [
  ["estadio-azteca", "Mexico City Stadium", "Mexico City", "Mexico", "America/Mexico_City"],
  ["estadio-guadalajara", "Estadio Guadalajara", "Guadalajara", "Mexico", "America/Mexico_City"],
  ["estadio-monterrey", "Estadio Monterrey", "Monterrey", "Mexico", "America/Monterrey"],
  ["toronto-stadium", "Toronto Stadium", "Toronto", "Canada", "America/Toronto"],
  ["bc-place-vancouver", "BC Place Vancouver", "Vancouver", "Canada", "America/Vancouver"],
  ["new-york-new-jersey-stadium", "New York New Jersey Stadium", "New York/New Jersey", "USA", "America/New_York"],
  ["los-angeles-stadium", "Los Angeles Stadium", "Los Angeles", "USA", "America/Los_Angeles"],
  ["dallas-stadium", "Dallas Stadium", "Dallas", "USA", "America/Chicago"],
  ["seattle-stadium", "Seattle Stadium", "Seattle", "USA", "America/Los_Angeles"],
  ["atlanta-stadium", "Atlanta Stadium", "Atlanta", "USA", "America/New_York"],
  ["miami-stadium", "Miami Stadium", "Miami", "USA", "America/New_York"],
  ["kansas-city-stadium", "Kansas City Stadium", "Kansas City", "USA", "America/Chicago"],
  ["boston-stadium", "Boston Stadium", "Boston", "USA", "America/New_York"],
  ["houston-stadium", "Houston Stadium", "Houston", "USA", "America/Chicago"],
  ["san-francisco-bay-area-stadium", "San Francisco Bay Area Stadium", "San Francisco Bay Area", "USA", "America/Los_Angeles"],
  ["philadelphia-stadium", "Philadelphia Stadium", "Philadelphia", "USA", "America/New_York"]
] as const;

const R32 = [
  { n:73, h:"slot_group_a_runner", a:"slot_group_b_runner", date:"2026-06-28", hour:18, s:"los-angeles-stadium" },
  { n:74, h:"slot_group_e_winner", a:"slot_best3_abcdf", date:"2026-06-29", hour:16, s:"boston-stadium" },
  { n:75, h:"slot_group_f_winner", a:"slot_group_c_runner", date:"2026-06-29", hour:19, s:"estadio-monterrey" },
  { n:76, h:"slot_group_c_winner", a:"slot_group_f_runner", date:"2026-06-29", hour:22, s:"houston-stadium" },
  { n:77, h:"slot_group_i_winner", a:"slot_best3_cdfgh", date:"2026-06-30", hour:16, s:"new-york-new-jersey-stadium" },
  { n:78, h:"slot_group_e_runner", a:"slot_group_i_runner", date:"2026-06-30", hour:19, s:"dallas-stadium" },
  { n:79, h:"slot_group_a_winner", a:"slot_best3_cefhi", date:"2026-06-30", hour:22, s:"estadio-azteca" },
  { n:80, h:"slot_group_l_winner", a:"slot_best3_ehijk", date:"2026-07-01", hour:16, s:"atlanta-stadium" },
  { n:81, h:"slot_group_d_winner", a:"slot_best3_befij", date:"2026-07-01", hour:19, s:"san-francisco-bay-area-stadium" },
  { n:82, h:"slot_group_g_winner", a:"slot_best3_aehij", date:"2026-07-01", hour:22, s:"seattle-stadium" },
  { n:83, h:"slot_group_k_runner", a:"slot_group_l_runner", date:"2026-07-02", hour:16, s:"toronto-stadium" },
  { n:84, h:"slot_group_h_winner", a:"slot_group_j_runner", date:"2026-07-02", hour:19, s:"los-angeles-stadium" },
  { n:85, h:"slot_group_b_winner", a:"slot_best3_efgij", date:"2026-07-02", hour:22, s:"bc-place-vancouver" },
  { n:86, h:"slot_group_j_winner", a:"slot_group_h_runner", date:"2026-07-03", hour:16, s:"miami-stadium" },
  { n:87, h:"slot_group_k_winner", a:"slot_best3_deijl", date:"2026-07-03", hour:19, s:"kansas-city-stadium" },
  { n:88, h:"slot_group_d_runner", a:"slot_group_g_runner", date:"2026-07-03", hour:22, s:"dallas-stadium" }
] as const;

const KO_FIXED = [
  ...R32,
  { n:89, h:"slot_winner_m74", a:"slot_winner_m77", date:"2026-07-04", hour:16, s:"philadelphia-stadium" },
  { n:90, h:"slot_winner_m73", a:"slot_winner_m75", date:"2026-07-04", hour:20, s:"houston-stadium" },
  { n:91, h:"slot_winner_m76", a:"slot_winner_m78", date:"2026-07-05", hour:16, s:"new-york-new-jersey-stadium" },
  { n:92, h:"slot_winner_m79", a:"slot_winner_m80", date:"2026-07-05", hour:20, s:"estadio-azteca" },
  { n:93, h:"slot_winner_m83", a:"slot_winner_m84", date:"2026-07-06", hour:18, s:"dallas-stadium" },
  { n:94, h:"slot_winner_m81", a:"slot_winner_m82", date:"2026-07-06", hour:22, s:"seattle-stadium" },
  { n:95, h:"slot_winner_m86", a:"slot_winner_m88", date:"2026-07-07", hour:18, s:"atlanta-stadium" },
  { n:96, h:"slot_winner_m85", a:"slot_winner_m87", date:"2026-07-07", hour:22, s:"bc-place-vancouver" },
  { n:97, h:"slot_winner_m89", a:"slot_winner_m90", date:"2026-07-09", hour:20, s:"boston-stadium" },
  { n:98, h:"slot_winner_m93", a:"slot_winner_m94", date:"2026-07-10", hour:20, s:"los-angeles-stadium" },
  { n:99, h:"slot_winner_m91", a:"slot_winner_m92", date:"2026-07-11", hour:18, s:"miami-stadium" },
  { n:100, h:"slot_winner_m95", a:"slot_winner_m96", date:"2026-07-11", hour:22, s:"kansas-city-stadium" },
  { n:101, h:"slot_winner_m97", a:"slot_winner_m98", date:"2026-07-14", hour:20, s:"dallas-stadium" },
  { n:102, h:"slot_winner_m99", a:"slot_winner_m100", date:"2026-07-15", hour:20, s:"atlanta-stadium" },
  { n:103, h:"slot_loser_m101", a:"slot_loser_m102", date:"2026-07-18", hour:20, s:"miami-stadium" },
  { n:104, h:"slot_winner_m101", a:"slot_winner_m102", date:"2026-07-19", hour:20, s:"new-york-new-jersey-stadium" }
] as const;

const GROUP_MATCH_OVERRIDES: Record<number, { home: string; away: string; stadium: string; date: string; hour: number }> = {
  1: { home: "slot_group_a_1", away: "slot_group_a_2", stadium: "estadio-azteca", date: "2026-06-11", hour: 18 }, // Mexico v South Africa
  2: { home: "slot_group_a_3", away: "slot_group_a_4", stadium: "estadio-guadalajara", date: "2026-06-11", hour: 20 }, // Korea Republic v Czechia
  3: { home: "slot_group_b_1", away: "slot_group_b_2", stadium: "toronto-stadium", date: "2026-06-12", hour: 18 }, // Canada v Bosnia and Herzegovina
  4: { home: "slot_group_d_1", away: "slot_group_d_2", stadium: "los-angeles-stadium", date: "2026-06-12", hour: 20 }, // USA v Paraguay
  5: { home: "slot_group_c_3", away: "slot_group_c_4", stadium: "boston-stadium", date: "2026-06-13", hour: 16 }, // Haiti v Scotland
  6: { home: "slot_group_d_3", away: "slot_group_d_4", stadium: "bc-place-vancouver", date: "2026-06-13", hour: 18 }, // Australia v Turkiye
  7: { home: "slot_group_c_1", away: "slot_group_c_2", stadium: "new-york-new-jersey-stadium", date: "2026-06-13", hour: 20 }, // Brazil v Morocco
  8: { home: "slot_group_b_3", away: "slot_group_b_4", stadium: "san-francisco-bay-area-stadium", date: "2026-06-13", hour: 22 }, // Qatar v Switzerland
  9: { home: "slot_group_e_3", away: "slot_group_e_4", stadium: "philadelphia-stadium", date: "2026-06-14", hour: 16 }, // Cote d'Ivoire v Ecuador
  10: { home: "slot_group_e_1", away: "slot_group_e_2", stadium: "houston-stadium", date: "2026-06-14", hour: 18 }, // Germany v Curacao
  11: { home: "slot_group_f_1", away: "slot_group_f_2", stadium: "dallas-stadium", date: "2026-06-14", hour: 20 }, // Netherlands v Japan
  12: { home: "slot_group_f_3", away: "slot_group_f_4", stadium: "estadio-monterrey", date: "2026-06-14", hour: 22 }, // Sweden v Tunisia
  24: { home: "slot_group_k_3", away: "slot_group_k_4", stadium: "estadio-guadalajara", date: "2026-06-18", hour: 20 }, // Uzbekistan v Colombia
  53: { home: "slot_group_a_4", away: "slot_group_a_1", stadium: "estadio-azteca", date: "2026-06-24", hour: 19 } // Czechia v Mexico
};

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isoDateTime(date: string, hour: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function stageForMatch(n: number): MatchStage {
  if (n <= 72) return MatchStage.GROUP;
  if (n <= 88) return MatchStage.ROUND_OF_32;
  if (n <= 96) return MatchStage.ROUND_OF_16;
  if (n <= 100) return MatchStage.QUARTER_FINAL;
  if (n <= 102) return MatchStage.SEMI_FINAL;
  if (n === 103) return MatchStage.THIRD_PLACE;
  return MatchStage.FINAL;
}

async function seedStadiums() {
  for (const [slug, name, city, country, timezone] of STADIUMS) {
    await prisma.stadium.upsert({ where: { slug }, update: { name, city, country, timezone }, create: { slug, name, city, country, timezone } });
  }
}

async function seedTeamSlots() {
  for (const g of GROUPS) {
    for (let i = 0; i < g.teams.length; i++) {
      const teamData = g.teams[i];
      const team = await prisma.team.upsert({
        where: { fifaCode: teamData.fifaCode },
        update: { name: teamData.name, slug: slugify(teamData.name), isQualified: true },
        create: { fifaCode: teamData.fifaCode, name: teamData.name, slug: slugify(teamData.name), isQualified: true }
      });

      await prisma.teamSlot.upsert({
        where: { id: `slot_group_${g.code.toLowerCase()}_${i + 1}` },
        update: { kind: TeamSlotKind.TEAM, label: teamData.name, groupCode: g.code, groupPosition: i + 1, teamId: team.id, resolvedAt: new Date() },
        create: { id: `slot_group_${g.code.toLowerCase()}_${i + 1}`, kind: TeamSlotKind.TEAM, label: teamData.name, groupCode: g.code, groupPosition: i + 1, teamId: team.id, resolvedAt: new Date() }
      });
    }

    await prisma.teamSlot.upsert({
      where: { id: `slot_group_${g.code.toLowerCase()}_winner` },
      update: { kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Winner Group ${g.code}`, groupCode: g.code, groupPosition: 1, teamId: null, resolvedAt: null },
      create: { id: `slot_group_${g.code.toLowerCase()}_winner`, kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Winner Group ${g.code}`, groupCode: g.code, groupPosition: 1 }
    });

    await prisma.teamSlot.upsert({
      where: { id: `slot_group_${g.code.toLowerCase()}_runner` },
      update: { kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Runner-up Group ${g.code}`, groupCode: g.code, groupPosition: 2, teamId: null, resolvedAt: null },
      create: { id: `slot_group_${g.code.toLowerCase()}_runner`, kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Runner-up Group ${g.code}`, groupCode: g.code, groupPosition: 2 }
    });
  }

  const bestThirdSets = ["abcdf","cdfgh","cefhi","ehijk","befij","aehij","efgij","deijl"];
  for (const set of bestThirdSets) {
    await prisma.teamSlot.upsert({
      where: { id: `slot_best3_${set}` },
      update: { kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Best 3rd-place from groups ${set.toUpperCase().split("").join("/")}`, teamId: null, resolvedAt: null },
      create: { id: `slot_best3_${set}`, kind: TeamSlotKind.GROUP_PLACEHOLDER, label: `Best 3rd-place from groups ${set.toUpperCase().split("").join("/")}` }
    });
  }

  for (let i = 1; i <= TOTAL_MATCHES; i++) {
    await prisma.teamSlot.upsert({
      where: { id: `slot_winner_m${i}` },
      update: {},
      create: { id: `slot_winner_m${i}`, kind: TeamSlotKind.BRACKET_PLACEHOLDER, label: `Winner Match ${i}`, sourceMatchId: `match_${String(i).padStart(3, "0")}`, sourceMatchOutcome: "WINNER" }
    });
  }

  for (const i of [101, 102]) {
    await prisma.teamSlot.upsert({
      where: { id: `slot_loser_m${i}` },
      update: {},
      create: { id: `slot_loser_m${i}`, kind: TeamSlotKind.BRACKET_PLACEHOLDER, label: `Loser Match ${i}`, sourceMatchId: `match_${String(i).padStart(3, "0")}`, sourceMatchOutcome: "LOSER" }
    });
  }
}

function groupSlotsForMatch(n: number) {
  const groupIndex = Math.floor((n - 1) / 6);
  const matchInGroup = (n - 1) % 6;
  const groupCode = GROUPS[groupIndex].code.toLowerCase();
  const [a, b] = GROUP_MATCH_PAIRS[matchInGroup];
  return { home: `slot_group_${groupCode}_${a}`, away: `slot_group_${groupCode}_${b}` };
}

function groupKickoffForMatch(n: number) {
  let seen = 0;
  for (let dayIdx = 0; dayIdx < GROUP_DAY_MATCH_COUNTS.length; dayIdx++) {
    const count = GROUP_DAY_MATCH_COUNTS[dayIdx];
    if (n <= seen + count) {
      const indexWithinDay = n - seen - 1;
      const hours = count === 2 ? [18, 20] : count === 5 ? [14, 16, 18, 20, 22] : [16, 18, 20, 22];
      const date = new Date("2026-06-11T00:00:00.000Z");
      date.setUTCDate(date.getUTCDate() + dayIdx);
      date.setUTCHours(hours[indexWithinDay], 0, 0, 0);
      return date;
    }
    seen += count;
  }
  return isoDateTime("2026-06-27", 22);
}

async function seedMatches() {
  const stadiums = await prisma.stadium.findMany({ select: { id: true, slug: true } });
  const stadiumBySlug = Object.fromEntries(stadiums.map((s) => [s.slug, s.id]));

  const groupStageStadiumRotation = [
    "estadio-azteca","estadio-guadalajara","toronto-stadium","los-angeles-stadium","boston-stadium","bc-place-vancouver",
    "new-york-new-jersey-stadium","san-francisco-bay-area-stadium","philadelphia-stadium","houston-stadium","dallas-stadium",
    "estadio-monterrey","seattle-stadium","miami-stadium","atlanta-stadium","kansas-city-stadium"
  ];

  for (let n = 1; n <= TOTAL_MATCHES; n++) {
    const stage = stageForMatch(n);
    const id = `match_${String(n).padStart(3, "0")}`;

    let homeSlotId = "";
    let awaySlotId = "";
    let kickoffUtc: Date;
    let stadiumSlug: string;

    if (n <= 72) {
      const slots = groupSlotsForMatch(n);
      homeSlotId = slots.home;
      awaySlotId = slots.away;
      kickoffUtc = groupKickoffForMatch(n);
      stadiumSlug = groupStageStadiumRotation[(n - 1) % groupStageStadiumRotation.length];
      if (n === 1 || n === 53) stadiumSlug = "estadio-azteca";
      if (n === 2 || n === 24) stadiumSlug = "estadio-guadalajara";
      if (n === 54) stadiumSlug = "estadio-monterrey";
      if (n === 3 || n === 51) stadiumSlug = "toronto-stadium";
      if (n === 4 || n === 59) stadiumSlug = "los-angeles-stadium";

      const official = GROUP_MATCH_OVERRIDES[n];
      if (official) {
        homeSlotId = official.home;
        awaySlotId = official.away;
        stadiumSlug = official.stadium;
        kickoffUtc = isoDateTime(official.date, official.hour);
      }
    } else {
      const cfg = KO_FIXED.find((k) => k.n === n)!;
      homeSlotId = cfg.h;
      awaySlotId = cfg.a;
      kickoffUtc = isoDateTime(cfg.date, cfg.hour);
      stadiumSlug = cfg.s;
    }

    const stadiumId = stadiumBySlug[stadiumSlug] ?? stadiums[0].id;

    await prisma.match.upsert({
      where: { matchNumber: n },
      update: { stage, kickoffUtc, stadiumId, homeSlotId, awaySlotId },
      create: {
        id,
        slug: `world-cup-2026-match-${String(n).padStart(3, "0")}`,
        stage,
        matchNumber: n,
        kickoffUtc,
        kickoffTimezone: "UTC",
        stadiumId,
        homeSlotId,
        awaySlotId
      }
    });

    const baseOpen = new Date(kickoffUtc.getTime() - 24 * 60 * 60 * 1000);
    const baseLock = new Date(kickoffUtc.getTime() - 5 * 60 * 1000);
    for (const kind of [PredictionKind.MATCH_WINNER, PredictionKind.BOTH_TEAMS_SCORE, PredictionKind.UPSET_PICK]) {
      await prisma.predictionWindow.upsert({
        where: { id: `pw_${id}_${kind.toLowerCase()}` },
        update: { openAt: baseOpen, lockAt: baseLock },
        create: { id: `pw_${id}_${kind.toLowerCase()}`, matchId: id, kind, title: `${kind.replaceAll("_", " ")} for Match ${n}`, openAt: baseOpen, lockAt: baseLock, scoringRuleJson: { model: "standard", correct: 10, wrong: 0 } }
      });
    }
  }
}

async function main() {
  await seedStadiums();
  await seedTeamSlots();
  await seedMatches();
  console.log("Seeded World Cup 2026 with group teams + official knockout mapping anchors");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
