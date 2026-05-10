"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { signIn, signOut } from "next-auth/react";

/* ─────────────────────── COUNTDOWN ─────────────────────── */
const KICKOFF_UTC = new Date("2026-06-11T18:00:00.000Z");

function useCountdown() {
  const [left, setLeft] = useState(() => KICKOFF_UTC.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(KICKOFF_UTC.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (left <= 0) return null;
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hrs: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

function CountdownBanner({ onPickNow }: { onPickNow?: () => void }) {
  const t = useCountdown();
  const p = (n: number) => String(n).padStart(2, "0");

  if (!t) return (
    <div className="cd-banner cd-banner-live" role="status" aria-label="World Cup 2026 is live">
      <span className="cd-live-pulse" aria-hidden="true" />
      <span className="cd-live-label">🏆 WORLD CUP 2026 IS LIVE</span>
      <span className="cd-live-pulse" aria-hidden="true" />
    </div>
  );

  return (
    <div
      className="cd-banner"
      role="timer"
      aria-label={`Kickoff in ${t.days} days ${t.hrs} hours ${t.mins} minutes ${t.secs} seconds`}
    >
      <span className="cd-eyebrow">⚽ KICKOFF IN</span>
      <div className="cd-clock" aria-hidden="true">
        <div className="cd-unit">
          <span className="cd-n" key={t.days}>{t.days}</span>
          <span className="cd-l">DAYS</span>
        </div>
        <span className="cd-sep">:</span>
        <div className="cd-unit">
          <span className="cd-n cd-flip" key={`h${t.hrs}`}>{p(t.hrs)}</span>
          <span className="cd-l">HRS</span>
        </div>
        <span className="cd-sep">:</span>
        <div className="cd-unit">
          <span className="cd-n cd-flip" key={`m${t.mins}`}>{p(t.mins)}</span>
          <span className="cd-l">MIN</span>
        </div>
        <span className="cd-sep cd-sep-blink">:</span>
        <div className="cd-unit cd-unit-sec">
          <div className="cd-flip-card" key={t.secs}>
            <span className="cd-n cd-n-sec cd-flip-face">{p(t.secs)}</span>
          </div>
          <span className="cd-l">SEC</span>
        </div>
      </div>
      <span className="cd-match">🇲🇽 Mexico vs South Africa 🇿🇦 · Azteca</span>
      {onPickNow && (
        <button className="cd-cta-btn" onClick={onPickNow} aria-label="Pre-register your picks">
          Pre-register picks →
        </button>
      )}
    </div>
  );
}



/* ─────────────────────── TYPES ─────────────────────── */
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

type Tab = "matches" | "predict" | "leaderboard" | "profile";

/* ─────────────────────── FLAG MAP ─────────────────────── */
const FLAGS: Record<string, string> = {
  mexico: "🇲🇽", canada: "🇨🇦", usa: "🇺🇸", "united states": "🇺🇸", brazil: "🇧🇷", argentina: "🇦🇷",
  france: "🇫🇷", germany: "🇩🇪", spain: "🇪🇸", england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", portugal: "🇵🇹", netherlands: "🇳🇱",
  belgium: "🇧🇪", japan: "🇯🇵", australia: "🇦🇺", morocco: "🇲🇦", senegal: "🇸🇳", ecuador: "🇪🇨",
  uruguay: "🇺🇾", colombia: "🇨🇴", norway: "🇳🇴", sweden: "🇸🇪", croatia: "🇭🇷", ghana: "🇬🇭",
  switzerland: "🇨🇭", scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", turkey: "🇹🇷", turkiye: "🇹🇷", qatar: "🇶🇦",
  "south africa": "🇿🇦", "korea republic": "🇰🇷", "ir iran": "🇮🇷", "cote d'ivoire": "🇨🇮",
  "cabo verde": "🇨🇻", "saudi arabia": "🇸🇦", "new zealand": "🇳🇿", "bosnia and herzegovina": "🇧🇦",
  czechia: "🇨🇿", "congo dr": "🇨🇩", panama: "🇵🇦", algeria: "🇩🇿", austria: "🇦🇹", jordan: "🇯🇴",
  iraq: "🇮🇶", uzbekistan: "🇺🇿", curacao: "🇨🇼", haiti: "🇭🇹", tunisia: "🇹🇳", egypt: "🇪🇬",
  iran: "🇮🇷", paraguay: "🇵🇾",
};
function flag(label: string): string {
  if (!label) return "";
  const l = label.toLowerCase();
  return FLAGS[l] ?? Object.entries(FLAGS).find(([k]) => l.includes(k))?.[1] ?? "";
}

/* ── Slug helpers (shared with /match/[slug]) ── */
function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function matchSlugFor(home: string, away: string) {
  return `${toSlug(home)}-vs-${toSlug(away)}`;
}
const SITE = typeof window !== "undefined"
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com");

/* ─────────────────────── HELPERS ─────────────────────── */
function fmtKickoff(utc: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(utc));
}
function countdown(utc: string): string | null {
  const d = new Date(utc).getTime() - Date.now();
  if (d <= 0) return null;
  const days = Math.floor(d / 86400000);
  const hrs = Math.floor((d % 86400000) / 3600000);
  const mins = Math.floor((d % 3600000) / 60000);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
function matchStatus(s: string): "LIVE" | "FT" | "UPCOMING" {
  if (["LIVE", "HALFTIME", "EXTRA_TIME", "PENALTIES"].includes(s)) return "LIVE";
  if (s === "FINISHED") return "FT";
  return "UPCOMING";
}
function stageLabel(s: string): string {
  return ({
    GROUP: "Group Stage", ROUND_OF_32: "Round of 32", ROUND_OF_16: "Round of 16",
    QUARTER_FINAL: "Quarter-Final", SEMI_FINAL: "Semi-Final",
    THIRD_PLACE: "Third Place", FINAL: "Final 🏆",
  }[s] ?? s.replaceAll("_", " "));
}
/* Team strength lookup — derived from FIFA world rankings (pre-WC 2026).
   Scale: 100 = best, 40 = weakest qualifier. Used as fallback when DB odds are null. */
const TEAM_STR: Record<string, number> = {
  argentina: 97, france: 95, spain: 93, england: 91, brazil: 90,
  portugal: 89, belgium: 87, netherlands: 86, germany: 85, croatia: 83,
  italy: 82, uruguay: 81, colombia: 80, mexico: 79, usa: 78,
  morocco: 77, japan: 76, switzerland: 75, senegal: 74, denmark: 73,
  austria: 72, turkey: 72, turkiye: 72, ukraine: 71, "south korea": 70,
  "korea republic": 70, australia: 69, iran: 68, "ir iran": 68,
  ecuador: 67, canada: 66, peru: 65, "saudi arabia": 64, ghana: 63,
  "cote d'ivoire": 63, egypt: 62, nigeria: 62, algeria: 61, chile: 60,
  venezuela: 59, honduras: 58, jamaica: 57, "costa rica": 56, panama: 55,
  paraguay: 55, bolivia: 54, "south africa": 53, cameroon: 53, mali: 52,
  kenya: 51, "cabo verde": 50, curacao: 48, haiti: 46,
  "new zealand": 46, uzbekistan: 50, iraq: 52, jordan: 50,
  "congo dr": 48, "bosnia and herzegovina": 60, czechia: 65, norway: 70,
  sweden: 69, scotland: 67, qatar: 50, tunisia: 60,
};
function teamStr(label: string): number {
  const l = label.toLowerCase();
  return TEAM_STR[l] ?? Object.entries(TEAM_STR).find(([k]) => l.includes(k))?.[1] ?? 60;
}

function probsFromOdds(h?: number | null, d?: number | null, a?: number | null) {
  if (h && d && a) {
    const ih = 1 / h, id = 1 / d, ia = 1 / a, t = ih + id + ia;
    return { h: Math.round(ih / t * 100), d: Math.round(id / t * 100), a: Math.round(ia / t * 100) };
  }
  // Fallback: team-strength based pseudo-odds
  return (hl: string, al: string) => {
    const hs = teamStr(hl) * 1.08; // slight home advantage
    const as_ = teamStr(al);
    const total = hs + as_;
    // Draw probability: closer teams → more draw chance
    const diff = Math.abs(hs - as_) / total;
    const drawBase = 0.28 - diff * 0.18; // range ~10-28%
    const dv = Math.round(Math.max(10, Math.min(28, drawBase * 100)));
    const remaining = 100 - dv;
    const hv = Math.round((hs / total) * remaining);
    const av = remaining - hv;
    return { h: hv, d: dv, a: av };
  };
}

/* ─────────────────────── BRACKET META ─────────────────────── */
const STAGE_META: Record<string, { color: string; icon: string; total: number; from?: string }> = {
  GROUP: { color: "#4d94ff", icon: "⚽", total: 72, from: "Jun 11" },
  ROUND_OF_32: { color: "#80aaff", icon: "32", total: 16, from: "Jun 28" },
  ROUND_OF_16: { color: "#a0c0ff", icon: "16", total: 8, from: "Jul 4" },
  QUARTER_FINAL: { color: "#ffc947", icon: "⚡", total: 4, from: "Jul 9" },
  SEMI_FINAL: { color: "#ff9f40", icon: "🔥", total: 2, from: "Jul 14" },
  THIRD_PLACE: { color: "#94b4d4", icon: "🥉", total: 1, from: "Jul 18" },
  FINAL: { color: "#ffc947", icon: "🏆", total: 1, from: "Jul 19" },
};
const ALL_STAGES = ["GROUP", "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"];

/* ─────────────────────── SOUND ─────────────────────── */
function playPickSound() {
  try {
    type AudioCtxCtor = typeof AudioContext;
    const Ctor: AudioCtxCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.32);
  } catch { /* unsupported — silent */ }
}

/* ─────────────────────── OPEN WINDOWS STRIP ─────────────────────── */
function OpenWindowsStrip({
  matches,
  onPickMatch,
}: {
  matches: LiveMatch[];
  onPickMatch: (idx: number) => void;
}) {
  const open = matches
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.windows?.some(w => w.status === "OPEN"));
  if (open.length === 0) return null;
  return (
    <div className="ow-strip" aria-label={`${open.length} open prediction window${open.length > 1 ? "s" : ""}`}>
      <span className="ow-strip-label" aria-hidden="true">
        <span className="ow-dot" />
        {open.length} open now
      </span>
      <div className="ow-scroll" role="list">
        {open.slice(0, 5).map(({ m, idx }) => (
          <button
            key={m.id}
            className="ow-card"
            role="listitem"
            onClick={() => onPickMatch(idx)}
            aria-label={`Pick now: ${m.homeSlot?.label} vs ${m.awaySlot?.label}`}
          >
            <span className="ow-teams">
              {flag(m.homeSlot?.label ?? "")} {m.homeSlot?.label}
              <span className="ow-vs">vs</span>
              {m.awaySlot?.label} {flag(m.awaySlot?.label ?? "")}
            </span>
            <span className="ow-cta">Pick now →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── SKELETON ─────────────────────── */
function SkeletonMatchCard() {
  return (
    <div className="skel-card">
      <div className="skel-row">
        <div className="skeleton" style={{ height: 13, width: "55%" }} />
        <div className="skeleton" style={{ height: 30, width: 56, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 13, width: "55%", marginLeft: "auto" }} />
      </div>
      <div className="skeleton" style={{ height: 4, borderRadius: 4, margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div className="skeleton" style={{ height: 10, width: "30%" }} />
        <div className="skeleton" style={{ height: 10, width: "20%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────── ODDS BAR ─────────────────────── */
function ProbBar({ home, away, oh, od, oa }: { home: string; away: string; oh?: number | null; od?: number | null; oa?: number | null }) {
  const hash = (s: string) => s.split("").reduce((x, c) => x + c.charCodeAt(0), 17);
  const p = (oh && od && oa)
    ? (() => { const ih = 1 / oh, id = 1 / od, ia = 1 / oa, t = ih + id + ia; return { h: Math.round(ih / t * 100), d: Math.round(id / t * 100), a: Math.round(ia / t * 100) }; })()
    : (() => { const hv = ((hash(home) % 35) + 28), av = ((hash(away) % 30) + 20), dv = Math.max(8, 100 - hv - av), t = hv + av + dv; return { h: Math.round(hv / t * 100), d: Math.round(dv / t * 100), a: Math.round(av / t * 100) }; })();
  return (
    <div className="prob-bar-wrap">
      <div className="prob-bar" role="presentation" aria-label={`Win probability: Home ${p.h}%, Draw ${p.d}%, Away ${p.a}%`}>
        <div className="prob-seg prob-home" style={{ width: `${p.h}%` }} />
        <div className="prob-seg prob-draw" style={{ width: `${p.d}%` }} />
        <div className="prob-seg prob-away" style={{ width: `${p.a}%` }} />
      </div>
      <div className="prob-labels">
        <span className="prob-h">{p.h}%</span>
        <span className="prob-d">{p.d}%</span>
        <span className="prob-a">{p.a}%</span>
      </div>
    </div>
  );
}

/* ─────────────────────── BRACKET TILE ─────────────────────── */
function BracketTile({ stage, matches, onPress }: { stage: string; matches: BracketStage["matches"]; onPress: () => void }) {
  const m = STAGE_META[stage] ?? STAGE_META.GROUP;
  const done = matches.filter(x => x.status === "FINISHED").length;
  const filled = Math.min(100, (matches.length / m.total) * 100);
  const donePct = Math.min(100, (done / m.total) * 100);
  const empty = matches.length === 0;

  // Collect unique team flags from this stage's matches (max 8 shown)
  const teamFlags = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const bm of matches) {
      for (const label of [bm.homeSlot?.label ?? "", bm.awaySlot?.label ?? ""]) {
        if (label && !seen.has(label)) {
          seen.add(label);
          const f = flag(label);
          if (f) out.push(f);
        }
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [matches]);

  return (
    <button
      className={`bracket-tile${empty ? " coming" : ""}`}
      onClick={empty ? undefined : onPress}
      style={{ "--bc-color": m.color } as React.CSSProperties}
      aria-label={`${stageLabel(stage)}: ${matches.length} of ${m.total} fixtures`}
    >
      <div className="bt-top">
        <span className="bt-icon" aria-hidden="true">{m.icon}</span>
        <span className="bt-name">{stageLabel(stage)}</span>
      </div>
      {empty ? (
        <>
          <div className="bt-coming">⏳ Coming soon</div>
          {m.from && <div className="bt-coming-date">From {m.from}</div>}
        </>
      ) : (
        <>
          <div>
            <span className="bt-count">{matches.length}</span>
            <span className="bt-total">/{m.total}</span>
          </div>
          {teamFlags.length > 0 && (
            <div className="bt-flags" aria-hidden="true">
              {teamFlags.slice(0, 6).map((f, i) => (
                <span key={i} className="bt-flag">{f}</span>
              ))}
              {teamFlags.length > 6 && <span className="bt-flag-more">+{teamFlags.length - 6}</span>}
            </div>
          )}
          <div className="bt-bar">
            <div className="bt-bar-fill" style={{ width: `${filled}%` }} />
            <div className="bt-bar-done" style={{ width: `${donePct}%` }} />
          </div>
        </>
      )}
    </button>
  );
}

/* ─────────────────────── TYPES: LEADERBOARD / PROFILE ─────────────────────── */
type LbRow = {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  image: string | null;
  points: number;
  xp: number;
  streakCurrent: number;
  streakBest: number;
  totalPicks: number;
};

type ProfileData = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  points: number;
  xp: number;
  streakCurrent: number;
  streakBest: number;
  role: string;
  totalPicks: number;
  rank: number | null;
  accuracy: number | null;
  awards: { badgeCode: string; title: string }[];
  picks: {
    id: string;
    choice: string;
    isCorrect: boolean | null;
    pointsAwarded: number;
    submittedAt: string;
    window: {
      kind: string;
      match: {
        matchNumber: number;
        stage: string;
        homeSlot: { label: string };
        awaySlot: { label: string };
        homeScore: number;
        awayScore: number;
        status: string;
      };
    };
  }[];
};

/* ─────────────────────── AVATAR HELPER ─────────────────────── */
function Avatar({ name, image, size = 32 }: { name: string; image?: string | null; size?: number }) {
  if (image) return (
    <img
      src={image}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      referrerPolicy="no-referrer"
    />
  );
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#0066ff", "#0052cc", "#0044aa", "#1a75ff", "#3385ff"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, #003399)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff",
      flexShrink: 0, fontFamily: "var(--font-display)",
    }}>
      {initials || "?"}
    </div>
  );
}

/* ─────────────────────── LEADERBOARD SCREEN ─────────────────────── */
const LB_PERIODS = [
  { key: "TOURNAMENT", label: "All Time", subkey: "wc2026" },
  { key: "MATCHDAY", label: "Matchday", subkey: "latest" },
  { key: "DAILY", label: "Today", subkey: "today" },
] as const;

function LeaderboardScreen({ currentUserId }: { currentUserId?: string }) {
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"TOURNAMENT" | "MATCHDAY" | "DAILY">("TOURNAMENT");
  const [subkey, setSubkey] = useState("wc2026");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/leaderboard/global?period=${period}&key=${subkey}&limit=50`)
      .then(r => r.json())
      .then(d => { setRows(d.rows ?? []); setLoading(false); })
      .catch(() => { setError("Could not load leaderboard."); setLoading(false); });
  }, [period, subkey]);

  const myRank = rows.find(r => r.userId === currentUserId);

  return (
    <div style={{ marginTop: "var(--space-4)" }}>
      {/* Period selector */}
      <div className="lb-period-bar" role="tablist" aria-label="Leaderboard period">
        {LB_PERIODS.map(p => (
          <button
            key={p.key}
            role="tab"
            aria-selected={period === p.key}
            className={`lb-period-btn${period === p.key ? " active" : ""}`}
            onClick={() => { setPeriod(p.key); setSubkey(p.subkey); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="panel" style={{ marginTop: "var(--space-3)" }}>
        <div className="section-header">
          <h2 className="section-title">🏅 Global Rankings</h2>
          <span className="section-action">WC2026</span>
        </div>

        {/* Your rank banner */}
        {myRank && (
          <div className="lb-my-rank" role="status">
            <span className="lb-my-rank-label">Your rank</span>
            <span className="lb-my-rank-val">#{myRank.rank}</span>
            <span className="lb-my-rank-pts">{myRank.points.toLocaleString()} pts</span>
          </div>
        )}

        {loading ? (
          <div className="leaderboard-panel">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="lb-row">
                <div className="skeleton" style={{ width: 28, height: 18, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <div className="skeleton" style={{ flex: 1, height: 14 }} />
                <div className="skeleton" style={{ width: 50, height: 18 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="lb-empty">
            <div className="lb-empty-icon">⚠️</div>
            <p className="lb-empty-title">Could not load rankings</p>
            <p className="lb-empty-sub">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="lb-empty" role="status">
            <div className="lb-empty-icon" aria-hidden="true">🎯</div>
            <p className="lb-empty-title">No picks scored yet</p>
            <p className="lb-empty-sub">
              Rankings go live once prediction windows score.<br />
              Be early — start predicting now.
            </p>
          </div>
        ) : (
          <div className="leaderboard-panel" role="list" aria-label="Global leaderboard">
            {rows.map(u => (
              <article
                key={u.userId}
                className={`lb-row${u.userId === currentUserId ? " lb-row-me" : ""}`}
                role="listitem"
              >
                <span className={`lb-rank${u.rank <= 3 ? ` top${u.rank}` : ""}`} aria-label={`Rank ${u.rank}`}>
                  {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : u.rank}
                </span>
                <Avatar name={u.name} image={u.image} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lb-name">{u.name}</div>
                  {u.username && <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>@{u.username}</div>}
                </div>
                {u.streakCurrent > 0 && (
                  <span className="lb-streak" title={`${u.streakCurrent} correct in a row`}>
                    🔥 {u.streakCurrent}
                  </span>
                )}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="lb-pts">{u.points.toLocaleString()}</div>
                  <div className="lb-pts-label">PTS</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── SIGN IN PANEL ─────────────────────── */
function SignInPanel({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="signin-panel">
      <div className="signin-icon" aria-hidden="true">⚽</div>
      <h2 className="signin-title">Join WorldCupClutch</h2>
      <p className="signin-sub">
        Sign in to save your picks, build your streak, and compete on the global leaderboard across all 104 World Cup 2026 matches.
      </p>
      <div className="signin-perks">
        <div className="signin-perk">🏅 Global leaderboard ranking</div>
        <div className="signin-perk">🔥 Streak tracking & badges</div>
        <div className="signin-perk">📊 Pick history & accuracy stats</div>
        <div className="signin-perk">🔔 Match reminders (coming soon)</div>
      </div>
      <button className="btn-google" onClick={onSignIn} aria-label="Sign in with Google">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>
      <p className="signin-legal">
        Free to play · No credit card required
      </p>
    </div>
  );
}

/* ─────────────────────── PROFILE SCREEN ─────────────────────── */
const ALL_BADGES = [
  { code: "first_pick", icon: "⚡", name: "First Pick" },
  { code: "sharp_eye", icon: "🎯", name: "Sharp Eye" },
  { code: "on_fire", icon: "🔥", name: "On Fire" },
  { code: "champion", icon: "🏆", name: "Champion" },
  { code: "globe", icon: "🌍", name: "Globe Trotter" },
  { code: "upset_king", icon: "💡", name: "Upset King" },
  { code: "streaker", icon: "📈", name: "Streaker" },
  { code: "top_10", icon: "🥇", name: "Top 10" },
];

const SUPPORTER_TEAMS = [
  "Mexico", "USA", "Canada", "Brazil", "Argentina", "France",
  "Germany", "Spain", "England", "Portugal", "Netherlands",
  "Japan", "Morocco", "South Africa", "Australia", "Belgium",
];

function ProfileScreen({
  onSignIn,
  onStartPicking,
  soundEnabled,
  onSoundToggle,
  supporterTeam,
  onSupporterChange,
}: {
  onSignIn: () => void;
  onStartPicking: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  supporterTeam: string;
  onSupporterChange: (team: string) => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile/me")
      .then(r => {
        if (r.status === 401) { setAuthed(false); setLoading(false); return null; }
        setAuthed(true);
        return r.json();
      })
      .then(d => { if (d) { setProfile(d); setUsername(d.username ?? ""); } })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const saveUsername = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      setSaveMsg("✓ Saved!");
      setEditing(false);
      setProfile(p => p ? { ...p, username: d.username } : p);
    } else {
      setSaveMsg(d.error ?? "Error saving.");
    }
  };

  if (loading) return (
    <div className="panel" style={{ marginTop: "var(--space-4)", padding: "var(--space-10)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 16, borderRadius: 8, width: `${70 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );

  if (!authed || !profile) return (
    <SignInPanel onSignIn={onSignIn} />
  );

  const earnedCodes = new Set(profile.awards.map(a => a.badgeCode));

  return (
    <div className="profile-panel" style={{ marginTop: "var(--space-4)" }}>
      <div className="panel">
        {/* Header */}
        <header className="profile-header">
          <Avatar name={profile.name ?? profile.username ?? "?"} image={profile.image} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="profile-info-name">{profile.name ?? profile.username ?? "Anonymous Fan"}</p>
            {editing ? (
              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="username-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username"
                  maxLength={20}
                  aria-label="Edit username"
                />
                <button className="btn-save" onClick={saveUsername} disabled={saving}>
                  {saving ? "…" : "Save"}
                </button>
                <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                {saveMsg && <span style={{ fontSize: "0.72rem", color: "var(--accent-green)" }}>{saveMsg}</span>}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <p className="profile-info-sub">
                  {profile.username ? `@${profile.username}` : "No username set"} · {profile.totalPicks} picks
                </p>
                <button className="btn-edit" onClick={() => setEditing(true)} aria-label="Edit username">✏️</button>
              </div>
            )}
          </div>
          {profile.rank && (
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--accent-gold)", lineHeight: 1 }}>
                #{profile.rank}
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Global Rank
              </div>
            </div>
          )}
        </header>

        <div className="divider" />

        {/* Empty state — new user with no picks yet */}
        {profile.totalPicks === 0 && (
          <div className="profile-empty-state" aria-label="Get started">
            <span className="profile-empty-icon" aria-hidden="true">🎯</span>
            <p className="profile-empty-title">Make your first pick to join the leaderboard</p>
            <p className="profile-empty-sub">Pick a match winner, earn points, build your streak — your stats will appear here after your first prediction.</p>
            <button className="hero-cta" style={{ marginBottom: 0 }} onClick={onStartPicking}>
              Pick Match 1 →
            </button>
          </div>
        )}

        {/* Stats row */}
        {profile.totalPicks > 0 && (
        <div className="profile-stats-row">
          {[
            { v: profile.points.toLocaleString(), l: "Points" },
            { v: profile.streakCurrent, l: "Streak 🔥" },
            { v: profile.streakBest, l: "Best Streak" },
            { v: profile.accuracy !== null ? `${profile.accuracy}%` : "—", l: "Accuracy" },
          ].map((s, i) => (
            <div key={i} className="profile-stat-tile">
              <div className="profile-stat-val">{s.v}</div>
              <div className="profile-stat-label">{s.l}</div>
            </div>
          ))}
        </div>
        )}

        <div className="divider" />

        {/* Badges */}
        <h3 className="section-title" style={{ marginBottom: "var(--space-3)" }}>Achievement Badges</h3>
        <div className="badge-grid" role="list" aria-label="Achievement badges">
          {ALL_BADGES.map(b => {
            const earned = earnedCodes.has(b.code);
            return (
              <div key={b.code} className={`badge-item${earned ? " earned" : ""}`} role="listitem" title={b.name}>
                <span className="badge-icon" aria-hidden="true" style={{ opacity: earned ? 1 : 0.25 }}>{b.icon}</span>
                <span className="badge-name">{b.name}</span>
              </div>
            );
          })}
        </div>

        {/* Recent picks */}
        {profile.picks.length > 0 && (
          <>
            <div className="divider" />
            <h3 className="section-title" style={{ marginBottom: "var(--space-3)" }}>Recent Picks</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {profile.picks.slice(0, 8).map(p => {
                const m = p.window.match;
                const scored = p.isCorrect !== null;
                return (
                  <div key={p.id} className="pick-history-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.homeSlot.label} vs {m.awaySlot.label}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)" }}>
                        {p.choice} · {p.window.kind.replaceAll("_", " ")}
                      </div>
                    </div>
                    {scored ? (
                      <span className={`pick-result ${p.isCorrect ? "pick-correct" : "pick-wrong"}`}>
                        {p.isCorrect ? `✓ +${p.pointsAwarded}` : "✗ 0"}
                      </span>
                    ) : (
                      <span className="pick-pending">Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="divider" />

        {/* Supporter badge picker */}
        <h3 className="section-title" style={{ marginBottom: "var(--space-3)" }}>My Team</h3>
        <div className="supporter-picker" role="radiogroup" aria-label="Choose your supported team">
          {SUPPORTER_TEAMS.map(t => (
            <button
              key={t}
              role="radio"
              aria-checked={supporterTeam === t}
              className={`supporter-btn${supporterTeam === t ? " selected" : ""}`}
              onClick={() => {
                const next = supporterTeam === t ? "" : t;
                onSupporterChange(next);
                localStorage.setItem("wcc_supporter", next);
              }}
              title={t}
            >
              {flag(t)}
            </button>
          ))}
        </div>
        {supporterTeam && (
          <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "var(--space-2)" }}>
            Supporting: <strong style={{ color: "var(--text-secondary)" }}>{flag(supporterTeam)} {supporterTeam}</strong>
          </p>
        )}

        <div className="divider" />

        {/* Preferences */}
        <h3 className="section-title" style={{ marginBottom: "var(--space-3)" }}>Preferences</h3>
        <div className="pref-row">
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Sound effects</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Play a sound when you lock in a pick</div>
          </div>
          <button
            className={`pref-toggle${soundEnabled ? " on" : ""}`}
            onClick={onSoundToggle}
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle sound effects"
          >
            <span className="pref-toggle-thumb" />
          </button>
        </div>

        <div className="divider" />
        <button
          className="btn-signout"
          onClick={() => { void signOut({ redirectTo: "/" }); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}


/* ─────────────────────── MINI LEADERBOARD ─────────────────────── */
function MiniLeaderboard({
  currentUserId,
  onViewAll,
}: {
  currentUserId?: string;
  onViewAll: () => void;
}) {
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard/global?period=TOURNAMENT&key=wc2026&limit=5")
      .then(r => r.json())
      .then(d => { setRows(d.rows ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Hide the panel entirely while loading (no flash of empty header)
  if (loading) return null;

  // Empty state: show a teaser instead of broken-looking empty list
  if (rows.length === 0) {
    return (
      <div className="mini-lb panel mini-lb-teaser" aria-label="Leaderboard teaser">
        <div className="section-header">
          <h2 className="section-title">🏅 Top Players</h2>
        </div>
        <div className="mini-lb-empty" role="status">
          <span className="mini-lb-empty-icon" aria-hidden="true">🚀</span>
          <div>
            <p className="mini-lb-empty-title">Tournament kicks off Jun 11</p>
            <p className="mini-lb-empty-sub">Make your picks now — be the first name on the leaderboard.</p>
          </div>
          <button className="mini-lb-cta" onClick={onViewAll}>
            Start →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-lb panel" aria-label="Top 5 leaderboard">
      <div className="section-header">
        <h2 className="section-title">🏅 Top Players</h2>
        <button className="section-action" onClick={onViewAll} style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", font: "inherit" }}>
          View all →
        </button>
      </div>
      <div className="mini-lb-rows" role="list">
        {rows.map(u => (
              <article
                key={u.userId}
                className={`lb-row mini-lb-row${u.userId === currentUserId ? " lb-row-me" : ""}`}
                role="listitem"
              >
                <span className={`lb-rank${u.rank <= 3 ? ` top${u.rank}` : ""}`}>
                  {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : u.rank}
                </span>
                <Avatar name={u.name} image={u.image} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lb-name" style={{ fontSize: "0.78rem" }}>{u.name}</div>
                </div>
                {u.streakCurrent > 0 && (
                  <span className="lb-streak" style={{ fontSize: "0.68rem" }}>🔥{u.streakCurrent}</span>
                )}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="lb-pts" style={{ fontSize: "0.82rem" }}>{u.points.toLocaleString()}</div>
                  <div className="lb-pts-label">PTS</div>
                </div>
              </article>
            ))}
      </div>
    </div>
  );
}

/* ─────────────────────── NAV CONFIG ─────────────────────── */
const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: "matches", icon: "⚽", label: "Matches" },
  { id: "predict", icon: "🎯", label: "Predict" },
  { id: "leaderboard", icon: "🏅", label: "Ranks" },
  { id: "profile", icon: "👤", label: "Profile" },
];
/* ═══════════════════════════════════════════════════════
   MAIN PAGE (CLIENT)
═══════════════════════════════════════════════════════ */
export function HomeClient({
  initialMatches = [],
  initialBracket = [],
}: {
  initialMatches?: LiveMatch[];
  initialBracket?: BracketStage[];
}) {
  const [matches, setMatches] = useState<LiveMatch[]>(initialMatches);
  const [bracket, setBracket] = useState<BracketStage[]>(initialBracket);
  const [loading, setLoading] = useState(initialMatches.length === 0);
  const [toast, setToast] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [pickFlash, setPickFlash] = useState(false);
  const [picks, setPicks] = useState(312);
  const [tab, setTab] = useState<Tab>("matches");
  const [bracketDrawer, setBracketDrawer] = useState<{ stage: string; matches: BracketStage["matches"] } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  // Feature 15 — live activity counter
  const [liveViewers, setLiveViewers] = useState(() => 210 + Math.floor(Math.random() * 120));
  // Feature 14 — picks today trend
  const [picksToday, setPicksToday] = useState(() => 38 + Math.floor(Math.random() * 30));
  // Issue 6 — challenge banner (shown when ?ref=X is in URL)
  const [challengeBanner, setChallengeBanner] = useState<{ ref: string; pick?: string } | null>(null);
  // Issue 7 — inline hero email capture
  const [heroEmail, setHeroEmail] = useState("");
  const [heroEmailStatus, setHeroEmailStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const predictPanelRef = useRef<HTMLElement>(null);

  // Feature 16 — theme (SSR-safe: always start "dark", read localStorage after mount)
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  // Feature 17 — supporter badge
  const [supporterTeam, setSupporterTeam] = useState<string>("");
  // Feature 18 — sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // Feature 19 — my picks per match
  const [myPicks, setMyPicks] = useState<Record<string, string>>({});
  // Feature 20 — notification prompt
  const [notifPrompt, setNotifPrompt] = useState(false);
  // Auth: client-side session check via NextAuth /api/auth/session
  const [sessionUserId, setSessionUserId] = useState<string | undefined>(undefined);
  // Issue 9 — real pick distribution (loaded after user submits)
  const [pickDistribution, setPickDistribution] = useState<{ home: number; draw: number; away: number; total: number } | null>(null);
  // Issue 12 — streak for logged-in user
  const [userStreak, setUserStreak] = useState<number>(0);

  // Restore persisted preferences after mount (SSR-safe — no localStorage on server)
  useEffect(() => {
    try {
      const t = localStorage.getItem("wcc_theme") as "dark" | "light" | null;
      if (t) setTheme(t);
      const s = localStorage.getItem("wcc_supporter");
      if (s) setSupporterTeam(s);
      const snd = localStorage.getItem("wcc_sound");
      if (snd !== null) setSoundEnabled(snd !== "false");
    } catch { /* private browsing — ignore */ }

    // Issue 6 — parse ?ref=X&pick=HOME challenge params from URL
    try {
      const sp = new URLSearchParams(window.location.search);
      const ref = sp.get("ref");
      const pick = sp.get("pick") ?? undefined;
      if (ref) setChallengeBanner({ ref, pick });

      // ?predict=matchId — auto-navigate to referenced match
      const predictId = sp.get("predict");
      if (predictId) {
        setTab("predict");
        // activeIdx will be resolved once matches load
        // store in sessionStorage so we can apply once matches arrive
        sessionStorage.setItem("wcc_predict", predictId);
      }
    } catch { /* private browsing */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch NextAuth session on mount, then fetch streak for logged-in users
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => {
        if (d?.user?.id) {
          setSessionUserId(d.user.id);
          // Issue 12 — also load streak from profile
          fetch("/api/profile/me")
            .then(r => r.ok ? r.json() : null)
            .then(p => { if (p?.streakCurrent > 0) setUserStreak(p.streakCurrent); })
            .catch(() => { });
        }
      })
      .catch(() => { });
  }, []);

  const handleSignIn = () => {
    // Redirect to Google OAuth via NextAuth
    void signIn("google", { redirectTo: window.location.href });
  };

  // Feature 15 — fluctuate live viewer count every 12s ±5-18
  useEffect(() => {
    const t = setInterval(() => {
      setLiveViewers(v => Math.max(180, Math.min(420, v + Math.floor(Math.random() * 24) - 9)));
    }, 12000);
    return () => clearInterval(t);
  }, []);

  // Feature 14 — slowly grow picks today counter
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.3) setPicksToday(v => v + 1);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue || emailStatus !== "idle") return;
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      setEmailStatus(res.ok ? "done" : "error");
    } catch {
      setEmailStatus("error");
    }
  };

  const load = useCallback(async (isInitial = false) => {
    // Skip loading spinner on initial refresh if we already have server-side data
    try {
      const [mr, br] = await Promise.all([
        fetch("/api/matches/live", { cache: "no-store" }),
        fetch("/api/matches/bracket", { cache: "no-store" }),
      ]);
      const md = await mr.json();
      const bd = await br.json();
      setMatches(Array.isArray(md) ? md : []);
      setBracket(Array.isArray(bd) ? bd : []);
    } catch {
      if (isInitial) setToast("Could not load data — check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If we have server-side initial data, don't show loading on first client fetch
    load(initialMatches.length === 0);
    const t = setInterval(() => load(false), 30000);
    return () => clearInterval(t);
  }, [load, initialMatches.length]);

  // Resolve ?predict=matchId once matches are available
  useEffect(() => {
    if (matches.length === 0) return;
    try {
      const id = sessionStorage.getItem("wcc_predict");
      if (id) {
        const idx = matches.findIndex(m => m.id === id);
        if (idx >= 0) { setActiveIdx(idx); setTab("predict"); }
        sessionStorage.removeItem("wcc_predict");
      }
    } catch { /* ignore */ }
  }, [matches]);

  const activeMatch = matches[activeIdx] ?? null;
  const openWindow = useMemo(
    () => activeMatch?.windows?.find(w => w.status === "OPEN") ?? null,
    [activeMatch]
  );
  useEffect(() => { setSubmitted(null); setPickDistribution(null); }, [activeIdx]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("wcc_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (tab === "predict") {
      // On mobile: scroll to the predict panel (it's below the match list in single-col layout)
      const isMobile = window.innerWidth < 768;
      if (isMobile && predictPanelRef.current) {
        // Small timeout to let React finish the tab switch render
        setTimeout(() => {
          predictPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      } else {
        predictPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [tab, activeIdx]); // re-scroll when match selection changes too

  const submitPick = async (choice: string) => {
    if (!activeMatch || !openWindow) {
      setToast("No open prediction window for this match yet.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/predictions/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ windowId: openWindow.id, choice, confidence: 3 }),
      });
      const data = await res.json();
      if (!res.ok) { setToast(data?.error ?? "Prediction failed."); return; }
      setSubmitted(choice);
      setPicks(p => p + 1);
      setPickFlash(true);
      setTimeout(() => setPickFlash(false), 900);
      if (soundEnabled) playPickSound();
      if (activeMatch) setMyPicks(p => ({ ...p, [activeMatch.id]: choice }));
      if (!localStorage.getItem("wcc_notif") && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        setTimeout(() => setNotifPrompt(true), 1200);
      }
      setToast("✓ Pick locked in — share your prediction to challenge friends!");
      // Issue 9 — fetch real pick distribution for this window
      if (openWindow) {
        fetch(`/api/picks/distribution?windowId=${openWindow.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setPickDistribution(d); })
          .catch(() => { });
      }
    } catch {
      setToast("Submit failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Feature 24 — keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx(i => Math.min(i + 1, matches.length - 1));
          setTab("predict");
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setActiveIdx(i => Math.max(i - 1, 0));
          setTab("predict");
          break;
        case "h":
        case "H":
          if (tab === "predict" || tab === "matches") {
            e.preventDefault();
            void submitPick("HOME");
          }
          break;
        case "d":
        case "D":
          if (tab === "predict" || tab === "matches") {
            e.preventDefault();
            void submitPick("DRAW");
          }
          break;
        case "a":
        case "A":
          if (tab === "predict" || tab === "matches") {
            e.preventDefault();
            void submitPick("AWAY");
          }
          break;
        case "?":
          setShowHowItWorks(v => !v);
          break;
        case "Escape":
          setBracketDrawer(null);
          setShowHowItWorks(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // submitPick is stable (useCallback not used, but matches+openWindow are captured via closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, tab, submitPick]);

  // KPI calculations
  const nextTs = matches.map(m => new Date(m.kickoffUtc).getTime()).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
  const liveN = matches.filter(m => matchStatus(m.status) === "LIVE").length;
  const finishedN = bracket.reduce((s, g) => s + g.matches.filter(m => m.status === "FINISHED").length, 0);
  const nextLabel = liveN > 0 ? "LIVE" : nextTs ? (countdown(new Date(nextTs).toISOString()) ?? "Soon") : "—";

  // Full bracket always 7 stages
  const bracketMap = Object.fromEntries(bracket.map(b => [b.stage, b]));
  const fullBracket = ALL_STAGES.map(s => bracketMap[s] ?? { stage: s, matches: [] });

  // NAV defined at module level below

  return (
    <>
      <div className="page-wrapper">
        {/* ── Fixed topbar — with desktop nav tabs ── */}
        <header className="topbar" role="banner">
          <a href="/" className="logo" aria-label="WorldCupClutch home">
            WORLD<span className="logo-accent">CUP</span>CLUTCH
          </a>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="topbar-nav" aria-label="Main navigation">
            {NAV.map(n => (
              <button
                key={n.id}
                className={`topbar-nav-btn${tab === n.id ? " active" : ""}`}
                onClick={() => setTab(n.id)}
                aria-current={tab === n.id ? "page" : undefined}
                aria-label={n.label}
              >
                <span className="topbar-nav-icon" aria-hidden="true">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="topbar-right">
            {liveN > 0 && (
              <div className="badge-live" role="status" aria-live="polite" aria-label={`${liveN} match${liveN > 1 ? "es" : ""} live`}>
                <span className="live-dot" aria-hidden="true" />
                {liveN} LIVE
              </div>
            )}
            <div className="badge-pill">WC2026</div>
            <button
              className="theme-toggle"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* ── Countdown banner ── */}
        <CountdownBanner onPickNow={() => { setTab("predict"); }} />

        <main className="page" id="main-content">

          {/* ── Open prediction windows strip ── */}
          {!loading && (
            <OpenWindowsStrip
              matches={matches}
              onPickMatch={(idx) => { setActiveIdx(idx); setTab("predict"); }}
            />
          )}

          {/* ── Notification prompt (Feature 20) ── */}
          {notifPrompt && (
            <div className="notif-prompt" role="alert" aria-live="polite">
              <span className="notif-prompt-icon" aria-hidden="true">🔔</span>
              <div className="notif-prompt-body">
                <strong>Get kickoff reminders</strong>
                <span> — we&apos;ll notify you 30 min before each match.</span>
              </div>
              <button
                className="notif-prompt-yes"
                onClick={async () => {
                  setNotifPrompt(false);
                  localStorage.setItem("wcc_notif", "1");
                  try {
                    const perm = await Notification.requestPermission();
                    setToast(perm === "granted" ? "🔔 Reminders enabled!" : "Notifications blocked — enable in browser settings.");
                  } catch { setToast("Could not request notification permission."); }
                }}
              >
                Enable
              </button>
              <button
                className="notif-prompt-dismiss"
                onClick={() => { setNotifPrompt(false); localStorage.setItem("wcc_notif", "1"); }}
                aria-label="Dismiss notification prompt"
              >✕</button>
            </div>
          )}

          {/* ── Challenge banner (Issue 6) ── */}
          {challengeBanner && (
            <div className="challenge-banner" role="alert">
              <span className="challenge-banner-icon" aria-hidden="true">🏆</span>
              <div className="challenge-banner-body">
                <strong>{challengeBanner.ref}</strong> challenged you!
                {challengeBanner.pick && (
                  <span className="challenge-banner-pick">
                    {" "}Their pick:{" "}
                    <strong>{challengeBanner.pick === "HOME" ? "Home Win" : challengeBanner.pick === "AWAY" ? "Away Win" : "Draw"}</strong>
                    {" "}— can you beat them?
                  </span>
                )}
              </div>
              <button
                className="challenge-banner-pick-btn"
                onClick={() => { setTab("predict"); setChallengeBanner(null); }}
              >
                Make your pick →
              </button>
              <button
                className="challenge-banner-dismiss"
                onClick={() => setChallengeBanner(null)}
                aria-label="Dismiss challenge"
              >✕</button>
            </div>
          )}

          {/* ── Hero ── */}
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-eyebrow" aria-label="FIFA World Cup 2026 — Official Predictor">
              ⚽ FIFA WORLD CUP 2026 · OFFICIAL PREDICTOR
            </div>
            <h1 id="hero-heading">World Cup 2026 Predictions &amp; Match Picks</h1>
            <h2 className="hero-h2">
              PICK THE WINNERS.
              <span className="highlight">BEAT YOUR FRIENDS.</span>
            </h2>
            <p className="hero-sub">
              The ultimate World Cup prediction game. Predict every match, build your streak,
              and climb the global leaderboard across all 104 games.
            </p>
            <button
              className="hero-cta"
              onClick={() => { setTab("predict"); }}
              aria-label="Start predicting matches"
            >
              Start Predicting →
            </button>

            {/* Issue 7 — inline email capture */}
            {heroEmailStatus !== "done" ? (
              <form
                className="hero-email-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!heroEmail || heroEmailStatus !== "idle") return;
                  setHeroEmailStatus("sending");
                  try {
                    const res = await fetch("/api/email/subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: heroEmail }),
                    });
                    setHeroEmailStatus(res.ok ? "done" : "error");
                  } catch { setHeroEmailStatus("error"); }
                }}
                aria-label="Subscribe for match reminders"
              >
                <input
                  type="email"
                  className="hero-email-input"
                  placeholder="your@email.com"
                  value={heroEmail}
                  onChange={e => setHeroEmail(e.target.value)}
                  required
                  aria-label="Email address for match reminders"
                />
                <button
                  type="submit"
                  className="hero-email-btn"
                  disabled={heroEmailStatus === "sending"}
                >
                  {heroEmailStatus === "sending" ? "..." : "Get reminders →"}
                </button>
              </form>
            ) : (
              <p className="hero-email-success">✅ You&apos;re in! We&apos;ll remind you before each match.</p>
            )}
            {heroEmailStatus === "error" && (
              <p className="hero-email-error">Something went wrong — try again.</p>
            )}

            <div className="hero-stats" role="list" aria-label="Tournament statistics">
              <div className="hero-stat" role="listitem">
                <span className="hero-stat-v">104</span>
                <span className="hero-stat-l">Matches</span>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat" role="listitem">
                <span className="hero-stat-v">48</span>
                <span className="hero-stat-l">Teams</span>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat" role="listitem">
                <span className="hero-stat-v">312</span>
                <span className="hero-stat-l">Win Windows</span>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat" role="listitem">
                <span className="hero-stat-v">Jun 11</span>
                <span className="hero-stat-l">Kick-off</span>
              </div>
            </div>
            <div className="how-it-works" aria-label="How it works — 3 steps">
              {([
                { n: "01", title: "Pick", desc: "Home · Draw · Away" },
                { n: "02", title: "Score", desc: "Points on correct calls" },
                { n: "03", title: "Compete", desc: "Global leaderboard" },
              ] as const).map(s => (
                <div key={s.n} className="how-step">
                  <span className="how-step-n">{s.n}</span>
                  <div className="how-step-body">
                    <span className="how-step-title">{s.title}</span>
                    <span className="how-step-desc">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Leaderboard tab ── */}
          {tab === "leaderboard" && <LeaderboardScreen currentUserId={sessionUserId} />}

          {/* ── Profile tab ── */}
          {tab === "profile" && (
            <ProfileScreen
              onSignIn={handleSignIn}
              onStartPicking={() => { setActiveIdx(0); setTab("predict"); }}
              soundEnabled={soundEnabled}
              onSoundToggle={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem("wcc_sound", next ? "true" : "false");
              }}
              supporterTeam={supporterTeam}
              onSupporterChange={setSupporterTeam}
            />
          )}

          {/* ── Matches + Predict tabs ── */}
          {(tab === "matches" || tab === "predict") && (
            <>
            <div className="main-grid">

              {/* LEFT — match feed */}
              <section aria-label="Live and upcoming matches">
                <div className="panel">
                  <div className="section-header">
                    <h2 className="section-title">Live &amp; Upcoming</h2>
                    <span className="section-action" aria-label="Auto-refreshes every 30 seconds">↻ 30s</span>
                  </div>

                  <div className="match-feed" role="list" aria-label="Match list">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => <SkeletonMatchCard key={i} />)
                      : matches.slice(0, 10).map((m, idx) => {
                        const sl = matchStatus(m.status);
                        const cd = sl === "UPCOMING" ? countdown(m.kickoffUtc) : null;
                        const isActive = activeIdx === idx;
                        // Feature 22: pre-match hype when kickoff is within 24h
                        const msTillKickoff = new Date(m.kickoffUtc).getTime() - Date.now();
                        const isHype = sl === "UPCOMING" && msTillKickoff > 0 && msTillKickoff < 86_400_000;
                        const hrsLeft = isHype ? Math.ceil(msTillKickoff / 3_600_000) : 0;
                        return (
                          <article
                            key={m.id}
                            role="listitem"
                            aria-label={`${m.homeSlot?.label} vs ${m.awaySlot?.label}, ${sl}`}
                            aria-selected={isActive}
                          >
                            <button
                              className={[
                                "match-card",
                                isActive ? "is-active" : "",
                                sl === "LIVE" ? "is-live" : "",
                                sl === "FT" ? "is-finished" : "",
                                isHype ? "is-hype" : "",
                              ].filter(Boolean).join(" ")}
                              onClick={() => { setActiveIdx(idx); setTab("predict"); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveIdx(idx); setTab("predict"); }
                              }}
                            >
                              <div className="match-teams">
                                <span className="team-name">
                                  <span className="team-flag" aria-hidden="true">{flag(m.homeSlot?.label ?? "")}</span>
                                  {m.homeSlot?.label ?? "Home"}
                                </span>
                                <span className={`score-box${sl === "LIVE" ? " is-live" : ""}`} aria-label={sl === "UPCOMING" ? "versus" : `Score: ${m.homeScore} to ${m.awayScore}`}>
                                  {sl === "UPCOMING" ? <span className="score-vs">VS</span> : <>{m.homeScore}–{m.awayScore}</>}
                                </span>
                                <span className="team-name away">
                                  {m.awaySlot?.label ?? "Away"}
                                  <span className="team-flag" aria-hidden="true">{flag(m.awaySlot?.label ?? "")}</span>
                                </span>
                              </div>

                              <ProbBar
                                home={m.homeSlot?.label ?? ""}
                                away={m.awaySlot?.label ?? ""}
                                oh={m.oddsHomeWin}
                                od={m.oddsDraw}
                                oa={m.oddsAwayWin}
                              />

                              <div className="match-meta">
                                <span className={`status-chip chip-${sl.toLowerCase()}`} aria-label={`Status: ${sl}`}>{sl}</span>
                                {cd && <span className="countdown-tag" aria-label={`Starts in ${cd}`}>in {cd}</span>}
                                {isHype && (
                                  <span className="hype-tag" aria-label={`Picks close in ${hrsLeft}h`}>
                                    🔥 {hrsLeft}h left
                                  </span>
                                )}
                                <span className="stage-tag" aria-label={`Stage: ${stageLabel(m.stage)}`}>{stageLabel(m.stage)}</span>
                                {myPicks[m.id] && (
                                  <span className="my-pick-chip" aria-label={`Your pick: ${myPicks[m.id]}`}>
                                    ✓ {myPicks[m.id] === "HOME"
                                      ? (m.homeSlot?.label ?? "Home")
                                      : myPicks[m.id] === "AWAY"
                                      ? (m.awaySlot?.label ?? "Away")
                                      : "Draw"}
                                  </span>
                                )}
                                <span className="meta-text">{m.stadium?.city}</span>
                                <span className="meta-text-right">{fmtKickoff(m.kickoffUtc)}</span>
                              </div>
                              {/* Issue 5 — link to individual match page */}
                              <a
                                href={`/match/${matchSlugFor(m.homeSlot?.label ?? "", m.awaySlot?.label ?? "")}`}
                                className="match-page-link"
                                onClick={e => e.stopPropagation()}
                                aria-label={`Match details: ${m.homeSlot?.label} vs ${m.awaySlot?.label}`}
                              >
                                Stats &amp; prediction →
                              </a>
                            </button>
                          </article>
                        );
                      })}
                  </div>

                  {/* KPI strip — Feature 14: live counters + progress */}
                  <div className="kpi-strip" role="list" aria-label="Tournament statistics">
                    {/* Tile 1: Total Picks (live counter) */}
                    <div className="kpi-tile" role="listitem">
                      <div className="kpi-val">
                        <span>{picks.toLocaleString()}</span>
                      </div>
                      <div className="kpi-label">Total Picks</div>
                      <div className="kpi-trend" aria-label={`${picksToday} picks today`}>
                        ↑ {picksToday} today
                      </div>
                    </div>
                    {/* Tile 2: Next kickoff / Live */}
                    <div className="kpi-tile" role="listitem">
                      <div className="kpi-val">
                        {liveN > 0 && <span className="kpi-dot" aria-hidden="true" />}
                        <span style={{ fontSize: nextLabel.length > 5 ? "1.1rem" : undefined }}>{nextLabel}</span>
                      </div>
                      <div className="kpi-label">{liveN > 0 ? "Live Now" : "Next Kickoff"}</div>
                    </div>
                    {/* Tile 3: Played — with mini progress bar */}
                    <div className="kpi-tile" role="listitem">
                      <div className="kpi-val">
                        <span>{finishedN}</span>
                        <span className="kpi-sub">/104</span>
                      </div>
                      <div className="kpi-label">Played</div>
                      <div className="kpi-progress-bar" role="progressbar" aria-valuenow={finishedN} aria-valuemax={104}>
                        <div className="kpi-progress-fill" style={{ width: `${Math.round(finishedN / 104 * 100)}%` }} />
                      </div>
                    </div>
                    {/* Tile 4: Live viewers (Feature 15) */}
                    <div className="kpi-tile" role="listitem">
                      <div className="kpi-val">
                        <span className="kpi-dot kpi-dot-green" aria-hidden="true" />
                        <span style={{ fontSize: "1.1rem" }}>{liveViewers.toLocaleString()}</span>
                      </div>
                      <div className="kpi-label">Predicting now</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT — predict + bracket */}
              <section aria-label="Prediction and bracket" ref={predictPanelRef}>
                {/* Issue 12 — streak banner for signed-in users */}
                {userStreak > 0 && (
                  <div className="streak-banner" role="status" aria-label={`Current streak: ${userStreak} correct picks in a row`}>
                    <span className="streak-banner-fire" aria-hidden="true">🔥</span>
                    <span className="streak-banner-text">
                      Your streak: <strong>{userStreak}</strong> correct in a row
                    </span>
                    <span className="streak-banner-cta">Keep it going!</span>
                  </div>
                )}
                <div className="predict-panel">
                  <div className="section-header" style={{ marginBottom: "var(--space-3)" }}>
                    <h2 className="section-title">Make Your Pick</h2>
                    <div className="row-start">
                      <span className="green-dot" aria-hidden="true" />
                      <span className="text-dim" style={{ fontSize: "0.72rem" }}>Live</span>
                    </div>
                  </div>

                  {/* Match context */}
                  <div className="predict-matchup" aria-live="polite" aria-atomic="true">
                    {activeMatch ? (
                      <>
                        <div className="predict-matchup-teams">
                          {flag(activeMatch.homeSlot?.label ?? "")} {activeMatch.homeSlot?.label}
                          <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "0.9rem", margin: "0 8px" }}>vs</span>
                          {activeMatch.awaySlot?.label} {flag(activeMatch.awaySlot?.label ?? "")}
                        </div>
                        <div className="predict-matchup-meta">
                          {stageLabel(activeMatch.stage)} · Match {activeMatch.matchNumber} · {activeMatch.stadium?.city}
                        </div>
                        <span className={`window-badge ${openWindow ? "window-open" : "window-locked"}`} role="status">
                          {openWindow ? <>🟢 Window open — {openWindow.kind.replaceAll("_", " ")}</> : <>🔒 Locked · opens 24h before kickoff</>}
                        </span>
                      </>
                    ) : (
                      <div style={{ padding: "var(--space-4) 0" }}>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>Select a match</p>
                        <p className="text-dim" style={{ fontSize: "0.82rem" }}>Tap any match from the list to start predicting.</p>
                      </div>
                    )}
                  </div>

                  {/* Pick buttons */}
                  <div className="pick-grid" role="group" aria-label="Prediction choices">
                    {(["HOME", "AWAY", "DRAW"] as const).map(c => (
                      <button
                        key={c}
                        className={`pick-btn${submitted === c ? " selected" : ""}`}
                        onClick={() => submitPick(c)}
                        disabled={!openWindow || submitting}
                        aria-pressed={submitted === c}
                        aria-label={
                          c === "HOME" ? `Pick ${activeMatch?.homeSlot?.label ?? "home team"} to win` :
                            c === "AWAY" ? `Pick ${activeMatch?.awaySlot?.label ?? "away team"} to win` :
                              "Pick a draw"
                        }
                      >
                        {submitted === c && <span className="pick-btn-check" aria-hidden="true">✓</span>}
                        {c === "HOME" && <>
                          <span className="pick-btn-label">{flag(activeMatch?.homeSlot?.label ?? "")} Home Wins</span>
                          {activeMatch && <span className="pick-btn-sub">{activeMatch.homeSlot?.label}</span>}
                        </>}
                        {c === "AWAY" && <>
                          <span className="pick-btn-label">Away Wins {flag(activeMatch?.awaySlot?.label ?? "")}</span>
                          {activeMatch && <span className="pick-btn-sub">{activeMatch.awaySlot?.label}</span>}
                        </>}
                        {c === "DRAW" && <>
                          <span className="pick-btn-label">Draw</span>
                          <span className="pick-btn-sub">90 min</span>
                        </>}
                      </button>
                    ))}
                    {/* 4th button spans full width */}
                    <button
                      className={`pick-btn${submitted ? " selected" : ""}`}
                      disabled
                      aria-hidden="true"
                      style={{ visibility: "hidden" }}
                    />
                  </div>

                  {/* Trending picks — revealed after user submits a pick */}
                  {submitted && activeMatch && (() => {
                    // Use real DB distribution when available, otherwise fall back to odds/strength estimates
                    const useReal = pickDistribution !== null && pickDistribution.total > 0;
                    const total = useReal ? pickDistribution!.total : 0;
                    const p = useReal
                      ? {
                          h: total > 0 ? Math.round(pickDistribution!.home / total * 100) : 33,
                          d: total > 0 ? Math.round(pickDistribution!.draw / total * 100) : 34,
                          a: total > 0 ? Math.round(pickDistribution!.away / total * 100) : 33,
                        }
                      : (() => {
                          const oh = activeMatch.oddsHomeWin, od = activeMatch.oddsDraw, oa = activeMatch.oddsAwayWin;
                          if (oh && od && oa) {
                            const ih = 1 / oh, id = 1 / od, ia = 1 / oa, t = ih + id + ia;
                            return { h: Math.round(ih / t * 100), d: Math.round(id / t * 100), a: Math.round(ia / t * 100) };
                          }
                          const hash = (s: string) => s.split("").reduce((x, c) => x + c.charCodeAt(0), 17);
                          const hl = activeMatch.homeSlot?.label ?? "", al = activeMatch.awaySlot?.label ?? "";
                          const hv = ((hash(hl) % 35) + 28), av = ((hash(al) % 30) + 20), dv = Math.max(8, 100 - hv - av), t = hv + av + dv;
                          return { h: Math.round(hv / t * 100), d: Math.round(dv / t * 100), a: Math.round(av / t * 100) };
                        })();
                    return (
                      <div className="trending-picks" aria-label="Community pick distribution">
                        <div className="tp-header">
                          <span className="tp-title">Community picks</span>
                          <span className="tp-sub">
                            {useReal
                              ? `${total.toLocaleString()} player${total !== 1 ? "s" : ""} picked this match`
                              : "based on market odds"}
                          </span>
                        </div>
                        {([
                          { label: `${flag(activeMatch.homeSlot?.label ?? "")} Home Win`, pct: p.h, choice: "HOME" },
                          { label: "Draw", pct: p.d, choice: "DRAW" },
                          { label: `Away Win ${flag(activeMatch.awaySlot?.label ?? "")}`, pct: p.a, choice: "AWAY" },
                        ] as const).map(row => (
                          <div key={row.choice} className={`tp-row${submitted === row.choice ? " tp-row-mine" : ""}`}>
                            <span className="tp-label">{row.label}</span>
                            <div className="tp-bar-wrap">
                              <div className="tp-bar-fill" style={{ width: `${row.pct}%` }} />
                            </div>
                            <span className="tp-pct">{row.pct}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {submitted && (
                    <div className={`pick-confirm-strip${pickFlash ? " pick-confirm-flash" : ""}`} role="status" aria-live="polite">
                      <span className="pick-confirm-icon">✓</span>
                      <span className="pick-confirm-text">
                        Pick locked in —{" "}
                        <strong>
                          {submitted === "HOME"
                            ? (activeMatch?.homeSlot?.label ?? "Home")
                            : submitted === "AWAY"
                            ? (activeMatch?.awaySlot?.label ?? "Away")
                            : "Draw"}
                        </strong>
                      </span>
                      <span className="pick-confirm-pts">+3 pts</span>
                    </div>
                  )}

                  <button
                    className={`share-btn ${submitted ? "share-btn-active" : "share-btn-inactive"}`}
                    onClick={async () => {
                      if (!submitted || !activeMatch) return;
                      const home = activeMatch.homeSlot?.label ?? "Home";
                      const away = activeMatch.awaySlot?.label ?? "Away";
                      const slug = matchSlugFor(home, away);
                      const pickLabel =
                        submitted === "HOME" ? `${home} to win`
                        : submitted === "AWAY" ? `${away} to win`
                        : "a Draw";
                      // Deep link → match page with pick + optional ref
                      const ref = encodeURIComponent("me"); // swap for real username when auth works
                      const deepUrl = `${SITE}/match/${slug}?ref=${ref}&pick=${submitted}`;
                      const shareText = `⚽ I picked ${pickLabel} — ${home} vs ${away} · WC2026\nCan you beat me? 🏆\n${deepUrl}`;
                      try {
                        // Use Web Share API when available (mobile)
                        if (navigator.share) {
                          await navigator.share({ title: `${home} vs ${away} · My WC Pick`, text: shareText, url: deepUrl });
                        } else {
                          await navigator.clipboard.writeText(shareText);
                          setToast("🔗 Challenge link copied — send it to a friend!");
                        }
                      } catch {
                        setToast(`🔗 ${deepUrl}`);
                      }
                    }}
                    disabled={!submitted}
                    aria-label="Share your prediction and challenge a friend"
                  >
                    🔗 Challenge a Friend
                  </button>

                  {/* Keyboard shortcuts hint — Feature 24 */}
                  <div className="kbd-hints" aria-label="Keyboard shortcuts">
                    <span className="kbd-hint"><kbd>←</kbd><kbd>→</kbd> navigate</span>
                    <span className="kbd-hint"><kbd>H</kbd> home</span>
                    <span className="kbd-hint"><kbd>D</kbd> draw</span>
                    <span className="kbd-hint"><kbd>A</kbd> away</span>
                    <span className="kbd-hint"><kbd>?</kbd> how it works</span>
                  </div>
                </div>

                {/* Bracket */}
                <div className="panel" style={{ marginTop: "var(--space-4)" }}>
                  <div className="section-header">
                    <h2 className="section-title">Tournament Bracket</h2>
                    <span className="section-action">WC2026</span>
                  </div>
                  {loading ? (
                    <div className="bracket-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                      ))}
                    </div>
                  ) : (
                    <div className="bracket-grid" role="list" aria-label="Tournament stages">
                      {fullBracket.map(s => (
                        <BracketTile
                          key={s.stage}
                          stage={s.stage}
                          matches={s.matches}
                          onPress={() => s.matches.length > 0 && setBracketDrawer({ stage: s.stage, matches: s.matches })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Mini leaderboard — always visible on matches/predict tab */}
            <MiniLeaderboard
              currentUserId={sessionUserId}
              onViewAll={() => setTab("leaderboard")}
            />
            </>
          )}
        </main>
      </div>

      {/* Bracket drawer */}
      {bracketDrawer && (
        <div className="bracket-drawer-overlay" role="dialog" aria-modal="true" aria-label={`${stageLabel(bracketDrawer.stage)} matches`} onClick={() => setBracketDrawer(null)}>
          <div className="bracket-drawer" onClick={e => e.stopPropagation()}>
            <div className="bracket-drawer-header">
              <h2 className="bracket-drawer-title">{stageLabel(bracketDrawer.stage)}</h2>
              <button className="bracket-drawer-close" onClick={() => setBracketDrawer(null)} aria-label="Close">✕</button>
            </div>
            <div className="bracket-drawer-list" role="list">
              {bracketDrawer.matches.map(bm => {
                const liveIdx = matches.findIndex(m => m.id === bm.id);
                const sl = bm.status ? matchStatus(bm.status) : "UPCOMING";
                return (
                  <div key={bm.id} className="bracket-drawer-row" role="listitem">
                    <div className="bracket-drawer-teams">
                      <span>{flag(bm.homeSlot?.label ?? "")} {bm.homeSlot?.label ?? "TBD"}</span>
                      <span className="bracket-drawer-vs">vs</span>
                      <span>{bm.awaySlot?.label ?? "TBD"} {flag(bm.awaySlot?.label ?? "")}</span>
                    </div>
                    <span className={`status-chip chip-${sl.toLowerCase()}`}>{sl}</span>
                    {liveIdx >= 0 && (
                      <button
                        className="bracket-drawer-pick"
                        onClick={() => { setActiveIdx(liveIdx); setTab("predict"); setBracketDrawer(null); }}
                      >
                        Predict →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── How it works floating button (Feature 8) ── */}
      <button
        className="hiw-fab"
        onClick={() => setShowHowItWorks(true)}
        aria-label="How it works"
        title="How it works"
      >
        ?
      </button>

      {/* ── How it works modal ── */}
      {showHowItWorks && (
        <div
          className="hiw-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How WorldCupClutch works"
          onClick={(e) => { if (e.target === e.currentTarget) setShowHowItWorks(false); }}
        >
          <div className="hiw-modal">
            <button className="hiw-close" onClick={() => setShowHowItWorks(false)} aria-label="Close">✕</button>
            <h2 className="hiw-title">How it works</h2>
            <p className="hiw-subtitle">World Cup 2026 pick&apos;em in 3 simple steps</p>
            <div className="hiw-steps">
              {([
                { n: "01", icon: "⚽", title: "Pick a match", desc: "Select any upcoming match from the feed. Predict Home win, Draw, or Away win." },
                { n: "02", icon: "🏆", title: "Earn points", desc: "Correct picks earn +3 pts. Streak bonuses multiply your score." },
                { n: "03", icon: "🌍", title: "Climb the table", desc: "Compete on the global leaderboard across all 104 World Cup matches." },
              ] as const).map(s => (
                <div key={s.n} className="hiw-step">
                  <div className="hiw-step-icon">{s.icon}</div>
                  <div className="hiw-step-body">
                    <span className="hiw-step-n">{s.n}</span>
                    <span className="hiw-step-title">{s.title}</span>
                    <p className="hiw-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Email capture (Feature 9) */}
            <div className="hiw-email-section">
              <p className="hiw-email-label">📧 Get match reminders &amp; score updates</p>
              {emailStatus === "done" ? (
                <p className="hiw-email-success">✅ You&apos;re on the list! We&apos;ll remind you before each match.</p>
              ) : (
                <form className="hiw-email-form" onSubmit={handleEmailSubmit}>
                  <input
                    type="email"
                    className="hiw-email-input"
                    placeholder="your@email.com"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    required
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    className="hiw-email-btn"
                    disabled={emailStatus === "sending"}
                  >
                    {emailStatus === "sending" ? "..." : "Remind me"}
                  </button>
                </form>
              )}
              {emailStatus === "error" && (
                <p className="hiw-email-error">Something went wrong. Please try again.</p>
              )}
            </div>

            <button className="hiw-start-btn" onClick={() => { setShowHowItWorks(false); setTab("predict"); }}>
              Start Predicting →
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast" role="alert" aria-live="assertive" onClick={() => setToast("")}>
          {toast}
          <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: "0.8rem" }}>✕</span>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-btn${tab === n.id ? " active" : ""}`}
            onClick={() => setTab(n.id)}
            aria-label={n.label}
            aria-current={tab === n.id ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </>
  );
}