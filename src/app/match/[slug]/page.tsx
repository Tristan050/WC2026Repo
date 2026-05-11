import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { MatchPickPanel } from "./pick-panel";

export const revalidate = 60; // ISR — refresh every minute

/* ─── Slug helpers ─── */
function toSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function matchSlug(home: string, away: string): string {
  return `${toSlug(home)}-vs-${toSlug(away)}`;
}

const FLAGS: Record<string, string> = {
  mexico:"🇲🇽", canada:"🇨🇦", usa:"🇺🇸", "united states":"🇺🇸", brazil:"🇧🇷",
  argentina:"🇦🇷", france:"🇫🇷", germany:"🇩🇪", spain:"🇪🇸", england:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  portugal:"🇵🇹", netherlands:"🇳🇱", belgium:"🇧🇪", japan:"🇯🇵", australia:"🇦🇺",
  morocco:"🇲🇦", senegal:"🇸🇳", ecuador:"🇪🇨", uruguay:"🇺🇾", colombia:"🇨🇴",
  croatia:"🇭🇷", ghana:"🇬🇭", switzerland:"🇨🇭", "south africa":"🇿🇦",
  "saudi arabia":"🇸🇦", "korea republic":"🇰🇷", "ir iran":"🇮🇷", panama:"🇵🇦",
  austria:"🇦🇹", turkey:"🇹🇷", turkiye:"🇹🇷", norway:"🇳🇴", sweden:"🇸🇪",
  scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", qatar:"🇶🇦", "cote d'ivoire":"🇨🇮", "cabo verde":"🇨🇻",
  "new zealand":"🇳🇿", czechia:"🇨🇿", "congo dr":"🇨🇩", algeria:"🇩🇿",
  jordan:"🇯🇴", iraq:"🇮🇶", uzbekistan:"🇺🇿", curacao:"🇨🇼", haiti:"🇭🇹",
  tunisia:"🇹🇳", egypt:"🇪🇬", iran:"🇮🇷", paraguay:"🇵🇾", chile:"🇨🇱",
};
function flag(label: string): string {
  const l = label.toLowerCase();
  return FLAGS[l] ?? Object.entries(FLAGS).find(([k]) => l.includes(k))?.[1] ?? "⚽";
}

function stageLabel(s: string): string {
  return ({ GROUP:"Group Stage", ROUND_OF_32:"Round of 32", ROUND_OF_16:"Round of 16",
    QUARTER_FINAL:"Quarter-Final", SEMI_FINAL:"Semi-Final",
    THIRD_PLACE:"Third Place", FINAL:"Final 🏆" }[s] ?? s.replaceAll("_"," "));
}

function fmtDate(utc: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit", timeZoneName:"short", hour12:false,
  }).format(utc);
}

function fmtDateShort(utc: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day:"numeric", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:false,
  }).format(utc);
}

function probsFromOdds(h?: number|null, d?: number|null, a?: number|null) {
  if (h && d && a) {
    const ih=1/h, id=1/d, ia=1/a, t=ih+id+ia;
    return { h:Math.round(ih/t*100), d:Math.round(id/t*100), a:Math.round(ia/t*100) };
  }
  return null;
}

/* ─── Data ─── */
async function getAllMatches() {
  try {
    return await prisma.match.findMany({
      select: {
        id: true,
        homeSlot: { select: { label: true } },
        awaySlot: { select: { label: true } },
      },
    });
  } catch { return []; }
}

async function getMatchBySlug(slug: string) {
  try {
    const all = await prisma.match.findMany({
      include: {
        stadium: true,
        homeSlot: { include: { team: true } },
        awaySlot: { include: { team: true } },
        windows: { orderBy: { openAt: "asc" } },
      },
    });
    return all.find(m =>
      matchSlug(m.homeSlot?.label ?? "", m.awaySlot?.label ?? "") === slug
    ) ?? null;
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
    const home = map["HOME"] ?? 0;
    const draw = map["DRAW"] ?? 0;
    const away = map["AWAY"] ?? 0;
    return { home, draw, away, total: home + draw + away };
  } catch { return null; }
}

/* ─── generateStaticParams ─── */
export async function generateStaticParams() {
  const matches = await getAllMatches();
  return matches.map(m => ({
    slug: matchSlug(m.homeSlot?.label ?? "", m.awaySlot?.label ?? ""),
  }));
}

/* ─── Metadata ─── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) return { title: "Match Not Found | WorldCupClutch" };

  const home = match.homeSlot?.label ?? "Home";
  const away = match.awaySlot?.label ?? "Away";
  const stage = stageLabel(match.stage);
  const city = match.stadium?.city ?? "";
  const stadium = match.stadium?.name ?? "";
  const dateStr = match.kickoffUtc ? fmtDateShort(match.kickoffUtc) : "";

  const title = `${home} vs ${away} — World Cup 2026 ${stage} Prediction | WorldCupClutch`;
  const description = `Predict the winner of ${home} vs ${away} at the FIFA World Cup 2026 ${stage}${city ? ` in ${city}` : ""}${dateStr ? ` on ${dateStr}` : ""}. Free pick'em game — join thousands of fans competing on the global leaderboard.`;

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";
  const ogUrl = `${SITE}/api/og?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&stage=${encodeURIComponent(stage)}&status=${match.status}`;

  return {
    title,
    description,
    keywords: [
      `${home} vs ${away}`,
      `${home} vs ${away} prediction`,
      `${home} vs ${away} World Cup 2026`,
      `${home} vs ${away} odds`,
      `World Cup 2026 ${stage}`,
      `${city} World Cup match`,
      stadium,
      "World Cup 2026 prediction",
      "FIFA 2026 pick em",
      "WorldCupClutch",
    ].filter(Boolean),
    alternates: { canonical: `/match/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE}/match/${slug}`,
      siteName: "WorldCupClutch",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${home} vs ${away} — WC 2026` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

/* ─── Page ─── */
export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; pick?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const match = await getMatchBySlug(slug);
  if (!match) notFound();

  const challengeRef = sp.ref ?? null;
  const challengePick = sp.pick ?? null;

  const home = match.homeSlot?.label ?? "Home";
  const away = match.awaySlot?.label ?? "Away";
  const probs = probsFromOdds(
    match.oddsHomeWin as number | null,
    match.oddsDraw as number | null,
    match.oddsAwayWin as number | null,
  );
  const isLive = ["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(match.status);
  const isFt   = match.status === "FINISHED";
  const isUpcoming = !isLive && !isFt;
  const openWindow  = match.windows?.find((w: { status: string }) => w.status === "OPEN");

  // Server-side pick distribution for open window
  const distribution = openWindow ? await getPickDistribution(openWindow.id) : null;
  const totalPicks = distribution?.total ?? 0;

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";
  const stage = stageLabel(match.stage);

  // Structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        name: `${home} vs ${away}`,
        description: `FIFA World Cup 2026 ${stage} — ${home} vs ${away}. Predict the winner on WorldCupClutch.`,
        startDate: match.kickoffUtc,
        eventStatus: isFt
          ? "https://schema.org/EventScheduled"
          : "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: match.stadium?.name ?? "TBD",
          address: {
            "@type": "PostalAddress",
            addressLocality: match.stadium?.city ?? "",
            addressCountry: "US",
          },
        },
        competitor: [
          { "@type": "SportsTeam", name: home },
          { "@type": "SportsTeam", name: away },
        ],
        url: `${SITE}/match/${slug}`,
        organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WorldCupClutch", item: SITE },
          { "@type": "ListItem", position: 2, name: "Matches", item: `${SITE}/#matches` },
          { "@type": "ListItem", position: 3, name: `${home} vs ${away}`, item: `${SITE}/match/${slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Challenge banner */}
      {challengeRef && (
        <div className="challenge-banner" role="alert">
          <span className="challenge-banner-icon" aria-hidden="true">🏆</span>
          <div className="challenge-banner-body">
            <strong>{decodeURIComponent(challengeRef)}</strong> challenged you!
            {challengePick && (
              <span className="challenge-banner-pick">
                {" "}Their pick:{" "}
                <strong>
                  {challengePick === "HOME" ? `${home} Win`
                    : challengePick === "AWAY" ? `${away} Win`
                    : "Draw"}
                </strong>
                {" "}— can you beat them?
              </span>
            )}
          </div>
        </div>
      )}

      <div className="match-page-wrapper">
        {/* Back link + breadcrumb */}
        <nav className="match-page-nav" aria-label="Breadcrumb">
          <Link href="/" className="match-page-back">← WorldCupClutch</Link>
          <span className="match-page-nav-sep" aria-hidden="true">/</span>
          <span className="match-page-nav-current">{home} vs {away}</span>
        </nav>

        {/* SEO H1 */}
        <h1 className="match-page-h1">
          {flag(home)} {home} vs {away} {flag(away)}
          <span className="match-page-subtitle">
            World Cup 2026 {stage} Prediction
          </span>
        </h1>

        {/* Match card */}
        <div className="match-page-card">
          <div className="match-page-status-row">
            <span className={`match-page-badge ${isLive ? "badge-live-mp" : isFt ? "badge-ft-mp" : "badge-upcoming-mp"}`}>
              {isLive ? "🔴 LIVE" : isFt ? "✓ Full Time" : "⏰ Upcoming"}
            </span>
            <span className="match-page-stage">{stage}</span>
            {match.matchNumber && (
              <span className="match-page-stage">Match #{match.matchNumber}</span>
            )}
          </div>

          <div className="match-page-teams">
            <div className="match-page-team">
              <span className="match-page-flag">{flag(home)}</span>
              <span className="match-page-team-name">{home}</span>
              {(isLive || isFt) && (
                <span className="match-page-score">{match.homeScore ?? 0}</span>
              )}
            </div>
            <div className="match-page-sep">
              {isUpcoming ? <span className="match-page-vs">VS</span> : "–"}
            </div>
            <div className="match-page-team away">
              {(isLive || isFt) && (
                <span className="match-page-score">{match.awayScore ?? 0}</span>
              )}
              <span className="match-page-team-name">{away}</span>
              <span className="match-page-flag">{flag(away)}</span>
            </div>
          </div>

          {isUpcoming && match.kickoffUtc && (
            <p className="match-page-kickoff">
              🗓 {fmtDate(match.kickoffUtc)}
              {match.stadium?.city && ` · ${match.stadium.city}`}
            </p>
          )}

          {/* Odds / probability bar */}
          {probs && (
            <div className="match-page-odds">
              <div className="match-page-odds-bar">
                <div style={{ width:`${probs.h}%`, background:"#3385ff", height:"100%", borderRadius:"4px 0 0 4px" }} />
                <div style={{ width:`${probs.d}%`, background:"#4a6a8a", height:"100%" }} />
                <div style={{ width:`${probs.a}%`, background:"#ff6b35", height:"100%", borderRadius:"0 4px 4px 0" }} />
              </div>
              <div className="match-page-odds-labels">
                <span style={{ color:"#3385ff" }}>{probs.h}% {home}</span>
                <span style={{ color:"#4a6a8a" }}>{probs.d}% Draw</span>
                <span style={{ color:"#ff6b35" }}>{probs.a}% {away}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Inline Pick Panel (replaces "go to homepage" CTA) ── */}
        {openWindow ? (
          <MatchPickPanel
            matchId={match.id}
            windowId={openWindow.id}
            home={home}
            away={away}
          />
        ) : (
          <div className="match-page-cta-box">
            <p className="match-page-cta-label">
              {isFt
                ? "This match has ended."
                : "🔒 Prediction window opens 24 hours before kickoff."}
            </p>
            <Link href="/" className="match-page-cta-btn">
              Browse all matches →
            </Link>
          </div>
        )}

        {/* ── Venue & match details ── */}
        <section className="match-page-details" aria-label="Match details">
          <h2>Match Details</h2>
          <dl className="match-detail-grid">
            {match.stadium?.name && (
              <>
                <dt>Venue</dt>
                <dd>🏟 {match.stadium.name}{match.stadium.city ? `, ${match.stadium.city}` : ""}</dd>
              </>
            )}
            {match.kickoffUtc && (
              <>
                <dt>Kick-off</dt>
                <dd>🗓 {fmtDate(match.kickoffUtc)}</dd>
              </>
            )}
            <dt>Stage</dt>
            <dd>⚽ {stage}</dd>
            {match.matchNumber && (
              <>
                <dt>Match</dt>
                <dd>#{match.matchNumber} of 104</dd>
              </>
            )}
            {totalPicks > 0 && (
              <>
                <dt>Predictions</dt>
                <dd>🎯 {totalPicks.toLocaleString()} picks submitted</dd>
              </>
            )}
            {probs && (
              <>
                <dt>Favourite</dt>
                <dd>
                  {probs.h > probs.a
                    ? `${flag(home)} ${home} (${probs.h}% implied)`
                    : probs.a > probs.h
                    ? `${flag(away)} ${away} (${probs.a}% implied)`
                    : "Even match"}
                </dd>
              </>
            )}
          </dl>
        </section>

        {/* ── Community picks (server-rendered snapshot) ── */}
        {distribution && distribution.total > 0 && (
          <section className="match-page-community" aria-label="Community predictions">
            <h2>Community Predictions</h2>
            <p className="mp-community-sub">{distribution.total.toLocaleString()} players have predicted this match</p>
            {(["HOME", "DRAW", "AWAY"] as const).map(c => {
              const count = c === "HOME" ? distribution.home : c === "DRAW" ? distribution.draw : distribution.away;
              const pct = distribution.total > 0 ? Math.round(count / distribution.total * 100) : 0;
              const label = c === "HOME" ? `${flag(home)} ${home} Win` : c === "AWAY" ? `${away} Win ${flag(away)}` : "Draw";
              return (
                <div key={c} className="mp-community-row">
                  <span className="mp-community-label">{label}</span>
                  <div className="mp-community-bar">
                    <div className="mp-community-fill" style={{ width:`${pct}%` }} />
                  </div>
                  <span className="mp-community-pct">{pct}%</span>
                </div>
              );
            })}
          </section>
        )}

        {/* ── SEO content ── */}
        <section className="match-page-seo">
          <h2>About {home} vs {away} — World Cup 2026</h2>
          <p>
            <strong>{home}</strong> takes on <strong>{away}</strong> in the <strong>{stage}</strong> of
            the FIFA World Cup 2026, hosted across the United States, Canada, and Mexico.
            {match.stadium?.name
              ? ` This fixture is played at ${match.stadium.name}${match.stadium.city ? ` in ${match.stadium.city}` : ""}.`
              : ""}
            {match.kickoffUtc
              ? ` Kick-off is scheduled for ${fmtDate(match.kickoffUtc)}.`
              : ""}
          </p>
          {probs && (
            <p>
              Based on current market odds, <strong>{home}</strong> hold a <strong>{probs.h}%</strong> implied
              win probability, <strong>{away}</strong> <strong>{probs.a}%</strong>, with a draw at{" "}
              <strong>{probs.d}%</strong>.{" "}
              {probs.h > probs.a + 10
                ? `${home} enter as clear favourites.`
                : probs.a > probs.h + 10
                ? `${away} are the slight favourites despite playing away.`
                : "The match is expected to be closely contested."}
            </p>
          )}
          <p>
            The FIFA World Cup 2026 is the first edition to feature <strong>48 teams</strong> and{" "}
            <strong>104 matches</strong>, spread across 16 host cities in the USA, Canada, and Mexico.
            {match.stage === "GROUP"
              ? " In the expanded group stage, each group contains four teams playing three matches each, with the top two advancing to the Round of 32."
              : match.stage === "FINAL"
              ? " The 2026 World Cup Final will be played at MetLife Stadium in New York/New Jersey."
              : ""}
          </p>
          <p>
            <strong>WorldCupClutch</strong> is a free pick&rsquo;em prediction game covering all 104
            World Cup 2026 matches. Predict the winner before kick-off, earn points for correct calls,
            build a winning streak, and compete on the global leaderboard against fans worldwide.
            Sign in with Google to save your picks and track your rank across the tournament.
          </p>
        </section>
      </div>
    </>
  );
}
