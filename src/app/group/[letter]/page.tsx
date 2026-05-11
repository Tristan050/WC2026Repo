import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 120;

/* ── All valid group letters ── */
const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;
type GroupLetter = (typeof GROUP_LETTERS)[number];

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

/* ── Flag map ── */
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
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  }).format(utc) + " UTC";
}

/* ── Data ── */
async function getGroupData(letter: string) {
  try {
    const [teams, matches] = await Promise.all([
      // Teams in the group (TEAM kind only, not placeholders)
      prisma.teamSlot.findMany({
        where: { groupCode: letter, kind: "TEAM" },
        include: { team: { select: { id: true, name: true } } },
        orderBy: { groupPosition: "asc" },
      }),
      // All GROUP stage matches for this group (via homeSlot groupCode)
      prisma.match.findMany({
        where: { stage: "GROUP", homeSlot: { groupCode: letter } },
        include: {
          homeSlot: { select: { label: true, groupCode: true } },
          awaySlot: { select: { label: true, groupCode: true } },
          stadium: { select: { city: true, name: true } },
          windows: { where: { status: { in: ["OPEN", "LOCKED"] } }, orderBy: { openAt: "asc" }, take: 1 },
        },
        orderBy: { kickoffUtc: "asc" },
      }),
    ]);

    return { teams, matches };
  } catch { return null; }
}

async function getPickDistribution(windowId: string) {
  try {
    const counts = await prisma.userPick.groupBy({
      by: ["choice"],
      where: { predictionWindowId: windowId },
      _count: { choice: true },
    });
    const map: Record<string, number> = {};
    for (const r of counts) map[r.choice] = r._count.choice;
    const home = map["HOME"] ?? 0, draw = map["DRAW"] ?? 0, away = map["AWAY"] ?? 0;
    return { home, draw, away, total: home + draw + away };
  } catch { return null; }
}

/* ── Static params: A–L ── */
export async function generateStaticParams() {
  // Only generate letters that have data
  try {
    const groupCodes = await prisma.teamSlot.findMany({
      where: { kind: "TEAM", groupCode: { not: null } },
      select: { groupCode: true },
      distinct: ["groupCode"],
    });
    return groupCodes
      .map(g => ({ letter: (g.groupCode ?? "").toLowerCase() }))
      .filter(g => g.letter);
  } catch {
    return GROUP_LETTERS.map(l => ({ letter: l.toLowerCase() }));
  }
}

/* ── Metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const upper = letter.toUpperCase() as GroupLetter;
  if (!GROUP_LETTERS.includes(upper)) return { title: "Group Not Found | WorldCupClutch" };

  const data = await getGroupData(upper);
  const teamNames = data?.teams.map(t => t.label).join(", ") ?? "";

  const title = `Group ${upper} — World Cup 2026 Predictions & Standings | WorldCupClutch`;
  const description = `Group ${upper} predictions for FIFA World Cup 2026${teamNames ? `: ${teamNames}` : ""}. See all 6 group matches, community pick percentages, and predict the winner of every fixture. Free pick\'em game.`;

  return {
    title,
    description,
    keywords: [
      `World Cup 2026 Group ${upper}`,
      `Group ${upper} standings 2026`,
      `Group ${upper} predictions`,
      `FIFA 2026 Group ${upper} matches`,
      ...(data?.teams.map(t => `${t.label} World Cup 2026`) ?? []),
      "WorldCupClutch",
    ],
    alternates: { canonical: `/group/${letter.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/group/${letter.toLowerCase()}`,
      siteName: "WorldCupClutch",
      type: "website",
    },
  };
}

/* ── Page ── */
export default async function GroupPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const upper = letter.toUpperCase() as GroupLetter;
  if (!GROUP_LETTERS.includes(upper)) notFound();

  const data = await getGroupData(upper);
  if (!data) notFound();

  const { teams, matches } = data;

  // Fetch pick distributions in parallel for open windows
  const distMap: Record<string, Awaited<ReturnType<typeof getPickDistribution>>> = {};
  await Promise.all(
    matches.map(async m => {
      const openWin = m.windows[0];
      if (openWin?.status === "OPEN") {
        distMap[m.id] = await getPickDistribution(openWin.id);
      }
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `FIFA World Cup 2026 Group ${upper}`,
    description: `Group ${upper} of the FIFA World Cup 2026 featuring ${teams.map(t => t.label).join(", ")}.`,
    url: `${SITE}/group/${letter.toLowerCase()}`,
    organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
    competitor: teams.map(t => ({ "@type": "SportsTeam", name: t.label })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="group-page">
        {/* Breadcrumb */}
        <nav className="group-page-nav" aria-label="Breadcrumb">
          <Link href="/">← WorldCupClutch</Link>
          <span className="gp-sep">/</span>
          <span>Group {upper}</span>
        </nav>

        <h1 className="group-page-h1">
          ⚽ World Cup 2026 — Group {upper}
          <span className="group-page-sub">Predictions &amp; Match Picks</span>
        </h1>

        {/* Teams in the group */}
        {teams.length > 0 && (
          <section className="group-teams-section" aria-label={`Group ${upper} teams`}>
            <h2 className="gp-section-title">Group {upper} Teams</h2>
            <div className="group-teams-grid">
              {teams.map(t => (
                <Link key={t.id} href={`/team/${toSlug(t.label)}`} className="group-team-card">
                  <span className="gtc-flag" aria-hidden="true">{flag(t.label)}</span>
                  <span className="gtc-name">{t.label}</span>
                  <span className="gtc-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Matches */}
        <section className="group-matches-section" aria-label={`Group ${upper} fixtures`}>
          <h2 className="gp-section-title">Group {upper} Fixtures &amp; Predictions</h2>

          {matches.length === 0 ? (
            <p className="gp-empty">Fixtures not yet scheduled. Check back soon.</p>
          ) : (
            <div className="group-matches-list">
              {matches.map(m => {
                const home = m.homeSlot?.label ?? "Home";
                const away = m.awaySlot?.label ?? "Away";
                const slug = matchSlug(home, away);
                const isLive = ["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(m.status);
                const isFt = m.status === "FINISHED";
                const openWin = m.windows[0];
                const dist = distMap[m.id];
                const hasResult = isLive || isFt;

                return (
                  <div key={m.id} className="group-match-card">
                    <div className="gmc-header">
                      <span className={`gmc-status ${isLive ? "gmc-live" : isFt ? "gmc-ft" : "gmc-upcoming"}`}>
                        {isLive ? "🔴 LIVE" : isFt ? "✓ FT" : m.kickoffUtc ? fmtDate(m.kickoffUtc) : "Upcoming"}
                      </span>
                      {m.stadium?.city && <span className="gmc-venue">{m.stadium.city}</span>}
                    </div>

                    <div className="gmc-teams">
                      <span className="gmc-team">
                        <span aria-hidden="true">{flag(home)}</span> {home}
                        {hasResult && <strong className="gmc-score">{m.homeScore ?? 0}</strong>}
                      </span>
                      <span className="gmc-vs">{hasResult ? "–" : "vs"}</span>
                      <span className="gmc-team gmc-team-away">
                        {hasResult && <strong className="gmc-score">{m.awayScore ?? 0}</strong>}
                        {away} <span aria-hidden="true">{flag(away)}</span>
                      </span>
                    </div>

                    {/* Community pick distribution */}
                    {dist && dist.total > 0 && (
                      <div className="gmc-dist" aria-label="Community predictions">
                        <div className="gmc-dist-bar">
                          <div className="gmc-dist-home" style={{ width: `${Math.round(dist.home / dist.total * 100)}%` }} title={`${Math.round(dist.home / dist.total * 100)}% pick ${home}`} />
                          <div className="gmc-dist-draw" style={{ width: `${Math.round(dist.draw / dist.total * 100)}%` }} title={`${Math.round(dist.draw / dist.total * 100)}% pick Draw`} />
                          <div className="gmc-dist-away" style={{ width: `${Math.round(dist.away / dist.total * 100)}%` }} title={`${Math.round(dist.away / dist.total * 100)}% pick ${away}`} />
                        </div>
                        <div className="gmc-dist-labels">
                          <span>{Math.round(dist.home / dist.total * 100)}% {home}</span>
                          <span className="gmc-dist-total">{dist.total.toLocaleString()} picks</span>
                          <span>{away} {Math.round(dist.away / dist.total * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <Link href={`/match/${slug}`} className="gmc-predict-link">
                      {openWin?.status === "OPEN" ? "🎯 Predict this match →" : "View prediction →"}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SEO content */}
        <section className="group-seo-content">
          <h2>About World Cup 2026 Group {upper}</h2>
          <p>
            Group {upper} is one of twelve groups in the expanded{" "}
            <strong>FIFA World Cup 2026</strong> group stage, featuring{" "}
            <strong>{teams.length} teams</strong>{teams.length > 0 ? ` — ${teams.map(t => t.label).join(", ")}` : ""}.
            Each team plays three matches against the other teams in their group.
            The top two teams advance to the Round of 32.
          </p>
          <p>
            Make your predictions for every Group {upper} match on WorldCupClutch.
            Correct picks earn <strong>+3 points</strong> plus streak bonuses.
            Compete on the global leaderboard across all 104 World Cup 2026 matches.
          </p>
          <p>
            <Link href="/">← Back to all matches &amp; predictions</Link>
          </p>
        </section>
      </div>
    </>
  );
}
