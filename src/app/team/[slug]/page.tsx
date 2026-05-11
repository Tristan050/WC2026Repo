import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 120;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

/* ── Helpers ── */
const FLAGS: Record<string, string> = {
  mexico:"🇲🇽",canada:"🇨🇦",usa:"🇺🇸","united states":"🇺🇸",brazil:"🇧🇷",argentina:"🇦🇷",
  france:"🇫🇷",germany:"🇩🇪",spain:"🇪🇸",england:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",portugal:"🇵🇹",netherlands:"🇳🇱",
  belgium:"🇧🇪",japan:"🇯🇵",australia:"🇦🇺",morocco:"🇲🇦",senegal:"🇸🇳",ecuador:"🇪🇨",
  uruguay:"🇺🇾",colombia:"🇨🇴",croatia:"🇭🇷",ghana:"🇬🇭",switzerland:"🇨🇭","south africa":"🇿🇦",
  "saudi arabia":"🇸🇦","korea republic":"🇰🇷","ir iran":"🇮🇷",panama:"🇵🇦",austria:"🇦🇹",
  turkey:"🇹🇷",turkiye:"🇹🇷",norway:"🇳🇴",sweden:"🇸🇪",scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",qatar:"🇶🇦",
  "cote d'ivoire":"🇨🇮","cabo verde":"🇨🇻","new zealand":"🇳🇿",czechia:"🇨🇿","congo dr":"🇨🇩",
  algeria:"🇩🇿",jordan:"🇯🇴",iraq:"🇮🇶",uzbekistan:"🇺🇿",curacao:"🇨🇼",haiti:"🇭🇹",
  tunisia:"🇹🇳",egypt:"🇪🇬",iran:"🇮🇷",paraguay:"🇵🇾",chile:"🇨🇱","bosnia and herzegovina":"🇧🇦",
  nigeria:"🇳🇬",honduras:"🇭🇳",jamaica:"🇯🇲","costa rica":"🇨🇷",
};
function flag(label: string): string {
  const l = label.toLowerCase();
  return FLAGS[l] ?? Object.entries(FLAGS).find(([k]) => l.includes(k))?.[1] ?? "⚽";
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function matchSlug(home: string, away: string) {
  return `${toSlug(home)}-vs-${toSlug(away)}`;
}
function fmtDate(utc: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  }).format(utc) + " UTC";
}
function stageLabel(s: string): string {
  return ({ GROUP:"Group Stage", ROUND_OF_32:"Round of 32", ROUND_OF_16:"Round of 16",
    QUARTER_FINAL:"Quarter-Final", SEMI_FINAL:"Semi-Final",
    THIRD_PLACE:"Third Place", FINAL:"Final 🏆" }[s] ?? s.replaceAll("_"," "));
}

/* ── Data ── */
async function findSlotBySlug(slug: string) {
  try {
    // Get all team-kind slots and find the one whose label slug matches
    const slots = await prisma.teamSlot.findMany({
      where: { kind: "TEAM" },
      select: { id: true, label: true, groupCode: true },
    });
    return slots.find(s => toSlug(s.label) === slug) ?? null;
  } catch { return null; }
}

async function getTeamMatches(slotId: string) {
  try {
    return await prisma.match.findMany({
      where: {
        OR: [
          { homeSlotId: slotId },
          { awaySlotId: slotId },
        ],
      },
      include: {
        homeSlot: { select: { id: true, label: true, groupCode: true } },
        awaySlot: { select: { id: true, label: true, groupCode: true } },
        stadium: { select: { city: true, name: true } },
        windows: { where: { status: { in: ["OPEN", "SCHEDULED", "LOCKED"] } }, orderBy: { openAt: "asc" }, take: 1 },
      },
      orderBy: { kickoffUtc: "asc" },
    });
  } catch { return []; }
}

/* ── generateStaticParams: all TEAM slots ── */
export async function generateStaticParams() {
  try {
    const slots = await prisma.teamSlot.findMany({
      where: { kind: "TEAM" },
      select: { label: true },
    });
    return slots.map(s => ({ slug: toSlug(s.label) }));
  } catch { return []; }
}

/* ── Metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slot = await findSlotBySlug(slug);
  if (!slot) return { title: "Team Not Found | WorldCupClutch" };

  const name = slot.label;
  const group = slot.groupCode ? `Group ${slot.groupCode}` : "World Cup 2026";
  const title = `${name} World Cup 2026 Schedule & Predictions | WorldCupClutch`;
  const description = `${name} ${group} schedule, fixtures, and predictions for the FIFA World Cup 2026. Predict all ${name} matches and compete on the global leaderboard. Free pick\'em game.`;

  return {
    title,
    description,
    keywords: [
      `${name} World Cup 2026`,
      `${name} schedule 2026`,
      `${name} ${group} 2026`,
      `${name} World Cup predictions`,
      `${name} FIFA 2026 fixtures`,
      "WorldCupClutch",
    ],
    alternates: { canonical: `/team/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/team/${slug}`,
      siteName: "WorldCupClutch",
      type: "website",
    },
  };
}

/* ── Page ── */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const slot = await findSlotBySlug(slug);
  if (!slot) notFound();

  const matches = await getTeamMatches(slot.id);
  if (matches.length === 0) notFound();

  const name = slot.label;
  const groupCode = slot.groupCode;
  const flagEmoji = flag(name);

  // Calculate simple stats
  const played = matches.filter(m => m.status === "FINISHED").length;
  const wins = matches.filter(m => {
    if (m.status !== "FINISHED") return false;
    const isHome = m.homeSlot?.id === slot.id;
    return isHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
  }).length;
  const draws = matches.filter(m => {
    if (m.status !== "FINISHED") return false;
    return m.homeScore === m.awayScore;
  }).length;

  // Open windows for this team's matches
  const openMatches = matches.filter(m => m.windows[0]?.status === "OPEN");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name,
    description: `${name} at the FIFA World Cup 2026${groupCode ? ` — Group ${groupCode}` : ""}. Predict all ${name} matches on WorldCupClutch.`,
    url: `${SITE}/team/${slug}`,
    memberOf: { "@type": "SportsOrganization", name: "FIFA", url: "https://www.fifa.com" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="team-page">
        {/* Breadcrumb */}
        <nav className="team-page-nav" aria-label="Breadcrumb">
          <Link href="/">← WorldCupClutch</Link>
          {groupCode && (
            <>
              <span className="tp-sep">/</span>
              <Link href={`/group/${groupCode.toLowerCase()}`}>Group {groupCode}</Link>
            </>
          )}
          <span className="tp-sep">/</span>
          <span>{name}</span>
        </nav>

        {/* Hero */}
        <div className="team-page-hero">
          <div className="tph-flag" aria-hidden="true">{flagEmoji}</div>
          <div className="tph-info">
            <h1 className="tph-name">{name}</h1>
            {groupCode && (
              <p className="tph-group">
                FIFA World Cup 2026 · <Link href={`/group/${groupCode.toLowerCase()}`}>Group {groupCode}</Link>
              </p>
            )}
          </div>
        </div>

        {/* CTA — predict all open matches */}
        {openMatches.length > 0 && (
          <div className="team-predict-cta" role="complementary">
            <span className="tpc-icon">🎯</span>
            <div className="tpc-text">
              <strong>{openMatches.length} prediction window{openMatches.length > 1 ? "s" : ""} open</strong>
              <span> — pick {name}&apos;s matches now to earn points</span>
            </div>
            <Link href="/" className="tpc-btn">Predict on WorldCupClutch →</Link>
          </div>
        )}

        {/* Stats bar — shown after tournament starts */}
        {played > 0 && (
          <div className="team-stats-bar">
            <div className="tsb-item">
              <span className="tsb-val">{played}</span>
              <span className="tsb-label">Played</span>
            </div>
            <div className="tsb-item">
              <span className="tsb-val">{wins}</span>
              <span className="tsb-label">Won</span>
            </div>
            <div className="tsb-item">
              <span className="tsb-val">{draws}</span>
              <span className="tsb-label">Drawn</span>
            </div>
            <div className="tsb-item">
              <span className="tsb-val">{played - wins - draws}</span>
              <span className="tsb-label">Lost</span>
            </div>
          </div>
        )}

        {/* Match schedule */}
        <section className="team-matches-section" aria-label={`${name} World Cup 2026 schedule`}>
          <h2 className="tp-section-title">{name} World Cup 2026 Schedule</h2>
          <div className="team-matches-list">
            {matches.map(m => {
              const home = m.homeSlot?.label ?? "Home";
              const away = m.awaySlot?.label ?? "Away";
              const isHome = m.homeSlot?.id === slot.id;
              const opponent = isHome ? away : home;
              const slug2 = matchSlug(home, away);
              const isLive = ["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(m.status);
              const isFt = m.status === "FINISHED";
              const openWin = m.windows[0];
              const isOpen = openWin?.status === "OPEN";

              let resultClass = "";
              if (isFt) {
                const teamScore = isHome ? m.homeScore : m.awayScore;
                const oppScore = isHome ? m.awayScore : m.homeScore;
                resultClass = teamScore > oppScore ? "result-win" : teamScore < oppScore ? "result-loss" : "result-draw";
              }

              return (
                <div key={m.id} className={`team-match-row${isOpen ? " tmr-open" : ""}`}>
                  <div className="tmr-meta">
                    <span className={`tmr-status ${isLive ? "tmr-live" : isFt ? "tmr-ft" : "tmr-upcoming"}`}>
                      {isLive ? "🔴 LIVE" : isFt ? "FT" : m.kickoffUtc ? fmtDate(m.kickoffUtc) : "TBD"}
                    </span>
                    <span className="tmr-stage">{stageLabel(m.stage)}</span>
                  </div>

                  <div className="tmr-matchup">
                    <span className="tmr-team">
                      <span aria-hidden="true">{flag(home)}</span> {home}
                      {isFt && <strong className="tmr-score">{m.homeScore ?? 0}</strong>}
                    </span>
                    <span className="tmr-vs">{isFt ? "–" : "vs"}</span>
                    <span className="tmr-team tmr-team-away">
                      {isFt && <strong className="tmr-score">{m.awayScore ?? 0}</strong>}
                      {away} <span aria-hidden="true">{flag(away)}</span>
                    </span>
                  </div>

                  {isFt && (
                    <span className={`tmr-result ${resultClass}`}>
                      {resultClass === "result-win" ? "W" : resultClass === "result-loss" ? "L" : "D"}
                      {" "}{isHome ? `${m.homeScore}–${m.awayScore}` : `${m.awayScore}–${m.homeScore}`}
                    </span>
                  )}

                  <div className="tmr-actions">
                    {m.stadium?.city && <span className="tmr-venue">{m.stadium.city}</span>}
                    <Link href={`/match/${slug2}`} className={`tmr-link${isOpen ? " tmr-link-open" : ""}`}>
                      {isOpen ? "🎯 Predict →" : "View →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Group context link */}
        {groupCode && (
          <div className="team-group-link">
            <Link href={`/group/${groupCode.toLowerCase()}`}>
              → See all Group {groupCode} matches &amp; predictions
            </Link>
          </div>
        )}

        {/* SEO content */}
        <section className="team-seo-content">
          <h2>{name} at the FIFA World Cup 2026</h2>
          <p>
            <strong>{name}</strong> {groupCode ? `qualified for Group ${groupCode} of` : "qualified for"} the
            FIFA World Cup 2026, hosted across the United States, Canada, and Mexico.
            {" "}Predict all {name} match results on WorldCupClutch — correct picks earn{" "}
            <strong>+3 points</strong> plus streak bonuses.
          </p>
          <p>
            The FIFA World Cup 2026 is the largest ever, featuring <strong>48 nations</strong> and{" "}
            <strong>104 matches</strong>. In the group stage, each team plays three matches.
            The top two teams from each group advance to the Round of 32.
          </p>
          <p>
            <Link href="/">← Predict all 104 World Cup 2026 matches on WorldCupClutch</Link>
          </p>
        </section>
      </div>
    </>
  );
}
