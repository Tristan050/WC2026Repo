"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

function CountdownBanner() {
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
        <div className="cd-unit"><span className="cd-n">{t.days}</span><span className="cd-l">DAYS</span></div>
        <span className="cd-sep">:</span>
        <div className="cd-unit"><span className="cd-n">{p(t.hrs)}</span><span className="cd-l">HRS</span></div>
        <span className="cd-sep">:</span>
        <div className="cd-unit"><span className="cd-n">{p(t.mins)}</span><span className="cd-l">MIN</span></div>
        <span className="cd-sep cd-sep-blink">:</span>
        <div className="cd-unit"><span className="cd-n cd-n-sec">{p(t.secs)}</span><span className="cd-l">SEC</span></div>
      </div>
      <span className="cd-match">🇲🇽 Mexico vs South Africa 🇿🇦 · Azteca</span>
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
function probsFromOdds(h?: number | null, d?: number | null, a?: number | null) {
  if (h && d && a) {
    const ih = 1 / h, id = 1 / d, ia = 1 / a, t = ih + id + ia;
    return { h: Math.round(ih / t * 100), d: Math.round(id / t * 100), a: Math.round(ia / t * 100) };
  }
  const hash = (s: string) => s.split("").reduce((x, c) => x + c.charCodeAt(0), 17);
  return (hl: string, al: string) => {
    const hv = ((hash(hl) % 35) + 28), av = ((hash(al) % 30) + 20), dv = Math.max(8, 100 - hv - av), t = hv + av + dv;
    return { h: Math.round(hv / t * 100), d: Math.round(dv / t * 100), a: Math.round(av / t * 100) };
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

function ProfileScreen({ onSignIn }: { onSignIn: () => void }) {
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

        {/* Stats row */}
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


/* ─────────────────────── NAV CONFIG ─────────────────────── */
const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: "matches", icon: "⚽", label: "Matches" },
  { id: "predict", icon: "🎯", label: "Predict" },
  { id: "leaderboard", icon: "🏅", label: "Ranks" },
  { id: "profile", icon: "👤", label: "Profile" },
];
/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [bracket, setBracket] = useState<BracketStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [picks, setPicks] = useState(312);
  const [tab, setTab] = useState<Tab>("matches");
  // Auth: client-side session check via NextAuth /api/auth/session
  const [sessionUserId, setSessionUserId] = useState<string | undefined>(undefined);

  // Fetch NextAuth session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => { if (d?.user?.id) setSessionUserId(d.user.id); })
      .catch(() => { });
  }, []);

  const handleSignIn = () => {
    // Redirect to Google OAuth via NextAuth
    void signIn("google", { redirectTo: window.location.href });
  };

  const load = useCallback(async () => {
    try {
      await fetch("/api/session", { cache: "no-store" });
      const [mr, br] = await Promise.all([
        fetch("/api/matches/live", { cache: "no-store" }),
        fetch("/api/matches/bracket", { cache: "no-store" }),
      ]);
      const md = await mr.json();
      const bd = await br.json();
      setMatches(Array.isArray(md) ? md : []);
      setBracket(Array.isArray(bd) ? bd : []);
    } catch {
      setToast("Could not load data — check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const activeMatch = matches[activeIdx] ?? null;
  const openWindow = useMemo(
    () => activeMatch?.windows?.find(w => w.status === "OPEN") ?? null,
    [activeMatch]
  );
  useEffect(() => { setSubmitted(null); }, [activeIdx]);

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
      setToast("✓ Pick locked in — share your prediction to challenge friends!");
    } catch {
      setToast("Submit failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          </div>
        </header>

        {/* ── Countdown banner ── */}
        <CountdownBanner />

        <main className="page" id="main-content">

          {/* ── Hero ── */}
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-eyebrow" aria-label="FIFA World Cup 2026 — Official Predictor">
              ⚽ FIFA WORLD CUP 2026 · OFFICIAL PREDICTOR
            </div>
            <h1 id="hero-heading">
              PICK THE WINNERS.
              <span className="highlight">BEAT YOUR FRIENDS.</span>
            </h1>
            <p className="hero-sub">
              The ultimate World Cup prediction game. Predict every match, build your streak,
              and climb the global leaderboard across all 104 games.
            </p>
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
          </section>

          {/* ── Leaderboard tab ── */}
          {tab === "leaderboard" && <LeaderboardScreen currentUserId={sessionUserId} />}

          {/* ── Profile tab ── */}
          {tab === "profile" && <ProfileScreen onSignIn={handleSignIn} />}

          {/* ── Matches + Predict tabs ── */}
          {(tab === "matches" || tab === "predict") && (
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
                              ].filter(Boolean).join(" ")}
                              onClick={() => { setActiveIdx(idx); setTab("predict"); }}
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
                                <span className="meta-text">{m.stadium?.city}</span>
                                <span className="meta-text-right">{fmtKickoff(m.kickoffUtc)}</span>
                              </div>
                            </button>
                          </article>
                        );
                      })}
                  </div>

                  {/* KPI strip */}
                  <div className="kpi-strip" role="list" aria-label="Tournament statistics">
                    {[
                      { v: "104", l: "Matches" },
                      { v: picks.toLocaleString(), l: "Total Picks" },
                      { v: nextLabel, l: liveN > 0 ? "Live Now" : "Next Kickoff", dot: liveN > 0 },
                      { v: `${finishedN}`, sub: "/104", l: "Played" },
                    ].map((k, i) => (
                      <div key={i} className="kpi-tile" role="listitem">
                        <div className="kpi-val">
                          {k.dot && <span className="kpi-dot" aria-hidden="true" />}
                          <span style={{ fontSize: k.v.length > 5 ? "1.1rem" : undefined }}>{k.v}</span>
                          {k.sub && <span className="kpi-sub">{k.sub}</span>}
                        </div>
                        <div className="kpi-label">{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* RIGHT — predict + bracket */}
              <section aria-label="Prediction and bracket">
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

                  <button
                    className={`share-btn ${submitted ? "share-btn-active" : "share-btn-inactive"}`}
                    onClick={() => submitted && setToast("🔗 Challenge link copied! (feature coming soon)")}
                    disabled={!submitted}
                    aria-label="Share your prediction to challenge friends"
                  >
                    🔗 Challenge a Friend
                  </button>
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
                          onPress={() => setToast(`${stageLabel(s.stage)}: ${s.matches.length} fixtures`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

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