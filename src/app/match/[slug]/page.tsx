import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

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
  austria:"🇦🇹", turkey:"🇹🇷", turkiye:"🇹🇷",
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

function fmtDate(utc: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit", timeZoneName:"short", hour12:false,
  }).format(utc instanceof Date ? utc : new Date(utc));
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
  } catch {
    return [];
  }
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
  } catch {
    return null;
  }
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

  const title = `${home} vs ${away} — World Cup 2026 ${stage} Prediction | WorldCupClutch`;
  const description = `Predict the winner of ${home} vs ${away} at FIFA World Cup 2026 ${stage}${city ? ` in ${city}` : ""}. Free pick'em game — join thousands of fans competing on the global leaderboard.`;

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";
  const ogUrl = `${SITE}/api/og?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&stage=${encodeURIComponent(stage)}&status=${match.status}`;

  return {
    title,
    description,
    alternates: { canonical: `/match/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/match/${slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
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

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

  return (
    <>
      {/* Challenge banner — shown when ?ref=X is in the URL */}
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
          <a href={`/?predict=${match.id}`} className="challenge-banner-pick-btn">
            Make your pick →
          </a>
        </div>
      )}

      {/* Inline JSON-LD for this specific match */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: `${home} vs ${away}`,
            startDate: match.kickoffUtc,
            location: {
              "@type": "Place",
              name: match.stadium?.name ?? "TBD",
              address: { "@type": "PostalAddress", addressLocality: match.stadium?.city ?? "" },
            },
            competitor: [
              { "@type": "SportsTeam", name: home },
              { "@type": "SportsTeam", name: away },
            ],
            url: `${SITE}/match/${slug}`,
            description: `FIFA World Cup 2026 ${stageLabel(match.stage)} — ${home} vs ${away}`,
          }),
        }}
      />

      <div className="match-page-wrapper">
        {/* Back link */}
        <Link href="/" className="match-page-back">← WorldCupClutch</Link>

        {/* SEO H1 */}
        <h1 className="match-page-h1">
          {flag(home)} {home} vs {away} {flag(away)}
          <span className="match-page-subtitle">
            World Cup 2026 {stageLabel(match.stage)} Prediction
          </span>
        </h1>

        {/* Match card */}
        <div className="match-page-card">
          <div className="match-page-status-row">
            <span className={`match-page-badge ${isLive ? "badge-live-mp" : isFt ? "badge-ft-mp" : "badge-upcoming-mp"}`}>
              {isLive ? "🔴 LIVE" : isFt ? "✓ Full Time" : "⏰ Upcoming"}
            </span>
            <span className="match-page-stage">{stageLabel(match.stage)}</span>
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
                <div style={{ width: `${probs.h}%`, background: "#3385ff", height: "100%", borderRadius: "4px 0 0 4px" }} />
                <div style={{ width: `${probs.d}%`, background: "#4a6a8a", height: "100%" }} />
                <div style={{ width: `${probs.a}%`, background: "#ff6b35", height: "100%", borderRadius: "0 4px 4px 0" }} />
              </div>
              <div className="match-page-odds-labels">
                <span style={{ color: "#3385ff" }}>{probs.h}% Home</span>
                <span style={{ color: "#4a6a8a" }}>{probs.d}% Draw</span>
                <span style={{ color: "#ff6b35" }}>{probs.a}% Away</span>
              </div>
            </div>
          )}
        </div>

        {/* Pick CTA */}
        <div className="match-page-cta-box">
          {openWindow ? (
            <>
              <p className="match-page-cta-label">🟢 Prediction window is open!</p>
              <a href={`/?predict=${match.id}`} className="match-page-cta-btn">
                Make your pick →
              </a>
            </>
          ) : (
            <>
              <p className="match-page-cta-label">
                {isFt ? "This match has ended." : "Prediction window opens 24h before kickoff."}
              </p>
              <a href="/" className="match-page-cta-btn">
                Browse all matches →
              </a>
            </>
          )}
        </div>

        {/* SEO copy */}
        <section className="match-page-seo">
          <h2>About this match</h2>
          <p>
            {home} takes on {away} in the {stageLabel(match.stage)} of the FIFA World Cup 2026,
            hosted across the United States, Canada and Mexico.
            {match.stadium?.city ? ` This fixture is played in ${match.stadium.city}.` : ""}
            {probs ? ` Based on current odds, ${home} are the ${probs.h > probs.a ? "favourites" : probs.a > probs.h ? "underdogs" : "even"} with a ${probs.h}% implied win probability.` : ""}
          </p>
          <p>
            WorldCupClutch is a free pick&rsquo;em prediction game for all 104 World Cup 2026 matches.
            Predict the winner, earn points, build your streak and compete on the global leaderboard.
          </p>
        </section>
      </div>
    </>
  );
}
